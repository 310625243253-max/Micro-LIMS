import React from 'react';
import { Interactive3DCard } from '../3d/Interactive3DCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'blue',
  onClick,
}) => {
  const getAccentColor = () => {
    switch (variant) {
      case 'emerald': return '#059669';
      case 'amber': return '#d97706';
      case 'rose': return '#e11d48';
      case 'purple': return '#7c3aed';
      case 'cyan': return '#0284c7';
      default: return '#0284c7';
    }
  };

  const getBgTint = () => {
    switch (variant) {
      case 'emerald': return '#ecfdf5';
      case 'amber': return '#fffbeb';
      case 'rose': return '#fff1f2';
      case 'purple': return '#faf5ff';
      case 'cyan': return '#f0f9ff';
      default: return '#f0f9ff';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'emerald': return '#a7f3d0';
      case 'amber': return '#fde68a';
      case 'rose': return '#fecdd3';
      case 'purple': return '#e9d5ff';
      case 'cyan': return '#bae6fd';
      default: return '#bae6fd';
    }
  };

  const getGlowColor = () => {
    switch (variant) {
      case 'emerald': return 'rgba(16, 185, 129, 0.25)';
      case 'amber': return 'rgba(245, 158, 11, 0.25)';
      case 'rose': return 'rgba(225, 29, 72, 0.25)';
      case 'purple': return 'rgba(139, 92, 246, 0.25)';
      default: return 'rgba(2, 132, 199, 0.25)';
    }
  };

  return (
    <Interactive3DCard
      maxTilt={8}
      glowColor={getGlowColor()}
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '22px',
          position: 'relative',
        }}
      >
        {/* Top Accent Glowing Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3.5px',
            background: `linear-gradient(90deg, ${getAccentColor()} 0%, ${getAccentColor()}88 100%)`,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
              {title}
            </span>
            <div style={{ fontSize: '2.125rem', fontWeight: 800, color: '#0f172a', marginTop: '4px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {value}
            </div>
            {subtitle && (
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '6px', fontWeight: 500 }}>
                {subtitle}
              </div>
            )}
            {trend && (
              <div style={{ fontSize: '0.75rem', color: getAccentColor(), marginTop: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: getAccentColor() }} />
                {trend}
              </div>
            )}
          </div>
          {icon && (
            <div
              style={{
                color: getAccentColor(),
                padding: '12px',
                background: getBgTint(),
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${getBorderColor()}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${getGlowColor()}`,
              }}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </Interactive3DCard>
  );
};

