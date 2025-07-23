import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
import copy

from backend.dependencies import get_current_user, get_workflow_db_service
from backend.models.user import User
from backend.services.workflow_db_service import WorkflowDbService
from backend.services.workflow_engine import WorkflowEngine
from backend.models.workflow import WorkflowRunCreate

# The name of the master template created in the UI.
MASTER_TEMPLATE_NAME = "SYSTEM_DEFAULT_BLOG_GENERATION"

router = APIRouter(
    prefix="/generate",
    tags=["Blog Generation"]
)

class BlogGenerationRequest(BaseModel):
    project_id: UUID = Field(..., description="The project to associate this blog post with.")
    topic: str = Field(..., description="The topic or query for the blog post generation.")
    language: str = Field(default="en", description="The language for the blog post.")
    writing_style_prompt_id: Optional[UUID] = Field(None, description="The ID of the writing style prompt to use.")
    include_reddit: bool = Field(default=False, description="Whether to use Reddit as a data source.")
    include_google: bool = Field(default=False, description="Whether to use Google Search as a data source.")
    include_images: bool = Field(default=False, description="Whether to generate images for the blog post.")
    num_images: int = Field(default=3, description="The number of images to generate.")
    include_translation: bool = Field(default=False, description="Whether to translate the blog post.")
    target_languages: Optional[list[str]] = Field(None, description="A list of language codes to translate the post into.")

class BlogGenerationResponse(BaseModel):
    run_id: UUID = Field(..., description="The ID of the workflow run that was started.")

@router.post("/blog-post", response_model=BlogGenerationResponse)
async def generate_blog_post(
    request: BlogGenerationRequest,
    background_tasks: BackgroundTasks,
    db: WorkflowDbService = Depends(get_workflow_db_service),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a blog post by dynamically assembling and running a workflow
    based on a master template stored in the database.
    """
    print(f"--> Received async blog generation request: {request.model_dump_json(indent=2)}")
    engine = WorkflowEngine(db)

    # 1. Fetch the master template from the database by its well-known name
    master_template = db.get_workflow_template_by_name(MASTER_TEMPLATE_NAME)
    if not master_template:
        raise HTTPException(
            status_code=500,
            detail=f"Master template '{MASTER_TEMPLATE_NAME}' not found. Please create it in the UI."
        )

    # 2. Clone the definition for this specific run
    run_def = copy.deepcopy(master_template.workflow_definition)
    nodes = run_def.get("nodes", [])
    edges = run_def.get("edges", [])

    # 3. Prune optional nodes based on the request
    # First, collect all IDs of nodes that will remain
    remaining_node_ids = set()

    # Filter nodes first based on request flags
    temp_nodes = []
    for n in nodes:
        block_type = n["data"]["blockType"]
        if (block_type == "WritingStyleGuide" and not request.writing_style_prompt_id) or \
           (block_type == "RedditSearch" and not request.include_reddit) or \
           (block_type == "GoogleSearch" and not request.include_google) or \
           (block_type == "GenerateImage" and not request.include_images) or \
           (block_type == "TranslateBlog" and (not request.include_translation or not request.target_languages)):
            continue # Skip this node
        temp_nodes.append(n)
        remaining_node_ids.add(n["id"])
    nodes = temp_nodes # Update the nodes list after pruning

    # Filter edges: only keep edges where both source and target nodes still exist
    temp_edges = []
    for e in edges:
        if e["source"] in remaining_node_ids and e["target"] in remaining_node_ids:
            temp_edges.append(e)
    edges = temp_edges # Update the edges list after pruning


    # 4. Inject dynamic, per-request inputs into the remaining nodes
    def put_input(block_type: str, key: str, value):
        for n in nodes:
            if n["data"]["blockType"] == block_type:
                if "data" not in n: n["data"] = {}
                if "inputs" not in n["data"]: n["data"]["inputs"] = {}
                n["data"]["inputs"][key] = value
                break

    put_input("Query", "query", request.topic)
    if request.writing_style_prompt_id:
        put_input("WritingStyleGuide", "prompt_id", str(request.writing_style_prompt_id))
    if request.include_images:
        put_input("GenerateImage", "num_images", request.num_images)
    if request.target_languages:
        put_input("TranslateBlog", "languages", request.target_languages)

    # 5. Build the final, ephemeral run definition
    run_definition_dict = {
        "id": str(uuid.uuid4()),
        "name": f"Dynamic Blog - {request.topic[:25]}",
        "project_id": str(request.project_id),
        "nodes": nodes,
        "edges": edges,
        "is_template": False,
    }

    run_payload = WorkflowRunCreate(
        workflow_id=None,
        run_definition=run_definition_dict,
        trigger_type="user",
        trigger_user_id=current_user.id,
        created_by=current_user.id,
    )

    try:
        initial_run = db.create_workflow_run(run_payload)
        if not initial_run:
            raise HTTPException(status_code=500, detail="Failed to create workflow run record.")

        print(f"--> Starting background workflow task for run ID: {initial_run.id}")
        background_tasks.add_task(engine.run_sync_from_run, initial_run)

        return BlogGenerationResponse(run_id=initial_run.id)

    except Exception as e:
        print(f"!!! An unexpected error occurred during async workflow submission: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
        
        