import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = { id, message, type, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', title || 'Success'),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', title || 'Action Failed'),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', title || 'Warning'),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', title || 'Information'),
    [showToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: '#e11d48', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: '#0284c7', flexShrink: 0 }} />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          background: '#ffffff',
          borderLeft: '4px solid #059669',
          borderTop: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        };
      case 'error':
        return {
          background: '#ffffff',
          borderLeft: '4px solid #e11d48',
          borderTop: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        };
      case 'warning':
        return {
          background: '#ffffff',
          borderLeft: '4px solid #d97706',
          borderTop: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        };
      case 'info':
      default:
        return {
          background: '#ffffff',
          borderLeft: '4px solid #0284c7',
          borderTop: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, dismissToast }}>
      {children}

      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...getToastStyle(toast.type),
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              pointerEvents: 'auto',
              animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {getToastIcon(toast.type)}
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4, wordBreak: 'break-word' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-xs)',
              }}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
