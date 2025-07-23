"""
Blog Post model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BlogPost(BaseModel):
    """Blog Post model for managing blog content."""
    
    id: str
    project_id: str
    workflow_run_id: Optional[str] = None
    structure_id: Optional[str] = None
    title: str
    content: Optional[str] = None
    prompt_id: Optional[str] = None
    status: Optional[str] = None  # Draft, Published, Archived, etc.
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    image_urls: Optional[list] = None
    author_id: Optional[str] = None
    blog_meta_data: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    is_active: bool = True
    slug: str  # Unique, URL-friendly identifier for the blog post, generated as slugify(title + '-' + last part of id)
    
    class Config:
        from_attributes = True 