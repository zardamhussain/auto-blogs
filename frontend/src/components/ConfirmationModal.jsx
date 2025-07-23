import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import './ConfirmationModal.css';

const ICONS = {
    danger: <AlertTriangle size={28} />,
    info: <Info size={28} />,
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
    if (!isOpen) {
        return null;
    }

    const Icon = ICONS[type];
    const confirmClass = type === 'danger' ? 'confirm-danger' : 'confirm-info';

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
                {Icon && (
                    <div className="modal-icon-container">
                        <div className={`${type}-icon`}>{Icon}</div>
                    </div>
                )}
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-button-group">
                    <button onClick={onClose} className="modal-btn cancel-btn">Cancel</button>
                    <button onClick={onConfirm} className={`modal-btn ${confirmClass}`}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; 