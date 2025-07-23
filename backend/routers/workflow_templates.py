from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from ..dependencies import get_current_user, get_current_admin_user, get_data_service
from ..models.user import User
from ..models.workflow_template import WorkflowTemplate, WorkflowTemplateCreate, WorkflowTemplateUpdate
from ..services.base_data_service import BaseDataService
from ..utils.cache import multidomain_cache

router = APIRouter(
    prefix="/workflow-templates",
    tags=["Workflow Templates"],
    responses={404: {"description": "Not found"}},
)

TEMPLATE_DOMAIN = "workflow_templates"

@router.post("/", response_model=WorkflowTemplate, status_code=status.HTTP_201_CREATED)
def create_workflow_template(
    template_data: WorkflowTemplateCreate,
    db: BaseDataService = Depends(get_data_service),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Creates a new workflow template. (Admin only)
    """
    template = db.create_workflow_template(template_data, created_by=admin_user.id)
    if not template:
        raise HTTPException(status_code=400, detail="Failed to create workflow template.")
    
    multidomain_cache.invalidate(TEMPLATE_DOMAIN, "_all_") # Invalidate list view
    return template

@router.get("/", response_model=List[WorkflowTemplate])
def get_all_workflow_templates(
    db: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user), # Ensures user is authenticated
):
    """
    Retrieves all workflow templates.
    """
    hit, val = multidomain_cache.get(TEMPLATE_DOMAIN, "_all_")
    if hit:
        return val
    
    templates = db.get_workflow_templates()
    multidomain_cache.add(TEMPLATE_DOMAIN, "_all_", templates)
    return templates

@router.get("/{template_id}", response_model=WorkflowTemplate)
def get_workflow_template(
    template_id: UUID,
    db: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves a specific workflow template by its ID.
    """
    hit, val = multidomain_cache.get(TEMPLATE_DOMAIN, str(template_id))
    if hit:
        return val

    template = db.get_workflow_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found.")
    
    multidomain_cache.add(TEMPLATE_DOMAIN, str(template_id), template)
    return template

@router.put("/{template_id}", response_model=WorkflowTemplate)
def update_workflow_template(
    template_id: UUID,
    template_data: WorkflowTemplateUpdate,
    db: BaseDataService = Depends(get_data_service),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Updates a workflow template. (Admin only)
    """
    template = db.update_workflow_template(template_id, template_data)
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found.")
    
    multidomain_cache.invalidate(TEMPLATE_DOMAIN, "_all_") # Invalidate list view
    multidomain_cache.invalidate(TEMPLATE_DOMAIN, str(template_id)) # Invalidate specific template
    return template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow_template(
    template_id: UUID,
    db: BaseDataService = Depends(get_data_service),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Deletes a workflow template. (Admin only)
    """
    success = db.delete_workflow_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow template not found.")
    
    multidomain_cache.invalidate(TEMPLATE_DOMAIN, "_all_") # Invalidate list view
    multidomain_cache.invalidate(TEMPLATE_DOMAIN, str(template_id)) # Invalidate specific template
    return 