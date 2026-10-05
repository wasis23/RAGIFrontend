'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Filter, 
  Tag, 
  Building2, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Layers
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
  type KlasifikasiSurat, 
  type KategoriKlasifikasi,
  KATEGORI_KLASIFIKASI_OPTIONS,
  FILTER_KATEGORI_KLASIFIKASI_OPTIONS,
  STATUS_ACTIVE_OPTIONS,
  SORT_DIR_OPTIONS,
} from '@/types/arsip.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

const klasifikasiSchema = z.object({
  kategori: z.string().min(1, 'Kategori data wajib dipilih'),
  kode: z.string().min(1, 'Kode klasifikasi atau unit wajib diisi'),
  nama: z.string().min(1, 'Nama singkat wajib diisi'),
  keterangan: z.string().optional(),
  is_active: z.boolean(),
});

type KlasifikasiFormData = z.infer<typeof klasifikasiSchema>;

export default function MasterKlasifikasiPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('arsip.master.manage');

  const [data, setData] = useState<KlasifikasiSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Tab filter: all, unit, klasifikasi
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState('kode');
  const [sortDir, setSortDir] = useState('asc');

  // Modal Form (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KlasifikasiSurat | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<KlasifikasiFormData>({
    resolver: zodResolver(klasifikasiSchema),
    defaultValues: {
      kategori: 'unit',
      kode: '',
      nama: '',
      keterangan: '',
      is_active: true,
    },
  });

  // Delete Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KlasifikasiSurat | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchKlasifikasi = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
      };
      if (search) params.search = search;
      if (activeTab !== 'all') {
        params.kategori = activeTab;
      } else if (filterKategori) {
        params.kategori = filterKategori;
      }
      if (filterStatus) params.is_active = filterStatus;
      if (sortBy) params.sort_by = sortBy;
      if (sortDir) params.sort_dir = sortDir;

      const res = await arsipService.getKlasifikasiList(params);
      setData((res as any).data || []);
      setMeta((res as any).meta);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat master klasifikasi & unit surat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKlasifikasi();
  }, [page, limit, activeTab, filterKategori, filterStatus]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    reset({
      kategori: activeTab !== 'all' ? activeTab : 'unit',
      kode: '',
      nama: '',
      keterangan: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (row: KlasifikasiSurat) => {
    setEditingItem(row);
    reset({
      kategori: row.kategori,
      kode: row.kode,
      nama: row.nama,
      keterangan: row.keterangan || '',
      is_active: row.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: KlasifikasiFormData) => {
    try {
      setSubmitting(true);
      const payload: Partial<KlasifikasiSurat> = {
        kode: values.kode.toUpperCase().trim(),
        nama: values.nama.trim(),
        kategori: values.kategori,
        keterangan: values.keterangan?.trim() || null,
        is_active: values.is_active,
      };

      if (editingItem) {
        await arsipService.updateKlasifikasi(editingItem.id, payload);
        toast.success('Data klasifikasi berhasil diperbarui.');
      } else {
        await arsipService.storeKlasifikasi(payload);
        toast.success('Klasifikasi baru berhasil ditambahkan.');
      }

      setModalOpen(false);
      fetchKlasifikasi();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan data klasifikasi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setSubmittingDelete(true);
      await arsipService.deleteKlasifikasi(selectedItem.id);
      toast.success('Data klasifikasi berhasil dihapus.');
      setDeleteDialogOpen(false);
      fetchKlasifikasi();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus klasifikasi.'));
    } finally {
      setSubmittingDelete(false);
    }
  };

  const columns: ColumnDef<KlasifikasiSurat>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: KlasifikasiSurat, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE',
      render: (row: KlasifikasiSurat) => (
        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA',
      render: (row: KlasifikasiSurat) => (
        <span className="text-xs font-semibold text-slate-900">{row.nama}</span>
      ),
    },
    {
      key: 'bobot',
      label: 'BOBOT / KETERANGAN',
      render: (row: KlasifikasiSurat) => (
        <span className="text-xs text-slate-600">{row.keterangan || '-'}</span>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI',
      align: 'center',
      render: (row: KlasifikasiSurat) => (
        <Badge
          variant={row.kategori === 'unit' ? 'blue' : 'purple'}
          className="uppercase text-2xs font-semibold"
        >
          {row.kategori}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row: KlasifikasiSurat) => (
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
      render: (row: KlasifikasiSurat) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              ...(canManage
                ? [
                    {
                      label: 'Edit Klasifikasi',
                      icon: <Edit3 size={14} />,
                      onClick: () => handleOpenEditModal(row),
                    },
                    {
                      label: 'Hapus Klasifikasi',
                      icon: <Trash2 size={14} className="text-red-500" />,
                      variant: 'danger' as const,
                      onClick: () => {
                        setSelectedItem(row);
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
      {/* Page Header */}
      <PageHeader
        title="Master Kode Unit & Klasifikasi Surat"
        description="Kelola referensi kode unit pengaju dan kode klasifikasi persuratan kampus"
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
                Tambah Klasifikasi
              </Button>
            )}
          </div>
        }
      />

      {/* Category Tabs: rounded-top underline */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f0fdfa)] rounded-t-lg border-b-2 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Data
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('unit');
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'unit'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f0fdfa)] rounded-t-lg border-b-2 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kode Unit Pengelola
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('klasifikasi');
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'klasifikasi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f0fdfa)] rounded-t-lg border-b-2 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kode Klasifikasi Surat
        </button>
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
        emptyMessage="Belum ada data unit atau klasifikasi yang terdaftar."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter Master Klasifikasi"
        width="400px"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian Bebas"
            placeholder="Cari kode atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Kategori"
            value={filterKategori}
            onChange={(val) => setFilterKategori(val || '')}
            options={FILTER_KATEGORI_KLASIFIKASI_OPTIONS}
          />

          <Select
            label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={STATUS_ACTIVE_OPTIONS}
          />

          {/* Sort By & Sort Direction dalam format grid 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val || 'kode')}
              options={[
                { value: 'kode', label: 'Kode' },
                { value: 'nama', label: 'Nama Singkat' },
                { value: 'kategori', label: 'Kategori' },
                { value: 'created_at', label: 'Waktu Dibuat' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val) => setSortDir(val || 'asc')}
              options={SORT_DIR_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearch('');
                setFilterKategori('');
                setFilterStatus('');
                setSortBy('kode');
                setSortDir('asc');
                setPage(1);
                setDrawerOpen(false);
                setTimeout(fetchKlasifikasi, 50);
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
                fetchKlasifikasi();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Form: Add / Edit (<= 5 inputs) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Data Klasifikasi' : 'Tambah Klasifikasi / Unit'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="kategori"
            control={control}
            render={({ field }) => (
              <Select
                label="Kategori Data"
                value={field.value}
                onChange={field.onChange}
                options={KATEGORI_KLASIFIKASI_OPTIONS}
                error={errors.kategori?.message}
              />
            )}
          />

          <Input
            label="Kode Klasifikasi / Unit *"
            placeholder="Contoh: DI, DII, DIII atau REK"
            error={errors.kode?.message}
            {...register('kode')}
          />

          <Input
            label="Nama Singkat *"
            placeholder="Contoh: SK, ST/SPPD, Permohonan, BAAK"
            error={errors.nama?.message}
            {...register('nama')}
          />

          <Input
            label="Bobot / Deskripsi Lengkap (Opsional)"
            placeholder="Contoh: Surat Tugas/Surat Perjalanan Dinas"
            error={errors.keterangan?.message}
            {...register('keterangan')}
          />

          <div className="pt-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_active_item"
                  label="Status Aktif (dapat dipilih pada saat pembuatan nomor surat)"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
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
              Simpan Data
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Klasifikasi"
        message={
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin menghapus klasifikasi{' '}
            <strong className="text-slate-900">{selectedItem?.kode} - {selectedItem?.nama}</strong>?
          </p>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={submittingDelete}
      />
    </div>
  );
}
