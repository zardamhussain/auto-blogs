from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Literal, Optional, TYPE_CHECKING
from uuid import UUID
from ..models.blog_post import BlogPost
from ..models.blog_project import BlogProject, BlogProjectCreate
from pydantic import BaseModel
import json

if TYPE_CHECKING:
    from ..models.api_key import ApiKeyCreate, NewApiKeyResponse
    from ..models.project_invitation import ProjectInvitation, ProjectInvitationCreate
    from ..models.blog_project import BlogProject
    from ..models.blog_prompt import BlogPrompt, BlogPromptCreate, BlogPromptUpdate
    from ..models.workflow_template import WorkflowTemplate, WorkflowTemplateCreate, WorkflowTemplateUpdate
    from backend.models.blog_post import BlogPost
    from backend.models.project_member import ProjectMember
    from backend.models.user import User, UserCreate



class BaseDataService(ABC):
    """
    An abstract base class that defines the contract for data services.
    Any concrete data service (e.g., for JSON, Supabase) must implement these methods.
    """

    def serialize_model(self, model_instance: BaseModel) -> Dict[str, Any]:
        """
        Serializes a Pydantic model instance into a dictionary,
        handling types like datetime and UUID for JSON compatibility.
        """
        # Using model_dump_json and then json.loads is a robust way to respect
        # Pydantic's custom JSON encoders if they are defined on the model.
        return json.loads(model_instance.model_dump_json())

    
    def create_project_for_user(self, project: BlogProjectCreate, owner_id: UUID) -> Optional[BlogProject]:
        """creates the project for user"""
        pass

    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional["User"]:
        """Retrieves a user by their email."""
        pass

    @abstractmethod
    def get_user_by_external_id(self, external_id: str) -> Optional["User"]:
        """Retrieves a user by their external ID."""
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional["User"]:
        """Retrieves a user by their internal ID."""
        pass

    @abstractmethod
    def deactivate_user(self, user_id: UUID) -> bool:
        """Marks a user as inactive in the database."""
        pass

    @abstractmethod
    def update_user(self, user_id: UUID, user_data: dict) -> Optional[Dict[str, Any]]:
        """Updates a user's data."""
        pass

    @abstractmethod
    def get_blog_posts_by_project_id(self, project_id: str) -> List[Dict[str, Any]]:
        """Fetches all blog posts for a given project."""
        pass

    @abstractmethod
    def fetch_or_create_user(self, user_data: "UserCreate") -> Optional["User"]:
        """
        Fetches a user by their external ID (from Firebase), creating them if they don't exist.
        This is particularly important for the Supabase implementation.
        """
        pass

    @abstractmethod
    def get_api_keys_by_user_id(self, user_id: str) -> List[Dict]:
        """Retrieves all API keys for a user."""
        pass

    @abstractmethod
    def create_api_key(self, key_create: "ApiKeyCreate") -> "NewApiKeyResponse":
        """Creates a new API key."""
        pass

    @abstractmethod
    def delete_api_key(self, user_id: str, key_id: str) -> bool:
        """Deletes an API key for a user."""
        pass

    # --- Project Management Methods ---
    @abstractmethod
    def create_project(self, name: str, owner_id: str, description: str | None) -> Dict:
        """Creates a new project."""
        pass

    @abstractmethod
    def get_projects_for_user(self, user_id: UUID) -> List[Dict]:
        """Retrieves all projects a user is a member of."""
        pass

    

    @abstractmethod
    def delete_project(self, project_id: UUID, user_id: UUID) -> bool:
        """Deletes a project."""
        pass

    # --- Project Member Methods ---
    @abstractmethod
    def get_project_member(self, project_id: str, user_email: str) -> Dict | None:
        """Retries a project member's details."""
        pass

    @abstractmethod
    def get_project_member_by_email(self, project_id: UUID, email: str) -> Optional["User"]:
        """Retrieves a project member by their email address."""
        pass

    @abstractmethod
    def get_project_member_by_user_id(self, project_id: UUID, user_id: UUID) -> Optional["ProjectMember"]:
        """Retrieves a project member by their user ID."""
        pass

    @abstractmethod
    def get_project_member_by_id(self, member_id: UUID) -> Optional["ProjectMember"]:
        """Retrieves a project member by their member ID."""
        pass

    @abstractmethod
    def update_invitation_role(self, project_id: UUID, invitation_id: UUID, role: str, current_user_id: UUID) -> bool:
        """Updates the role of a pending invitation."""
        pass

    @abstractmethod
    def update_member_role(self, project_id: UUID, member_id: UUID, role: str, current_user_id: UUID) -> bool:
        """Updates a user's role in a project."""
        pass

    @abstractmethod
    def remove_member_from_project(self, project_id: UUID, member_id: UUID, current_user_id: UUID) -> bool:
        """Removes a user from a project."""
        pass


    @abstractmethod
    def get_blog_post(self, post_id: str, user_id: str) -> Optional[BlogPost]:
        """Gets a blog post, ensuring the user has permission."""
        pass 

    @abstractmethod
    def get_blog_post_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Fetches a single blog post by its slug."""
        pass

    @abstractmethod
    def get_project_members(self, project_id: UUID) -> List[Dict]:
        """Retrieves all members for a project."""
        pass

    @abstractmethod
    def get_project_invitations(self, project_id: UUID) -> List["ProjectInvitation"]:
        """Retrieves all pending invitations for a project."""
        pass

    @abstractmethod
    def delete_invitation(self, project_id: UUID, invitation_id: UUID, current_user_id: UUID) -> bool:
        """Deletes a pending invitation."""
        pass

    @abstractmethod
    def get_invitation_by_token(self, token: str) -> Optional["ProjectInvitation"]:
        """Retrieves an invitation by its token."""
        pass

    @abstractmethod
    def get_invitation_by_id(self, invitation_id: UUID) -> Optional["ProjectInvitation"]:
        """Retrieves an invitation by its ID."""
        pass

    def create_invitation(self, invitation_data: "ProjectInvitationCreate") -> Optional["ProjectInvitation"]:
        """Creates a project invitation."""
        pass

    @abstractmethod
    def accept_invitation(self, token: str, accepting_user_id: UUID) -> Optional["ProjectMember"]:
        """Accepts a project invitation."""
        pass

    @abstractmethod
    def accept_invitation_by_id(self, invitation_id: UUID, accepting_user_id: UUID) -> Optional["ProjectMember"]:
        """Accepts a project invitation by its ID."""
        pass

    @abstractmethod
    def decline_invitation(self, token: str) -> bool:
        """Declines a project invitation."""
        pass

    @abstractmethod
    def reject_invitation_by_id(self, invitation_id: UUID, user_id: UUID) -> bool:
        """Rejects a project invitation by its ID."""
        pass

    @abstractmethod
    def get_invitations_for_user_email(self, email: str) -> List["ProjectInvitation"]:
        """Retrieves all pending invitations for a user by their email."""
        pass

    @abstractmethod
    def get_project_by_id(self, project_id: UUID) -> Optional["BlogProject"]:
        """Retrieves a project by its ID."""
        pass

    @abstractmethod
    def deactivate_blog_post(self, post_id: str, user_id: str) -> bool:
        """Deactivates a blog post, ensuring the user has permission."""

    @abstractmethod
    def update_blog_post_status(self, post_id: str, status: str) -> BlogPost | None:
        pass

    # --- Workflow Template Methods ---
    @abstractmethod
    def create_workflow_template(self, template_data: "WorkflowTemplateCreate", created_by: UUID) -> Optional["WorkflowTemplate"]:
        """Creates a new workflow template."""
        pass

    @abstractmethod
    def get_workflow_template_by_id(self, template_id: UUID) -> Optional["WorkflowTemplate"]:
        """Retrieves a workflow template by its ID."""
        pass

    @abstractmethod
    def get_workflow_templates(self) -> List["WorkflowTemplate"]:
        """Retrieves all workflow templates."""
        pass

    @abstractmethod
    def update_workflow_template(self, template_id: UUID, template_data: "WorkflowTemplateUpdate") -> Optional["WorkflowTemplate"]:
        """Updates a workflow template."""
        pass

    @abstractmethod
    def delete_workflow_template(self, template_id: UUID) -> bool:
        """Deletes a workflow template."""
        pass

    # --- Prompt / Writing Style Methods ---
    @abstractmethod
    def create_prompt(self, prompt_data: "BlogPromptCreate", user_id: str, creator_name: str) -> "BlogPrompt":
        """Creates a new prompt."""
        pass

    @abstractmethod
    def get_prompts_by_project_id(self, project_id: str) -> List["BlogPrompt"]:
        """Fetches all prompts for a given project."""
        pass

    @abstractmethod
    def get_prompt_by_id(self, prompt_id: str) -> Optional["BlogPrompt"]:
        """Retrieves a prompt by its ID."""
        pass

    @abstractmethod
    def update_prompt(self, prompt_id: str, prompt_data: "BlogPromptUpdate") -> Optional["BlogPrompt"]:
        """Updates a prompt."""
        pass

    @abstractmethod
    def delete_prompt(self, prompt_id: str) -> bool:
        """Deletes a prompt."""
        pass

    @abstractmethod
    def set_prompt_active_status(self, prompt_id: str, is_active: bool) -> Optional["BlogPrompt"]:
        """Sets a prompt's active status."""
        pass 


    @abstractmethod
    def get_user_chats(self, user_id: str, offset: int, limit: int) -> list[dict]:
        pass

    @abstractmethod
    def get_chat_messages(self, chat_id: str, offset: int, limit: int) -> list[dict]:
        pass

    @abstractmethod
    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Retrieves all active supported languages."""
        pass

    @abstractmethod
    def update_project(self, project_id: UUID, update_data: dict) -> bool:
        """Updates fields of a project. Returns True if successful."""
        pass

    

import json
from pathlib import Path
from typing import Any, Dict, List
from threading import Lock

class FlatFileService:
    """Very small helper around a single JSON file used for quick prototyping.

    NOT intended for production  the whole file is read & written on every call.
    A coarse in-process lock is used to avoid write races when running under Uvicorn
    with multiple workers.  For multi-process safety you would need an OS lock 
    out-of-scope for this spike.
    """

    _lock: Lock = Lock()

    def __init__(self, path: Path | str):
        self.path = Path(path)
        # Ensure file exists
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------
    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        try:
            return json.loads(self.path.read_text())
        except json.JSONDecodeError:
            # Corrupted file – start fresh during dev (do *not* do this in prod!)
            return {}

    def _save(self, data: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------
    def get(self, key: str, default: Any = None) -> Any:
        """Return the value stored under *key* (deep copy is *not* done)."""
        with self._lock:
            return self._load().get(key, default)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            data = self._load()
            data[key] = value
            self._save(data)

    def append(self, key: str, item: Any) -> None:
        with self._lock:
            data = self._load()
            arr: List[Any] = data.get(key, [])
            arr.append(item)
            data[key] = arr
            self._save(data) 
    