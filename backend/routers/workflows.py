from ..utils.cache import multidomain_cache
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pathlib import Path
import uuid, datetime
from typing import List, Dict, Any
# import jsonschema
from ..services.flat_file_service import FlatFileService
from ..services.workflow_db_service import WorkflowDbService
from ..dependencies import get_project_id, get_current_user, get_workflow_db_service
from ..models.user import User
from ..models.workflow import (
    WorkflowDefinitionCreate,
    WorkflowDefinitionUpdate,
    WorkflowDefinition,
    WorkflowRunCreate,
    WorkflowRun,
    NodeRunHistory,
)
from ..services.workflow_engine import WorkflowEngine
from ..utils.cache import multidomain_cache


router = APIRouter(prefix="/workflows", tags=["workflows"])

# For simulation, load block list from a local JSON file if exists; otherwise fallback to hard-coded list
# default blocks moved to backend/db.json ('workflow_blocks')

DB_PATH = Path(__file__).resolve().parent.parent / "db.json"

# ---------------------------------------------------------------------------
# Temporary Flat-file storage (will be replaced by DB later)
# ---------------------------------------------------------------------------

# file_service = FlatFileService(DB_PATH)
# engine = WorkflowEngine(file_service)


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

WORKFLOW_DOMAIN = "workflows"
BLOCK_DOMAIN = "workflow_blocks"

@router.post("/", response_model=WorkflowDefinition, status_code=status.HTTP_201_CREATED)
def create_workflow(
    payload: WorkflowDefinitionCreate,
    project_id: uuid.UUID = Depends(get_project_id),
    current_user: User = Depends(get_current_user),
    db: WorkflowDbService = Depends(get_workflow_db_service),
):
    """Persist a new workflow definition for the current project."""
    print(f"API: Creating workflow '{payload.name}' for project {project_id}")
    workflow = db.create_workflow(payload, project_id, current_user.id)
    if not workflow:
        raise HTTPException(status_code=500, detail="Failed to create workflow")
    multidomain_cache.update_value(WORKFLOW_DOMAIN, str(project_id), workflow)
    return workflow



@router.get("/", response_model=List[WorkflowDefinition])
def list_workflows(
    project_id: uuid.UUID = Depends(get_project_id),
    db: WorkflowDbService = Depends(get_workflow_db_service),
):
    """Return all workflows belonging to the given project."""
    print(f"API: Listing workflows for project {project_id}")

    project_id_str: str = str(project_id)

    hit, cached = multidomain_cache.get(WORKFLOW_DOMAIN, project_id_str)  # type: Tuple[bool, Optional[List[WorkflowDefinition]]]
    if hit and cached is not None:
        return cached

    workflows = db.list_workflows(project_id)
    multidomain_cache.add(WORKFLOW_DOMAIN, project_id_str, workflows)

    return workflows



# -- Blocks catalogue --------------------------------------------------------

@router.get("/blocks")
async def list_blocks(db: WorkflowDbService = Depends(get_workflow_db_service)):
    """Return catalogue of available block types."""
    print("API: Listing all block types (cached)")

    # Reuse a shared multidomain cache to avoid hitting the DB on each request.
    # The catalogue is largely static, so a long TTL (default 5 h) is fine.
    cache_domain = "blocks"
    cache_key = "all"

    hit, cached_val = multidomain_cache.get(cache_domain, cache_key)
    if hit:
        return cached_val

    block_types = db.list_block_types()
    multidomain_cache.add(cache_domain, cache_key, block_types)
    return block_types


