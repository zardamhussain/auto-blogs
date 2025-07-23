import asyncio
from fastapi import APIRouter, Depends, HTTPException, Response, status, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List
from uuid import UUID
import secrets
from datetime import datetime, timedelta, timezone
from fastapi.responses import JSONResponse

from ..dependencies import get_current_user, get_data_service
from ..services.base_data_service import BaseDataService
from ..services.brand_service import BrandService
from ..models.blog_project import BlogProject, BlogProjectCreate, BlogProjectUpdate, BrandInfoStatus
from ..models.user import User
from ..models.project_invitation import ProjectInvitation, ProjectInvitationCreate, InvitationResponse
from ..utils.cache import multidomain_cache
from ..dependencies import get_current_project_member
from ..models.project_member import ProjectMember
from ..models.blog_prompt import BlogPrompt, BlogPromptCreate, BlogPromptUpdate, StyleGuideResponse
from ..services.prompt_service import PromptService

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
    # dependencies=[Depends(get_current_user)] # Apply auth to all routes
)

class ProjectCreateRequest(BaseModel):
    name: str
    description: str | None = None


PROJECT_DOMAIN = "projects"

def get_role_from_permissions(permissions: List[str]) -> str:
    # This is a more robust check for owner permissions.
    if "delete" in permissions and "admin" in permissions:
        return "owner"
    elif "write" in permissions:
        return "admin"
    return "viewer"

