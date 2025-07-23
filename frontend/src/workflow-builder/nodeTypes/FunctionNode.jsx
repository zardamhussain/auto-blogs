import React from 'react';
import { Handle, Position } from 'reactflow';
import useWorkflowStore from '../workflowState.js';
import { FileText, Search, MessageCircle, FilePenLine, Image, BarChart3, MousePointerClick, Sparkles, Save } from 'lucide-react';

const ICONS = {
  QueryText: FileText,
  GoogleSearch: Search,
  RedditSearch: MessageCircle,
  BlogGenerator: FilePenLine,
  ImageGenerator: Image,
  CompetitorAnalyzer: BarChart3,
  CTAInserter: MousePointerClick,
  QueryOptimizer: Sparkles,
  SaveBlogPost: Save,
};

const FunctionNode = ({ id, data }) => {
  const blockCatalogue = useWorkflowStore(s=>s.blockCatalogue);
  const color = blockCatalogue[data.blockType]?.color_hex || '#4f46e5'; // Default color
  const bg = `${color}33`; // 20% opacity
  
  const nodeClasses = ['function-node'];
  if (data.status === 'failed') {
    nodeClasses.push('node-failed');
  } else if (data.status === 'success') {
    nodeClasses.push('node-success');
  }

  const IconComp = ICONS[data.blockType];

  return (
    <div className={nodeClasses.join(' ')} style={{ padding: 12, borderRadius: 8, background: bg, border: `1px solid ${color}`, color: '#EAEAEA', fontSize: 12, minWidth: 120, display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      {IconComp && <IconComp size={14} />}
      <div style={{ textAlign: 'center', pointerEvents: 'none' }}>{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  );
};

export default FunctionNode; 