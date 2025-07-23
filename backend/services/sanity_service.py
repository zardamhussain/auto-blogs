from __future__ import annotations

"""Utility service for interacting with Sanity Content Lake.

Only two operations are supported for now:
1. create_or_replace_blog_post – upserts a `blogPost` document using a slug.
2. delete_blog_post – soft deletes a post by setting `_type` to `__deleted__` (optional).

The service relies on the following environment variables (already expected in
`docker-compose.yml`):

- SANITY_PROJECT_ID      – Sanity project id (hex string)
- SANITY_DATASET         – Dataset name (e.g. production)
- SANITY_API_VERSION     – API date string (YYYY-MM-DD). Default: 2023-10-24.
- SANITY_AUTH_TOKEN      – *Editor*-role token with write access.

All HTTP operations are performed with httpx.  The client is created once and
re-used (module-level singleton) to avoid connection churn.
"""

import os
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=False)

# ---------------------------------------------------------------------------
# Pydantic schema – maps directly to the fields we write to Sanity
# ---------------------------------------------------------------------------

class Slug(BaseModel):
    current: str
    type: str = Field(alias='_type')

class BlogPostDoc(BaseModel):
    type: str = Field(alias='_type')
    id: str = Field(alias='_id')
    title: str
    slug: Slug
    body: Optional[str] = None
    published_at: Optional[str] = Field(alias='publishedAt', default=None)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    featured_image_url: Optional[str] = Field(alias='featuredImageUrl', default=None)
    locale: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            # If you have custom types, add encoders here
        }

    def to_mutation(self) -> Dict[str, Any]:
        """Return object ready for `createOrReplace` mutation."""
        data = self.model_dump(by_alias=True, exclude_none=True)
        return {"createOrReplace": data}

# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class SanityService:
    def __init__(self) -> None:
        self.project_id = os.getenv("SANITY_PROJECT_ID")
        self.dataset = os.getenv("SANITY_DATASET", "production")
        self.api_version = os.getenv("SANITY_API_VERSION", "2025-02-19")
        self.auth_token = os.getenv("SANITY_AUTH_TOKEN")
        self._is_configured = bool(self.project_id and self.auth_token)

        if not self._is_configured:
            print("Warning: SanityService is not configured. Missing SANITY_PROJECT_ID or SANITY_AUTH_TOKEN.")
            self.endpoint = ""
            self.headers = {}
        else:
            self.endpoint = f"https://{self.project_id}.api.sanity.io/v{self.api_version}/data/mutate/{self.dataset}"
            self.headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json",
            }
        self._client: Optional[httpx.AsyncClient] = None

    def _ensure_configured(self):
        """Raise an error if the service is used without being configured."""
        if not self._is_configured:
            raise ValueError("SanityService is not configured. Please set SANITY_PROJECT_ID and SANITY_AUTH_TOKEN environment variables.")

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    async def create_or_replace_blog_post(
        self,
        *,
        title: str,
        slug: str,
        body_markdown: str,
        description: str | None = None,
        tags: List[str] | None = None,
        categories: List[str] | None = None,
        featured_image_url: str | None = None,
        locale: str = "en",
    ) -> str:
        """Upsert a blog post and return the Sanity document id."""
        self._ensure_configured()
        doc_id = self._generate_doc_id(slug, locale)
        doc = BlogPostDoc(
            _type="blogPost",
            _id=doc_id,
            title=title,
            slug=Slug(_type="slug", current=slug),
            body=body_markdown,
            description=description,
            tags=tags or [],
            categories=categories or [],
            featuredImageUrl=featured_image_url,
            locale=locale,
            publishedAt=datetime.now(timezone.utc).isoformat()
        )
        mutation_body = {"mutations": [doc.to_mutation()]}

        client = await self._get_client()
        resp = await client.post(self.endpoint, json=mutation_body, headers=self.headers, timeout=30)
        resp.raise_for_status()
        result = resp.json()["results"][0]
        return result

    async def close(self):
        """Close underlying httpx client (call on shutdown)."""
        if self._client:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Internal utilities
    # ------------------------------------------------------------------

    async def _get_client(self) -> httpx.AsyncClient:
        if not self._client:
            self._client = httpx.AsyncClient()
        return self._client

    @staticmethod
    def _generate_doc_id(slug: str, locale: str) -> str:
        """Deterministic doc id so future publishes do a createOrReplace."""
        hash_input = f"{locale}:{slug}".encode()
        digest = hashlib.md5(hash_input).hexdigest()
        return f"blogPost-{digest}"  # e.g. blogPost-9c1d5e...

# Singleton instance – similar pattern to SupabaseDataService
sanity_service_instance: Optional[SanityService] = None

def get_sanity_service() -> SanityService:
    global sanity_service_instance
    if not sanity_service_instance:
        sanity_service_instance = SanityService()
    return sanity_service_instance 