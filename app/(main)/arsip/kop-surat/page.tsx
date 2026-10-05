'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Filter, 
  Building2, 
  FileCheck, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  Power,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import { 
  type KopSurat, 
  type VersiKopSurat,
  VERSI_KOP_SURAT_OPTIONS,
  FILTER_VERSI_KOP_OPTIONS,
  STATUS_ACTIVE_OPTIONS,
  SORT_DIR_OPTIONS,
} from '@/types/arsip.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

const kopSuratSchema = z
  .object({
    versi: z.enum(['baru', 'lama']),
    nama: z.string().min(1, 'Nama template kop surat wajib diisi'),
    tahun_mulai: z.string().min(4, 'Tahun mulai minimal 4 digit'),
    tahun_selesai: z.string().optional(),
    is_active: z.boolean(),
    is_edit: z.boolean().optional(),
    file_kop: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_edit && !data.file_kop) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Berkas file gambar kop surat wajib diunggah',
        path: ['file_kop'],
      });
    }
  });

type KopSuratFormData = z.infer<typeof kopSuratSchema>;

export default function MasterKopSuratPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('arsip.kop_surat.manage');

  const [data, setData] = useState<KopSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Active copies for the 2 versions
  const [kopBaruAktif, setKopBaruAktif] = useState<KopSurat | null>(null);
  const [kopLamaAktif, setKopLamaAktif] = useState<KopSurat | null>(null);

  // Filter Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterVersi, setFilterVersi] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState('tahun_mulai');
  const [sortDir, setSortDir] = useState('desc');

  // Modal Form (Add / Edit) - Khusus Berkas Gambar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKop, setEditingKop] = useState<KopSurat | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<KopSuratFormData>({
    resolver: zodResolver(kopSuratSchema),
    defaultValues: {
      versi: 'baru',
      nama: '',
      tahun_mulai: '2021',
      tahun_selesai: '',
      is_active: true,
      is_edit: false,
      file_kop: undefined,
    },
  });

  const watchVersi = watch('versi');

  // Modal Pratinjau Gambar Penuh (Preview Lightbox)
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState('Pratinjau Gambar Kop Surat Resmi');

  // Delete & Toggle Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKop, setSelectedKop] = useState<KopSurat | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchKopSurat = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
      };
      if (search) params.search = search;
      if (filterVersi) params.versi = filterVersi;
      if (filterStatus) params.is_active = filterStatus;
      if (sortBy) params.sort_by = sortBy;
      if (sortDir) params.sort_dir = sortDir;

      const res = await arsipService.getKopSuratList(params);
      const rawData: any = res.data;
      const items: KopSurat[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const paginationMeta: PaginationMeta | undefined = res.meta || rawData?.meta;
      setData(items);
      setMeta(paginationMeta);

      // Identify active templates for both versions
      const baru = items.find((k) => k.versi === 'baru' && k.is_active);
      const lama = items.find((k) => k.versi === 'lama' && k.is_active);
      setKopBaruAktif(baru || null);
      setKopLamaAktif(lama || null);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat master kop surat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKopSurat();
  }, [page, limit, filterVersi, filterStatus]);

  const handleOpenAddModal = () => {
    setEditingKop(null);
    reset({
      versi: 'baru',
      nama: '',
      tahun_mulai: '',
      tahun_selesai: '',
      is_active: true,
      is_edit: false,
      file_kop: undefined,
    });
    setFormFile(null);
    setFormFilePreview(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (row: KopSurat) => {
    setEditingKop(row);
    reset({
      versi: row.versi,
      nama: row.nama,
      tahun_mulai: String(row.tahun_mulai),
      tahun_selesai: row.tahun_selesai ? String(row.tahun_selesai) : '',
      is_active: row.is_active,
      is_edit: true,
      file_kop: undefined,
    });
    setFormFile(null);
    setFormFilePreview(row.file_url || null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Berkas harus berupa file gambar (PNG, JPG, JPEG, WEBP).');
        return;
      }
      setFormFile(file);
      setFormFilePreview(URL.createObjectURL(file));
      setValue('file_kop', file, { shouldValidate: true });
    }
  };

  const handlePreviewImage = (row: KopSurat) => {
    if (row.file_url) {
      setPreviewModalImage(row.file_url);
      setPreviewModalTitle(`Pratinjau Kop Surat: ${row.nama}`);
    } else {
      toast.error('Berkas gambar kop surat belum tersedia.');
    }
  };

  const onSubmitKop = async (values: KopSuratFormData) => {
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('nama', values.nama.trim());
      fd.append('versi', values.versi);
      fd.append('tahun_mulai', values.tahun_mulai);
      if (values.tahun_selesai) fd.append('tahun_selesai', values.tahun_selesai);
      fd.append('is_active', values.is_active ? '1' : '0');
      if (formFile) fd.append('file_kop', formFile);

      if (editingKop) {
        await arsipService.updateKopSurat(editingKop.id, fd);
        toast.success('Kop surat berhasil diperbarui.');
      } else {
        await arsipService.storeKopSurat(fd);
        toast.success('Berkas gambar kop surat berhasil diunggah.');
      }

      setModalOpen(false);
      fetchKopSurat();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan berkas gambar kop surat.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (row: KopSurat) => {
    try {
      await arsipService.toggleActiveKopSurat(row.id);
      toast.success(`Status aktif kop surat ${row.nama} berhasil diubah.`);
      fetchKopSurat();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengubah status aktif.'));
    }
  };

  const handleDelete = async () => {
    if (!selectedKop) return;
    try {
      setSubmittingAction(true);
      await arsipService.deleteKopSurat(selectedKop.id);
      toast.success('Kop surat berhasil dihapus.');
      setDeleteDialogOpen(false);
      fetchKopSurat();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus kop surat.'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const columns: ColumnDef<KopSurat>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: KopSurat, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'preview',
      label: 'GAMBAR KOP SURAT',
      render: (row: KopSurat) => (
        <div className="flex items-center gap-2">
          {row.file_url ? (
            <div 
              className="group relative h-12 w-36 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--module-primary)] hover:shadow-xs transition-all"
              onClick={() => handlePreviewImage(row)}
              title="Klik untuk melihat gambar penuh"
            >
              <img
                src={row.file_url}
                alt={row.nama}
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                <Maximize2 size={14} className="text-white" />
              </div>
            </div>
          ) : (
            <div className="h-12 w-36 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-2xs text-slate-400">
              Tanpa Berkas
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA & VERSI KOP',
      render: (row: KopSurat) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900">{row.nama}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge
              variant={row.versi === 'baru' ? 'success' : 'purple'}
              className="uppercase text-2xs font-semibold"
            >
              Versi {row.versi} ({row.versi === 'baru' ? '≥ 2021' : '< 2021'})
            </Badge>
            <span className="text-2xs text-slate-400 font-mono">
              Periode: {row.tahun_mulai} s.d {row.tahun_selesai || 'Sekarang'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS AKTIF',
      align: 'center',
      render: (row: KopSurat) => (
        <Badge
          variant={row.is_active ? 'success' : 'danger'}
          className="capitalize text-2xs font-semibold"
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (row: KopSurat) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Gambar Penuh',
                icon: <Eye size={14} />,
                onClick: () => handlePreviewImage(row),
              },
              ...(canManage
                ? [
                    {
                      label: row.is_active ? 'Nonaktifkan Template' : 'Aktifkan Template',
                      icon: <Power size={14} />,
                      onClick: () => handleToggleActive(row),
                    },
                    {
                      label: 'Edit Kop Surat',
                      icon: <Edit3 size={14} />,
                      onClick: () => handleOpenEditModal(row),
                    },
                    {
                      label: 'Hapus Kop Surat',
                      icon: <Trash2 size={14} className="text-red-500" />,
                      variant: 'danger' as const,
                      onClick: () => {
                        setSelectedKop(row);
                        setDeleteDialogOpen(true);
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header: strictly text 'Filter' on the LEFT of Tambah */}
      <PageHeader
        title="Master Kop Surat Resmi"
        description="Kelola template kop surat kampus dengan 2 versi pembeda (Versi Baru ≥ 2021 dan Versi Lama < 2021)"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setDrawerOpen(true)}
              className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                size="md"
                className="bg-[var(--module-primary)] hover:opacity-90 text-white shadow-sm"
                onClick={handleOpenAddModal}
              >
                <Plus size={16} className="mr-1.5" />
                Tambah Kop Surat
              </Button>
            )}
          </div>
        }
      />

      {/* 2-Column Summary Cards for the 2 Versions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Versi Baru */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-2xs uppercase">
                  Versi Baru (≥ 2021)
                </Badge>
                <span className="text-2xs text-slate-500 font-mono">Tahun 2021 s.d Sekarang</span>
              </div>
              {kopBaruAktif && (
                <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={13} /> Aktif Digunakan
                </span>
              )}
            </div>
            <h3 className="font-bold text-xs text-slate-800 tracking-tight mb-1">
              {kopBaruAktif ? kopBaruAktif.nama : 'Belum Ada Kop Versi Baru Aktif'}
            </h3>
            <p className="text-2xs text-slate-500">
              Otomatis dilampirkan pada seluruh penomoran surat bertahun 2021 ke atas.
            </p>
          </div>

          {kopBaruAktif?.file_url ? (
            <div className="pt-2">
              <div 
                className="group relative w-full h-16 bg-slate-50 rounded-lg p-1.5 flex items-center justify-center cursor-pointer border border-slate-200 overflow-hidden shadow-xs hover:border-[var(--module-primary)] transition-all"
                onClick={() => handlePreviewImage(kopBaruAktif)}
                title="Klik untuk melihat gambar penuh"
              >
                <img
                  src={kopBaruAktif.file_url}
                  alt={kopBaruAktif.nama}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-2xs font-semibold text-white transition-opacity">
                  <Maximize2 size={13} /> Perbesar Gambar
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-2xs text-slate-400">
              Belum ada file gambar diunggah
            </div>
          )}
        </div>

        {/* Card Versi Lama */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="bg-purple-50 text-purple-700 border-purple-200 text-2xs uppercase">
                  Versi Lama (&lt; 2021)
                </Badge>
                <span className="text-2xs text-slate-500 font-mono">Arsip &lt; 2021</span>
              </div>
              {kopLamaAktif && (
                <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={13} /> Aktif Digunakan
                </span>
              )}
            </div>
            <h3 className="font-bold text-xs text-slate-800 tracking-tight mb-1">
              {kopLamaAktif ? kopLamaAktif.nama : 'Belum Ada Kop Versi Lama Aktif'}
            </h3>
            <p className="text-2xs text-slate-500">
              Otomatis dilampirkan jika dokumen bertanggal sebelum tahun 2021.
            </p>
          </div>

          {kopLamaAktif?.file_url ? (
            <div className="pt-2">
              <div 
                className="group relative w-full h-16 bg-slate-50 rounded-lg p-1.5 flex items-center justify-center cursor-pointer border border-slate-200 overflow-hidden shadow-xs hover:border-[var(--module-primary)] transition-all"
                onClick={() => handlePreviewImage(kopLamaAktif)}
                title="Klik untuk melihat gambar penuh"
              >
                <img
                  src={kopLamaAktif.file_url}
                  alt={kopLamaAktif.nama}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-2xs font-semibold text-white transition-opacity">
                  <Maximize2 size={13} /> Perbesar Gambar
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-2xs text-slate-400">
              Belum ada file gambar diunggah
            </div>
          )}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada riwayat master kop surat yang terdaftar."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter Kop Surat"
        width="400px"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian Nama Kop"
            placeholder="Cari nama template kop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Versi Kop Surat"
            value={filterVersi}
            onChange={(val) => setFilterVersi(val || '')}
            options={FILTER_VERSI_KOP_OPTIONS}
          />

          <Select
            label="Status Penggunaan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={STATUS_ACTIVE_OPTIONS}
          />

          {/* Sort By & Sort Direction dalam format grid 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val || 'tahun_mulai')}
              options={[
                { value: 'tahun_mulai', label: 'Tahun Mulai' },
                { value: 'nama', label: 'Nama Kop' },
                { value: 'versi', label: 'Versi Kop' },
                { value: 'created_at', label: 'Waktu Dibuat' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val) => setSortDir(val || 'desc')}
              options={SORT_DIR_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearch('');
                setFilterVersi('');
                setFilterStatus('');
                setSortBy('tahun_mulai');
                setSortDir('desc');
                setPage(1);
                setDrawerOpen(false);
                setTimeout(fetchKopSurat, 50);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              className="bg-[var(--module-primary)] hover:opacity-90 text-white"
              onClick={() => {
                setPage(1);
                setDrawerOpen(false);
                fetchKopSurat();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Form: Unggah Gambar Kop Surat */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingKop ? 'Edit Kop Surat Resmi' : 'Unggah File Gambar Kop Surat'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitKop)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="versi"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kategori Versi Kop Surat"
                  value={field.value}
                  onChange={(val) => {
                    const v = (val || 'baru') as VersiKopSurat;
                    field.onChange(v);
                    if (v === 'baru') {
                      setValue('tahun_mulai', '2021');
                      setValue('tahun_selesai', '');
                    } else {
                      setValue('tahun_mulai', '1990');
                      setValue('tahun_selesai', '2020');
                    }
                  }}
                  options={VERSI_KOP_SURAT_OPTIONS}
                  error={errors.versi?.message}
                />
              )}
            />

            <Input
              label="Nama / Label Kop Surat *"
              placeholder="Contoh: Kop Surat Resmi Kampus 2021+"
              error={errors.nama?.message}
              {...register('nama')}
            />

            <Input
              label="Tahun Mulai Berlaku *"
              type="number"
              error={errors.tahun_mulai?.message}
              {...register('tahun_mulai')}
            />

            <Input
              label="Tahun Selesai Berlaku (Opsional)"
              type="number"
              placeholder="Kosongkan jika masih berlaku seterusnya"
              error={errors.tahun_selesai?.message}
              {...register('tahun_selesai')}
            />

            {/* Upload Zone Khusus File Gambar */}
            <div className="md:col-span-2">
              <Input
                label={`Unggah File Gambar Kop Surat ${!editingKop ? '*' : '(Opsional)'}`}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                error={errors.file_kop?.message as string}
                hint="Format gambar wajib PNG, JPG, JPEG, WEBP (Maksimal 5MB, disarankan transparan/putih)."
              />
            </div>

            {/* Live Image Preview Frame */}
            {(formFilePreview || editingKop?.file_url) && (
              <div className="md:col-span-2 space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" /> Pratinjau Gambar Kop Surat:
                  </span>
                  {formFile && (
                    <span className="text-2xs text-[var(--module-primary)] font-mono">
                      {(formFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
                <div className="w-full bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-center overflow-hidden shadow-xs min-h-[80px]">
                  <img
                    src={(formFilePreview || editingKop?.file_url) ?? undefined}
                    alt="Pratinjau Kop Surat"
                    className="max-h-24 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_active_checkbox"
                    label="Jadikan sebagai Kop Surat Aktif untuk versi ini"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-[var(--module-primary)] hover:opacity-90 text-white"
              isLoading={submitting}
            >
              Simpan Kop Surat
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Pratinjau Gambar Penuh (Lightbox) */}
      <Modal
        isOpen={!!previewModalImage}
        onClose={() => setPreviewModalImage(null)}
        title={previewModalTitle}
        size="xl"
      >
        <div className="space-y-4">
          <div className="w-full bg-white border border-slate-300 rounded-xl p-6 flex items-center justify-center shadow-inner overflow-auto min-h-[160px]">
            {previewModalImage && (
              <img
                src={previewModalImage}
                alt="Gambar Kop Surat Resmi"
                className="w-full max-h-[320px] object-contain"
              />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <p className="text-2xs text-slate-500">
              *Gambar kop surat ini otomatis ditarik dan disematkan di bagian header dokumen saat cetak surat resmi.
            </p>
            <Button variant="outline" size="sm" onClick={() => setPreviewModalImage(null)}>
              Tutup Pratinjau
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Kop Surat"
        message={
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin menghapus template kop surat{' '}
            <strong className="text-slate-900">{selectedKop?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        }
        confirmText="Hapus Template"
        cancelText="Batal"
        variant="danger"
        isLoading={submittingAction}
      />
    </div>
  );
}
