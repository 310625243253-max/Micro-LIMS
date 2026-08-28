import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ContaminationIncident } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';

export const ContaminationView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [incidents, setIncidents] = useState<ContaminationIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'CROSS_CONTAMINATION',
    description: '',
    suspectedCause: '',
    correctiveAction: '',
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getContaminationIncidents();
      setIncidents(data);
    } catch (err: any) {
      console.error('Failed fetching incidents:', err);
      error(err.message || 'Failed loading contamination incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContaminationIncident({
        ...formData,
        detectionDate: new Date().toISOString(),
      });
      success('Contamination incident logged and specimen quarantined!');
      setModalOpen(false);
      fetchIncidents();
    } catch (err: any) {
      error(err.message || 'Failed to report contamination incident');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Contamination & Quarantine Incident Log"
        category="Quality & Biosecurity"
        description="Non-conformance tracking, plate quarantine locks, and root cause corrective actions (CAPA)."
        badge="Biosecurity & CAPA"
        badgeVariant="amber"
        icon={<AlertTriangle size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-danger btn-sm">
                <Plus size={14} /> Report Incident
              </button>
            )}
            <button onClick={fetchIncidents} className="btn btn-secondary btn-sm" title="Refresh Incidents">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Incident Code</th>
              <th>Category</th>
              <th>Incident Description</th>
              <th>Suspected Root Cause</th>
              <th>Corrective Action (CAPA)</th>
              <th>Reported By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={4} />
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No contamination incidents reported. Clean laboratory environment!
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id}>
                  <td>
                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: '#e11d48',
                        padding: '3px 8px',
                        background: '#ffe4e6',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid #fecdd3',
                      }}
                    >
                      {inc.incident_code}
                    </span>
                  </td>
                  <td>
                    <Badge variant="danger">{inc.category}</Badge>
                  </td>
                  <td style={{ color: '#0f172a', maxWidth: '300px', fontWeight: 500 }}>
                    {inc.description}
                  </td>
                  <td style={{ color: '#475569' }}>{inc.suspected_cause || 'Under investigation'}</td>
                  <td>
                    <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'danger'}>
                      {inc.status}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 600 }}>{inc.reported_by_name || 'Staff'}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(inc.detection_date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report Contamination & Quarantine Event"
        subtitle="Flags specimen/plate for isolation and automatic quarantine review locking"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Contamination Category *</label>
            <select
              className="form-control"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="CROSS_CONTAMINATION">Cross-Contamination (Mixed flora in pure streak)</option>
              <option value="MEDIA_CONTAMINATION">Media Lot Pre-existing Contamination</option>
              <option value="ENVIRONMENTAL">Environmental / Bio-safety Hood Failure</option>
              <option value="SPECIMEN_COLLECTION">Collection Artifact / Non-sterile intake</option>
            </select>
          </div>

          <div>
            <label className="form-label">Incident Description & Evidence *</label>
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="Fungal mold growth identified on un-inoculated border quadrant..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Suspected Root Cause</label>
            <input
              type="text"
              className="form-control"
              placeholder="Incubator gasket condensation drip..."
              value={formData.suspectedCause}
              onChange={(e) => setFormData({ ...formData, suspectedCause: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              File Incident & Lock Specimen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
