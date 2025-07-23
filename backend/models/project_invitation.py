"""
Pydantic models for Project Invitations.
"""
from pydantic import BaseModel, Field, EmailStr
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from typing import Optional
from .blog_project import BlogProject

# This model is for the request body from the client
class ProjectInvitationRequest(BaseModel):
    project_id: UUID
    email_to: EmailStr
    role: str

# This model is for creating the invitation in the database
class ProjectInvitationCreate(ProjectInvitationRequest):
    invited_by: UUID
    token: str
    expires_at: datetime

class ProjectInvitation(ProjectInvitationCreate):
    id: UUID = Field(default_factory=uuid4)
    status: str = "pending" # pending, accepted, expired
    created_at: datetime = Field(default_factory=datetime.utcnow)
    project: Optional[BlogProject] = None

    class Config:
        from_attributes = True 

class InvitationResponse(BaseModel):
    invitation_link: str

class DeclineInvitationRequest(BaseModel):
    token: str 