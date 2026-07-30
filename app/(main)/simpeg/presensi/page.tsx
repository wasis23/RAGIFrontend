'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, MapPin, ShieldAlert, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { PresensiPegawai, StatusKehadiran } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PresensiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.presensi.read') || hasPermission('simpeg.presensi.manage');
  const canCreate = hasPermission('simpeg.presensi.create') || hasPermission('simpeg.presensi.manage');

  const [loading, setLoading] = useState(true);
  const [presensiList, setPresensiList] = useState<PresensiPegawai[]>([]);

  // Modal Input Log Presensi
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pegawai_id: 1,
    tanggal: new Date().toISOString().split('T')[0],
    jam_masuk: '07:45:00',
    jam_keluar: '16:00:00',
    status_kehadiran: 'hadir' as StatusKehadiran,
    lat_long: '-6.2088,106.8456',
    catatan: 'Hadir tepat waktu di gedung rektorat',
  });

  const loadPresensi = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res = await simpegService.getPresensiList();
      setPresensiList(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat log presensi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresensi();
  }, [canRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mencatat presensi.');
      return;
    }
    try {
      await simpegService.createPresensi(formData);
      toast.success('Log presensi berhasil dicatat!');
      setShowModal(false);
      loadPresensi();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mencatat presensi');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Monitoring & Log Presensi Pegawai"
          description="Rekap Kehadiran Harian, Jam Masuk/Pulang, Geo-Tagging GPS, dan Status Dinas"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda saat ini tidak memiliki permission untuk membaca data Absensi & Presensi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Monitoring & Log Presensi Pegawai"
        description="Rekap Kehadiran Harian, Jam Masuk/Pulang, Geo-Tagging GPS, dan Status Dinas"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Log Presensi Harian ({presensiList.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadPresensi} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Record Presensi Manual
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data presensi...</div>
        ) : presensiList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>Belum ada log presensi tercatat.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Pegawai</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Status Kehadiran</th>
                  <th>Lokasi GPS / Catatan</th>
                </tr>
              </thead>
              <tbody>
                {presensiList.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.tanggal}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.pegawai?.nama_lengkap || `Pegawai ID ${p.pegawai_id}`}
                    </td>
                    <td style={{ color: '#059669', fontWeight: 700 }}>{p.jam_masuk || '-'}</td>
                    <td style={{ color: '#dc2626', fontWeight: 700 }}>{p.jam_keluar || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status_kehadiran === 'hadir'
                            ? 'badge-green'
                            : p.status_kehadiran === 'izin' || p.status_kehadiran === 'dinas'
                            ? 'badge-blue'
                            : 'badge-red'
                        }`}
                        style={{ textTransform: 'uppercase' }}
                      >
                        {p.status_kehadiran}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {p.lat_long ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5' }}>
                          <MapPin size={14} /> {p.lat_long}
                        </div>
                      ) : (
                        p.catatan || '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Log Presensi */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Input Log Presensi Pegawai"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Simpan Log Presensi</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Tanggal Presensi"
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Jam Masuk"
                type="time"
                value={formData.jam_masuk}
                onChange={(e) => setFormData({ ...formData, jam_masuk: e.target.value })}
              />
              <Input
                label="Jam Keluar"
                type="time"
                value={formData.jam_keluar}
                onChange={(e) => setFormData({ ...formData, jam_keluar: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status Kehadiran</label>
              <select
                className="input"
                value={formData.status_kehadiran}
                onChange={(e) => setFormData({ ...formData, status_kehadiran: e.target.value as StatusKehadiran })}
              >
                <option value="hadir">Hadir Tepat Waktu</option>
                <option value="dinas">Dinas Luar</option>
                <option value="izin">Izin Resmi</option>
                <option value="sakit">Sakit</option>
                <option value="alfa">Tanpa Keterangan / Alfa</option>
              </select>
            </div>
            <Input
              label="Catatan / Keterangan"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Catatan kehadiran..."
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
