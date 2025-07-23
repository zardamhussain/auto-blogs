import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import './NewCtaModal.css';

const NewCtaModal = ({ isOpen, onClose, onGenerationSuccess, showToast, isGenerating, setIsGenerating }) => {
    const { user } = useAuth(); // Get user and apiClient from AuthContext
    const { selectedProject, apiClient } = useProjects(); // Potentially useful for project context, though not directly used in CTA API for now

    const [ctaQuery, setCtaQuery] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300); // Duration of the fade-out animation
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ctaQuery.trim() || isGenerating) return;

        setIsGenerating(true); // Set loading state in parent
        handleClose(); // Close modal immediately
        showToast('Generating new CTA...', 'generating');

        try {
            const { data } = await apiClient.post(`/cta/chat`, {
                user_id: user.id,
                content: ctaQuery,
                chat_id: null,
            });
            onGenerationSuccess(data.chat_id);
            showToast('CTA generated successfully!', 'success');
        } catch (error) {
            console.error('Error creating CTA:', error);
            showToast(error.response?.data?.detail || error.message, 'error');
            setIsGenerating(false);
        } finally {
            setCtaQuery('');
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setCtaQuery('');
            // setIsGenerating(false); // Controlled by parent
        }
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;

    return (
        <div 
            className={`new-cta-modal-overlay ${isClosing ? 'fade-out' : ''}`}
            onClick={handleClose}
        >
            <div 
                className={`new-cta-modal-content new-cta-modal ${isClosing ? 'fade-out' : ''}`} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Generate New CTA</h2>
                    <button onClick={handleClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="cta-query">CTA Instruction</label>
                        <p>Provide a detailed instruction for the CTA you want to generate. e.g., 'A vibrant blue button with text 'Learn More' and a subtle hover effect.'</p>
                        <textarea
                            id="cta-query"
                            rows="6"
                            placeholder="e.g., 'Generate a call-to-action button for a SaaS product. It should be green, say 'Get Started', and have a smooth animation on hover.'"
                            value={ctaQuery}
                            onChange={(e) => setCtaQuery(e.target.value)}
                            disabled={isGenerating} // Use isGenerating prop
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleClose}
                            disabled={isGenerating} // Use isGenerating prop
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="generate-btn" 
                            disabled={!ctaQuery.trim() || isGenerating} // Use isGenerating prop
                        >
                            {isGenerating ? 'Generating...' : 'Generate CTA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCtaModal; 