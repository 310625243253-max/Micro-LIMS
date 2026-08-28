import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '640px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(15, 23, 42, 0.45)',
      }}
    >
      <div
        className="modal-content glass-panel-3d"
        style={{
          maxWidth,
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(203, 213, 225, 0.9)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.8) inset',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Glowing Top Bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 50%, #8b5cf6 100%)',
            width: '100%',
          }}
        />

        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-sm)',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

