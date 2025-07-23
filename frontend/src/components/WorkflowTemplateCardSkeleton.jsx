import React from 'react';
import Skeleton from './ui/Skeleton';
import './WorkflowTemplateCardSkeleton.css';

const WorkflowTemplateCardSkeleton = () => {
    return (
        <div className="template-card-skeleton">
            <Skeleton className="template-card-preview-skeleton" />
            <div className="template-card-title-skeleton">
                <Skeleton className="template-card-text-skeleton" />
            </div>
        </div>
    );
};

export default WorkflowTemplateCardSkeleton; 