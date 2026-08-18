'use client';

import { useEffect, useState } from 'react';
import { Clock, RefreshCw, MapPin, ShieldAlert, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { PresensiPegawai, StatusKehadiran } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PresensiPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.presensi.manage');
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
      if (!isAdmin) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormData(prev => ({ ...prev, pegawai_id: pegId }));
          const res = await simpegService.getPresensiList(pegId);
          setPresensiList(res.data || []);
        }
      } else {
        const res = await simpegService.getPresensiList();
        setPresensiList(res.data || []);
      }
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
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Monitoring & Log Presensi Pegawai"
          description="Rekap Kehadiran Harian, Jam Masuk/Pulang, Geo-Tagging GPS, dan Status Dinas"
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert size={48} className="text-[var(--danger)]" />}
            title="Akses Ditolak / Dibatasi"
            description="Peran Anda saat ini tidak memiliki permission untuk membaca data Absensi & Presensi."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Monitoring & Log Presensi Pegawai"
        description="Rekap Kehadiran Harian, Jam Masuk/Pulang, Geo-Tagging GPS, dan Status Dinas"
      />

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Log Presensi Harian ({presensiList.length})</h3>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadPresensi}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Record Presensi Manual
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center text-[var(--text-muted)] py-8">Memuat data presensi...</CardBody>
        </Card>
      ) : presensiList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock size={48} className="opacity-40" />}
            title="Belum ada log presensi tercatat."
          />
        </Card>
      ) : (
        <div className="table-container">
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
                  <td className="font-bold">{p.tanggal}</td>
                  <td className="font-bold">
                    {p.pegawai?.nama_lengkap || `Pegawai ID ${p.pegawai_id}`}
                  </td>
                  <td className="font-bold text-[var(--success)]">{p.jam_masuk || '-'}</td>
                  <td className="font-bold text-[var(--danger)]">{p.jam_keluar || '-'}</td>
                  <td>
                    <Badge
                      variant={
                        p.status_kehadiran === 'hadir'
                          ? 'green'
                          : p.status_kehadiran === 'izin' || p.status_kehadiran === 'dinas'
                          ? 'blue'
                          : 'red'
                      }
                      className="uppercase"
                    >
                      {p.status_kehadiran}
                    </Badge>
                  </td>
                  <td className="text-sm text-[var(--text-secondary)]">
                    {p.lat_long ? (
                      <div className="flex items-center gap-1 text-accent-600">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Tanggal Presensi"
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
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
            <Select
              label="Status Kehadiran"
              value={formData.status_kehadiran}
              onChange={(val) => setFormData({ ...formData, status_kehadiran: val as StatusKehadiran })}
              options={[
                { value: 'hadir', label: 'Hadir Tepat Waktu' },
                { value: 'dinas', label: 'Dinas Luar' },
                { value: 'izin', label: 'Izin Resmi' },
                { value: 'sakit', label: 'Sakit' },
                { value: 'alfa', label: 'Tanpa Keterangan / Alfa' },
              ]}
            />
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
