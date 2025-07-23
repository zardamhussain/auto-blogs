import React from 'react';
import './PendingInvitations.css';

const PendingInvitations = ({ invitations, onAccept, onDecline }) => {
    if (!invitations || invitations.length === 0) {
        return null;
    }

    return (
        <div className="pending-invitations-container">
            <h2>Pending Invitations</h2>
            <div className="invitations-list">
                {invitations.map(invitation => (
                    <div key={invitation.id} className="invitation-card">
                        <div className="invitation-details">
                            <p>
                                You have been invited to join the project <strong>{invitation.project?.name || 'an unnamed project'}</strong> as a <strong>{invitation.role}</strong>.
                            </p>
                        </div>
                        <div className="invitation-actions">
                            <button onClick={() => onAccept(invitation.token)} className="accept-btn">Accept</button>
                            <button onClick={() => onDecline(invitation.token)} className="reject-btn">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingInvitations; 