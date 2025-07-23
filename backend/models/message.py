from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MessageIn(BaseModel):
    user_id: UUID
    content: str
    chat_id: Optional[UUID] = None

class MessageOut(BaseModel):
    id: UUID
    chat_id: UUID
    user_id: UUID
    sender: str
    content: str
    timestamp: datetime
    json_content: Optional[dict] = None

class ChatOut(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    first_message_content: Optional[str] = None
    first_message_timestamp: Optional[datetime] = None

class Pagination(BaseModel):
    offset: int = Field(0, ge=0)
    limit: int = Field(10, ge=1, le=100)
