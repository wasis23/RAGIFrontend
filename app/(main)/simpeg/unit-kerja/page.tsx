'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { UnitKerja, TipeUnitKerja } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UnitKerjaPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.unit_kerja.read') || hasPermission('simpeg.unit_kerja.manage');
  const canCreate = hasPermission('simpeg.unit_kerja.create') || hasPermission('simpeg.unit_kerja.manage');
  const canUpdate = hasPermission('simpeg.unit_kerja.update') || hasPermission('simpeg.unit_kerja.manage');
  const canDelete = hasPermission('simpeg.unit_kerja.delete') || hasPermission('simpeg.unit_kerja.manage');

  const [loading, setLoading] = useState(true);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);
  const [formData, setFormData] = useState({
    induk_id: '',
    kode: '',
    nama: '',
    tipe: 'fakultas' as TipeUnitKerja,
    is_active: true,
  });

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res = await simpegService.getUnitKerjaList();
      setUnitList(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Unit Kerja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canRead]);

  const handleOpenCreate = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Unit Kerja.');
      return;
    }
    setEditingUnit(null);
    setFormData({ induk_id: '', kode: '', nama: '', tipe: 'fakultas', is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (unit: UnitKerja) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit Unit Kerja.');
      return;
    }
    setEditingUnit(unit);
    setFormData({
      induk_id: unit.induk_id ? String(unit.induk_id) : '',
      kode: unit.kode,
      nama: unit.nama,
      tipe: unit.tipe,
      is_active: unit.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit && !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Unit Kerja.');
      return;
    }
    if (!editingUnit && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Unit Kerja.');
      return;
    }

    try {
      const payload = {
        induk_id: formData.induk_id ? Number(formData.induk_id) : null,
        kode: formData.kode,
        nama: formData.nama,
        tipe: formData.tipe,
        is_active: formData.is_active,
      };

      if (editingUnit) {
        await simpegService.updateUnitKerja(editingUnit.id, payload);
        toast.success('Unit Kerja berhasil diperbarui!');
      } else {
        await simpegService.createUnitKerja(payload);
        toast.success('Unit Kerja berhasil ditambahkan!');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan data Unit Kerja';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Unit Kerja.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus unit kerja "${nama}"?`)) return;
    try {
      await simpegService.deleteUnitKerja(id);
      toast.success('Unit Kerja berhasil dihapus!');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menghapus Unit Kerja';
      toast.error(msg);
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader
          title="Manajemen Unit Kerja & SOTK Kampus"
          description="Kelola Struktur Organisasi (Rektorat, Fakultas, Prodi, Biro, & Lembaga)"
        />
        <div className="card p-12 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk membaca atau mengelola Unit Kerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Manajemen Unit Kerja & SOTK Kampus"
        description="Kelola Struktur Organisasi (Rektorat, Fakultas, Prodi, Biro, & Lembaga)"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Daftar Unit Kerja ({unitList.length})</h3>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={16} /> Tambah Unit Kerja
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="card p-5">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat unit kerja...</div>
        ) : unitList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data unit kerja.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Unit Kerja</th>
                  <th>Tipe Unit</th>
                  <th>Unit Induk</th>
                  <th>Status</th>
                  {(canUpdate || canDelete) && <th className="text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {unitList.map((unit) => (
                  <tr key={unit.id}>
                    <td className="font-mono font-bold text-primary-600">{unit.kode}</td>
                    <td className="font-bold">{unit.nama}</td>
                    <td>
                      <span className="badge badge-purple uppercase">
                        {unit.tipe}
                      </span>
                    </td>
                    <td>{unit.parent?.nama || '-'}</td>
                    <td>
                      <span className={`badge ${unit.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {unit.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="text-right">
                        {canUpdate && (
                          <button onClick={() => handleOpenEdit(unit)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                            <Edit2 size={16} color="var(--primary-600)" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(unit.id, unit.nama)} className="btn btn-ghost btn-icon btn-sm" title="Hapus">
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        )}
                      </td>
                    )}
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
          title={editingUnit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Simpan Data</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <Input
                label="Kode Unit"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="FTI, PRODI-IF"
                required
              />
              <Input
                label="Nama Unit Kerja"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Fakultas Teknologi Informasi"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipe Unit Kerja</label>
              <select
                className="input"
                value={formData.tipe}
                onChange={(e) => setFormData({ ...formData, tipe: e.target.value as TipeUnitKerja })}
              >
                <option value="rektorat">Rektorat / Universitas</option>
                <option value="fakultas">Fakultas</option>
                <option value="prodi">Program Studi</option>
                <option value="lp3m">LPPM / Lembaga Pengabdian</option>
                <option value="biro">Biro Operasional</option>
                <option value="unit">Unit Pelaksana Teknis (UPT)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Induk (Parent)</label>
              <select
                className="input"
                value={formData.induk_id}
                onChange={(e) => setFormData({ ...formData, induk_id: e.target.value })}
              >
                <option value="">-- Tanpa Induk / Top Level --</option>
                {unitList
                  .filter((u) => u.id !== editingUnit?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      [{u.kode}] {u.nama}
                    </option>
                  ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
