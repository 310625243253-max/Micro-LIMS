import React, { useEffect, useState } from 'react';
import { api, getReportPreviewUrl, getReportDownloadUrl } from '../services/api';
import { ReportRecord, Sample } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, Download, Eye, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Copy, Plus } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error, info } = useToast();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState('');

  // Checksum verification tool state
  const [verifyChecksumInput, setVerifyChecksumInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rptData, smpData] = await Promise.all([
        api.getReports(),
        api.getSamples({ status: 'FINALIZED' }),
      ]);
      setReports(rptData);
      setSamples(smpData);
      if (smpData.length > 0 && !selectedSampleId) {
        setSelectedSampleId(smpData[0].id);
      }
    } catch (err: any) {
      console.error('Failed fetching reports:', err);
      error(err.message || 'Failed to load diagnostic reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyChecksumInput.trim()) {
      error('Please paste a SHA-256 checksum to verify authenticity');
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyChecksum(verifyChecksumInput.trim());
      setVerifyResult(res);
      if (res.valid) {
        success('Checksum successfully validated against immutable ledger!');
      } else {
        error('Checksum is invalid or has been tampered with');
      }
    } catch (err: any) {
      setVerifyResult({ valid: false, error: err.message });
      error(err.message || 'Checksum verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSampleId) {
      error('Please select a finalized specimen for report generation');
      return;
    }
    setSubmitting(true);
    try {
      await api.generateReport(selectedSampleId);
      success('Official diagnostic PDF report generated and signed!');
      setModalOpen(false);
      fetchReports();
    } catch (err: any) {
      error(err.message || 'Failed to generate diagnostic report');
    } finally {
      setSubmitting(false);
    }
  };

  const copyChecksum = (checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setVerifyChecksumInput(checksum);
    info('Checksum copied to clipboard and loaded into verifier tool!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Diagnostic PDF Reports & Cryptographic Signatures"
        category="Release & Regulatory"
        description="Tamper-evident SHA-256 signed official medical reports with ISO 15189 compliance watermarks."
        badge="SHA-256 Signed"
        badgeVariant="emerald"
        icon={<FileText size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'REVIEWER') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Synthesize PDF Report
              </button>
            )}
            <button onClick={fetchReports} className="btn btn-secondary btn-sm" title="Refresh Reports">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      {/* Checksum Verification Tool Box */}
      <Interactive3DCard
        maxTilt={3}
        glowColor="rgba(16, 185, 129, 0.2)"
        style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #a7f3d0',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Cryptographic Report Authenticity & Checksum Verifier
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Verify tamper-evident SHA-256 signatures for clinical PDF diagnostic reports
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <input
            type="text"
            className="form-control font-mono"
            style={{ flex: 1, minWidth: '280px' }}
            placeholder="Paste 64-character SHA-256 checksum (e.g. 7d2e48756bf0a62d08a543ef69b3...)"
            value={verifyChecksumInput}
            onChange={(e) => setVerifyChecksumInput(e.target.value)}
          />
          <button type="submit" disabled={verifying} className="btn btn-glow-emerald">
            {verifying ? 'Verifying...' : 'Verify Signature'}
          </button>
        </form>

        {verifyResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: verifyResult.valid ? '#ecfdf5' : '#fff1f2',
              border: verifyResult.valid ? '1px solid #a7f3d0' : '1px solid #fecdd3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: verifyResult.valid ? '#047857' : '#e11d48' }}>
              {verifyResult.valid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {verifyResult.valid ? 'Cryptographically Authentic & Release Verified' : 'Invalid or Unverified Checksum'}
            </div>
            {verifyResult.report && (
              <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#475569' }}>
                Report Code: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{verifyResult.report.report_code}</strong> • Generated: {new Date(verifyResult.report.generated_at).toLocaleString()} • Signer: {verifyResult.report.signer_name}
              </div>
            )}
          </div>
        )}
      </Interactive3DCard>

      {/* Diagnostic Reports Table */}
      <div className="glass-panel-3d" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Diagnostic Reports Center ({reports.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Generated diagnostic summaries with embedded checksums
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {hasRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Synthesize PDF Report
              </button>
            )}
            <button onClick={fetchReports} className="btn btn-secondary btn-sm" title="Refresh Reports">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Code</th>
                <th>PDF Filename</th>
                <th>SHA-256 Checksum (Click to copy)</th>
                <th>Authorized Signer</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonLoader type="table-row" count={5} />
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state-box">
                      <div className="empty-state-icon">
                        <FileText size={24} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No Diagnostic Reports Synthesized</div>
                      <p style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
                        Diagnostic reports will appear here once specimens pass Quality Assurance review and are finalized.
                      </p>
                      {hasRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER') && (
                        <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                          <Plus size={14} /> Synthesize New Report
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((rpt) => (
                  <tr key={rpt.id}>
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
                        {rpt.report_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{rpt.pdf_filename}</td>
                    <td>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: '0.75rem',
                          color: '#047857',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ecfdf5',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid #a7f3d0',
                          fontWeight: 600,
                        }}
                        title="Click to copy and verify checksum"
                        onClick={() => copyChecksum(rpt.checksum_sha256)}
                      >
                        <Copy size={11} />
                        {rpt.checksum_sha256.substring(0, 18)}...
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{rpt.generated_by_name || 'System'}</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(rpt.generated_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <a
                          href={getReportPreviewUrl(rpt.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={13} /> Preview
                        </a>
                        <a
                          href={getReportDownloadUrl(rpt.id)}
                          download
                          className="btn btn-primary btn-sm"
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synthesize Report Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Synthesize Diagnostic PDF Report"
        subtitle="Compile specimen lineage, morphology, identification battery, and signed antibiogram into an official signed PDF"
      >
        <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Select Finalized Specimen *</label>
            <select
              className="form-control"
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              required
            >
              {samples.length === 0 ? (
                <option value="">No finalized specimens currently awaiting report synthesis</option>
              ) : (
                samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.accession_number} — {s.sample_type} ({s.patient_synthetic_name || s.patient_synthetic_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            The report engine will calculate SHA-256 checksums and embed ISO 15189 compliance watermarks.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || samples.length === 0} className="btn btn-primary">
              {submitting ? 'Synthesizing...' : 'Synthesize Official PDF'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

