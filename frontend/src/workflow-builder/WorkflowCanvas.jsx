import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useWorkflowStore from './workflowState.js';
import './style.css';
import FunctionNode from './nodeTypes/FunctionNode.jsx';

const nodeTypes = {
  functionNode: FunctionNode,
};

const FlowInner = ({ nodes: propNodes, edges: propEdges }) => {
  const store = useWorkflowStore();
  const { project } = useReactFlow();

  const nodes = propNodes || store.nodes;
  const edges = propEdges || store.edges;
  const setNodes = store.setNodes;
  const setEdges = store.setEdges;
  const onNodesChange = useCallback((changes) =>
    setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) =>
    setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const enrichedNodes = useMemo(() => {
    if (!store.lastRun?.node_runs) return nodes;
    return nodes.map(node => {
      const nodeRun = store.lastRun.node_runs.find(nr => nr.node_id === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          status: nodeRun?.status,
        },
      };
    });
  }, [nodes, store.lastRun]);

  const onConnect = useCallback((params) => {
    console.log('Connection attempt:', {
      params,
      sourceNode: nodes.find(n => n.id === params.source),
      targetNode: nodes.find(n => n.id === params.target)
    });

      // Determine which input key of target node this edge fulfills
      const targetNode = nodes.find((n) => n.id === params.target);
    const sourceNode = nodes.find((n) => n.id === params.source);
    if (!targetNode || !sourceNode) return;
    
      const { blockCatalogue } = useWorkflowStore.getState();
      const meta = blockCatalogue[targetNode.data.blockType];
      if (meta?.type === 'data') {
      console.log('Rejecting connection: target is a data block');
        return; // data blocks are sources only
      }

    // Handle other connections
      let inputKey = null;
      if (meta?.input_schema?.properties) {
        // Suggest keys that have `source` mapping matching source block
      const possibles = Object.entries(meta.input_schema.properties)
        .filter(([, v]) => {
          if (!v.source || !Array.isArray(v.source)) {
            return false;
          }
          return v.source.some((s) => s.block === params.source.split('_')[0]);
        })
        .map(([k]) => k);
      
      console.log('Possible input keys:', {
        sourceBlock: params.source.split('_')[0],
        possibleKeys: possibles,
        schema: meta.input_schema.properties
      });

        if (possibles.length === 1) inputKey = possibles[0];
        else if (possibles.length > 1) {
          store.showEdgeSelector({
            possibleKeys: possibles,
            onSelect: (selected) => {
            const newEdge = {
              ...params,
              data: { inputKey: selected },
              type: store.edgeType,
              markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
              style: { stroke: '#EAEAEA' }
            };
            console.log('Creating edge with selected input:', newEdge);
            setEdges((eds) => addEdge(newEdge, eds));
            },
          });
          return;
        }
      }

      if (!inputKey) {
        const allKeys = Object.keys(meta?.input_schema?.properties || {});
        const keys = allKeys.length ? allKeys : ['input'];
        store.showEdgeSelector({
          possibleKeys: keys,
          onSelect: (selected) => {
          const newEdge = {
            ...params,
            data: { inputKey: selected },
            type: store.edgeType,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            style: { stroke: '#EAEAEA' }
          };
          console.log('Creating edge with selected input:', newEdge);
          setEdges((eds) => addEdge(newEdge, eds));
          },
        });
        return;
      }

      // If we reached here inputKey is resolved automatically -> add edge
    const newEdge = {
            ...params,
            data: { inputKey },
            type: store.edgeType,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
      style: { stroke: '#EAEAEA' }
    };
    console.log('Creating edge with automatic input:', newEdge);
    setEdges((eds) => addEdge(newEdge, eds));
  }, [store.edgeType, nodes, edges, setEdges, store.showEdgeSelector]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      console.log("type", type);
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      const newNode = {
        id: `${type}_${Date.now()}`,
        type: 'functionNode',
        position,
        data: { label: type, blockType: type, inputs: {} },
      };

      // Add the node without any auto-connection
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    store.selectNode(node.id);
  }, [store.selectNode]);

  const handleNodeError = useCallback((nodeId, error) => {
    console.error('Node error:', { nodeId, error });
    
    // Extract the error message
    const errorMessage = error?.message || String(error);
    
    // Update node to show error state
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              error: errorMessage,
              status: 'error',
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, type: store.edgeType })));
  }, [store.edgeType, setEdges]);
  const isMac = useMemo(() => navigator.userAgent.toUpperCase().indexOf('MAC') >= 0, []);
  const deleteKeys = isMac ? ['Delete', 'Backspace'] : 'Delete';

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={edges}
      onNodesChange={propNodes ? undefined : onNodesChange}
      onEdgesChange={propEdges ? undefined : onEdgesChange}
      onConnect={propNodes ? ()=>{} : onConnect}
      onNodeClick={propNodes ? ()=>{} : onNodeClick}
      onDrop={propNodes ? ()=>{} : onDrop}
      onDragOver={propNodes ? ()=>{} : onDragOver}
      onPaneClick={() => store.selectNode(null)}
      deleteKeyCode={deleteKeys}
      nodeTypes={nodeTypes}
      fitView
    >
      <MiniMap style={{ background: '#121212' }} />
      <Controls />
      <Background variant="dots" gap={12} size={1} />
    </ReactFlow>
  );
};

const WorkflowCanvas = ({ nodes, edges }) => (
  <ReactFlowProvider>
    <FlowInner nodes={nodes} edges={edges} />
  </ReactFlowProvider>
);

export default WorkflowCanvas; 
