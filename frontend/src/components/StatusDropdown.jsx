import React, { useState } from 'react';
import './StatusDropdown.css';

const StatusDropdown = ({ currentStatus, onStatusChange, currentUserRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statuses = ['draft', 'published'];

    const handleSelect = (status) => {
        if (status !== currentStatus) {
            onStatusChange(status);
        }
        setIsOpen(false);
    };

    const isViewer = currentUserRole === 'viewer';

    if (isViewer) {
        return (
            <div className="status-display-viewer">
                <span className={`status-pill ${currentStatus?.toLowerCase()}`}>{currentStatus || 'DRAFT'}</span>
            </div>
        );
    }

    return (
        <div className="status-dropdown-container">
            <button className="status-display" onClick={() => setIsOpen(!isOpen)}>
                <span className={`status-pill ${currentStatus?.toLowerCase()}`}>{currentStatus || 'DRAFT'}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className="status-dropdown-menu">
                    {statuses.map(status => (
                        <div
                            key={status}
                            className={`dropdown-item ${currentStatus === status ? 'active' : ''}`}
                            onClick={() => handleSelect(status)}
                        >
                            {status}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatusDropdown; 