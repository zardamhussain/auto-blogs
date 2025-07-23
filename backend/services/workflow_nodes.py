import uuid
import os
import json
import asyncio
from dotenv import load_dotenv

import google.generativeai as genai

from .reddit_service import RedditService
from .workflow_db_service import WorkflowDbService
from ..models.workflow import WorkflowRun
from ..utils.slugify import slugify
from .blog_image_service import get_blog_image_service
from ..db.constants import gemini_model_type
from .blog_generation_service import BlogGenerationService
from .google_search_service import GoogleSearchService
from .gemini_service import GeminiService
from .translation_service import TranslationService
# --- Service Initialization ---
load_dotenv(dotenv_path="backend/.env")

# The Gemini client is now managed by the GeminiService.
# Global initialization is no longer needed here.
gemini_model = None

# Configure and initialize clients
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY must be set.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel(gemini_model_type)
except ValueError as e:
    print(f"Error initializing Gemini: {e}")
    gemini_model = None

# Tavily and Firecrawl are now initialized in GoogleSearchService
# try:
#     tavily_api_key = os.getenv("TAVILY_API_KEY")
#     tavily_client = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None
# except Exception as e:
#     print(f"Error initializing Tavily: {e}")
#     tavily_client = None

# try:
#     firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
#     firecrawl_app = AsyncFirecrawlApp(api_key=firecrawl_api_key) if firecrawl_api_key else None
# except Exception as e:
#     print(f"Error initializing Firecrawl: {e}")
#     firecrawl_app = None

try:
    reddit_service = RedditService()
except ValueError as e:
    print(f"Warning: Could not initialize RedditService: {e}")
    reddit_service = None

# --- Helper Functions (from BlogGenerationService) ---
# The _call_gemini_with_retry function has been moved to GeminiService.

# ---------------------------------------------------------------------
# Twitter scraping node (placeholder only)
# ---------------------------------------------------------------------

async def twitter_api(tweet_url: str, **kwargs):
    """Placeholder implementation for the Twitter / Threads scraping node.

    The real fetching logic has been temporarily removed. This stub simply
    echoes back the provided URL so downstream nodes can continue to work
    without failing. Replace with a full implementation once the design is
    finalized.
    """

    # NOTE: No network calls are made – this is a no-op placeholder.
    return {
        "platform": None,
        "url": tweet_url,
        "content": None,
        "image_urls": [],
        "urls": [],
    }

# ---------------- internal helpers ----------------

# --- Workflow Node Implementations ---

async def query(query: str, optimize: str = "true"):
    """
    Provides a query, optionally optimizing it by calling the BlogGenerationService.
    """
    if optimize == "true":
        service = BlogGenerationService()
        return await service._optimize_queries(query)
    else: # optimize == "false"
        return {"query": query, "reddit_query": query, "web_search_query": query}


async def reddit_search(query: str = None, reddit_query: str = None):
    """Gets knowledge base from Reddit."""
    if not reddit_service:
        print("RedditService not available. Skipping Reddit data collection.")
        return {"reddit_data": []}
    
    search_query = reddit_query or query
    if not search_query:
        raise ValueError("No query provided to reddit_search node.")

    loop = asyncio.get_event_loop()
    reddit_data = await loop.run_in_executor(
        None,
        reddit_service.get_reddit_knowledge_base,
        query, # The original query
        search_query # The (potentially optimized) search query
    )
    # Only return reddit_data, not query
    return {"reddit_data": reddit_data}


async def google_search(query: str = None, web_search_query: str = None, count: int = 5):
    """Searches the web and scrapes results by calling the GoogleSearchService."""
    service = GoogleSearchService()
    return await service.search_and_scrape(query=query, web_search_query=web_search_query, count=count)


async def blog_generator(reddit_data: dict = None, web_search_data: dict = None, writing_style_guide: str = None, query: str = None):
    """Generates a blog post from the combined knowledge base by calling the BlogGenerationService."""
    # Instantiating the service handles all dependencies.
    service = BlogGenerationService()
    knowledge_base = {
        "reddit_data": reddit_data if reddit_data else [],
        "web_search_data": web_search_data.get("scraped_content", []) if web_search_data else []
    }
    # We call the internal method directly since we already have the knowledge base.
    blog_post = await service._generate_blog_from_knowledge_base(
        knowledge_base=knowledge_base,
        original_query=query,
        writing_style_guide=writing_style_guide
    )

    if "error" in blog_post:
        return blog_post
        
    return {"blog_post": blog_post}


