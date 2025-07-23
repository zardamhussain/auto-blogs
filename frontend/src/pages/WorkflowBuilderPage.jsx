import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SidebarPalette from '../workflow-builder/SidebarPalette';
import WorkflowCanvas from '../workflow-builder/WorkflowCanvas';
import PropertiesPanel from '../workflow-builder/PropertiesPanel';
import EdgeMappingModal from '../workflow-builder/EdgeMappingModal.jsx';
import '../workflow-builder/style.css';
import useWorkflowStore from '../workflow-builder/workflowState.js';
import { useProjects } from '../context/ProjectContext';
import { ChevronDown, Check, Loader2, Plus } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import NewWorkflowModal from '../components/NewWorkflowModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import TemplateSelectionModal from '../components/TemplateSelectionModal.jsx';
import UseTemplateModal from '../components/UseTemplateModal.jsx';

const saveWorkflow = async (apiClient, selectedProject, workflowId, workflows, nodes, edges, setSaveStatus) => {
  if (!apiClient) return;
  if (!selectedProject) {
    alert('Select a project first');
    return;
  }
  try {
    setSaveStatus('saving');
    const currentName = workflows.find(w=>w.id===workflowId)?.name || 'Untitled';
    if (workflowId) {
      await apiClient.patch(`/workflows/${workflowId}`, { name: currentName, nodes, edges });
      setSaveStatus('saved');
      setTimeout(()=>setSaveStatus('idle'),1500);
      return null;
    }
    const { data } = await apiClient.post('/workflows/', { name: currentName, nodes, edges, project_id: selectedProject });
    setSaveStatus('saved');
    setTimeout(()=>setSaveStatus('idle'),1500);
    return data;
  } catch (e) {
    console.error(e);
    setSaveStatus('idle');
  }
};

const loadWorkflow = async (apiClient, selectedProject, setNodes, setEdges) => {
  if (!apiClient) return;
  if (!selectedProject) {
    alert('Select a project first');
    return;
  }
  try {
    const { data } = await apiClient.get('/workflows/');
    if (data.length === 0) {
      alert('No workflows found');
      return;
    }
    // Very naive selection – pick first or prompt user
    const choices = data.map((w) => w.name).join(', ');
    const selName = window.prompt(`Which workflow to load? (${choices})`, data[0].name);
    const wf = data.find((w) => w.name === selName) || data[0];
    setNodes(wf.nodes);
    setEdges(wf.edges);
    return wf;
  } catch (e) {
    console.error(e);
  }
};

