from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Optional, Generator
from uuid import UUID
from pathlib import Path

from .services.gemini_service import GeminiService
from .utils.firebase_service import verify_firebase_token
from .services.base_data_service import BaseDataService
from .services.supabase_service import SupabaseDataService
from .services.flat_file_service import FlatFileService
from .services.workflow_db_service import WorkflowDbService
from .services.sanity_service import SanityService
from .models.user import User, UserCreate
from .utils.cache import multidomain_cache
from .models.project_member import ProjectMember

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google-login")
bearer_scheme = HTTPBearer(auto_error=False)

# --- Data Service Dependency ---
data_service_instance = SupabaseDataService()
sanity_service_instance = SanityService()
gemini_service_instance = GeminiService()
def get_gemini_service() -> GeminiService:
    return gemini_service_instance
def get_data_service() -> BaseDataService:
    return data_service_instance

def get_sanity_service() -> SanityService:
    return sanity_service_instance

def get_workflow_db_service() -> Generator[WorkflowDbService, None, None]:
    yield WorkflowDbService(data_service_instance.supabase)

def get_decoded_token(token = Depends(bearer_scheme)) -> Dict:
    """
    Dependency that verifies the Firebase ID token from the Authorization header
    and returns the decoded token.
    Raises 401 HTTPException if token is invalid.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    decoded_token = verify_firebase_token(token.credentials)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded_token

async def get_current_user(
    decoded_token: Dict = Depends(get_decoded_token),
    db: BaseDataService = Depends(get_data_service)
) -> User:
    """
    Retrieves the current user from the database based on the decoded token.
    If the user does not exist in the database, it creates them.
    """
    email = decoded_token.get("email")
    external_id = decoded_token.get("user_id")

    if not email or not external_id:
        raise HTTPException(status_code=401, detail="Token is missing email or user_id")
    
    hit, val = multidomain_cache.get("users", external_id)
    if hit and isinstance(val, User):
        return val

    name = decoded_token.get("name", "")
    picture = decoded_token.get("picture")
    first_name = name.split(" ")[0] if name else ""
    last_name = " ".join(name.split(" ")[1:]) if name and " " in name else ""

    user_create_data = UserCreate(
        external_id=external_id,
        email=email, 
        first_name=first_name,
        last_name=last_name,
        avatar_url=picture,
        email_verified=decoded_token.get("email_verified", False)
    )

    user = db.fetch_or_create_user(user_create_data)

    if user is None:
        raise HTTPException(status_code=500, detail="Could not fetch or create user in database")
    
    # --- Security Check: Ensure the user is active ---
    if not getattr(user, 'is_active', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    multidomain_cache.add("users", external_id, user)
    
    return user

async def get_current_user_id(current_user: User = Depends(get_current_user)) -> UUID:
    """
    Dependency that returns the UUID of the currently authenticated user.
    """
    return current_user.id

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that checks if the current user is an administrator.
    Raises a 403 Forbidden error if the user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges."
        )
    return current_user

async def get_project_id(x_project_id: str = Header(...)) -> UUID:
    """
    A dependency that extracts and validates the Project ID from the X-Project-ID header.
    Raises an error if the header is missing or the ID is invalid.
    """
    if not x_project_id:
        # This check is somewhat redundant as Header(...) should handle it, but it's good for clarity.
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    try:
        return UUID(x_project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Project ID format")

async def get_current_project_member(
    current_user: User = Depends(get_current_user),
    project_id: UUID = Depends(get_project_id),
    db: BaseDataService = Depends(get_data_service)
) -> ProjectMember:
    """
    Dependency that verifies if the current user is a member of the project specified
    in the X-Project-ID header and returns the member object.
    Raises 403 Forbidden if the user is not a member.
    """
    member = db.get_project_member_by_user_id(project_id=project_id, user_id=current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project or the project does not exist."
        )
    return member