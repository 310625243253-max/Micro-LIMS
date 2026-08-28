import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'table-row' | 'stat' | 'line' | 'circle';
  count?: number;
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  type = 'card',
  count = 1,
  height,
  width,
  className = '',
  style = {},
}) => {
  const items = Array.from({ length: count });

  if (type === 'stat') {
    return (
      <div className={`skeleton-grid ${className}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%', ...style }}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-box" style={{ height: height || '128px', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton-shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            </div>
            <div className="skeleton-shimmer" style={{ width: '60%', height: '32px', borderRadius: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table-row') {
    return (
      <>
        {items.map((_, i) => (
          <tr key={i} className="skeleton-table-row">
            <td colSpan={10} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                <div className="skeleton-shimmer" style={{ width: '120px', height: '22px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ width: '180px', height: '18px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ width: '140px', height: '18px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ width: '90px', height: '22px', borderRadius: '12px' }} />
                <div className="skeleton-shimmer" style={{ width: '160px', height: '16px', borderRadius: '4px', marginLeft: 'auto' }} />
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', width: '100%', ...style }}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-box" style={{ height: height || '180px', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-shimmer" style={{ width: '50%', height: '20px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
            </div>
            <div className="skeleton-shimmer" style={{ width: '100%', height: '48px', borderRadius: '6px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <div className="skeleton-shimmer" style={{ width: '50%', height: '34px', borderRadius: '6px' }} />
              <div className="skeleton-shimmer" style={{ width: '50%', height: '34px', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: type === 'circle' ? '50%' : '6px',
        ...style,
      }}
    />
  );
};
