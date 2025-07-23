"""
Project Member model for the blog generator application.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class ProjectMemberBase(BaseModel):
    """Base model for project member properties."""
    permissions: List[str] = []

class ProjectMemberCreate(ProjectMemberBase):
    """Model for creating a new project member."""
    project_id: UUID
    user_id: UUID
    invited_by: Optional[UUID] = None

class ProjectMember(ProjectMemberBase):
    """Model representing a project member in the database."""
    id: UUID
    project_id: UUID
    user_id: UUID
    invited_by: Optional[UUID] = None
    joined_at: datetime
    removed_at: Optional[datetime] = None
    
    # User details populated from a join
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True 