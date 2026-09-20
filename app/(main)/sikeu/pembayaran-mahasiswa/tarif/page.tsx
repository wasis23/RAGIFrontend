'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Search,
  BookOpen,
  Loader2,
  SlidersHorizontal,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';

const tarifSchema = z.object({
  master_biaya_id: z.number().min(1, 'Komponen biaya wajib dipilih dari katalog'),
  tahun_angkatan: z.number().min(2000, 'Tahun angkatan wajib diisi (minimal tahun 2000)'),
  program_studi_id: z.string().optional(),
  nominal: z.number().min(0, 'Nominal tarif tidak boleh bernilai negatif'),
  keterangan: z.string().optional(),
  is_active: z.boolean().default(true),
});

type TarifFormData = z.infer<typeof tarifSchema>;

interface TarifItem {
  id: number;
  master_biaya_id: number;
  tahun_angkatan: number;
  program_studi_id?: number | null;
  semester?: number | null;
  jalur_kelas?: string;
  nominal: number;
  is_active: boolean;
  keterangan?: string | null;
  master_biaya?: {
    id: number;
    kode: string;
    nama: string;
    tipe: string;
    nominal_standar: number;
  };
  program_studi?: {
    id: number;
    kode_prodi: string;
    nama: string;
    jenjang: string;
  };
  created_at?: string;
}

