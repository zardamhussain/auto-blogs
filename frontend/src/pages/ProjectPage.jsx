import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import createApiClient from '../api/apiClient';
import NewProjectModal from '../components/NewProjectModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InvitationLinkModal from '../components/InvitationLinkModal';
import { PlusCircle } from 'lucide-react';
import PendingInvitations from '../components/PendingInvitations';
import { useToast } from '../context/ToastContext';
import './ProjectPage.css';
import Loader from '../components/ui/Loader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ProjectPage = () => {
    const { appToken, user } = useAuth();

    const { projects,selectedProject: contextSelectedProject, setSelectedProject: setContextProject, loading, apiClient,  fetchProjects,currentUserRole, invitations, acceptInvitation,
        declineInvitation,removeProjectById, activeBrandProcessingProjectId, initiateBrandProcessing,  
        } = useProjects();
    const { addToast } = useToast();

    const [selectedProject, setSelectedProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isLeaveConfirmModalOpen, setIsLeaveConfirmModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [generalName, setGeneralName] = useState("");
    const [generalDescription, setGeneralDescription] = useState("");
    const [generalSaving, setGeneralSaving] = useState(false);
    const [generalSuccess, setGeneralSuccess] = useState(false);
    const [generalError, setGeneralError] = useState("");
    
    const [invitationLink, setInvitationLink] = useState('');
    const [activeTab, setActiveTab] = useState('settings');
    

    // Environment State
    const [brandUrl, setBrandUrl] = useState('');
    const [brandContentViewMode, setBrandContentViewMode] = useState('preview');
    const [editableBrandContent, setEditableBrandContent] = useState('');
    const [isUpdatingBrandContent, setIsUpdatingBrandContent] = useState(false);

    const isProcessingUrl = activeBrandProcessingProjectId === selectedProject?.id;


    useEffect(() => {
        if (projects.length > 0) {
            if (selectedProject?.id) {
                const freshProjectData = projects.find(p => p.id === selectedProject.id);
                if (freshProjectData) {
                    // By setting state with the object from the projects array,
                    // we ensure our local state is always in sync with the context.
                    setSelectedProject(freshProjectData);
                } else {
                    // The previously selected project might no longer exist (e.g., deleted),
                    // so we fall back to selecting the first project.
                    setSelectedProject(projects[0]);
                }
            } else {
                // If no project is selected, default to the first one in the list.
                setSelectedProject(projects[0]);
            }
        } else {
            // If there are no projects, clear the selection.
            setSelectedProject(null);
        }
    }, [projects]);
    useEffect(() => {
        if (selectedProject) {

            setGeneralName(selectedProject.name || "");
            setGeneralDescription(selectedProject.description || "");
            setBrandUrl(selectedProject.brand_url || '');
            setEditableBrandContent(selectedProject.brand_content || '');
            } else {
            // Clear all fields if no project is selected
            setGeneralName("");
            setGeneralDescription("");
            setBrandUrl("");
            setEditableBrandContent('');
            }
            }, [selectedProject, projects]); // Depend on 'projects' as well to get new brand_content

    
    const handleAccept = async (token) => {
        try {
            await acceptInvitation(token);
            addToast('Invitation accepted!', 'success');
        } catch (error) {
            addToast('Failed to accept invitation.', 'error');
        }
    };

          
    
    const handleDecline = async (token) => {
        try {
            await declineInvitation(token);
            addToast('Invitation declined.', 'success');
        } catch (error) {
            addToast('Failed to decline invitation.', 'error');
        }
    };
    
    const fetchMembers = async (projectId) => {
        if (!projectId) return;
        console.log(`Fetching members for project: ${projectId}`);
        try {
            const response = await apiClient.get(`/projects/${projectId}/members`);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
            addToast('Failed to fetch project members.', 'error');
            setMembers([]);
        }
    };

    useEffect(() => {
        if (selectedProject) {
            console.log('Selected project changed, starting fetch.');
            fetchMembers(selectedProject.id);
        } else {
            setMembers([]);
        }
    }, [selectedProject, appToken]);

    const handleInvite = async () => {
        if (!selectedProject || !inviteEmail) return;

        if (user && user.email === inviteEmail) {
            addToast("You cannot invite yourself to the project.", "error");
            return;
        }
    
        try {
            const response = await apiClient.post(`/projects/${selectedProject.id}/invitations`, {
                email_to: inviteEmail,
                role: inviteRole,
            });
    
            const data = response.data;
    
            // Update invitation link and show modal
            setInvitationLink(data.invitation_link);
            setIsInvitationModalOpen(true);
    
            // Optionally add invitee to member list if API returns member data
            if (data.email_to) {
                setMembers(prevMembers => [...prevMembers, {
                    ...data,
                    email: data.email_to,
                }]);
            }
    
            // Reset input fields
            setInviteEmail('');
            setInviteRole('viewer');
    
            // Refresh projects and members
            fetchProjects();
            fetchMembers(selectedProject.id);
    
            addToast('Invitation sent successfully!', 'success');
    
        } catch (error) {
            const errorData = error.response?.data;
            let errorMessage = "An unknown error occurred.";
    
            if (errorData?.detail) {
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => `${err.msg} (in ${err.loc.join(', ')})`).join('\n');
                } else if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                }
            }
    
            addToast(errorMessage, 'error');
            console.error("Error creating invitation", error);
        }
    };
    

    const handleRemoveMember = async () => {
    if (!memberToRemove || !selectedProject) return;

    try {
        await apiClient.delete(`/projects/${selectedProject.id}/members/${memberToRemove.id}`);
        setMembers(prevMembers => prevMembers.filter(m => m.id !== memberToRemove.id));
        addToast('Member removed successfully.', 'success');
    } catch (error) {
        console.error('Error removing member:', error);
        addToast('An error occurred while removing the member.', 'error');
    } finally {
        setIsConfirmModalOpen(false);
        setMemberToRemove(null);
    }
};

