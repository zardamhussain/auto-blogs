from fastapi import APIRouter, Depends
from typing import Dict, Any

from backend.dependencies import get_current_user
from backend.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)

@router.post("/google-login")
async def google_login(current_user: User = Depends(get_current_user)):
    """
    Handles Google login. The user's Firebase ID token should be sent
    in the Authorization header as a Bearer token.
    
    The `get_current_user` dependency will validate the token and
    fetch the user's data. If successful, this endpoint will
    return the user's profile.
    """
    return current_user