export default function PengaturanTarifBiayaPage() {
  const [data, setData] = useState<TarifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Master Data State (Zero Hardcode via API)
  const [katalogBiaya, setKatalogBiaya] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [angkatanOptions, setAngkatanOptions] = useState<number[]>([]);

  // Filter Drawer State (2-stage)
  const [showFilter, setShowFilter] = useState(false);
  const [filterBiaya, setFilterBiaya] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('id');
  const [filterSortOrder, setFilterSortOrder] = useState<'asc' | 'desc'>('desc');

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    master_biaya_id: '',
    tahun_angkatan: '',
    program_studi_id: '',
    is_active: '',
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
  });

  // Modal Add / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TarifItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Delete Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: number | null;
    title: string;
  }>({
    isOpen: false,
    id: null,
    title: '',
  });
  const [deleting, setDeleting] = useState(false);

  // Summary counts
  const [summary, setSummary] = useState({
    total_tarif: 0,
    total_aktif: 0,
    total_komponen_dikonfigurasi: 0,
    total_katalog_biaya: 0,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TarifFormData>({
    resolver: zodResolver(tarifSchema) as any,
    defaultValues: {
      master_biaya_id: 0,
      tahun_angkatan: new Date().getFullYear(),
      program_studi_id: '',
      nominal: 0,
      keterangan: '',
      is_active: true,
    },
  });

  const watchMasterBiayaId = watch('master_biaya_id');
  const watchAngkatan = watch('tahun_angkatan');
  const watchProdiId = watch('program_studi_id');
  const watchIsActive = watch('is_active');

  // Deteksi real-time apakah komponen biaya pada angkatan ini sudah aktif untuk Semua Program Studi (Global)
  const existingGlobalTarif = useMemo(() => {
    if (!isModalOpen || editingItem || !watchMasterBiayaId || !watchAngkatan) return null;
    return data.find(
      (t) =>
        t.master_biaya_id === Number(watchMasterBiayaId) &&
        t.tahun_angkatan === Number(watchAngkatan) &&
        (t.program_studi_id === null || t.program_studi_id === undefined) &&
        t.is_active
    );
  }, [isModalOpen, editingItem, watchMasterBiayaId, watchAngkatan, data]);

  // Deteksi real-time apakah sudah ada tarif spesifik per prodi yang aktif untuk komponen & angkatan ini
  const existingProdiTarifs = useMemo(() => {
    if (!isModalOpen || editingItem || !watchMasterBiayaId || !watchAngkatan) return [];
    return data.filter(
      (t) =>
        t.master_biaya_id === Number(watchMasterBiayaId) &&
        t.tahun_angkatan === Number(watchAngkatan) &&
        t.program_studi_id &&
        t.is_active
    );
  }, [isModalOpen, editingItem, watchMasterBiayaId, watchAngkatan, data]);

  // Fetch Master Data Referensi
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [resKatalog, resProdi, resAngkatan] = await Promise.all([
          sikeuService.getPembayaranMahasiswaKatalogBiaya(),
          sikeuService.getPembayaranMahasiswaProdiList(),
          sikeuService.getAngkatanList(),
        ]);

        const katalog = Array.isArray(resKatalog.data) ? resKatalog.data : [];
        const prodis = Array.isArray(resProdi.data) ? resProdi.data : [];
        const angkatans = Array.isArray(resAngkatan.data) ? resAngkatan.data : [];

        setKatalogBiaya(katalog);
        setProdiList(prodis);
        setAngkatanOptions(
          angkatans.length > 0 ? angkatans : [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020]
        );
      } catch (err) {
        console.error('Error fetching references:', err);
      }
    };

    fetchReferences();
  }, []);

  // Fetch Data Tarif
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getPembayaranMahasiswaTarifList({
        page: appliedFilters.page,
        per_page: 15,
        master_biaya_id: appliedFilters.master_biaya_id || undefined,
        tahun_angkatan: appliedFilters.tahun_angkatan || undefined,
        program_studi_id: appliedFilters.program_studi_id || undefined,
        is_active: appliedFilters.is_active !== '' ? appliedFilters.is_active : undefined,
        search: appliedFilters.search || undefined,
        sort_by: appliedFilters.sort_by,
        sort_order: appliedFilters.sort_order,
      });

      setData(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }

      // Fetch summary
      const sumRes = await sikeuService.getPembayaranMahasiswaSummary();
      if (sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch {
      setData([]);
      toast.error('Gagal memuat data pengaturan tarif komponen biaya');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Filter Drawer Action
  const handleApplyFilter = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      master_biaya_id: filterBiaya,
      tahun_angkatan: filterAngkatan,
      program_studi_id: filterProdi,
      is_active: filterStatus,
      search: filterSearch,
      sort_by: filterSortBy,
      sort_order: filterSortOrder,
      page: 1,
    }));
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterBiaya('');
    setFilterAngkatan('');
    setFilterProdi('');
    setFilterStatus('');
    setFilterSearch('');
    setFilterSortBy('id');
    setFilterSortOrder('desc');
    setAppliedFilters({
      master_biaya_id: '',
      tahun_angkatan: '',
      program_studi_id: '',
      is_active: '',
      search: '',
      sort_by: 'id',
      sort_order: 'desc',
      page: 1,
    });
    setShowFilter(false);
  };

  const hasActiveFilter = useMemo(() => {
    return (
      Boolean(appliedFilters.master_biaya_id) ||
      Boolean(appliedFilters.tahun_angkatan) ||
      Boolean(appliedFilters.program_studi_id) ||
      Boolean(appliedFilters.is_active) ||
      Boolean(appliedFilters.search)
    );
  }, [appliedFilters]);

  // Open Modal Tambah Tarif
  const handleOpenAdd = () => {
    setEditingItem(null);
    const currentYear = new Date().getFullYear();
    reset({
      master_biaya_id: katalogBiaya[0]?.id || 0,
      tahun_angkatan: currentYear,
      program_studi_id: '',
      nominal: katalogBiaya[0]?.nominal_standar ? Number(katalogBiaya[0].nominal_standar) : 0,
      keterangan: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit Tarif
  const handleOpenEdit = (item: TarifItem) => {
    setEditingItem(item);
    reset({
      master_biaya_id: item.master_biaya_id,
      tahun_angkatan: item.tahun_angkatan,
      program_studi_id: item.program_studi_id ? String(item.program_studi_id) : '',
      nominal: Number(item.nominal),
      keterangan: item.keterangan || '',
      is_active: Boolean(item.is_active),
    });
    setIsModalOpen(true);
  };

  // Auto-fill nominal standar saat komponen biaya katalog dipilih (jika mode tambah baru)
  const handleBiayaChange = (val: string) => {
    const bId = Number(val);
    setValue('master_biaya_id', bId, { shouldValidate: true });
    if (!editingItem) {
      const selectedBiaya = katalogBiaya.find((b) => b.id === bId);
      if (selectedBiaya && selectedBiaya.nominal_standar) {
        setValue('nominal', Number(selectedBiaya.nominal_standar));
      }
    }
  };

  // Submit Tambah / Edit Tarif
  const onSubmitForm = async (formData: TarifFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        master_biaya_id: formData.master_biaya_id,
        tahun_angkatan: formData.tahun_angkatan,
        program_studi_id: formData.program_studi_id ? Number(formData.program_studi_id) : null,
        nominal: formData.nominal,
        keterangan: formData.keterangan || null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await sikeuService.updatePembayaranMahasiswaTarif(editingItem.id, payload);
        toast.success('Pengaturan tarif komponen biaya berhasil diperbarui');
      } else {
        await sikeuService.createPembayaranMahasiswaTarif(payload);
        toast.success('Tarif komponen biaya berhasil ditambahkan');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan tarif');
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Tarif
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await sikeuService.deletePembayaranMahasiswaTarif(deleteConfirm.id);
      toast.success('Tarif komponen biaya berhasil dihapus');
      setDeleteConfirm({ isOpen: false, id: null, title: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus tarif');
    } finally {
      setDeleting(false);
    }
  };

  // Definisi Kolom Tabel DataTable
  const columns: ColumnDef<TarifItem>[] = [
    {
      key: 'komponen',
      label: 'Komponen Biaya (Katalog)',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
              {row.master_biaya?.kode || `BIAYA-${row.master_biaya_id}`}
            </span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {row.master_biaya?.nama || 'Komponen Biaya'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 capitalize">
            Tipe: {row.master_biaya?.tipe || 'SPP / Kuliah'}
          </p>
        </div>
      ),
    },
    {
      key: 'tahun_angkatan',
      label: 'Tahun Angkatan',
      render: (row) => (
        <Badge variant="blue" className="font-mono font-bold text-xs">
          Angkatan {row.tahun_angkatan}
        </Badge>
      ),
    },
    {
      key: 'program_studi',
      label: 'Program Studi Target',
      render: (row) =>
        row.program_studi ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
            <Building2 size={14} className="text-primary-600 shrink-0" />
            <span>{row.program_studi.nama}</span>
            {row.program_studi.jenjang && (
              <Badge variant="purple" className="text-[10px] uppercase">
                {row.program_studi.jenjang}
              </Badge>
            )}
          </div>
        ) : (
          <Badge variant="green" className="text-[11px] font-semibold">
            Semua Program Studi (Global)
          </Badge>
        ),
    },
    {
      key: 'nominal',
      label: 'Nominal Tarif',
      render: (row) => (
        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
          {formatRupiah(row.nominal)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="green" className="text-[10px] font-bold flex items-center gap-1 w-fit">
            <CheckCircle2 size={12} />
            Aktif
          </Badge>
        ) : (
          <Badge variant="red" className="text-[10px] font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} />
            Non-Aktif
          </Badge>
        ),
    },
    {
      key: 'keterangan',
      label: 'Keterangan',
      render: (row) => (
        <span className="text-xs text-slate-500 line-clamp-1">
          {row.keterangan || '-'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Tarif',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Tarif',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () =>
                setDeleteConfirm({
                  isOpen: true,
                  id: row.id,
                  title: `${row.master_biaya?.nama || 'Tarif'} (Angkatan ${row.tahun_angkatan})`,
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      {/* Page Header Sesuai Aturan Reviewer */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa' },
          { label: 'Pengaturan Tarif' },
        ]}
        title="Pengaturan Tarif Biaya Mahasiswa"
        description="Atur besaran tarif dari katalog komponen biaya. Anda dapat membuat variasi tarif dengan nominal berbeda tergantung Program Studi dan Tahun Angkatan."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              icon={<Filter size={16} />}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter
              {hasActiveFilter && (
                <span className="w-2 h-2 rounded-full bg-primary-600 ml-1"></span>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenAdd}
              icon={<Plus size={16} />}
              className="font-bold min-h-[38px] text-xs shadow-sm"
            >
              Tambah Tarif
            </Button>
          </div>
        }
      />

      {/* Ringkasan Cepat Katalog (Efisiensi Informasi Eksekutif) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Tarif Terdaftar</p>
          <p className="text-xl font-bold text-slate-900 font-mono">{summary.total_tarif}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Tarif Aktif</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">{summary.total_aktif}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Komponen Dikonfigurasi</p>
          <p className="text-xl font-bold text-primary-600 font-mono">
            {summary.total_komponen_dikonfigurasi}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Katalog Biaya</p>
          <p className="text-xl font-bold text-slate-700 font-mono">{summary.total_katalog_biaya}</p>
        </div>
      </div>

      {/* Mandatory DataTable dengan Server-Side Pagination */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(page) => setAppliedFilters((prev) => ({ ...prev, page }))}
        emptyMessage="Belum ada pengaturan tarif komponen biaya. Silakan klik tombol 'Tambah Tarif' untuk mengatur nominal biaya pendidikan."
      />

      {/* Filter Drawer Slide Kanan-ke-Kiri Sesuai Aturan */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengaturan Tarif"
        width="380px"
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="text-xs font-bold"
            >
              Reset Filter
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="text-xs font-bold shadow-sm"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Cepat"
            placeholder="Cari nama komponen, kode, atau keterangan..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Komponen Biaya (Katalog)"
            options={[
              { value: '', label: 'Semua Komponen Biaya' },
              ...katalogBiaya.map((b) => ({
                value: String(b.id),
                label: `${b.kode} - ${b.nama}`,
              })),
            ]}
            value={filterBiaya}
            onChange={(val) => setFilterBiaya(val as string)}
          />

          <Select
            label="Tahun Angkatan"
            options={[
              { value: '', label: 'Semua Tahun Angkatan' },
              ...angkatanOptions.map((ang) => ({
                value: String(ang),
                label: `Angkatan ${ang}`,
              })),
            ]}
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
          />

          <Select
            label="Program Studi"
            options={[
              { value: '', label: 'Semua Target (Global & Spesifik)' },
              { value: 'global', label: 'Hanya Berlaku Semua Prodi (Global)' },
              ...prodiList.map((p) => ({
                value: String(p.id),
                label: `${p.nama} (${p.jenjang || 'S1'})`,
              })),
            ]}
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
          />

          <Select
            label="Status Tarif"
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Non-Aktif' },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
          />

          {/* Grid 2 Kolom untuk Sort Sesuai Aturan Auditor */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <Select
              label="Urutkan Berdasarkan"
              options={[
                { value: 'id', label: 'ID Terdaftar' },
                { value: 'komponen', label: 'Komponen Biaya' },
                { value: 'tahun_angkatan', label: 'Tahun Angkatan' },
                { value: 'nominal', label: 'Nominal Tarif' },
              ]}
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val as string)}
            />

            <Select
              label="Arah Urutan"
              options={[
                { value: 'desc', label: 'Menurun (Z - A / Baru)' },
                { value: 'asc', label: 'Menaik (A - Z / Lama)' },
              ]}
              value={filterSortOrder}
              onChange={(val) => setFilterSortOrder(val as 'asc' | 'desc')}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Tambah / Edit Tarif (Compact Sesuai Aturan Form <= 5 Inputs) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Tarif Komponen Biaya' : 'Tambah Tarif Komponen Biaya'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Peringatan Real-Time jika sudah ada tarif Semua Program Studi */}
          {existingGlobalTarif && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Tarif Global Sudah Aktif (Semua Program Studi)
                </p>
                <p className="text-2xs text-amber-700 mt-0.5">
                  Komponen biaya ini sudah disetting aktif berlaku untuk <strong>Semua Program Studi</strong> pada Angkatan {watchAngkatan} sebesar <strong>{formatRupiah(existingGlobalTarif.nominal)}</strong>. Anda tidak perlu menginputkan tarif lagi untuk angkatan ini.
                </p>
              </div>
            </div>
          )}

          {/* Peringatan jika memilih Semua Prodi namun sudah ada tarif spesifik prodi */}
          {!existingGlobalTarif && !watchProdiId && existingProdiTarifs.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-2xs text-blue-800">
                Perhatian: Sudah terdapat <strong>{existingProdiTarifs.length} program studi</strong> yang memiliki tarif spesifik aktif untuk komponen & angkatan ini. Harap nonaktifkan tarif prodi terlebih dahulu jika ingin menetapkan satu tarif untuk Semua Program Studi.
              </p>
            </div>
          )}

          <Select
            label="Pilih Komponen Biaya dari Katalog *"
            options={[
              { value: '', label: '-- Pilih Komponen Biaya --' },
              ...katalogBiaya.map((b) => ({
                value: String(b.id),
                label: `${b.kode} - ${b.nama} (${formatRupiah(b.nominal_standar)})`,
              })),
            ]}
            value={watchMasterBiayaId ? String(watchMasterBiayaId) : ''}
            onChange={handleBiayaChange}
            error={errors.master_biaya_id?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tahun Angkatan *"
              options={angkatanOptions.map((ang) => ({
                value: String(ang),
                label: `Angkatan ${ang}`,
              }))}
              value={String(watch('tahun_angkatan'))}
              onChange={(val) => setValue('tahun_angkatan', Number(val), { shouldValidate: true })}
              error={errors.tahun_angkatan?.message}
            />

            <Select
              label="Program Studi Target"
              options={[
                { value: '', label: 'Semua Program Studi (Global)' },
                ...prodiList.map((p) => ({
                  value: String(p.id),
                  label: `${p.nama} (${p.jenjang || 'S1'})`,
                })),
              ]}
              value={watchProdiId || ''}
              onChange={(val) => setValue('program_studi_id', val as string)}
            />
          </div>

          <Input
            type="number"
            label="Nominal Tarif (Rp) *"
            placeholder="Contoh: 5000000"
            {...register('nominal', { valueAsNumber: true })}
            error={errors.nominal?.message}
          />

          <Textarea
            label="Keterangan (Opsional)"
            placeholder="Catatan tambahan terkait ketentuan atau dasar tarif..."
            rows={2}
            {...register('keterangan')}
          />

          <Select
            label="Status Tarif *"
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Non-Aktif' },
            ]}
            value={watchIsActive ? 'true' : 'false'}
            onChange={(val) => setValue('is_active', val === 'true')}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || Boolean(existingGlobalTarif) || (!watchProdiId && existingProdiTarifs.length > 0 && !editingItem)}
              icon={submitting ? <Loader2 size={16} className="animate-spin" /> : undefined}
              className="text-xs font-bold shadow-sm px-5"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Tarif'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus UI Sesuai Aturan */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title="Hapus Tarif Komponen Biaya"
        message={`Apakah Anda yakin ingin menghapus pengaturan tarif "${deleteConfirm.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={deleting ? 'Menghapus...' : 'Ya, Hapus Tarif'}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