async def _get_image_sizes(prompts: list, sizes: list = None) -> list:
    """
    Determines the optimal sizes for a list of image prompts.
    If sizes are provided, it uses them. Otherwise, it uses an LLM.
    """
    if sizes and len(sizes) >= len(prompts):
        return sizes[:len(prompts)]

    gemini_service = GeminiService()
    if not gemini_service.model:
        print("Warning: Gemini client not initialized. Falling back to default image size.")
        return ["1024x1024"] * len(prompts)

    prompt_list_str = "\\n".join([f"- Prompt {i+1}: {p}" for i, p in enumerate(prompts)])
    prompt = f"""
    You are a visual design assistant. Based on the following DALL-E prompts, recommend the optimal aspect ratio for each image.
    Your choices are: '1024x1024' (square), '1792x1024' (landscape), or '1024x1792' (portrait).

    Analyze the content of each prompt to make your decision. For example, a prompt describing a wide scene should be landscape, while a full-body portrait should be portrait.

    Here are the prompts:
    ---
    {prompt_list_str}
    ---

    Return your response as a JSON object with a single key "sizes", which is a list of strings. The list must have the same number of items as the prompts provided.
    Example format:
    {{
      "sizes": ["1792x1024", "1024x1024", "1024x1792"]
    }}
    """
    try:
        print("==> (_get_image_sizes): Calling Gemini to determine optimal image sizes...")
        response = await gemini_service.call_gemini_with_retry(prompt, expect_json=True)
        data = json.loads(response.text)
        determined_sizes = data.get("sizes", [])
        if len(determined_sizes) == len(prompts):
            print(f"==> (_get_image_sizes): Gemini successfully determined sizes: {determined_sizes}")
            return determined_sizes
        else:
            raise ValueError("LLM did not return the correct number of sizes.")
    except Exception as e:
        print(f"==> (_get_image_sizes): !! Gemini call failed: {e}. Falling back to default size.")
        return ["1024x1024"] * len(prompts)


async def save_blog_post(db_service: WorkflowDbService, project_id: uuid.UUID, workflow_run: WorkflowRun, blog_post: dict = None,image_urls: list = None) -> dict:
    """Saves the generated blog post to the database by calling the BlogGenerationService."""
    service = BlogGenerationService()
    
    author_id = workflow_run.created_by
    if not author_id:
        raise ValueError("Cannot save blog post without an author ID.")

    saved_post = await service.save_blog_post(
        db_service=db_service,
        project_id=project_id,
        author_id=author_id,
        blog_post=blog_post,
        image_urls=image_urls,
        workflow_run_id=workflow_run.id,
        blog_meta_data=blog_post.get('blog_meta_data', None),
    )
    return {"saved_blog_post": saved_post}

async def writing_style_provider(db_service: WorkflowDbService, prompt_id: str = None) -> dict:
    """Fetches the full style guide prompt by calling the BlogGenerationService."""
    if not prompt_id:
        raise ValueError("No prompt_id provided to the Writing Style Guide node.")
    
    print(f"==> Node: Fetching full style guide for prompt ID: {prompt_id} using BlogGenerationService.")
    
    service = BlogGenerationService()
    writing_style, image_style = await service._get_style_guide(prompt_id, db_service)

    if not writing_style and not image_style:
        raise RuntimeError(f"Could not find prompt with ID: {prompt_id}")

    # Return a dictionary with both styles, matching the new output schema
    return {
        "writing_style_guide": writing_style,
        "image_style": image_style
    }

