'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2, XCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { useForm } from 'react-hook-form';

interface JenisBiaya {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  nominal_standar: number;
  deskripsi?: string;
  is_active?: boolean;
  is_recurring?: boolean;
  module_codes?: string[];
}

interface FormValues {
  kode: string;
  nama: string;
  tipe: string;
  nominal_standar: number;
  deskripsi: string;
  is_active: boolean;
  is_recurring: boolean;
}

const TIPE_OPTIONS = [
  { value: 'ukt', label: 'UKT / SPP Semester' },
  { value: 'spp', label: 'SPP Perkuliahan' },
  { value: 'sks', label: 'Biaya Per-SKS' },
  { value: 'praktikum', label: 'Biaya Praktikum' },
  { value: 'wisuda', label: 'Biaya Wisuda' },
  { value: 'spmb_adm', label: 'Administrasi SPMB' },
  { value: 'lainnya', label: 'Lainnya / Umum' },
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export function JenisBiayaTab() {
  const [data, setData] = useState<JenisBiaya[]>([]);
  const [loading, setLoading] = useState(false);
  const [appModules, setAppModules] = useState<AppModule[]>([]);

  // Selected module codes for multi-selection form
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>(['sikeu']);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', tipe: '', module: '' });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisBiaya | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '', is_active: true, is_recurring: true },
  });
  const tipeValue = watch('tipe');
  const isActiveValue = watch('is_active');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getJenisBiayaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data komponen biaya');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const modules = await moduleService.getAllModules();
      setAppModules(Array.isArray(modules) ? modules : []);
    } catch {
      setAppModules([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchModules();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedModuleCodes(['sikeu']);
    reset({ kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '', is_active: true, is_recurring: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JenisBiaya) => {
    setEditingItem(item);
    setSelectedModuleCodes(item.module_codes && item.module_codes.length > 0 ? item.module_codes : ['sikeu']);
    reset({
      kode: item.kode,
      nama: item.nama,
      tipe: item.tipe,
      nominal_standar: item.nominal_standar,
      deskripsi: item.deskripsi || '',
      is_active: item.is_active !== false,
      is_recurring: item.is_recurring !== false,
    });
    setIsModalOpen(true);
  };

  const toggleModuleSelection = (code: string) => {
    setSelectedModuleCodes((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus komponen biaya "${nama}"?`)) return;
    try {
      await sikeuService.deleteJenisBiaya(id);
      toast.success('Komponen biaya berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus komponen biaya');
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        module_codes: selectedModuleCodes,
      };

      if (editingItem) {
        await sikeuService.updateJenisBiaya(editingItem.id, payload);
        toast.success('Komponen biaya & delegasi modul berhasil diperbarui');
      } else {
        await sikeuService.storeJenisBiaya(payload);
        toast.success('Komponen biaya baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan komponen biaya');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, tipe: filterTipe, module: filterModule });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterTipe('');
    setFilterModule('');
    setAppliedFilters({ search: '', tipe: '', module: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.kode?.toLowerCase().includes(q) && !item.deskripsi?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.tipe && item.tipe !== appliedFilters.tipe) return false;
      if (appliedFilters.module) {
        const codes = item.module_codes || ['sikeu'];
        if (!codes.includes(appliedFilters.module)) return false;
      }
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<JenisBiaya>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md uppercase tracking-wide">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA KOMPONEN BIAYA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'modules',
      label: 'MODUL TERDELEGASI',
      render: (row) => {
        const codes = row.module_codes && row.module_codes.length > 0 ? row.module_codes : ['sikeu'];
        return (
          <div className="flex flex-wrap gap-1">
            {codes.map((c) => (
              <Badge key={c} variant="blue" className="text-2xs font-extrabold uppercase px-2 py-0.5">
                {c}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'tipe',
      label: 'TIPE',
      render: (row) => {
        const label = TIPE_OPTIONS.find(t => t.value === row.tipe)?.label || row.tipe;
        return <span className="badge badge-purple text-xs font-semibold">{label}</span>;
      },
    },
    {
      key: 'nominal_standar',
      label: 'NOMINAL STANDAR',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_standar || 0)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) =>
        row.is_active !== false ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)} icon={<Edit size={14} />}
            className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50">
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id, row.nama)} icon={<Trash2 size={14} />}
            className="font-semibold text-rose-600 hover:bg-rose-50">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Komponen Biaya & Delegasi Modul"
        description="Kelola komponen biaya dan delegasi penggunaannya ke beberapa modul aplikasi terintegrasi."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Komponen Biaya
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data komponen biaya." />

      {/* Modal Create / Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Komponen Biaya & Delegasi' : 'Tambah Komponen Biaya Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode Biaya *" placeholder="Contoh: sikeu.ukt3"
              {...register('kode', { required: 'Kode wajib diisi' })}
              error={errors.kode?.message}
              hint="Kode komponen biaya (unik)" />
            <Input label="Nama Komponen Biaya *" placeholder="Contoh: UKT Golongan 3 (Reguler)"
              {...register('nama', { required: 'Nama wajib diisi' })}
              error={errors.nama?.message} />
          </div>

          {/* Multi-Module Delegation Selection Checkboxes */}
          <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary-600" />
              <span className="text-xs font-bold text-slate-900">Delegasi ke Modul Aplikasi (Bisa Lebih dari 1) *</span>
            </div>
            <p className="text-2xs text-slate-500">Pilih modul aplikasi yang berhak mengonsumsi dan menerbitkan komponen biaya ini.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {appModules.map((m) => {
                const isChecked = selectedModuleCodes.includes(m.code);
                return (
                  <div
                    key={m.code}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-primary-50/80 border-primary-300 text-primary-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      label={m.code.toUpperCase()}
                      checked={isChecked}
                      onChange={() => toggleModuleSelection(m.code)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Tipe Biaya *"
              options={TIPE_OPTIONS}
              value={tipeValue}
              onChange={(val) => setValue('tipe', val as string)} />
            <Input type="number" label="Nominal Standar (Rp) *" placeholder="3500000"
              {...register('nominal_standar', { required: 'Nominal wajib diisi', valueAsNumber: true, min: { value: 0, message: 'Nominal tidak boleh negatif' } })}
              error={errors.nominal_standar?.message}
              hint="Nominal default sebelum penyesuaian per-mahasiswa" />
          </div>

          <Input label="Deskripsi / Catatan" placeholder="Penjelasan singkat mengenai komponen biaya ini..."
            {...register('deskripsi')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Status *"
              options={[
                { value: 'true', label: 'Aktif' },
                { value: 'false', label: 'Non-Aktif' },
              ]}
              value={isActiveValue ? 'true' : 'false'}
              onChange={(val) => setValue('is_active', val === 'true')} />
            <Select label="Recurring (Berulang) *"
              options={[
                { value: 'true', label: 'Ya (Tagihan Berulang Per-Semester)' },
                { value: 'false', label: 'Tidak (Sekali Bayar)' },
              ]}
              value={watch('is_recurring') ? 'true' : 'false'}
              onChange={(val) => setValue('is_recurring', val === 'true')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Komponen Biaya" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Kode atau Nama Biaya" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select label="Tipe Biaya"
            value={filterTipe}
            onChange={(val) => setFilterTipe(val as string)}
            options={[{ value: '', label: 'Semua Tipe' }, ...TIPE_OPTIONS]} />
          <Select label="Filter Modul Terdelegasi"
            value={filterModule}
            onChange={(val) => setFilterModule(val as string)}
            options={[
              { value: '', label: 'Semua Modul' },
              ...appModules.map((m) => ({ value: m.code, label: `${m.code.toUpperCase()} (${m.name})` })),
            ]} />
        </div>
      </Drawer>
    </>
  );
}
