import React from 'react';
import { Interactive3DCard } from './Interactive3DCard';
import { Sparkles, Activity } from 'lucide-react';

interface ViewHeader3DProps {
  title: string;
  category?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'emerald' | 'purple' | 'amber';
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const ViewHeader3D: React.FC<ViewHeader3DProps> = ({
  title,
  category,
  description,
  badge = 'Active Laboratory Stream',
  badgeVariant = 'cyan',
  actions,
  icon,
}) => {
  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'emerald':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' };
      case 'purple':
        return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff', dot: '#8b5cf6' };
      case 'amber':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' };
      default:
        return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', dot: '#0284c7' };
    }
  };

  const badgeStyle = getBadgeColors();

  return (
    <Interactive3DCard
      maxTilt={3}
      glowColor="rgba(2, 132, 199, 0.15)"
      style={{
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.85) 100%)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.07), 0 0 1px 1px rgba(255, 255, 255, 0.8) inset',
        marginBottom: '22px',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {icon && (
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 6px 16px rgba(2, 132, 199, 0.3)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {category && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#0284c7',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {category} •
                </span>
              )}
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                }}
              >
                {title}
              </h1>
              {badge && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: badgeStyle.text,
                    background: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.border}`,
                    padding: '2px 9px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: badgeStyle.dot,
                    }}
                    className="pulse-beacon"
                  />
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p style={{ fontSize: '0.825rem', color: '#475569', marginTop: '3px', fontWeight: 500 }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actions}
          </div>
        )}
      </div>
    </Interactive3DCard>
  );
};