@router.post("/", response_model=BlogProject, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Creates a new project for the current user.
    The user who creates the project is automatically assigned as the owner.
    """
    created_project = db.create_project(
        name=project_data.name,
        description=project_data.description,
        owner_id=str(current_user.id)
    )
    
    if created_project is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project in the database."
        )

    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user.id)
    return created_project

@router.get("/", response_model=List[BlogProject])

def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Retrieves all projects the current user is a member of.
    The user's role in each project is also determined and included.
    """
    try:
        projects_data = None
        hit, val = multidomain_cache.get(PROJECT_DOMAIN, current_user.id)
        if hit and val is not None:
            projects_data = val
        else:
            db_projects = db.get_projects_for_user(user_id=current_user.id)
            validated_projects = []
            for p in db_projects:
                try:
                    validated_projects.append(BlogProject.model_validate(p))
                except Exception as e:
                    print(f"Could not validate project, skipping. Error: {e}, Project data: {p}")

            # We need to convert pydantic models to dicts for caching
            projects_data = [p.model_dump(mode='json') for p in validated_projects]
            multidomain_cache.add(PROJECT_DOMAIN, current_user.id, projects_data)

        # Now, process the data to add roles and convert back to BlogProject models
        user_projects = []
        for p_data in projects_data:
            project = BlogProject.model_validate(p_data)
            project.role = "viewer"  # Default role
            for member in project.members:
                if member.user_id == current_user.id:
                    project.role = get_role_from_permissions(member.permissions)
                    break
            user_projects.append(project)
        
        return user_projects
    except Exception as e:
        # logger.error(f"Error fetching projects for user {current_user.id}: {e}") # Assuming logger is defined elsewhere
        raise HTTPException(status_code=500, detail="An error occurred while fetching projects.")


@router.get("/{project_id}", response_model=BlogProject)
def get_project(
    project_id: UUID,
    # current_user: User = Depends(get_current_user), # Temporarily removed for debugging
    db: BaseDataService = Depends(get_data_service)
):
    """
    Retrieves a single project by its ID.
    """
    print(f"--- BACKEND: Received request for project ID: {project_id} ---")
    hit, val = multidomain_cache.get(PROJECT_DOMAIN, f"proj_{project_id}")
    if hit and val is not None:
        project = val
        return project


    project = db.get_project_by_id(project_id=project_id)
    if not project:
        print(f"--- BACKEND: Project ID {project_id} NOT FOUND in database. ---")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # TODO: invalidate this when new post is added or deleted or updated
    multidomain_cache.add(PROJECT_DOMAIN, f"proj_{project_id}", project)
    
    # --- Temporarily disabling auth check for debugging ---
    # Check if the current user is a member of the project.
    # user_projects = db.get_projects_for_user(user_id=current_user.id)
    # project_ids = [p.id for p in user_projects]

    # if project_id not in project_ids:
    #     print(f"--- BACKEND: User {current_user.id} is NOT authorized for project {project_id}. ---")
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    # --- End of disabled auth check ---

    print(f"--- BACKEND: Successfully found and returning project {project_id}. ---")
    print(f"--- BACKEND: Project: {project} ---")
    return project

    
class InvitationRequest(BaseModel):
    email_to: str
    role: str

@router.post("/{project_id}/invitations", response_model=InvitationResponse)
def create_invitation_for_project(
    project_id: UUID,
    invitation_data: InvitationRequest,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
    project_member: ProjectMember = Depends(get_current_project_member)
):
    try:
        # Step 1: Check if the user is already a member
        member = db.get_project_member_by_email(project_id=project_id, email=invitation_data.email_to)
        if member:
            raise HTTPException(status_code=409, detail="User is already a member of this project.")
        
        # ✅ Step 2: Check for existing pending invitations
        existing_invites = db.get_project_invitations(project_id)
        email_matches = [
            i for i in existing_invites 
            if i.email_to.lower() == invitation_data.email_to.lower() and i.status == "pending"
        ]

        if email_matches:
            raise HTTPException(
                status_code=409,
                detail="An invitation has already been sent to this email and is still pending."
            )

        # Step 3: Create invitation
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        invitation_create = ProjectInvitationCreate(
            project_id=project_id,
            email_to=invitation_data.email_to,
            role=invitation_data.role,
            invited_by=current_user.id,
            token=token,
            expires_at=expires_at
        )
        invitation = db.create_invitation(invitation_create)
        if not invitation:
            raise HTTPException(status_code=500, detail="Database failed to create invitation record.")
        
        # Step 4: Create frontend invitation link
        base_url = "http://localhost:3100" 
        invitation_link = f"{base_url}/accept-invitation/{invitation.token}"
        
        return InvitationResponse(invitation_link=invitation_link)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/{project_id}/members")
def get_project_members(
    project_id: UUID,
    db: BaseDataService = Depends(get_data_service),
    project_member: ProjectMember = Depends(get_current_project_member)
):
    """
    Retrieves all members and pending invitations for a specific project.
    """
    members = db.get_project_members(project_id=project_id) or []
    invitations = db.get_project_invitations(project_id=project_id) or []

    active_member_emails = {m['email'] for m in members}

    pending_invitations = [
        {
            "id": str(inv.id),
            "email": inv.email_to,
            "role": inv.role,
            "status": "pending"
        } 
        for inv in invitations if inv.email_to not in active_member_emails
    ]

    for member in members:
        member['status'] = 'active'

    return members + pending_invitations

class MemberUpdateRequest(BaseModel):
    role: str

@router.put("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_project_member_role(
    project_id: UUID,
    member_id: UUID,
    update_data: MemberUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
    project_member: ProjectMember = Depends(get_current_project_member)
):
    """
    Updates the role of a member or a pending invitation in a project.
    """
    # First, try to update as if it's an active member
    member_updated = db.update_member_role(project_id=project_id, member_id=member_id, role=update_data.role,current_user_id=current_user.id)

    if member_updated:
        # After a successful role update, invalidate the cache for the affected user.
        # We need to fetch the member's details to get their user_id.
        member_details = db.get_project_member_by_id(member_id=member_id)
        if member_details:
            multidomain_cache.invalidate(PROJECT_DOMAIN, member_details.user_id)
    
    # If not found or failed, try to update as if it's a pending invitation
    if not member_updated:
        invitation_updated = db.update_invitation_role(project_id=project_id, invitation_id=member_id, role=update_data.role, current_user_id=current_user.id)
        if not invitation_updated:
            raise HTTPException(status_code=404, detail="Member or invitation not found or failed to update.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{project_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Allows the current authenticated user to leave a project.
    The project owner cannot leave the project.
    """
    # Attempt to leave the project
    success = db.leave_project(project_id=project_id, user_id=current_user.id)
    
    if not success:
        # We need to give a more specific error if the user is the owner.
        project = db.get_project_by_id(project_id)
        if project and project.owner_id == current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Project owner cannot leave the project. Please transfer ownership first."
            )
        # For other failures (e.g., project not found, not a member), return a generic error.
        raise HTTPException(
            status_code=404, 
            detail="Could not leave project. You might not be a member or the project does not exist."
        )
    
    # Invalidate the cache for the user's projects list on successful leave
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user.id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
    project_member: ProjectMember = Depends(get_current_project_member)
):
    """
    Removes a member or a pending invitation from a project.
    """
    # First, try to remove as an active project member
    member_removed = db.remove_member_from_project(
        project_id=project_id, 
        member_id=member_id, 
        current_user_id=current_user.id
    )

    # If not found or failed, try to delete as a pending invitation
    if not member_removed:
        invitation_deleted = db.delete_invitation(
            project_id=project_id, 
            invitation_id=member_id, 
            current_user_id=current_user.id
        )
        if not invitation_deleted:
            raise HTTPException(status_code=404, detail="Member or invitation not found in this project.")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
):
    """
    Deletes a project. Only the project owner can perform this action.
    """
    success = db.delete_project(project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found or user is not the owner.")
    
    # Invalidate cache
    multidomain_cache.invalidate("projects", current_user.id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put("/{project_id}", response_model=BlogProject)
def update_project(
    project_id: UUID,
    update_data: BlogProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service)
):
    """
    Updates any fields of a project. Only provided fields are updated.
    """
    project = db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if str(project.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this project.")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    updated = db.update_project(project_id, update_dict)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update project.")
        
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user.id)
    return db.get_project_by_id(project_id)

async def process_brand_and_generate_guide_task(
    project_id: str,
    brand_url: str,
    db: BaseDataService,
    brand_service: BrandService,
    prompt_service: PromptService,
    user: User
):
    try:
        # Step 1: Extract brand info
        brand_info = await brand_service.extract_brand_info_from_url(brand_url)
        
        # Step 2: Save brand info to the project
        update_data = BlogProjectUpdate(**brand_info)
        db.update_project(project_id, update_data.model_dump(exclude_unset=True))
        
        # Step 3: Generate style guide using the saved brand context
        style_guide = await prompt_service.generate_style_guide(
            project_id=project_id,
            use_brand_context=True,
            base_knowledge_prompt="Generate based on brand context.",
            writing_style_prompt="Generate based on brand context.",
            image_style_suggestion="Generate based on brand context and images.",
            inspiration_images=[],
            negative_images=[],
            existing_base_knowledge=None,
            existing_writing_style=None,
            existing_image_style=None
        )
        
        # Step 4: Save the generated style guide
        prompt_create = BlogPromptCreate(
            project_id=project_id,
            name="Generated Style Guide",
            base_knowledge=style_guide.base_knowledge,
            writing_style_guide=style_guide.writing_style_guide,
            image_style=style_guide.image_style,
            is_default=True # Assuming this should be the new default
        )
        new_prompt = db.create_prompt(prompt_create,user.id, (f"{user.first_name}" if user.first_name else "") + (f" {user.last_name}" if user.last_name else ""))
        if not new_prompt:
            raise Exception("Failed to create prompt in the database.")
        
        # Step 5: Mark the process as completed and save the new prompt ID
        final_status_update = BlogProjectUpdate(
            brand_info_status=BrandInfoStatus.COMPLETED,
            default_prompt_id=str(new_prompt.id)
        )
        print("final_status_update before", final_status_update)

        db.update_project(project_id, final_status_update.model_dump(exclude_unset=True))
        print("final_status_update", final_status_update)

    except Exception as e:
        print("Error in background task for project", project_id, e)
        # logger.error(f"Error in background task for project {project_id}: {e}")
        # Mark as failed
        fail_update = BlogProjectUpdate(
            brand_info_status=BrandInfoStatus.FAILED,
            brand_content=f"Processing failed: {str(e)}"
        )
        db.update_project(project_id, fail_update.model_dump(exclude_unset=True))

class BrandURLPayload(BaseModel):
    brand_url: str

@router.post("/{project_id}/brand-fetch-and-generate-guide", status_code=status.HTTP_202_ACCEPTED)
async def fetch_brand_and_generate_guide(
    project_id: UUID,
    payload: BrandURLPayload,
    background_tasks: BackgroundTasks,
    db: BaseDataService = Depends(get_data_service),
   
    current_user: User = Depends(get_current_user)
):
    # Permission check can be added here
    project = db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # 1. Set status to PROCESSING
    processing_update = BlogProjectUpdate(brand_info_status=BrandInfoStatus.PROCESSING, brand_url=payload.brand_url)
    db.update_project(project_id, processing_update.model_dump(exclude_unset=True))
    
    # Invalidate cache to show processing status immediately
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user.id)

    # 2. Add the long-running job to background tasks
    brand_service = BrandService(db)
    background_tasks.add_task(
        process_brand_and_generate_guide_task,
        project_id=str(project_id),
        brand_url=payload.brand_url,
        db=db,
        brand_service=brand_service,
        prompt_service=PromptService(),
        user=current_user
    )
    
    return {"message": "Brand processing and style guide generation started."}


# TODO: Re-implement delete, invite, and member management endpoints
# using UUIDs for project_id and user_id. 



@router.patch("/{project_id}/brand-url", response_model=BlogProject)
async def update_brand_url_and_process(
    project_id: str,
    payload: BrandURLPayload,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user),
):
    print("update_brand_url_and_process", project_id, payload.brand_url)
    # TODO: Add permission check to ensure user can edit this project.
    
    # Immediately update the status to PROCESSING so the UI can reflect the change.
    initial_update = BlogProjectUpdate(
        brand_url=payload.brand_url, # Store the original URL temporarily
        brand_info_status=BrandInfoStatus.PROCESSING
    )
    print("initial_update", initial_update)
    updated = data_service.update_project(project_id, initial_update.model_dump(exclude_unset=True))

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set project status to processing."
        )

    # Invalidate cache to show processing status immediately
    multidomain_cache.invalidate(PROJECT_DOMAIN, user.id)

    # Add the long-running
    brand_service = BrandService(data_service)
    asyncio.create_task(brand_service.process_brand_url(project_id, payload.brand_url))
    
    # Return the project in its "PROCESSING" state
    return data_service.get_project_by_id(project_id)

class BrandContentPayload(BaseModel):
    brand_content: str

@router.patch("/{project_id}/brand-content", response_model=BlogProject)
def update_brand_content(
    project_id: UUID,
    payload: BrandContentPayload,
    db: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user)
):
    """
    Updates only the brand_content for a project.
    """
    project = db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    # Simple ownership/membership check can be added here if needed
    
    update_data = BlogProjectUpdate(brand_content=payload.brand_content)
    
    updated = db.update_project(project_id, update_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update brand content.")
        
    multidomain_cache.invalidate(PROJECT_DOMAIN, current_user.id)
    
    return db.get_project_by_id(project_id) 


# TODO: optimised this api to use the aggregated language list from the blog_post_translations table.
@router.get("/{project_id}/languages", response_model=List[str])
def get_project_languages(
    project_id: str,
    db: BaseDataService = Depends(get_data_service),
):
    """
    Fetch all languages used in blog_post_translations for a project.
    Defaults to ['en'] if no translations exist.
    """
    posts = db.get_blog_posts_by_project_id(str(project_id))
    language_set = set()
    for post in posts:
        # Always include 'en' (default/original)
        language_set.add('en')
        translations = post.get('translations', [])
        for t in translations:
            code = t.get('language_code')
            if code and code != 'en':
                language_set.add(code)
    return list(language_set) if language_set else ['en'] 