@router.get("/{workflow_id}", response_model=WorkflowDefinition)
def get_workflow(
    workflow_id: uuid.UUID,
    project_id: uuid.UUID = Depends(get_project_id),
    db: WorkflowDbService = Depends(get_workflow_db_service),
):

    cache_key = f"{project_id}:{workflow_id}"

    hit, cached = multidomain_cache.get(WORKFLOW_DOMAIN, cache_key)  # type: Tuple[bool, Optional[WorkflowDefinition]]
    if hit and cached is not None:
        return cached

    workflow = db.get_workflow(workflow_id, project_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    multidomain_cache.add(WORKFLOW_DOMAIN, cache_key, workflow)
    return workflow


# ---------------------------------------------------------------------------
# Run execution endpoints
# ---------------------------------------------------------------------------
@router.patch("/{workflow_id}", response_model=WorkflowDefinition)
async def update_workflow(
    workflow_id: uuid.UUID,
    payload: WorkflowDefinitionUpdate,
    project_id: uuid.UUID = Depends(get_project_id),
    db: WorkflowDbService = Depends(get_workflow_db_service),
):
    """Update mutable fields of a workflow."""
    print(f"API: Updating workflow {workflow_id}")
    updated = db.update_workflow(workflow_id, payload, project_id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # --- Cache Invalidation ---
    # When a workflow is updated, we need to clear the cached data to avoid staleness.
    
    # 1. Invalidate the list of all workflows for this project.
    multidomain_cache.invalidate(WORKFLOW_DOMAIN, str(project_id))
    
    # 2. Invalidate the specific workflow entry.
    cache_key = f"{project_id}:{workflow_id}"
    multidomain_cache.invalidate(WORKFLOW_DOMAIN, cache_key)

    return updated

@router.post("/{workflow_id}/run", response_model=WorkflowRun)
async def run_workflow(
    workflow_id: uuid.UUID,
    project_id: uuid.UUID = Depends(get_project_id),
    current_user: User = Depends(get_current_user),
    db: WorkflowDbService = Depends(get_workflow_db_service),
):
    """Execute the workflow immediately and return the run metadata."""

    # ensure definition is up-to-date
    multidomain_cache.invalidate(WORKFLOW_DOMAIN, f"{project_id}:{workflow_id}")

    wf = db.get_workflow(workflow_id, project_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # # --- Validation ---
    # catalogue = file_service.get("workflow_blocks", [])
    # block_map = {b["id"]: b for b in catalogue}
    # errors = []
    # # build edge map target->list of (inputKey,sourceId)
    # edge_map = {}
    # for e in wf.edges:
    #     ed = e if isinstance(e,dict) else e.dict()
    #     edge_map.setdefault(ed["target"], []).append(ed)
    # for n in wf.nodes:
    #     nd = n if isinstance(n,dict) else n.dict()
    #     meta = block_map.get(nd["data"]["blockType"])
    #     if not meta: continue
    #     required = meta.get("input_schema", {}).get("required", [])
    #     current_inputs = set(nd.get("data", {}).get("inputs", {}).keys())
    #     # plus from edges
    #     for ed in edge_map.get(nd["id"], []):
    #         ik = ed.get("data", {}).get("inputKey")
    #         if ik: current_inputs.add(ik)
    #     missing = [k for k in required if k not in current_inputs]
    #     if missing:
    #         errors.append({"node": nd["id"], "missing": missing})

    # if errors:
    #     raise HTTPException(status_code=422, detail={"msg":"Validation failed","errors":errors})
    
    run_payload = WorkflowRunCreate(
        workflow_id=wf.id,
        trigger_type="user",
        trigger_user_id=current_user.id,
        created_by=current_user.id,
    )
    
    engine = WorkflowEngine(db)
    run_record = await engine.run(wf, run_payload)
    return run_record


@router.get("/runs/{run_id}", response_model=WorkflowRun)
def get_run(run_id: uuid.UUID, db: WorkflowDbService = Depends(get_workflow_db_service)):
    """Return run and its node runs."""
    print(f"API: Getting details for run {run_id}")
    run = db.get_run_with_details(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/node-runs/{node_id}", response_model=NodeRunHistory)
def get_node_runs_history(
    node_id: str,
    project_id: uuid.UUID = Depends(get_project_id),
    db: WorkflowDbService = Depends(get_workflow_db_service),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Return paginated history of runs for a given node_id within a project."""
    print(f"API: Received request for node history. Node ID: {node_id}, Project ID: {project_id}, Page: {page}, Page Size: {page_size}")
    
    try:
        runs, total = db.get_node_runs_history(
            project_id=project_id,
            node_id=node_id,
            page=page,
            page_size=page_size
        )
        print(f"API: Successfully fetched {len(runs)} runs out of {total} total for node {node_id}.")
        return {"runs": runs, "total": total}
    except Exception as e:
        # It's good practice to catch potential errors from the service layer
        print(f"API Error fetching node run history: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching node run history.") 