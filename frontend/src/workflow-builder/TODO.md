# Workflow-Builder UI – TODO & Progress Log
Generated 2025-06-23

Priority key
• **P0 – Critical** (already fixed) ✅
• **P1 – High** (next up)
• **P2 – Medium**
• **P3 – Low**

---
## ✅ Completed – P0 Critical fixes
| ID | Summary |
|----|---------|
| P0-1 | Node drop coordinates use `project()` |
| P0-2 | Pane click deselects node |
| P0-3 | Delete-key fully cleans nodes/edges/results |
| P0-4 | Properties panel reacts to block catalogue load |
| P0-5 | Edge-chip removal by `id` not reference |

---
## ⏭️  Current focus – P1 High priority
| ID | Symptom | Status |
|----|---------|--------|
| P1-1 | Numeric inputs accepted & stored correctly | ✅ Fixed in `PropertiesPanel.jsx` |
| P1-2 | Status/output reset between runs | ✅ Fixed in `WorkflowBuilderPage.jsx` |
| P1-3 | Multiple incoming edges display/remove properly | ✅ Fixed in `PropertiesPanel.jsx` |
| P1-4 | `nodeResults` cleared on workflow switch | ✅ Fixed in `WorkflowBuilderPage.jsx` |

Additional high-priority UX improvement (from previous P2):

| ID | Symptom | Root-cause / File | Action |
|----|---------|------------------|--------|
| P1-5 | Node colours hard-coded | `FunctionNode.jsx` | Use `blockCatalogue[..].color_hex` first → implemented ✅ |

---
## Backlog – P2 Medium
| ID | Symptom | Notes |
|----|---------|-------|
| P2-1 | Array input split/join inconsistent |
| P2-2 | Disabled palette blocks still draggable |
| P2-3 | Node colours hard-coded; ignore `color_hex` |
| P2-4 | No "running" visual state |
| P2-5 | Input padding after chip removal |

---
## Backlog – P3 Low / Cleanup
| ID | Symptom | Notes |
|----|---------|-------|
| P3-1 | `updateNodeData` unused |
| P3-2 | Dead import in `NewWorkflowModal.jsx` |
| P3-3 | General CSS polish |

---
### Next steps
1. Implement P1-1 … P1-4 sequentially; each should include unit tests where feasible.
2. After P1 merge → tackle P2 batch.
3. Weekly review to prune remaining P3 items. 