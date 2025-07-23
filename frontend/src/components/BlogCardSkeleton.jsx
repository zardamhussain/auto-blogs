import React from 'react';
import Skeleton from './ui/Skeleton';

const BlogCardSkeleton = () => {
    return (
        <div className="blog-card">
            <div className="blog-card-header">
                <Skeleton className="blog-title-skeleton" style={{ height: '28px', width: '80%' }} />
                <Skeleton className="blog-status-skeleton" style={{ height: '24px', width: '60px' }} />
            </div>
            <div className="language-badges">
                <Skeleton style={{ height: '16px', width: '30px', borderRadius: '4px' }} />
                <Skeleton style={{ height: '16px', width: '30px', borderRadius: '4px' }} />
            </div>
            <div className="blog-meta">
                <Skeleton style={{ height: '20px', width: '100px' }} />
                <Skeleton style={{ height: '30px', width: '70px', borderRadius: '8px' }} />
            </div>
        </div>
    );
};

export default BlogCardSkeleton; 