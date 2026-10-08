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
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

// Nilai tetap domain (closed-set, bukan entitas master): dideklarasikan terpusat sekali.
const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama_rumpun', label: 'Nama Rumpun' },
  { value: 'kode_rumpun', label: 'Kode Rumpun' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z' },
  { value: 'desc', label: 'Z - A' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const STATUS_FORM_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const rumpunSchema = z.object({
  nama_rumpun: z
    .string({ error: 'Nama rumpun wajib diisi' })
    .trim()
    .min(3, 'Nama rumpun minimal 3 karakter')
    .max(150, 'Nama rumpun maksimal 150 karakter'),
  kode_rumpun: z
    .string()
    .trim()
    .max(50, 'Kode maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  dosen_koordinator_id: z.number().int().positive().optional().nullable(),
  deskripsi: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type RumpunFormValues = z.infer<typeof rumpunSchema>;

const DEFAULT_FORM: RumpunFormValues = {
  nama_rumpun: '',
  kode_rumpun: '',
  dosen_koordinator_id: null,
  deskripsi: '',
  is_active: true,
};

export default function RumpunMkPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDosenId, setFilterDosenId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_rumpun');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    dosenId: '',
    status: '',
    sortBy: 'nama_rumpun',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDosenRaw, setSelectedDosenRaw] = useState<any | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RumpunFormValues>({
    resolver: zodResolver(rumpunSchema),
    defaultValues: DEFAULT_FORM,
  });

  const watchedDosenId = watch('dosen_koordinator_id');
  const nikDosen = selectedDosenRaw?.nik || selectedDosenRaw?.nidn || selectedDosenRaw?.nip || '-';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getRumpunMataKuliah({
        search: appliedFilters.search || undefined,
        dosen_koordinator_id: appliedFilters.dosenId || undefined,
        is_active: appliedFilters.status === '' ? undefined : appliedFilters.status === 'true',
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        limit,
      });
      if (res.data) {
        setItems(res.data);
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal memuat rumpun mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const loadDosenOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({
        per_page: 50,
        search: keyword || undefined,
        is_active: true,
      });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      const q = keyword.toLowerCase();
      return list
        .filter((d: any) =>
          !keyword
            ? true
            : d.nama_lengkap?.toLowerCase().includes(q) ||
              d.nik?.includes(keyword) ||
              d.nidn?.includes(keyword) ||
              d.nip?.includes(keyword),
        )
        .map((d: any) => ({
          value: d.id,
          label: `${d.nama_lengkap} — ${d.nik || d.nidn || d.nip || '-'}`,
          raw: d,
        }));
    } catch {
      return [];
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedDosenRaw(null);
    reset(DEFAULT_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    const d = item.dosen_koordinator || null;
    setSelectedDosenRaw(d);
    reset({
      nama_rumpun: item.nama_rumpun || '',
      kode_rumpun: item.kode_rumpun || '',
      dosen_koordinator_id: item.dosen_koordinator_id ? Number(item.dosen_koordinator_id) : null,
      deskripsi: item.deskripsi || '',
      is_active: item.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: RumpunFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        nama_rumpun: values.nama_rumpun.trim(),
        kode_rumpun: values.kode_rumpun?.trim() || undefined,
        dosen_koordinator_id: values.dosen_koordinator_id ? Number(values.dosen_koordinator_id) : null,
        deskripsi: values.deskripsi?.trim() || null,
        is_active: values.is_active,
      };
      if (editingItem) {
        await siakadService.updateRumpunMataKuliah(editingItem.id, payload);
        toast.success('Rumpun mata kuliah berhasil diperbarui');
      } else {
        await siakadService.createRumpunMataKuliah(payload);
        toast.success('Rumpun mata kuliah berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan rumpun');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteRumpunMataKuliah(deletingItem.id);
      toast.success('Rumpun mata kuliah berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus rumpun');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterDosenId('');
    setFilterStatus('');
    setFilterSortBy('nama_rumpun');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', dosenId: '', status: '', sortBy: 'nama_rumpun', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      dosenId: filterDosenId,
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
      key: 'nama_rumpun',
      label: 'RUMPUN',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama_rumpun}</span>
          <span className="text-2xs text-slate-400 font-mono block">{r.kode_rumpun || '-'}</span>
        </div>
      ),
    },
    {
      key: 'dosen_koordinator',
      label: 'DOSEN KOORDINATOR',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.dosen_koordinator?.nama_lengkap || '-'}</span>
          <span className="text-2xs text-slate-400 font-mono block">NIK: {r.dosen_koordinator?.nik || r.dosen_koordinator?.nidn || r.dosen_koordinator?.nip || '-'}</span>
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
              { label: 'Edit Rumpun', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Rumpun', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rumpun Mata Kuliah"
        description="Klasifikasi dan pengelompokan rumpun mata kuliah beserta dosen koordinator bidang."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Rumpun Mata Kuliah' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Rumpun Mata Kuliah
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
        emptyMessage="Belum ada rumpun mata kuliah yang terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Rumpun Mata Kuliah"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode / nama rumpun..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <AsyncSelect
            label="Dosen Koordinator"
            placeholder="Semua dosen..."
            loadOptions={loadDosenOptions}
            value={filterDosenId ? Number(filterDosenId) : null}
            onChange={(opt: any) => setFilterDosenId(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <Select label="Status" value={filterStatus} onChange={(val) => setFilterStatus(val || '')} options={STATUS_OPTIONS} />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(val || 'nama_rumpun')} options={SORT_BY_OPTIONS} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')} options={SORT_DIR_OPTIONS} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Rumpun Mata Kuliah' : 'Tambah Rumpun Mata Kuliah'} size="lg">
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Rumpun *"
                placeholder="Masukkan nama rumpun mata kuliah..."
                error={errors.nama_rumpun?.message}
                {...register('nama_rumpun')}
              />
            </div>
            <Input
              label="Kode Rumpun"
              placeholder="Otomatis bila dikosongkan..."
              hint="Kosongkan untuk kode otomatis"
              error={errors.kode_rumpun?.message}
              {...register('kode_rumpun')}
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
            <div className="md:col-span-2">
              <Controller
                name="dosen_koordinator_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Dosen Koordinator"
                    placeholder="Cari nama / NIK / NIDN dosen..."
                    loadOptions={loadDosenOptions}
                    value={field.value ? Number(field.value) : null}
                    onChange={(opt: any) => {
                      field.onChange(opt?.value ? Number(opt.value) : null);
                      setSelectedDosenRaw(opt?.raw || null);
                    }}
                    error={errors.dosen_koordinator_id?.message}
                    isClearable
                    formatOptionLabel={(opt: any) => (
                      <div>
                        <span className="block font-semibold">{opt.raw?.nama_lengkap || opt.label}</span>
                        <span className="block text-xs text-slate-500">
                          NIK {opt.raw?.nik || opt.raw?.nidn || opt.raw?.nip || '-'}
                        </span>
                      </div>
                    )}
                  />
                )}
              />
              {!!watchedDosenId && (
                <p className="text-2xs text-slate-400 font-mono mt-1">NIK: {nikDosen}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Deskripsi"
                placeholder="Keterangan singkat cakupan rumpun..."
                rows={3}
                error={errors.deskripsi?.message}
                {...register('deskripsi')}
              />
            </div>
          </div>

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
        title="Hapus Rumpun?"
        message={`Apakah Anda yakin ingin menghapus rumpun ${deletingItem?.nama_rumpun}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
