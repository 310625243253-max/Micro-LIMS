import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Culture, Sample, MediaLot } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Microscope, Search, ArrowUpRight, RefreshCw, Plus } from 'lucide-react';

interface CulturesViewProps {
  onSelectSample: (sampleId: string) => void;
}

export const CulturesView: React.FC<CulturesViewProps> = ({ onSelectSample }) => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [mediaLots, setMediaLots] = useState<MediaLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    sampleId: '',
    mediaLotId: '',
    mediaType: 'Blood Agar (5% Sheep Blood)',
    inoculationMethod: 'STREAK_4_QUADRANT',
    notes: '',
  });

  const fetchCultures = async () => {
    setLoading(true);
    try {
      const [culData, smpData, mediaData] = await Promise.all([
        api.getCultures(search ? { search } : {}),
        api.getSamples({ status: 'ACCESSIONED' }),
        api.getMediaLots({ status: 'ACTIVE' }),
      ]);
      setCultures(culData);
      setSamples(smpData);
      setMediaLots(mediaData);
      if (smpData.length > 0 && !formData.sampleId) {
        setFormData((prev) => ({ ...prev, sampleId: smpData[0].id }));
      }
      if (mediaData.length > 0 && !formData.mediaLotId) {
        setFormData((prev) => ({ ...prev, mediaLotId: mediaData[0].id, mediaType: mediaData[0].media_name }));
      }
    } catch (err: any) {
      console.error('Failed fetching cultures:', err);
      error(err.message || 'Failed to load primary cultures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCultures();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sampleId) {
      error('Please select an accessioned specimen for inoculation');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCulture({
        sampleId: formData.sampleId,
        mediaLotId: formData.mediaLotId || undefined,
        mediaType: formData.mediaType,
        inoculationMethod: formData.inoculationMethod,
        notes: formData.notes || null,
      });
      success('Primary culture plate inoculated successfully!');
      setModalOpen(false);
      fetchCultures();
    } catch (err: any) {
      error(err.message || 'Failed to inoculate culture plate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Primary Culture Plates & Lineage"
        category="Analytical Microbiology"
        description="Traceable aliquot inoculation onto differential, enriched, and selective growth agar plates."
        badge="ISO 15189 Lineage"
        badgeVariant="cyan"
        icon={<Microscope size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'TECHNICIAN') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Inoculate Plate
              </button>
            )}
            <button onClick={fetchCultures} className="btn btn-secondary btn-sm" title="Refresh Cultures">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      <div
        className="glass-panel-3d"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
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
            placeholder="Search by Culture Code (CUL-26-XXXXX), Media Type, or Sample..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
          Total <span style={{ color: '#0284c7' }}>{cultures.length}</span> Active Plates
        </div>
      </div>

      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Culture Code</th>
              <th>Sample Accession</th>
              <th>Media Type & Lot</th>
              <th>Inoculation Method</th>
              <th>Inoculated By</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : cultures.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <Microscope size={24} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No Primary Cultures Inoculated</div>
                    <p style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
                      Inoculate specimen aliquots onto traceable media plates to start culture growth.
                    </p>
                    {hasRole('ADMIN', 'TECHNICIAN') && (
                      <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        <Plus size={14} /> Inoculate First Plate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              cultures.map((c) => (
                <tr key={c.id} onClick={() => onSelectSample(c.sample_id)} style={{ cursor: 'pointer' }}>
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
                      {c.culture_code}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono" style={{ color: '#0f172a', fontWeight: 600 }}>
                      {c.sample_accession_number || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.media_type}</div>
                    {c.media_lot_number && (
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        Lot: {c.media_lot_number}
                      </div>
                    )}
                  </td>
                  <td>{c.inoculation_method}</td>
                  <td>{c.inoculated_by_name || 'Staff'}</td>
                  <td>
                    <Badge variant={c.status === 'OBSERVED' ? 'success' : 'routine'}>{c.status}</Badge>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(c.inoculated_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSample(c.sample_id);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Inspect Lineage <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inoculate Plate Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Inoculate Primary Culture Plate"
        subtitle="Inoculate specimen aliquot onto traceable media lot for isolation"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Select Clinical Specimen *</label>
            <select
              className="form-control"
              value={formData.sampleId}
              onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
              required
            >
              {samples.length === 0 ? (
                <option value="">No accessioned specimens awaiting inoculation</option>
              ) : (
                samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.accession_number} — {s.sample_type} ({s.patient_synthetic_name || s.patient_synthetic_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="form-label">Traceable Media Formulation Lot *</label>
            <select
              className="form-control"
              value={formData.mediaLotId}
              onChange={(e) => {
                const selectedLot = mediaLots.find((l) => l.id === e.target.value);
                setFormData({
                  ...formData,
                  mediaLotId: e.target.value,
                  mediaType: selectedLot ? selectedLot.media_name : formData.mediaType,
                });
              }}
              required
            >
              {mediaLots.length === 0 ? (
                <option value="">No active media lots</option>
              ) : (
                mediaLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.media_name} (Lot: {lot.lot_number} • Exp: {new Date(lot.expiry_date).toLocaleDateString()})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="form-label">Inoculation Streaking Method *</label>
            <select
              className="form-control"
              value={formData.inoculationMethod}
              onChange={(e) => setFormData({ ...formData, inoculationMethod: e.target.value })}
            >
              <option value="STREAK_4_QUADRANT">Streak - 4-Quadrant Isolation</option>
              <option value="SPREAD_PLATE">Spread Plate (Quantitative)</option>
              <option value="POUR_PLATE">Pour Plate</option>
              <option value="LAWN_CULTURE">Lawn Culture (Confluent Growth for AST)</option>
              <option value="STAB_INOCULATION">Stab Inoculation</option>
            </select>
          </div>

          <div>
            <label className="form-label">Inoculation Notes</label>
            <textarea
              rows={2}
              className="form-control"
              placeholder="Primary inoculation for single colony isolation..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Inoculating...' : 'Inoculate Plate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

