'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Filter, Edit2, Trash2, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function KurikulumPage() {
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdiId, setFilterProdiId] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodiId: '',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKurikulum, setEditingKurikulum] = useState<any | null>(null);
  const [deletingKurikulum, setDeletingKurikulum] = useState<any | null>(null);
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    program_studi_id: 1,
    tahun_berlaku: 2024,
    total_sks_lulus: 144,
    deskripsi: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdis(res.data);
    } catch (err) {}
  };

  const fetchKurikulum = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.prodiId) params.program_studi_id = appliedFilters.prodiId;

      const res = await siakadService.getKurikulums(params);
      if (res.data) setKurikulums(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat kurikulum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
  }, []);

  useEffect(() => {
    fetchKurikulum();
  }, [appliedFilters]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingKurikulum(item);
      setForm({
        kode: item.kode,
        nama: item.nama,
        program_studi_id: item.program_studi_id,
        tahun_berlaku: item.tahun_berlaku,
        total_sks_lulus: item.total_sks_lulus,
        deskripsi: item.deskripsi || '',
      });
    } else {
      setEditingKurikulum(null);
      setForm({
        kode: '',
        nama: '',
        program_studi_id: prodis[0]?.id || 1,
        tahun_berlaku: 2024,
        total_sks_lulus: 144,
        deskripsi: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingKurikulum) {
        await siakadService.updateKurikulum(editingKurikulum.id, form);
        toast.success('Kurikulum berhasil diperbarui');
      } else {
        await siakadService.createKurikulum(form);
        toast.success('Kurikulum baru berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchKurikulum();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan kurikulum');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingKurikulum) return;
    try {
      await siakadService.deleteKurikulum(deletingKurikulum.id);
      toast.success('Kurikulum berhasil dihapus');
      setDeletingKurikulum(null);
      fetchKurikulum();
    } catch (err: any) {
      toast.error('Gagal menghapus kurikulum');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA KURIKULUM',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama}</span>
          {row.deskripsi && (
            <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">{row.deskripsi}</p>
          )}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.program_studi?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'tahun_berlaku',
      label: 'TAHUN BERLAKU',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.tahun_berlaku}
        </span>
      ),
    },
    {
      key: 'total_sks_lulus',
      label: 'TOTAL SKS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-black text-slate-900">
          {row.total_sks_lulus} SKS
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: () => (
        <Badge variant="green">Aktif</Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Kurikulum',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              {
                label: 'Hapus Kurikulum',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingKurikulum(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Kurikulum Akademik"
        description="Struktur kurikulum OBE, penetapan total SKS kelulusan, dan masa berlaku kurikulum."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              Tambah Kurikulum
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Full-bleed DataTable Card */}
      <DataTable
        columns={columns}
        data={kurikulums}
        isLoading={loading}
        emptyMessage="Belum ada data kurikulum akademik yang tersimpan."
      />

      {/* Filter Drawer (Slide out from Right side) */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Kurikulum"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdiId('');
                setAppliedFilters({ search: '', prodiId: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  prodiId: filterProdiId,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Kode atau Nama Kurikulum"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Program Studi</label>
            <select
              value={filterProdiId}
              onChange={(e) => setFilterProdiId(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id.toString()}>
                  {p.nama} ({p.jenjang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Form Kurikulum */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingKurikulum ? 'Edit Kurikulum' : 'Tambah Kurikulum Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kurikulum'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Kode Kurikulum"
            required
            disabled={Boolean(editingKurikulum)}
            placeholder="KUR-2024-IF"
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value })}
          />

          <Input
            label="Nama Kurikulum"
            required
            placeholder="Kurikulum OBE Informatika 2024"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />

          <div>
            <label className="label">Program Studi *</label>
            <select
              disabled={Boolean(editingKurikulum)}
              value={form.program_studi_id}
              onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <Input
            label="Tahun Berlaku"
            type="number"
            required
            value={form.tahun_berlaku}
            onChange={(e) => setForm({ ...form, tahun_berlaku: parseInt(e.target.value) || 2024 })}
          />

          <Input
            label="Total SKS Kelulusan"
            type="number"
            required
            min="100"
            value={form.total_sks_lulus}
            onChange={(e) => setForm({ ...form, total_sks_lulus: parseInt(e.target.value) || 144 })}
          />

          <div className="md:col-span-2">
            <label className="label">Deskripsi</label>
            <textarea
              rows={2}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Keterangan kurikulum..."
              className="input w-full"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deletingKurikulum)}
        onClose={() => setDeletingKurikulum(null)}
        title="Hapus Kurikulum?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingKurikulum(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus kurikulum <strong>{deletingKurikulum?.nama}</strong> ({deletingKurikulum?.kode})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

