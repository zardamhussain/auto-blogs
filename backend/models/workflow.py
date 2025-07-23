from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime
import json

__all__ = [
    "WorkflowNode",
    "WorkflowEdge",
    "WorkflowDefinitionCreate",
    "WorkflowDefinitionUpdate",
    "WorkflowDefinition",
    "WorkflowRunCreate",
    "WorkflowRun",
    "NodeRun",
    "NodeRunHistory",
]

# --- React Flow structures ---

class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, Any]
    data: Dict[str, Any]
    class Config:
        extra = "allow"

class WorkflowEdge(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    data: Optional[Dict[str, Any]] = None
    class Config:
        extra = "allow"

# --- Workflow Definition ---

class WorkflowDefinitionBase(BaseModel):
    name: str = Field(..., example="My new blog generation pipeline")
    description: Optional[str] = None
    nodes: List[WorkflowNode] = Field(default_factory=list)
    edges: List[WorkflowEdge] = Field(default_factory=list)
    cron_expr: Optional[str] = Field(None, example="0 0 * * *")
    is_active: bool = True
    is_template: bool = True
    
class WorkflowDefinitionCreate(WorkflowDefinitionBase):
    project_id: UUID

class WorkflowDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None
    cron_expr: Optional[str] = None
    is_active: Optional[bool] = None

class WorkflowDefinition(WorkflowDefinitionBase):
    id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# --- Workflow & Node Runs ---

class WorkflowRunCreate(BaseModel):
    workflow_id: Optional[UUID] = None
    trigger_type: str = Field(..., example="user") # 'user' or 'cron'
    trigger_user_id: Optional[UUID] = None
    status: str = "running"
    created_by: Optional[UUID] = None
    run_definition: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    def check_definition_source(cls, values):
        """Ensure that either workflow_id or a run_definition is provided, but not both."""
        if values.get("workflow_id") is None and values.get("run_definition") is None:
            raise ValueError("Either workflow_id or run_definition must be provided.")
        if values.get("workflow_id") is not None and values.get("run_definition") is not None:
            raise ValueError("Cannot provide both workflow_id and run_definition.")
        return values

class WorkflowRun(WorkflowRunCreate):
    id: UUID = Field(default_factory=uuid4)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    node_runs: List["NodeRun"] = Field(default_factory=list)

    class Config:
        orm_mode = True

class NodeRun(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    workflow_run_id: UUID
    node_id: str
    block_type: str
    status: str
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None

    @field_validator("input", "output", mode="before")
    @classmethod
    def parse_json_string(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                # Let the default validation handle the error for a non-JSON string
                pass
        return value

    class Config:
        orm_mode = True

class NodeRunHistory(BaseModel):
    runs: List[NodeRun]
    total: int 