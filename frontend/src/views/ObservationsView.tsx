import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Observation, Culture } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';

export const ObservationsView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cultureId: '',
    growthDetected: true,
    growthStatus: 'MODERATE_GROWTH',
    colonyMorphology: 'Circular, entire margin, convex, smooth glistening colonies',
    pigmentation: 'Golden-yellow (Staphylococcus aureus phenotype)',
    hemolysis: 'BETA',
    colonyCountCfu: '>10^5 CFU/mL',
    notes: '',
  });

  const fetchObservations = async () => {
    setLoading(true);
    try {
      const [obsData, culData] = await Promise.all([
        api.getObservations(),
        api.getCultures(),
      ]);
      setObservations(obsData);
      setCultures(culData);
      if (culData.length > 0 && !formData.cultureId) {
        setFormData((prev) => ({ ...prev, cultureId: culData[0].id }));
      }
    } catch (err: any) {
      console.error('Failed fetching observations:', err);
      error(err.message || 'Failed to load morphology observations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cultureId) {
      error('Please select a valid primary culture plate');
      return;
    }
    setSubmitting(true);
    try {
      await api.createObservation({
        cultureId: formData.cultureId,
        growthDetected: Boolean(formData.growthDetected),
        growthStatus: formData.growthStatus,
        colonyMorphology: formData.colonyMorphology || null,
        pigmentation: formData.pigmentation || null,
        hemolysis: formData.hemolysis,
        colonyCountCfu: formData.colonyCountCfu || null,
        notes: formData.notes || null,
      });
      success('Colonial morphology observation recorded successfully!');
      setModalOpen(false);
      fetchObservations();
    } catch (err: any) {
      error(err.message || 'Failed to record morphology observation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Colonial Morphology & Phenotypic Readings"
        category="Analytical Microbiology"
        description="Detailed macroscopic colony inspection, pigmentation, hemolytic reactions, and CFU quantification."
        badge="Phenotypic Battery"
        badgeVariant="purple"
        icon={<Eye size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'MICROBIOLOGIST', 'TECHNICIAN') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Record Morphology
              </button>
            )}
            <button onClick={fetchObservations} className="btn btn-secondary btn-sm" title="Refresh Observations">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* Observations Table */}
      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Culture Code</th>
              <th>Growth Status</th>
              <th>Colony Morphology</th>
              <th>Pigmentation</th>
              <th>Hemolysis</th>
              <th>Colony Count (CFU)</th>
              <th>Observed By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : observations.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <Eye size={24} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No Morphology Observations Recorded</div>
                    <p style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
                      Colony morphology readings will appear here after evaluation of incubated plates.
                    </p>
                    {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
                      <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        <Plus size={14} /> Record First Observation
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              observations.map((obs) => (
                <tr key={obs.id}>
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
                      {obs.culture_id.substring(0, 13)}...
                    </span>
                  </td>
                  <td>
                    <Badge variant={obs.growth_detected ? 'success' : 'neutral'}>{obs.growth_status}</Badge>
                  </td>
                  <td style={{ color: '#0f172a', maxWidth: '300px', fontWeight: 500 }}>
                    {obs.colony_morphology || 'N/A'}
                  </td>
                  <td>{obs.pigmentation || 'None'}</td>
                  <td>
                    <Badge variant={obs.hemolysis === 'BETA' ? 'danger' : obs.hemolysis === 'ALPHA' ? 'warning' : 'neutral'}>
                      {obs.hemolysis}
                    </Badge>
                  </td>
                  <td className="font-mono" style={{ color: '#0f172a' }}>{obs.colony_count_cfu || 'Unspecified'}</td>
                  <td style={{ fontWeight: 600 }}>{obs.observed_by_name || 'Microbiologist'}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(obs.observed_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Observation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Colonial Morphology Reading"
        subtitle="Evaluate growth phenotype, colonial appearance, hemolysis pattern, and colony density"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Target Inoculated Culture Plate *</label>
            <select
              className="form-control"
              value={formData.cultureId}
              onChange={(e) => setFormData({ ...formData, cultureId: e.target.value })}
              required
            >
              {cultures.length === 0 ? (
                <option value="">No cultures available</option>
              ) : (
                cultures.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.culture_code} — {c.media_type} ({c.sample_accession_number || 'Specimen'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Growth Evaluation Status *</label>
              <select
                className="form-control"
                value={formData.growthStatus}
                onChange={(e) => setFormData({
                  ...formData,
                  growthStatus: e.target.value,
                  growthDetected: e.target.value !== 'NO_GROWTH',
                })}
              >
                <option value="HEAVY_GROWTH">Heavy Growth (Pure / Confluent)</option>
                <option value="MODERATE_GROWTH">Moderate Growth</option>
                <option value="SCANT_GROWTH">Scant Growth (Rare Colonies)</option>
                <option value="NO_GROWTH">No Growth (Sterile Plate)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Hemolysis Pattern *</label>
              <select
                className="form-control"
                value={formData.hemolysis}
                onChange={(e) => setFormData({ ...formData, hemolysis: e.target.value })}
              >
                <option value="BETA">Beta (Complete clear zone)</option>
                <option value="ALPHA">Alpha (Partial greenish zone)</option>
                <option value="GAMMA">Gamma (Non-hemolytic)</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Colony Density / CFU</label>
              <input
                type="text"
                className="form-control font-mono"
                placeholder="e.g. >10^5 CFU/mL"
                value={formData.colonyCountCfu}
                onChange={(e) => setFormData({ ...formData, colonyCountCfu: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Colony Pigmentation</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Golden-yellow, Pyocyanin Blue-green"
                value={formData.pigmentation}
                onChange={(e) => setFormData({ ...formData, pigmentation: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Colonial Morphology Description *</label>
            <textarea
              rows={2}
              required
              className="form-control"
              placeholder="e.g. Circular, convex, smooth glistening, opaque with defined margins..."
              value={formData.colonyMorphology}
              onChange={(e) => setFormData({ ...formData, colonyMorphology: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Phenotypic Diagnostic Notes</label>
            <textarea
              rows={2}
              className="form-control"
              placeholder="Proceed to catalase/coagulase biochemical identification battery..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Recording...' : 'Save Morphology Reading'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

