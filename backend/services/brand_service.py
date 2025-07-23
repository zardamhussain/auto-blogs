import json
import os
import re
import requests
from urllib.parse import urljoin
from firecrawl import AsyncFirecrawlApp
import logging

from ..services.gemini_service import GeminiService
from ..services.base_data_service import BaseDataService
from ..models.blog_project import BlogProjectUpdate, BrandInfoStatus
from google import genai
from google.genai import types
logger = logging.getLogger(__name__)

class BrandService:
    def __init__(self, db_service: BaseDataService):
        self.db_service = db_service
        self.gemini_service = GeminiService()
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.firecrawl_client = AsyncFirecrawlApp(api_key=self.firecrawl_api_key) if self.firecrawl_api_key else None

    def _validate_and_normalize_url(self, url: str) -> str:
        """Validates, follows redirects, and returns the canonical URL."""
        try:
            response = requests.head(url, allow_redirects=True, timeout=10)
            response.raise_for_status()
            return response.url
        except requests.RequestException as e:
            logger.error(f"URL validation failed for {url}: {e}")
            raise ValueError(f"URL is not reachable or invalid: {url}")

    async def _scrape_content(self, url: str) -> str:
        """Scrapes the markdown content from a URL using Firecrawl."""
        try:
            scraped_data = await self.firecrawl_client.scrape_url(url=url, formats=['markdown'],only_main_content=False)
            return scraped_data.markdown
        except Exception as e:
            logger.error(f"Firecrawl scraping failed for {url}: {e}")
            raise RuntimeError(f"Failed to scrape content from URL: {url}")

    async def _refine_with_gemini(self, content: str) -> dict:
        """Uses Gemini to refine the scraped content and extract images."""
        prompt = f"""
Your task is to analyze the following website content (in Markdown or raw HTML form).
From this, generate a comprehensive structured JSON object with detailed brand metadata.
Properly read the entire given website content first before doing anything else.
**Instructions:**

You will extract and organize the following details:

1. **Basic Info**:
   - `url`: The domain or main URL if available
   - `title`: The main site title
   - `meta_description`: A concise description (from metadata or content)
   - `brand_name`: The name of the company or brand

2. **Visual Identity**:
   - `logo_url`: Primary logo image URL (you can find it somewhere in start of the content reffered as logo, logo_image,primary_icon, something.)
   - `favicon_url`: Site icon if available
   - `images`: Up to 5 meaningful image URLs (main banners, product showcases, etc.)

3. **Social Links** (most likely you can find it in the footer of the website, or in the header):
   - `facebook`, `twitter`, `linkedin`, `instagram`, `github`, `discord`, `youtube`, etc.

4. **Navigation**:
   - List of top-level navigation items (label + URL if available)

5. **Contact Info** ( if contact us page is present, you can scrape it and get the contact info):
   - `email`, `phone`, `address`

6. **Content Summary**:
   - A well-structured summary of the brand’s identity, voice, values, and offerings in Markdown

**Instructions for Content Summary:**
        1.  Generate a comprehensive summary that captures the essence of the brand.
        2.  The summary must be in well-structured Markdown format, using headings, lists, and paragraphs as appropriate.
        3.  Focus on creating a clean, readable, text-based summary of the brand.

7. **Products or Services**:
   - A list of product/service cards with: `name`, `description`, and (if available) `price`

8. **Blog or News Posts** (optional):
   - A list of blog article titles and URLs (if any are present)

9. **Technologies Used** (if detectable):
   - Frameworks, platforms, or 3rd-party services (e.g., React, Shopify, Stripe, Cloudflare)

10. **SEO Info**:
   - `canonical_url`
   - `sitemap` URL
   - `robots_txt`: Whether robots.txt is referenced or exists

**Output Format:**
Return a single JSON object using the following keys:
```json
{{
  "url": "https://example.com",
  "title": "Website Title",
  "meta_description": "Short meta description of the website.",
  "brand_name": "Example Brand",

  "logo_url": "https://example.com/path/to/logo.png",
  "favicon_url": "https://example.com/favicon.ico",

  "images": [
    "https://example.com/images/banner1.jpg",
    "https://example.com/images/product1.jpg"
  ],

  "social_links": {{
    "facebook": "https://facebook.com/example",
    "twitter": "https://twitter.com/example",
    "linkedin": "https://linkedin.com/company/example",
    "instagram": "https://instagram.com/example",
    "youtube": "https://youtube.com/example",
    "github": "https://github.com/example",
    "discord": "https://discord.gg/example"
  }},

  "contact_info": {{
    "email": "contact@example.com",
    "phone": "+1-800-123-4567",
    "address": "123 Example Street, City, Country"
  }},

  "navigation": [
    {{ "label": "Home", "url": "/" }},
    {{ "label": "About", "url": "/about" }},
    {{ "label": "Blog", "url": "/blog" }},
    {{ "label": "Contact", "url": "/contact" }}
  ],

  "content": "# Brand Summary\\n\\nThis is a Markdown summary of the brand, its mission, and its offerings.",

  "products_or_services": [
    {{
      "name": "Premium Plan",
      "description": "Includes unlimited access and priority support.",
      "price": "$49/month"
    }},
    {{
      "name": "Free Trial",
      "description": "Try our service free for 7 days.",
      "price": "$0"
    }}
  ],

  "blog_posts": [
    {{
      "title": "5 Tips to Boost Your SEO",
      "url": "/blog/seo-tips"
    }},
    {{
      "title": "How We Built Our Platform",
      "url": "/blog/platform-build"
    }}
  ],

  "technologies": [
    "React", "Node.js", "Cloudflare", "Google Analytics"
  ],

  "seo": {{
    "canonical_url": "https://example.com",
    "sitemap": "https://example.com/sitemap.xml",
    "robots_txt": true
  }}
}}

**Formatting Rules**:
- Only return the raw JSON (no Markdown fences, no comments)
- If a field is not available, include it with a null or empty value.
- Do not infer data not in the content. Only use what’s clearly provided.
- Do not include ```json or ``` in your response.

**Website Content:**
---
{content}
---
    """
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        model = "gemini-2.5-flash"
        try:
            contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
            generate_config = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=-1),
                response_mime_type="application/json",
            )

            # Collect streamed text
            full_response = ""
            for chunk in client.models.generate_content_stream(
                model=model, contents=contents, config=generate_config
            ):
                if chunk.text:
                    full_response += chunk.text

            # Clean any markdown formatting if Gemini adds it
            cleaned = re.sub(r"^```json|```$", "", full_response.strip(), flags=re.MULTILINE)

            try:
                parsed = json.loads(cleaned)
                return parsed
            except json.JSONDecodeError as e:
                print("Failed to parse Gemini JSON:\n", full_response)
                raise e
        except Exception as e:
            contents = [types.Content(role="user", parts=[types.Part.from_text(prompt)])]
            generate_config = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=-1),
                response_mime_type="application/json",
            )

            # Collect streamed text
            full_response = ""
            for chunk in client.models.generate_content_stream(
                model=model, contents=contents, config=generate_config
            ):
                if chunk.text:
                    full_response += chunk.text

            # Clean any markdown formatting if Gemini adds it
            cleaned = re.sub(r"^```json|```$", "", full_response.strip(), flags=re.MULTILINE)

            try:
                parsed = json.loads(cleaned)
                return parsed
            except json.JSONDecodeError as e:
                print("Failed to parse Gemini JSON:\n", full_response)
                raise e

    async def extract_brand_info_from_url(self, url: str) -> dict:
        """
        Scrapes a URL, refines the content with an AI, validates image URLs,
        and returns the brand information as a dictionary.
        This method does NOT interact with the database.
        """
        logger.info(f"Starting brand URL processing for URL: {url}")
        
        canonical_url = self._validate_and_normalize_url(url)
        logger.info(f"Normalized URL to: {canonical_url}")

        markdown_content = await self._scrape_content(canonical_url)
        if not markdown_content:
            raise ValueError("No content was scraped from the URL.")
        logger.info(f"Scraped content successfully from {canonical_url}")

        refined_data = await self._refine_with_gemini(markdown_content)
        refined_content = refined_data.get("content", "")
        image_urls = refined_data.get("images", [])
        logger.info(f"Refined content with Gemini for {canonical_url}")
        logger.info(f"Extracted {len(image_urls)} image URLs: {image_urls}")

        valid_image_urls = self._validate_image_urls(canonical_url, image_urls)
        logger.info(f"Found {len(valid_image_urls)} valid image URLs: {valid_image_urls}")
        
        return {
            "brand_url": canonical_url,
            "brand_content": refined_content,
            "brand_images": valid_image_urls,
            "brand_meta_data":refined_data
        }

    def _validate_image_urls(self, base_url: str, image_urls: list[str]) -> list[str]:
        """Validates that URLs are reachable and are actual images."""
        valid_urls = []
        for image_url in image_urls:
            try:
                # Handle relative URLs
                absolute_url = urljoin(base_url, image_url)

                response = requests.head(absolute_url, allow_redirects=True, timeout=5)
                response.raise_for_status()
                
                content_type = response.headers.get('Content-Type', '')
                if content_type.startswith('image/'):
                    valid_urls.append(absolute_url)
                else:
                    logger.warning(f"URL is not an image: {absolute_url} (Content-Type: {content_type})")

            except requests.RequestException as e:
                logger.warning(f"Image URL validation failed for {image_url}: {e}")
        return valid_urls

    async def process_brand_url(self, project_id: str, url: str):
        """
        The main async method to process the brand URL.
        It validates, scrapes, refines, and saves the brand content.
        """
        update_data = {}
        try:
            brand_info = await self.extract_brand_info_from_url(url)
            update_data = BlogProjectUpdate(
                **brand_info,
                brand_info_status=BrandInfoStatus.COMPLETED
            )
        except Exception as e:
            logger.error(f"Error during brand URL processing for project {project_id}: {e}")
            update_data = BlogProjectUpdate(
                brand_info_status=BrandInfoStatus.FAILED,
                brand_content=f"Processing failed: {str(e)}" # Optionally store error message
            )
        finally:
            # We don't have the user ID here, but the data service should handle it
            # or be adapted if necessary. For now, we assume None is acceptable for system tasks.
            self.db_service.update_project(project_id, update_data.model_dump(exclude_unset=True))
            logger.info(f"Finished brand URL processing for project {project_id}. Status: {update_data.brand_info_status.value}") 