const BlogCard = ({ title, status, createdAt, onClick, onDelete, translations = [] }) => {
    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    

    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent the card's onClick from firing
        onDelete();
    };

    return (
        <div className="blog-card" onClick={onClick}>
            <div className="blog-card-header">
                <h3 className="blog-title">{title}</h3>
                <span className={`blog-status ${status ? status.toLowerCase() : 'draft'}`}>{status || 'Draft'}</span>
            </div>
            {translations.length == 0 && (
                <div className="language-badges">
                    <span className="language-badge original">EN</span>
                </div>
            )}
            {translations.length > 0 && (
                <div className="language-badges">
                    <span className="language-badge original">EN</span>
                    {translations.map(t => (
                        <span key={t.language_code} className="language-badge">
                            {t.language_code.toUpperCase()}
                        </span>
                    ))}
                </div>
            )}
            <div className="blog-meta">
                <span>{formattedDate}</span>
                {onDelete && (
                    <button className="blog-action-btn delete" onClick={handleDeleteClick}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default BlogCard; 