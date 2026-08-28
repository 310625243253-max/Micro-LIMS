import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardMetrics, Sample } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { TelemetryGlobe3D } from '../components/3d/TelemetryGlobe3D';
import {
  TestTube,
  Microscope,
  Flame,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Activity,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Thermometer,
  Sparkles,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectSample: (sampleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectSample }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Sample[]>([]);
  const [incubations, setIncubations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, act, rev, inc] = await Promise.all([
        api.getDashboardMetrics(),
        api.getDashboardActivity(8),
        api.getPendingReviews(),
        api.getIncubations({ status: 'RUNNING', limit: 4 }),
      ]);
      setMetrics(m);
      setActivity(act);
      setPendingReviews(rev);
      setIncubations(inc);
    } catch (err) {
      console.error('Failed loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'STAT': return <Badge variant="stat">STAT Priority</Badge>;
      case 'URGENT': return <Badge variant="urgent">Urgent</Badge>;
      default: return <Badge variant="routine">Routine</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar with 3D Holographic Telemetry Globe */}
      <div
        className="glass-panel-3d"
        style={{
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.8) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
          <TelemetryGlobe3D
            size={100}
            specimensCount={metrics?.totalSamples ?? 12}
            culturesCount={metrics?.activeCultures ?? 8}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
                Microbiology Digital Cockpit
              </h1>
              <span
                style={{
                  fontSize: '0.725rem',
                  color: '#047857',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} className="pulse-beacon" />
                Live 3D Telemetry
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '4px', maxWidth: '640px' }}>
              Real-time specimen pipeline, incubator chamber monitoring, AST antibiograms, and cryptographic release queues.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <button
            onClick={() => onNavigate('samples')}
            className="btn btn-glow-cyan btn-sm"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} /> Quick Specimen
          </button>
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Synchronize
          </button>
        </div>
      </div>

      {/* KPI Stats Telemetry Grid */}
      {loading && !metrics ? (
        <SkeletonLoader type="stat" count={5} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <StatCard
            title="Total Specimens"
            value={metrics?.totalSamples ?? 0}
            subtitle={`${metrics?.samplesToday ?? 0} accessioned today`}
            icon={<TestTube size={22} />}
            variant="cyan"
            onClick={() => onNavigate('samples')}
          />
          <StatCard
            title="Active Cultures"
            value={metrics?.activeCultures ?? 0}
            subtitle="Inoculated & growing"
            icon={<Microscope size={22} />}
            variant="blue"
            onClick={() => onNavigate('cultures')}
          />
          <StatCard
            title="Incubators"
            value={metrics?.runningIncubations ?? 0}
            subtitle={`${metrics?.dueIncubations ?? 0} due • ${metrics?.overdueIncubations ?? 0} overdue`}
            icon={<Flame size={22} />}
            variant={metrics?.overdueIncubations ? 'rose' : metrics?.dueIncubations ? 'amber' : 'purple'}
            onClick={() => onNavigate('incubations')}
          />
          <StatCard
            title="Pending QC Review"
            value={metrics?.pendingReviews ?? 0}
            subtitle="Awaiting electronic sign-off"
            icon={<ClipboardCheck size={22} />}
            variant="emerald"
            onClick={() => onNavigate('reviews')}
          />
          <StatCard
            title="Contaminations"
            value={metrics?.contaminationIncidents ?? 0}
            subtitle={`${metrics?.quarantinedSamples ?? 0} quarantined plates`}
            icon={<AlertTriangle size={22} />}
            variant={metrics?.contaminationIncidents ? 'rose' : 'blue'}
            onClick={() => onNavigate('contamination')}
          />
        </div>
      )}

      {/* Specimen Lifecycle Pipeline Status */}
      <Interactive3DCard
        maxTilt={4}
        glowColor="rgba(2, 132, 199, 0.15)"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#0284c7' }} />
              Specimen Progression Lifecycle
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Current clinical load distributed across the microbiology analytical pipeline
            </p>
          </div>
          <button
            onClick={() => onNavigate('samples')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All Specimens <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Accessioned', count: metrics?.totalSamples ?? 0, color: '#0284c7', bg: '#f0f9ff', icon: <TestTube size={16} />, view: 'samples' },
            { label: 'Inoculated', count: metrics?.activeCultures ?? 0, color: '#0ea5e9', bg: '#f0f9ff', icon: <Microscope size={16} />, view: 'cultures' },
            { label: 'Incubating', count: metrics?.runningIncubations ?? 0, color: '#7c3aed', bg: '#faf5ff', icon: <Flame size={16} />, view: 'incubations' },
            { label: 'In Testing', count: 3, color: '#0284c7', bg: '#f0f9ff', icon: <Activity size={16} />, view: 'tests' },
            { label: 'Under Review', count: metrics?.pendingReviews ?? 0, color: '#d97706', bg: '#fffbeb', icon: <ClipboardCheck size={16} />, view: 'reviews' },
            { label: 'Finalized', count: 2, color: '#059669', bg: '#ecfdf5', icon: <CheckCircle2 size={16} />, view: 'reports' },
          ].map((stage, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate(stage.view)}
              style={{
                background: stage.bg,
                border: `1px solid ${stage.color}35`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 12px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 16px ${stage.color}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: stage.color,
                }}
              />
              <div style={{ color: stage.color, display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                {stage.icon}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                {stage.count}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </Interactive3DCard>

      {/* Two Column Layout: Incubator Monitoring & QC Sign-off Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left: Active Incubation Chambers */}
        <div className="glass-panel-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#faf5ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e9d5ff',
                }}
              >
                <Flame size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Incubator Chambers Status
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Active atmospheric culture growth chambers
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('incubations')}
              className="btn btn-secondary btn-sm"
            >
              All Chambers
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incubations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No active incubator chambers currently running.
              </div>
            ) : (
              incubations.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-xs)',
                        background: '#e0f2fe',
                        color: '#0284c7',
                      }}
                    >
                      <Thermometer size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{inc.incubation_code}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({inc.incubator_id})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                        {inc.temperature_celsius}°C • {inc.atmosphere} • Duration: {inc.duration_hours}h
                      </div>
                    </div>
                  </div>
                  <Badge variant="routine">
                    <Clock size={11} style={{ marginRight: '2px' }} />
                    RUNNING
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Urgent QC Review Queue */}
        <div className="glass-panel-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #a7f3d0',
                }}
              >
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  QC Sign-off Queue
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Awaiting QA review & release
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reviews')}
              className="btn btn-secondary btn-sm"
            >
              View Queue
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingReviews.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <CheckCircle2 size={24} style={{ color: '#059669', margin: '0 auto 8px' }} />
                All pending laboratory reviews are up to date.
              </div>
            ) : (
              pendingReviews.map((smp) => (
                <div
                  key={smp.id}
                  onClick={() => onSelectSample(smp.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284c7';
                    e.currentTarget.style.background = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>{smp.accession_number}</span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>{smp.patient_synthetic_name}</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                      {smp.sample_type} • {smp.collection_site}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getPriorityBadge(smp.priority)}
                    <ArrowUpRight size={15} style={{ color: '#94a3b8' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Master Audit Stream Feed */}
      <div className="glass-panel-3d" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#059669' }} />
              Live Immutable Master Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Cryptographically timestamped laboratory actions and compliance logs
            </p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="btn btn-secondary btn-sm"
          >
            Full Audit Logs
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {activity.map((act, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}
                >
                  {act.action?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ color: '#475569', fontSize: '0.775rem' }}>
                {act.user_email} • {act.entity_type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

