import React, { useState } from 'react';
import './NewProjectModal.css'; // Re-using styles for consistency
import Loader from './ui/Loader';

const ConnectWebsiteModal = ({ isOpen, onClose, onGenerate, isProcessing }) => {
    const [url, setUrl] = useState('');

    const handleGenerateClick = () => {
        if (url.trim()) {
            onGenerate(url);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Connect Your Website</h2>
                <p className="modal-subtitle">
                    Use your website’s content, tone, and structure to generate more personalized, on-brand blogs automatically.
                </p>
                <div className="form-group">
                    <label htmlFor="websiteUrl">Website URL</label>
                    <input
                        id="websiteUrl"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        autoFocus
                        disabled={isProcessing}
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="cancel-btn" disabled={isProcessing}>
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleGenerateClick} 
                        className="create-btn" 
                        disabled={isProcessing || !url.trim()}
                    >
                        {isProcessing ? <Loader size="small" /> : 'Generate Brand Content'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectWebsiteModal; 