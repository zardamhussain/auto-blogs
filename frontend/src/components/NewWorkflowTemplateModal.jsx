import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import useWorkflowStore from '../workflow-builder/workflowState';
import SidebarPalette from '../workflow-builder/SidebarPalette';
import WorkflowCanvas from '../workflow-builder/WorkflowCanvas';
import PropertiesPanel from '../workflow-builder/PropertiesPanel';
import { Button } from './ui/Button';
import { useProjects } from '../context/ProjectContext';
import './NewWorkflowTemplateModal.css';

const NewWorkflowTemplateModal = ({ isOpen, onClose, onSave, template }) => {
    // Isolate state by wrapping in a new provider
    return (
        <ReactFlowProvider>
            <TemplateEditor isOpen={isOpen} onClose={onClose} onSave={onSave} template={template} />
        </ReactFlowProvider>
    );
};

// Inner component to access the new provider scope
const TemplateEditor = ({ isOpen, onClose, onSave, template }) => {
    const { apiClient, selectedProject } = useProjects();
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');

    // We can use the global store but we will clear it on mount/unmount
    const { nodes, edges, setNodes, setEdges, edgeType, toggleEdgeType } = useWorkflowStore();

    useEffect(() => {
        if (isOpen) {
            if (template) {
                // Edit mode
                setTemplateName(template.name);
                setTemplateDescription(template.description || '');
                const { nodes = [], edges = [] } = template.workflow_definition || {};
                setNodes(nodes);
                setEdges(edges);
            } else {
                // Create mode
                setTemplateName('');
                setTemplateDescription('');
                setNodes([]);
                setEdges([]);
            }
        }
    }, [isOpen, template, setNodes, setEdges]);


    const handleSave = async () => {
        if (!templateName) {
            alert('Please provide a name for the template.');
            return;
        }

        const workflow_definition = { nodes, edges };
        const templateData = {
            name: templateName,
            description: templateDescription,
            workflow_definition,
        };

        onSave(templateData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-full">
                <div className="modal-header">
                    <h2>{template ? 'Update' : 'Create'} Workflow Template</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="template-meta-inputs">
                        <input
                            type="text"
                            placeholder="Template Name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="wf-input"
                        />
                        <textarea
                            placeholder="Template Description"
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            className="wf-input"
                        />
                    </div>
                    <div className="workflow-builder-wrapper" style={{ height: 'calc(100vh - 250px)', border: '1px solid #333', borderRadius: '8px' }}>
                        <SidebarPalette />
                        <div className="wf-canvas">
                            {/* <div className="wf-toolbar" style={{display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0.5rem', borderBottom: '1px solid #333'}}>
                                <button className="wf-btn" onClick={toggleEdgeType}>
                                    {edgeType === 'smoothstep' ? 'Wavy edges' : 'Straight edges'}
                                </button>
                            </div> */}
                            <WorkflowCanvas />
                        </div>
                        <PropertiesPanel project={selectedProject} />
                    </div>
                </div>
                <div className="modal-footer">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>{template ? 'Update' : 'Save'} Template</Button>
                </div>
            </div>
        </div>
    );
};


export default NewWorkflowTemplateModal; 