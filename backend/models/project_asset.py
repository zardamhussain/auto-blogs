"""
Project Asset model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectAsset(BaseModel):
    """Project Asset model for managing files associated with blog projects."""
    
    id: str
    blog_id: str
    filename: str
    file_path: str
    uploaded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 