import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--accent-success)" />;
      case 'error':
        return <AlertCircle size={16} color="var(--accent-danger)" />;
      case 'warning':
        return <AlertTriangle size={16} color="#fbbf24" />;
      default:
        return <Info size={16} color="var(--accent-primary)" />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      default:
        return 'rgba(139, 92, 246, 0.4)';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: '100%'
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="glass-panel"
            style={{
              pointerEvents: 'auto',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${getToastBorder(t.type)}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              animation: 'fadeIn 0.2s ease-out',
              backdropFilter: 'blur(16px)',
              backgroundColor: 'rgba(18, 18, 26, 0.92)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {getToastIcon(t.type)}
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontWeight: '500',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {t.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { addToast: (msg) => console.log(msg) };
  }
  return context;
}
