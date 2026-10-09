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

// Nilai tetap domain (closed-set, bukan entitas master): terpusat sekali.
const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'kode_bk', label: 'Kode BK' },
  { value: 'nama_bk', label: 'Rumusan' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z' },
  { value: 'desc', label: 'Z - A' },
];

const bahanKajianSchema = z.object({
  kurikulum_id: z.coerce.number({ error: 'Kurikulum wajib dipilih' }).int().min(1, 'Kurikulum wajib dipilih'),
  kode_bk: z
    .string({ error: 'Kode wajib diisi' })
    .trim()
    .min(2, 'Kode minimal 2 karakter')
    .max(50, 'Kode maksimal 50 karakter'),
  nama_bk: z
    .string({ error: 'Rumusan wajib diisi' })
    .trim()
    .min(3, 'Rumusan minimal 3 karakter')
    .max(255, 'Rumusan maksimal 255 karakter'),
  koordinator_id: z.coerce.number().int().positive().optional().nullable(),
  deskripsi: z.string().trim().max(2000, 'Keterangan maksimal 2000 karakter').optional().or(z.literal('')),
});

type BahanKajianFormValues = z.infer<typeof bahanKajianSchema>;

const DEFAULT_FORM: BahanKajianFormValues = {
  kurikulum_id: 0,
  kode_bk: '',
  nama_bk: '',
  koordinator_id: null,
  deskripsi: '',
};

