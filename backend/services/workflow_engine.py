from __future__ import annotations

import asyncio
from typing import Dict, Any, List, Optional
import logging
from uuid import UUID
import inspect

from .workflow_db_service import WorkflowDbService
from .workflow_nodes import (
    reddit_search,
    google_search,
    competitor_analyzer,
    blog_generator,
    generate_image,
    query,
    cta_inserter,
    save_blog_post,
    writing_style_provider,
    translate_blog,
)

from ..models.workflow import (
    WorkflowDefinition,
    WorkflowRunCreate,
    WorkflowRun,
)

# Setup module logger
logger = logging.getLogger(__name__)

# Map block type id to async function
BLOCK_RUNNERS = {
    "RedditSearch": reddit_search,
    "GoogleSearch": google_search,
    "CompetitorAnalyzer": competitor_analyzer,
    "BlogGenerator": blog_generator,
    "GenerateImage": generate_image,
    "Query": query,
    "CTAInserter": cta_inserter,
    "SaveBlogPost": save_blog_post,
    "WritingStyleGuide": writing_style_provider,
    "TranslateBlog": translate_blog,
}


class WorkflowEngine:
    """Very small, in-process sequential executor."""

    def __init__(self, db_service: WorkflowDbService):
        self.db_service = db_service

    async def run(self, wf: WorkflowDefinition, run_payload: WorkflowRunCreate) -> WorkflowRun:
        """
        Creates a workflow run record and starts the execution in the background.
        """
        logger.info(f"Creating run record for workflow: {wf.name} (ID: {wf.id})")
        
        # This 'run' method is only for template-based (i.e., non-dynamic) workflows.
        # The run_definition should not be populated here.
        run = self.db_service.create_workflow_run(run_payload)
        if not run:
            raise RuntimeError("Failed to create a workflow run record in the database.")

        # Pass the fetched workflow definition directly to the executor
        asyncio.create_task(self._execute_run(wf, run))
        
        # Return the initial run record immediately
        return run

    async def run_sync(self, run_payload: WorkflowRunCreate) -> WorkflowRun:
        """
        Creates a workflow run record and executes the workflow synchronously,
        waiting for completion and returning the final state.
        This method supports both template-based and dynamic workflows.
        """
        logger.info(f"Creating synchronous run record for workflow: {run_payload.workflow_id or 'dynamic run'}")
        
        # 1. Create the initial run record in the DB
        run = self.db_service.create_workflow_run(run_payload)
        if not run:
            raise RuntimeError("Failed to create a synchronous workflow run record.")

        # 2. Get the workflow definition for the run
        wf = await self._get_definition_for_run(run)
        if not wf:
            error_msg = f"Could not resolve workflow definition for run {run.id}"
            self.db_service.update_run_status(run.id, "error", error_msg)
            raise RuntimeError(error_msg)

        # 3. Execute the workflow steps
        await self._execute_run(wf, run)

        # 4. Fetch the final, detailed run record to return to the caller
        final_run = self.db_service.get_run_with_details(run.id)
        if not final_run:
            # This should ideally not happen if the run was just created and executed
            raise RuntimeError(f"Failed to fetch the final state of run {run.id}")
            
        return final_run

    async def run_sync_from_run(self, run: WorkflowRun):
        """
        Executes a workflow synchronously from an existing, fully-formed run object.
        This is intended to be called from a background task where the run record
        has already been created.
        """
        logger.info(f"Executing synchronous task from pre-existing run: {run.id}")
        
        # 1. Get the workflow definition for the run
        wf = await self._get_definition_for_run(run)
        if not wf:
            error_msg = f"Could not resolve workflow definition for run {run.id}"
            self.db_service.update_run_status(run.id, "error", error_msg)
            # Since this runs in the background, we just log and return.
            logger.error(error_msg)
            return

        # 2. Execute the workflow steps
        await self._execute_run(wf, run)
        
        # 3. Execution is complete. The status is updated within _execute_run.
        # No need to return anything as this is a background fire-and-forget task.
        logger.info(f"Background task for run {run.id} finished.")

    async def _get_definition_for_run(self, run: WorkflowRun) -> Optional[WorkflowDefinition]:
        """
        Resolves the workflow definition for a given run.
        If the run has a workflow_id, it fetches from the DB.
        Otherwise, it constructs the definition from the run's 'run_definition' field.
        """
        if run.workflow_id:
            # This is a standard, template-based run. Fetch the definition from the DB.
            # Assuming project_id can be inferred or is not needed for this internal fetch
            # This might need adjustment if project context is required for security.
            logger.info(f"Fetching definition for template-based run. Workflow ID: {run.workflow_id}")
            # We don't have project_id here, which is a potential issue.
            # For now, let's assume we can get it or the DB service method is adapted.
            # This part of the logic is NOT used by our dynamic generator, so it's a lower-priority concern for now.
            # A proper implementation might require passing project_id down.
            # wf = self.db_service.get_workflow(run.workflow_id, project_id)
            # return wf
            # Let's return None for now to highlight this dependency.
            return None # Placeholder - needs project_id to be implemented correctly
        
        elif run.run_definition:
            # This is a dynamic, ephemeral run. The definition is embedded in the run record.
            logger.info("Constructing definition from ephemeral 'run_definition' field.")
            try:
                return WorkflowDefinition.model_validate(run.run_definition)
            except Exception as e:
                logger.error(f"Failed to validate ephemeral definition: {e}")
                return None
        
        return None

    async def _execute_run(self, wf: WorkflowDefinition, run: WorkflowRun):
        """
        The core execution loop for a workflow run.
        """
        logger.info(f"Background execution started for run ID: {run.id}")
        node_map: Dict[str, Dict[str, Any]] = { (n.id if hasattr(n,'id') else n['id']) : (n if isinstance(n,dict) else n.model_dump()) for n in wf.nodes }
        adjacency, in_deg = self._build_graph(wf)

        # Kahn's algorithm for topological sort
        order: List[str] = []
        queue = [nid for nid, deg in in_deg.items() if deg == 0]
        while queue:
            nid = queue.pop(0)
            order.append(nid)
            for tgt in adjacency.get(nid, []):
                in_deg[tgt] -= 1
                if in_deg[tgt] == 0:
                    queue.append(tgt)

        if len(order) != len(node_map):
            error_msg = "Cycle detected in workflow graph, cannot execute."
            logger.error(f"Failed to run workflow {wf.id}: {error_msg}")
            logger.error(f"order {order}: node_map {wf.edges}")
            self.db_service.update_run_status(run.id, "error", error_message=error_msg)
            return

        node_results: Dict[str, Any] = {}

        for node_id in order:
            node_dict = node_map[node_id]
            block_type = node_dict["data"]["blockType"]
            
            nr = self.db_service.create_node_run(run.id, node_id, block_type)
            if not nr:
                # If we can't even create a node run record, something is very wrong.
                error_msg = f"Failed to create a run record for node {node_id}"
                self.db_service.update_run_status(run.id, "error", error_message=error_msg)
                return
                
            try:
                func = BLOCK_RUNNERS.get(nr.block_type)
                if func is None:
                    raise RuntimeError(f"No runner for block {nr.block_type}")

                inputs = self._collect_inputs(node_id, node_dict, wf, node_results)
                
                # The engine provides its own context arguments that some nodes might need.
                run_context = {
                    "db_service": self.db_service,
                    "workflow_run": run,
                    "project_id": wf.project_id
                }
                
                # Get the signature of the target function to pass only the arguments it accepts.
                func_params = inspect.signature(func).parameters
                
                # Combine all possible sources of arguments.
                all_possible_args = {**inputs, **run_context}

                # Filter the arguments to pass only what the function can accept.
                final_args = {}
                for param_name, param in func_params.items():
                    if param_name in all_possible_args:
                        final_args[param_name] = all_possible_args[param_name]
                    # Handle **kwargs in the function signature if present
                    elif param.kind == inspect.Parameter.VAR_KEYWORD:
                        # If the function has **kwargs, pass all other args to it.
                        final_args.update(all_possible_args)
                        break

                logger.info(f"Executing node {nr.node_id} ({nr.block_type}) with final args: {list(final_args.keys())}")
                
                # For logging, we want to save the inputs that are not part of the engine's context.
                inputs_to_save = {k: v for k, v in final_args.items() if k not in run_context}
                
                if inspect.iscoroutinefunction(func):
                    output = await func(**final_args)
                else:
                    loop = asyncio.get_event_loop()
                    output = await loop.run_in_executor(None, lambda: func(**final_args))

                logger.info(f"Node {nr.node_id} succeeded.")
                self.db_service.update_node_run(nr.id, "success", input_data=inputs_to_save, output_data=output)
                node_results[node_dict["id"]] = output
                
            except Exception as exc:
                logger.error(f"Node {nr.node_id} ({nr.block_type}) failed: {exc}", exc_info=True)
                error_output = {"error": str(exc)}
                # In case of failure, `final_args` might not be available.
                # `inputs` is the best we have for debugging purposes.
                self.db_service.update_node_run(nr.id, "failed", input_data=inputs, output_data=error_output, error_message=str(exc))
                self.db_service.update_run_status(run.id, "error", error_message=f"Error in node {nr.node_id}: {str(exc)}")
                
                # We stop the execution here
                return

        logger.info(f"Workflow run {run.id} completed successfully.")
        self.db_service.update_run_status(run.id, "success")
        
        # The run is finished, no need to return anything as this is a background task.

    # ---------------------------------------------------------------------
    # Helper methods
    # ---------------------------------------------------------------------

    def _build_graph(self, wf: WorkflowDefinition):
        adjacency: Dict[str, List[str]] = {}
        in_deg: Dict[str, int] = {}
        for n in wf.nodes:
            nid = n.id if hasattr(n, 'id') else n['id']
            in_deg[nid] = 0
        for e in wf.edges:
            ed = e if isinstance(e, dict) else e.model_dump()
            src, tgt = ed['source'], ed['target']
            adjacency.setdefault(src, []).append(tgt)
            in_deg[tgt] = in_deg.get(tgt, 0) + 1
        return adjacency, in_deg

    def _collect_inputs(
        self, node_id: str, node_dict: Dict[str, Any], wf: WorkflowDefinition, node_results: Dict[str, Any]
    ):
        node_data = node_dict.get('data', {})
        
        # Start with static inputs defined on the node itself
        inputs = {k: v for k, v in node_data.items() if k not in ['blockType', 'label', 'inputs']}
        if 'inputs' in node_data and isinstance(node_data['inputs'], dict):
            inputs.update(node_data['inputs'])

        for e in wf.edges:
            ed = e if isinstance(e, dict) else e.model_dump()
            if ed['target'] != node_id:
                continue
            
            src_id = ed['source']
            src_output = node_results.get(src_id)

            if isinstance(src_output, dict):
                # If the source output is a dictionary, merge it into the inputs.
                # This allows a single upstream node to provide multiple inputs
                # (e.g., the entire blog_post object, plus the query).
                inputs.update(src_output)
            else:
                # Fallback for simple, non-dict outputs.
                target_input_name = ed.get('data', {}).get('inputKey')
                if target_input_name and src_output is not None:
                    inputs[target_input_name] = src_output
            
        return inputs 