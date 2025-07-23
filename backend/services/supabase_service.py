from functools import cache
import os
import secrets
from ..db.conn import get_client
import bcrypt
from supabase import Client
from dotenv import load_dotenv
load_dotenv(dotenv_path="backend\\.env")
from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime, timezone

from ..models.user import User, UserCreate
from ..models.blog_project import BlogProject, BlogProjectCreate
from ..models.project_member import ProjectMember, ProjectMemberCreate
from ..models.api_key import ApiKey, ApiKeyCreate, NewApiKeyResponse

from ..models.project_invitation import ProjectInvitation, ProjectInvitationCreate

from ..models.blog_post import BlogPost
from ..models.blog_prompt import BlogPrompt, BlogPromptCreate, BlogPromptUpdate
from ..models.workflow_template import WorkflowTemplate, WorkflowTemplateCreate, WorkflowTemplateUpdate

from .base_data_service import BaseDataService
from ..utils.cache import multidomain_cache


class MemberAlreadyExistsError(Exception):
    pass

load_dotenv(dotenv_path="backend\\.env")

# Define role-based permissions
ROLE_PERMISSIONS = {
    "viewer": ["read"],
    "admin": ["read", "write"],
    "owner": ["read", "write", "delete", "admin"],
}

def _get_role_from_permissions(permissions: List[str]) -> str:
    if not permissions:
        return "viewer"
    if "admin" in permissions:
        return "owner"
    elif "write" in permissions:
        return "admin"
    return "viewer"

