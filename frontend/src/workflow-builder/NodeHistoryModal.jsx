import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExpandedDataView } from './DataViewer';
import './NodeHistoryModal.css';

const PAGE_SIZE = 10;

// --- Node History Modal ---

const fetchNodeHistory = async (apiClient, projectId, nodeId, page, pageSize) => {
    console.log("fetching node history");
    
  const { data } = await apiClient.get(`/workflows/node-runs/${nodeId}`, {
    params: { page, page_size: pageSize },
    headers: { 'X-Project-Id': projectId },
  });
  return data;
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  try {
    const duration = (new Date(end) - new Date(start)) / 1000;
    return `${duration.toFixed(2)}s`;
  } catch (e) {
    return 'N/A';
  }
}

const NodeHistoryModal = ({ isOpen, onClose, nodeId, nodeLabel, apiClient, projectId }) => {
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('output');
  const [expandedRunId, setExpandedRunId] = useState(null);
  const [expansionContentType, setExpansionContentType] = useState('data'); // 'data' or 'error'

  const queryEnabled = isOpen && !!projectId && !!nodeId;
  console.log(`NodeHistoryModal: Props received - isOpen: ${isOpen}, projectId: ${projectId}, nodeId: ${nodeId}`);
  console.log(`NodeHistoryModal: Query enabled status is: ${queryEnabled}`);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['nodeHistory', projectId, nodeId, page],
    queryFn: () => fetchNodeHistory(apiClient, projectId, nodeId, page, PAGE_SIZE),
    enabled: queryEnabled,
    keepPreviousData: true,
  });

  const outputKeys = useMemo(() => {
    if (!data?.runs?.[0]?.output) return [];
    const firstOutput = data.runs[0].output;
    // Special handling for blog_post
    if (firstOutput.blog_post && typeof firstOutput.blog_post === 'object') {
        return ['blog_post'];
    }
    return Object.keys(firstOutput);
  }, [data]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setPage(1);
      setViewType('output');
      setExpandedRunId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleToggleExpand = (runId, contentType) => {
    if (expandedRunId === runId && expansionContentType === contentType) {
        // Clicking the same button on an already open row, so close it.
        setExpandedRunId(null);
    } else {
        // Opening a new row, or switching content on an already open one.
        setExpandedRunId(runId);
        setExpansionContentType(contentType);
    }
  };

  return (
    <div className="nh-modal-overlay" onClick={onClose}>
      <div className="nh-modal-content" onClick={e => e.stopPropagation()}>
        <div className="nh-modal-header">
          <h3>{nodeLabel}</h3>
          <button onClick={onClose} className="nh-close-btn">&times;</button>
        </div>
        <div className="nh-modal-body">
          <div className="nh-controls">
            <div className="nh-view-toggle">
              <button onClick={() => setViewType('input')} className={viewType === 'input' ? 'active' : ''}>Input</button>
              <button onClick={() => setViewType('output')} className={viewType === 'output' ? 'active' : ''}>Output</button>
            </div>
          </div>
          {isLoading ? (
            <div className="nh-loading-state">Loading history...</div>
          ) : isError ? (
            <div className="nh-error-state">Error: {error.message}</div>
          ) : data ? (
            <>
              <div className="nh-table-container">
                <table className="nh-history-table">
                  <thead>
                    <tr>
                      <th>Run ID</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>{viewType === 'input' ? 'Input' : 'Output'} Data</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.runs.length > 0 ? data.runs.map(run => {
                      const isDataExpandable = (run.input !== null && run.input !== undefined) || (run.output !== null && run.output !== undefined);
                      const isErrorExpandable = run.error_message;

                      return (
                        <React.Fragment key={run.id}>
                            <tr>
                                <td title={run.id}>{run.id.substring(0, 8)}...</td>
                                <td>{formatDateTime(run.started_at)}</td>
                                <td>{calculateDuration(run.started_at, run.finished_at)}</td>
                                <td><span className={`nh-status ${run.status}`}>{run.status}</span></td>
                                <td className="nh-data-cell">
                                    {isDataExpandable ? (
                                        <button className="nh-view-btn" onClick={() => handleToggleExpand(run.id, 'data')}>
                                            {(expandedRunId === run.id && expansionContentType === 'data') ? 'Hide Data' : 'View Data'}
                                        </button>
                                    ) : 'N/A'}
                                </td>
                                <td className="nh-error-cell">
                                    {isErrorExpandable ? (
                                        <button className="nh-view-btn error" onClick={() => handleToggleExpand(run.id, 'error')}>
                                            {(expandedRunId === run.id && expansionContentType === 'error') ? 'Hide Error' : 'View Error'}
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                            {expandedRunId === run.id && (
                                <tr className="nh-expansion-row">
                                    <td colSpan="6">
                                        <ExpandedDataView data={expansionContentType === 'data' ? (viewType === 'input' ? run.input : run.output) : run.error_message} />
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                      )
                    }) : (
                      <tr>
                        <td colSpan="6" className="nh-empty-cell">
                          No runs found for this node.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="nh-pagination">
                  <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1 || isFetching}>&laquo; Prev</button>
                  <span>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || isFetching}>Next &raquo;</button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NodeHistoryModal; 