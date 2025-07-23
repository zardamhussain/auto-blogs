import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import './AcceptInvitationPage.css';

const AcceptInvitationPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [invitationDetails, setInvitationDetails] = useState(null);
    const { token } = useParams();
    
    const { user, handleLogout } = useAuth();
    const { fetchProjects, setSelectedProject, acceptInvitation, declineInvitation, apiClient } = useProjects();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError('No invitation token provided.');
            setIsLoading(false);
            return;
        }

        const fetchInvitation = async () => {
            try {
                const response = await apiClient.get(`/invitations/${token}`);
                setInvitationDetails(response.data);
            } catch (err) {
                setError('This invitation is no longer valid or has been withdrawn.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvitation();
    }, [token, apiClient]);

    const handleAccept = async () => {
        if (!token || !invitationDetails) return;
        try {
            await acceptInvitation(token);
            setSelectedProject(invitationDetails.project_id);
            navigate(`/projects/${invitationDetails.project_id}/dashboard`);
        } catch (err) {
            setError('Failed to accept the invitation. Please try again.');
        }
    };

    const handleDecline = async () => {
        if (!token) return;
        try {
            await declineInvitation(token);
            navigate('/');
        } catch (err) {
            setError('Failed to decline the invitation.');
        }
    };

    if (isLoading) {
        return <div className="accept-invitation-container"><h2>Loading Invitation...</h2></div>;
    }

    if (error) {
        return (
            <div className="accept-invitation-container">
                <div className="status-message error">
                    <h3>Error</h3>
                    <p>{error}</p>
                    {user && (
                        <p>You are currently logged in as <strong>{user.email}</strong>. This invitation might be for a different account.</p>
                    )}
                    <div className="button-group">
                        <button onClick={() => navigate('/')}>Go to Homepage</button>
                        {user && <button onClick={handleLogout}>Log Out</button>}
                    </div>
                </div>
            </div>
        );
    }
    
    if (invitationDetails) {
        if (!user) {
            return (
                 <div className="accept-invitation-container">
                    <div className="status-message error">
                        <h3>Authentication Required</h3>
                        <p>Please log in or sign up to respond to this invitation.</p>
                        <button onClick={() => navigate('/')}>Go to Homepage</button>
                    </div>
                </div>
            )
        }
        
        if (user.email.toLowerCase() !== invitationDetails.email_to.toLowerCase()) {
             return (
                 <div className="accept-invitation-container">
                    <div className="status-message warning">
                        <h3>Incorrect Account</h3>
                        <p>This invitation was sent to <strong>{invitationDetails.email_to}</strong>, but you are logged in as <strong>{user.email}</strong>.</p>
                        <p>Please log out and sign in with the correct account to accept this invitation.</p>
                        <div className="button-group">
                            <button onClick={handleLogout}>Log Out</button>
                            <button onClick={() => navigate('/')}>Go to Homepage</button>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="accept-invitation-backdrop">
                <div className="accept-invitation-modal">
                    <h3>You've been invited!</h3>
                    <p>You have been invited to join the project.</p>
                    <div className="modal-actions">
                        <button onClick={handleAccept} className="accept-btn">Accept</button>
                        <button onClick={handleDecline} className="decline-btn">Decline</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AcceptInvitationPage; 