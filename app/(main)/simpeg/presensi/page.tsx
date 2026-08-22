'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Upload, Filter, Eye, Trash2, ShieldAlert, FileSpreadsheet, Layers, Calendar, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export interface PresensiBundle {
  id: number;
  nama_periode: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  bulan_tahun?: string;
  total_record: number;
  total_pegawai?: number;
  catatan?: string;
  created_at: string;
}

const uploadRekapSchema = z.object({
  nama_periode: z.string().min(1, 'Nama / Periode Bundle Wajib diisi (misal: Rekap Presensi Agustus 2026)'),
  tanggal_awal: z.string().min(1, 'Tanggal Awal Presensi Wajib diisi'),
  tanggal_akhir: z.string().min(1, 'Tanggal Akhir Presensi Wajib diisi'),
  catatan: z.string().optional(),
});

type UploadRekapFormValues = z.infer<typeof uploadRekapSchema>;

export default function PresensiPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.presensi.manage');
  const canRead = hasPermission('simpeg.presensi.read') || hasPermission('simpeg.presensi.manage');
  const canCreate = hasPermission('simpeg.presensi.create') || hasPermission('simpeg.presensi.manage');
  const canDelete = hasPermission('simpeg.presensi.delete') || hasPermission('simpeg.presensi.manage') || isAdmin;

  const [loading, setLoading] = useState(true);
  const [bundleList, setBundleList] = useState<PresensiBundle[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilter, setShowFilter] = useState(false);

  // Modal Upload Rekap Presensi State
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Bundle Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBundleToDelete, setSelectedBundleToDelete] = useState<PresensiBundle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset Data Fallback State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<UploadRekapFormValues>({
    resolver: zodResolver(uploadRekapSchema),
    defaultValues: {
      nama_periode: '',
      tanggal_awal: '',
      tanggal_akhir: '',
      catatan: '',
    },
  });

  const fetchBundleList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await simpegService.getPresensiList({
        search: search.trim() || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
        page,
        limit,
      });

      if (res.status === 'success' && res.data) {
        setBundleList(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar Bundle Rekap Presensi');
    } finally {
      setLoading(false);
    }
  }, [search, filterOrderBy, filterOrderDir, page, limit]);

  useEffect(() => {
    fetchBundleList();
  }, [fetchBundleList]);

  const handleOpenUploadModal = () => {
    resetForm({
      nama_periode: '',
      tanggal_awal: '',
      tanggal_akhir: '',
      catatan: '',
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const onSubmitUploadRekap = async (values: UploadRekapFormValues) => {
    if (!selectedFile) {
      toast.error('Silakan pilih berkas rekap presensi (.sql, .csv, .xlsx) terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nama_periode', values.nama_periode);
      formData.append('tanggal_awal', values.tanggal_awal);
      formData.append('tanggal_akhir', values.tanggal_akhir);
      formData.append('file_rekap', selectedFile);
      if (values.catatan) {
        formData.append('catatan', values.catatan);
      }

      const res = await simpegService.uploadPresensiRekap(formData);
      if (res.status === 'success') {
        toast.success(res.message || 'Bundle Rekap Presensi berhasil diunggah!');
        setShowModal(false);
        fetchBundleList();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah berkas rekap presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBundleClick = (bundle: PresensiBundle) => {
    setSelectedBundleToDelete(bundle);
    setShowDeleteModal(true);
  };

  const confirmDeleteBundle = async () => {
    if (!selectedBundleToDelete) return;
    setDeleting(true);
    try {
      const res = await simpegService.deletePresensiBundle(selectedBundleToDelete.id);
      if (res.status === 'success') {
        toast.success(res.message || 'Bundle presensi berhasil dihapus');
        setShowDeleteModal(false);
        setSelectedBundleToDelete(null);
        fetchBundleList();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus bundle presensi');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetAllData = async () => {
    setResetting(true);
    try {
      const res = await simpegService.resetPresensiData();
      if (res.status === 'success') {
        toast.success(res.message || 'Seluruh data presensi & bundle berhasil di-reset.');
        setShowResetModal(false);
        fetchBundleList();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan reset data presensi.');
    } finally {
      setResetting(false);
    }
  };

  const columns: ColumnDef<PresensiBundle>[] = [
    {
      key: 'nama_periode',
      label: 'Periode / Nama Bundle',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
            <Layers size={18} />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{row.nama_periode}</div>
            {row.catatan && <div className="text-xs text-slate-400 truncate max-w-xs">{row.catatan}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'tanggal_awal',
      label: 'Rentang Tanggal Absensi',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Calendar size={14} className="text-slate-400" />
          <span>{row.tanggal_awal}</span>
          <span className="text-slate-400">s/d</span>
          <span>{row.tanggal_akhir}</span>
        </div>
      ),
    },
    {
      key: 'total_pegawai',
      label: 'Jumlah Karyawan',
      render: (row) => (
        <Badge variant="indigo">
          {row.total_pegawai !== undefined ? row.total_pegawai.toLocaleString('id-ID') : (row.total_record ? row.total_record.toLocaleString('id-ID') : 0)} Karyawan
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Waktu Upload',
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {new Date(row.created_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Detail Bundle',
                icon: <Eye size={14} />,
                onClick: () => router.push(`/simpeg/presensi/${row.id}`),
              },
              ...(canDelete
                ? [
                    {
                      label: 'Hapus Bundle Ini',
                      icon: <Trash2 size={14} />,
                      variant: 'danger' as const,
                      onClick: () => handleDeleteBundleClick(row),
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
    <div className="space-y-6">
      <PageHeader
        title="Rekap Presensi & Absensi Pegawai"
        description="Kelola bundle rekap absensi bulanan dan lihat rincian log kehadiran pegawai"
        action={
          <div className="flex flex-wrap gap-2">
            {canCreate && (
              <Button icon={<Upload size={16} />} onClick={handleOpenUploadModal}>
                Unggah Rekap Presensi Baru
              </Button>
            )}
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={bundleList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Filter Drawer (Slide Kanan-ke-Kiri) */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Bundle Presensi">
        <div className="space-y-4">
          <Input
            label="Cari Nama / Periode Bundle"
            placeholder="Ketik nama periode bundle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Waktu Upload' },
                { value: 'nama_periode', label: 'Nama Bundle' },
                { value: 'tanggal_awal', label: 'Tanggal Awal' },
                { value: 'total_record', label: 'Total Record' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setPage(1);
                setShowFilter(false);
                fetchBundleList();
              }}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Upload Rekap Presensi (Form Bundle) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Unggah Bundle Rekap Presensi Pegawai"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} form="presensi-upload-modal-form">
              Unggah & Buat Bundle
            </Button>
          </>
        }
      >
        <form id="presensi-upload-modal-form" onSubmit={handleSubmit(onSubmitUploadRekap)} className="space-y-4">
          <Input
            label="Periode Bulan & Tahun Rekap Absensi (Nama Bundle) *"
            placeholder="Contoh: Rekap Presensi Agustus 2026"
            required
            error={errors.nama_periode?.message}
            {...register('nama_periode')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tanggal Awal Presensi *"
              type="date"
              required
              error={errors.tanggal_awal?.message}
              {...register('tanggal_awal')}
            />
            <Input
              label="Tanggal Akhir Presensi *"
              type="date"
              required
              error={errors.tanggal_akhir?.message}
              {...register('tanggal_akhir')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              Pilih Berkas Rekap Absensi (SQL Dump / Excel / CSV / PDF) *
            </label>
            <input
              type="file"
              accept=".sql,.csv,.xlsx,.xls,.pdf,.txt"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-slate-300 rounded-xl cursor-pointer p-1.5 transition-all"
            />
            {selectedFile ? (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <FileSpreadsheet size={14} /> Berkas Terpilih: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Format yang didukung: SQL Dump Mentah (.sql, e.g. backupfinger.sql, shift_result.sql), Excel (.xlsx, .xls), CSV (.csv) (Maks 100MB)
              </p>
            )}
          </div>

          <Textarea
            label="Catatan Tambahan (Opsional)"
            placeholder="Tuliskan catatan tambahan mengenai berkas rekap presensi ini..."
            rows={2}
            error={errors.catatan?.message}
            {...register('catatan')}
          />
        </form>
      </Modal>

      {/* Modal Confirm Delete Bundle */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus Bundle Presensi"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="danger" loading={deleting} disabled={deleting} onClick={confirmDeleteBundle}>
              Ya, Hapus Bundle Ini
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-red-600" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Apakah Anda yakin ingin menghapus bundle ini?</p>
            <p className="text-red-700 text-xs">
              Bundle <strong>{selectedBundleToDelete?.nama_periode}</strong> beserta seluruh {selectedBundleToDelete?.total_record} data absensi pegawai di dalamnya akan dihapus secara permanen dari sistem.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
