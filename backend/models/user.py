"""
User model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, computed_field
from uuid import UUID


class UserBase(BaseModel):
    """Base user model for shared properties."""
    external_id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    email_verified: bool = False
    is_admin: bool = False

class UserCreate(UserBase):
    """Model for creating a new user."""
    pass

class User(UserBase):
    """User model representing a user in the database."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    @computed_field
    @property
    def name(self) -> str:
        """Computes the full name of the user."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or "Anonymous"
    
    class Config:
        from_attributes = True