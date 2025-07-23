import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import WorkflowTemplateCard from './WorkflowTemplateCard';
import WorkflowTemplateCardSkeleton from './WorkflowTemplateCardSkeleton';
import '../pages/WorkflowTemplatesPage.css';

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modal = {
  background: '#1E1E1E',
  padding: '1.5rem',
  borderRadius: 8,
  width: '80vw',
  maxWidth: '1000px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  color: '#EAEAEA',
};

const TemplateSelectionModal = ({ isOpen, onClose, onSelectTemplate, onNewWorkflow }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiClient } = useProjects();

  useEffect(() => {
    if (isOpen && apiClient) {
      setLoading(true);
      apiClient.get('/workflow-templates/')
        .then(response => {
          setTemplates(response.data);
        })
        .catch(error => {
          console.error("Error fetching workflow templates:", error);
          // If there's an error (e.g., 404 Not Found), proceed with the old flow
          onNewWorkflow();
          onClose();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, apiClient]);

  useEffect(() => {
    // If loading is finished and there are no templates, use the old flow.
    if (!loading && templates.length === 0) {
        onNewWorkflow();
        onClose();
    }
  }, [loading, templates, onNewWorkflow, onClose]);

  if (!isOpen) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Create New Workflow from Template</h2>
          <button className="wf-btn" onClick={onNewWorkflow}>Create from scratch</button>
        </div>
        
        <div className="workflow-templates-grid">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <WorkflowTemplateCardSkeleton key={index} />)
          ) : (
            templates.map(template => (
              <WorkflowTemplateCard 
                key={template.id} 
                template={template} 
                onClick={() => onSelectTemplate(template)}
                showDelete={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionModal; 