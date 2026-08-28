import React, { useEffect, useState } from 'react';
import { api, getReportPreviewUrl, getReportDownloadUrl } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  TestTube,
  Microscope,
  Flame,
  Eye,
  FileCheck,
  Dna,
  ShieldAlert,
  ClipboardCheck,
  FileText,
  History,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';

interface SampleDetailViewProps {
  sampleId: string;
  onBack: () => void;
}

export const SampleDetailView: React.FC<SampleDetailViewProps> = ({ sampleId, onBack }) => {
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();
  const [lineage, setLineage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Action Modals
  const [cultureModalOpen, setCultureModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Form states
  const [mediaLots, setMediaLots] = useState<any[]>([]);
  const [cultureForm, setCultureForm] = useState({
    mediaLotId: '',
    mediaType: 'Blood Agar (5% Sheep Blood)',
    inoculationMethod: 'STREAK_4_QUADRANT',
    notes: '',
  });

  const [reviewForm, setReviewForm] = useState({
    decision: 'APPROVE',
    comments: 'All biochemical reactions and AST susceptibility breakpoints validated against CLSI guidelines.',
    signerName: `${user?.first_name || 'Dr.'} ${user?.last_name || 'Reviewer'}`,
    signerTitle: user?.title || 'Senior Reviewer',
  });

  const fetchLineage = async () => {
    setLoading(true);
    try {
      const [data, media] = await Promise.all([
        api.getSampleLineage(sampleId),
        api.getMediaLots({ status: 'ACTIVE' }),
      ]);
      setLineage(data);
      setMediaLots(media);
      if (media.length > 0 && !cultureForm.mediaLotId) {
        setCultureForm((prev) => ({ ...prev, mediaLotId: media[0].id, mediaType: media[0].media_name }));
      }
    } catch (err: any) {
      console.error('Failed to load sample lineage:', err);
      error(err.message || 'Failed to load specimen lineage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
  }, [sampleId]);

  const handleInoculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCulture({
        sampleId,
        mediaLotId: cultureForm.mediaLotId || undefined,
        mediaType: cultureForm.mediaType,
        inoculationMethod: cultureForm.inoculationMethod,
        notes: cultureForm.notes,
      });
      success('Primary culture plate inoculated successfully!');
      setCultureModalOpen(false);
      fetchLineage();
    } catch (err: any) {
      error(err.message || 'Failed to inoculate culture');
    }
  };

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.signOffReview({
        sampleId,
        decision: reviewForm.decision,
        comments: reviewForm.comments,
        signerName: reviewForm.signerName,
        signerTitle: reviewForm.signerTitle,
      });
      success(`Quality review recorded and signed (${reviewForm.decision})!`);
      setReviewModalOpen(false);
      fetchLineage();
    } catch (err: any) {
      error(err.message || 'Failed to sign off review');
    }
  };

  const handleGenerateReport = async () => {
    try {
      await api.generateReport(sampleId);
      fetchLineage();
      success('Diagnostic report generated and cryptographically signed successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to generate report');
    }
  };

  if (loading || !lineage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonLoader type="stat" count={1} height={180} />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  const { sample, cultures, incubations, observations, tests, astRecords, reviews, reports, auditLogs } = lineage;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Registry
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {sample.status !== 'FINALIZED' && hasRole('ADMIN', 'TECHNICIAN') && (
            <button
              onClick={async () => {
                const lots = await api.getMediaLots({ status: 'ACTIVE' });
                setMediaLots(lots);
                if (lots.length > 0) setCultureForm((f) => ({ ...f, mediaLotId: lots[0].id }));
                setCultureModalOpen(true);
              }}
              className="btn btn-glow-cyan btn-sm"
            >
              <Plus size={14} /> Inoculate Culture Plate
            </button>
          )}

          {sample.status === 'UNDER_REVIEW' && hasRole('ADMIN', 'REVIEWER') && (
            <button
              onClick={() => setReviewModalOpen(true)}
              className="btn btn-glow-emerald btn-sm"
            >
              <ClipboardCheck size={14} /> Execute Sign-off
            </button>
          )}

          {sample.status === 'FINALIZED' && hasRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER', 'VIEWER') && (
            <button
              onClick={handleGenerateReport}
              className="btn btn-glow-cyan btn-sm"
            >
              <FileText size={14} /> {reports.length > 0 ? 'Regenerate PDF Report' : 'Synthesize PDF Report'}
            </button>
          )}
        </div>
      </div>

      {/* Specimen Header Summary Card with 3D Depth */}
      <Interactive3DCard
        maxTilt={3}
        glowColor="rgba(2, 132, 199, 0.2)"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(255, 255, 255, 0.95)',
          border: sample.quarantined ? '1.5px solid #e11d48' : '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span
                className="font-mono"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  letterSpacing: '-0.02em',
                }}
              >
                {sample.accession_number}
              </span>
              <Badge variant={sample.priority === 'STAT' ? 'stat' : sample.priority === 'URGENT' ? 'urgent' : 'routine'}>
                {sample.priority} Priority
              </Badge>
              <Badge
                variant={
                  sample.status === 'FINALIZED'
                    ? 'success'
                    : sample.status === 'UNDER_REVIEW'
                    ? 'warning'
                    : sample.status === 'IN_TESTING'
                    ? 'cyan'
                    : 'neutral'
                }
              >
                {sample.status}
              </Badge>
              {sample.quarantined && (
                <Badge variant="quarantine">
                  <ShieldAlert size={12} /> QUARANTINE LOCKED
                </Badge>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginTop: '16px',
                background: '#f8fafc',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Patient Synthetic Record</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  <span className="font-mono" style={{ color: '#0284c7' }}>{sample.patient_synthetic_id}</span>
                  <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>({sample.patient_synthetic_name || 'Anonymous'})</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Specimen & Site</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {sample.sample_type} • <span style={{ color: '#475569', fontWeight: 500 }}>{sample.collection_site}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Accessioning Custodian</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {sample.accessioned_by_name || 'Medical Laboratory Staff'}
                </div>
              </div>
            </div>

            {sample.clinical_notes && (
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.825rem',
                  color: '#475569',
                  background: '#f0f9ff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #bae6fd',
                }}
              >
                <strong style={{ color: '#0284c7' }}>Clinical Indication:</strong> {sample.clinical_notes}
              </div>
            )}
          </div>
        </div>
      </Interactive3DCard>

      {/* Visual Diagnostic Lineage Pipeline */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          Diagnostic Chain of Custody & Traceability Pipeline
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {/* Step 1: Specimen */}
          <div style={{ padding: '14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <TestTube size={22} style={{ color: '#0284c7', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>1. Specimen</div>
            <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>{sample.accession_number}</div>
          </div>

          {/* Step 2: Cultures */}
          <div style={{ padding: '14px', background: cultures.length > 0 ? '#f0f9ff' : '#f8fafc', border: cultures.length > 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Microscope size={22} style={{ color: cultures.length > 0 ? '#0284c7' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: cultures.length > 0 ? '#0f172a' : '#94a3b8' }}>2. Primary Culture</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{cultures.length} Plate(s)</div>
          </div>

          {/* Step 3: Incubation */}
          <div style={{ padding: '14px', background: incubations.length > 0 ? '#faf5ff' : '#f8fafc', border: incubations.length > 0 ? '1px solid #e9d5ff' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Flame size={22} style={{ color: incubations.length > 0 ? '#7c3aed' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: incubations.length > 0 ? '#0f172a' : '#94a3b8' }}>3. Incubation</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{incubations.length} Chamber(s)</div>
          </div>

          {/* Step 4: Morphology */}
          <div style={{ padding: '14px', background: observations.length > 0 ? '#f0f9ff' : '#f8fafc', border: observations.length > 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Eye size={22} style={{ color: observations.length > 0 ? '#0284c7' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: observations.length > 0 ? '#0f172a' : '#94a3b8' }}>4. Morphology</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{observations.length} Reading(s)</div>
          </div>

          {/* Step 5: Tests & AST */}
          <div style={{ padding: '14px', background: tests.length > 0 || astRecords.length > 0 ? '#f0f9ff' : '#f8fafc', border: tests.length > 0 || astRecords.length > 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Dna size={22} style={{ color: tests.length > 0 || astRecords.length > 0 ? '#0284c7' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tests.length > 0 || astRecords.length > 0 ? '#0f172a' : '#94a3b8' }}>5. Battery & AST</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{tests.length} tests • {astRecords.length} AST</div>
          </div>

          {/* Step 6: QC Sign-off */}
          <div style={{ padding: '14px', background: reviews.length > 0 ? '#ecfdf5' : '#f8fafc', border: reviews.length > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <ClipboardCheck size={22} style={{ color: reviews.length > 0 ? '#059669' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: reviews.length > 0 ? '#047857' : '#94a3b8' }}>6. QC Sign-off</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{reviews.length > 0 ? 'Approved' : 'Pending'}</div>
          </div>

          {/* Step 7: Official PDF Report */}
          <div style={{ padding: '14px', background: reports.length > 0 ? '#faf5ff' : '#f8fafc', border: reports.length > 0 ? '1px solid #e9d5ff' : '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <FileText size={22} style={{ color: reports.length > 0 ? '#7c3aed' : '#94a3b8', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: reports.length > 0 ? '#6b21a8' : '#94a3b8' }}>7. Signed PDF</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>{reports.length > 0 ? 'Generated' : 'Pending'}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: `Cultures & Tests (${cultures.length})` },
          { id: 'ast', label: `AST Antibiogram (${astRecords.length})` },
          { id: 'reviews', label: `QC Reviews & Sign-offs (${reviews.length})` },
          { id: 'reports', label: `Diagnostic PDF Reports (${reports.length})` },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Cultures, Incubations, Morphology & Tests */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cultures.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No culture plates inoculated yet for this specimen.
            </div>
          ) : (
            cultures.map((cul: any) => (
              <div key={cul.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.05rem' }}>
                      {cul.culture_code}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{cul.media_type}</span>
                    {cul.media_lot_number && (
                      <span className="font-mono" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '3px 10px', borderRadius: 'var(--radius-sm)', color: '#475569', border: '1px solid #e2e8f0' }}>
                        Lot: {cul.media_lot_number}
                      </span>
                    )}
                  </div>
                  <Badge variant="routine">{cul.status}</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.8125rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 600 }}>Inoculation Method</div>
                    <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>{cul.inoculation_method}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 600 }}>Inoculated By</div>
                    <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>{cul.inoculated_by_name || 'Technician'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 600 }}>Timestamp</div>
                    <div style={{ color: '#475569', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{new Date(cul.inoculated_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Sub-observations */}
                {observations.filter((o: any) => o.culture_id === cul.id).length > 0 && (
                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Colonial Morphology Reading
                    </div>
                    {observations.filter((o: any) => o.culture_id === cul.id).map((obs: any) => (
                      <div key={obs.id} style={{ fontSize: '0.85rem', color: '#475569' }}>
                        <div><strong>Growth:</strong> <span style={{ color: '#0f172a' }}>{obs.growth_status}</span> ({obs.colony_count_cfu || 'CFU recorded'}) • <strong>Hemolysis:</strong> <span style={{ color: '#0f172a' }}>{obs.hemolysis}</span></div>
                        <div style={{ marginTop: '4px', color: '#0f172a' }}><strong>Morphology:</strong> {obs.colony_morphology}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-tests */}
                {tests.filter((t: any) => t.culture_id === cul.id).length > 0 && (
                  <div style={{ marginTop: '18px' }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Biochemical Battery Identification Results
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Test Code</th>
                          <th>Test Name</th>
                          <th>Method</th>
                          <th>Result</th>
                          <th>Clinical Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.filter((t: any) => t.culture_id === cul.id).map((t: any) => (
                          <tr key={t.id}>
                            <td className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>{t.test_code}</td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.test_name}</td>
                            <td>{t.method}</td>
                            <td style={{ color: '#047857', fontWeight: 700 }}>{t.raw_result}</td>
                            <td>{t.interpretation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: AST Antibiogram */}
      {activeTab === 'ast' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Antimicrobial Susceptibility Testing (AST Antibiogram Panel)
          </h3>
          {astRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No AST antibiogram records recorded for this specimen.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>AST Code</th>
                  <th>Organism Identified</th>
                  <th>Antimicrobial Agent</th>
                  <th>Testing Method</th>
                  <th>Measurement</th>
                  <th>Interpretation</th>
                  <th>Reference Standard</th>
                </tr>
              </thead>
              <tbody>
                {astRecords.map((a: any) => (
                  <tr key={a.id}>
                    <td className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>{a.ast_code}</td>
                    <td style={{ fontWeight: 700, fontStyle: 'italic', color: '#0f172a' }}>{a.organism_identified}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.antibiotic_name}</td>
                    <td>{a.method}</td>
                    <td className="font-mono" style={{ color: '#0f172a', fontWeight: 600 }}>
                      {a.zone_diameter_mm ? `${a.zone_diameter_mm} mm` : `${a.mic_value_ug_ml} µg/mL`}
                    </td>
                    <td>
                      <Badge variant={a.interpretation === 'SUSCEPTIBLE' ? 'success' : a.interpretation === 'RESISTANT' ? 'danger' : 'warning'}>
                        {a.interpretation}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.reference_guideline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: QC Reviews & Electronic Sign-off */}
      {activeTab === 'reviews' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Quality Assurance Verification & Electronic Sign-off History
          </h3>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No review decisions executed yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map((r: any) => (
                <div key={r.id} style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Badge variant={r.decision === 'APPROVE' ? 'success' : 'danger'}>
                        {r.decision}
                      </Badge>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.signer_name}</span>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>({r.signer_title})</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(r.reviewed_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '0.875rem', color: '#334155' }}>
                    {r.comments}
                  </div>

                  <div style={{ marginTop: '12px', padding: '8px 12px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Hash size={15} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cryptographic SHA-256 Signature Hash:</span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{r.electronic_signature_hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Diagnostic PDF Reports */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Official Diagnostic Reports</h3>
            {sample.status === 'FINALIZED' && (
              <button onClick={handleGenerateReport} className="btn btn-primary btn-sm">
                <FileText size={14} /> Synthesize New Official Report
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              No diagnostic reports synthesized for this specimen yet. (Requires FINALIZED stage).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map((rpt: any) => (
                <div key={rpt.id} style={{ padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: '#0284c7' }}>{rpt.report_code}</span>
                      <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600 }}>{rpt.pdf_filename}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>SHA-256 Checksum:</span>
                      <span className="font-mono" style={{ color: '#059669', fontWeight: 600 }}>{rpt.checksum_sha256}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href={getReportPreviewUrl(rpt.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={13} /> Preview PDF
                    </a>
                    <a
                      href={getReportDownloadUrl(rpt.id)}
                      download
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={13} /> Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Master Audit Trail */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Immutable Specimen Audit History
          </h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Summary & Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.user_email || 'System'}</td>
                    <td style={{ color: '#0f172a' }}>{log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Inoculate Culture Plate */}
      <Modal
        isOpen={cultureModalOpen}
        onClose={() => setCultureModalOpen(false)}
        title="Inoculate Primary Culture Plate"
        subtitle={`Sample: ${sample.accession_number} (${sample.sample_type})`}
      >
        <form onSubmit={handleInoculate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Traceable Media Lot *</label>
            <select
              className="form-control"
              value={cultureForm.mediaLotId}
              onChange={(e) => {
                const lot = mediaLots.find((l) => l.id === e.target.value);
                setCultureForm({
                  ...cultureForm,
                  mediaLotId: e.target.value,
                  mediaType: lot ? lot.media_name : cultureForm.mediaType,
                });
              }}
            >
              {mediaLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.media_name} (Lot: {lot.lot_number} • Exp: {new Date(lot.expiry_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Inoculation Streaking Method *</label>
            <select
              className="form-control"
              value={cultureForm.inoculationMethod}
              onChange={(e) => setCultureForm({ ...cultureForm, inoculationMethod: e.target.value })}
            >
              <option value="STREAK_4_QUADRANT">Streak - 4-Quadrant Isolation</option>
              <option value="SPREAD_PLATE">Spread Plate (Quantitative)</option>
              <option value="POUR_PLATE">Pour Plate</option>
              <option value="LAWN_CULTURE">Lawn Culture (Confluent Growth for AST)</option>
              <option value="STAB_INOCULATION">Stab Inoculation</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes & Observations</label>
            <textarea
              rows={2}
              className="form-control"
              placeholder="Primary inoculation for single colony isolation..."
              value={cultureForm.notes}
              onChange={(e) => setCultureForm({ ...cultureForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setCultureModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Inoculate Plate
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: QC Review & Sign-off */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Quality Control Review & Electronic Sign-off"
        subtitle={`Specimen: ${sample.accession_number}`}
      >
        <form onSubmit={handleSignOff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Review Decision *</label>
            <select
              className="form-control"
              value={reviewForm.decision}
              onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
            >
              <option value="APPROVE">APPROVE — Finalize and Issue Diagnostic Report</option>
              <option value="REJECT">REJECT — Request Repeat Testing</option>
              <option value="AMEND">AMEND — Issue Corrected Addendum</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Signer Name *</label>
              <input
                type="text"
                required
                className="form-control"
                value={reviewForm.signerName}
                onChange={(e) => setReviewForm({ ...reviewForm, signerName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Signer Title *</label>
              <input
                type="text"
                required
                className="form-control"
                value={reviewForm.signerTitle}
                onChange={(e) => setReviewForm({ ...reviewForm, signerTitle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">QA Reviewer Comments *</label>
            <textarea
              rows={3}
              required
              className="form-control"
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: '#047857',
              background: '#ecfdf5',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={15} />
            Submitting will compute a cryptographic SHA-256 digital signature hash.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setReviewModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Execute Electronic Sign-off
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
