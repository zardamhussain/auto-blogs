import React, { useState } from 'react';
import useWorkflowStore from './workflowState.js';

const overlay={position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000};
const modal={background:'#1E1E1E',padding:'1.5rem',borderRadius:8,width:320,boxShadow:'0 4px 20px rgba(0,0,0,0.3)'};

const NewWorkflowModal=({isOpen,onClose,onCreate,existingNames})=>{
  const [name,setName]=useState('');
  if(!isOpen) return null;
  const duplicate=existingNames.includes(name.trim());
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:0,color:'#EAEAEA'}}>New Workflow</h3>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" style={{width:'100%',marginTop:12,padding:8,borderRadius:6,border:'1px solid #444',background:'#121212',color:'#EAEAEA'}}/>
        {duplicate && <p style={{color:'#ef4444',fontSize:12}}>Name already exists</p>}
        <div style={{marginTop:12,display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="wf-btn" onClick={onClose}>Cancel</button>
          <button className="wf-btn" disabled={!name.trim()||duplicate} onClick={()=>{onCreate(name.trim());setName('');}}>Create</button>
        </div>
      </div>
    </div>
  );
};
export default NewWorkflowModal; 