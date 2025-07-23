import React, { useState, useEffect } from 'react';
import { ChevronsLeft, ChevronsRight, HelpCircle } from 'lucide-react';
import useWorkflowStore from './workflowState.js';
import { useProjects } from '../context/ProjectContext';
import './style.css';
import CronPicker from './CronPicker.jsx';
import NodeHistoryModal from './NodeHistoryModal.jsx';

const WorkflowSettings = ({ workflow, onUpdate, canEdit }) => {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [cron, setCron] = useState(workflow.cron_expr);
  const [isActive, setIsActive] = useState(workflow.is_active);

  useEffect(() => {
    setName(workflow.name);
    setDescription(workflow.description);
    setCron(workflow.cron_expr);
    setIsActive(workflow.is_active);
  }, [workflow]);

  const handleBlur = (field, value) => {
    onUpdate({ [field]: value });
  };

  return (
    <>
      <h3 className="wf-props-title">Workflow Settings</h3>
      <div className="wf-schema">
        {/* Name & description */}
        <div className="wf-fieldset">
          <span className="wf-legend">Information</span>
          <div className="wf-form-field">
            <label className="wf-input-label">Name</label>
            <input className="wf-input" value={name} onChange={e => setName(e.target.value)} onBlur={e => handleBlur('name', e.target.value)} disabled={!canEdit} />
          </div>
          <div className="wf-form-field">
            <label className="wf-input-label">Description</label>
            <textarea className="wf-input" value={description} onChange={e => setDescription(e.target.value)} onBlur={e => handleBlur('description', e.target.value)} disabled={!canEdit} />
          </div>
        </div>

        {/* Schedule */}
        <div className="wf-fieldset">
          <span className="wf-legend">Schedule</span>
          <CronPicker value={cron} onChange={(c)=>{setCron(c); handleBlur('cron_expr', c);}} disabled={!canEdit} />
        </div>

        {/* Auto-run */}
        <div className="wf-fieldset">
          <span className="wf-legend">Auto-run</span>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span className={`wf-toggle ${isActive?'on':''} ${!canEdit ? 'disabled' : ''}`} onClick={()=>{if (canEdit) {const v=!isActive; setIsActive(v); handleBlur('is_active', v);}}} />
            <span className="wf-input-label" title="When ON this workflow runs automatically at its scheduled time."></span>
          </div>
        </div>
      </div>
    </>
  );
};

