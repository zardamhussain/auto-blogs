import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', variant = 'dark' }) => {
    return (
        <div className={`loader-container ${size}`}>
            <div className={`loader ${variant}`}></div>
        </div>
    );
};

export default Loader; 