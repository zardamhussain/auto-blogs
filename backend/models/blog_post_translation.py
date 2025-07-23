"""
Blog Post Translation model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class BlogPostTranslation(BaseModel):
    """Blog Post Translation model for managing multilingual blog content."""
    
    id: str
    project_id: uuid.UUID
    post_id: str
    language_code: str
    title: str
    content: Optional[str] = None
    status: Optional[str] = None  # Draft, Published, Archived, etc.
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 