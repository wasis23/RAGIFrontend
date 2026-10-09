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
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import toast from 'react-hot-toast';

// Nilai tetap domain (closed-set, bukan entitas master): terpusat sekali.
const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'kode_cpl', label: 'Kode CPL' },
  { value: 'kategori', label: 'Kategori' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z' },
  { value: 'desc', label: 'Z - A' },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const STATUS_FORM_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const cplSchema = z.object({
  kurikulum_id: z.coerce.number({ error: 'Kurikulum wajib dipilih' }).int().min(1, 'Kurikulum wajib dipilih'),
  kode_cpl: z
    .string({ error: 'Kode CPL wajib diisi' })
    .trim()
    .min(2, 'Kode CPL minimal 2 karakter')
    .max(50, 'Kode CPL maksimal 50 karakter'),
  kategori: z.array(z.string()).min(1, 'Pilih minimal satu kategori'),
  deskripsi: z
    .string({ error: 'Deskripsi wajib diisi' })
    .trim()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter'),
  is_active: z.boolean(),
});

type CplFormValues = z.infer<typeof cplSchema>;

const DEFAULT_FORM: CplFormValues = {
  kurikulum_id: 0,
  kode_cpl: '',
  kategori: [],
  deskripsi: '',
  is_active: true,
};

const normalizeKategoriValue = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export default function PerumusanCplProdiPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('kode_cpl');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    kategori: '',
    status: '',
    sortBy: 'kode_cpl',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedKurikulumRaw, setSelectedKurikulumRaw] = useState<any | null>(null);

  const kategoriOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.KATEGORI_CPL);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CplFormValues>({
    resolver: zodResolver(cplSchema) as any,
    defaultValues: DEFAULT_FORM,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getCpls({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId || undefined,
        kategori: appliedFilters.kategori || undefined,
        is_active: appliedFilters.status === '' ? undefined : appliedFilters.status === 'aktif',
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
      toast.error('Gagal memuat perumusan CPL prodi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const kategoriLabel = (val: string) => {
    const norm = normalizeKategoriValue(val);
    if (!norm) return '-';
    const found = kategoriOptions.find((o) => normalizeKategoriValue(o.value) === norm);
    if (found) return found.label;
    return String(val).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const kategoriListOf = (r: any): string[] => {
    if (Array.isArray(r.jenis_list) && r.jenis_list.length > 0) return r.jenis_list.map((v: any) => normalizeKategoriValue(v)).filter(Boolean);
    if (r.kategori) return [normalizeKategoriValue(r.kategori)];
    return [];
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedKurikulumRaw(null);
    reset(DEFAULT_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setSelectedKurikulumRaw(item.kurikulum || null);
    reset({
      kurikulum_id: item.kurikulum_id ? Number(item.kurikulum_id) : 0,
      kode_cpl: item.kode_cpl || '',
      kategori: kategoriListOf(item),
      deskripsi: item.deskripsi || '',
      is_active: item.is_active ?? true,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CplFormValues) => {
    try {
      const prodiId =
        selectedKurikulumRaw?.program_studi_id ||
        selectedKurikulumRaw?.programStudi?.id ||
        editingItem?.program_studi_id ||
        undefined;
      const selected = values.kategori.map(normalizeKategoriValue).filter(Boolean);
      const payload = {
        program_studi_id: prodiId,
        kurikulum_id: Number(values.kurikulum_id),
        kode_cpl: values.kode_cpl.trim(),
        kategori: selected[0],
        jenis_list: selected,
        deskripsi: values.deskripsi.trim(),
        is_active: values.is_active,
      };
      if (editingItem) {
        await siakadService.updateCpl(editingItem.id, payload);
        toast.success('Rumusan CPL Prodi berhasil diperbarui');
      } else {
        await siakadService.storeCpl(payload);
        toast.success('Rumusan CPL Prodi berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan rumusan CPL');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteCpl(deletingItem.id);
      toast.success('Rumusan CPL berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus CPL');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterKategori('');
    setFilterStatus('');
    setFilterSortBy('kode_cpl');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', kurikulumId: '', kategori: '', status: '', sortBy: 'kode_cpl', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      kategori: filterKategori,
      status: filterStatus,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const getProdiNama = (r: any) =>
    r.program_studi?.nama || r.programStudi?.nama || r.kurikulum?.program_studi?.nama || r.kurikulum?.programStudi?.nama || '-';
  const getProdiKode = (r: any) =>
    r.program_studi?.kode_prodi || r.programStudi?.kode_prodi || r.kurikulum?.program_studi?.kode_prodi || r.kurikulum?.programStudi?.kode_prodi || '-';

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    {
      key: 'kode_cpl',
      label: 'KODE CPL',
      render: (r) => {
        const list = kategoriListOf(r);
        return (
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs block">{r.kode_cpl}</span>
            <span className="flex flex-wrap gap-1 mt-1">
              {list.length > 0 ? (
                list.map((k) => (
                  <Badge key={k} variant="blue" className="text-[10px] uppercase">{kategoriLabel(k)}</Badge>
                ))
              ) : (
                <span className="text-2xs text-slate-400">-</span>
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI CPL PRODI',
      render: (r) => <span className="font-medium text-slate-800 text-xs block leading-relaxed">{r.deskripsi}</span>,
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
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{getProdiNama(r)}</span>
          <span className="text-2xs text-slate-400 font-mono block">{getProdiKode(r)}</span>
        </div>
      ),
    },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => (r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge>) },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit CPL', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus CPL', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Perumusan CPL Prodi"
        description="Perumusan Capaian Pembelajaran Lulusan (CPL) program studi dan pengelompokan jenis aspek SN-DIKTI."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'CPL Prodi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Rumusan CPL Prodi
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
        emptyMessage="Belum ada rumusan CPL prodi yang terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter CPL Prodi"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode atau deskripsi CPL..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <AsyncSelect
            label="Kurikulum"
            placeholder="Semua kurikulum..."
            loadOptions={loadKurikulumOptions}
            value={filterKurikulumId ? Number(filterKurikulumId) : null}
            onChange={(opt: any) => setFilterKurikulumId(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Kategori"
              placeholder="Semua Kategori"
              options={[{ value: '', label: 'Semua Kategori' }, ...kategoriOptions]}
              value={filterKategori}
              onChange={(val) => setFilterKategori(String(val || ''))}
              isClearable
            />
            <Select
              label="Status"
              options={STATUS_FILTER_OPTIONS}
              value={filterStatus}
              onChange={(val) => setFilterStatus(String(val || ''))}
              isClearable
            />
          </div>
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(String(val || 'kode_cpl'))} options={SORT_BY_OPTIONS} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')} options={SORT_DIR_OPTIONS} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Rumusan CPL Prodi' : 'Tambah Rumusan CPL Prodi'} size="lg">
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
                    onChange={(opt: any) => {
                      field.onChange(Number(opt?.value) || 0);
                      setSelectedKurikulumRaw(opt?.raw || null);
                    }}
                    error={errors.kurikulum_id?.message}
                  />
                )}
              />
            </div>
            <Input label="Kode CPL Prodi *" placeholder="Contoh: CPL-01" error={errors.kode_cpl?.message} {...register('kode_cpl')} />
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status *"
                  options={STATUS_FORM_OPTIONS}
                  value={field.value ? 'true' : 'false'}
                  onChange={(val: any) => field.onChange(val === 'true')}
                  error={errors.is_active?.message}
                />
              )}
            />
            <div className="md:col-span-2">
              <Controller
                name="kategori"
                control={control}
                render={({ field }) => {
                  const selected: string[] = Array.isArray(field.value) ? field.value : [];
                  const toggle = (val: string) => {
                    const norm = normalizeKategoriValue(val);
                    field.onChange(selected.includes(norm) ? selected.filter((v) => v !== norm) : [...selected, norm]);
                  };
                  return (
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-2">Kategori * <span className="font-normal text-slate-400">(pilih banyak)</span></span>
                      {kategoriOptions.length === 0 ? (
                        <p className="text-2xs text-slate-400">Data kategori belum tersedia di master referensi.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {kategoriOptions.map((opt) => (
                            <Checkbox
                              key={opt.value}
                              label={opt.label}
                              checked={selected.includes(normalizeKategoriValue(opt.value))}
                              onChange={() => toggle(opt.value)}
                            />
                          ))}
                        </div>
                      )}
                      {errors.kategori?.message && <p className="form-error mt-1">{errors.kategori.message}</p>}
                    </div>
                  );
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Deskripsi CPL *" placeholder="Tuliskan deskripsi lengkap capaian pembelajaran..." rows={4} error={errors.deskripsi?.message} {...register('deskripsi')} />
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
        title="Hapus CPL Prodi?"
        message={`Apakah Anda yakin ingin menghapus CPL ${deletingItem?.kode_cpl}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
