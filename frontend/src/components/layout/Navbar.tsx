import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Database, Zap, ShieldCheck, Clock, Menu, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

interface NavbarProps {
  currentView: string;
  onOpenAccessionModal?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onOpenAccessionModal, onToggleMobileSidebar }) => {
  const { user, hasRole } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return { title: 'Laboratory Digital Cockpit', category: 'Overview & Telemetry' };
      case 'samples': return { title: 'Specimen Accessioning & Registry', category: 'Pre-Analytical' };
      case 'cultures': return { title: 'Primary Culture Plates & Lineage', category: 'Analytical' };
      case 'incubations': return { title: 'Atmospheric Incubation Chambers', category: 'Analytical' };
      case 'observations': return { title: 'Colonial Morphology & Phenotypes', category: 'Analytical' };
      case 'tests': return { title: 'Biochemical Battery & Identification', category: 'Analytical' };
      case 'ast': return { title: 'Antimicrobial Susceptibility Testing (AST)', category: 'Post-Analytical' };
      case 'contamination': return { title: 'Contamination & Quarantine Incident Log', category: 'Quality Control' };
      case 'reviews': return { title: 'Electronic Verification & Sign-off', category: 'Quality Control' };
      case 'reports': return { title: 'Diagnostic Reports & Checksums', category: 'Release' };
      case 'media': return { title: 'Media Lots & Traceability Inventory', category: 'Inventory' };
      case 'audit': return { title: 'Master Immutable Audit Trail', category: 'Compliance' };
      default: return { title: 'Microbiology Laboratory Management', category: 'MicroLIMS' };
    }
  };

  const headerInfo = getTitle();

  return (
    <header
      className="navbar-container"
      style={{
        height: '70px',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 4px 20px -5px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="nav-header-mobile-btn btn btn-secondary btn-sm"
            style={{
              padding: '7px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle Navigation Drawer"
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
            {headerInfo.category}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
            {headerInfo.title}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Real-time UTC Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.775rem',
            color: '#475569',
            background: '#f8fafc',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #e2e8f0',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}
        >
          <Clock size={13} style={{ color: '#0284c7' }} />
          <span>{timeStr || '00:00:00'}</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>LAB-UTC</span>
        </div>

        {/* Engine Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.725rem',
              color: '#047857',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #a7f3d0',
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} className="pulse-beacon" />
            PostgreSQL DB
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.725rem',
              color: '#0369a1',
              background: '#f0f9ff',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #bae6fd',
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
            Redis Cache
          </div>
        </div>

        {/* Quick Accession Button */}
        {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && onOpenAccessionModal && (
          <button
            onClick={onOpenAccessionModal}
            className="btn btn-glow-cyan"
            style={{ padding: '8px 16px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={16} />
            Accession Specimen
          </button>
        )}

        {/* User Role Badge */}
        {user && (
          <Badge variant={user.roles?.[0] === 'ADMIN' ? 'purple' : user.roles?.[0] === 'REVIEWER' ? 'success' : 'cyan'}>
            <ShieldCheck size={12} style={{ marginRight: '2px' }} />
            {user.roles?.[0] || 'VIEWER'}
          </Badge>
        )}
      </div>
    </header>
  );
};

