'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, RefreshCw, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { PengajuanCuti, JenisCuti, StatusApprovalCuti } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CutiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.cuti.read') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.approve');
  const canCreate = hasPermission('simpeg.cuti.create') || hasPermission('simpeg.cuti.request');
  const canUpdate = hasPermission('simpeg.cuti.update') || hasPermission('simpeg.cuti.approve');

  const [loading, setLoading] = useState(true);
  const [cutiList, setCutiList] = useState<PengajuanCuti[]>([]);

  // Modal Request Cuti State
  const [showModalRequest, setShowModalRequest] = useState(false);
  const [formRequest, setFormRequest] = useState({
    pegawai_id: 1,
    jenis_cuti: 'tahunan' as JenisCuti,
    tanggal_mulai: '',
    tanggal_selesai: '',
    jumlah_hari: 1,
    alasan: '',
  });

  // Modal Process/Approval State
  const [showModalApproval, setShowModalApproval] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState<PengajuanCuti | null>(null);
  const [catatanApproval, setCatatanApproval] = useState('');

  const loadCuti = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res = await simpegService.getCutiList();
      setCutiList(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Pengajuan Cuti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuti();
  }, [canRead]);

  const handleOpenRequest = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk mengajukan Cuti.');
      return;
    }
    setFormRequest({
      pegawai_id: 1,
      jenis_cuti: 'tahunan',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_hari: 1,
      alasan: '',
    });
    setShowModalRequest(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Cuti.');
      return;
    }
    try {
      await simpegService.createCuti(formRequest);
      toast.success('Pengajuan Cuti berhasil dikirim!');
      setShowModalRequest(false);
      loadCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan Cuti');
    }
  };

  const handleOpenApprovalModal = (cuti: PengajuanCuti) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk memproses persetujuan Cuti.');
      return;
    }
    setSelectedCuti(cuti);
    setCatatanApproval('');
    setShowModalApproval(true);
  };

  const handleProcessApproval = async (status: StatusApprovalCuti) => {
    if (!selectedCuti || !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission memproses persetujuan Cuti.');
      return;
    }

    try {
      await simpegService.updateStatusCuti(selectedCuti.id, status, catatanApproval);
      toast.success(`Pengajuan Cuti berhasil di-${status.toUpperCase()}! Notifikasi WA & Email terkirim.`);
      setShowModalApproval(false);
      loadCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses permohonan Cuti');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Layanan & Pengajuan Cuti Pegawai"
          description="Permohonan Cuti Tahunan, Sakit, Alasan Penting, Melahirkan, dan Approval SDM"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda saat ini tidak memiliki permission untuk melihat layanan Cuti Pegawai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Layanan & Pengajuan Cuti Pegawai"
        description="Permohonan Cuti Tahunan, Sakit, Alasan Penting, Melahirkan, dan Approval SDM"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Daftar Pengajuan Cuti ({cutiList.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadCuti} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={handleOpenRequest} className="btn btn-primary btn-sm">
              <Plus size={16} /> Ajukan Cuti Baru
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat permohonan cuti...</div>
        ) : cutiList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>Belum ada riwayat pengajuan cuti.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Pemilik / Pegawai</th>
                  <th>Jenis Cuti</th>
                  <th>Tanggal Mulai - Selesai</th>
                  <th>Lama Cuti</th>
                  <th>Alasan</th>
                  <th>Status Approval</th>
                  {canUpdate && <th style={{ textAlign: 'right' }}>Aksi SDM</th>}
                </tr>
              </thead>
              <tbody>
                {cutiList.map((cuti) => (
                  <tr key={cuti.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cuti.pegawai?.nama_lengkap || `Pegawai ID ${cuti.pegawai_id}`}
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                        {(cuti.jenis_cuti || 'tahunan').replace('_', ' ')}
                      </span>
                    </td>
                    <td>{cuti.tanggal_mulai} s/d {cuti.tanggal_selesai}</td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>{cuti.jumlah_hari} Hari</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cuti.alasan}</td>
                    <td>
                      <span
                        className={`badge ${
                          cuti.status_approval === 'approved'
                            ? 'badge-green'
                            : cuti.status_approval === 'rejected'
                            ? 'badge-red'
                            : 'badge-yellow'
                        }`}
                        style={{ textTransform: 'uppercase' }}
                      >
                        {cuti.status_approval}
                      </span>
                    </td>
                    {canUpdate && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenApprovalModal(cuti)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Proses SDM
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Request Cuti */}
      {canCreate && (
        <Modal
          open={showModalRequest}
          onClose={() => setShowModalRequest(false)}
          title="Formulir Pengajuan Cuti Online"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalRequest(false)}>Batal</Button>
              <Button variant="primary" onClick={handleRequestSubmit}>Kirim Pengajuan</Button>
            </>
          }
        >
          <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jenis Cuti</label>
              <select
                className="input"
                value={formRequest.jenis_cuti}
                onChange={(e) => setFormRequest({ ...formRequest, jenis_cuti: e.target.value as JenisCuti })}
              >
                <option value="tahunan">Cuti Tahunan</option>
                <option value="sakit">Cuti Sakit</option>
                <option value="alasan_penting">Cuti Alasan Penting</option>
                <option value="melahirkan">Cuti Melahirkan</option>
                <option value="besar">Cuti Besar</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Tanggal Mulai"
                type="date"
                value={formRequest.tanggal_mulai}
                onChange={(e) => setFormRequest({ ...formRequest, tanggal_mulai: e.target.value })}
                required
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={formRequest.tanggal_selesai}
                onChange={(e) => setFormRequest({ ...formRequest, tanggal_selesai: e.target.value })}
                required
              />
            </div>
            <Input
              label="Jumlah Hari Cuti"
              type="number"
              value={formRequest.jumlah_hari}
              onChange={(e) => setFormRequest({ ...formRequest, jumlah_hari: Number(e.target.value) })}
              required
            />
            <div className="form-group">
              <label className="form-label">Alasan Pengajuan Cuti</label>
              <textarea
                className="input"
                rows={3}
                value={formRequest.alasan}
                onChange={(e) => setFormRequest({ ...formRequest, alasan: e.target.value })}
                placeholder="Berikan alasan detail pengajuan cuti..."
                required
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Process Approval SDM */}
      {canUpdate && (
        <Modal
          open={showModalApproval}
          onClose={() => setShowModalApproval(false)}
          title="Proses Persetujuan Cuti SDM"
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="danger" onClick={() => handleProcessApproval('rejected')}>
                <XCircle size={16} /> Tolak Cuti
              </Button>
              <Button variant="primary" onClick={() => handleProcessApproval('approved')}>
                <CheckCircle size={16} /> Setujui Cuti
              </Button>
            </div>
          }
        >
          {selectedCuti && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div><strong>Pegawai:</strong> {selectedCuti.pegawai?.nama_lengkap || selectedCuti.pegawai_id}</div>
                <div><strong>Jenis:</strong> {(selectedCuti.jenis_cuti || 'TAHUNAN').toUpperCase()} ({selectedCuti.jumlah_hari} Hari)</div>
                <div><strong>Periode:</strong> {selectedCuti.tanggal_mulai} s/d {selectedCuti.tanggal_selesai}</div>
                <div><strong>Alasan:</strong> {selectedCuti.alasan}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Approval SDM (Dikirim via WA/Email)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={catatanApproval}
                  onChange={(e) => setCatatanApproval(e.target.value)}
                  placeholder="Contoh: Disetujui. Harap selesaikan serah terima tugas sebelum menjalani cuti."
                />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
