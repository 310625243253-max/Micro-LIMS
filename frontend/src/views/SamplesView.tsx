import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sample, Priority, SampleStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  TestTube,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface SamplesViewProps {
  onSelectSample: (sampleId: string) => void;
  isAccessionModalOpen: boolean;
  onCloseAccessionModal: () => void;
}

export const SamplesView: React.FC<SamplesViewProps> = ({
  onSelectSample,
  isAccessionModalOpen,
  onCloseAccessionModal,
}) => {
  const { hasRole } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Accession form state
  const [formData, setFormData] = useState({
    patientSyntheticId: '',
    patientSyntheticName: '',
    sampleType: 'BLOOD',
    collectionSite: 'Venipuncture Antecubital Fossa',
    priority: 'ROUTINE' as Priority,
    clinicalNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const data = await api.getSamples(params);
      setSamples(data);
    } catch (err) {
      console.error('Failed fetching samples:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [search, statusFilter, priorityFilter]);

  const handleAccessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const newSample = await api.createSample({
        ...formData,
        collectedAt: new Date().toISOString(),
      });
      onCloseAccessionModal();
      fetchSamples();
      onSelectSample(newSample.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to accession sample');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleTypes = ['BLOOD', 'SPUTUM', 'URINE', 'WOUND_SWAB', 'CSF', 'SYNOVIAL_FLUID', 'STOOL', 'THROAT_SWAB'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Specimen Accession Registry & Master Log"
        category="Pre-Analytical Registry"
        description="Comprehensive clinical specimen intake, priority stratification, barcoded custody, and lineage tracking."
        badge="Biorepository Registry"
        badgeVariant="cyan"
        icon={<TestTube size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'TECHNICIAN') && (
              <button onClick={() => {}} className="btn btn-glow-cyan btn-sm" style={{ display: 'none' }}>
                <Plus size={14} /> Accession
              </button>
            )}
            <button onClick={fetchSamples} className="btn btn-secondary btn-sm" title="Refresh Specimens">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* Top Filter & Action Bar */}
      <div
        className="glass-panel-3d"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              className="form-control font-mono"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by Accession # (SMP-26-XXXXX), Patient ID, or Site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACCESSIONED">Accessioned</option>
            <option value="IN_TESTING">In Testing</option>
            <option value="TESTING_COMPLETE">Testing Complete</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="FINALIZED">Finalized</option>
          </select>

          <select
            className="form-control"
            style={{ width: '150px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="STAT">STAT Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
          Showing <span style={{ color: '#0284c7' }}>{samples.length}</span> Specimens
        </div>
      </div>

      {/* Samples Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Accession #</th>
              <th>Patient Record</th>
              <th>Specimen Type & Site</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Quarantine</th>
              <th>Accessioned At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : samples.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <TestTube size={24} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No specimens found</div>
                    <div style={{ fontSize: '0.85rem' }}>No specimens match your selected query criteria.</div>
                  </div>
                </td>
              </tr>
            ) : (
              samples.map((s) => (
                <tr key={s.id} onClick={() => onSelectSample(s.id)} className="clickable-row">
                  <td>
                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: '#0284c7',
                        padding: '3px 8px',
                        background: '#f0f9ff',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      {s.accession_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {s.patient_synthetic_id}
                    </div>
                    {s.patient_synthetic_name && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {s.patient_synthetic_name}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.sample_type}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.collection_site}</div>
                  </td>
                  <td>
                    <Badge variant={s.priority === 'STAT' ? 'stat' : s.priority === 'URGENT' ? 'urgent' : 'routine'}>
                      {s.priority}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      variant={
                        s.status === 'FINALIZED'
                          ? 'success'
                          : s.status === 'UNDER_REVIEW'
                          ? 'warning'
                          : s.status === 'IN_TESTING'
                          ? 'cyan'
                          : 'neutral'
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td>
                    {s.quarantined ? (
                      <Badge variant="danger">
                        <ShieldAlert size={12} /> Quarantined
                      </Badge>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>• Clear</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(s.received_at).toLocaleDateString()} {new Date(s.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSample(s.id);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      View Lineage <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Accession Modal Form */}
      <Modal
        isOpen={isAccessionModalOpen}
        onClose={onCloseAccessionModal}
        title="Specimen Accession Registration"
        subtitle="Register incoming clinical specimen and issue unique barcode accession number"
      >
        {formError && (
          <div
            style={{
              padding: '12px 14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-sm)',
              color: '#e11d48',
              fontSize: '0.8125rem',
              marginBottom: '16px',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleAccessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Patient Synthetic ID *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="SYN-PAT-10829"
                value={formData.patientSyntheticId}
                onChange={(e) => setFormData({ ...formData, patientSyntheticId: e.target.value })}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label className="form-label">Patient Synthetic Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Sarah Connor"
                value={formData.patientSyntheticName}
                onChange={(e) => setFormData({ ...formData, patientSyntheticName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Specimen Type *</label>
              <select
                className="form-control"
                value={formData.sampleType}
                onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
              >
                {sampleTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Triage Priority *</label>
              <select
                className="form-control"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate Critical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Anatomical Collection Site *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Right Lower Lobe Bronchial Lavage"
              value={formData.collectionSite}
              onChange={(e) => setFormData({ ...formData, collectionSite: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Clinical Indication & Notes</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="Suspected bacteremia, ICU ventilator-associated pneumonia workup..."
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onCloseAccessionModal} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Registering...' : 'Accession Specimen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
