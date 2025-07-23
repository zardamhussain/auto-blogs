import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import PageHeader from '../components/PageHeader';
import NewWorkflowTemplateModal from '../components/NewWorkflowTemplateModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import WorkflowTemplateCard from '../components/WorkflowTemplateCard';
import WorkflowTemplateCardSkeleton from '../components/WorkflowTemplateCardSkeleton';
import { Plus } from 'lucide-react';
import './WorkflowTemplatesPage.css';
import useWorkflowStore from '../workflow-builder/workflowState';

const WorkflowTemplatesPage = () => {
    const { apiClient } = useProjects();
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState(null);
    const { addToast } = useToast();
    const setBlockCatalogue = useWorkflowStore(state => state.setBlockCatalogue);

    const fetchTemplates = () => {
        if (!apiClient) return;
        setIsLoading(true);
        apiClient.get('/workflow-templates/')
            .then(response => {
                setTemplates(response.data);
            })
            .catch(error => {
                console.error("Failed to fetch workflow templates:", error);
                addToast("Failed to fetch templates.", "error");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    useEffect(() => {
        fetchTemplates();
        // Also fetch block catalogue for the previews
        if (apiClient) {
            apiClient.get('/workflows/blocks')
                .then(res => {
                    const map = Object.fromEntries(res.data.map(b => [b.id, b]));
                    setBlockCatalogue(map);
                })
                .catch(() => setBlockCatalogue({}));
        }
    }, [apiClient, setBlockCatalogue]);

    const handleOpenCreateModal = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleOpenUpdateModal = (template) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (templateId) => {
        setDeletingTemplateId(templateId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingTemplateId) return;
        apiClient.delete(`/workflow-templates/${deletingTemplateId}`)
            .then(() => {
                addToast("Template deleted successfully!", "success");
                fetchTemplates(); // Refresh the list
            })
            .catch(error => {
                console.error("Failed to delete template:", error);
                addToast("Failed to delete template.", "error");
            })
            .finally(() => {
                setIsConfirmOpen(false);
                setDeletingTemplateId(null);
            });
    };

    const handleSaveTemplate = (templateData) => {
        const promise = editingTemplate
            ? apiClient.put(`/workflow-templates/${editingTemplate.id}`, templateData)
            : apiClient.post('/workflow-templates/', templateData);

        promise.then(() => {
                addToast(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`, "success");
                setIsModalOpen(false);
                fetchTemplates(); // Refresh the list
            })
            .catch(error => {
                console.error(`Failed to ${editingTemplate ? 'update' : 'create'} template:`, error);
                addToast(`Failed to ${editingTemplate ? 'update' : 'create'} template.`, "error");
            });
    };

    return (
        <div className="page-container dark">
            <header className="project-header">
                <h1>Workflow Templates</h1>
                <p>Choose a starting point or create a new workflow from scratch.</p>
            </header>
           
            <div className="page-content">
                <div className="template-grid">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <WorkflowTemplateCardSkeleton key={index} />
                        ))
                    ) : (
                        <>
                            <div
                                className="template-card new-template"
                                onClick={handleOpenCreateModal}
                            >
                                <div className="new-template-icon"><Plus size={48} /></div>
                                <div className="new-template-text">Blank Workflow</div>
                            </div>
                            {templates.map(template => (
                                <WorkflowTemplateCard
                                    key={template.id}
                                    template={template}
                                    onClick={() => handleOpenUpdateModal(template)}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
            <NewWorkflowTemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTemplate}
                template={editingTemplate}
            />
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Template"
                message="Are you sure you want to delete this template? This action cannot be undone."
            />
        </div>
    );
};

export default WorkflowTemplatesPage; 