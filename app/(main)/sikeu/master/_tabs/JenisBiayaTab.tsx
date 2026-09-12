'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2, XCircle, Layers, ArrowRight, DollarSign, Calculator, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
  skema_tarif: 'dinamis' | 'flat';
  nominal_standar: number;
  deskripsi: string;
  is_active: boolean;
  is_recurring: boolean;
}

const TIPE_OPTIONS = [
  { value: 'ukt', label: '[P] UKT / SPP Tetap Semester (Pendidikan - Dinamis)' },
  { value: 'spp', label: '[P] SPP Perkuliahan Reguler (Dinamis)' },
  { value: 'sks', label: '[P] Biaya SKS Tambahan / Remedial (Dinamis)' },
  { value: 'spmb_adm', label: '[D] Biaya Pendaftaran SPMB (Flat Institusi)' },
  { value: 'daftar_ulang', label: '[D] Biaya Registrasi & Daftar Ulang Mhs Baru (Flat)' },
  { value: 'praktikum', label: '[L] Biaya Praktikum / Laboratorium (Dinamis per Prodi)' },
  { value: 'wisuda', label: '[L] Biaya Kelulusan & Wisuda (Flat)' },
  { value: 'kemahasiswaan', label: '[L] Iuran Kegiatan Mahasiswa / BEM (Flat)' },
  { value: 'sertifikasi', label: '[L] Uji Kompetensi & Sertifikasi Profesi (Flat)' },
  { value: 'cuti', label: '[L] Biaya Administrasi Cuti Kuliah (Flat)' },
  { value: 'lainnya', label: '[L] Biaya Insidental / Lain-Lain' },
];

