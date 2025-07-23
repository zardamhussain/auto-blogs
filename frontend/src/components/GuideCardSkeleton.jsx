import React from 'react';
import Skeleton from './ui/Skeleton';

const GuideCardSkeleton = () => {
    return (
        <div className="guide-card">
            <div className="guide-header">
                <Skeleton style={{ height: '24px', width: '70%' }} />
            </div>
            <div className="guide-sections">
                <Skeleton style={{ height: '36px', width: '120px' }} />
                <Skeleton style={{ height: '36px', width: '120px' }} />
                <Skeleton style={{ height: '36px', width: '120px' }} />
            </div>
            <div className="guide-content">
                <Skeleton style={{ height: '60px' }} />
            </div>
            <div className="guide-footer">
                <Skeleton style={{ height: '20px', width: '80px' }} />
                <Skeleton style={{ height: '20px', width: '150px' }} />
            </div>
        </div>
    );
};

export default GuideCardSkeleton; 