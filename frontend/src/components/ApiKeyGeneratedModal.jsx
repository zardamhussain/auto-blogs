import React, { useState, useEffect } from 'react';
import { TbCopy, TbCheck } from 'react-icons/tb';
import './ApiKeyGeneratedModal.css';

const ApiKeyGeneratedModal = ({ isOpen, onClose, apiKey }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // Reset the copied state when the modal is reopened with a new key
        if (isOpen) {
            setIsCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000); // Revert back to copy icon after 2 seconds
    };

    return (
        <div className="api-key-modal-overlay" onClick={onClose}>
            <div className="api-key-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>API Key Generated</h2>
                <p>Please copy this key and store it securely. You will not be able to see it again.</p>
                <div className="api-key-display">
                    <span>{apiKey}</span>
                    <button onClick={handleCopy} className="copy-button" disabled={isCopied}>
                        {isCopied ? (
                            <>
                                <TbCheck /> Copied
                            </>
                        ) : (
                            <>
                                <TbCopy /> Copy
                            </>
                        )}
                    </button>
                </div>
                <button className="ok-button" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
};

export default ApiKeyGeneratedModal; 