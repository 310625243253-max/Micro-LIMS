import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { History, Search, Eye, RefreshCw } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(search ? { search } : {});
      setLogs(data);
    } catch (err) {
      console.error('Failed fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Master Immutable Audit Trail"
        category="Security & Compliance"
        description="Append-only cryptographic event logging, operator identity, IP tracing, and forensic diffs (21 CFR Part 11)."
        badge="21 CFR Part 11 Compliant"
        badgeVariant="emerald"
        icon={<History size={24} />}
        actions={
          <>
            <div style={{ position: 'relative', minWidth: '260px' }}>
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
                placeholder="Search action, email, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={fetchLogs} className="btn btn-secondary btn-sm" title="Refresh Audit Logs">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Trigger</th>
              <th>Entity Type & ID</th>
              <th>Operator Identity</th>
              <th>IP Address</th>
              <th>Reason for Modification</th>
              <th style={{ textAlign: 'right' }}>Forensic Diff</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={5} />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No audit events found matching the search filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#0284c7',
                        background: '#f0f9ff',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{log.user_email || 'System'}</td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>{log.entity_type}</div>
                    <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                      {log.entity_id.substring(0, 14)}...
                    </div>
                  </td>
                  <td style={{ color: '#334155', maxWidth: '280px', fontSize: '0.8125rem' }}>
                    {log.reason || '-'}
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setSelectedLog(log)} className="btn btn-secondary btn-sm">
                      <Eye size={13} /> Inspect Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: State Diff Inspector */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event State Diff & Forensic Trace"
        subtitle={`Action: ${selectedLog?.action} • ${selectedLog ? new Date(selectedLog.created_at).toLocaleString() : ''}`}
        maxWidth="760px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.8125rem',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div><strong>Operator:</strong> {selectedLog.user_email || 'System'}</div>
              <div><strong>IP Origin:</strong> <span className="font-mono">{selectedLog.ip_address || '127.0.0.1'}</span></div>
              <div><strong>Entity Type:</strong> {selectedLog.entity_type}</div>
              <div><strong>Entity Identifier:</strong> <span className="font-mono" style={{ color: '#0284c7' }}>{selectedLog.entity_id}</span></div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Previous State (Before Mutation)
              </div>
              <pre
                className="font-mono"
                style={{
                  padding: '14px',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: '#be123c',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.previous_state, null, 2) || 'null (Initial record generation)'}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                New State (After Mutation)
              </div>
              <pre
                className="font-mono"
                style={{
                  padding: '14px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: '#047857',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.new_state, null, 2) || 'null'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