const PropertiesPanel = ({ project }) => {
  const { nodes, edges, selectedNodeId, updateNodeInput, nodeResults, setEdges, workflows, workflowId, updateWorkflow, lastRun } = useWorkflowStore();
  const { apiClient, currentUserRole } = useProjects();
  const [prompts, setPrompts] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [historyNodeInfo, setHistoryNodeInfo] = useState({ id: null, label: '' });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  console.log("PropertiesPanel: received project prop:", project);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const blockCatalogue = useWorkflowStore((s) => s.blockCatalogue);
  const blockMeta = node ? blockCatalogue[node.data.blockType] : null;
  const currentWorkflow = workflows.find(w => w.id === workflowId);
  const nodeRun = lastRun?.node_runs?.find(nr => nr.node_id === selectedNodeId);

  // Fetch prompts when a WritingStyleGuide node is selected
  useEffect(() => {
    if (!apiClient || !project || !node || node.data.blockType !== 'WritingStyleGuide') {
      console.log('Skipping prompts fetch:', {
        hasApiClient: !!apiClient,
        hasProject: !!project,
        hasNode: !!node,
        nodeType: node?.data?.blockType
      });
      return;
    }
    
    console.log('Fetching prompts for project:', {
      projectId: project,
      nodeId: node.id,
      endpoint: `/prompts/project/${project}`
    });
    
    apiClient.get(`/prompts/project/${project}`)
      .then((res) => {
        console.log('Prompts fetch successful:', {
          totalPrompts: res.data.length,
          activePrompts: res.data.filter(p => p.is_active).length,
          promptIds: res.data.map(p => p.id)
        });
        // Filter for active prompts only
        setPrompts(res.data.filter(p => p.is_active));
      })
      .catch((error) => {
        console.error('Failed to fetch prompts:', {
          error: error.message,
          status: error.response?.status,
          projectId: project,
          nodeId: node.id
        });
        setPrompts([]);
      });
  }, [apiClient, project, node]);

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'owner';

  // Fetch supported languages when a TranslateBlog node is selected
  useEffect(() => {
    if (!apiClient || !node || node.data.blockType !== 'TranslateBlog') {
      return;
    }
    
    console.log('Fetching supported languages for TranslateBlog node:', {
      nodeId: node.id,
      endpoint: '/languages/supported'
    });
    
    apiClient.get('/languages/supported')
      .then((res) => {
        console.log('Supported languages fetch successful:', {
          totalLanguages: res.data.length,
          languages: res.data.map(l => ({ code: l.language_code, name: l.language_name }))
        });
        setSupportedLanguages(res.data);
      })
      .catch((error) => {
        console.error('Failed to fetch supported languages:', {
          error: error.message,
          status: error.response?.status,
          nodeId: node.id
        });
        
        // Fallback to hardcoded languages if API fails
        const defaultLanguages = [
          { language_code: 'es', language_name: 'Spanish', native_name: 'Español' },
          { language_code: 'fr', language_name: 'French', native_name: 'Français' },
          { language_code: 'de', language_name: 'German', native_name: 'Deutsch' },
          { language_code: 'it', language_name: 'Italian', native_name: 'Italiano' },
          { language_code: 'pt', language_name: 'Portuguese', native_name: 'Português' },
          { language_code: 'ru', language_name: 'Russian', native_name: 'Русский' },
          { language_code: 'ja', language_name: 'Japanese', native_name: '日本語' },
          { language_code: 'zh', language_name: 'Chinese', native_name: '中文' },
        ];
        setSupportedLanguages(defaultLanguages);
      });
  }, [apiClient, node]);


  const handleWorkflowUpdate = (updatePayload) => {
    if (!currentWorkflow || !canEdit) return;
    updateWorkflow(currentWorkflow.id, updatePayload);
    apiClient.patch(`/workflows/${currentWorkflow.id}`, updatePayload)
      .catch(e => console.error("Failed to update workflow", e));
  };

  if (collapsed)
    return (
      <aside className="wf-props collapsed">
        <button className="wf-props-collapse" onClick={() => setCollapsed(false)}>
            <ChevronsLeft size={18} />
        </button>
      </aside>
    );

  return (
    <aside className="wf-props">
      <button className="wf-props-collapse" onClick={() => setCollapsed(true)}><ChevronsRight size={18} /></button>
      {node ? (
        <>
          <h3 className="wf-props-title">{node.data.label}</h3>
          {node.data.blockType === 'WritingStyleGuide' ? (
            <div className="wf-schema">
              <h4 className="wf-subtitle">Writing Style Selection</h4>
              <div className="wf-form-field">
                <label className="wf-input-label">
                  Select Writing Style Guide
                  <span title="Choose a writing style guide for the blog generator" style={{cursor:'help'}}>
                    <HelpCircle size={14} style={{verticalAlign:'middle', marginLeft: '4px'}}/>
                  </span>
                </label>
                <select 
                  className="wf-input" 
                  value={node.data.inputs?.prompt_id || ''} 
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log('Writing style selection changed:', {
                      oldValue: node.data.inputs?.prompt_id,
                      newValue: selectedValue,
                      nodeId: node.id,
                      availablePrompts: prompts.map(p => ({ id: p.id, name: p.name }))
                    });
                    updateNodeInput(node.id, 'prompt_id', selectedValue);
                  }}
                >
                  <option value="">Select a writing style...</option>
                  {prompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <h4 className="wf-subtitle">Last Run</h4>
              {nodeRun ? (
                <div>
                  <p style={{ margin: 0 }}>Status: <span style={{ fontWeight: 'bold' }}>{nodeRun.status}</span></p>
                  {nodeRun.status === 'failed' && nodeRun.error_message && (
                    <>
                      <p style={{ marginTop: '4px', marginBottom: 0 }}>Error:</p>
                      <pre className="wf-error-message">{nodeRun.error_message}</pre>
                    </>
                  )}
                </div>
              ) : (
                <span className="wf-helper">(Workflow not run yet)</span>
              )}
              
              <h4 className="wf-subtitle">Outputs { !nodeResults[node.id] && <span className="wf-helper">(No runs yet)</span>}</h4>
              <div className={`wf-outputs ${!nodeResults[node.id]?'no-run':''}`}> 
                {Object.keys(blockCatalogue[node.data.blockType]?.output_schema?.properties || {}).map(k=>{
                  const outDesc = blockCatalogue[node.data.blockType]?.output_schema?.properties?.[k]?.description || '';
                  return (
                    <span key={k} className="wf-output-btn" title={outDesc} onClick={()=>{
                      setHistoryNodeInfo({ id: node.id, label: node.data.label });
                      setIsHistoryModalOpen(true);
                    }}>{k}</span>
                  );
                })}
              </div>
            </div>
          ) : node.data.blockType === 'TranslateBlog' ? (
            <div className="wf-schema">
              <h4 className="wf-subtitle">Translation Settings</h4>
              <div className="wf-form-field">
                <label className="wf-input-label">
                  Target Languages
                  <span title="Select languages to translate the blog post into" style={{cursor:'help'}}>
                    <HelpCircle size={14} style={{verticalAlign:'middle', marginLeft: '4px'}}/>
                  </span>
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #374151', borderRadius: '6px', padding: '8px' }}>
                  {supportedLanguages.map(lang => (
                    <div key={lang.language_code} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <input
                        type="checkbox"
                        id={`lang-${lang.language_code}`}
                        checked={(node.data.inputs?.languages || []).includes(lang.language_code)}
                        onChange={(e) => {
                          const currentLanguages = node.data.inputs?.languages || [];
                          const newLanguages = e.target.checked
                            ? [...currentLanguages, lang.language_code]
                            : currentLanguages.filter(l => l !== lang.language_code);
                          
                          console.log('Language selection changed:', {
                            language: lang.language_code,
                            checked: e.target.checked,
                            newLanguages,
                            nodeId: node.id
                          });
                          
                          updateNodeInput(node.id, 'languages', newLanguages);
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor={`lang-${lang.language_code}`} style={{ cursor: 'pointer', fontSize: '14px' }}>
                        {lang.language_name} ({lang.native_name})
                      </label>
                    </div>
                  ))}
                </div>
                {(node.data.inputs?.languages || []).length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
                    Selected: {(node.data.inputs?.languages || []).join(', ')}
                  </div>
                )}
              </div>
              
              <h4 className="wf-subtitle">Last Run</h4>
              {nodeRun ? (
                <div>
                  <p style={{ margin: 0 }}>Status: <span style={{ fontWeight: 'bold' }}>{nodeRun.status}</span></p>
                  {nodeRun.status === 'failed' && nodeRun.error_message && (
                    <>
                      <p style={{ marginTop: '4px', marginBottom: 0 }}>Error:</p>
                      <pre className="wf-error-message">{nodeRun.error_message}</pre>
                    </>
                  )}
                </div>
              ) : (
                <span className="wf-helper">(Workflow not run yet)</span>
              )}
              
              <h4 className="wf-subtitle">Outputs { !nodeResults[node.id] && <span className="wf-helper">(No runs yet)</span>}</h4>
              <div className={`wf-outputs ${!nodeResults[node.id]?'no-run':''}`}> 
                {Object.keys(blockCatalogue[node.data.blockType]?.output_schema?.properties || {}).map(k=>{
                  const outDesc = blockCatalogue[node.data.blockType]?.output_schema?.properties?.[k]?.description || '';
                  return (
                    <span key={k} className="wf-output-btn" title={outDesc} onClick={()=>{
                      setHistoryNodeInfo({ id: node.id, label: node.data.label });
                      setIsHistoryModalOpen(true);
                    }}>{k}</span>
                  );
                })}
              </div>
            </div>
          ) : blockMeta && (
            <div className="wf-schema">
              <h4 className="wf-subtitle">Inputs</h4>
              {Object.entries(blockMeta.input_schema?.properties || {}).map(([key, prop]) => {
                console.log('Processing input field:', {
                  key,
                  prop,
                  nodeId: node.id,
                  nodeType: node.data.blockType,
                  currentValue: node.data.inputs?.[key]
                });

                const required = blockMeta.input_schema?.required?.includes(key);
                const currentVal = node.data.inputs?.[key];
                const incomings = edges.filter(e=>e.target===node.id && e.data?.inputKey===key);
                const tooltip = prop.description || '';
                const label = (
                  <label className="wf-input-label">
                    {key}{required && ' *'} {tooltip && <span title={tooltip} style={{cursor:'help'}}><HelpCircle size={14} style={{verticalAlign:'middle'}}/></span>} 
                  </label>
                );
                let control = null;

                // Special handling for WritingStyleGuide node
                if (node.data.blockType === 'WritingStyleGuide') {
                  console.log('Rendering writing style dropdown:', {
                    availablePrompts: prompts,
                    currentValue: currentVal,
                    nodeId: node.id
                  });
                  control = (
                    <select 
                      className="wf-input" 
                      value={currentVal || ''} 
                      onChange={(e) => {
                        console.log('Writing style selection changed:', {
                          newValue: e.target.value,
                          nodeId: node.id
                        });
                        updateNodeInput(node.id, key, e.target.value);
                      }}
                    >
                      <option value="">Select a writing style...</option>
                      {prompts.map(prompt => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      ))}
                    </select>
                  );
                } else if (prop.enum) {
                  control = (
                    <select className="wf-input" value={currentVal||prop.default||''} onChange={(e)=>updateNodeInput(node.id,key,e.target.value)} disabled={!canEdit}>
                      {prop.enum.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  );
                } else if (prop.type==='string') {
                  control = <input className="wf-input" value={currentVal||''} onChange={(e)=>updateNodeInput(node.id,key,e.target.value)} disabled={!canEdit} />;
                } else if (prop.type==='array') {
                  control = <textarea className="wf-input" value={(currentVal||[]).join('\n')} onChange={(e)=>updateNodeInput(node.id,key,e.target.value.split(/\n|,/).map(s=>s.trim()).filter(Boolean))} disabled={!canEdit} />;
                } else if (prop.type==='integer' || prop.type==='number') {
                  control = <input type="number" className="wf-input" value={currentVal ?? ''} onChange={(e)=>{
                    const valStr = e.target.value;
                    const val = valStr === '' ? null : (prop.type==='integer' ? parseInt(valStr,10) : parseFloat(valStr));
                    updateNodeInput(node.id,key,isNaN(val)?null:val);
                  }} disabled={!canEdit} />;
                } else {
                  control = <input className="wf-input" value={currentVal||''} onChange={(e)=>updateNodeInput(node.id,key,e.target.value)} disabled={!canEdit} />;
                }
                const chips = incomings.map(inEdge=> (
                  <div
                    key={inEdge.id}
                    className="wf-mapped-chip"
                    style={{border:`1px solid ${blockCatalogue[inEdge.source.split('_')[0]]?.color_hex || '#4f46e5'}`}}
                    title={`Provided by ${inEdge.source.split('_')[0]}`}
                  >
                    {inEdge.source.split('_')[0]}
                    {canEdit && <span className="remove" onClick={()=>{setEdges(cur=>cur.filter(e=>e.id!==inEdge.id));}}>×</span>}
                  </div>
                ));

                const finalControl = incomings.length ? (
                  <div className="wf-chip-input">
                    {incomings.map(inEdge=> {
                      const sourceNode = nodes.find(n => n.id === inEdge.source);
                      let chipLabel = inEdge.source.split('_')[0];
                      let chipValue = '';

                      console.log('Processing connection chip:', {
                        edgeId: inEdge.id,
                        sourceNodeId: inEdge.source,
                        sourceNode,
                        sourceNodeType: sourceNode?.data?.blockType,
                        sourceNodeInputs: sourceNode?.data?.inputs,
                        inputKey: key,
                        edgeData: inEdge.data
                      });

                      if (sourceNode?.data.blockType === 'WritingStyleGuide') {
                        chipLabel = 'Writing Style';
                        const promptId = sourceNode.data.inputs?.prompt_id;
                        console.log('WritingStyleGuide connection found:', {
                          promptId,
                          nodeInputs: sourceNode.data.inputs,
                          availablePrompts: prompts,
                          matchingPrompt: prompts?.find(p => p.id === promptId),
                          edge: inEdge,
                          inputKey: key
                        });

                        if (promptId) {
                          const selectedPrompt = prompts.find(p => p.id === promptId);
                          if (selectedPrompt) {
                            chipValue = `: ${selectedPrompt.name}`;
                            console.log('Displaying prompt:', selectedPrompt);
                          } else {
                            console.warn('Warning: Selected prompt not found:', {
                              promptId,
                              availablePrompts: prompts
                            });
                          }
                        } else {
                          console.warn('Warning: No prompt_id in WritingStyleGuide inputs:', {
                            nodeInputs: sourceNode.data.inputs,
                            edge: inEdge
                          });
                        }
                      }

                      return (
                        <div
                          key={inEdge.id}
                          className="wf-mapped-chip"
                          style={{
                            border: `1px solid ${blockCatalogue[sourceNode?.data.blockType]?.color_hex || '#4f46e5'}`,
                            maxWidth: chipValue ? '250px' : undefined,
                            backgroundColor: chipValue ? 'rgba(79, 70, 229, 0.1)' : undefined
                          }}
                          title={chipValue ? `${chipLabel}${chipValue}` : chipLabel}
                        >
                          {chipLabel}{chipValue}
                          <span 
                            className="remove" 
                            onClick={()=>{
                              console.log('Removing edge:', inEdge);
                              setEdges(cur=>cur.filter(e=>e.id!==inEdge.id));
                            }}
                          >×</span>
                        </div>
                      );
                    })}
                  </div>
                ) : control;

                return (
                  <div key={key} className="wf-form-field">
                    {label}
                    {finalControl}
                  </div>
                );
              })}
              
              <h4 className="wf-subtitle">Last Run</h4>
              {nodeRun ? (
                <div>
                  <p style={{ margin: 0 }}>Status: <span style={{ fontWeight: 'bold' }}>{nodeRun.status}</span></p>
                  {nodeRun.status === 'failed' && nodeRun.error_message && (
                    <>
                      <p style={{ marginTop: '4px', marginBottom: 0 }}>Error:</p>
                      <pre className="wf-error-message">{nodeRun.error_message}</pre>
                    </>
                  )}
                </div>
              ) : (
                <span className="wf-helper">(Workflow not run yet)</span>
              )}
              <h4 className="wf-subtitle">Outputs { !nodeResults[node.id] && <span className="wf-helper">(No runs yet)</span>}</h4>
              <div className={`wf-outputs ${!nodeResults[node.id]?'no-run':''}`}> 
                {Object.keys(blockMeta.output_schema?.properties||{}).map(k=>{
                  const outDesc=blockMeta.output_schema?.properties?.[k]?.description||'';
                  return (
                    <span key={k} className="wf-output-btn" title={outDesc} onClick={()=>{
                        setHistoryNodeInfo({ id: node.id, label: node.data.label });
                        setIsHistoryModalOpen(true);
                    }}>{k}</span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : currentWorkflow ? (
        <WorkflowSettings workflow={currentWorkflow} onUpdate={handleWorkflowUpdate} canEdit={canEdit} />
      ) : (
        <p>Select a node or create a workflow</p>
      )}
      <NodeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        nodeId={historyNodeInfo.id}
        nodeLabel={historyNodeInfo.label}
        apiClient={apiClient}
        projectId={project}
      />
    </aside>
  );
};

export default PropertiesPanel; 