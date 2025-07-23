import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Literal
from .base_data_service import BaseDataService
from ..models.blog_project import BlogProject
from ..models.project_member import ProjectMember

class JsonDataService(BaseDataService):
    """A data service that uses a local JSON file as a database."""

    _role_permissions = {
        "admin": ["read", "write", "delete"],
        "editor": ["read", "write"],
        "viewer": ["read"]
    }

    def __init__(self, db_path="backend/db.json"):
        self.db_path = db_path
        self._db = self._load_db()

    def _load_db(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {"users": [], "projects": [], "blog_posts": []}

    def _save_db(self, db: Dict[str, List[Dict[str, Any]]]):
        """Writes the current state of the database to the JSON file."""
        with open(self.db_path, "w") as f:
            json.dump(db, f, indent=2)

    def get_user_by_email(self, email: str) -> Dict[str, Any] | None:
        db = self._load_db()
        for user in db.get("users", []):
            if user.get("email") == email:
                return user
        return None

    def get_projects_by_owner_email(self, email: str) -> List[Dict[str, Any]]:
        db = self._load_db()
        return [
            project for project in db.get("projects", [])
            if project.get("owner_email") == email
        ]

    def get_blog_posts_by_project_id(self, project_id: str) -> List[Dict[str, Any]]:
        db = self._load_db()
        return [
            post for post in db.get("blog_posts", [])
            if str(post.get("project_id")) == str(project_id)
        ]

    def get_api_keys_by_email(self, email: str) -> List[Dict[str, Any]]:
        """Retrieves all API keys associated with a user's email."""
        user = self.get_user_by_email(email)
        return user.get("api_keys", []) if user else []

    def create_api_key_for_email(self, email: str, key_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new API key for a user and saves it."""
        db = self._load_db()
        user_found = False
        for user in db.get("users", []):
            if user.get("email") == email:
                if "api_keys" not in user:
                    user["api_keys"] = []
                user["api_keys"].append(key_data)
                user_found = True
                break
        
        if not user_found:
            # This case should ideally not be hit if user is authenticated
            raise ValueError("User not found")

        self._save_db(db)
        return key_data

    def delete_api_key_for_user(self, email: str, key_id: str) -> bool:
        data = self._load_db()
        user_found = False
        key_found = False
        for user in data['users']:
            if user['email'] == email:
                user_found = True
                if 'api_keys' in user:
                    initial_key_count = len(user['api_keys'])
                    user['api_keys'] = [key for key in user['api_keys'] if key.get('id') != key_id]
                    if len(user['api_keys']) < initial_key_count:
                        key_found = True
                break 
        
        if user_found and key_found:
            self._save_db(data)
            return True
            
        if not user_found:
            raise ValueError("User not found")
        if not key_found:
            # By raising an error here, the API can return a 404, which is appropriate.
            raise ValueError("API Key not found")
        
        return False

    def fetch_or_create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        For the JSON simulation, we assume the user already exists if they are in the DB.
        If not, we just return the data from the token, as we are not writing to the file.
        """
        email = user_data.get("email")
        if not email:
            return user_data

        user = self.get_user_by_email(email)
        return user if user else user_data 

    def get_projects_for_user(self, user_email: str) -> List[Dict]:
        user_projects = []
        all_projects = self._db.get('projects', [])
        print(f"All projects: {all_projects} {user_email}",flush=True)
        for project in all_projects: 
            # Find if user is a member of this project
            # Check if user is the owner of the project
            if project.get('owner_email') == user_email:
                user_projects.append(project)
                continue
            for member in project.get('members', []):
                print(f"{member.get('user_id')} , {user_email} {project.get('id')}",flush=True)
                if member.get('user_id') == user_email:
                    user_projects.append(project)
                    break 
        return user_projects

    def create_project(self, name: str, owner_email: str, description: str | None) -> Dict:
        data = self._load_db()
        if 'projects' not in data:
            data['projects'] = []

        owner = self.get_user_by_email(owner_email)
        if not owner or 'id' not in owner:
            raise ValueError("Owner not found or has no ID.")
        
        owner_id = owner['id']

        new_project = BlogProject(
            id=uuid.uuid4(),
            name=name,
            description=description,
            owner_id=owner_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            members=[] # Start with an empty member list
        )
        project_dict = new_project.model_dump(mode='json')
        data['projects'].append(project_dict)
        self._save_db(data)
        return project_dict

    def delete_project(self, project_id: str, user_id: str) -> bool:
        data = self._load_db()
        initial_count = len(data.get('projects', []))
        # Ensure only owner can delete, though API layer already checks for admin
        data['projects'] = [p for p in data.get('projects', []) if not (p['id'] == project_id)]
        if len(data.get('projects', [])) < initial_count:
            self._save_db(data)
            return True
        return False

    def get_project_member(self, project_id: str, user_email: str) -> Dict | None:
        data = self._load_db()
        for project in data.get('projects', []):
            if project['id'] == project_id:
                for member in project.get('members', []):
                    if member.get('user_id') == user_email:
                        return member
        return None

    def add_member_to_project(self, project_id: str, user_email: str, role: Literal["admin", "editor", "viewer"], invited_by_email: str) -> Dict:
        data = self._load_db()
        for project in data.get('projects', []):
            if project['id'] == project_id:
                if 'members' not in project:
                    project['members'] = []
                
                user = self.get_user_by_email(user_email)
                if not user or 'id' not in user:
                    raise ValueError("User to add not found or has no ID")
                user_id = user['id']

                # Check if member already exists
                if any(m['user_id'] == user_id for m in project.get('members', [])):
                    raise ValueError("User is already a member")

                inviter = self.get_user_by_email(invited_by_email)
                inviter_id = inviter.get('id') if inviter else None
                if not inviter_id:
                    raise ValueError("Inviter not found")

                new_member = ProjectMember(
                    id=uuid.uuid4(),
                    project_id=uuid.UUID(project_id),
                    user_id=user_id,
                    permissions=self._role_permissions.get(role, []),
                    invited_by=inviter_id,
                    joined_at=datetime.utcnow()
                )
                member_dict = new_member.model_dump(mode='json')
                project['members'].append(member_dict)
                self._save_db(data)
                return member_dict
        raise ValueError("Project not found")

    def update_member_role(self, project_id: str, user_email: str, role: Literal["admin", "editor", "viewer"]) -> Dict:
        data = self._load_db()
        
        user_to_update = self.get_user_by_email(user_email)
        if not user_to_update or 'id' not in user_to_update:
            raise ValueError("User to update not found or has no ID.")
        user_id_to_update = user_to_update['id']

        for project in data.get('projects', []):
            if project['id'] == project_id:
                for member in project.get('members', []):
                    if member['user_id'] == user_id_to_update:
                        member['permissions'] = self._role_permissions.get(role, [])
                        self._save_db(data)
                        return member
                raise ValueError("Member not found in project")
        raise ValueError("Project not found")

    def remove_member_from_project(self, project_id: str, user_email: str) -> bool:
        data = self._load_db()
        for project in data.get('projects', []):
            if project['id'] == project_id:
                initial_count = len(project.get('members', []))
                project['members'] = [m for m in project.get('members', []) if m['user_id'] != user_email]
                if len(project.get('members', [])) < initial_count:
                    self._save_db(data)
                    return True
                else:
                    raise ValueError("Member not found in project")
        raise ValueError("Project not found") 

    def get_blog_post_by_slug(self, slug: str) -> Dict[str, Any] | None:
        db = self._load_db()
        for post in db.get("blog_posts", []):
            if post.get("slug") == slug:
                return post
        return None 