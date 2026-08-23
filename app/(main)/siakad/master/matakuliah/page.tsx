'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function MataKuliahPage() {
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterKurikulum, setFilterKurikulum] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi_id: '',
    kurikulum: '',
    tipe: '',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMk, setEditingMk] = useState<any | null>(null);
  const [deletingMk, setDeletingMk] = useState<any | null>(null);
  const [selectedProdiModal, setSelectedProdiModal] = useState<number | string>('');
  const [form, setForm] = useState({
    kurikulum_id: 1,
    kode_mk: '',
    nama: '',
    sks_teori: 2,
    sks_praktik: 1,
    semester_anjuran: 1,
    tipe: 'wajib',
  });
  const [saving, setSaving] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [kRes, pRes] = await Promise.all([
        siakadService.getKurikulums(),
        siakadService.getProdi(),
      ]);
      if (kRes.data) setKurikulums(kRes.data);
      if (pRes.data) setProdis(pRes.data);
    } catch (err) {}
  };

  const fetchMataKuliah = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getMataKuliahs({
        search: appliedFilters.search,
        program_studi_id: appliedFilters.prodi_id || undefined,
        kurikulum_id: appliedFilters.kurikulum || undefined,
        tipe: appliedFilters.tipe || undefined,
        per_page: 100,
      });
      if (res.data) setMatakuliahs(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMataKuliah();
  }, [appliedFilters]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingMk(item);
      const currentKur = kurikulums.find((k) => k.id === item.kurikulum_id);
      setSelectedProdiModal(currentKur?.program_studi_id || '');
      setForm({
        kurikulum_id: item.kurikulum_id,
        kode_mk: item.kode_mk,
        nama: item.nama,
        sks_teori: item.sks_teori,
        sks_praktik: item.sks_praktik,
        semester_anjuran: item.semester_anjuran,
        tipe: item.tipe,
      });
    } else {
      setEditingMk(null);
      const defaultProdiId = prodis[0]?.id || '';
      setSelectedProdiModal(defaultProdiId);
      const matchingKur = kurikulums.find((k) => k.program_studi_id === defaultProdiId);
      setForm({
        kurikulum_id: matchingKur?.id || kurikulums[0]?.id || 1,
        kode_mk: '',
        nama: '',
        sks_teori: 2,
        sks_praktik: 1,
        semester_anjuran: 1,
        tipe: 'wajib',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      if (editingMk) {
        await siakadService.updateMataKuliah(editingMk.id, form);
        toast.success('Mata kuliah berhasil diperbarui');
      } else {
        await siakadService.createMataKuliah(form);
        toast.success('Mata kuliah berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchMataKuliah();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan mata kuliah');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMk) return;
    try {
      await siakadService.deleteMataKuliah(deletingMk.id);
      toast.success('Mata kuliah berhasil dihapus');
      setDeletingMk(null);
      fetchMataKuliah();
    } catch (err: any) {
      toast.error('Gagal menghapus mata kuliah');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_mk',
      label: 'KODE MK',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode_mk}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama}</span>
          <span className="text-2xs text-slate-400 font-mono">
            {row.sks_teori} SKS Teori + {row.sks_praktik} SKS Praktik
          </span>
        </div>
      ),
    },
    {
      key: 'total_sks',
      label: 'TOTAL SKS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-black text-slate-900">
          {row.total_sks} SKS
        </span>
      ),
    },
    {
      key: 'semester_anjuran',
      label: 'SEMESTER',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          Sem. {row.semester_anjuran}
        </span>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI & KURIKULUM',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">
            {row.kurikulum?.program_studi?.nama || row.kurikulum?.program_studi?.nama_singkat || 'Umum Kampus'}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.kurikulum?.nama || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'TIPE',
      align: 'center',
      render: (row) => (
        <Badge variant={row.tipe === 'wajib' ? 'blue' : 'purple'} className="capitalize">
          {row.tipe}
        </Badge>
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
                label: 'Edit Mata Kuliah',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              {
                label: 'Hapus Mata Kuliah',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingMk(row),
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
        title="Master Mata Kuliah"
        description="Daftar mata kuliah, bobot SKS teori & praktik, semester anjuran, dan tipe kurikulum."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              Tambah Mata Kuliah
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

      <DataTable
        columns={columns}
        data={matakuliahs}
        isLoading={loading}
        emptyMessage="Belum ada data mata kuliah yang tersimpan."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mata Kuliah"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdi('');
                setFilterKurikulum('');
                setFilterTipe('');
                setAppliedFilters({ search: '', prodi_id: '', kurikulum: '', tipe: '' });
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
                  prodi_id: filterProdi,
                  kurikulum: filterKurikulum,
                  tipe: filterTipe,
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
            label="Kode atau Nama Mata Kuliah"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Program Studi</label>
            <select
              value={filterProdi}
              onChange={(e) => {
                setFilterProdi(e.target.value);
                setFilterKurikulum('');
              }}
              className="select w-full"
            >
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id.toString()}>{p.nama} ({p.jenjang || 'S1'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Kurikulum</label>
            <select
              value={filterKurikulum}
              onChange={(e) => setFilterKurikulum(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Kurikulum</option>
              {kurikulums
                .filter((k) => !filterProdi || String(k.program_studi_id) === String(filterProdi))
                .map((k) => (
                  <option key={k.id} value={k.id.toString()}>{k.nama} ({k.program_studi?.nama || 'Prodi'})</option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">Tipe Mata Kuliah</label>
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Tipe</option>
              <option value="wajib">Wajib Program Studi</option>
              <option value="pilihan">Pilihan Bebas</option>
            </select>
          </div>
        </div>
      </Drawer>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMk ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Kode Mata Kuliah"
            required
            disabled={Boolean(editingMk)}
            placeholder="IF2101"
            value={form.kode_mk}
            onChange={(e) => setForm({ ...form, kode_mk: e.target.value })}
          />

          <Input
            label="Nama Mata Kuliah"
            required
            placeholder="Pemrograman Web Lanjut"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />

          <div>
            <label className="label">Kurikulum Acuan *</label>
            <select
              disabled={Boolean(editingMk)}
              value={form.kurikulum_id}
              onChange={(e) => setForm({ ...form, kurikulum_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {kurikulums.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tipe Mata Kuliah *</label>
            <select
              value={form.tipe}
              onChange={(e) => setForm({ ...form, tipe: e.target.value })}
              className="select w-full"
            >
              <option value="wajib">Wajib Program Studi</option>
              <option value="pilihan">Pilihan</option>
            </select>
          </div>

          <Input
            label="SKS Teori"
            type="number"
            required
            min="0"
            value={form.sks_teori}
            onChange={(e) => setForm({ ...form, sks_teori: parseInt(e.target.value) || 0 })}
          />

          <Input
            label="SKS Praktik"
            type="number"
            required
            min="0"
            value={form.sks_praktik}
            onChange={(e) => setForm({ ...form, sks_praktik: parseInt(e.target.value) || 0 })}
          />

          <div className="md:col-span-2">
            <Input
              label="Semester Anjuran (1 - 8)"
              type="number"
              required
              min="1"
              max="8"
              value={form.semester_anjuran}
              onChange={(e) => setForm({ ...form, semester_anjuran: parseInt(e.target.value) || 1 })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deletingMk)}
        onClose={() => setDeletingMk(null)}
        title="Hapus Mata Kuliah?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingMk(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus mata kuliah <strong>{deletingMk?.nama}</strong> ({deletingMk?.kode_mk})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
