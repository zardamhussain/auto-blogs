import React, { useState, useEffect } from 'react';
import WorkflowCanvas from '../workflow-builder/WorkflowCanvas';
import { useToast } from '../context/ToastContext.jsx';

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
  zIndex: 1010, // Higher than template selection
};

const modal = {
  background: '#1E1E1E',
  padding: '1.5rem',
  borderRadius: 8,
  width: '90vw',
  height: '90vh',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  color: '#EAEAEA',
  display: 'flex',
  flexDirection: 'column',
};

const UseTemplateModal = ({ isOpen, onClose, template, onCreate, existingNames }) => {
  const [name, setName] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (template) {
      setName(`Copy of ${template.name}`);
    }
  }, [template]);

  if (!isOpen) return null;

  const duplicate = existingNames.includes(name.trim());

  const handleCreate = () => {
    if (!name.trim()) {
      addToast('Please enter a name for the workflow.', 'error');
      return;
    }
    if (duplicate) {
      addToast('A workflow with this name already exists.', 'error');
      return;
    }
    onCreate(name.trim(), template.workflow_definition);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, marginBottom: '1rem' }}>Use Workflow Template: {template.name}</h2>
        
        <div style={{ flex: 1, position: 'relative', border: '1px solid #333', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
            <WorkflowCanvas nodes={template.workflow_definition.nodes} edges={template.workflow_definition.edges} />
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="New workflow name" 
            style={{flex: 1, padding: 8, borderRadius: 6, border:'1px solid #444', background:'#121212', color:'#EAEAEA' }}
          />
          {duplicate && <p style={{color:'#ef4444',fontSize:12, margin: 0}}>Name already exists</p>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button className="wf-btn" onClick={onClose}>Cancel</button>
            <button 
              className="wf-btn" 
              onClick={handleCreate}
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseTemplateModal; 