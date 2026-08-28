import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AstRecord, Culture } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Dna, Search, RefreshCw, Plus, ShieldCheck } from 'lucide-react';

export const AstView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [records, setRecords] = useState<AstRecord[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const antibioticPresets = [
    { antibiotic: 'Vancomycin 30µg', method: 'KIRBY_BAUER_DISC', zone: 21, mic: null, interp: 'SUSCEPTIBLE' },
    { antibiotic: 'Ciprofloxacin 5µg', method: 'KIRBY_BAUER_DISC', zone: 12, mic: null, interp: 'RESISTANT' },
    { antibiotic: 'Amoxicillin / Clavulanic Acid 20/10µg', method: 'KIRBY_BAUER_DISC', zone: 26, mic: null, interp: 'SUSCEPTIBLE' },
    { antibiotic: 'Ceftriaxone 30µg', method: 'KIRBY_BAUER_DISC', zone: 24, mic: null, interp: 'SUSCEPTIBLE' },
    { antibiotic: 'Meropenem 10µg', method: 'KIRBY_BAUER_DISC', zone: 29, mic: null, interp: 'SUSCEPTIBLE' },
    { antibiotic: 'Gentamicin 10µg', method: 'KIRBY_BAUER_DISC', zone: 18, mic: null, interp: 'INTERMEDIATE' },
    { antibiotic: 'Linezolid (MIC)', method: 'MIC_BROTH_DILUTION', zone: null, mic: 1.5, interp: 'SUSCEPTIBLE' },
    { antibiotic: 'Colistin (MIC)', method: 'MIC_BROTH_DILUTION', zone: null, mic: 0.5, interp: 'SUSCEPTIBLE' },
  ];

  const [formData, setFormData] = useState({
    cultureId: '',
    organismIdentified: 'Staphylococcus aureus (MRSA screen positive)',
    antibioticName: antibioticPresets[0].antibiotic,
    method: antibioticPresets[0].method,
    zoneDiameterMm: 21 as number | null,
    micValueUgMl: null as number | null,
    interpretation: 'SUSCEPTIBLE',
    referenceGuideline: 'CLSI M100 34th Ed. / EUCAST v14',
    notes: '',
  });

  const fetchAst = async () => {
    setLoading(true);
    try {
      const [astData, culData] = await Promise.all([
        api.getAstRecords(search ? { search } : {}),
        api.getCultures(),
      ]);
      setRecords(astData);
      setCultures(culData);
      if (culData.length > 0 && !formData.cultureId) {
        setFormData((prev) => ({ ...prev, cultureId: culData[0].id }));
      }
    } catch (err: any) {
      console.error('Failed fetching AST records:', err);
      error(err.message || 'Failed to load AST records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAst();
  }, [search]);

  const handleAntibioticPreset = (idx: number) => {
    const p = antibioticPresets[idx];
    if (p) {
      setFormData((prev) => ({
        ...prev,
        antibioticName: p.antibiotic,
        method: p.method,
        zoneDiameterMm: p.zone,
        micValueUgMl: p.mic,
        interpretation: p.interp,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cultureId) {
      error('Please select a target culture plate');
      return;
    }
    setSubmitting(true);
    try {
      await api.createAst({
        cultureId: formData.cultureId,
        organismIdentified: formData.organismIdentified,
        antibioticName: formData.antibioticName,
        method: formData.method,
        zoneDiameterMm: formData.zoneDiameterMm ? Number(formData.zoneDiameterMm) : null,
        micValueUgMl: formData.micValueUgMl ? Number(formData.micValueUgMl) : null,
        interpretation: formData.interpretation,
        referenceGuideline: formData.referenceGuideline,
        notes: formData.notes || null,
      });
      success(`AST Antibiogram for '${formData.antibioticName}' recorded!`);
      setModalOpen(false);
      fetchAst();
    } catch (err: any) {
      error(err.message || 'Failed to record AST record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Antimicrobial Susceptibility Testing (AST Antibiograms)"
        category="Therapeutic Profiling"
        description="Kirby-Bauer disc diffusion zone diameters and broth microdilution MIC clinical breakpoints per CLSI / EUCAST."
        badge="CLSI M100 / EUCAST"
        badgeVariant="cyan"
        icon={<Dna size={24} />}
        actions={
          <>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={15}
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
                style={{ paddingLeft: '36px' }}
                placeholder="Search organism or antibiotic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Record AST Panel
              </button>
            )}
            <button onClick={fetchAst} className="btn btn-secondary btn-sm" title="Refresh AST">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* AST Records Table */}
      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Culture Identifier</th>
              <th>Organism Identified</th>
              <th>Antibiotic Agent</th>
              <th>Methodology</th>
              <th>Zone (mm)</th>
              <th>MIC (µg/mL)</th>
              <th>CLSI Breakpoint</th>
              <th>Guidelines</th>
              <th>Analyst</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <Dna size={24} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No AST Antibiogram Records Found</div>
                    <p style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
                      Record antibiotic disc diffusion or microdilution MIC readings against active bacterial isolates.
                    </p>
                    {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
                      <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        <Plus size={14} /> Record First AST Panel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              records.map((a) => (
                <tr key={a.id}>
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
                      {a.ast_code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontStyle: 'italic', color: '#0f172a' }}>
                    {a.organism_identified}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.antibiotic_name}</td>
                  <td>{a.method}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#0f172a' }}>
                    {a.zone_diameter_mm ? `${a.zone_diameter_mm} mm` : a.mic_value_ug_ml ? `${a.mic_value_ug_ml} µg/mL` : '-'}
                  </td>
                  <td>
                    <Badge variant={a.interpretation === 'SUSCEPTIBLE' ? 'success' : a.interpretation === 'RESISTANT' ? 'danger' : 'warning'}>
                      {a.interpretation}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.reference_guideline}</td>
                  <td style={{ fontWeight: 600 }}>{a.technician_name || 'Microbiologist'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record AST Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Antimicrobial Susceptibility Panel"
        subtitle="Evaluate Kirby-Bauer zone measurements or MIC breakpoints against CLSI/EUCAST standards"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Target Primary Culture Plate *</label>
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

          <div>
            <label className="form-label">Pathogen / Isolate Identified *</label>
            <input
              type="text"
              required
              className="form-control font-mono"
              value={formData.organismIdentified}
              onChange={(e) => setFormData({ ...formData, organismIdentified: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Antibiotic Disc Preset (1-Click Fill)</label>
            <select
              className="form-control"
              onChange={(e) => handleAntibioticPreset(Number(e.target.value))}
              defaultValue="0"
            >
              {antibioticPresets.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.antibiotic} ({p.method} • {p.interp})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Antibiotic Agent & Potency *</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.antibioticName}
                onChange={(e) => setFormData({ ...formData, antibioticName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Testing Method *</label>
              <select
                className="form-control"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="KIRBY_BAUER_DISC">Kirby-Bauer Disc Diffusion</option>
                <option value="MIC_BROTH_DILUTION">Broth Microdilution (MIC)</option>
                <option value="E_TEST">E-Test Gradient Strip</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Zone Diameter (mm) or MIC (µg/mL)</label>
              <input
                type="number"
                step="0.01"
                className="form-control font-mono"
                placeholder="e.g. 21"
                value={formData.zoneDiameterMm ?? formData.micValueUgMl ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  if (formData.method === 'KIRBY_BAUER_DISC') {
                    setFormData({ ...formData, zoneDiameterMm: val, micValueUgMl: null });
                  } else {
                    setFormData({ ...formData, micValueUgMl: val, zoneDiameterMm: null });
                  }
                }}
              />
            </div>

            <div>
              <label className="form-label">CLSI / EUCAST Breakpoint Interpretation *</label>
              <select
                className="form-control"
                value={formData.interpretation}
                onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
              >
                <option value="SUSCEPTIBLE">SUSCEPTIBLE (S)</option>
                <option value="INTERMEDIATE">INTERMEDIATE (I)</option>
                <option value="RESISTANT">RESISTANT (R)</option>
                <option value="NOT_INTERPRETED">NOT INTERPRETED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Reference Standard Guideline</label>
            <input
              type="text"
              className="form-control"
              value={formData.referenceGuideline}
              onChange={(e) => setFormData({ ...formData, referenceGuideline: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving AST...' : 'Record AST Antibiogram'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

