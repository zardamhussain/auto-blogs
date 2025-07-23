import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage, endPage;
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination-container">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-arrow"
            >
                &lt;
            </button>
            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="pagination-number">1</button>
                    {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                </>
            )}
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                >
                    {number}
                </button>
            ))}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                    <button onClick={() => onPageChange(totalPages)} className="pagination-number">{totalPages}</button>
                </>
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-arrow"
            >
                &gt;
            </button>
        </div>
    );
};

export default Pagination; 