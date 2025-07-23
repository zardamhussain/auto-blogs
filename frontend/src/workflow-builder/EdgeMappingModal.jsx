import React, { useEffect } from 'react';
import useWorkflowStore from './workflowState.js';

const overlayStyle = {
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

const modalStyle = {
  background: '#1E1E1E',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '320px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const selectStyle = {
  width: '100%',
  marginTop: '1rem',
  padding: '0.5rem',
  borderRadius: '6px',
};

const EdgeMappingModal = () => {
  const { edgeSelection, hideEdgeSelector } = useWorkflowStore();

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') hideEdgeSelector(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [hideEdgeSelector]);

  if (!edgeSelection) return null;

  const { possibleKeys, onSelect } = edgeSelection;

  const handleChange = (e) => {
    const selected = e.target.value;
    if (!selected) return;
    onSelect(selected);
    hideEdgeSelector();
  };

  return (
    <div style={overlayStyle} onClick={hideEdgeSelector}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, color: '#EAEAEA' }}>Select input key</h3>
        <p style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>Choose which input of the target node this edge should map to.</p>
        <select style={selectStyle} onChange={handleChange} defaultValue="">
          <option value="" disabled>Select key…</option>
          {possibleKeys.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EdgeMappingModal; 