from functools import cache
from io import BytesIO
from typing import List, Optional
import os
from datetime import datetime
from supabase import create_client, Client
# Note: These model imports will need to be adjusted to the new backend structure
# from src.utils.models.user import User
# from src.utils.models.blog_post import BlogPost
import uuid

from ..models.user import User

class SupabaseClient:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        try:
            self.client: Client = create_client(url, key)
            # self._init_tables()
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            self.client = None

    def _table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database"""
        try:
            # Try to select from the table - if it doesn't exist, it will raise an error
            self.client.table(table_name).select("count").limit(1).execute()
            return True
        except Exception as e:
            if '42P01' in str(e):  # PostgreSQL error code for undefined table
                return False
            raise e

 
    # def get_prompts(self, project_id: str) -> List[SystemPrompt]:
    #     response = (self.client.table("system_prompts")
    #                 .select("*")
    #                 .eq("project_id", project_id)
    #                 .eq("is_deleted", False)
    #                 .execute())
    #     return [SystemPrompt(**prompt) for prompt in response.data]

    # def get_prompt(self, prompt_id: str) -> Optional[SystemPrompt]:
    #     response = self.client.table("system_prompts").select("*").eq("id", prompt_id).execute()
    #     return SystemPrompt(**response.data[0]) if response.data else None
    
    # def save_prompt(self, name: str, content: str, project_id: str, creator_id: str) -> SystemPrompt:
    #     data = {
    #         "name": name,
    #         "content": content,
    #         "project_id": project_id,
    #         "creator_id": creator_id
    #     }
    #     response = self.client.table("system_prompts").insert(data).execute()
    #     return SystemPrompt(**response.data[0])

    # def update_prompt(self, prompt_id: str, content: str, project_id: str, creator_id: str) -> SystemPrompt:
    #     data = {
    #         "content": content,
    #         "updated_at": datetime.utcnow().isoformat(),
    #         "project_id": project_id,
    #         "creator_id": creator_id
    #     }
    #     response = self.client.table("system_prompts").update(
    #         data).eq("id", prompt_id).execute()
    #     return SystemPrompt(**response.data[0]) if response.data else None

    # def delete_prompt(self, prompt_id: str, project_id: str, creator_id: str) -> bool:
    #     try:
    #         response = self.client.table("system_prompts").delete().eq("id", prompt_id).eq("project_id", project_id).eq("creator_id", creator_id).execute()
    #         return True
    #     except Exception as e:
    #         print(f"Error deleting prompt: {e}")
    #         return False

    # def get_content(self, content_id: str) -> KnowledgeBase:
    #     response = self.client.table("knowledge_base").select("*").eq("id", content_id).execute()
    #     return KnowledgeBase(**response.data[0]) if response.data else None
    
    # def get_content_by_url(self, url: str) -> KnowledgeBase:
    #     try:
    #         response = self.client.table("knowledge_base").select("*").eq("url", url).execute()
    #         return KnowledgeBase(**response.data[0]) if response.data else None
    #     except Exception as e:
    #         return None
    
    # def save_content(self, url: str, content: str, images: List[str], csv_file: str, content_type: str, project_id: str, creator_id: str, metadata: dict = None) -> KnowledgeBase:
    #     data = {
    #         "url": url,
    #         "content": content,
    #         "images": images,
    #         "csv_file": csv_file,
    #         "content_type": content_type,
    #         "metadata": metadata or {},
    #         "project_id": project_id,
    #         "creator_id": creator_id
    #     }
    #     response = self.client.table("knowledge_base").insert(data).execute()
    #     return KnowledgeBase(**response.data[0])

    # def mark_as_published(self, article_id: str, user_id: str) -> Article:
    #     data = {
    #         "published": True,
    #         "published_at": datetime.utcnow().isoformat(),
    #         "updated_at": datetime.utcnow().isoformat()
    #     }
    #     response = self.client.table("articles").update(data).eq(
    #         "id", article_id).eq("user_id", user_id).execute()
    #     return Article(**response.data[0])

    def upload_file(self, storage_name: str, path: str, file_body: bytes, file_options: Optional[dict] = None) -> str:
        """Upload a file to Supabase storage"""
        try:
            if file_options is None:
                file_options = {}
            # Upsert ensures that if a file with the same name exists, it's overwritten.
            file_options.setdefault("cache-control", "3600")
            file_options.setdefault("upsert", "true") 
            
            response = self.client.storage.from_(storage_name).upload(
                path=path,
                file=file_body,
                file_options=file_options
            )
            return response
        except Exception as e:
            print(f"Error uploading file: {e}")
            raise e

    def get_public_url(self, storage_name: str, path: str) -> str:
        """Get the public URL for a file in Supabase storage."""
        try:
            response = self.client.storage.from_(storage_name).get_public_url(path)
            return response
        except Exception as e:
            print(f"Error getting public URL: {e}")
            raise e
        
    # def upload_dataframe(self, path: str, df: pd.DataFrame) -> str:
    #     """Upload a pandas DataFrame as CSV to Supabase storage"""
    #     try:
    #         csv_data = df.to_csv(index=False).encode()
    #         response = self.client.storage.from_("article_list").upload(
    #             path,
    #             csv_data
    #         )
    #         return response
    #     except Exception as e:
    #         print(f"Error uploading DataFrame: {e}")
    #         raise e

    # def get_signed_url(self, storage_name: str, path: str, duration: int=60*60*24*7)->str:
    #     print(f"Getting signed URL for {path} in {storage_name}")
    #     response = self.client.storage.from_(storage_name).create_signed_url(path, duration)
    #     return response['signedURL']

    # def delete_file(self, storage_name: str, path: str)->bool:
    #     try:    
    #         self.client.storage.from_(storage_name).remove([path])
    #         return True
    #     except Exception as e:
    #         print(f"Error deleting file: {e}")
    #         return False

    # def get_articles(self, project_id: str, user_id: str, csv_file: Optional[str] = None) -> List[Article]:
    #     query = self.client.table("articles").select("*")
    #     if csv_file:
    #         query = query.eq("csv_file", csv_file)
    #     query = query.eq("project_id", project_id)
    #     query = query.eq("user_id", user_id)
    #     response = query.execute()
    #     return [Article(**article) for article in response.data]

    # def save_article(self, title: str, content: str, csv_file: str, keywords: List[str], references: List[str], project_id: str, user_id: str, tone: str) -> Article:
    #     data = {
    #         "title": title,
    #         "content": content,
    #         "csv_file": csv_file,
    #         "keywords": keywords,
    #         "references": references,
    #         "project_id": project_id,
    #         "user_id": user_id,
    #         "tone": tone
    #     }
    #     # print(f"Saving article: {data}", flush=True)
    #     response = self.client.table("articles").insert(data).execute()
    #     return Article(**response.data[0])

    # def delete_article(self, article_id: str, user_id: str) -> bool:
    #     """Delete an article from the database"""
    #     try:
    #         self.client.table('articles').delete().eq(
    #             'id', article_id).eq('user_id', user_id).execute()
    #         return True
    #     except Exception as e:
    #         print(f"Error deleting article: {str(e)}")
    #         return False

    def get_user(self, user_id: str):
        # This is just an example of one of the restored methods.
        # The full implementation will include all methods from the original file.
        # response = self.client.table("users").select(
        #     "*").eq("id", user_id).eq("is_deleted", False).execute().data
        # return User(**response[0]) if response else None
        pass # Placeholder for actual implementation

    def get_user_by_email(self, email: str):
        response = self.client.table("users").select("*").eq("email", email).execute()
        if response.data:
            return User(**response.data[0])
        else:
            raise ValueError(f"User with email {email} not found")

    # def get_owned_projects(self, user_id: str):
    #     response = self.client.table("projects").select(
    #         "*").eq("creator_id", user_id).eq("is_deleted", False).execute()
    #     return [Project(**project) for project in response.data]

    # def get_users_in_project(self, project_id: str):
    #     response = self.client.table("users").select("*").contains("project_ids", [project_id]).execute()
    #     return [User(**user) for user in response.data]

    # def get_enrolled_projects(self, user_id: str)->List[Project]:
    #     response = self.client.table("users").select("project_ids").eq("id", user_id).eq("is_deleted", False).execute()
    #     project_ids = response.data[0]['project_ids']
    #     return self.get_projects_by_ids(project_ids)

    # def add_project_to_user(self, project_id: str, user_id: str):
    #     """Add a project to the user's project list"""
    #     user = self.get_user(user_id)
    #     project_ids = user.project_ids
    #     if project_id in project_ids:
    #         return user
    #     project_ids.append(project_id)
    #     try:
    #         user = self.client.table("users").update({"project_ids": project_ids}).eq("id", user_id).execute().data
    #         return user
    #     except Exception as e:
    #         return False
        
    # def remove_project_from_user(self, project_id: str, user_id: str):
    #     """Remove a user from a project"""
    #     try:
    #         user = self.get_user(user_id)
    #         project_ids = user.project_ids
    #         project_ids.remove(project_id)
    #         self.client.table("users").update({"project_ids": project_ids}).eq("id", user_id).execute()
    #     except Exception as e:
    #         print(f"Error removing user {user_id} from project {project_id}: {e}")

    # def get_project(self, project_id: str, creator_id: str) -> dict:
    #     response = (self.client.table("projects").select("*")
    #                 .eq("id", project_id)
    #                 .eq("creator_id", creator_id)
    #                 .eq("is_deleted", False)
    #                 .execute())
    #     project = response.data[0]
    #     if not project:
    #         raise ValueError(f"Project with id {project_id} not found")
    #     if project.get("members_ids") is None:
    #         project["members_ids"] = []
    #     return project

    # def get_projects_by_ids(self, project_ids: List[str])->List[Project]:
    #     response = self.client.table("projects").select("*").in_("id", project_ids).eq("is_deleted", False).execute()
    #     return [Project(**project) for project in response.data]

    # def save_project(self, name: str, description: str, user_id: str) -> Project:
    #     """Save a project to the database and add it to the user's project list"""
    #     data = {
    #         "name": name,
    #         "description": description,
    #         "creator_id": user_id
    #     }
    #     response = self.client.table("projects").insert(data).execute()
    #     self.add_project_to_user(response.data[0]["id"], user_id)
    #     return Project(**response.data[0])

    # def update_project(self, project_id: str, project_name: str, project_description: str):
    #     data = {
    #         "name": project_name,
    #         "description": project_description,
    #         "updated_at": datetime.utcnow().isoformat()
    #     }
    #     self.client.table("projects").update(
    #         data).eq("id", project_id).eq("is_deleted", False).execute()
        
    # def get_project_by_name(self, project_name: str, user_id: str) -> Project:
    #     response = self.client.table("projects").select("*").eq("name", project_name).eq("creator_id", user_id).eq("is_deleted", False).execute()
    #     return Project(**response.data[0]) if response.data else None

    # def delete_project(self, project_id: str, user_id: str):
    #     try:
    #         self.client.table('projects').update(
    #             {"is_deleted": True}
    #         ).eq(
    #             'id', project_id).eq('creator_id', user_id).execute()
    #         return True
    #     except Exception as e:
    #         print(f"Error deleting project: {str(e)}")
    #         return False

    def save_blog_post(self, title: str, content: str, project_id: str, author_id: Optional[str] = None):
        data = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "title": title,
            "content": content,
            "status": "Created",
            "created_at": datetime.utcnow().isoformat(),
            "author_id": author_id
        }
        response = self.client.table("blog_posts").insert(data).execute()
        # return BlogPost(**response.data[0]) if response.data else None
        return response.data[0] if response.data else None

    def get_blog_post(self, blog_id: str) -> Optional[dict]:
        """Fetches a single blog post by its ID."""
        try:
            response = self.client.table("blog_posts").select("*").eq("id", blog_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching blog post {blog_id}: {e}")
            return None

    def update_blog_post(self, blog_id: str, data: dict) -> Optional[dict]:
        """Updates a blog post with new data."""
        try:
            response = self.client.table("blog_posts").update(data).eq("id", blog_id).execute()
            # The update operation in Supabase returns a list of updated records.
            # We return the first one, as we're updating by a unique ID.
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating blog post {blog_id}: {e}")
            return None

@cache
def get_supabase_client() -> SupabaseClient:
    return SupabaseClient()