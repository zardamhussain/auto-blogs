"""
Blog Prompt model for the blog generator application.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ImageStyleGuide(BaseModel):
    """Structured model for image style guidelines."""
    theme_and_mood: Optional[str] = Field(None, description="The overall theme and mood of the images (e.g., Cinematic, moody, atmospheric).")
    composition: Optional[str] = Field(None, description="Guidelines on composition (e.g., Rule of thirds, leading lines).")
    lighting_style: Optional[str] = Field(None, description="The preferred lighting style (e.g., Dramatic, high-contrast, golden hour).")
    color_palette: Optional[str] = Field(None, description="The color palette to be used (e.g., Deep blues, warm oranges, muted earth tones).")
    art_style_influences: Optional[str] = Field(None, description="Artists or styles that are influences (e.g., Cinematography of Roger Deakins, paintings of Edward Hopper).")
    negative_prompt: Optional[str] = Field(None, description="Elements to avoid in the image (e.g., Avoid cartoonish characters, flat lighting).")


class BlogPrompt(BaseModel):
    """Blog Prompt model for managing AI generation prompts."""
    
    id: str
    project_id: str
    name: str
    base_knowledge: Optional[str] = Field(None, description="Product/niche information for content generation")
    writing_style_guide: Optional[str] = Field(None, description="Structure and formatting guidelines")
    image_style: Optional[str] = Field(None, description="Image generation guidelines")
    is_active: bool = True
    created_by: Optional[str] = None
    creator_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 

class BlogPromptCreate(BaseModel):
    """Model for creating a new blog prompt."""
    project_id: str
    name: str
    base_knowledge: Optional[str] = None
    writing_style_guide: Optional[str] = None
    image_style: Optional[str] = None
    creator_name: Optional[str] = None

class BlogPromptUpdate(BaseModel):
    """Model for updating an existing blog prompt."""
    name: Optional[str] = None
    base_knowledge: Optional[str] = None
    writing_style_guide: Optional[str] = None
    image_style: Optional[str] = None
    is_active: Optional[bool] = None 

# --- Pydantic Models ---
class StyleGuideResponse(BaseModel):
    base_knowledge: Optional[str] = None
    writing_style_guide: Optional[str] = None
    image_style: Optional[str] = None

class PromptStatusUpdate(BaseModel):
    is_active: bool
