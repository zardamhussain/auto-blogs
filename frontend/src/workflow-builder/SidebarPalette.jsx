import React, { useEffect, useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import * as icons from 'lucide-react';
import './style.css';
import useWorkflowStore from './workflowState.js';
import Skeleton from '../components/ui/Skeleton.jsx';

const DynamicIcon = ({ name, ...props }) => {
  if (!name) return <icons.FileText {...props} />; // Default icon

  // Convert kebab-case to PascalCase (e.g., "file-text" to "FileText")
  const pascalCaseName = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const IconComponent = icons[pascalCaseName];

  if (!IconComponent) {
    console.warn(`[SidebarPalette] Icon not found for name: "${name}"`);
    return <icons.FileText {...props} />; // Fallback icon
  }

  return <IconComponent {...props} />;
};


const SidebarPalette = () => {
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { apiClient } = useProjects();
  const { nodes, edges } = useWorkflowStore();

  useEffect(() => {
    if (!apiClient) return;
    setIsLoading(true);
    apiClient.get('/workflows/blocks')
      .then((res) => {
        setBlocks(res.data);
        import('./workflowState.js').then(({ default: store }) => {
          const map = Object.fromEntries(res.data.map((b)=>[b.id,b]));
          store.getState().setBlockCatalogue(map);
        });
      })
      .catch(() => {
        import('./workflowState.js').then(({ default: store }) => {
          store.getState().setBlockCatalogue({});
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [apiClient]);

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredBlocks = useMemo(() => {
    if (!searchTerm) {
      return blocks;
    }
    return blocks.filter(block =>
      block.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blocks, searchTerm]);

  if (isLoading) {
    return (
        <aside className="wf-sidebar">
            <h3 className="wf-sidebar-title">Blocks</h3>
            <div>
                <h4 className="wf-sidebar-subtitle">Data</h4>
                <Skeleton className="wf-palette-item" style={{ height: '38px', marginBottom: '0.5rem' }} />
                <Skeleton className="wf-palette-item" style={{ height: '38px', marginBottom: '0.5rem' }} />
            </div>
            <div>
                <h4 className="wf-sidebar-subtitle">Actions</h4>
                <Skeleton className="wf-palette-item" style={{ height: '38px', marginBottom: '0.5rem' }} />
                <Skeleton className="wf-palette-item" style={{ height: '38px', marginBottom: '0.5rem' }} />
                <Skeleton className="wf-palette-item" style={{ height: '38px', marginBottom: '0.5rem' }} />
            </div>
        </aside>
    );
  }

  return (
    <aside className="wf-sidebar">
      <h3 className="wf-sidebar-title">Blocks</h3>
      <input
        type="text"
        placeholder="Search blocks..."
        className="wf-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {Object.entries(filteredBlocks.reduce((acc,b)=>{
        (acc[b.type]=acc[b.type]||[]).push(b);return acc;},{})).sort(([a], [b]) => {
          if (a === 'data' && b !== 'data') {
            return -1;
          }
          if (a !== 'data' && b === 'data') {
            return 1;
          }
          return 0;
        }).map(([type,list])=>(
        <div key={type}>
          <h4 className="wf-sidebar-subtitle">{type=== 'action' ? 'Actions' : 'Data'}</h4>
          {list.map(n=>{
            const isDisabled = !n.enabled;
            return (
            <div
              key={n.id}
                className={`wf-palette-item ${isDisabled ? 'disabled' : ''}`}
              style={{ border: `1px solid ${n.color_hex}` }}
                draggable={!isDisabled}
              onDragStart={(e) => handleDragStart(e, n.id)}
            >
              <DynamicIcon name={n.icon} size={14} /> <span style={{marginLeft:4}}>{n.display_name}</span>
            </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

export default SidebarPalette;