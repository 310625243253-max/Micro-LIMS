import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MediaLot } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ViewHeader3D } from '../components/3d/ViewHeader3D';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Plus, RefreshCw } from 'lucide-react';

export const MediaView: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [lots, setLots] = useState<MediaLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    lotNumber: '',
    mediaName: 'Blood Agar (5% Sheep Blood)',
    manufacturer: 'Becton Dickinson (BD)',
    storageConditions: 'Refrigerated 2-8°C',
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchLots = async () => {
    setLoading(true);
    try {
      const data = await api.getMediaLots();
      setLots(data);
    } catch (err: any) {
      console.error('Failed fetching media lots:', err);
      error(err.message || 'Failed loading media lots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMediaLot({
        ...formData,
        receivedDate: new Date().toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      });
      success(`Media lot '${formData.lotNumber}' registered with full traceability!`);
      setModalOpen(false);
      fetchLots();
    } catch (err: any) {
      error(err.message || 'Failed creating media lot');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Interactive View Header */}
      <ViewHeader3D
        title="Traceable Culture Media Lots & Inventory"
        category="Traceability & QA"
        description="Enforces full ISO 15189 batch lineage from agar preparation to clinical sign-off."
        badge="ISO 15189 Batch Tracking"
        badgeVariant="cyan"
        icon={<Layers size={24} />}
        actions={
          <>
            {hasRole('ADMIN', 'TECHNICIAN') && (
              <button onClick={() => setModalOpen(true)} className="btn btn-glow-cyan btn-sm">
                <Plus size={14} /> Register New Media Lot
              </button>
            )}
            <button onClick={fetchLots} className="btn btn-secondary btn-sm" title="Refresh Media Lots">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </>
        }
      />

      <div className="data-table-container glass-panel-3d">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lot Identifier</th>
              <th>Media Formulation</th>
              <th>Manufacturer</th>
              <th>Storage Requirement</th>
              <th>Status</th>
              <th>Expiry Date</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={4} />
            ) : lots.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No media lots registered.
                </td>
              </tr>
            ) : (
              lots.map((lot) => {
                const isExpired = new Date(lot.expiry_date) < new Date();
                return (
                  <tr key={lot.id}>
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
                        {lot.lot_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{lot.media_name}</td>
                    <td>{lot.manufacturer}</td>
                    <td>{lot.storage_conditions || 'Ambient 20-25°C'}</td>
                    <td>
                      <Badge variant={isExpired ? 'danger' : lot.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {isExpired ? 'EXPIRED' : lot.status}
                      </Badge>
                    </td>
                    <td style={{ color: isExpired ? '#e11d48' : '#475569', fontFamily: 'var(--font-mono)' }}>
                      {new Date(lot.expiry_date).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(lot.received_date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Culture Media Lot"
        subtitle="Enforces full ISO 15189 traceability from media batch to clinical diagnostic report"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Lot Number *</label>
            <input
              type="text"
              required
              className="form-control font-mono"
              placeholder="LOT-BA-2026-004"
              value={formData.lotNumber}
              onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Media Formulation Name *</label>
            <input
              type="text"
              required
              className="form-control"
              value={formData.mediaName}
              onChange={(e) => setFormData({ ...formData, mediaName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Manufacturer *</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Expiration Date *</label>
              <input
                type="date"
                required
                className="form-control font-mono"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Storage Conditions</label>
            <input
              type="text"
              className="form-control"
              value={formData.storageConditions}
              onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Media Lot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
