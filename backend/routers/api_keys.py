import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID

from ..dependencies import get_data_service, get_current_user, get_project_id
from ..services.base_data_service import BaseDataService
from ..models.user import User
from ..models.api_key import ApiKey, ApiKeyCreate, NewApiKeyResponse
from ..utils.cache import multidomain_cache

router = APIRouter(
    prefix="/api-keys",
    tags=["api-keys"],
    dependencies=[Depends(get_current_user)]
)

class ApiKeyCreateRequest(BaseModel):
    name: Optional[str] = None

API_KEY_DOMAN = "api_keys"

@router.get("/", response_model=List[ApiKey])
def get_api_keys(
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Retrieve all API keys for the authenticated user.
    """

    hit, val = multidomain_cache.get(API_KEY_DOMAN, current_user.id)
    if hit:
        return val

    keys = db.get_api_keys_by_user_id(current_user.id)

    multidomain_cache.add(API_KEY_DOMAN, current_user.id, keys)
    return keys if keys is not None else []
    
@router.post("/", response_model=NewApiKeyResponse, status_code=201)
def generate_api_key(
    project_id: UUID = Depends(get_project_id),
    request: Optional[ApiKeyCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Generate a new API key for the authenticated user, associated with the
    project specified in the X-Project-ID header.
    The full key is returned only once in this response.
    """
    name = request.name if request else None
        
    key_create = ApiKeyCreate(
        user_id=current_user.id,
        project_id=project_id,
        name=name
    )
    created_key = db.create_api_key(key_create)
    if not created_key:
        raise HTTPException(status_code=500, detail="Could not create API key")
    
    multidomain_cache.update_value(API_KEY_DOMAN, current_user.id, created_key)
    return created_key

@router.delete("/{key_id}", status_code=204)
def delete_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Delete an API key for the authenticated user.
    """
    success = db.delete_api_key(current_user.id, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API Key not found or user does not have permission to delete it")
    
    multidomain_cache.invalidate(API_KEY_DOMAN, current_user.id)
    return 