const handleLeaveProject = async () => {
    if (!selectedProject) return;

    try {
        await apiClient.post(`/projects/${selectedProject.id}/leave`);
        addToast("You have successfully left the project.", "success");
        
        // After leaving, invalidate projects cache and refetch
        removeProjectById(selectedProject.id); // This will also handle project deselection
        
        // This will refetch the project list, which will no longer include the one you left.
        fetchProjects(); 

    } catch (error) {
        console.error('Error leaving project:', error);
        addToast(error.response?.data?.detail || 'Failed to leave the project.', 'error');
    } finally {
        setIsLeaveConfirmModalOpen(false);
    }
};

    const openConfirmationModal = (member) => {
        setMemberToRemove(member);
        setIsConfirmModalOpen(true);
    };

    const openDeleteConfirmationModal = (project) => {
        const projectDetails = projects.find(p => p.id === project);
        setProjectToDelete(projectDetails);
        setIsDeleteConfirmModalOpen(true);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await apiClient.delete(`/projects/${projectToDelete.id}`);
            addToast('Project deleted successfully.', 'success');
            fetchProjects(); // Refetch projects list
        } catch (error) {
            console.error('Error deleting project:', error);
            addToast('Failed to delete project.', 'error');
        } finally {
            setIsDeleteConfirmModalOpen(false);
            setProjectToDelete(null);
        }
    };

    const handleRoleChange = async (member, newRole) => {
        if (!selectedProject || !member || member.status === 'pending') {
            console.log('Role change aborted: No project/member selected, or invitation is pending.');
            return;
        }
    
        console.log(`Attempting to change role for member ID: ${member.id} to ${newRole}`);
    
        try {
            await apiClient.put(`/projects/${selectedProject.id}/members/${member.id}`, { role: newRole });
    
            addToast('Role updated successfully.', 'success');
    
            // Update local members list with new role
            setMembers(prevMembers =>
                prevMembers.map(m =>
                    m.id === member.id ? { ...m, role: newRole } : m
                )
            );
    
        } catch (error) {
            const errorData = error.response?.data;
            console.error('Failed to update member role:', errorData);
            addToast(`Failed to update role: ${errorData?.detail || 'An unknown error occurred.'}`, 'error');
        }
    };
    

    const handleProjectCreated = (newProject) => {
        setIsModalOpen(false);
        fetchProjects(); // Re-fetch the project list
        setContextProject(newProject.id); // Update the global context
        setSelectedProject(newProject); // Update the local state
    };

    const handleProjectSelect = (project) => {
        // When switching projects, immediately update the selected project
        // and let the useEffect handle state changes.
        setSelectedProject(project);
        setContextProject(project.id);
    };
    
    // Find the full project object from the list
    const currentProjectDetails = projects.find(p => p.id === selectedProject?.id);

   
    const handleSaveGeneral = async () => {
        if (!selectedProject) return;
        setGeneralSaving(true);
        try {
            const payload = { 
                name: generalName, 
                description: generalDescription 
            };
            const response = await apiClient.put(`/projects/${selectedProject.id}`, payload);
            if (response.status === 200) {
                addToast('Project general settings updated!', 'success');
                await fetchProjects(); // Await fetching to ensure project list is updated
            } else {
                addToast('Failed to update project', 'error');
            }
        } catch (error) {
            let msg = 'An error occurred while updating project.';
            if (error.response && error.response.data && error.response.data.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    msg = error.response.data.detail.map(e => e.msg).join(', ');
                } else {
                    msg = error.response.data.detail;
                }
            }
            addToast(msg, 'error');
        } finally {
            setGeneralSaving(false);
        }
    };

    const handleProcessUrl = async () => {
        if (!brandUrl || !selectedProject) {
            addToast('Please enter a valid URL.', 'error');
            return;
        }
        // Use the global function from the context
        await initiateBrandProcessing(selectedProject.id, brandUrl);
    };

    const handleUpdateBrandContent = async () => {
        if (!selectedProject || !editableBrandContent) return;
        setIsUpdatingBrandContent(true);
        try {
            await apiClient.patch(`/projects/${selectedProject.id}/brand-content`, {
                brand_content: editableBrandContent
            });
            addToast('Brand content updated successfully!', 'success');
            await fetchProjects(); // Refresh project data
        } catch (error) {
            addToast(error.response?.data?.detail || 'Failed to update brand content.', 'error');
        } finally {
            setIsUpdatingBrandContent(false);
        }
    };

    return (
        <div className="project-page">
            <header className="project-header">
                <h1>Project Management</h1>
                <p>Create new projects and manage members, roles, and settings.</p>
            </header>

            <div className="project-layout">
                <div className="project-list-panel">
                    <div className="panel-header">
                        <h2>All Projects</h2>
                        <button className="new-project-btn" onClick={() => setIsModalOpen(true)}>+ New Project</button>
                    </div>
                    <div className="project-list">
                        {projects.map(p => (
                            <div 
                                key={p.id} 
                                className={`project-list-item ${selectedProject?.id === p.id ? 'active' : ''}`}
                                onClick={() => handleProjectSelect(p)}
                            >
                                <span className="project-name">{p.name}</span>
                                <span className="project-member-count">{p.members?.length || 0} members</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="project-details-panel">
                    <div className="project-tabs">
                        <button
                            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('invitations')}
                        >
                            Pending Invitations {invitations.length > 0 && <span className="invitation-count">{invitations.length}</span>}
                        </button>
                    </div>
                    
                    {activeTab === 'settings' && (
                        currentProjectDetails ? (
                            <div className="project-details-grid">
                                {/* General Settings */}
                                <div className="project-card">
                                    <h3>General Settings</h3>
                                    <div className="form-group">
                                        <label>Project Name</label>
                                        <input type="text"value={generalName} onChange={(e) => setGeneralName(e.target.value)} disabled={currentUserRole !== 'owner'}  />
                                        
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea rows="3" value={generalDescription} onChange={(e) => setGeneralDescription(e.target.value)} disabled={currentUserRole !== 'owner'}  ></textarea>
                                    </div>
                                    {currentUserRole === 'owner' && (
                                        <div className="card-footer">
                                            <button className="save-btn" onClick={handleSaveGeneral}disabled={generalSaving}>
                                                {generalSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            {generalSuccess && (
                                                <span style={{ color: 'green', marginLeft: 12 }}>Saved!</span>
                                            )}
                                            {generalError && (
                                                <span style={{ color: 'red', marginLeft: 12 }}>{generalError}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Environment Settings */}
                                <div className="project-card">
                                <h3>Environment</h3>
                                <p>Provide a homepage URL to ground the AI in your brand's voice and style.</p>
                                <div className="form-group">
                                    <label>Homepage URL</label>
                                    <input 
                                        type="text" 
                                        value={brandUrl}
                                        onChange={(e) => setBrandUrl(e.target.value)}
                                        placeholder="https://www.example.com"
                                        disabled={isProcessingUrl}
                                    />
                                </div>
                                <button className="save-btn" onClick={handleProcessUrl} disabled={isProcessingUrl}>
                                        {isProcessingUrl ? <div className="loader-in-button"></div> : 'Generate'}
                                    </button>
                                {selectedProject && (selectedProject.brand_info_status === 'completed' || selectedProject.brand_info_status === 'failed') && (
                                    <div className="form-group" style={{marginTop: '1.5rem'}}>
                                        <div className="brand-content-header">
                                            <label>Generated Brand Content</label>
                                            <div className="view-mode-toggle">
                                                <button className={brandContentViewMode === 'preview' ? 'active' : ''} onClick={() => setBrandContentViewMode('preview')}>Preview</button>
                                                <button className={brandContentViewMode === 'raw' ? 'active' : ''} onClick={() => setBrandContentViewMode('raw')}>Raw</button>
                                            </div>
                                        </div>
                                        {brandContentViewMode === 'preview' ? (
                                            <div className="markdown-preview">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {selectedProject.brand_content || ''}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <textarea
                                                rows="8"
                                                value={editableBrandContent}
                                                onChange={(e) => setEditableBrandContent(e.target.value)}
                                                className={selectedProject.brand_info_status === 'failed' ? 'failed-content' : ''}
                                            />
                                        )}
                                        {brandContentViewMode === 'raw' && (
                                            <div className="card-footer" style={{ marginTop: '0.5rem' }}>
                                                <button className="save-btn" onClick={handleUpdateBrandContent} disabled={isUpdatingBrandContent}>
                                                    {isUpdatingBrandContent ? <Loader size="small" /> : 'Update Content'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                                {/* Member Management */}
                                <div className="project-card large-card">
                                    <h3>Members</h3>
                                    {/* Git-Conflict-Comment: The following block is for the user invitation form.
                                        It is only visible to the project 'owner'.
                                        If there are merge conflicts, ensure this visibility rule is maintained. */}
                                    {currentUserRole === 'owner' && (
                                        <>
                                            <p>Invite and manage who has access to this project.</p>
                                            <div className="invite-member-form">
                                                <input 
                                                    type="email" 
                                                    placeholder="Invite user by email..." 
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                />
                                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                                                    <option value="viewer">Viewer</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="owner">Owner</option>
                                                </select>
                                                <button onClick={handleInvite}>Invite</button>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="member-list">
                                        {members.map((member, index) => (
                                            <div key={member.id || index} className="member-list-item">
                                                <span className="user-info">{member.email}</span>
                                                {member.status && (
                                                    <span className={`status-badge status-${member.status.toLowerCase()}`}>
                                                        {member.status === 'active' ? 'Accepted' : 'Pending'}
                                                    </span>
                                                )}
                                                <div className="role-and-actions">
                                                    <select 
                                                        value={member.role} 
                                                        onChange={(e) => handleRoleChange(member, e.target.value)}
                                                        // Git-Conflict-Comment: Role dropdown is disabled for non-owners.
                                                        disabled={currentUserRole !== 'owner'}
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="owner">Owner</option>
                                                    </select>
                                                    {/* Git-Conflict-Comment: Removal button logic. Owners can remove anyone. Admins can remove non-owners. */}
                                                    {currentUserRole === 'owner' && (
                                                        <button className="remove-btn" onClick={() => openConfirmationModal(member)}>Remove</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Danger Zone */}
                                {/* Git-Conflict-Comment: Danger zone is only visible to the project 'owner'. */}
                                {currentUserRole === 'owner' && (
                                    <div className="project-card danger-zone">
                                        <h3>Danger Zone</h3>
                                        <p>Irreversible and destructive actions.</p>
                                        <div className="setting-row">
                                            <span>Delete this project</span>
                                            <button className="delete-btn" onClick={() => openDeleteConfirmationModal(selectedProject.id)}>Delete</button>
                                        </div>
                                    </div>
                                )}
                                 { (currentUserRole === 'admin' || currentUserRole === 'viewer') && (
                                    <div className="project-card danger-zone">
                                        <h3>Danger Zone</h3>
                                        <p>Leave this project and lose all access.</p>
                                        <div className="setting-row">
                                            <span>Leave this project</span>
                                            <button className="delete-btn" onClick={() => setIsLeaveConfirmModalOpen(true)}>Leave Project</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-project-selected">
                                <PlusCircle size={48} />
                                <h2>No Project Selected</h2>
                                <p>Select a project from the list or create a new one.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'invitations' && (
                        <div className="pending-invitations-wrapper">
                            {invitations.length > 0 ? (
                                <PendingInvitations
                                    invitations={invitations}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                />
                            ) : (
                                <div className="no-project-selected">
                                    <p>No pending invitations.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={handleProjectCreated} />
            
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleRemoveMember}
                    title="Confirm Removal"
                    message={`Are you sure you want to remove ${memberToRemove?.email} from the project?`}
                />
            )}
            {isDeleteConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteConfirmModalOpen}
                    onClose={() => setIsDeleteConfirmModalOpen(false)}
                    onConfirm={handleDeleteProject}
                    title="Confirm Project Deletion"
                    message={`Are you sure you want to delete the project "${projectToDelete?.name}"? This action is irreversible.`}
                />
            )}
            {isInvitationModalOpen && (
                <InvitationLinkModal
                    isOpen={isInvitationModalOpen}
                    onClose={() => setIsInvitationModalOpen(false)}
                    invitationLink={invitationLink}
                />
            )}
            {isLeaveConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isLeaveConfirmModalOpen}
                    onClose={() => setIsLeaveConfirmModalOpen(false)}
                    onConfirm={handleLeaveProject}
                    title="Confirm Leave Project"
                    message="Are you sure you want to leave this project? You will lose access to all its resources."
                />
            )}
        </div>
    );
};

export default ProjectPage; 