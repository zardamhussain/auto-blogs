import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';

// --- Reusable Data Viewer Components ---

const isDictionary = (data) => typeof data === 'object' && data !== null && !Array.isArray(data);

// Renders the final value (markdown or JSON)
export const ValueRenderer = ({ data }) => {
    if (data === null || data === undefined) {
        return <div className="nh-no-data">(No data)</div>;
    }
    if (typeof data === 'string') {
        return (
            <div className="nh-markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data}</ReactMarkdown>
            </div>
        );
    }
    return <JsonView src={data} theme="default" />;
};

// Renders the main content area, handling nested horizontal tabs if the data is a dictionary.
export const ContentPanel = ({ data }) => {
    if (isDictionary(data)) {
        const keys = Object.keys(data);

        // If it's a dictionary with only one key, just render its content directly
        // by calling this component again. This handles nested single-key objects.
        if (keys.length === 1) {
            return <ContentPanel data={data[keys[0]]} />;
        }
        
        const [activeTab, setActiveTab] = useState();
        useEffect(() => {
            setActiveTab(keys[0] || null);
        }, [data]);

        if (keys.length === 0) return <div className="nh-no-data">Empty object</div>;

        return (
            <div className="nh-tabs-container">
                <div className="nh-tabs">
                    {keys.map(key => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`nh-tab-btn ${activeTab === key ? 'active' : ''}`}>{key}</button>
                    ))}
                </div>
                <div className="nh-tab-content">
                    {activeTab && <ContentPanel data={data[activeTab]} />}
                </div>
            </div>
        );
    }
    
    // If data is not a dictionary (e.g., string, array), render it directly.
    return <ValueRenderer data={data} />;
};

// The main layout component with a sidebar for primary keys and a content panel on the right.
export const ExpandedDataView = ({ data }) => {
    let sidebarKeys = isDictionary(data) ? Object.keys(data) : [];
    let contentData = data;

    // If the top-level data has a single key and its value is a dictionary,
    // then we treat the *inner* dictionary's keys as our primary sidebar keys.
    if (sidebarKeys.length === 1 && isDictionary(data[sidebarKeys[0]])) {
        const singleKey = sidebarKeys[0];
        sidebarKeys = Object.keys(data[singleKey]);
        contentData = data[singleKey];
    }
    
    const [activeSidebarKey, setActiveSidebarKey] = useState();

    useEffect(() => {
        setActiveSidebarKey(sidebarKeys[0] || null);
    }, [contentData]); // Depend on contentData as it determines the keys

    // If there are no keys for the sidebar, just render the content directly.
    if (sidebarKeys.length === 0) {
        return (
            <div className="nh-expanded-view">
                <ContentPanel data={data} />
            </div>
        );
    }

    return (
        <div className="nh-expanded-view nh-data-layout-container">
            <div className="nh-sidebar">
                {sidebarKeys.map(key => (
                    <button key={key} onClick={() => setActiveSidebarKey(key)} className={`nh-sidebar-btn ${activeSidebarKey === key ? 'active' : ''}`}>
                        {key}
                    </button>
                ))}
            </div>
            <div className="nh-content-panel">
                {activeSidebarKey && <ContentPanel data={contentData[activeSidebarKey]} />}
            </div>
        </div>
    );
}; 