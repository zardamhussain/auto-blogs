import React from "react";
import "./CtaCard.css";

const CtaCard = ({ title, status, createdAt, onClick, onDelete }) => {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDeleteClick = (e) => {
    if (onDelete) {
      e.stopPropagation();
      onDelete();
    }
  };

  return (
    <div className="cta-card" onClick={onClick}>
      <div className="cta-card-header">
        <h3 className="cta-card-title">{title}</h3>
        {status && (
          <span className={`cta-card-status ${status.toLowerCase()}`}>
            {status}
          </span>
        )}
      </div>
      <div className="cta-card-meta">
        <span>{formattedDate}</span>
        {onDelete && (
          <button
            className="cta-card-action-btn delete"
            onClick={handleDeleteClick}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default CtaCard;
