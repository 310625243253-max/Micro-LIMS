import React from 'react';
import {
  LayoutDashboard,
  TestTube,
  Microscope,
  Flame,
  Eye,
  FileCheck,
  Dna,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  History,
  Layers,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'Clinical Operations',
      items: [
        { id: 'dashboard', label: 'Laboratory Cockpit', icon: <LayoutDashboard size={17} /> },
        { id: 'samples', label: 'Specimen Registry', icon: <TestTube size={17} /> },
        { id: 'cultures', label: 'Cultures & Media', icon: <Microscope size={17} /> },
        { id: 'incubations', label: 'Incubator Chambers', icon: <Flame size={17} /> },
      ],
    },
    {
      title: 'Diagnostic Engine',
      items: [
        { id: 'observations', label: 'Morphology Reading', icon: <Eye size={17} /> },
        { id: 'tests', label: 'Biochemical Tests', icon: <FileCheck size={17} /> },
        { id: 'ast', label: 'AST Antibiograms', icon: <Dna size={17} /> },
      ],
    },
    {
      title: 'Quality & Release',
      items: [
        { id: 'reviews', label: 'QC Sign-off & Review', icon: <ClipboardCheck size={17} /> },
        { id: 'reports', label: 'Diagnostic Reports', icon: <FileText size={17} /> },
        { id: 'contamination', label: 'Contamination Log', icon: <AlertTriangle size={17} /> },
      ],
    },
    {
      title: 'Traceability & Master',
      items: [
        { id: 'media', label: 'Media Lots Inventory', icon: <Layers size={17} /> },
        { id: 'audit', label: 'Master Audit Trail', icon: <History size={17} /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar-container ${isOpen ? 'open' : ''}`}
        style={{
          width: '270px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Microscope size={22} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Micro<span style={{ color: '#0284c7' }}>LIMS</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  ISO 15189
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
                Clinical Diagnostics Platform
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close Sidebar Drawer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 12px 6px',
                }}
              >
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {sec.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive ? 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)' : 'transparent',
                        borderLeft: isActive ? '3.5px solid #0284c7' : '3.5px solid transparent',
                        color: isActive ? '#0284c7' : '#475569',
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#0f172a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#475569';
                        }
                      }}
                    >
                      <span
                        style={{
                          color: isActive ? '#0284c7' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Live System Status Pill */}
        <div
          style={{
            padding: '10px 14px',
            margin: '0 12px 10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.725rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#15803d', fontWeight: 600 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#16a34a',
                display: 'inline-block',
              }}
              className="pulse-beacon"
            />
            Engine Active
          </div>
          <span style={{ color: '#16a34a', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700 }}>
            3D-PRO
          </span>
        </div>

        {/* User Footer Profile */}
        {user && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {user.first_name} {user.last_name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: '#0284c7',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {user.roles?.[0] || 'VIEWER'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out from session"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '7px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#e11d48';
                  e.currentTarget.style.borderColor = '#fecdd3';
                  e.currentTarget.style.background = '#fff1f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

