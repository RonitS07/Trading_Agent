'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' && <i className="fa-solid fa-circle-check"></i>}
                        {toast.type === 'error' && <i className="fa-solid fa-circle-exclamation"></i>}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }
                .toast {
                    background: rgba(13, 18, 28, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 242, 255, 0.2);
                    color: white;
                    padding: 12px 20px;
                    borderRadius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    animation: slideIn 0.3s ease-out forwards;
                    min-width: 200px;
                    pointer-events: auto;
                }
                .toast-success i { color: var(--accent-green); }
                .toast-error i { color: var(--accent-red); }
                .toast-success { border-left: 4px solid var(--accent-green); }
                .toast-error { border-left: 4px solid var(--accent-red); }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .toast-container {
                        top: auto;
                        bottom: 100px; /* Above nav bar */
                        left: 20px;
                        right: 20px;
                        align-items: center;
                    }
                    .toast {
                        width: 100%;
                        max-width: 400px;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
