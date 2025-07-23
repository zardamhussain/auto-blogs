"""
Blog Structure model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BlogStructure(BaseModel):
    """Blog Structure model for managing blog post templates."""
    
    id: str
    project_id: str
    name: str
    markdown_template: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 