async def generate_image(project_id: int, query: str = None, blog_post: dict = None, image_style: str = None, num_images: int = 1, size: str = "1024x1024", db_service: WorkflowDbService = None, **kwargs) -> dict:
    """
    Generates a relevant title image and body images.
    The title image is generated from the title and style guide.
    Body images are generated from the blog content without the style guide.
    """
    gemini_service = GeminiService()
    title_subject = ""
    # Part 1: Generate Prompts
    if not blog_post or not blog_post.get("title"):
        title_subject = query
    else:
        title_subject = blog_post.get("title")

    title_prompt_template = f"""
    Detailed Image Prompt:

Generate an image with the following elements clearly depicted:
- Central Visual Subject: [Clearly defined main subject/object/person/action of the image based on user's prompt].
- Supporting Visual Elements: [Explicitly describe any secondary elements, background, or environmental details].
- Placement and Proportions: [Clearly specify the arrangement, scale, and position of visual elements within the image].
- Color and Lighting Instructions: [Explicitly state color application, gradients, shadows, highlights, specific lighting setup or mood].
- Typography Integration (if explicitly requested in General Style Prefix): [Clearly detail the placement, style, size, readability, and ensure no small-sized or smudged text is generated].
- Visual Style Consistency: [Reinforce adherence to style, tone, and composition detailed in the General Style Prefix].
- Special Artistic Techniques or Effects: [Clearly describe any specific rendering, textures, artistic styles or effects required].

Ensure each instruction is clear, actionable, and precise, guaranteeing consistent, high-quality, visually accurate results aligned exactly with the intended style and message.

    IMAGE STYLE GUIDE [General Style Prefix]:
    {image_style}
    ---
    TOPIC:
    {title_subject}
    ---

    FINAL, MERGED IMAGE PROMPT:
    

    Generate a JSON object with a single key "title_prompt" containing the single best prompt string.
    Example format:
    {{
      "title_prompt": "A highly detailed and captivating prompt based on the title and style guide."
    }}
    """
    try:
        print("==> Node (GenerateImage): Calling Gemini for title prompt...")
        response = await gemini_service.call_gemini_with_retry(title_prompt_template, expect_json=True)
        title_data = json.loads(response.text)
        title_image_prompt = title_data.get("title_prompt")
        if not title_image_prompt:
             raise ValueError("LLM did not return a valid title_prompt.")
        print("==> Node (GenerateImage): Gemini generated title prompt.")
    except Exception as e:
        print(f"==> Node (GenerateImage): !! Failed to generate title prompt: {e}. Aborting.")
        raise RuntimeError(f"Could not generate title prompt: {e}")

    # 1.2 Generate Body Prompts
    body_image_prompts = []
    if num_images > 1:
        body_subject = ""
        print("does have blog post", blog_post)
        if blog_post:
            print("blog post", blog_post.get("body"))
        else:
            print("no blog post")
        if not blog_post or not blog_post.get("body"):
            # If no body, we can't get headings, so we revert to the old prompt logic for the query.
            body_subject = query
            body_prompt_template = f"""
                You are an expert Image prompt generation assistant.
                Create {num_images-1} unique, and highly descriptive prompts for an image generation model using the given query.
                These images should be contextual and descriptive, directly reflecting the 
            content of the section. Do not use any overarching visual style; focus on the 
            literal content.
                Generate a JSON object with a single key "prompts" which is a list of strings.
                Example format:
                {{
                  "prompts": [
                    "A descriptive prompt about the query.",
                    "Another descriptive prompt about the query."
                  ]
                }}

                TOPIC:
                {body_subject}
                ---
            """
            try:
                print(f"==> Node (GenerateImage): Calling Gemini for {num_images-1} body prompts based on query...")
                response = await gemini_service.call_gemini_with_retry(body_prompt_template, expect_json=True)
                body_data = json.loads(response.text)
                # This path only returns prompts, so we create a simple list of dicts with null positions
                body_image_prompts = [{"prompt": p, "position": None} for p in body_data.get("prompts", [])]
                print(f"==> Node (GenerateImage): Gemini generated {len(body_image_prompts)} body prompts from query.")
            except Exception as e:
                print(f"==> Node (GenerateImage): !! Failed to generate body prompts from query: {e}. Continuing without them.")
                body_image_prompts = []
        else:
            # New logic: Use the blog body to get headings
            body_subject = blog_post.get("body")
            body_prompt_template = f"""
            You are an expert Image Prompt Engineer and Content Analyst.
            Your task is to analyze the following blog post and generate {num_images-1} unique, highly descriptive image prompts for relevant sections.

            **Instructions:**
            1. Read the entire blog post to understand its structure and identify key sections, which are marked by Markdown headings (e.g., '## Heading' or '### Sub-heading').
            2. For each prompt you create, you **MUST** also return the exact, character-for-character heading of the section it belongs to. This includes the leading '##' characters.
            3. The number of prompts you generate should be exactly {num_images-1}.
            4. Focus on creating prompts that are visually descriptive and directly reflect the content of that specific section.

            **Output Format:**
            Return a JSON object with a single key "prompts", which is a list of objects. Each object must have two keys: "prompt" and "position".
            - "prompt": The generated image prompt string.
            - "position": The exact heading string from the blog post.

            **Example JSON Output:**
            {{
              "prompts": [
                {{
                  "prompt": "A detailed, cinematic shot of a data analyst pointing at a glowing chart on a screen.",
                  "position": "## Analyzing the Core Data"
                }},
                {{
                  "prompt": "An abstract illustration showing interconnected nodes representing a neural network.",
                  "position": "### Understanding the Network Architecture"
                }}
              ]
            }}

            **Blog Post Content:**
            ---
            {body_subject}
            ---
            """
            try:
                print(f"==> Node (GenerateImage): Calling Gemini for {num_images-1} body prompts with positions...")
                response = await gemini_service.call_gemini_with_retry(body_prompt_template, expect_json=True)
                body_data = json.loads(response.text)
                body_image_prompts = body_data.get("prompts", [])
                print(f"==> Node (GenerateImage): Gemini generated {len(body_image_prompts)} body prompts with positions.")
            except Exception as e:
                print(f"==> Node (GenerateImage): !! Failed to generate body prompts with positions: {e}. Continuing without them.")
                body_image_prompts = []

    # 1.3 Combine prompts for generation
    # The title prompt is always first and has a "title" position.
    all_prompts_with_positions = [{"prompt": title_image_prompt, "position": "title"}] + body_image_prompts
    print("all_prompts_with_positions", all_prompts_with_positions)
    all_prompts = [item["prompt"] for item in all_prompts_with_positions]

    # 2. Get optimal image sizes
    all_sizes = await _get_image_sizes(all_prompts)

    # 2.2 Generate and Upload
    blog_image_service = get_blog_image_service()
    tasks = []
    for i, prompt in enumerate(all_prompts):
        image_size = all_sizes[i] if i < len(all_sizes) else "1024x1024" # Fallback
        tasks.append(
            blog_image_service.generate_and_upload_image(
                image_prompt=prompt,
                project_id=project_id,
                size=image_size,
                db_service=db_service
            )
        )

    # The order is preserved by asyncio.gather
    image_metadata_list = await asyncio.gather(*tasks)
    print("==> Node (GenerateImage): Image metadata list:", image_metadata_list)
    # Add the position back to the final image metadata
    final_image_list = []
    for i, img_meta in enumerate(image_metadata_list):
        if img_meta and img_meta.get("url"):
            # The position is taken from the original list of prompts
            img_meta["position"] = all_prompts_with_positions[i]["position"]
            final_image_list.append(img_meta)

    if not final_image_list:
        raise RuntimeError("Failed to generate or upload any images.")

    # We need to ensure the title image is first if it exists.
    # The new structure already preserves order, so we can return the list directly.
    return {"image_urls": final_image_list}


