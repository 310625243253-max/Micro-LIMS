import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'stat' | 'urgent' | 'routine' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'cyan' | 'quarantine';
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  style = {},
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'stat': return 'badge-stat';
      case 'urgent': return 'badge-urgent';
      case 'routine': return 'badge-routine';
      case 'success': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'danger': return 'badge-danger';
      case 'purple': return 'badge-purple';
      case 'cyan': return 'badge-cyan';
      case 'quarantine': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`} style={style}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};
