'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Filter, Trash2, CheckCircle2, Eye, FileSignature } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import apiClient from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/utils';
import type { TandaTanganPegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

const tandaTanganSchema = z.object({
  user_id: z.number().min(1, 'Pengguna wajib dipilih'),
  judul: z.string().min(1, 'Label / Judul tanda tangan wajib diisi'),
  is_active: z.boolean(),
});

type TandaTanganFormValues = z.infer<typeof tandaTanganSchema>;

export default function MasterTandaTanganPage() {
  const { hasPermission, isAdmin, isSuperAdmin, hasRole } = useAuth();
  const canRead =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.tanda_tangan.read') ||
    hasPermission('simpeg.pegawai.read');
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.tanda_tangan.create') ||
    hasPermission('simpeg.tanda_tangan.update');

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<TandaTanganPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIsActive, setFilterIsActive] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  // Modal & Confirm States
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<TandaTanganPegawai | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TandaTanganPegawai | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TandaTanganFormValues>({
    resolver: zodResolver(tandaTanganSchema),
    defaultValues: {
      user_id: undefined as unknown as number,
      judul: 'Tanda Tangan Utama',
      is_active: true,
    },
  });

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: limit,
        sort_by: filterOrderBy,
        sort_order: filterOrderDir,
      };

      if (search.trim()) params.search = search.trim();
      if (filterIsActive !== '') params.is_active = filterIsActive;

      const res = await simpegService.getTandaTanganList(params);
      setDataList(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat master tanda tangan digital.'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterOrderBy, filterOrderDir, search, filterIsActive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setFileError('Format file harus PNG atau JPG (PNG transparan disarankan).');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 2 MB.');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  // Submit Handler
  const onSubmit = async (values: TandaTanganFormValues) => {
    if (!selectedFile) {
      setFileError('Berkas gambar tanda tangan wajib diunggah.');
      return;
    }

    const formData = new FormData();
    formData.append('user_id', String(values.user_id));
    formData.append('judul', values.judul);
    formData.append('is_active', values.is_active ? '1' : '0');
    formData.append('file_tanda_tangan', selectedFile);

    try {
      await simpegService.storeTandaTangan(formData);
      toast.success('Tanda tangan digital berhasil ditambahkan.');
      setModalOpen(false);
      reset();
      setSelectedFile(null);
      setFilePreviewUrl(null);
      loadData();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan tanda tangan digital.'));
    }
  };

  // Toggle Active Handler
  const handleToggleActive = async (item: TandaTanganPegawai) => {
    try {
      await simpegService.toggleActiveTandaTangan(item.id);
      toast.success(`Tanda tangan ${item.is_active ? 'dinonaktifkan' : 'diaktifkan sebagai utama'}.`);
      loadData();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengubah status tanda tangan.'));
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await simpegService.deleteTandaTangan(itemToDelete.id);
      toast.success('Tanda tangan digital berhasil dihapus.');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus tanda tangan digital.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // User search options loader for AsyncSelect
  const loadUserOptions = async (query: string) => {
    try {
      const res = await apiClient.get('/admin/users', {
        params: { search: query, per_page: 20 },
      });
      const users = res.data?.data || [];
      return users.map((u: any) => ({
        value: u.id,
        label: `${u.name} (${u.email})`,
      }));
    } catch {
      return [];
    }
  };

  // Columns definition (Max 12px, soft contrast)
  const columns: ColumnDef<TandaTanganPegawai>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: TandaTanganPegawai, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'pemilik',
      label: 'PEMILIK TANDA TANGAN',
      render: (row: TandaTanganPegawai) => {
        const nama = row.pegawai?.nama_lengkap || row.user?.name || '-';
        const sub = row.pegawai?.nip 
          ? `NIP: ${row.pegawai.nip}` 
          : row.pegawai?.nidn 
          ? `NIDN: ${row.pegawai.nidn}` 
          : row.user?.email || '-';
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-xs">{nama}</span>
            <span className="text-slate-400 text-2xs">{sub}</span>
          </div>
        );
      },
    },
    {
      key: 'judul',
      label: 'LABEL / JUDUL',
      render: (row: TandaTanganPegawai) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-xs">{row.judul}</span>
          <span className="text-slate-400 text-2xs capitalize">{row.tipe.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'preview',
      label: 'PREVIEW TTD',
      align: 'center',
      render: (row: TandaTanganPegawai) => {
        if (!row.file_url) {
          return <span className="text-slate-400 text-2xs italic">Tidak ada berkas</span>;
        }
        return (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedPreview(row);
                setPreviewModalOpen(true);
              }}
              className="p-1 rounded border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all"
              title="Klik untuk melihat ukuran penuh"
            >
              <div className="relative w-20 h-10 bg-slate-50 flex items-center justify-center overflow-hidden">
                <Image
                  src={row.file_url}
                  alt={row.judul}
                  width={80}
                  height={40}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              </div>
            </button>
          </div>
        );
      },
    },
    {
      key: 'qr_token',
      label: 'TOKEN VERIFIKASI',
      render: (row: TandaTanganPegawai) => (
        <span className="font-mono text-slate-500 text-2xs bg-slate-100 px-2 py-0.5 rounded">
          {row.qr_token ? `${row.qr_token.substring(0, 13)}...` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row: TandaTanganPegawai) => (
        <div className="flex justify-center">
          {row.is_active ? (
            <Badge variant="success" className="text-2xs font-semibold">
              Utama
            </Badge>
          ) : (
            <Badge variant="gray" className="text-2xs">
              Nonaktif
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (row: TandaTanganPegawai) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Gambar Penuh',
                icon: <Eye size={14} />,
                onClick: () => {
                  setSelectedPreview(row);
                  setPreviewModalOpen(true);
                },
              },
              ...(canManage
                ? [
                    {
                      label: row.is_active ? 'Nonaktifkan' : 'Jadikan TTD Utama',
                      icon: <CheckCircle2 size={14} />,
                      onClick: () => handleToggleActive(row),
                    },
                    {
                      label: 'Hapus Tanda Tangan',
                      icon: <Trash2 size={14} className="text-red-500" />,
                      onClick: () => {
                        setItemToDelete(row);
                        setDeleteConfirmOpen(true);
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
    <div className="w-full flex flex-col gap-4 p-4 md:p-6">
      {/* Page Header with Strictly Text 'Filter' */}
      <PageHeader
        title="Master Tanda Tangan Digital"
        description="Manajemen berkas tanda tangan digital resmi pegawai & pejabat untuk dokumen otomatis kampus"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowFilter(true)}
              className="border-[var(--module-primary,#2563eb)] text-[var(--module-primary,#2563eb)] hover:bg-blue-50"
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </Button>
            {canManage && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  reset();
                  setSelectedFile(null);
                  setFilePreviewUrl(null);
                  setFileError(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} className="mr-1.5" />
                Tambah Tanda Tangan
              </Button>
            )}
          </div>
        }
      />

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={dataList}
          isLoading={loading}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="Belum ada data master tanda tangan digital."
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Pengurutan"
        width="400px"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian"
            placeholder="Cari nama pegawai, judul, atau token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Status Tanda Tangan"
            value={filterIsActive}
            onChange={(val) => setFilterIsActive(val || '')}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Hanya Tanda Tangan Utama (Aktif)' },
              { value: 'false', label: 'Hanya Nonaktif' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val || 'created_at')}
              options={[
                { value: 'created_at', label: 'Tanggal Input' },
                { value: 'judul', label: 'Judul' },
                { value: 'is_active', label: 'Status' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir((val as 'asc' | 'desc') || 'desc')}
              options={[
                { value: 'desc', label: 'Terbaru / Desc' },
                { value: 'asc', label: 'Terlama / Asc' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setSearch('');
                setFilterIsActive('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Tambah Tanda Tangan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Unggah Master Tanda Tangan Digital"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Pengguna / Pegawai <span className="text-red-500">*</span>
            </label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  placeholder="Ketik nama atau email pegawai..."
                  loadOptions={loadUserOptions}
                  defaultOptions
                  onChange={(opt) => field.onChange(opt ? opt.value : undefined)}
                  error={errors.user_id?.message}
                />
              )}
            />
          </div>

          <Input
            label="Label / Judul Tanda Tangan"
            placeholder="Contoh: Tanda Tangan Utama"
            {...register('judul')}
            error={errors.judul?.message}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Berkas Gambar Tanda Tangan <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-2xs text-slate-400 mt-1">
              Format: PNG transparan disarankan, atau JPG/JPEG (Maks. 2 MB).
            </p>
            {fileError && <p className="text-2xs text-red-500 mt-1">{fileError}</p>}
          </div>

          {filePreviewUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center gap-2">
              <span className="text-2xs font-semibold text-slate-600">Pratinjau Tanda Tangan:</span>
              <div className="relative w-40 h-20 bg-white border border-dashed border-slate-300 rounded flex items-center justify-center p-2">
                <Image
                  src={filePreviewUrl}
                  alt="Preview"
                  width={160}
                  height={80}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_active_toggle"
                  label="Jadikan sebagai tanda tangan utama yang aktif digunakan"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <p className="text-2xs text-slate-400 ml-6 mt-0.5">
              Menandai ini akan otomatis menonaktifkan tanda tangan lama milik pengguna tersebut.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
            >
              Simpan Tanda Tangan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview Gambar Penuh */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedPreview(null);
        }}
        title={`Pratinjau: ${selectedPreview?.judul || 'Tanda Tangan Digital'}`}
        size="md"
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center">
            {selectedPreview?.file_url ? (
              <div className="relative w-64 h-32 bg-white border border-slate-200 rounded shadow-inner flex items-center justify-center p-4">
                <Image
                  src={selectedPreview.file_url}
                  alt={selectedPreview.judul}
                  width={240}
                  height={120}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">Berkas gambar tidak ditemukan</span>
            )}
          </div>

          <div className="w-full bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Pemilik:</span>
              <span className="font-semibold text-slate-800">
                {selectedPreview?.pegawai?.nama_lengkap || selectedPreview?.user?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-700">{selectedPreview?.user?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Token Keabsahan:</span>
              <span className="font-mono text-2xs text-slate-600 bg-slate-200 px-1 rounded">
                {selectedPreview?.qr_token || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Penggunaan:</span>
              <span>
                {selectedPreview?.is_active ? (
                  <span className="text-emerald-600 font-semibold">Tanda Tangan Utama (Aktif)</span>
                ) : (
                  <span className="text-slate-400">Arsip / Nonaktif</span>
                )}
              </span>
            </div>
          </div>

          <div className="w-full flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setPreviewModalOpen(false);
                setSelectedPreview(null);
              }}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Tanda Tangan Digital"
        message={`Apakah Anda yakin ingin menghapus tanda tangan "${itemToDelete?.judul}" milik ${
          itemToDelete?.pegawai?.nama_lengkap || itemToDelete?.user?.name || 'pengguna ini'
        }? Tindakan ini akan menghapus spesimen tanda tangan dari penyimpanan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
