from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from supabase import Client
import logging
import yaml
import json
from backend.utils.slugify import slugify

from ..models.workflow import (
    WorkflowDefinition,
    WorkflowDefinitionCreate,
    WorkflowDefinitionUpdate,
    WorkflowRun,
    WorkflowRunCreate,
    NodeRun,
)
from ..models.workflow_template import WorkflowTemplate
from ..models.blog_post import BlogPost
from ..models.blog_prompt import BlogPrompt
from ..models.media_file import MediaFile, MediaFileCreate


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)

logging.basicConfig(level=logging.INFO)


class WorkflowDbService:
    def __init__(self, client: Client):
        self.client = client

    def _iso_ts(self):
        return datetime.utcnow().isoformat() + "Z"

    def list_block_types(self) -> List[Dict[str, Any]]:
        """Load block catalogue from the database."""
        print("DB: Listing block types from database table.")
        try:
            response = self.client.table("workflow_block_types").select("*").eq("deprecated", False).execute()
            return response.data or []
        except Exception as e:
            logging.error(f"Error reading block types from database: {e}")
            return []

    def list_workflows(self, project_id: UUID) -> List[WorkflowDefinition]:
        print(f"DB: Listing workflows for project {project_id}")
        response = self.client.table("workflow_definitions").select("*").eq("project_id", str(project_id)).is_("deleted_at", "NULL").execute()
        data = response.data or []
        return [WorkflowDefinition.model_validate(w) for w in data]

    def get_workflow(self, workflow_id: UUID, project_id: UUID) -> Optional[WorkflowDefinition]:
        print(f"DB: Getting workflow {workflow_id}")
        response = self.client.table("workflow_definitions").select("*").eq("id", str(workflow_id)).eq("project_id", str(project_id)).is_("deleted_at", "NULL").maybe_single().execute()
        return WorkflowDefinition.model_validate(response.data) if response.data else None

    def create_workflow(
        self, payload: WorkflowDefinitionCreate, project_id: UUID, user_id: UUID
    ) -> Optional[WorkflowDefinition]:
        print(f"DB: Creating workflow definition '{payload.name}'")
        
        # Note: 'created_by' is not in the workflow_definitions table schema
        record = payload.model_dump()
        record['project_id'] = str(project_id)
        
        response = self.client.table("workflow_definitions").insert(record).execute()
        return WorkflowDefinition.model_validate(response.data[0]) if response.data else None

    def update_workflow(
        self, workflow_id: UUID, payload: WorkflowDefinitionUpdate, project_id: UUID
    ) -> Optional[WorkflowDefinition]:
        print(f"DB: Updating workflow {workflow_id}")
        update_data = payload.model_dump(exclude_unset=True)

        if not update_data:
            return self.get_workflow(workflow_id, project_id)

        response = (
            self.client.table("workflow_definitions")
            .update(update_data)
            .eq("id", str(workflow_id))
            .eq("project_id", str(project_id))
            .execute()
        )
        return WorkflowDefinition.model_validate(response.data[0]) if response.data else None
    
    def get_workflow_template_by_name(self, template_name: str) -> Optional[WorkflowTemplate]:
        """Fetches a single workflow template by its unique name."""
        print(f"DB: Getting workflow template by name: {template_name}")
        response = (
            self.client.table("workflow_templates")
            .select("*")
            .eq("name", template_name)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return WorkflowTemplate.model_validate(response.data) if response.data else None

    def create_workflow_run(self, payload: WorkflowRunCreate) -> Optional[WorkflowRun]:
        print(f"DB: Creating run for workflow {payload.workflow_id or 'dynamic run'}")
        record = payload.model_dump(mode='json')

        # Supabase client expects string UUIDs, handle nulls gracefully
        if record.get('workflow_id'):
            record['workflow_id'] = str(record['workflow_id'])
        if record.get('trigger_user_id'):
            record['trigger_user_id'] = str(record['trigger_user_id'])
        if record.get('created_by'):
            record['created_by'] = str(record['created_by'])
            
        response = self.client.table("workflow_runs").insert(record).execute()
        
        if not response.data:
            return None

        # The response data needs to be validated against the full WorkflowRun model
        return WorkflowRun.model_validate(response.data[0])

    def update_run_status(self, run_id: UUID, status: str, error_message: Optional[str] = None):
        print(f"DB: Updating run {run_id} status to '{status}'")
        finished_at = self._iso_ts() if status in ["success", "error"] else None
        
        update_payload = {"status": status, "finished_at": finished_at}
        if error_message:
            update_payload["error_message"] = error_message
            
        self.client.table("workflow_runs").update(update_payload).eq("id", str(run_id)).execute()

    def create_node_run(self, run_id: UUID, node_id: str, block_type: str) -> Optional[NodeRun]:
        print(f"DB: Creating node run for node {node_id} in run {run_id}")
        record = {
            "workflow_run_id": str(run_id),
            "node_id": node_id,
            "block_type": block_type,
            "status": "running",
            "started_at": self._iso_ts(),
        }
        response = self.client.table("node_runs").insert(record).execute()
        return NodeRun.model_validate(response.data[0]) if response.data else None

    def update_node_run(self, node_run_id: UUID, status: str, input_data: Optional[Dict[str, Any]] = None, output_data: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None):
        print(f"DB: Updating node run {node_run_id} status to '{status}'")
        update_payload = {"status": status, "finished_at": self._iso_ts()}
        
        if input_data is not None:
            update_payload["input"] = json.loads(json.dumps(input_data, cls=CustomJSONEncoder))
        if output_data is not None:
            update_payload["output"] = json.loads(json.dumps(output_data, cls=CustomJSONEncoder))
        if error_message:
            update_payload["error_message"] = error_message
        
        self.client.table("node_runs").update(update_payload).eq("id", str(node_run_id)).execute()

    def create_media_file(self, media_file_data: MediaFileCreate) -> Optional[MediaFile]:
        """Saves a new media file record to the database."""
        print(f"--> DB Service: Saving media file with path '{media_file_data.path}'")
        try:
            record = media_file_data.model_dump()
            record['project_id'] = str(record['project_id'])
            
            response = self.client.table("media_files").insert(record).execute()
            
            if response.data:
                return MediaFile.model_validate(response.data[0])
            return None
        except Exception as e:
            logging.error(f"Error saving media file to database: {e}")
            return None

    def get_run_with_details(self, run_id: UUID) -> Optional[WorkflowRun]:
        print(f"DB: Getting run with details for run {run_id}")
        response = self.client.table("workflow_runs").select("*, node_runs(*)").eq("id", str(run_id)).maybe_single().execute()
        
        if not response.data:
            return None
        
        # Pydantic will handle the parsing and validation
        return WorkflowRun.model_validate(response.data)

    def get_prompt_by_id(self, prompt_id: UUID) -> Optional[BlogPrompt]:
        """Fetches a blog prompt by its ID."""
        print(f"DB: Getting prompt {prompt_id}")
        try:
            # Log the prompt ID to ensure we're using the correct format
            prompt_id_str = str(prompt_id)
            print(f"Querying for prompt with ID: {prompt_id_str}")
            
            response = (
                self.client.table("blog_prompts")
                .select("*")
                .eq("id", prompt_id_str)
                .maybe_single()
                .execute()
            )
            
            
            if response.data:
                return BlogPrompt.model_validate(response.data)
            else:
                print(f"No prompt found with ID: {prompt_id_str}")
            return None
        except Exception as e:
            logging.error(f"Error reading prompt from database: {e}")
            print(f"Exception when getting prompt {prompt_id}: {e}")
            return None

    def get_prompt_text(self, prompt_id: UUID) -> Optional[str]:
        """Fetches the text content of a single prompt by its ID."""
        print(f"DB: Getting text for prompt {prompt_id}")
        try:
            response = (
                self.client.table("blog_prompts")
                .select("writing_style_guide")
                .eq("id", str(prompt_id))
                .maybe_single()
                .execute()
            )
            if response.data:
                return response.data.get("writing_style_guide")
            return None
        except Exception as e:
            logging.error(f"Error reading prompt text from database: {e}")
            return None

    def get_node_runs_history(
        self, project_id: UUID, node_id: str, page: int, page_size: int
    ) -> (List[NodeRun], int):
        """
        Fetches a paginated history of runs for a specific node within a project.
        """
        print(f"DB: Getting history for node {node_id} in project {project_id}, page {page}")

        workflows_response = self.client.table("workflow_definitions").select("id").eq("project_id", str(project_id)).execute()
        if not workflows_response.data:
            print(f"DB: No workflows found for project {project_id}. Returning empty history.")
            return [], 0
        
        workflow_ids = [w['id'] for w in workflows_response.data]
        print(f"DB: Found {len(workflow_ids)} workflows for project.")

        runs_response = self.client.table("workflow_runs").select("id").in_("workflow_id", workflow_ids).execute()
        if not runs_response.data:
            print(f"DB: No workflow runs found for this project's workflows. Returning empty history.")
            return [], 0
            
        run_ids = [r['id'] for r in runs_response.data]
        print(f"DB: Found {len(run_ids)} total runs across workflows.")

        offset = (page - 1) * page_size
        
        node_runs_response = (
            self.client.table("node_runs")
            .select("*", count="exact")
            .in_("workflow_run_id", run_ids)
            .eq("node_id", node_id)
            .order("started_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        total_count = node_runs_response.count or 0
        runs_data = [NodeRun.model_validate(r) for r in node_runs_response.data]

        print(f"DB: Found {len(runs_data)} node runs on this page for node {node_id}. Total count: {total_count}.")
        return runs_data, total_count

    def save_blog_post(
        self,
        project_id: UUID,
        author_id: UUID,
        title: str,
        body: str,
        description: str,
        tags: list,
        categories: list,
        image_urls: Optional[list] = None,
        workflow_run_id: Optional[UUID] = None,
        blog_meta_data: Optional[dict] = None,
    ) -> Optional[BlogPost]:
        """Constructs markdown and saves a new blog post, returning the full object."""
        print(f"--> DB Service: Attempting to save blog post titled '{title}'")

        
        frontmatter_dict = {
            "title": title,
            "date": datetime.now(timezone.utc).isoformat(),
            "description": description,
            "tags": tags,
            "categories": categories,
        }
        
        frontmatter_dict = {k: v for k, v in frontmatter_dict.items() if v or k in ['title', 'date']}
        frontmatter_str = yaml.dump(frontmatter_dict, sort_keys=False, allow_unicode=True)
        
        # Prepend the featured image markdown to the main body content.
        md_content = f"---\n{frontmatter_str}---\n\n{body}\n"
        
        post_id = str(uuid4())
        
        post_slug = slugify(f"{title}-{post_id.split('-')[-1]}", max_len=None)

        post_to_create = {
            "id": post_id,
            "project_id": str(project_id),
            "title": title,
            "content": md_content,
            "status": "draft",
            "author_id": str(author_id),
            "image_urls": image_urls or [],
            "workflow_run_id": str(workflow_run_id) if workflow_run_id else None,
            "blog_meta_data": blog_meta_data or None,
            "slug": post_slug,
        }
        print(f"--> DB Service: Inserting record with status 'draft'...")
        
        try:
            response = self.client.table("blog_posts").insert(post_to_create).execute()
            if response.data:
                print(f"--> DB Service: Save successful. Raw response from DB: {response.data[0]}")
                # Return the full BlogPost object, validated by Pydantic
                validated_post = BlogPost.model_validate(response.data[0])
                print(f"--> DB Service: Returning validated BlogPost object with ID: {validated_post.id}")
                return validated_post
            print("--> DB Service: Insert operation returned no data.")
            return None
        except Exception as e:
            print(f"--> DB Service: !! Exception while saving blog post: {e}")
            logging.error(f"Error saving blog post to database: {e}")
            return None 
        