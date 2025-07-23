import React, { useState, useEffect } from 'react';
import { TbCopy, TbCheck } from 'react-icons/tb';
import './InvitationLinkModal.css';

const InvitationLinkModal = ({ isOpen, onClose, invitationLink }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleCopy = () => {
        if (!invitationLink) return;
        navigator.clipboard.writeText(invitationLink);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000); // Revert back to copy icon after 2 seconds
    };

    return (
        <div className="invitation-link-modal-overlay" onClick={onClose}>
            <div className="invitation-link-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>Invitation Link Generated</h2>
                <p>Share this link with the user you want to invite to the project.</p>
                <div className="invitation-link-display">
                    <span>{invitationLink}</span>
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

export default InvitationLinkModal; 