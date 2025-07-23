"""
Supported Language model for the blog generator application.
"""

from typing import Optional
from pydantic import BaseModel


class SupportedLanguage(BaseModel):
    """Supported Language model for managing multilingual support."""
    
    language_code: str
    language_name: str
    native_name: Optional[str] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True 