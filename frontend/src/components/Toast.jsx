import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Toast = ({ id, message, type, onDismiss }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const dismissToast = () => {
            setIsFadingOut(true);
            setTimeout(() => onDismiss(id), 400); // Match animation duration
        };

        const timer = setTimeout(dismissToast, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const handleDismiss = () => {
        setIsFadingOut(true);
        setTimeout(() => onDismiss(id), 400); // Match animation duration
    };

    return (
        <div 
            className={`
                flex items-center justify-between py-4 px-6 rounded-lg shadow-lg font-sans text-base min-w-[300px]
                ${type === 'generating' ? 'bg-primary-purple text-white' : ''}
                ${type === 'success' ? 'bg-green-500 text-white' : ''}
                ${type === 'error' ? 'bg-red-500 text-white' : ''}
                ${isFadingOut ? 'animate-toast-fadeout' : 'animate-toast-fadein'}
            `}
        >
            <div className="mr-4 font-medium">{message}</div>
            <button
                onClick={handleDismiss}
                className="bg-none border-none text-inherit text-xl leading-none cursor-pointer opacity-70 p-0 hover:opacity-100 transition-opacity"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default Toast; 