async def competitor_analyzer(urls: list, **kwargs):
    insights = {"gaps": ["gap1", "gap2"], "top_keywords": ["kw1", "kw2"]}
    return {"competitor_insights": insights}


async def cta_inserter(mdx_url: str, **kwargs):
    return {"mdx_url": mdx_url, "cta_id": "cta-123", "positions": [5]}

# ---------------------------------------------------------------------
# Translation Node
# ---------------------------------------------------------------------


async def translate_blog(
    db_service: WorkflowDbService,
    project_id: uuid.UUID,
    saved_blog_post: dict = None,
    languages: list = None,
) -> dict:
    """Translates a saved blog post into multiple languages and persists the results."""
    
    print(f"==> Node (TranslateBlog): Starting translation for post in project {project_id}")
    
    if not languages:
        raise ValueError("'languages' list must be provided to TranslateBlog block.")

    if not saved_blog_post or not saved_blog_post.get("id"):
        raise ValueError("TranslateBlog block expects 'saved_blog_post' with an 'id'.")
        
    default_language = "en"
    
    languages_to_translate = [
        lang for lang in languages if lang != default_language
    ]

    if not languages_to_translate:
        print(f"==> Node (TranslateBlog): No languages to translate after filtering default '{default_language}'.")
        return {
            "project_id": str(project_id),
            "post_id": str(saved_blog_post.get("id")),
            "translations": {},
            "errors": {},
        }

    post_id = uuid.UUID(str(saved_blog_post["id"]))
    service = TranslationService()

    print(f"==> Node (TranslateBlog): Translating into {len(languages_to_translate)} languages: {languages_to_translate}")

    translation_result = await service.translate_and_save(
        blog_post=saved_blog_post,
        post_id=post_id,
        project_id=project_id,
        languages=languages_to_translate,
        db_service=db_service,
    )

    translation_result['post_id'] = str(post_id)
    translation_result['project_id'] = str(project_id)
    return translation_result