import React, { useRef, useState } from 'react';
import ReactFlow, { ReactFlowProvider, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2 } from 'lucide-react';
import FunctionNode from '../workflow-builder/nodeTypes/FunctionNode';
import useWorkflowStore from '../workflow-builder/workflowState';
import './WorkflowTemplateCard.css';

const nodeTypes = {
  functionNode: FunctionNode,
};

const WorkflowTemplateCard = ({ template, onClick, onDelete, showDelete = true }) => {
    const { name, workflow_definition } = template;
    const { nodes, edges } = workflow_definition || { nodes: [], edges: [] };
    const { setNodes, setEdges } = useWorkflowStore();
    const canvasRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleDelete = (e) => {
        e.stopPropagation(); // Prevent the card's onClick from firing
        onDelete(template.id);
    };

    return (
        <div className="template-card" onClick={onClick}>
            <div className="template-card-preview">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.1 }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        panOnDrag={false}
                        zoomOnScroll={false}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background style={{ backgroundColor: '#121212' }} gap={15} size={0.5} />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
            <div className="template-card-title">
                <span>{name}</span>
                {isHovered && showDelete && (
                    <button style={{border: "none", backgroundColor: "transparent", cursor: "pointer"}} onClick={handleDelete}><Trash2 size={16} style={{color: "#ffffff"}}/></button>
                )}
            </div>
        </div>
    );
};

export default WorkflowTemplateCard; 