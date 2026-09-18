'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ListChecks,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import type { MasterKategoriSkp } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

// ── ZOD SCHEMA ──────────────────────────────────────────────

const kategoriSkpSchema = z.object({
  nama: z
    .string()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(100, 'Nama kategori maksimal 100 karakter'),
  kode: z
    .string()
    .min(2, 'Kode kategori minimal 2 karakter')
    .max(50, 'Kode kategori maksimal 50 karakter'),
  deskripsi: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional().nullable(),
  urutan: z.number().int('Urutan harus berupa angka bulat').min(0, 'Urutan minimal 0'),
  is_active: z.boolean(),
});

type KategoriSkpFormValues = z.infer<typeof kategoriSkpSchema>;

export default function MasterKategoriSkpPage() {
  const router = useRouter();
  const { hasPermission, isAdmin } = useAuth();

  const canRead =
    isAdmin ||
    hasPermission('simpeg.kinerja.read') ||
    hasPermission('simpeg.kinerja.manage') ||
    hasPermission('simpeg.master.manage');
  const canManage =
    isAdmin ||
    hasPermission('simpeg.kinerja.manage') ||
    hasPermission('simpeg.master.manage');

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<MasterKategoriSkp[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Sorting states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('urutan');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterKategoriSkp | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: async () => {},
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<KategoriSkpFormValues>({
    resolver: zodResolver(kategoriSkpSchema),
    defaultValues: {
      nama: '',
      kode: '',
      deskripsi: '',
      urutan: 1,
      is_active: true,
    },
  });

  // ── LOAD DATA ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getMasterKategoriSkpList({
        page,
        limit,
        search: search || undefined,
        is_active: filterStatus !== '' ? filterStatus : undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setDataList(res.data || []);
        setMeta(res.meta);
      } else {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setDataList(items);
      }
    } catch {
      toast.error('Gagal memuat master kategori SKP');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── ACTION HANDLERS ────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      nama: '',
      kode: '',
      deskripsi: '',
      urutan: (meta?.total ?? dataList.length) + 1,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MasterKategoriSkp) => {
    setEditingItem(item);
    reset({
      nama: item.nama,
      kode: item.kode,
      deskripsi: item.deskripsi || '',
      urutan: item.urutan ?? 0,
      is_active: Boolean(item.is_active),
    });
    setShowModal(true);
  };

  const onSubmit = async (values: KategoriSkpFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await simpegService.updateMasterKategoriSkp(editingItem.id, values);
        toast.success('Kategori SKP berhasil diperbarui');
      } else {
        await simpegService.createMasterKategoriSkp(values);
        toast.success('Kategori SKP baru berhasil ditambahkan');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori SKP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: MasterKategoriSkp) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Kategori Sasaran Kinerja',
      message: `Apakah Anda yakin ingin menghapus kategori SKP "${item.nama}" (${item.kode})? Rekaman butir sasaran kinerja pegawai yang merujuk kategori ini dapat terpengaruh.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteMasterKategoriSkp(item.id);
          toast.success('Kategori SKP berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus kategori SKP');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // ── TABLE COLUMNS ──────────────────────────────────────────
  const columns: ColumnDef<MasterKategoriSkp>[] = useMemo(
    () => [
      {
        key: 'urutan',
        label: 'No. Urut',
        align: 'center',
        render: (row) => (
          <span className="font-bold text-slate-700 text-sm">{row.urutan ?? '-'}</span>
        ),
      },
      {
        key: 'nama',
        label: 'Nama Kategori Sasaran Kinerja',
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900 text-sm">{row.nama}</div>
            <div className="text-xs font-mono text-slate-500">{row.kode}</div>
          </div>
        ),
      },
      {
        key: 'deskripsi',
        label: 'Deskripsi / Lingkup Tugas',
        render: (row) => (
          <span className="text-xs text-slate-600 line-clamp-2">
            {row.deskripsi || '-'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (row) => (
          <Badge variant={row.is_active ? 'green' : 'gray'}>
            {row.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        ),
      },
      {
        key: 'aksi',
        label: 'Aksi',
        align: 'right',
        render: (row) => {
          if (!canManage) return null;
          return (
            <div className="flex justify-end">
              <DropdownMenu
                items={[
                  {
                    label: 'Ubah Data',
                    icon: <Edit2 size={14} />,
                    onClick: () => handleOpenEdit(row),
                  },
                  {
                    label: 'Hapus Kategori',
                    icon: <Trash2 size={14} />,
                    onClick: () => handleDelete(row),
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage]
  );

  // Akses Ditolak
  if (!canRead) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Master Kategori SKP Tridharma"
          description="Akses ditolak"
          backUrl="/simpeg/kinerja"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <ShieldAlert size={56} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">Akses Terbatas</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk mengelola master kategori sasaran kinerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Master Kategori SKP Tridharma"
        description="Pengelolaan master kategori dan butir Sasaran Kinerja Pegawai (Tridharma Perguruan Tinggi & Penunjang) secara dinamis tanpa tergantung seeder."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/kinerja')}
            >
              Kembali ke Kinerja & SKP
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreate}
              >
                Tambah Kategori SKP
              </Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ListChecks size={20} className="text-[var(--module-primary)] shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Master Kategori SKP
              </h2>
              <p className="text-xs text-slate-500">
                Kategori ini tampil pada pilihan dropdown saat pegawai menyusun butir sasaran kinerja (SKP).
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Total: <strong>{meta?.total ?? dataList.length}</strong> Kategori
          </div>
        </div>

        <DataTable
          columns={columns}
          data={dataList}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          emptyMessage="Belum ada data kategori sasaran kinerja. Klik tombol 'Tambah Kategori SKP' di atas untuk membuat data baru."
        />
      </div>

      {/* DRAWER FILTER */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Kategori SKP"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pencarian Kata Kunci
            </label>
            <Input
              placeholder="Cari nama, kode, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Keaktifan
            </label>
            <Select
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'true', label: 'Hanya Aktif' },
                { value: 'false', label: 'Hanya Nonaktif' },
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val || '')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urutkan Berdasarkan
              </label>
              <Select
                options={[
                  { value: 'urutan', label: 'No. Urutan' },
                  { value: 'nama', label: 'Nama Kategori' },
                  { value: 'kode', label: 'Kode Kategori' },
                  { value: 'id', label: 'ID Kategori' },
                  { value: 'created_at', label: 'Tanggal Dibuat' },
                ]}
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val || 'urutan')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arah Urutan
              </label>
              <Select
                options={[
                  { value: 'asc', label: 'Menaik (A-Z / 1-9)' },
                  { value: 'desc', label: 'Menurun (Z-A / 9-1)' },
                ]}
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir((val as 'asc' | 'desc') || 'asc')}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterOrderBy('urutan');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setPage(1);
                setShowFilter(false);
                loadData();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* MODAL (CREATE / EDIT) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Ubah Kategori SKP' : 'Tambah Kategori SKP'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Kategori SKP <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Pendidikan dan Pengajaran"
                {...register('nama')}
                error={errors.nama?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kode Kategori <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: PENDIDIKAN"
                {...register('kode')}
                error={errors.kode?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. Urutan Tampilan <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="1"
                {...register('urutan', { valueAsNumber: true })}
                error={errors.urutan?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Deskripsi / Lingkup Tugas
              </label>
              <Input
                placeholder="Penjelasan butir kegiatan atau kriteria output..."
                {...register('deskripsi')}
                error={errors.deskripsi?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Select
                    options={[
                      { value: '1', label: 'Aktif (Muncul di Form Penyusunan SKP)' },
                      { value: '0', label: 'Nonaktif (Disembunyikan)' },
                    ]}
                    value={field.value ? '1' : '0'}
                    onChange={(val) => field.onChange(val === '1')}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingItem ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG HAPUS */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        isLoading={deleteConfirm.isLoading}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
      />
    </div>
  );
}
