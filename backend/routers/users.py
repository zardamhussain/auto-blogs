from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from uuid import UUID

from ..dependencies import get_current_user, get_data_service
from ..models.user import User
from ..services.base_data_service import BaseDataService
from ..services.user_management_service import UserManagementService, get_user_management_service

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)

class UserPublic(BaseModel):
    id: str
    name: str

@router.get("/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get the profile for the current authenticated user.
    """
    return current_user

@router.patch("/me/", response_model=User)
async def update_current_user(
    user_updates: dict,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Update the current user's profile.
    """
    updated_user = db.update_user(current_user.id, user_updates)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or update failed")
    return updated_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    user_service: UserManagementService = Depends(get_user_management_service)
):
    """
    Deactivates the current user in the database and deletes them from Firebase.
    """
    try:
        user_service.deactivate_and_delete_user(current_user)
    except Exception as e:
        # The service logs the specific error, here we raise a generic server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account deletion."
        )
    return

@router.get("/{user_id}", response_model=UserPublic)
def get_user_info(
    user_id: str,
    data_service: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user) # Ensures endpoint is protected
):
    """
    Get public information for a user by their ID.
    """
    user = data_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
