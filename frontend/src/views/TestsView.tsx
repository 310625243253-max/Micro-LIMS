import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TestRecord, Culture } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileCheck, RefreshCw, Plus, FlaskConical } from 'lucide-react';

export const TestsView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const testPresets = [
    { name: 'Catalase Reaction', method: 'Hydrogen Peroxide 3% Slide', result: 'Immediate vigorous effervescence (Positive)', interp: 'Staphylococcus / Micrococcus genus confirmed' },
    { name: 'Coagulase Clotting Assay', method: 'Rabbit Plasma Tube Coagulation', result: 'Firm coherent fibrin clot formed at 4h 37°C (Positive)', interp: 'Staphylococcus aureus differentiation confirmed' },
    { name: 'Oxidase Spot Test', method: 'Tetramethyl-p-phenylenediamine reagent', result: 'Deep purple color reaction within 10 seconds (Positive)', interp: 'Pseudomonas / Neisseria genus confirmed' },
    { name: 'Gram Stain Microscopy', method: 'Crystal Violet / Iodine / Safranin (1000x Oil)', result: 'Gram-positive cocci in clusters', interp: 'Consistent with Staphylococcal morphology' },
    { name: 'Indole Spot Assay', method: 'p-Dimethylaminocinnamaldehyde spot test', result: 'Immediate turquoise-blue color development (Positive)', interp: 'Escherichia coli confirmation' },
    { name: 'Bile Solubility Test', method: '2% Sodium deoxycholate lysis assay', result: 'Rapid clearance and lysis of bacterial suspension (Positive)', interp: 'Streptococcus pneumoniae confirmed' },
  ];

  const [formData, setFormData] = useState({
    cultureId: '',
    testName: testPresets[0].name,
    method: testPresets[0].method,
    rawResult: testPresets[0].result,
    interpretation: testPresets[0].interp,
    notes: '',
  });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const [testsData, culturesData] = await Promise.all([
        api.getTests(),
        api.getCultures(),
      ]);
      setTests(testsData);
      setCultures(culturesData);
      if (culturesData.length > 0 && !formData.cultureId) {
        setFormData((prev) => ({ ...prev, cultureId: culturesData[0].id }));
      }
    } catch (err: any) {
      console.error('Failed fetching tests:', err);
      error(err.message || 'Failed to load biochemical tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handlePresetSelect = (presetIndex: number) => {
    const p = testPresets[presetIndex];
    if (p) {
      setFormData((prev) => ({
        ...prev,
        testName: p.name,
        method: p.method,
        rawResult: p.result,
        interpretation: p.interp,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cultureId) {
      error('Please select a valid target culture plate');
      return;
    }
    setSubmitting(true);
    try {
      await api.createTest({
        cultureId: formData.cultureId,
        testName: formData.testName,
        method: formData.method,
        rawResult: formData.rawResult,
        interpretation: formData.interpretation,
        notes: formData.notes || null,
      });
      success(`Biochemical test '${formData.testName}' recorded successfully!`);
      setModalOpen(false);
      fetchTests();
    } catch (err: any) {
      error(err.message || 'Failed to record biochemical test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Biochemical Battery & Microbial Identification"
        category="Analytical Identification"
        description="Catalase, coagulase, oxidase, indole, bile solubility, and differential enzymatic assay batteries."
        badge="Enzymatic Assay Battery"
        badgeVariant="emerald"
        icon={<FlaskConical size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'MICROBIOLOGIST', 'TECHNICIAN') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Run Biochemical Test
              </button>
            )}
            <button onClick={fetchTests} className="btn btn-secondary btn-sm" title="Refresh Tests">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* Tests Table */}
      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Culture Identifier</th>
              <th>Test Assay Name</th>
              <th>Methodology</th>
              <th>Analytical Finding</th>
              <th>Clinical Interpretation</th>
              <th>Analyst</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : tests.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <FlaskConical size={24} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No Biochemical Tests Recorded</div>
                    <p style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
                      Run identification battery tests (catalase, coagulase, oxidase) to establish microbial identity.
                    </p>
                    {hasRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST') && (
                      <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        <Plus size={14} /> Record First Biochemical Test
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={t.id}>
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
                      {t.test_code}
                    </span>
                  </td>
                  <td className="font-mono" style={{ color: '#0f172a' }}>
                    {t.culture_id.substring(0, 13)}...
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.test_name}</td>
                  <td>{t.method}</td>
                  <td style={{ color: '#047857', fontWeight: 700 }}>{t.raw_result}</td>
                  <td style={{ color: '#0f172a' }}>{t.interpretation}</td>
                  <td style={{ fontWeight: 600 }}>{t.performed_by_name || 'Staff'}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(t.performed_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Test Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Execute Biochemical Identification Assay"
        subtitle="Record enzymatic reaction, stain microscopy, or confirmatory diagnostic test"
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
            <label className="form-label">Quick Assay Preset (1-Click Fill)</label>
            <select
              className="form-control"
              onChange={(e) => handlePresetSelect(Number(e.target.value))}
              defaultValue="0"
            >
              {testPresets.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.name} ({p.method})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Assay / Test Name *</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.testName}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Methodology & Reagent *</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Raw Analytical Result *</label>
            <input
              type="text"
              required
              className="form-control font-mono"
              value={formData.rawResult}
              onChange={(e) => setFormData({ ...formData, rawResult: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Clinical Diagnostic Interpretation *</label>
            <textarea
              rows={2}
              required
              className="form-control"
              value={formData.interpretation}
              onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Analytical Notes</label>
            <textarea
              rows={2}
              className="form-control"
              placeholder="Controls validated within acceptable QC limits..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Recording...' : 'Save Biochemical Test'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

