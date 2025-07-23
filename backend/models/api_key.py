"""
Pydantic models for API Keys.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

class ApiKeyBase(BaseModel):
    """Base model for API Key properties."""
    project_id: UUID
    name: Optional[str] = None

class ApiKeyCreate(ApiKeyBase):
    """Model for creating a new API key."""
    user_id: UUID

class ApiKey(ApiKeyBase):
    """Model representing an API key in the database."""
    id: UUID
    key: str # The full, un-hashed key
    key_prefix: str
    user_id: UUID
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# This response model is now the same as the main ApiKey model
NewApiKeyResponse = ApiKey 