from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from pydantic import BaseModel
import secrets
from datetime import datetime, timedelta, timezone
from ..utils.cache import multidomain_cache  

from backend.routers.projects import PROJECT_DOMAIN

from ..models.project_invitation import (
    ProjectInvitation,
    ProjectInvitationCreate,
    ProjectInvitationRequest,
    InvitationResponse,
    DeclineInvitationRequest
)
from ..services.base_data_service import BaseDataService
from ..dependencies import get_data_service, get_current_user_id, get_current_user
from ..services.supabase_service import MemberAlreadyExistsError
from ..models.user import User

router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"]
)

# -----------------------------------------------
# Creates a new invitation for a user to join a project
# Returns a unique invitation link that can be sent to the user
# -----------------------------------------------
@router.post("/", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation_endpoint(
    request_data: ProjectInvitationRequest,
    service: BaseDataService = Depends(get_data_service),
    current_user_id: UUID = Depends(get_current_user_id)
):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation_create_data = ProjectInvitationCreate(
        **request_data.model_dump(),
        invited_by=current_user_id,
        token=token,
        expires_at=expires_at
    )

    try:
        invitation = service.create_invitation(invitation_create_data)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create invitation."
            )
        
        # Builds a clickable invitation link
        base_url = "http://localhost:3100"  # Typically comes from config
        invitation_link = f"{base_url}/accept-invitation/{invitation.token}"
        
        return InvitationResponse(invitation_link=invitation_link)
    except MemberAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")

# -----------------------------------------------
# Fetches all pending invitations for the current user (by email)
# Useful to show on user dashboard after login — "You have been invited to these projects"
# -----------------------------------------------


@router.get("/pending", response_model=List[ProjectInvitation])
def get_pending_invitations_for_user(
    
    service: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user)
):
    try:
        invitations = service.get_invitations_for_user_email(current_user.email)
        return invitations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching invitations."
        )

# -----------------------------------------------
# Fetches invitation details using the token (used in public invite links)
# This helps verify if the invitation is valid and still pending
# -----------------------------------------------

@router.get("/{token}", response_model=ProjectInvitation)
def get_invitation_details_by_token(
    token: str,
    service: BaseDataService = Depends(get_data_service),
):
    """
    Retrieves invitation details by token. This is a public endpoint.
    """
    invitation = service.get_invitation_by_token(token)
    if not invitation or invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found, has expired, or has already been used."
        )
    return invitation


# -----------------------------------------------
# Allows an authenticated user to accept a project invitation using the invitation ID
# Used when the user is logged in and accepts via the internal UI
# -----------------------------------------------
@router.post("/{invitation_id}/accept", status_code=status.HTTP_200_OK)
def accept_invitation_by_id_endpoint(
    invitation_id: UUID,
    service: BaseDataService = Depends(get_data_service),
    current_user_id: UUID = Depends(get_current_user_id)
):
    new_member = service.accept_invitation_by_id(invitation_id, current_user_id)
    if not new_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found, has expired, or could not be processed."
        )
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user_id)
    return {"message": "Invitation accepted successfully.", "member_details": new_member}

# -----------------------------------------------
# Rejects (declines) a project invitation using invitation ID
# This is used from the internal logged-in UI
# -----------------------------------------------
@router.post("/{invitation_id}/reject", status_code=status.HTTP_200_OK)
def reject_invitation_by_id_endpoint(
    invitation_id: UUID,
    service: BaseDataService = Depends(get_data_service),
    current_user_id: UUID = Depends(get_current_user_id)
):
    success = service.reject_invitation_by_id(invitation_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or could not be rejected."
        )
    return {"message": "Invitation rejected successfully."}

# -----------------------------------------------
# Accepts a project invitation using a token (clicked from email or shared link)
# Requires user to be authenticated
# -----------------------------------------------
@router.post("/accept/{token}", status_code=status.HTTP_200_OK)
def accept_invitation_endpoint(
    token: str,
    service: BaseDataService = Depends(get_data_service),
    current_user_id: UUID = Depends(get_current_user_id)
):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token is required."
        )
    new_member = service.accept_invitation(token, current_user_id)
    if not new_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found, has expired, or could not be processed."
        )
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user_id)
    return {"message": "Invitation accepted successfully.", "member_details": new_member}

# -----------------------------------------------
# Declines an invitation using the token
# Usually used when the user clicks "Decline" in the email invite
# -----------------------------------------------
@router.post("/decline/{token}", status_code=status.HTTP_200_OK)
def decline_invitation_endpoint(
    token: str,
    service: BaseDataService = Depends(get_data_service)
):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token is required."
        )
        
    success = service.decline_invitation(token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or could not be declined."
        )
    return {"message": "Invitation declined successfully."}

# -----------------------------------------------
# Allows project admins to fetch all invitations sent for a project
# Useful for showing "who is invited" inside the project settings
# -----------------------------------------------
@router.get("/projects/{project_id}/invitations", response_model=List[ProjectInvitation])
def get_project_invitations_endpoint(
    project_id: UUID,
    service: BaseDataService = Depends(get_data_service),
    current_user_id: UUID = Depends(get_current_user_id)
):
    # Check if current user is an admin in this project
    project_member = service.get_project_member_by_user_id(project_id, current_user_id)
    if not project_member or "admin" not in project_member.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view invitations for this project."
        )
    
    return service.get_project_invitations(project_id)