export default function BahanKajianPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterKoordinatorId, setFilterKoordinatorId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('kode_bk');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    koordinatorId: '',
    sortBy: 'kode_bk',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BahanKajianFormValues>({
    resolver: zodResolver(bahanKajianSchema) as any,
    defaultValues: DEFAULT_FORM,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getBahanKajians({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId || undefined,
        koordinator_id: appliedFilters.koordinatorId || undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      if (res.data) {
        const raw = res.data;
        setItems(Array.isArray(raw) ? raw : (raw.items || []));
        if (res.meta) setMeta(res.meta);
        else if (Array.isArray(raw)) {
          setMeta({ current_page: 1, per_page: raw.length, total: raw.length, last_page: 1, from: 1, to: raw.length });
        }
      }
    } catch {
      toast.error('Gagal memuat rumusan bahan kajian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, page, limit]);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((k: any) => ({
        value: k.id,
        label: `${k.nama || k.kode || `Kurikulum #${k.id}`}${k.tahun_berlaku ? ` — ${k.tahun_berlaku}` : ''}`,
        raw: k,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadKoordinatorOptions = useCallback(async (keyword: string) => {
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
    reset(DEFAULT_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      kurikulum_id: item.kurikulum_id ? Number(item.kurikulum_id) : 0,
      kode_bk: item.kode_bk || '',
      nama_bk: item.nama_bk || '',
      koordinator_id: item.koordinator_id ? Number(item.koordinator_id) : null,
      deskripsi: item.deskripsi || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: BahanKajianFormValues) => {
    try {
      // Program studi tidak dikirim: backend menurunkannya dari kurikulum,
      // atau dari prodi aktif milik user bila kurikulum kosong.
      const payload = {
        kurikulum_id: Number(values.kurikulum_id),
        kode_bk: values.kode_bk.trim(),
        nama_bk: values.nama_bk.trim(),
        koordinator_id: values.koordinator_id ? Number(values.koordinator_id) : null,
        deskripsi: values.deskripsi?.trim() || null,
      };
      if (editingItem) {
        await siakadService.updateBahanKajian(editingItem.id, payload);
        toast.success('Rumusan bahan kajian berhasil diperbarui');
      } else {
        await siakadService.storeBahanKajian(payload);
        toast.success('Rumusan bahan kajian berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan rumusan bahan kajian');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteBahanKajian(deletingItem.id);
      toast.success('Bahan kajian berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus bahan kajian');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterKoordinatorId('');
    setFilterSortBy('kode_bk');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', kurikulumId: '', koordinatorId: '', sortBy: 'kode_bk', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      koordinatorId: filterKoordinatorId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    {
      key: 'kode_bk',
      label: 'KODE BK',
      render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_bk}</span>,
    },
    {
      key: 'nama_bk',
      label: 'RUMUSAN BAHAN KAJIAN',
      render: (r) => <span className="font-medium text-slate-800 text-xs block leading-relaxed">{r.nama_bk}</span>,
    },
    {
      key: 'kurikulum',
      label: 'KURIKULUM',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.kurikulum?.nama || r.kurikulum?.kode || '-'}</span>
          <span className="text-2xs text-slate-400 font-mono block">{r.kurikulum?.tahun_berlaku || '-'}</span>
        </div>
      ),
    },
    {
      key: 'koordinator',
      label: 'KOORDINATOR',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.koordinator?.nama_lengkap || '-'}</span>
          <span className="text-2xs text-slate-400 font-mono block">
            {r.koordinator?.nik || r.koordinator?.nidn || r.koordinator?.nip || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'pemetaan',
      label: 'PEMETAAN',
      align: 'center',
      render: (r) => (
        <div className="flex flex-col gap-1 items-center">
          <Badge variant="blue" className="text-2xs">{r.cpls?.length || 0} CPL</Badge>
          <Badge variant="green" className="text-2xs">{r.mata_kuliahs?.length || 0} MK</Badge>
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Bahan Kajian', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Bahan Kajian', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Perumusan Bahan Kajian"
        description="Perumusan bahan kajian (BK) prodi beserta kurikulum acuan dan dosen koordinator."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Perumusan BK' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Rumusan BK
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
        emptyMessage="Belum ada rumusan bahan kajian yang terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Perumusan BK"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode atau rumusan..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <AsyncSelect
            label="Kurikulum"
            placeholder="Semua kurikulum..."
            loadOptions={loadKurikulumOptions}
            value={filterKurikulumId ? Number(filterKurikulumId) : null}
            onChange={(opt: any) => setFilterKurikulumId(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <AsyncSelect
            label="Koordinator"
            placeholder="Semua koordinator..."
            loadOptions={loadKoordinatorOptions}
            value={filterKoordinatorId ? Number(filterKoordinatorId) : null}
            onChange={(opt: any) => setFilterKoordinatorId(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(String(val || 'kode_bk'))} options={SORT_BY_OPTIONS} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')} options={SORT_DIR_OPTIONS} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Rumusan Bahan Kajian' : 'Tambah Rumusan Bahan Kajian'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Controller
                name="kurikulum_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Kurikulum *"
                    placeholder="Cari kurikulum..."
                    loadOptions={loadKurikulumOptions}
                    value={field.value || null}
                    onChange={(opt: any) => field.onChange(Number(opt?.value) || 0)}
                    error={errors.kurikulum_id?.message}
                  />
                )}
              />
              <p className="text-2xs text-slate-400 mt-1">
                Program studi menyesuaikan otomatis mengikuti kurikulum yang dipilih.
              </p>
            </div>
            <Input label="Kode *" placeholder="Contoh: BK-01" error={errors.kode_bk?.message} {...register('kode_bk')} />
            <Controller
              name="koordinator_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Koordinator"
                  placeholder="Cari nama / NIK dosen..."
                  loadOptions={loadKoordinatorOptions}
                  value={field.value || null}
                  onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                  error={errors.koordinator_id?.message}
                  isClearable
                />
              )}
            />
            <div className="md:col-span-2">
              <Textarea label="Rumusan *" placeholder="Rumusan bahan kajian..." rows={3} error={errors.nama_bk?.message} {...register('nama_bk')} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Keterangan" placeholder="Catatan tambahan (opsional)" rows={2} error={errors.deskripsi?.message} {...register('deskripsi')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>{editingItem ? 'Simpan Perubahan' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Bahan Kajian?"
        message={`Apakah Anda yakin ingin menghapus bahan kajian ${deletingItem?.kode_bk}? Seluruh pemetaan CPL dan MK pada bahan kajian ini ikut dilepas.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
