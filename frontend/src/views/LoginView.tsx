import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BioMeshCanvas } from '../components/3d/BioMeshCanvas';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { Microscope, Shield, User, ArrowRight, Lock, CheckCircle2, Eye, EyeOff, Activity, Sparkles, Database, Dna } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@microlims.lab');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@microlims.lab', name: 'Dr. Sarah Chen', title: 'Laboratory Director', badge: 'Full Admin', color: '#7c3aed', bg: '#f3e8ff', text: '#6b21a8', glow: 'rgba(124, 58, 237, 0.25)' },
    { role: 'Lab Technician', email: 'tech@microlims.lab', name: 'Alex Rivera', title: 'Medical Lab Tech', badge: 'Accession & Inoculation', color: '#0284c7', bg: '#e0f2fe', text: '#0369a1', glow: 'rgba(2, 132, 199, 0.25)' },
    { role: 'Senior Microbiologist', email: 'micro@microlims.lab', name: 'Dr. Marcus Vance', title: 'Senior Microbiologist', badge: 'Morphology & AST', color: '#0284c7', bg: '#e0f2fe', text: '#0369a1', glow: 'rgba(2, 132, 199, 0.25)' },
    { role: 'QA Reviewer', email: 'reviewer@microlims.lab', name: 'Dr. Elena Rostova', title: 'QA Manager', badge: 'Electronic Sign-off', color: '#059669', bg: '#d1fae5', text: '#047857', glow: 'rgba(5, 150, 105, 0.25)' },
    { role: 'Physician Viewer', email: 'viewer@microlims.lab', name: 'Dr. James Wilson', title: 'Consulting Physician', badge: 'Read-Only Reports', color: '#d97706', bg: '#fef3c7', text: '#b45309', glow: 'rgba(217, 119, 6, 0.25)' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f0f9ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 3D WebGL Holographic DNA & Particle Background Canvas */}
      <BioMeshCanvas particleColor="#0284c7" helixColorA="#0284c7" helixColorB="#8b5cf6" interactive={true} />

      <div
        style={{
          width: '100%',
          maxWidth: '1120px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '40px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left Side: Brand Overview & Interactive 3D Persona Cards */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} className="pulse-beacon" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Next-Gen ISO 15189 Laboratory Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Microscope size={28} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Micro<span style={{ color: '#0284c7' }}>LIMS</span> <span style={{ fontSize: '0.75rem', fontWeight: 700, verticalAlign: 'middle', color: '#0284c7', background: '#f0f9ff', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid #bae6fd', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Enterprise</span>
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                Clinical Microbiology Diagnostic Information & Laboratory Operating System
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '22px', maxWidth: '580px' }}>
            Comprehensive diagnostic workflow management: barcode accessioning, media batch traceability, atmospheric chamber timers, colonial morphology readings, AST antibiograms, and cryptographic SHA-256 clinical release sign-offs.
          </p>

          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Select Authorized Laboratory Role:
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {demoAccounts.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <Interactive3DCard
                  key={acc.email}
                  maxTilt={6}
                  glowColor={acc.glow}
                  onClick={() => handleQuickLogin(acc.email)}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? '#f0f9ff' : 'rgba(255, 255, 255, 0.95)',
                    border: isSelected ? '1.5px solid #0284c7' : '1px solid rgba(226, 232, 240, 0.9)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? acc.color : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#ffffff' : '#64748b',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? `0 4px 10px ${acc.glow}` : 'none',
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                          {acc.name}{' '}
                          <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 400 }}>
                            ({acc.title})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: acc.bg,
                        color: acc.text,
                        border: `1px solid ${acc.color}30`,
                        fontWeight: 700,
                      }}
                    >
                      {acc.badge}
                    </span>
                  </div>
                </Interactive3DCard>
              );
            })}
          </div>
        </div>

        {/* Right Side: Futuristic Glassmorphic Login Card */}
        <Interactive3DCard
          maxTilt={5}
          glowColor="rgba(2, 132, 199, 0.3)"
          style={{
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(203, 213, 225, 0.9)',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 1px 1px rgba(255, 255, 255, 0.8) inset',
          }}
        >
          <div style={{ padding: '36px 32px' }}>
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                Portal Authentication
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Enter laboratory credentials to establish encrypted clinical session
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-sm)',
                  color: '#e11d48',
                  fontSize: '0.8125rem',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                }}
              >
                <Lock size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control font-mono"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="technician@microlims.lab"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: '#047857',
                  marginTop: '2px',
                  background: '#ecfdf5',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #a7f3d0',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                Pre-seeded SHA-256 bcrypt security with dual JWT access tokens
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-glow-cyan"
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {loading ? (
                  <>
                    <Activity size={16} className="spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Sign In to Laboratory Console
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                marginTop: '22px',
                padding: '10px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0',
                fontSize: '0.7rem',
                color: '#64748b',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              <Shield size={13} style={{ color: '#0284c7' }} />
              MicroLIMS Production Portfolio • Synthetic Test Dataset
            </div>
          </div>
        </Interactive3DCard>
      </div>
    </div>
  );
};

