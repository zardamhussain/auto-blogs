import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import Loader from './ui/Loader';
import './ProjectOnboardingModal.css';

const ProjectOnboardingModal = ({ isOpen, onClose }) => {
    const { apiClient, createUntitledProject } = useProjects();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    console.log("ProjectOnboardingModal: isOpen prop:", isOpen);

    const handleCreateProject = async (projectName) => {
        console.log("ProjectOnboardingModal: handleCreateProject called with name:", projectName);
        if (!projectName.trim()) {
            setError('Project name is required.');
            console.log("ProjectOnboardingModal: Project name is empty.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await apiClient.post('/projects/', { name: projectName, description: '' });
            console.log("ProjectOnboardingModal: Project created successfully via handleCreateProject.");
            onClose();
            console.log("ProjectOnboardingModal: onClose called after project creation.");
        } catch (err) {
            console.error("ProjectOnboardingModal: Failed to create project:", err);
            setError(err.response?.data?.detail || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        console.log("ProjectOnboardingModal: handleSkip called.");
        setIsSubmitting(true);
        try {
            await createUntitledProject();
            console.log("ProjectOnboardingModal: createUntitledProject finished.");
            onClose();
            console.log("ProjectOnboardingModal: onClose called after skip.");
        } catch (error) {
            console.error("ProjectOnboardingModal: Error creating untitled project via skip:", error);
            setError('Failed to create untitled project.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCreateProject(name);
    };

    if (!isOpen) {
        console.log("ProjectOnboardingModal: Modal is not open.");
        return null;
    }

    return (
        <div className="onboarding-modal-overlay">
            <div className="onboarding-modal-content">
                <div className="onboarding-modal-header">
                    <h2>Welcome! Let's Get Started.</h2>
                    <p>Create your first project to organize your work.</p>
                </div>
                <form onSubmit={handleSubmit} className="onboarding-modal-form">
                    <div className="form-group">
                        <label htmlFor="onboardingProjectName">Project Name</label>
                        <input
                            id="onboardingProjectName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My SEO Campaign"
                            autoFocus
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="onboarding-modal-actions">
                        <button 
                            type="button" 
                            onClick={handleSkip} 
                            className="skip-btn"
                            disabled={isSubmitting}
                        >
                            Skip for now
                        </button>
                        <button 
                            type="submit" 
                            className="create-btn" 
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? <Loader variant="light" /> : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectOnboardingModal; 