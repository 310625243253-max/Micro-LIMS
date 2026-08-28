import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Incubation } from '../types';
import { Badge } from '../components/common/Badge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Flame, CheckCircle, Clock, RefreshCw, Thermometer, Wind } from 'lucide-react';

export const IncubationsView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [incubations, setIncubations] = useState<Incubation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchIncubations = async () => {
    setLoading(true);
    try {
      const data = await api.getIncubations(statusFilter ? { status: statusFilter } : {});
      setIncubations(data);
    } catch (err: any) {
      console.error('Failed fetching incubations:', err);
      error(err.message || 'Failed loading incubations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncubations();
  }, [statusFilter]);

  const handleComplete = async (id: string) => {
    try {
      await api.updateIncubationStatus(id, { status: 'COMPLETED', operatorNotes: 'Incubation cycle complete. Colony growth evaluated.' });
      success('Incubation cycle marked as completed and ready for morphological reading!');
      fetchIncubations();
    } catch (err: any) {
      error(err.message || 'Failed to complete incubation');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Atmospheric Incubation Chambers & Growth Timers"
        category="Analytical Microbiology"
        description="Real-time temperature and gas atmosphere chamber control (Aerobic, CO2, Anaerobic, Microaerophilic)."
        badge="Active Incubation Timers"
        badgeVariant="amber"
        icon={<Flame size={24} />}
        actions={
          <>
            <select
              className="form-control"
              style={{ width: '170px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Incubations</option>
              <option value="RUNNING">Running</option>
              <option value="DUE">Due (Ready)</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button onClick={fetchIncubations} className="btn btn-secondary btn-sm" title="Refresh Incubators">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* Grid of 3D Incubation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : incubations.length === 0 ? (
          <div className="glass-panel-3d" style={{ padding: '50px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>
            No incubation records match the selected filter.
          </div>
        ) : (
          incubations.map((inc) => {
            const started = new Date(inc.started_at).getTime();
            const due = new Date(inc.expected_completion_at).getTime();
            const now = Date.now();
            const total = due - started;
            const elapsed = Math.max(0, now - started);
            const pct = inc.status === 'COMPLETED' ? 100 : Math.min(100, Math.round((elapsed / total) * 100));

            return (
              <Interactive3DCard
                key={inc.id}
                maxTilt={6}
                glowColor="rgba(2, 132, 199, 0.2)"
                style={{
                  padding: '22px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                      {inc.incubation_code}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Primary Culture: <span className="font-mono" style={{ color: '#0f172a', fontWeight: 600 }}>{inc.culture_code}</span>
                    </div>
                  </div>
                  <Badge variant={inc.status === 'OVERDUE' ? 'danger' : inc.status === 'DUE' ? 'warning' : inc.status === 'COMPLETED' ? 'success' : 'routine'}>
                    {inc.status}
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '0.8125rem',
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={16} style={{ color: '#0284c7' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Chamber</span>
                      <strong style={{ color: '#0f172a' }}>{inc.incubator_id}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={16} style={{ color: '#d97706' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Temp</span>
                      <strong style={{ color: '#0f172a' }}>{inc.temperature_celsius}°C</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wind size={16} style={{ color: '#7c3aed' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Atmosphere</span>
                      <strong style={{ color: '#0f172a' }}>{inc.atmosphere}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: '#059669' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                      <strong style={{ color: '#0f172a' }}>{inc.duration_hours}h</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>
                    <span>Growth Cycle: {pct}%</span>
                    <span>Due: {new Date(inc.expected_completion_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background:
                          inc.status === 'COMPLETED'
                            ? '#059669'
                            : inc.status === 'OVERDUE'
                            ? '#e11d48'
                            : inc.status === 'DUE'
                            ? '#d97706'
                            : '#0284c7',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {(inc.status === 'RUNNING' || inc.status === 'DUE' || inc.status === 'OVERDUE') && hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
                  <button onClick={() => handleComplete(inc.id)} className="btn btn-glow-cyan btn-sm" style={{ marginTop: '4px' }}>
                    <CheckCircle size={15} /> Complete Incubation Cycle
                  </button>
                )}
              </Interactive3DCard>
            );
          })
        )}
      </div>
    </div>
  );
};