const WorkflowBuilderPage = () => {
  const { edgeType, toggleEdgeType, nodes, edges, setNodes, setEdges, workflowId, setWorkflowId, setNodeResult, setWorkflows, workflows, setLastRun } = useWorkflowStore();
  const { apiClient, selectedProject, currentUserRole } = useProjects();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const pollIntervalRef = useRef(null);
  const isPolling = useRef(false);

  const [nameSaving, setNameSaving] = useState('idle'); // idle | saving | saved
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newModal, setNewModal] = useState(false);
  const [templateSelectionModalOpen, setTemplateSelectionModalOpen] = useState(false);
  const [useTemplateModalOpen, setUseTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const pendingWorkflowRef = useRef(null);

  // fetch workflows on mount / project change
  useEffect(() => {
    if (!apiClient || !selectedProject) return;
    apiClient.get('/workflows/').then(({ data }) => {
      setWorkflows(data);
      if (data.length === 0) {
        setWorkflowId(null);
        setNodes([]);
        setEdges([]);
        return;
      };
      const lastId = localStorage.getItem('lastWorkflowId-' + selectedProject);
      const wf = data.find((w) => w.id === lastId) || data[0];
      setWorkflowId(wf.id);
      setNodes(wf.nodes);
      setEdges(wf.edges);
    });
  }, [apiClient, selectedProject]);

  useEffect(() => {
    // On unmount, clear any running interval
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const runWorkflow = async () => {
    if (!workflowId) {
      alert('Save workflow first');
      return;
    }
    if (!selectedProject) {
      alert('Select a project first');
      return;
    }
    try {
      // Stop any existing poll before starting a new one
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      isPolling.current = false;
      
      // Validate required inputs
      const { blockCatalogue } = useWorkflowStore.getState();
      const edgeMap = {};
      edges.forEach(e=>{
        (edgeMap[e.target]=edgeMap[e.target]||{} )[e.data?.inputKey]=true;
      });
      for(const n of nodes){
        const meta=blockCatalogue[n.data.blockType];
        const req=meta?.input_schema?.required||[];
        for(const key of req){
          const hasValue = (n.data.inputs && n.data.inputs[key]!=null && n.data.inputs[key]!=='' ) || (edgeMap[n.id]?.[key]);
          if(!hasValue){
            addToast(`Node "${n.data.label}" is missing required input "${key}"`,'error');
            return;
          }
        }
      }

      // P1-2: reset previous run state
      setLastRun(null);
      useWorkflowStore.getState().clearNodeResults(nodes.map(n=>n.id));
      const { data } = await apiClient.post(`/workflows/${workflowId}/run`);
      const runId = data.id;
      pollIntervalRef.current = setInterval(async () => {
        if (isPolling.current) return;

        try {
          isPolling.current = true;
          const res = await apiClient.get(`/workflows/runs/${runId}`);
          const run = res.data;
          setLastRun(run);
          run.node_runs.forEach((nr) => {
            if (nr.status === 'success') {
              setNodeResult(nr.node_id, nr.output);
            }
          });
          if (['success', 'error'].includes(run.status)) {

            clearInterval(pollIntervalRef.current);

            queryClient.invalidateQueries({ queryKey: ['nodeHistory'] });
            if (run.status === 'success') {
              addToast('Workflow finished successfully!', 'success');
            } else {
              addToast(`Workflow failed: ${run.error_message || 'Unknown error'}`, 'error');
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
          clearInterval(pollIntervalRef.current);
        } finally {
          isPolling.current = false;
        }
      }, 4000);
    } catch (e) {
      console.error(e);
      addToast('Failed to start workflow run.', 'error');
    }
  };

  const loadW = (wf) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    isPolling.current = false;
    setWorkflowId(wf.id);
    setNodes(wf.nodes);
    setEdges(wf.edges);
    useWorkflowStore.getState().clearNodeResults(Object.keys(useWorkflowStore.getState().nodeResults));
    setLastRun(null);
    if(selectedProject) localStorage.setItem('lastWorkflowId-'+selectedProject,wf.id);
    setNameSaving('idle');
    setDropdownOpen(false);
  };

  console.log("WorkflowBuilderPage: selectedProject is", selectedProject);

  return (
    <div className="workflow-builder-wrapper">
      <SidebarPalette />
      <div className="wf-canvas">
        <div className="wf-toolbar" style={{display:'flex',alignItems:'center',justifyContent:'flex-start',gap:6,padding:'0.5rem'}}>
          {/* Name pill */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:4, background:'#303030', padding:'2px 6px', borderRadius:6 }}>
            <input
              value={workflows.find(w=>w.id===workflowId)?.name || 'Untitled'}
              onChange={(e)=>{
                const newName=e.target.value;
                setWorkflows(workflows.map(w=>w.id===workflowId?{...w,name:newName}:w));
              }}
              onBlur={async (e)=>{
                const newName=e.target.value.trim()||'Untitled';
                setNameSaving('saving');
                try{ await apiClient.patch(`/workflows/${workflowId}`,{name:newName}); setNameSaving('saved'); setTimeout(()=>setNameSaving('idle'),1500);}catch{setNameSaving('idle');}
              }}
              style={{ fontSize:'1.05rem', background:'transparent', border:'none', color:'#EAEAEA', fontWeight:600, width:140 }}
            />
            {nameSaving==='saving' && <Loader2 className="spin" size={14} />}
            {nameSaving==='saved' && <Check size={14} color="#16a34a" />}
            <button className="wf-btn" onClick={()=>setDropdownOpen(o=>!o)} style={{padding:'0 4px'}}><ChevronDown size={12}/></button>
            {dropdownOpen && (
              <div style={{position:'absolute',background:'#1E1E1E',border:'1px solid #333',borderRadius:6,top:'100%',left:0,zIndex:10,minWidth:'100%'}}>
                {workflows.map(w=> (
                  <div key={w.id} style={{padding:'0.3rem 0.6rem',cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>{
                    if(w.id===workflowId){setDropdownOpen(false);return;}
                    if(nodes.length!==w.nodes.length||edges.length!==w.edges.length){
                      pendingWorkflowRef.current=w;
                      setConfirmOpen(true);
                    }else{ loadW(w); }
                  }}>{w.name}</div>
                ))}
              </div>
            )}
          </div>
          {/* Plus button */}
          {currentUserRole !== 'viewer' && <button className="wf-btn" onClick={()=>{setDropdownOpen(false);setTemplateSelectionModalOpen(true)}}><Plus size={13}/></button>}
          {/* Right buttons pushed to end */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
            <button className="wf-btn" onClick={toggleEdgeType}>
              {edgeType === 'smoothstep' ? 'Wavy edges' : 'Straight edges'}
            </button>
            {currentUserRole !== 'viewer' && <button className="wf-btn" disabled={saveStatus==='saving'} onClick={async () => {
              const wf = await saveWorkflow(apiClient, selectedProject, workflowId, workflows, nodes, edges, setSaveStatus);
              if(wf) {
                setWorkflows([...workflows, wf]);
                setWorkflowId(wf.id);
                localStorage.setItem('lastWorkflowId-'+selectedProject,wf.id);
              }
            }}>
              {saveStatus==='saving' ? <Loader2 className="spin" size={14}/> : saveStatus==='saved' ? <Check size={14} color="#16a34a"/> : 'Save'}
            </button>}
            {currentUserRole !== 'viewer' && <button className="wf-btn" onClick={runWorkflow}>Run</button>}
          </div>
        </div>
        <WorkflowCanvas />
      </div>
      <PropertiesPanel project={selectedProject} />
      <ConfirmationModal
        isOpen={confirmOpen}
        title="Discard changes?"
        message="You have unsaved modifications. Load another workflow and lose your current changes?"
        onClose={()=>{setConfirmOpen(false); setNameSaving('idle');}}
        onConfirm={()=>{setConfirmOpen(false); loadW(pendingWorkflowRef.current);}}
      />
      <EdgeMappingModal />
      <NewWorkflowModal
        isOpen={newModal}
        existingNames={workflows.map(w=>w.name)}
        onClose={()=>setNewModal(false)}
        onCreate={async (name)=>{
          const {data} = await apiClient.post('/workflows/',{name,nodes:[],edges:[], project_id: selectedProject});
          setWorkflows(ws=>[...ws,data]);
          loadW(data);
          setNewModal(false);
        }}
      />
      <TemplateSelectionModal
        isOpen={templateSelectionModalOpen}
        onClose={() => setTemplateSelectionModalOpen(false)}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template);
          setUseTemplateModalOpen(true);
          setTemplateSelectionModalOpen(false);
        }}
        onNewWorkflow={() => {
          setTemplateSelectionModalOpen(false);
          setNewModal(true);
        }}
      />
      {selectedTemplate && (
        <UseTemplateModal
          isOpen={useTemplateModalOpen}
          onClose={() => {
            setUseTemplateModalOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          existingNames={workflows.map(w => w.name)}
          onCreate={async (name, template) => {
            const { nodes, edges } = template;
            const { data } = await apiClient.post('/workflows/', { name, nodes, edges, project_id: selectedProject });
            setWorkflows(ws => [...ws, data]);
            loadW(data);
            setUseTemplateModalOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowBuilderPage; 