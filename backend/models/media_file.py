import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal

class MediaFileBase(BaseModel):
    project_id: uuid.UUID
    path: str
    url: str
    alt_text: Optional[str] = None
    description: Optional[str] = None
    type: Literal["image", "gif", "video"]
    width: Optional[int] = None
    height: Optional[int] = None

class MediaFileCreate(MediaFileBase):
    pass

class MediaFile(MediaFileBase):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    class Config:
        orm_mode = True 