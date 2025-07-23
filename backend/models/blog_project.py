"""
Blog Project model for the blog generator application.
"""

from __future__ import annotations
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from enum import Enum

from .project_member import ProjectMember


class BrandInfoStatus(str, Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class BlogProjectBase(BaseModel):
    """Base model for blog project properties."""
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    brand_url: Optional[str] = Field(None, max_length=2048)
    brand_meta_data: Optional[dict] = None
    default_language: Optional[str] = None
    is_active: bool = True


class BlogProjectCreate(BlogProjectBase):
    owner_id: UUID
    pass


class BlogProject(BlogProjectCreate):
    """Model representing a blog project in the database."""
    id: UUID
    role: Optional[str] = None
    brand_content: Optional[str] = None
    brand_images: Optional[List[str]] = None
    brand_info_status: BrandInfoStatus = Field(default=BrandInfoStatus.IDLE)
    brand_meta_data: Optional[dict] = None
    default_prompt_id: Optional[UUID] = None
    members: List[ProjectMember] = []
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 


class BlogProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    brand_url: Optional[str] = Field(None, max_length=2048)
    brand_content: Optional[str] = None
    brand_images: Optional[List[str]] = None
    brand_info_status: Optional[BrandInfoStatus] = None
    brand_meta_data: Optional[dict] = None
    default_prompt_id: Optional[UUID] = None
    default_language: Optional[str] = None
    is_active: Optional[bool] = None 