const DYNAMIC_FEE_TYPES = ['ukt', 'spp', 'sks', 'praktikum'];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

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
    defaultValues: {
      kode: '',
      nama: '',
      tipe: 'ukt',
      skema_tarif: 'dinamis',
      nominal_standar: 0,
      deskripsi: '',
      is_active: true,
      is_recurring: true
    },
  });

  const tipeValue = watch('tipe');
  const skemaTarifValue = watch('skema_tarif');
  const isActiveValue = watch('is_active');

  // Auto-switch skema_tarif when tipe changes
  useEffect(() => {
    if (DYNAMIC_FEE_TYPES.includes(tipeValue)) {
      setValue('skema_tarif', 'dinamis');
    } else if (tipeValue === 'spmb_adm' || tipeValue === 'wisuda' || tipeValue === 'cuti') {
      setValue('skema_tarif', 'flat');
    }
  }, [tipeValue, setValue]);

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
    reset({
      kode: '',
      nama: '',
      tipe: 'ukt',
      skema_tarif: 'dinamis',
      nominal_standar: 0,
      deskripsi: '',
      is_active: true,
      is_recurring: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JenisBiaya) => {
    setEditingItem(item);
    setSelectedModuleCodes(item.module_codes && item.module_codes.length > 0 ? item.module_codes : ['sikeu']);
    const isDynamic = DYNAMIC_FEE_TYPES.includes(item.tipe) || !item.nominal_standar || item.nominal_standar === 0;
    reset({
      kode: item.kode,
      nama: item.nama,
      tipe: item.tipe,
      skema_tarif: isDynamic ? 'dinamis' : 'flat',
      nominal_standar: item.nominal_standar || 0,
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
        kode: formData.kode,
        nama: formData.nama,
        tipe: formData.tipe,
        nominal_standar: formData.skema_tarif === 'dinamis' ? 0 : Number(formData.nominal_standar || 0),
        deskripsi: formData.deskripsi,
        is_active: Boolean(formData.is_active),
        is_recurring: Boolean(formData.is_recurring),
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
      label: 'SKEMA & NOMINAL TARIF',
      render: (row) => {
        const isDynamic = DYNAMIC_FEE_TYPES.includes(row.tipe) || !row.nominal_standar || row.nominal_standar === 0;

        if (isDynamic) {
          return (
            <div className="space-y-1">
              <Link
                href="/sikeu/mahasiswa/tarif"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200/80 text-xs font-bold transition-colors group"
              >
                <Calculator size={13} className="text-primary-600" />
                <span>Matriks Angkatan & Prodi</span>
                <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="text-[10px] text-slate-400 block font-normal">Tarif fleksibel per angkatan & prodi</span>
            </div>
          );
        }

        return (
          <div>
            <span className="font-bold text-slate-900 tabular-nums text-sm">
              {formatRupiah(row.nominal_standar || 0)}
            </span>
            <span className="text-[10px] text-emerald-600 block font-semibold">Flat Institusi</span>
          </div>
        );
      },
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
        title="Katalog Komponen Biaya & Delegasi Modul"
        description="Master kamus jenis biaya kampus. Biaya bertipe Dinamis disetel nominalnya per Angkatan, Prodi, & Semester di menu Pengaturan Tarif Mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/sikeu/mahasiswa/tarif"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/80 hover:bg-primary-100 transition-all shadow-2xs"
            >
              <Calculator size={14} />
              Ke Matriks Tarif Mahasiswa <ArrowRight size={13} />
            </Link>
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Komponen Biaya
            </Button>
          </div>
        }
      />

      {/* Info Box Mengenai Standarisasi Dua Nominal */}
      <div className="p-4 bg-linear-to-r from-blue-50/80 via-primary-50/40 to-white border border-primary-200/70 rounded-2xl flex items-start gap-3 my-4">
        <div className="p-2 bg-primary-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
          <Info size={16} />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">
            Pemisahan Antara Kamus Komponen Biaya dan Matriks Tarif Riil:
          </p>
          <p className="text-slate-600 leading-relaxed">
            Kamus ini berfungsi mendefinisikan <strong>identitas pungutan dan delegasi modul</strong> lintas sistem (SIAKAD, SPMB, SIKEU). Untuk biaya pendidikan yang nominalnya berbeda per Program Studi & Angkatan (UKT/SPP/Praktikum), besaran riilnya disetting pada menu <strong>Pengaturan Tarif Mahasiswa</strong>.
          </p>
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data komponen biaya." />

      {/* Modal Create / Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Komponen Biaya & Delegasi' : 'Tambah Komponen Biaya Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode Biaya *" placeholder="Contoh: UKT_REG"
              {...register('kode', { required: 'Kode wajib diisi' })}
              error={errors.kode?.message}
              hint="Kode unik komponen biaya (misal: UKT_REG, SPMB_ADM, WISUDA_FEE)" />
            <Input label="Nama Komponen Biaya *" placeholder="Contoh: Uang Kuliah Tunggal (UKT) Reguler"
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
            <Select label="Tipe / Kategori Biaya *"
              options={TIPE_OPTIONS}
              value={tipeValue}
              onChange={(val) => setValue('tipe', val as string)} />

            <Select label="Skema Penetapan Tarif *"
              options={[
                { value: 'dinamis', label: 'Tarif Matriks Dinamis (per Angkatan & Prodi)' },
                { value: 'flat', label: 'Tarif Flat Institusi (Nominal Tetap Sama)' },
              ]}
              value={skemaTarifValue}
              onChange={(val) => setValue('skema_tarif', val as 'dinamis' | 'flat')} />
          </div>

          {/* Skema Penjelasan */}
          {skemaTarifValue === 'dinamis' ? (
            <div className="p-3.5 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-primary-800">
                <Calculator size={15} />
                <span>Skema Tarif Dinamis Aktif</span>
              </div>
              <p className="text-2xs text-primary-800 leading-relaxed">
                Nominal tagihan riil komponen ini akan diatur secara fleksibel per kombinasi <strong>Tahun Angkatan</strong>, <strong>Program Studi</strong>, <strong>Semester</strong>, dan <strong>Jalur Kelas</strong> di menu <Link href="/sikeu/mahasiswa/tarif" className="underline font-bold">Pengaturan Tarif Mahasiswa</Link>. Field nominal di bawah diset 0.
              </p>
            </div>
          ) : (
            <Input type="number" label="Nominal Standar Flat (Rp) *" placeholder="350000"
              {...register('nominal_standar', { valueAsNumber: true, min: { value: 0, message: 'Nominal tidak boleh negatif' } })}
              error={errors.nominal_standar?.message}
              hint="Nominal seragam yang berlaku untuk seluruh mahasiswa/pendaftar" />
          )}

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
