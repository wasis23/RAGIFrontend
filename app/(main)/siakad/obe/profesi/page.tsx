'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

// Nilai tetap domain (closed-set, bukan tabel master): terpusat di satu lokasi.
const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama', label: 'Nama Profesi' },
  { value: 'sumber', label: 'Sumber' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z' },
  { value: 'desc', label: 'Z - A' },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const STATUS_FORM_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

// Validasi ketat Zod (Bahasa Indonesia), selaras kontrak backend ObeMasterController.
const profesiSchema = z.object({
  nama: z
    .string({ error: 'Nama profesi wajib diisi' })
    .trim()
    .min(1, 'Nama profesi wajib diisi')
    .max(255, 'Nama profesi maksimal 255 karakter'),
  sumber: z.string().trim().max(255, 'Sumber maksimal 255 karakter').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type ProfesiFormValues = z.infer<typeof profesiSchema>;

const DEFAULT_FORM: ProfesiFormValues = {
  nama: '',
  sumber: '',
  is_active: true,
};

export default function ProfesiKarirObePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    sortBy: 'nama',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfesiFormValues>({
    resolver: zodResolver(profesiSchema) as any,
    defaultValues: DEFAULT_FORM,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siakadService.getProfesiKarirList({
        search: appliedFilters.search || undefined,
        is_active: appliedFilters.status === '' ? undefined : appliedFilters.status === 'true',
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      if (res.data) {
        setItems(res.data);
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal memuat daftar profesi/prospek karir');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset(DEFAULT_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      nama: item.nama || '',
      sumber: item.sumber || '',
      is_active: item.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: ProfesiFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        nama: values.nama.trim(),
        sumber: values.sumber?.trim() || null,
        is_active: values.is_active,
      };
      if (editingItem) {
        await siakadService.updateProfesiKarir(editingItem.id, payload);
        toast.success('Prospek karir berhasil diperbarui');
      } else {
        await siakadService.createProfesiKarir(payload);
        toast.success('Prospek karir baru berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan prospek karir');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteProfesiKarir(deletingItem.id);
      toast.success('Prospek karir berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus prospek karir');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterSortBy('nama');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', status: '', sortBy: 'nama', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      status: filterStatus,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    {
      key: 'nama',
      label: 'PROFESI / PROSPEK KARIR',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama}</span>
          <span className="text-2xs text-slate-400 block">Sumber: {r.sumber || '-'}</span>
        </div>
      ),
    },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Prospek Karir', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Prospek Karir', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Profesi / Prospek Karir"
        description="Daftar profil profesi, lapangan pekerjaan, dan prospek karir lulusan program studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Profesi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Prospek Karir
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        emptyMessage="Belum ada data profesi/prospek karir terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Prospek Karir"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari profesi atau sumber..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select label="Status" value={filterStatus} onChange={(val) => setFilterStatus(val || '')} options={STATUS_FILTER_OPTIONS} />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(val || 'nama')} options={SORT_BY_OPTIONS} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')} options={SORT_DIR_OPTIONS} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Prospek Karir' : 'Tambah Prospek Karir'}>
        <form onSubmit={handleSubmit(handleSave)} noValidate className="space-y-4">
          <Input
            label="Nama Profesi *"
            placeholder="Contoh: Software Engineer / Database Administrator"
            error={errors.nama?.message}
            {...register('nama')}
          />
          <Input
            label="Sumber"
            placeholder="Contoh: SKKNI / IEEE / Asosiasi Profesi"
            hint="Opsional — referensi kerangka / dokumen acuan profesi"
            error={errors.sumber?.message}
            {...register('sumber')}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Select
                label="Status *"
                value={field.value ? 'true' : 'false'}
                onChange={(val) => field.onChange(val === 'true')}
                options={STATUS_FORM_OPTIONS}
                error={errors.is_active?.message}
              />
            )}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting}>{editingItem ? 'Simpan Perubahan' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Prospek Karir?"
        message={`Apakah Anda yakin ingin menghapus profesi ${deletingItem?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
