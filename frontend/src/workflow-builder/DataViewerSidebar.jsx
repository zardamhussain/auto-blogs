import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import './DataViewerSidebar.css';

const customJsonTheme = {
  // Using a style object for full control over colors
  background: '#121212',
  textColor: '#e0e0e0',
  stringColor: '#9ccc65',   // Light Green
  numberColor: '#ce93d8',   // Light Purple
  booleanColor: '#4fc3f7',  // Light Blue
  nullColor: '#ffcc80',     // Amber
  keyColor: '#81d4fa',        // Bright Light Blue for keys
  arrowColor: '#ffffff',      // White for visibility
  braceColor: '#e0e0e0',
  bracketColor: '#e0e0e0',
};

const DataViewerSidebar = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const isJson = typeof data === 'object' && data !== null;

  return (
    <>
      <div className="dv-sidebar-overlay" onClick={onClose}></div>
      <div className={`dv-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="dv-sidebar-header">
          <h3>Data Viewer</h3>
          <button onClick={onClose} className="dv-close-btn">&times;</button>
        </div>
        <div className="dv-sidebar-body">
          {isJson ? (
            <div className="json-view-container">
                <JsonView src={data} style={customJsonTheme} collapsed={1} />
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(data)}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DataViewerSidebar; 