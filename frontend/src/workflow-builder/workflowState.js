import { create } from 'zustand';

const useWorkflowStore = create((set) => ({
  nodes: [],
  edges: [],
  workflows: [],
  workflowId: null,
  selectedNodeId: null,
  nodeResults: {},
  blockCatalogue: {},
  edgeType: 'smoothstep',
  lastRun: null,
  toggleEdgeType: () =>
    set((state) => ({ edgeType: state.edgeType === 'smoothstep' ? 'straight' : 'smoothstep' })),
  setNodes: (update) =>
    set((state) => ({ nodes: typeof update === 'function' ? update(state.nodes) : update })),
  setEdges: (update) =>
    set((state) => ({ edges: typeof update === 'function' ? update(state.edges) : update })),
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    })),
  setNodeResult: (id, result) =>
    set((state) => ({
      nodeResults: { ...state.nodeResults, [id]: result },
    })),
  clearNodeResults: (ids) =>
    set((state) => {
      const next = { ...state.nodeResults };
      ids.forEach((i) => delete next[i]);
      return { nodeResults: next };
    }),
  updateNodeInput: (id, key, value) =>
    set((state) => {
      console.log('Updating node input:', {
        nodeId: id,
        inputKey: key,
        newValue: value,
        currentNode: state.nodes.find(n => n.id === id)
      });
      return {
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, inputs: { ...(n.data.inputs||{}), [key]: value } } } : n
      ),
      };
    }),
  setBlockCatalogue: (catalogue) => {
    console.log('Setting block catalogue:', catalogue);
    set({ blockCatalogue: catalogue });
  },
  setWorkflowId: (id) => set({ workflowId: id }),
  edgeSelection: null,
  showEdgeSelector: (payload) => {
    console.log('Showing edge selector:', payload);
    set({ edgeSelection: payload });
  },
  hideEdgeSelector: () => set({ edgeSelection: null }),
  setWorkflows: (update) =>
    set((state) => ({
      workflows: typeof update === 'function' ? update(state.workflows) : update,
    })),
  updateWorkflow: (id, payload) => set(state => ({
    workflows: state.workflows.map(w => w.id === id ? { ...w, ...payload } : w)
  })),
  setLastRun: (run) => set({ lastRun: run }),
}));

export default useWorkflowStore; 