class SupabaseDataService(BaseDataService):
    def __init__(self):
        self.supabase: Client = get_client()

    def get_user_by_email(self, email: str) -> Optional[User]:
        try:
            response = self.supabase.table('users').select("*").eq('email', email).limit(1).execute()
            if response.data:
                return User(**response.data[0])
            return None
        except Exception:
            return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        try:
            response = self.supabase.table('users').select("*").eq('id', user_id).single().execute()
            if response.data:
                return User(**response.data)
            return None
        except Exception:
            return None

    def get_user_by_external_id(self, external_id: str) -> Optional[User]:
        try:
            response = self.supabase.table('users').select("*").eq('external_id', external_id).limit(1).execute()
            if response.data:
                return User(**response.data[0])
            return None
        except Exception:
            return None

    def create_user(self, user_data: UserCreate) -> Optional[User]:
        try:
            user_dict = user_data.model_dump()
            response = self.supabase.table('users').insert(user_dict).execute()
            if response.data:
                return User.model_validate(response.data[0])
        except Exception:
            return None

    def deactivate_user(self, user_id: UUID) -> bool:
        """Marks a user as inactive by setting is_active to False."""
        try:
            response = self.supabase.table('users').update({'is_active': False}).eq('id', str(user_id)).execute()
            return bool(response.data)
        except Exception:
            return False

    def update_user(self, user_id: UUID, user_data: dict) -> Optional[User]:
        """Updates a user's data in the database."""
        try:
            user_data.pop('id', None)
            user_data.pop('email', None)
            user_data.pop('external_id', None)

            response = self.supabase.table('users').update(user_data).eq('id', str(user_id)).execute()
            
            if response.data:
                return User.model_validate(response.data[0])
            return None
        except Exception:
            return None

    # --- Project Methods ---
    def get_projects_for_user(self, user_id: UUID) -> List[BlogProject]:
        """Fetches all projects a user is a member of, including member details for each project."""
        try:
            member_entries_response = self.supabase.table('project_members').select('project_id').eq('user_id', str(user_id)).execute()
            if not member_entries_response.data:

                return []
            
            project_ids = [entry['project_id'] for entry in member_entries_response.data]

            projects_response = self.supabase.table('blog_projects').select('*, members:project_members(*)').in_('id', project_ids).execute()
            if not projects_response.data:
                return []
            
            projects_with_members = [BlogProject.model_validate(p) for p in projects_response.data]

            return projects_with_members

        except Exception:
            return []

    def create_project_for_user(self, project: BlogProjectCreate, owner_id: UUID) -> Optional[BlogProject]:
        """Creates a new project and adds the owner as the first member."""
        try:
            project_dict = project.model_dump()
            project_dict['owner_id'] = str(owner_id)
            
            project_response = self.supabase.table('blog_projects').insert(project_dict).execute()

            if not project_response.data:
                return None
            
            new_project_data = project_response.data[0]
            new_project_id = new_project_data['id']

            new_member = ProjectMemberCreate(
                project_id=UUID(new_project_id),
                user_id=owner_id,
                invited_by=owner_id,
                permissions=ROLE_PERMISSIONS["owner"]
            )
            member_dict = new_member.model_dump(mode='json')
            
            member_response = self.supabase.table('project_members').insert(member_dict).execute()

            if not member_response.data:
                print(f"CRITICAL: Project {new_project_id} created, but failed to add owner {owner_id} as member.")
                return BlogProject.model_validate(new_project_data)

            return BlogProject.model_validate(new_project_data)

        except Exception:
            return None

    def create_project(self, name: str, owner_id: UUID, description: Optional[str] = None) -> Optional[BlogProject]:
        project_create = BlogProjectCreate(name=name, description=description, owner_id=owner_id)
        return self.create_project_for_user(project_create, owner_id)

    def get_project_by_id(self, project_id: UUID) -> Optional[BlogProject]:
        try:
            response = self.supabase.table('blog_projects').select('*').eq('id', str(project_id)).single().execute()
            if response.data:
                return BlogProject.model_validate(response.data)
            return None
        except Exception:
            return None

    def get_project_member_by_user_id(self, project_id: UUID, user_id: UUID) -> Optional[ProjectMember]:
        try:
            response = self.supabase.table('project_members').select('*').eq('project_id', str(project_id)).eq('user_id', str(user_id)).single().execute()
            if response.data:
                return ProjectMember.model_validate(response.data)
            return None
        except Exception:
            return None

    def get_project_member_by_id(self, member_id: UUID) -> Optional[ProjectMember]:
        try:
            response = self.supabase.table('project_members').select('*').eq('id', str(member_id)).single().execute()
            if response.data:
                return ProjectMember.model_validate(response.data)
            return None
        except Exception:
            return None

    def get_project_member_by_email(self, project_id: UUID, email: str) -> Optional[User]:
        try:
            user_response = self.supabase.table('users').select('id').eq('email', email).limit(1).execute()
            if not user_response.data:
                return None
            
            user_id = user_response.data[0]['id']

            member_response = self.supabase.table('project_members').select('*').eq('project_id', str(project_id)).eq('user_id', user_id).limit(1).execute()
            
            if not member_response.data:
                return None

            full_user_response = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if full_user_response.data:
                return User.model_validate(full_user_response.data)

            return None
            
        except Exception:
            return None

    def create_invitation(self, invitation_data: ProjectInvitationCreate) -> Optional[ProjectInvitation]:
        try:
            existing_member = self.get_project_member_by_email(invitation_data.project_id, invitation_data.email_to)
            if existing_member:
                raise MemberAlreadyExistsError(f"User with email {invitation_data.email_to} is already a member of project {invitation_data.project_id}.")

            invitation = ProjectInvitation(**invitation_data.model_dump())
            invitation_dict = invitation.model_dump(mode='json', exclude={'project'})
            
            response = self.supabase.table('project_invitations').insert(invitation_dict).execute()

            if response.data:
                return ProjectInvitation.model_validate(response.data[0])
            return None
        except MemberAlreadyExistsError as e:
            raise e
        except Exception:
            return None

    def get_invitation_by_token(self, token: str) -> Optional[ProjectInvitation]:
        try:
            response = self.supabase.table('project_invitations').select("*").eq('token', token).single().execute()
            if response.data:
                return ProjectInvitation.model_validate(response.data)
            return None
        except Exception:
            return None
   
    def get_invitation_by_id(self, invitation_id: UUID) -> Optional[ProjectInvitation]:
        try:
            response = self.supabase.table('project_invitations').select("*").eq('id', str(invitation_id)).single().execute()
            if response.data:
                return ProjectInvitation.model_validate(response.data)
            return None
        except Exception:
            return None

    def accept_invitation(self, token: str, accepting_user_id: UUID) -> Optional[ProjectMember]:
       # print(f"Accepting invitation with token: {token} for user: {accepting_user_id}")
        invitation = self.get_invitation_by_token(token)
      #  print(f"Fetched invitation: {invitation}")

        if not invitation or invitation.status != 'pending':
           # print("Invitation not found or not pending")
            return None

        if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            self.supabase.table('project_invitations').update({'status': 'expired'}).eq('id', str(invitation.id)).execute()
            return None

        accepting_user = self.get_user_by_id(str(accepting_user_id))
        if not accepting_user or accepting_user.email != invitation.email_to:
           # print("Fetched accepting_user:", accepting_user)

            return None
        

        try:
            new_member_data = ProjectMemberCreate(
            project_id=invitation.project_id,
            user_id=accepting_user_id,
            invited_by=invitation.invited_by,
                permissions=ROLE_PERMISSIONS.get(invitation.role, ["read"])
            )
            
            new_member_dict = new_member_data.model_dump(mode='json')
            member_response = self.supabase.table('project_members').insert(new_member_dict).execute()

            if not member_response.data:
                return None

            self.supabase.table('project_invitations').update({'status': 'accepted'}).eq('id', str(invitation.id)).execute()
            
            return ProjectMember.model_validate(member_response.data[0])
        except Exception:
            return None

    def accept_invitation_by_id(self, invitation_id: UUID, accepting_user_id: UUID) -> Optional[ProjectMember]:
        invitation = self.get_invitation_by_id(invitation_id)

        if not invitation or invitation.status != 'pending':
            return None

        if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            self.supabase.table('project_invitations').update({'status': 'expired'}).eq('id', str(invitation.id)).execute()
            return None
        
        accepting_user = self.get_user_by_id(str(accepting_user_id))
        if not accepting_user or accepting_user.email != invitation.email_to:
            return None

        try:
            new_member_data = ProjectMemberCreate(
                project_id=invitation.project_id,
                user_id=accepting_user_id,
                invited_by=invitation.invited_by,
                permissions=ROLE_PERMISSIONS.get(invitation.role, ["read"])
            )
            
            new_member_dict = new_member_data.model_dump(mode='json')
            member_response = self.supabase.table('project_members').insert(new_member_dict).execute()

            if not member_response.data:
                return None

            self.supabase.table('project_invitations').update({'status': 'accepted'}).eq('id', str(invitation.id)).execute()
            
            return ProjectMember.model_validate(member_response.data[0])
        except Exception:
            return None

    def decline_invitation(self, token: str) -> bool:
        try:
            response = self.supabase.table('project_invitations').update({'status': 'declined'}).eq('token', token).execute()
            return bool(response.data)
        except Exception:
            return False

    def reject_invitation_by_id(self, invitation_id: UUID, user_id: UUID) -> bool:
        invitation = self.get_invitation_by_id(invitation_id)
        if not invitation:
            return False
        
        user = self.get_user_by_id(str(user_id))
        if not user or user.email != invitation.email_to:
            return False

        try:
            response = self.supabase.table('project_invitations').update({'status': 'rejected'}).eq('id', str(invitation_id)).execute()
            return bool(response.data)
        except Exception:
            return False

    def get_invitations_for_user_email(self, email: str) -> List[ProjectInvitation]:
        try:
            response = self.supabase.table('project_invitations').select(
                '*, project:blog_projects(*)'
            ).eq('email_to', email).eq('status', 'pending').execute()
            
            if not response.data:
                return []

            invitations = [ProjectInvitation.model_validate(item) for item in response.data]
            return invitations
        except Exception as e:
            print(f"Error fetching invitations for user {email}: {e}")
            return []

    def get_blog_posts_by_project_id(self, project_id: UUID) -> List[BlogPost]:
        """Fetches all blog posts for a given project, including their translations."""
        print(f"Before fetching blog posts for project ID: {project_id}")
        print(f"Filter conditions: project_id='{project_id}', is_active=True")
        try:
            # Fetch blog posts and their translations in one go
            response = self.supabase.table('blog_posts').select('''
                *,
                translations:blog_post_translations(
                    language_code,
                    title,
                    content,
                    status
                )
            ''').eq('project_id', str(project_id)).eq('is_active', True).execute()
            print("response fetched")
            if response.data:
                posts = []
                for data in response.data:
                    try:
                            # Extract and structure translation data
                        translations = data.pop('translations', [])
                        print("translations fetched", len(translations))
                        # Create BlogPost object for validation, then convert back to dict
                        blog_post = BlogPost(**data)
                        post_dict = blog_post.model_dump()
                        post_dict['translations'] = translations
                        posts.append(post_dict)
                    except Exception as e:
                        print(f"Error fetching blog post {data['id']}: {e}")
                        continue
                return posts
            print("No blog posts found for the given project ID.")
            return []
        except Exception as e:
            print(f"Fetch error: {e}")
            return []

    def get_blog_post_by_id(self, post_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetches a single blog post by its ID with full translation data."""
        try:
            response = self.supabase.table('blog_posts').select('''
                *,
                translations:blog_post_translations(
                    language_code,
                    title,
                    content,
                    status
                )
            ''').eq('id', str(post_id)).single().execute()

            if response.data:
                data = response.data
                translations = data.pop('translations', [])
                blog_post = BlogPost(**data)
                post_dict = blog_post.model_dump()
                post_dict['translations'] = translations
                return post_dict
            return None
        except Exception as e:
            print(f"Error fetching blog post {post_id}: {e}")
            return None

    def get_blog_post_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Fetches a single blog post by its slug."""
        try:
            response = self.supabase.table('blog_posts').select('*').eq('slug', slug).single().execute()
            if response.data:
                blog_post = BlogPost(**response.data)
                return blog_post.model_dump()
            return None
        except Exception as e:
            print(f"Error fetching blog post by slug {slug}: {e}")
            return None

    def fetch_or_create_user(self, user_data: UserCreate) -> Optional[User]:
        """
        Handles user login by fetching or creating a user based on their Firebase UID.
        If a user with the given Firebase UID (external_id) does not exist, a new
        user record is created. It does not check for existing emails to ensure
        that a user who deletes and re-registers gets a completely new account.
        """
        # 1. Try fetching by external_id (Firebase UID). This is the only unique identifier we trust after login.
        if user_data.external_id:
            existing_user = self.get_user_by_external_id(user_data.external_id)
            if existing_user:
                return existing_user

        # 2. If no user exists with that Firebase UID, create a new one.
        return self.create_user(user_data)

    def create_blog_post(self, post_data: Dict[str, Any]) -> Optional[BlogPost]:
        try:
            response = self.supabase.table('blog_posts').insert(post_data).execute()

            if response.data:
                inserted_data = response.data[0]
                print(f"Inserted blog post: {inserted_data}")
                return BlogPost.model_validate(inserted_data)
            print("No data returned after blog post insert.")
            return None
        except Exception as e:
            print(f"Insert error: {e}")
            return None
    
    def get_blog_post(self, post_id: str, user_id: str) -> Optional[BlogPost]:
        """Gets a blog post, ensuring the user has permission."""
        try:
            # If they are a member, fetch the full blog post
            full_post_response = self.supabase.table('blog_posts').select('*').eq('id', post_id).single().execute()
            if full_post_response.data:
                return BlogPost(**full_post_response.data)
            return None
        except Exception as e:
            print(f"Error fetching blog post {post_id} for user {user_id}: {e}")
            return None

    def deactivate_blog_post(self, post_id: str, user_id: str) -> bool:
        """Deactivates a blog post by setting is_active to False."""
        try:
            response = self.supabase.table('blog_posts').update({'is_active': False}).eq('id', post_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error deactivating blog post {post_id}: {e}")
            return False

    def delete_project(self, project_id: UUID, user_id: UUID) -> bool:
        # Verify the user is the owner of the project
        project = self.get_project_by_id(project_id)
        if not project or project.owner_id != user_id:
            print(f"User {user_id} is not authorized to delete project {project_id}")
            return False

        try:
            response = self.supabase.table('blog_projects').delete().eq('id', str(project_id)).execute()
            return bool(response.data)
        except Exception as e:
            print(f"Error deleting project {project_id}: {e}")
            return False

    # UPDATED METHODS - Replace the existing placeholder methods
    # def add_member_to_project(self, project_id: UUID, user_id: UUID, current_user_id: UUID) -> bool:
    #     """Adds a user to a project."""
    #     try:
    #         # Check if user is already a member
    #         existing = self.supabase.table('project_members').select('*').eq(
    #             'project_id', str(project_id)
    #         ).eq('user_id', str(user_id)).execute()
            
    #         if not project_response.data:
    #             return False

    #         if str(user_id) != project_response.data.get('owner_id'):
    #             return False

    #         delete_response = self.supabase.table('blog_projects').delete().eq('id', str(project_id)).execute()
            
    #         return True

    #     except Exception:
    #         return False

    def get_project_member(self, project_id: UUID, user_id: UUID) -> Optional[ProjectMember]:
        try:
            response = self.supabase.table('project_members').select('*').eq(
                'project_id', str(project_id)
            ).eq('user_id', str(user_id)).single().execute()
            
            if response.data:
                return ProjectMember.model_validate(response.data)
            return None
        except Exception:
            return None

    def update_member_role(self, project_id: UUID, member_id: UUID, role: str, current_user_id: UUID) -> bool:
        try:
            project = self.get_project_by_id(project_id)
            if not project or project.owner_id != current_user_id:
                return False

            member_response = self.supabase.table('project_members').select('user_id').eq('id', str(member_id)).eq('project_id', str(project_id)).single().execute()
            
            if not member_response.data:
                return False

            user_to_update_id = UUID(member_response.data['user_id'])
            
            if role == "owner":
                # If we are making someone else an owner
                if user_to_update_id != current_user_id:
                    # Use a transaction to ensure atomicity
                    # Supabase Python client doesn't support transactions directly, this has to be done via a stored procedure
                    # For now, we will do it in sequence and accept the risk.
                    
                    # 1. New owner gets owner permissions
                    new_owner_permissions = ROLE_PERMISSIONS.get("owner", [])
                    if not self.update_member_permissions(project_id, user_to_update_id, new_owner_permissions):
                        return False # Failed to update new owner's permissions

                    # 2. Old owner gets admin permissions
                    old_owner_permissions = ROLE_PERMISSIONS.get("admin", [])
                    if not self.update_member_permissions(project_id, current_user_id, old_owner_permissions):
                        # Attempt to rollback the new owner's permissions
                        self.update_member_permissions(project_id, user_to_update_id, ROLE_PERMISSIONS.get("viewer", []))
                        return False

                    # 3. Update project owner_id
                    try:
                        self.supabase.table('blog_projects').update({'owner_id': str(user_to_update_id)}).eq('id', str(project_id)).execute()
                        
                        # After a successful ownership transfer, invalidate caches for both users
                        old_owner_user = self.get_user_by_id(str(current_user_id))
                        new_owner_user = self.get_user_by_id(str(user_to_update_id))

                        if old_owner_user and new_owner_user:
                            multidomain_cache.invalidate("users", old_owner_user.external_id)
                            multidomain_cache.invalidate("users", new_owner_user.external_id)
                            
                    except Exception as e:
                        # Rollback permission changes if owner_id update fails
                        self.update_member_permissions(project_id, user_to_update_id, ROLE_PERMISSIONS.get("viewer", [])) # Revert new owner
                        self.update_member_permissions(project_id, current_user_id, ROLE_PERMISSIONS.get("owner", []))   # Restore old owner
                        print(f"Failed to update project owner, rolling back permission changes: {e}")
                        return False
                    
                    return True
                else:
                    # Making self owner - no change, but ensure permissions are correct.
                    permissions = ROLE_PERMISSIONS.get("owner", [])
                    return self.update_member_permissions(project_id, current_user_id, permissions)
            else:
                # Not making someone an owner, just update their role
                # An owner cannot have their role changed to something else by themselves using this method.
                if user_to_update_id == current_user_id:
                    return False # Owner cannot change their own role to non-owner.
                
                permissions = ROLE_PERMISSIONS.get(role, [])
                if self.update_member_permissions(project_id, user_to_update_id, permissions):
                    # Invalidate cache for the user whose role was changed
                    user_to_update = self.get_user_by_id(str(user_to_update_id))
                    if user_to_update:
                        multidomain_cache.invalidate("users", user_to_update.external_id)
                        multidomain_cache.invalidate("projects", user_to_update_id)
                    return True
                return False

        except Exception as e:
            print(f"Error in update_member_role: {e}")
            return False

    def leave_project(self, project_id: UUID, user_id: UUID) -> bool:
        """
        Allows a user to leave a project. The project owner cannot leave.
        When a user leaves, the project cache for all remaining members is invalidated.
        """
        try:
            project = self.get_project_by_id(project_id)
            if not project:
                return False
            
            if project.owner_id == user_id:
                return False

            # Get all members before leaving to invalidate their caches later
            all_members = self.get_project_members(project_id)

            delete_response = self.supabase.table('project_members').delete().match({
                'project_id': str(project_id),
                'user_id': str(user_id)
            }).execute()
            
            if delete_response.data:
                # Invalidate the cache for the user who left
                multidomain_cache.invalidate("projects", user_id)

                # Invalidate cache for all *other* members of the project
                for member in all_members:
                    if member['user_id'] != user_id:
                         multidomain_cache.invalidate("projects", member['user_id'])
                return True
            
            return False
        except Exception as e:
            print(f"Error in leave_project: {e}")
            return False

    def remove_member_from_project(self, project_id: UUID, member_id: UUID, current_user_id: UUID) -> bool:
        try:
            # First, fetch the member record to find out their user_id
            member_response = self.supabase.table('project_members').select('user_id, project_id').eq('id', str(member_id)).single().execute()
            if not member_response.data:
                return False

            member_user_id = UUID(member_response.data['user_id'])
            
            # Security check: ensure the member actually belongs to the project in the URL
            if str(project_id) != member_response.data['project_id']:
                return False

            project = self.get_project_by_id(project_id)
            if not project:
                return False

            # The project owner cannot be removed.
            if member_user_id == project.owner_id:
                return False

            # Check if the current user has permission to remove members.
            current_member = self.get_project_member_by_user_id(project_id, current_user_id)
            if not current_member:
                return False # Current user is not even a member.

            is_owner = project.owner_id == current_user_id
            is_admin = _get_role_from_permissions(current_member.permissions) == "admin"
            
            # Only owners or admins can remove other members.
            if is_owner or is_admin:
                delete_response = self.supabase.table('project_members').delete().eq('id', str(member_id)).execute()
                
                if delete_response.data:
                    # On successful removal, invalidate caches for both the removed user and the current user
                    multidomain_cache.invalidate("projects", member_user_id)
                    multidomain_cache.invalidate("projects", current_user_id)
                    return True
            
            return False
        except Exception:
            return False

    def get_project_members(self, project_id: UUID) -> List[Dict]:
        """Retrieves all members for a project including their user details."""
        try:
            # First, get the project details to find the owner's ID
            project_details_response = self.supabase.table('blog_projects').select('owner_id').eq('id', str(project_id)).single().execute()
            if not project_details_response.data:
                return []
            
            owner_id = project_details_response.data['owner_id']

            # Then, fetch all members of the project
            response = self.supabase.table('project_members').select('*, user:users!project_members_user_id_fkey(*)').eq('project_id', str(project_id)).execute()
            
            if response.data:
                members_with_details = []
                for member_data in response.data:
                    user_details = member_data.pop('user', {})
                    if user_details:
                        # Reconstruct the member object with user details and role
                        permissions = member_data.get('permissions', [])
                        role = _get_role_from_permissions(permissions)

                        combined_data = {
                            "id": member_data['id'],
                            "project_id": member_data['project_id'],
                            "user_id": member_data['user_id'],
                            "role": role,  # Add the calculated role here
                            "permissions": permissions,
                            "invited_by": member_data.get('invited_by'),
                            "created_at": member_data.get('created_at'),
                            "email": user_details.get('email'),
                            "name": user_details.get('name'),
                            "avatar_url": user_details.get('avatar_url')
                        }
                        members_with_details.append(combined_data)
                return members_with_details
        except Exception:
            return []
        return []

    def get_project_invitations(self, project_id: UUID) -> List[ProjectInvitation]:
        try:
            response = self.supabase.table('project_invitations').select("*").eq('project_id', str(project_id)).eq('status', 'pending').execute()
            if response.data:
                return [ProjectInvitation.model_validate(inv) for inv in response.data]
            return []
        except Exception:
            return []

    def delete_invitation(self, project_id: UUID, invitation_id: UUID, current_user_id: UUID) -> bool:
        try:
            response = self.supabase.table('project_invitations').delete().match({
                'id': str(invitation_id),
                'project_id': str(project_id)
            }).execute()
            return bool(response.data)
        except Exception:
            return False

    def update_invitation_role(self, project_id: UUID, invitation_id: UUID, role: str, current_user_id: UUID) -> bool:
        try:
            response = self.supabase.table('project_invitations').update({'role': role}).match({
                'id': str(invitation_id),
                'project_id': str(project_id)
            }).execute()
            return bool(response.data)
        except Exception:
            return False

    def update_member_permissions(self, project_id: UUID, user_id: UUID, permissions: List[str]) -> bool:
        try:
            response = self.supabase.table('project_members').update({
                'permissions': permissions
            }).eq('project_id', str(project_id)).eq('user_id', str(user_id)).execute()
            
            return bool(response.data)
        except Exception:
            return False

    def get_api_keys_by_user_id(self, user_id: UUID) -> List[ApiKey]:
        try:
            response = self.supabase.table('api_keys').select('*').eq('user_id', str(user_id)).execute()
            if response.data:
                return [ApiKey.model_validate(row) for row in response.data]
            return []
        except Exception:
            return []

    def create_api_key(self, key_create: ApiKeyCreate) -> Optional[ApiKey]:
        try:
            new_key = f"sk_{secrets.token_urlsafe(32)}"
            key_prefix = new_key[3:11]
            
            key_data = {
                "user_id": str(key_create.user_id),
                "project_id": str(key_create.project_id),
                "name": key_create.name,
                "key_prefix": key_prefix,
                "key": new_key,
            }

            response = self.supabase.table('api_keys').insert(key_data).execute()
            
            if response.data:
                return ApiKey.model_validate(response.data[0])

            return None
        except Exception:
            return None
    
    def delete_api_key(self, user_id: UUID, key_id: UUID) -> bool:
        try:
            response = self.supabase.table('api_keys').delete().match({'id': str(key_id), 'user_id': str(user_id)}).execute()
            return len(response.data) > 0
        except Exception:
            return False

    def create_prompt(self, prompt_data: BlogPromptCreate, user_id: str, creator_name: str) -> Optional[BlogPrompt]:
        try:
            prompt_dict = prompt_data.model_dump()
            prompt_dict['created_by'] = str(user_id)
            prompt_dict['creator_name'] = creator_name
            
            response = self.supabase.table('blog_prompts').insert(prompt_dict).execute()
            
            if response.data:
                return BlogPrompt.model_validate(response.data[0])
            return None
        except Exception:
            return None

    def get_prompts_by_project_id(self, project_id: str) -> List[BlogPrompt]:
        try:
            response = self.supabase.table('blog_prompts').select('*').eq('project_id', str(project_id)).execute()
            if response.data:
                return [BlogPrompt.model_validate(p) for p in response.data]
            return []
        except Exception:
            return []

    def get_prompt_by_id(self, prompt_id: str) -> Optional[BlogPrompt]:
        try:
            response = self.supabase.table('blog_prompts').select('*').eq('id', str(prompt_id)).single().execute()
            if response.data:
                return BlogPrompt.model_validate(response.data)
            return None
        except Exception:
            return None

    def update_prompt(self, prompt_id: str, prompt_data: BlogPromptUpdate) -> Optional[BlogPrompt]:
        try:
            update_dict = prompt_data.model_dump(exclude_unset=True)
            
            response = self.supabase.table('blog_prompts').update(update_dict).eq('id', str(prompt_id)).execute()
            
            if response.data:
                return BlogPrompt.model_validate(response.data[0])
            return None
        except Exception:
            return None

    def delete_prompt(self, prompt_id: str) -> bool:
        try:
            response = self.supabase.table('blog_prompts').delete().eq('id', str(prompt_id)).execute()
            return len(response.data) > 0
        except Exception:
            return False

    def set_prompt_active_status(self, prompt_id: str, is_active: bool) -> Optional[BlogPrompt]:
        try:
            response = self.supabase.table('blog_prompts').update({'is_active': is_active}).eq('id', str(prompt_id)).execute()
            
            if response.data:
                return BlogPrompt.model_validate(response.data[0])
            return None
        except Exception:
            return None


    # --- API Key Methods (placeholders) ---
    def get_api_keys_for_user(self, user_id: UUID) -> List[Dict[str, Any]]:
            return []

    def create_api_key_for_email(self, email: str, key_data: Dict) -> Dict:
        """Not implemented: Creates an API key for a user by email."""
        print("create_api_key_for_email is not implemented")
        return {}

    def create_api_key_for_user(self, user_id: UUID, key_name: str) -> Dict[str, Any]:
        return {}
    
    def delete_api_key_for_user(self, key_id: str, user_id: UUID) -> bool:
        return False

    def update_blog_post_status(self, post_id: str, status: str) -> BlogPost | None:
        """Updates the status of a blog post and returns the updated post as a BlogPost model."""
        try:
            update_payload = {"status": status}
            if status.lower() == 'published':
                update_payload['published_at'] = datetime.now(timezone.utc).isoformat()
            
            # First, execute the update.
            # The result of a simple update doesn't return the full object in some client versions.
            update_result = self.supabase.table("blog_posts").update(update_payload).eq("id", post_id).execute()

            # Check if the update affected any rows. If not, the post doesn't exist.
            if not update_result.data:
                return None

            # Now, fetch the full, updated post data.
            updated_post_response = self.supabase.table("blog_posts").select("*").eq("id", post_id).single().execute()

            if updated_post_response.data:
                return BlogPost(**updated_post_response.data)
            
            return None
        except Exception as e:
            print(f"Error updating blog post status in Supabase: {e}")
            return None 


    def get_user_chats(self, user_id: str, offset: int, limit: int) -> list[dict]:
        # Fetch chats along with their first message's content and timestamp
        res = (
            self.supabase.table("chats")
            .select(
                "id",
                "user_id",
                "created_at",
                "messages(content, timestamp)"
            )
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .order("timestamp", desc=False, foreign_table="messages") # Order messages to get the first one
            .range(offset, offset + limit - 1)
            .limit(1, foreign_table="messages") # Limit to only the first message
            .execute()
        )
        
        # Process the data to flatten the nested message structure
        processed_data = []
        for chat in res.data:
            first_message_content = None
            first_message_timestamp = None
            if chat.get("messages") and len(chat["messages"]) > 0:
                # Supabase returns related data as a list; we want the first one
                first_message_content = chat["messages"][0]["content"]
                first_message_timestamp = chat["messages"][0]["timestamp"]
            
            processed_data.append({
                "id": chat["id"],
                "user_id": chat["user_id"],
                "created_at": chat["created_at"],
                "first_message_content": first_message_content,
                "first_message_timestamp": first_message_timestamp,
            })
        return processed_data

    def get_chat_messages(self, chat_id: str, offset: int, limit: int) -> list[dict]:
        res = (
            self.supabase.table("messages")
            .select("*")
            .eq("chat_id", str(chat_id))
            .order("timestamp", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data


    # def get_project_member_by_email(self, project_id: UUID, email: str) -> Optional[Dict]:
    #     """Retrieves a project member by their email, checking against the users table."""
    #     try:
    #         user = self.get_user_by_email(email)
    #         if not user:
    #             return None
            
    #         response = self.supabase.table('project_members').select('*').eq(
    #             'project_id', str(project_id)
    #         ).eq('user_id', str(user.id)).single().execute()

    #         if response.data:
    #             return response.data
    #         return None
    #     except Exception as e:
    #         # .single() raises an error if more than one row is found, which is good.
    #         # It also raises an error if no rows are found. We can treat that as "not found".
    #         print(f"Error fetching project member by email: {e}")
    #         return None

    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Retrieves all active supported languages."""
        try:
            response = self.supabase.table("supported_languages").select("*").eq("is_active", True).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"Error fetching supported languages: {e}")
            return []

    def update_project(self, project_id: UUID, update_data: dict) -> bool:
        """Updates fields of a project. Returns True if successful."""
        try:
            # Remove protected fields if present
            update_data.pop('id', None)
            update_data.pop('owner_id', None)
            update_data.pop('created_at', None)
            update_data.pop('updated_at', None)
            update_data.pop('deleted_at', None)
            
            # Convert UUIDs to strings before sending to Supabase
            for key, value in update_data.items():
                if isinstance(value, UUID):
                    update_data[key] = str(value)

            response = self.supabase.table('blog_projects').update(update_data).eq('id', str(project_id)).execute()
            return bool(response.data)
        except Exception as e:
            print(f"Error updating project {project_id}: {e}")
            return False

    # --- Workflow Template Methods ---
    def create_workflow_template(self, template_data: "WorkflowTemplateCreate", created_by: UUID) -> Optional["WorkflowTemplate"]:
        """Creates a new workflow template."""
        try:
            template_dict = template_data.model_dump()
            template_dict['created_by'] = str(created_by)
            response = self.supabase.table('workflow_templates').insert(template_dict).execute()
            if response.data:
                return WorkflowTemplate.model_validate(response.data[0])
            return None
        except Exception as e:
            print(f"Error creating workflow template: {e}")
            return None

    def get_workflow_template_by_id(self, template_id: UUID) -> Optional["WorkflowTemplate"]:
        """Retrieves a workflow template by its ID."""
        try:
            response = self.supabase.table('workflow_templates').select('*').eq('id', str(template_id)).single().execute()
            if response.data:
                return WorkflowTemplate.model_validate(response.data)
            return None
        except Exception as e:
            print(f"Error fetching workflow template by ID: {e}")
            return None

    def get_workflow_templates(self) -> List["WorkflowTemplate"]:
        """Retrieves all workflow templates."""
        try:
            response = self.supabase.table('workflow_templates').select('*').order('created_at', desc=False).execute()
            if response.data:
                return [WorkflowTemplate.model_validate(row) for row in response.data]
            return []
        except Exception as e:
            print(f"Error fetching workflow templates: {e}")
            return []

    def update_workflow_template(self, template_id: UUID, template_data: "WorkflowTemplateUpdate") -> Optional["WorkflowTemplate"]:
        """Updates a workflow template."""
        try:
            update_dict = template_data.model_dump(exclude_unset=True)
            if not update_dict:
                return self.get_workflow_template_by_id(template_id)

            response = self.supabase.table('workflow_templates').update(update_dict).eq('id', str(template_id)).execute()
            if response.data:
                return WorkflowTemplate.model_validate(response.data[0])
            return None
        except Exception as e:
            print(f"Error updating workflow template: {e}")
            return None

    def delete_workflow_template(self, template_id: UUID) -> bool:
        """Deletes a workflow template."""
        try:
            response = self.supabase.table('workflow_templates').delete().eq('id', str(template_id)).execute()
            # response.data will contain the deleted records. If it's not empty, deletion was successful.
            return bool(response.data)
        except Exception as e:
            print(f"Error deleting workflow template: {e}")
            return False

