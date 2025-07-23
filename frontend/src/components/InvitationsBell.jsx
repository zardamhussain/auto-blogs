import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import './InvitationsBell.css';

const InvitationsBell = () => {
    const { invitations, acceptInvitation, declineInvitation } = useProjects();
    const [isOpen, setIsOpen] = useState(false);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    return (
        <div className="invitations-bell-container">
            <button onClick={() => setIsOpen(!isOpen)} className="bell-icon">
                <span>&#128276;</span>
                {invitations.length > 0 && <span className="notification-badge">{invitations.length}</span>}
            </button>
            {isOpen && (
                <div className="invitations-dropdown">
                    <button onClick={() => setIsOpen(false)} className="close-btn">&times;</button>
                    {invitations.map(invitation => (
                        <div key={invitation.token} className="invitation-item">
                            <p>You have been invited to join project <strong>{invitation.project_name}</strong> as a {invitation.role}.</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InvitationsBell; 