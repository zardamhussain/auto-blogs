"""
Service for generating blog posts using various content sources.
"""

import json
import asyncio
from typing import Dict, Any, Optional

# Third-party libraries
from dotenv import load_dotenv

# # Local application imports - to be adjusted based on new project structure
# from backend.models.blog_post import BlogPost, BlogPostCreate
# from backend.utils.prompts import Prompts # Assuming prompts are moved to a utils directory

from .supabase_service import SupabaseDataService
from .reddit_service import RedditService
from .google_search_service import GoogleSearchService
from .gemini_service import GeminiService
from .workflow_db_service import WorkflowDbService
from ..models.workflow import WorkflowRun
from ..utils.cache import multidomain_cache
from ..routers.blog import BLOG_DOMAIN
from uuid import UUID

class BlogGenerationService:
    def __init__(self):
        load_dotenv(dotenv_path="backend/.env")
        # All API clients are now managed in their respective services.
        self.gemini_service = GeminiService()
        self.google_search_service = GoogleSearchService()
        
        # Initialize Reddit Service for dynamic subreddit fetching
        try:
            self.reddit_service = RedditService()
        except ValueError as e:
            print(f"Warning: Could not initialize RedditService: {e}")
            self.reddit_service = None

    async def _get_style_guide(self, prompt_id: str, db_service: WorkflowDbService) -> tuple[Optional[str], Optional[str]]:
        """Fetches the style guide from a prompt, returning writing and image styles."""
        if not prompt_id or not db_service:
            return None, None

        prompt_object = db_service.get_prompt_by_id(prompt_id)
        if not prompt_object:
            # Explicitly return a tuple of Nones if prompt is not found
            return None, None
            
        return prompt_object.writing_style_guide, prompt_object.image_style

    async def _optimize_queries(self, original_query: str) -> Dict[str, str]:
        """Optimizes the user query for different data collection modes."""
        prompt = f'''
         I need to optimize this user query: "{original_query}" for two different blog data collection modes.
        For each mode, I need a specific query that will work best with that mode's approach:
        1. Reddit Blog Mode: Optimized for finding authentic discussions and personal experiences.
           - Only Example: "best budget laptop" → " best laptop under $500 2024"
        2. Web Search Mode: Optimized for finding factual information, expert guides, and recent trends.
           -Only Example: "learn python" → "best free resources to learn python for beginners"
        Return your response as a JSON object with this exact format:
        {{"reddit_query": "optimized query for reddit mode", "web_search_query": "optimized query for web search mode"}}
        '''
        try:
            response = await self.gemini_service.call_gemini_with_retry(prompt, expect_json=True)
            optimized_queries = json.loads(response.text)
            print(f"Optimized queries: {optimized_queries}")
            # Ensure the original query is also returned, consistent with the workflow node
            optimized_queries['query'] = original_query
            return optimized_queries
        except Exception as e:
            print(f"Error optimizing queries: {e}. Falling back to original query.")
            return {"reddit_query": original_query, "web_search_query": original_query, "query": original_query}

    async def _blog_image_placer(self, body: str, image_urls: list) -> str:
        """
        Intelligently places images within the blog body.
        - The first image is always treated as the title image and prepended.
        - Subsequent images are placed contextually using an LLM.
        """
        if not image_urls:
            return body
        
        print(f"==> (blog_image_placer): Placing {image_urls} image(s) in the blog body using heading-based strategy.")

        # Separate title image from body images
        title_image_data = next((img for img in image_urls if img.get("position") == "title"), None)
        body_images_data = [img for img in image_urls if img.get("position") and img.get("position") != "title"]

        modified_body = body
        
        # 1. Prepend the title image if it exists
        if title_image_data:
            alt_text = title_image_data.get('alt_text', 'Blog title image')
            title_image_md = f"![{alt_text}]({title_image_data['url']})"
            modified_body = f"{title_image_md}\n\n{body}"
            print(f"==> (blog_image_placer): Prepended title image.")

        # 2. Place body images based on their 'position' (heading)
        if not body_images_data:
            return modified_body
            
        print(f"==> (blog_image_placer): Placing {len(body_images_data)} body image(s).")
        
        lines = modified_body.split('\n')
        
        # We iterate backwards to avoid messing up line indices as we insert new lines
        for image_data in reversed(body_images_data):
            heading_to_find = image_data.get("position")
            if not heading_to_find:
                continue

            # Find the first line that exactly matches the heading
            try:
                # Find the index of the first line that is an exact match for the heading.
                target_index = -1
                for i, line in enumerate(lines):
                    if line.strip() == heading_to_find.strip():
                        target_index = i
                        break

                if target_index != -1:
                    alt_text = image_data.get('alt_text', f'Blog image for section: {heading_to_find}')
                    image_md_to_insert = f"\n![{alt_text}]({image_data['url']})\n"
                    # Insert the image markdown right after the heading line
                    lines.insert(target_index + 1, image_md_to_insert)
                    print(f"==> (blog_image_placer): Placed image for heading: '{heading_to_find}'")
                else:
                    print(f"==> (blog_image_placer): Could not find heading '{heading_to_find}'. Skipping image.")

            except ValueError:
                # This case handles if the heading isn't found in the list of lines
                print(f"==> (blog_image_placer): Heading '{heading_to_find}' not found in blog body. Skipping.")
                continue

        return "\n".join(lines)


    async def save_blog_post(
        self,
        db_service: WorkflowDbService,
        project_id: UUID,
        author_id: UUID,
        blog_post: dict,
        image_urls: list = None,
        workflow_run_id: Optional[UUID] = None,
        blog_meta_data: Optional[dict] = None,
    ) -> dict:
        """Saves the generated blog post to the database."""
        if not blog_post:
            raise ValueError("Blog post data not provided to save_blog_post node.")
        
        title = blog_post.get('title')
        body = blog_post.get('body', '')
        
        print(f"==> Service: Received blog post titled '{title}' and {len(image_urls or [])} image(s).")

        # Prepend images to the blog body if they exist
        if image_urls and isinstance(image_urls, list):
            body = await self._blog_image_placer(body, image_urls)

        new_blog_post_obj = db_service.save_blog_post(
            project_id=project_id,
            author_id=author_id,
            title=title,
            body=body,
            description=blog_post.get('description', ''),
            tags=blog_post.get('tags', []),
            categories=blog_post.get('categories', []),
            image_urls=image_urls,
            workflow_run_id=workflow_run_id,
            blog_meta_data=blog_post.get('blog_meta_data', None),
        )
        
        if not new_blog_post_obj:
            raise RuntimeError("Failed to save the final blog post to the database.")

        multidomain_cache.invalidate(BLOG_DOMAIN, project_id)
        
        print(f"==> Service: Successfully saved final blog post with ID: {new_blog_post_obj.id}")
        return new_blog_post_obj.model_dump()

    async def _generate_blog_from_knowledge_base(self, knowledge_base: Dict, original_query: str, writing_style_guide: Optional[str] = None) -> Dict:
        """Generates a blog post from the combined knowledge base."""
        # Build the prompt based on available data
        prompt = """I need you to create a comprehensive, high-quality blog post"""
        if original_query:
            prompt += f' on the topic: "{original_query}"'
        prompt += f"""

        You have two sources of information to work with:
        
        1. REDDIT DISCUSSIONS (user experiences and opinions):
        {json.dumps(knowledge_base.get("reddit_data", []), indent=2)}
        
        2. WEB SEARCH RESULTS (factual information and expert advice):
        {json.dumps(knowledge_base.get("web_search_data", {}), indent=2)}
        
        Create a blog post that effectively combines insights from both sources:
        - Use Reddit discussions for personal experiences, testimonials, and real-world results
        - Use web search data for factual information, scientific background, and expert recommendations
        
        The blog should:
        - Have an engaging, SEO-friendly title that captures interest
        - Include a succinct, informative description
        - Be well-structured with proper headings, subheadings, and paragraphs
        - Be written in a conversational yet authoritative tone
        - Include practical advice that readers can implement
        - Be approximately 1500-2000 words in length
        - Include proper citations when referring to specific sources
        Note: the blog should not mention reddit, reddit users, etc.

        **META DATA INSTRUCTIONS**:
         - word_count: The word count of the blog post.
         - reading_time: The reading time of the blog post.
         - meta_description: The meta description of the blog post.
         - tags: The tags of the blog post.
         - categories: The categories of the blog post.
         - reachCount: The estimated potential reach in actual numbers of the blog post like 243, 456, 789, 1.1k etc.
         - effort: The estimated effort out of 100 required to rank on Google for the blog post content. Low is better.
        """
    
        if writing_style_guide:
            prompt += f"""
            \nIMPORTANT: Follow these writing style guidelines:
            ---
            {writing_style_guide}
            ---
            """

        prompt += """
        Return **ONLY** a JSON structured object with below given exact structure.
        IMPORTANT: The "body" of the blog post will be a single JSON string..
        {{
          "title": "The Blog Post Title",
          "description": "A brief 1-2 sentence description of the blog post",
          "tags": ["tag1", "tag2", "tag3", ...],
          "categories": ["category1", "category2", ...],
          "body": "The full body of the blog post with proper markdown formatting.",
          "image_suggestions": ["suggestion1", "suggestion2", ...],
          "blog_meta_data": {{
            "word_count": "The word count of the blog post",
            "reading_time": "The reading time of the blog post",
            "meta_description": "The meta description of the blog post",
            "tags": ["tag1", "tag2", "tag3", ...],
            "categories": ["category1", "category2", ...],
            "reachCount": "Estimated potential reach of the blog post in actual numbers like 243, 456, 789, 1.1k etc.",
            "effort": "How hard it is to rank on Google for that blog post out of 100. Low is better."
            }}
        }}
        """
        try:
            response = await self.gemini_service.call_gemini_with_retry(prompt, expect_json=True)
            blog_post = json.loads(response.text)
            if all(k in blog_post for k in ["title", "description", "tags", "categories", "body"]):
                # add sources to the blog_meta_data using web search data urls and reddit discussion urls
                blog_post["blog_meta_data"]["sources"] =[]
                for web_search_data in knowledge_base.get("web_search_data", []):
                    blog_post["blog_meta_data"]["sources"].append(web_search_data.get("url", ""))
                for reddit_data in knowledge_base.get("reddit_data", []):
                    blog_post["blog_meta_data"]["sources"].append(reddit_data.get("url", ""))
                return blog_post
            raise ValueError("Generated content missing required keys.")
        except Exception as e:
            print(f"Error generating final blog post: {e}")
            return {"error": str(e)}

    async def generate_blog_post(self, query: str, writing_style_prompt_id: Optional[str] = None, db_service: Optional[WorkflowDbService] = None) -> Dict[str, Any]:
        """Main orchestration method."""
        
        writing_style_guide = None
        if writing_style_prompt_id and db_service:
            writing_style_guide, _ = await self._get_style_guide(writing_style_prompt_id, db_service)

        optimized_queries = await self._optimize_queries(query)

        # Create Reddit and Web Search tasks
        reddit_task = asyncio.Future()
        if self.reddit_service:
            reddit_task = asyncio.to_thread(
                self.reddit_service.get_reddit_knowledge_base,
                original_query=query,
                search_query=optimized_queries["reddit_query"]
            )
        else:
            reddit_task.set_result([])
            print("RedditService not available. Skipping Reddit data collection.")

        web_search_task = self.google_search_service.search_and_scrape(web_search_query=optimized_queries["web_search_query"])
        
        # Gather data from all sources
        reddit_data, web_search_data = await asyncio.gather(reddit_task, web_search_task)
        
        knowledge_base = {"reddit_data": reddit_data, "web_search_data": web_search_data}
        return await self._generate_blog_from_knowledge_base(knowledge_base, query, writing_style_guide)

# Example of how the service might be used
if __name__ == '__main__':
    async def main():
        service = BlogGenerationService()
        if service.reddit_service:
            # This example run won't have a db_service, so it won't use a style guide.
            blog_post = await service.generate_blog_post("best routine for acne-prone skin")
            print(json.dumps(blog_post, indent=2))
        else:
            print("Skipping example run due to missing Reddit client initialization failure.")

    asyncio.run(main())