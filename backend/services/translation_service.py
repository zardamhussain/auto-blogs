import asyncio
import json
import uuid
from typing import List, Dict, Any

from .gemini_service import GeminiService
from .workflow_db_service import WorkflowDbService

class TranslationService:
    """Service responsible for translating blog posts into multiple languages and
    persisting the results in the **blog_post_translations** table.
    """

    def __init__(self):
        self.gemini_service = GeminiService()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _save_translation(
        self,
        db_service: WorkflowDbService,
        project_id: uuid.UUID,
        post_id: uuid.UUID,
        language_code: str,
        translated_content: Dict[str, str],
    ) -> Dict[str, Any]:
        """Saves a single translated post to the database and returns it."""
        record = {
            "project_id": str(project_id),
            "post_id": str(post_id),
            "language_code": language_code,
            "title": translated_content["title"],
            "content": translated_content["body"],
            "status": "draft",
        }
        response = (
            db_service.client.table("blog_post_translations")
            .upsert(record, on_conflict="post_id,language_code")
            .execute()
        )
        if response.data:
            return response.data[0]
        raise RuntimeError("Failed to save translation or retrieve the record from DB.")

    async def _translate_single(
        self,
        blog_post: Dict[str, Any],
        language_code: str,
        db_service: WorkflowDbService,
        project_id: uuid.UUID,
        post_id: uuid.UUID,
        retries: int = 2,
    ) -> Dict[str, Any]:
        """Translate a single blog post, save it, and return the saved record."""

        if not self.gemini_service.model:
            raise RuntimeError("Gemini model not initialized.")

        title = blog_post.get("title", "")
        body = blog_post.get("body") or blog_post.get("content", "")

        # High-quality translation prompt
        prompt = f"""
You are a professional translator with deep expertise in localisation of long-form
technical blog posts. Translate the following Markdown blog post **into
{language_code}**. Strictly follow these rules:

1. Preserve the **Markdown structure** – headings, lists, links, code blocks and
   inline code must remain intact.
2. Do **NOT** touch/modify/translate code snippets or URLs or image links part.
3. Maintain the paragraph breaks and spacing.
4. Do not add explanatory text or commentary.
5. body will have title, description, tags, categories, etc.. everything should be translated except links.
6. Strictly do not modify the entire given body structure. Just translate the content.
Return **ONLY** a JSON structured object with below given exact structure (no markdown fences,
comments or additional keys):
{{
  "title": "<translated title>",
  "body": "<translated body with same structure as the original body>"
}}

--- BEGIN BLOG POST ---
TITLE: {title}

BODY:
{body}
--- END BLOG POST ---
"""

        attempt = 0
        while True:
            try:
                response = await self.gemini_service.call_gemini_with_retry(
                    prompt, expect_json=True
                )
                data = json.loads(response.text)
                # Basic validation
                if "title" in data and "body" in data:
                    # If translation is successful, save it immediately and return the result.
                    saved_record = await self._save_translation(
                        db_service, project_id, post_id, language_code, data
                    )
                    return saved_record
                raise ValueError("Gemini did not return required keys.")
            except Exception as exc:
                if attempt >= retries:
                    raise exc
                attempt += 1
                await asyncio.sleep(2 ** attempt)  # Exponential backoff


    async def translate_and_save(
        self,
        blog_post: Dict[str, Any],
        post_id: uuid.UUID,
        project_id: uuid.UUID,
        languages: List[str],
        db_service: WorkflowDbService,
    ) -> Dict[str, Any]:
        """Translate *blog_post* into each language in *languages* and store the
        results in Supabase via *db_service*.

        The function returns a dictionary summarising successes and failures so
        that upstream workflow nodes can inspect the outcome without raising
        unless **all** translations fail.
        """

        if not languages:
            return {"translations": {}, "errors": {}}

        # Launch "translate and save" tasks concurrently
        tasks = [
            self._translate_single(
                blog_post, lang, db_service, project_id, post_id
            )
            for lang in languages
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        translation_dict = {}
        for lang, result in zip(languages, results):
            if isinstance(result, Exception):
                translation_dict[lang] = {"error": str(result)}
            else:
                # result is the translation data
                translation_dict[lang] = result

        return translation_dict