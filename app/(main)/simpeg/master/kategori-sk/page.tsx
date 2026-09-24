'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus, Filter, Edit2, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
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
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import type { MasterKategoriSk } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

const kategoriSkSchema = z.object({
  nama: z.string().min(1, 'Nama kategori SK wajib diisi'),
  kode: z.string().min(1, 'Kode kategori SK wajib diisi'),
  urutan: z.number().min(0, 'Nomor urutan minimal 0'),
  deskripsi: z.string().optional(),
  is_active: z.boolean(),
});

type KategoriSkFormValues = z.infer<typeof kategoriSkSchema>;

export default function MasterKategoriSkPage() {
  const { hasPermission, isAdmin, isSuperAdmin, hasRole } = useAuth();
  const canRead =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.sk_pegawai.read') ||
    hasPermission('simpeg.sk.read') ||
    hasPermission('simpeg.sk_pegawai.manage');
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.sk_pegawai.manage') ||
    hasPermission('simpeg.sk_pegawai.create');

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<MasterKategoriSk[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('urutan');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  // Modal & Confirm States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterKategoriSk | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; nama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<KategoriSkFormValues>({
    resolver: zodResolver(kategoriSkSchema),
    defaultValues: {
      nama: '',
      kode: '',
      urutan: 1,
      deskripsi: '',
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
      if (search) params.search = search;
      if (filterStatus) params.is_active = filterStatus;

      const res = await simpegService.getMasterKategoriSkList(params);
      setDataList(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master kategori SK');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      nama: '',
      kode: '',
      urutan: (dataList.length > 0 ? Math.max(...dataList.map((d) => d.urutan || 0)) + 1 : 1),
      deskripsi: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: MasterKategoriSk) => {
    setEditingItem(item);
    reset({
      nama: item.nama,
      kode: item.kode,
      urutan: item.urutan,
      deskripsi: item.deskripsi || '',
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  // Submit
  const onSubmit = async (values: KategoriSkFormValues) => {
    try {
      if (editingItem) {
        await simpegService.updateMasterKategoriSk(editingItem.id, values);
        toast.success('Kategori SK berhasil diperbarui');
      } else {
        await simpegService.createMasterKategoriSk(values);
        toast.success('Kategori SK berhasil ditambahkan');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan kategori SK');
    }
  };

  // Delete
  const handleDeleteClick = (id: number, nama: string) => {
    setItemToDelete({ id, nama });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await simpegService.deleteMasterKategoriSk(itemToDelete.id);
      toast.success('Kategori SK berhasil dihapus');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus kategori SK');
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns
  const columns: ColumnDef<MasterKategoriSk>[] = [
    {
      key: 'nama',
      label: 'KODE & NAMA KATEGORI',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono tracking-wider">{row.kode}</span>
        </div>
      ),
    },
    {
      key: 'urutan',
      label: 'NO. URUT',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
          {row.urutan}
        </span>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI',
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2">{row.deskripsi || '-'}</p>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'gray'} className="text-2xs">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'AKSI',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleDeleteClick(row.id, row.nama),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full flex-col grid-cols-1 gap-4 space-y-4">
      <PageHeader
        title="Master Kategori SK Pegawai"
        description="Kelola jenis pengelompokan Surat Keputusan (SK) resmi seperti SK Pengangkatan, Jabatan, Mutasi, dan Tugas Belajar."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-2 border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              <Filter size={16} />
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                onClick={handleOpenCreate}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Tambah Kategori SK
              </Button>
            )}
          </div>
        }
      />

      {/* Banner Pintas ke Arsip SK */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[var(--module-primary)]" />
          <span>Kategori yang terdaftar di sini otomatis muncul sebagai pilihan pada form pengarsipan SK Pegawai.</span>
        </div>
        <Link
          href="/simpeg/sk-pegawai"
          className="font-medium text-[var(--module-primary)] hover:underline inline-flex items-center gap-2 shrink-0"
        >
          Buka Arsip SK Pegawai
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* DataTable */}
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
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Kategori SK"
      >
        <div className="space-y-4">
          <Input
            label="Cari Kata Kunci"
            placeholder="Cari nama atau kode SK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Status Kategori"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={[
              { value: '', label: '-- Semua Status --' },
              { value: '1', label: 'Hanya Aktif' },
              { value: '0', label: 'Hanya Nonaktif' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val || 'urutan')}
              options={[
                { value: 'urutan', label: 'No. Urutan' },
                { value: 'nama', label: 'Nama Kategori' },
                { value: 'kode', label: 'Kode SK' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir((val as 'asc' | 'desc') || 'asc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterOrderBy('urutan');
                setFilterOrderDir('asc');
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowFilter(false);
                setPage(1);
                loadData();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Create / Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Kategori SK' : 'Tambah Kategori SK'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Kategori SK *"
                placeholder="Contoh: SK Pengangkatan Pegawai Tetap"
                error={errors.nama?.message}
                {...register('nama')}
              />
            </div>
            <Input
              label="Kode Kategori SK *"
              placeholder="Contoh: SK_TETAP"
              error={errors.kode?.message}
              {...register('kode')}
            />
            <Input
              type="number"
              label="Nomor Urutan Tampilan *"
              placeholder="1"
              error={errors.urutan?.message}
              {...register('urutan', { valueAsNumber: true })}
            />
            <div className="md:col-span-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status Tampil *"
                    value={field.value ? 'true' : 'false'}
                    onChange={(val) => field.onChange(val === 'true')}
                    options={[
                      { value: 'true', label: 'Aktif (Dapat Dipilih di Form Arsip SK)' },
                      { value: 'false', label: 'Nonaktif (Disembunyikan)' },
                    ]}
                  />
                )}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Deskripsi / Catatan"
                placeholder="Penjelasan fungsi kategori SK ini..."
                rows={3}
                {...register('deskripsi')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {editingItem ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori SK"
        message={`Apakah Anda yakin ingin menghapus kategori SK "${itemToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
