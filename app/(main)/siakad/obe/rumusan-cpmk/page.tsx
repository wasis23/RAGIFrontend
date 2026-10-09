'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const cpmkProdiSchema = z.object({
  kurikulum_id: z.number({ error: 'Kurikulum wajib dipilih' }).min(1, 'Kurikulum wajib dipilih'),
  cpl_id: z.number({ error: 'CPL Prodi wajib dipilih' }).min(1, 'CPL Prodi wajib dipilih'),
  kode_cpmk: z
    .string()
    .trim()
    .min(1, 'Kode CPMK wajib diisi')
    .max(50, 'Kode CPMK maksimal 50 karakter'),
  deskripsi: z
    .string()
    .trim()
    .min(1, 'Rumusan CPMK wajib diisi')
    .max(2000, 'Rumusan CPMK maksimal 2000 karakter'),
});

type CpmkProdiFormValues = z.infer<typeof cpmkProdiSchema>;

const DEFAULT_FORM_VALUES: CpmkProdiFormValues = {
  kurikulum_id: 0,
  cpl_id: 0,
  kode_cpmk: '',
  deskripsi: '',
};

export default function RumusanCpmkPage() {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('kode_cpmk');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    sortBy: 'kode_cpmk',
    sortDir: 'asc' as 'asc' | 'desc',
  });
  const [showFilter, setShowFilter] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CpmkProdiFormValues>({
    resolver: zodResolver(cpmkProdiSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const watchedKurikulumId = watch('kurikulum_id');

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

  // Opsi CPL dimuat dinamis bergantung pada kurikulum yang dipilih di form.
  const loadCplOptions = useCallback(
    async (keyword: string) => {
      try {
        const res = await siakadService.getCpls({
          kurikulum_id: watchedKurikulumId ? Number(watchedKurikulumId) : undefined,
          search: keyword || undefined,
          per_page: 100,
        });
        const raw = res?.data;
        const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        return list.map((c: any) => ({
          value: c.id,
          label: `${c.kode_cpl || `CPL #${c.id}`} — ${c.deskripsi ? c.deskripsi.slice(0, 60) + '...' : c.kategori || ''}`,
          raw: c,
        }));
      } catch {
        return [];
      }
    },
    [watchedKurikulumId],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siakadService.getCpmkProdis({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId ? Number(appliedFilters.kurikulumId) : undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      if (res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal memuat rumusan CPMK program studi');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset(DEFAULT_FORM_VALUES);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      kurikulum_id: Number(item.kurikulum_id) || 0,
      cpl_id: Number(item.cpl_id) || 0,
      kode_cpmk: item.kode_cpmk || '',
      deskripsi: item.deskripsi || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CpmkProdiFormValues) => {
    setSaving(true);
    try {
      if (editingItem?.id) {
        await siakadService.updateCpmkProdi(editingItem.id, values);
        toast.success('Rumusan CPMK berhasil diperbarui');
      } else {
        await siakadService.createCpmkProdi(values);
        toast.success('Rumusan CPMK baru berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan rumusan CPMK');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;
    setDeleting(true);
    try {
      await siakadService.deleteCpmkProdi(deletingItem.id);
      toast.success('Rumusan CPMK berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus rumusan CPMK');
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterSortBy('kode_cpmk');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', kurikulumId: '', sortBy: 'kode_cpmk', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_cpmk',
      label: 'KODE',
      sortable: true,
      render: (row: any) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.kode_cpmk}</span>
          <span className="text-2xs text-slate-500 block">
            {row.kurikulum?.nama || row.kurikulum?.kode || `Kurikulum #${row.kurikulum_id}`}
          </span>
        </div>
      ),
    },
    {
      key: 'cpl_id',
      label: 'CPL PRODI',
      render: (row: any) => (
        <div>
          <span className="font-mono font-bold text-slate-800 text-xs block">{row.cpl?.kode_cpl || '-'}</span>
          {row.cpl?.deskripsi && (
            <span className="text-2xs text-slate-500 line-clamp-1 block">{row.cpl.deskripsi}</span>
          )}
        </div>
      ),
    },
    {
      key: 'deskripsi',
      label: 'RUMUSAN CPMK',
      render: (row: any) => <span className="text-xs text-slate-700 block line-clamp-2">{row.deskripsi || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      render: (row: any) => (
        <DropdownMenu
          items={[
            { label: 'Edit', icon: <Edit size={14} />, onClick: () => handleOpenEdit(row) },
            {
              label: 'Hapus',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeletingItem(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rumusan CPMK"
        description="Rumusan Capaian Pembelajaran Mata Kuliah pada level Program Studi (CPMK-PS), terikat pada kurikulum dan CPL prodi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Rumusan CPMK' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Rumusan
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={setPage}
        emptyMessage="Belum ada rumusan CPMK program studi. Klik 'Tambah Rumusan' untuk membuat baru."
      />

      {/* Modal Form: Kurikulum, CPL Prodi, Kode, Rumusan (sesuai gambar) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingItem ? 'Edit Rumusan CPMK' : 'Tambah Rumusan CPMK'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-4">
            <Controller
              name="kurikulum_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Kurikulum *"
                  placeholder="Pilih kurikulum..."
                  loadOptions={loadKurikulumOptions}
                  value={field.value || null}
                  onChange={(opt: any) => {
                    field.onChange(Number(opt?.value) || 0);
                    // Reset CPL bila kurikulum berganti, agar CPL prodi lain tidak terbawa.
                    setValue('cpl_id', 0);
                  }}
                  error={errors.kurikulum_id?.message}
                />
              )}
            />

            <Controller
              name="cpl_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  key={`cpl-select-${watchedKurikulumId}`}
                  label="CPL Prodi *"
                  placeholder={watchedKurikulumId ? 'Pilih CPL Prodi...' : 'Pilih kurikulum terlebih dahulu...'}
                  loadOptions={loadCplOptions}
                  value={field.value || null}
                  onChange={(opt: any) => field.onChange(Number(opt?.value) || 0)}
                  isDisabled={!watchedKurikulumId}
                  error={errors.cpl_id?.message}
                />
              )}
            />

            <Input
              label="Kode *"
              placeholder="Contoh: CPMK-01"
              error={errors.kode_cpmk?.message}
              {...register('kode_cpmk')}
            />

            <Textarea
              label="Rumusan *"
              rows={4}
              placeholder="Tuliskan rumusan capaian pembelajaran mata kuliah..."
              error={errors.deskripsi?.message}
              {...register('deskripsi')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Kembali
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Drawer Filter */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Rumusan CPMK">
        <div className="space-y-4">
          <Input
            label="Kata Kunci"
            placeholder="Cari kode atau rumusan CPMK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
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
              label="Urutkan Berdasarkan"
              options={[
                { value: 'kode_cpmk', label: 'Kode CPMK' },
                { value: 'created_at', label: 'Waktu Dibuat' },
              ]}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'kode_cpmk'))}
            />
            <Select
              label="Arah Urutan"
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
              value={filterSortDir}
              onChange={(v) => setFilterSortDir((v as 'asc' | 'desc') || 'asc')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Rumusan CPMK"
        message={`Apakah Anda yakin ingin menghapus rumusan CPMK "${deletingItem?.kode_cpmk}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}