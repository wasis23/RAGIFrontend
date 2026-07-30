'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja, JenisPegawai, StatusKepegawaian, StatusPegawai } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PegawaiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.pegawai.read') || hasPermission('simpeg.pegawai.manage');
  const canCreate = hasPermission('simpeg.pegawai.create') || hasPermission('simpeg.pegawai.manage');
  const canUpdate = hasPermission('simpeg.pegawai.update') || hasPermission('simpeg.pegawai.manage');
  const canDelete = hasPermission('simpeg.pegawai.delete') || hasPermission('simpeg.pegawai.manage');

  const [loading, setLoading] = useState(true);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [formData, setFormData] = useState({
    unit_kerja_id: '',
    nip: '',
    nik: '',
    nama_lengkap: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    jenis_pegawai: 'dosen' as JenisPegawai,
    status_kepegawaian: 'tetap_yayasan' as StatusKepegawaian,
    status: 'aktif' as StatusPegawai,
    telepon: '',
    alamat: '',
  });

  const loadPegawai = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const [resPegawai, resUnit] = await Promise.all([
        simpegService.getPegawaiList({
          search: search || undefined,
          unit_kerja_id: selectedUnit ? Number(selectedUnit) : undefined,
          jenis_pegawai: selectedJenis ? (selectedJenis as JenisPegawai) : undefined,
        }),
        simpegService.getUnitKerjaList(),
      ]);

      const items: Pegawai[] = Array.isArray(resPegawai.data)
        ? resPegawai.data
        : resPegawai.data?.items || (resPegawai as any).data?.data || [];

      setPegawaiList(items);
      setUnitList(resUnit.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Pegawai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPegawai();
  }, [canRead, selectedUnit, selectedJenis]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPegawai();
  };

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Pegawai.');
      return;
    }
    setEditingPegawai(null);
    setFormData({
      unit_kerja_id: '',
      nip: '',
      nik: '',
      nama_lengkap: '',
      jenis_kelamin: 'L',
      jenis_pegawai: 'dosen',
      status_kepegawaian: 'tetap_yayasan',
      status: 'aktif',
      telepon: '',
      alamat: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (peg: Pegawai) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit data Pegawai.');
      return;
    }
    setEditingPegawai(peg);
    setFormData({
      unit_kerja_id: peg.unit_kerja_id ? String(peg.unit_kerja_id) : '',
      nip: peg.nip || '',
      nik: peg.nik || '',
      nama_lengkap: peg.nama_lengkap,
      jenis_kelamin: peg.jenis_kelamin,
      jenis_pegawai: peg.jenis_pegawai,
      status_kepegawaian: peg.status_kepegawaian,
      status: peg.status,
      telepon: peg.telepon || '',
      alamat: peg.alamat || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPegawai && !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Pegawai.');
      return;
    }
    if (!editingPegawai && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Pegawai.');
      return;
    }

    try {
      const payload = {
        unit_kerja_id: formData.unit_kerja_id ? Number(formData.unit_kerja_id) : null,
        nip: formData.nip || null,
        nik: formData.nik || null,
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        jenis_pegawai: formData.jenis_pegawai,
        status_kepegawaian: formData.status_kepegawaian,
        status: formData.status,
        telepon: formData.telepon || null,
        alamat: formData.alamat || null,
      };

      if (editingPegawai) {
        await simpegService.updatePegawai(editingPegawai.id, payload);
        toast.success('Data Pegawai berhasil diperbarui!');
      } else {
        await simpegService.createPegawai(payload);
        toast.success('Data Pegawai berhasil ditambahkan!');
      }

      setShowModal(false);
      loadPegawai();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan data pegawai';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Pegawai.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus pegawai "${nama}"?`)) return;
    try {
      await simpegService.deletePegawai(id);
      toast.success('Pegawai berhasil dihapus!');
      loadPegawai();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pegawai');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Data Pegawai (Dosen & Tendik)"
          description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda tidak memiliki permission untuk melihat Data Pegawai SIMPEG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Data Pegawai (Dosen & Tendik)"
        description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
      />

      {/* Action & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 300, maxWidth: 600 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIP, NIK, atau Nama Pegawai..."
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Cari</button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input"
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            style={{ width: 'auto', fontSize: '0.875rem' }}
          >
            <option value="">-- Semua Jenis --</option>
            <option value="dosen">Dosen</option>
            <option value="tendik">Tenaga Kependidikan</option>
            <option value="honorer">Honorer</option>
          </select>

          <select
            className="input"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{ width: 'auto', fontSize: '0.875rem' }}
          >
            <option value="">-- Semua Unit --</option>
            {unitList.map((u) => (
              <option key={u.id} value={u.id}>[{u.kode}] {u.nama}</option>
            ))}
          </select>

          <button onClick={loadPegawai} className="btn btn-outline btn-sm" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {canCreate && (
            <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} /> Tambah Pegawai
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data pegawai...</div>
        ) : pegawaiList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>Tidak ada data pegawai ditemukan.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>NIP / Identitas</th>
                  <th>Nama Lengkap</th>
                  <th>Jenis & Status</th>
                  <th>Unit Kerja</th>
                  <th>Kontak</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pegawaiList.map((peg) => (
                  <tr key={peg.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                      {peg.nip || peg.nik || `ID-${peg.id}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{peg.nama_lengkap}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={`badge ${peg.jenis_pegawai === 'dosen' ? 'badge-purple' : 'badge-blue'}`} style={{ textTransform: 'uppercase', width: 'fit-content' }}>
                          {peg.jenis_pegawai}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{peg.status_kepegawaian.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td>{peg.unit_kerja?.nama || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{peg.telepon || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${peg.status === 'aktif' ? 'badge-green' : 'badge-gray'}`}>
                        {peg.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/simpeg/pegawai/${peg.id}`} className="btn btn-ghost btn-icon btn-sm" title="Lihat Profil">
                        <Eye size={16} color="#4f46e5" />
                      </Link>
                      {canUpdate && (
                        <button onClick={() => handleOpenEditModal(peg)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                          <Edit2 size={16} color="#4f46e5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(peg.id, peg.nama_lengkap)} className="btn btn-ghost btn-icon btn-sm" title="Hapus">
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {(canCreate || canUpdate) && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Simpan Data Pegawai</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nama Lengkap & Gelar"
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              placeholder="Contoh: Dr. Wasis Utama, M.Kom."
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="NIP (Nomor Induk Pegawai)"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="199001012022011001"
              />
              <Input
                label="NIK (KTP)"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="330101..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Jenis Pegawai</label>
                <select
                  className="input"
                  value={formData.jenis_pegawai}
                  onChange={(e) => setFormData({ ...formData, jenis_pegawai: e.target.value as JenisPegawai })}
                >
                  <option value="dosen">Dosen Pengajar</option>
                  <option value="tendik">Tenaga Kependidikan</option>
                  <option value="honorer">Honorer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status Kepegawaian</label>
                <select
                  className="input"
                  value={formData.status_kepegawaian}
                  onChange={(e) => setFormData({ ...formData, status_kepegawaian: e.target.value as StatusKepegawaian })}
                >
                  <option value="tetap_yayasan">Tetap Yayasan / Kampus</option>
                  <option value="pns">PNS DPK</option>
                  <option value="non_pns">Non-PNS</option>
                  <option value="kontrak">Kontrak</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Kerja Tempat Bertugas</label>
              <select
                className="input"
                value={formData.unit_kerja_id}
                onChange={(e) => setFormData({ ...formData, unit_kerja_id: e.target.value })}
              >
                <option value="">-- Tanpa Unit / Top Level --</option>
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>[{u.kode}] {u.nama}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Jenis Kelamin</label>
                <select
                  className="input"
                  value={formData.jenis_kelamin}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <Input
                label="Nomor Telepon / WA"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="081234567890"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
