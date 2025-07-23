import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { useProjects } from '../context/ProjectContext';
import { ExpandedDataView } from '../workflow-builder/DataViewer';
import useWorkflowStore from '../workflow-builder/workflowState';
import FunctionNode from '../workflow-builder/nodeTypes/FunctionNode'; // Use the original node
import './RunTraceModal.css';

// --- Helper Functions from NodeHistoryModal ---
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  try {
    const duration = (new Date(end) - new Date(start)) / 1000;
    return `${duration.toFixed(2)}s`;
  } catch (e) {
    return 'N/A';
  }
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 172;
const nodeHeight = 52; // Increased height for the new node design

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const nodeTypes = {
    functionNode: FunctionNode, // Register the original FunctionNode
};

const RunTraceModalInternal = ({ runId, blogTitle, onClose }) => {
  const { apiClient } = useProjects();
  const [layoutedElements, setLayoutedElements] = useState({ nodes: [], edges: [] });
  const [expandedNodeRun, setExpandedNodeRun] = useState({ id: null, contentType: null });
  
  // State to hold the workflow definition if fetched separately (for legacy runs)
  const [fetchedWorkflowDef, setFetchedWorkflowDef] = useState(null);

  // Get catalogue state and fetcher from the store
  const { blockCatalogue, setBlockCatalogue } = useWorkflowStore(state => ({
    blockCatalogue: state.blockCatalogue,
    setBlockCatalogue: state.setBlockCatalogue
  }));

  // Fetch block catalogue if it's not already loaded
  useEffect(() => {
    if (Object.keys(blockCatalogue).length === 0 && apiClient) { // Add apiClient check for safety
      apiClient.get('/workflows/blocks')
        .then(response => {
            const catalogueData = response.data.reduce((acc, block) => {
                acc[block.id] = block; // Use block.id as key, matching FunctionNode's expectation
                return acc;
            }, {});
            setBlockCatalogue(catalogueData);
        })
        .catch(error => console.error("Failed to fetch block catalogue:", error));
    }
  }, [blockCatalogue, setBlockCatalogue, apiClient]);


  const { data: runData, isLoading, isError, error } = useQuery({
    queryKey: ['workflowRun', runId],
    queryFn: () => apiClient.get(`/workflows/runs/${runId}`).then(res => res.data),
    enabled: !!runId,
  });

  // --- Determine the source of workflow nodes and edges ---
  // For dynamic runs, run_definition is directly on runData.
  // For legacy runs, we need to fetch the workflow_id.
  const currentWorkflowNodes = runData?.run_definition?.nodes || fetchedWorkflowDef?.nodes || [];
  const currentWorkflowEdges = runData?.run_definition?.edges || fetchedWorkflowDef?.edges || [];

  const nodeRuns = runData?.node_runs || [];

  // Fetch workflow definition if it's a legacy run and not already fetched
  useEffect(() => {
    if (runData && !runData.run_definition && runData.workflow_id && !fetchedWorkflowDef && apiClient) {
      apiClient.get(`/workflows/${runData.workflow_id}`)
        .then(response => {
          setFetchedWorkflowDef(response.data);
        })
        .catch(error => {
          console.error("Failed to fetch legacy workflow definition:", error);
          setFetchedWorkflowDef({ nodes: [], edges: [] }); // Set empty to avoid re-fetching on error
        });
    }
  }, [runData, fetchedWorkflowDef, apiClient]);

  const handleToggleExpand = (runId, contentType) => {
    if (expandedNodeRun.id === runId && expandedNodeRun.contentType === contentType) {
        setExpandedNodeRun({ id: null, contentType: null }); // Close if same button clicked
    } else {
        setExpandedNodeRun({ id: runId, contentType: contentType }); // Open new or switch content
    }
  };

  useEffect(() => {
    if (currentWorkflowNodes.length > 0 && Object.keys(blockCatalogue).length > 0) {
      const formattedNodes = currentWorkflowNodes.map(node => {
        const nodeRun = runData?.node_runs?.find(nr => nr.node_id === node.id);
        return {
            id: node.id,
            // This data structure now exactly matches what FunctionNode expects
            data: {
                label: node.data.blockType,
                blockType: node.data.blockType,
                status: nodeRun?.status, // Let FunctionNode handle the styling
            },
            position: node.position, // Will be overwritten by layout
            type: 'functionNode', // Use the 'functionNode' type
        }
      });
      const formattedEdges = currentWorkflowEdges.map((edge, i) => ({
          ...edge,
          id: `e-${edge.source}-${edge.target}-${i}`,
          animated: runData?.node_runs?.find(nr => nr.node_id === edge.source)?.status === 'running',
          style: { strokeWidth: 1 }
      }));
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        formattedNodes,
        formattedEdges,
        'LR'
      );
      setLayoutedElements({ nodes: layoutedNodes, edges: layoutedEdges });

    }
  }, [runData, currentWorkflowNodes, currentWorkflowEdges, blockCatalogue]); // Use currentWorkflowNodes/Edges as dependencies


  if (!runId) return null;

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal-content" onClick={e => e.stopPropagation()}>
        <div className="rt-modal-header">
          <h3>Run Trace - {blogTitle}</h3>
          <button onClick={onClose} className="rt-close-btn">&times;</button>
        </div>
        <div className="rt-modal-body">
          <div className="rt-top-pane">
            <ReactFlow
                nodes={layoutedElements.nodes}
                edges={layoutedElements.edges}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                fitView
            >
                <Controls showInteractive={false} />
                <Background />
            </ReactFlow>
          </div>
          <div className="rt-bottom-pane-table">
            {isLoading && <div className="rt-loading">Loading run data...</div>}
            {isError && <div className="rt-error">Error: {error.message}</div>}
            {runData && (
              <div className="rt-table-container">
                <table className="rt-history-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Output Data</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeRuns.length > 0 ? nodeRuns.map(run => {
                      const agent = currentWorkflowNodes.find(n => n.id === run.node_id);
                      const isDataExpandable = run.output !== null && run.output !== undefined;
                      const isErrorExpandable = run.error_message;

                      return (
                        <React.Fragment key={run.id}>
                            <tr>
                                <td>{agent?.data?.blockType || run.node_id}</td>
                                <td>{formatDateTime(run.started_at)}</td>
                                <td>{calculateDuration(run.started_at, run.finished_at)}</td>
                                <td><span className={`rt-status ${run.status}`}>{run.status}</span></td>
                                <td className="rt-data-cell">
                                    {isDataExpandable ? (
                                        <button className="rt-view-btn" onClick={() => handleToggleExpand(run.id, 'output')}>
                                            {(expandedNodeRun.id === run.id && expandedNodeRun.contentType === 'output') ? 'Hide' : 'View Data'}
                                        </button>
                                    ) : 'N/A'}
                                </td>
                                <td className="rt-error-cell">
                                    {isErrorExpandable ? (
                                        <button className="rt-view-btn error" onClick={() => handleToggleExpand(run.id, 'error')}>
                                            {(expandedNodeRun.id === run.id && expandedNodeRun.contentType === 'error') ? 'Hide' : 'View Error'}
                                        </button>
                                    ) : 'N/A'}
                                </td>
                            </tr>
                            {expandedNodeRun.id === run.id && (
                                <tr className="rt-expansion-row">
                                    <td colSpan="6">
                                        <ExpandedDataView data={expandedNodeRun.contentType === 'output' ? run.output : run.error_message} />
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                      )
                    }) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No node runs found for this workflow execution.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RunTraceModal = (props) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    if (!isMounted) {
        return null;
    }

    return ReactDOM.createPortal(
        <RunTraceModalInternal {...props} />,
        document.body
    );
};

export default RunTraceModal; 