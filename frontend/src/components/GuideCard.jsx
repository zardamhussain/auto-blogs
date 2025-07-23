import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { Trash2, Edit } from 'react-feather';
import './GuideCard.css';

const GuideCard = ({ guide, onDelete, onUpdateStatus, onEdit, userRole }) => {
    const { apiClient } = useProjects();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeSection, setActiveSection] = useState('base_knowledge');

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this style guide?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await apiClient.delete(`/prompts/${guide.id}`);
            onDelete(guide.id);
        } catch (error) {
            console.error('Error deleting guide:', error);
            alert('Failed to delete the style guide. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'base_knowledge':
                return guide.base_knowledge || 'No base knowledge content';
            case 'writing_style_guide':
                return guide.writing_style_guide || 'No writing style content';
            case 'image_style':
                return guide.image_style || 'No image style content';
            default:
                return 'Invalid section';
        }
    };

    return (
        <div className={`guide-card ${!guide.is_active ? 'inactive' : ''}`}>
            <div className="guide-header">
                <h3>{guide.name}</h3>
                {userRole && userRole !== 'viewer' && (
                    <div className="guide-actions">
                        <button 
                            className="action-btn"
                            onClick={() => onEdit(guide)}
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            className="action-btn delete"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
            <div className="guide-sections">
                <button 
                    className={`section-tab ${activeSection === 'base_knowledge' ? 'active' : ''}`}
                    onClick={() => setActiveSection('base_knowledge')}
                >
                    Base Knowledge
                </button>
                <button 
                    className={`section-tab ${activeSection === 'writing_style_guide' ? 'active' : ''}`}
                    onClick={() => setActiveSection('writing_style_guide')}
                >
                    Writing Style
                </button>
                <button 
                    className={`section-tab ${activeSection === 'image_style' ? 'active' : ''}`}
                    onClick={() => setActiveSection('image_style')}
                >
                    Image Style
                </button>
            </div>
            <div className="guide-content">
                {renderContent()}
            </div>
            <div className="guide-footer">
                <span className="guide-status">
                    {guide.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="guide-date">
                    Created: {new Date(guide.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

export default GuideCard; 