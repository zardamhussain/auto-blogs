import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-4">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id} 
                        {...toast} 
                        onDismiss={removeToast} 
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}; 