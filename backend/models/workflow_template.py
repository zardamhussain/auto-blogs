"""
WorkflowTemplate model for the blog generator application.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class WorkflowTemplateBase(BaseModel):
    """Base workflow template model for shared properties."""
    name: str
    description: Optional[str] = None
    workflow_definition: Dict[str, Any]  # To store nodes and edges

class WorkflowTemplateCreate(WorkflowTemplateBase):
    """Model for creating a new workflow template."""
    pass

class WorkflowTemplate(WorkflowTemplateBase):
    """WorkflowTemplate model representing a template in the database."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UUID

    class Config:
        from_attributes = True

class WorkflowTemplateUpdate(BaseModel):
    """Model for updating a workflow template."""
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_definition: Optional[Dict[str, Any]] = None 