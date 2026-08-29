import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sample, ReviewRecord } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { Interactive3DCard } from '../components/3d/Interactive3DCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ClipboardCheck, ArrowUpRight, CheckCircle2, Hash, RefreshCw, ShieldCheck } from 'lucide-react';

interface ReviewsViewProps {
  onSelectSample: (sampleId: string) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ onSelectSample }) => {
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();
  const [pending, setPending] = useState<Sample[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Sign-off modal state
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [signForm, setSignForm] = useState({
    decision: 'APPROVE',
    comments: 'All colony counts, biochemical reactions, and AST breakpoints verified against CLSI standards.',
    signerName: `${user?.first_name || 'Dr.'} ${user?.last_name || 'Reviewer'}`,
    signerTitle: user?.title || 'Senior QA Reviewer',
  });

  const isAuthorizedToReview = hasRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAuthorizedToReview) {
        const [p, r] = await Promise.all([
          api.getPendingReviews(),
          api.getReviews(),
        ]);
        setPending(p);
        setReviews(r);
      } else {
        const r = await api.getReviews();
        setPending([]);
        setReviews(r);
      }
    } catch (err: any) {
      console.error('Failed loading review queues:', err);
      error(err.message || 'Failed loading QC review queues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample) return;
    try {
      await api.signOffReview({
        sampleId: selectedSample.id,
        decision: signForm.decision,
        comments: signForm.comments,
        signerName: signForm.signerName,
        signerTitle: signForm.signerTitle,
      });
      success(`QC Sign-off (${signForm.decision}) recorded with SHA-256 digital signature!`);
      setSelectedSample(null);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Failed to sign off review');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Quality Control Review & Electronic Sign-off"
        category="Quality & Governance"
        description="Two-person electronic verification, cryptographic SHA-256 signing, and clinical release queue."
        badge="Electronic Dual Sign-off"
        badgeVariant="emerald"
        icon={<ClipboardCheck size={24} />}
        actions={
          <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh Review Queue">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        }
      />

      {!isAuthorizedToReview && (
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#0369a1',
            fontSize: '0.9rem',
          }}
        >
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Role-Based Access Notice:</strong> You are currently signed in as{' '}
            <strong>{user?.first_name} {user?.last_name} ({user?.roles?.join(', ')})</strong>.
            Reviewing pending triage specimens and executing cryptographic sign-offs requires{' '}
            <strong>ADMIN</strong>, <strong>MICROBIOLOGIST</strong>, or <strong>REVIEWER</strong> permissions.
            Log in as <code>admin@microlims.lab</code> or <code>reviewer@microlims.lab</code> to perform QA approvals.
          </div>
        </div>
      )}

      {/* Pending Reviews Section */}
      <div className="glass-panel-3d" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#d97706',
                display: 'inline-block',
              }}
              className="pulse-beacon"
            />
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Pending Quality Assurance Triage Queue ({pending.length})
            </h4>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : pending.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            <CheckCircle2 size={24} style={{ color: '#059669', margin: '0 auto 8px' }} />
            All specimens are fully reviewed and approved. Queue is completely clear!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {pending.map((s) => (
              <Interactive3DCard
                key={s.id}
                maxTilt={6}
                glowColor="rgba(217, 119, 6, 0.2)"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                      {s.accession_number}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                      {s.patient_synthetic_id} <span style={{ color: '#64748b', fontWeight: 400 }}>({s.patient_synthetic_name || 'Anonymous'})</span>
                    </div>
                  </div>
                  <Badge variant={s.priority === 'STAT' ? 'stat' : s.priority === 'URGENT' ? 'urgent' : 'routine'}>
                    {s.priority}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                  <div><strong>Specimen:</strong> {s.sample_type} ({s.collection_site})</div>
                  <div style={{ marginTop: '2px' }}><strong>Accessioned:</strong> {new Date(s.received_at).toLocaleDateString()}</div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button onClick={() => onSelectSample(s.id)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Inspect Lineage <ArrowUpRight size={13} />
                  </button>
                  {hasRole('ADMIN', 'REVIEWER') && (
                    <button
                      onClick={() => {
                        setSelectedSample(s);
                        setSignForm({
                          ...signForm,
                          signerName: `${user?.first_name || 'Dr.'} ${user?.last_name || 'Reviewer'}`,
                          signerTitle: user?.title || 'Senior QA Reviewer',
                        });
                      }}
                      className="btn btn-glow-emerald btn-sm"
                      style={{ flex: 1 }}
                    >
                      <ClipboardCheck size={13} /> Sign-off
                    </button>
                  )}
                </div>
              </Interactive3DCard>
            ))}
          </div>
        )}
      </div>

      {/* Historical Reviews Table */}
      <div className="glass-panel-3d" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700, marginBottom: '16px' }}>
          Historical Electronic Sign-offs & Decisions
        </h4>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Signer Name & Title</th>
                <th>Reviewer Comments</th>
                <th>Cryptographic Signature Hash</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No historical reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Badge variant={r.decision === 'APPROVE' ? 'success' : 'danger'}>
                        {r.decision}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.signer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.signer_title}</div>
                    </td>
                    <td style={{ color: '#334155', maxWidth: '300px' }}>{r.comments}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hash size={13} style={{ color: '#0284c7' }} />
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          {r.electronic_signature_hash.substring(0, 20)}...
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(r.reviewed_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sign-off Modal */}
      <Modal
        isOpen={Boolean(selectedSample)}
        onClose={() => setSelectedSample(null)}
        title="Electronic Sign-off & Quality Assurance Decision"
        subtitle={`Specimen: ${selectedSample?.accession_number} (${selectedSample?.sample_type})`}
      >
        <form onSubmit={handleSignOff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Review Decision *</label>
            <select
              className="form-control"
              value={signForm.decision}
              onChange={(e) => setSignForm({ ...signForm, decision: e.target.value })}
            >
              <option value="APPROVE">APPROVE — Finalize and Issue Diagnostic Report</option>
              <option value="REJECT">REJECT — Request Repeat Inoculation / Testing</option>
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
                value={signForm.signerName}
                onChange={(e) => setSignForm({ ...signForm, signerName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Signer Title *</label>
              <input
                type="text"
                required
                className="form-control"
                value={signForm.signerTitle}
                onChange={(e) => setSignForm({ ...signForm, signerTitle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">QA Reviewer Comments & Concordance Validation *</label>
            <textarea
              rows={3}
              required
              className="form-control"
              value={signForm.comments}
              onChange={(e) => setSignForm({ ...signForm, comments: e.target.value })}
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
            <button type="button" onClick={() => setSelectedSample(null)} className="btn btn-secondary">
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
