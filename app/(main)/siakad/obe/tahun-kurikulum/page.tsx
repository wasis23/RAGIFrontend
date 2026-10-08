'use client';

import { useState, useEffect } from 'react';
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

// Nilai tetap domain (closed-set status workflow internal, bukan entitas master).
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const FILTER_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'tahun_berlaku', label: 'Tahun Berlaku' },
  { value: 'kode', label: 'Kode' },
  { value: 'nama', label: 'Kurikulum' },
  { value: 'total_sks_lulus', label: 'SKS Lulus' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'desc', label: 'Z - A (Turun)' },
  { value: 'asc', label: 'A - Z (Naik)' },
];

const kurikulumSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().min(3, 'Nama kurikulum minimal 3 karakter').max(255, 'Nama kurikulum maksimal 255 karakter'),
  tahun_berlaku: z
    .number({ error: 'Tahun berlaku wajib diisi' })
    .int('Tahun berlaku harus bilangan bulat')
    .min(2000, 'Tahun berlaku minimal 2000')
    .max(2100, 'Tahun berlaku maksimal 2100'),
  total_sks_lulus: z
    .number({ error: 'Bobot SKS wajib diisi' })
    .int('Bobot SKS harus bilangan bulat')
    .min(100, 'Bobot minimal lulus minimal 100 SKS')
    .max(300, 'Bobot minimal lulus maksimal 300 SKS'),
  status: z.string().min(1, 'Status wajib dipilih'),
});

type KurikulumFormValues = z.infer<typeof kurikulumSchema>;

const DEFAULT_FORM_VALUES: KurikulumFormValues = {
  kode: '',
  nama: '',
  tahun_berlaku: new Date().getFullYear(),
  total_sks_lulus: 144,
  status: 'aktif',
};

export default function TahunKurikulumObePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('tahun_berlaku');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', sortBy: 'tahun_berlaku', sortDir: 'desc' as 'asc' | 'desc' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KurikulumFormValues>({
    resolver: zodResolver(kurikulumSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getKurikulums({
        search: appliedFilters.search || undefined,
        status: appliedFilters.status || undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        limit,
      });
      if (res.data) {
        setItems(Array.isArray(res.data) ? res.data : (res.data.items || []));
        if (res.meta) {
          setMeta(res.meta);
        } else if (Array.isArray(res.data)) {
          setMeta({
            current_page: 1,
            per_page: res.data.length,
            total: res.data.length,
            last_page: 1,
            from: 1,
            to: res.data.length,
          });
        }
      }
    } catch {
      toast.error('Gagal memuat daftar kurikulum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({ ...DEFAULT_FORM_VALUES, tahun_berlaku: new Date().getFullYear() });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      kode: item.kode ?? '',
      nama: item.nama ?? '',
      tahun_berlaku: item.tahun_berlaku ?? new Date().getFullYear(),
      total_sks_lulus: item.total_sks_lulus ?? 144,
      status: item.is_active ? 'aktif' : 'nonaktif',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: KurikulumFormValues) => {
    try {
      const payload = {
        kode: values.kode,
        nama: values.nama,
        tahun_berlaku: Number(values.tahun_berlaku),
        total_sks_lulus: Number(values.total_sks_lulus),
        is_active: values.status === 'aktif',
      };
      if (editingItem) {
        await siakadService.updateKurikulum(editingItem.id, payload);
        toast.success('Tahun Kurikulum berhasil diperbarui');
      } else {
        await siakadService.createKurikulum(payload);
        toast.success('Tahun Kurikulum baru berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan tahun kurikulum');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteKurikulum(deletingItem.id);
      toast.success('Kurikulum berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus kurikulum');
    } finally {
      setDeleting(false);
    }
  };

  const getProdiLabel = (r: any) =>
    r.program_studi?.nama || r.programStudi?.nama || r.program_studi?.kode_prodi || r.programStudi?.kode_prodi || '-';

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'kode', label: 'KODE KURIKULUM', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode}</span> },
    {
      key: 'nama',
      label: 'NAMA KURIKULUM',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.nama}</span>
          <span className="text-2xs text-slate-400">{getProdiLabel(r)}</span>
        </div>
      ),
    },
    { key: 'tahun_berlaku', label: 'TAHUN BERLAKU', align: 'center', render: (r) => <span className="font-mono font-bold text-slate-700 text-xs">{r.tahun_berlaku}</span> },
    { key: 'total_sks_lulus', label: 'SYARAT SKS LULUS', align: 'center', render: (r) => <Badge variant="blue">{r.total_sks_lulus || 144} SKS</Badge> },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Kurikulum', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Kurikulum', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tahun Kurikulum"
        description="Pengelolaan kode kurikulum, tahun berlaku, bobot minimal kelulusan, dan status aktif kurikulum."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Tahun Kurikulum' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Tahun Kurikulum
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
        emptyMessage="Belum ada data kurikulum untuk program studi ini."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tahun Kurikulum"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => { setFilterSearch(''); setFilterStatus(''); setAppliedFilters({ search: '', status: '', sortBy: 'tahun_berlaku', sortDir: 'desc' }); setPage(1); setShowFilter(false); }}>Reset</Button>
            <Button variant="primary" onClick={() => { setAppliedFilters({ search: filterSearch, status: filterStatus, sortBy: filterSortBy, sortDir: filterSortDir }); setPage(1); setShowFilter(false); }}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode atau kurikulum..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select
            label="Status"
            options={FILTER_STATUS_OPTIONS}
            value={filterStatus}
            onChange={(val) => setFilterStatus(String(val ?? ''))}
          />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(String(val || 'tahun_berlaku'))} options={SORT_BY_OPTIONS} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'desc')} options={SORT_DIR_OPTIONS} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Tahun Kurikulum' : 'Tambah Tahun Kurikulum'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode *" placeholder="Contoh: KUR-2026-TI" error={errors.kode?.message} {...register('kode')} />
            <Input label="Tahun Berlaku *" type="number" placeholder="Contoh: 2026" error={errors.tahun_berlaku?.message} {...register('tahun_berlaku', { valueAsNumber: true })} />
            <div className="md:col-span-2">
              <Input label="Kurikulum *" placeholder="Contoh: Kurikulum OBE Berbasis MBKM 2026" error={errors.nama?.message} {...register('nama')} />
            </div>
            <Input label="Bobot Minimal Lulus (SKS) *" type="number" placeholder="Contoh: 144" error={errors.total_sks_lulus?.message} {...register('total_sks_lulus', { valueAsNumber: true })} />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  label="Status *"
                  placeholder="Pilih"
                  options={STATUS_OPTIONS}
                  value={field.value}
                  onChange={(val) => field.onChange(val || 'aktif')}
                  error={errors.status?.message}
                />
              )}
            />
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
        title="Hapus Kurikulum?"
        message={`Apakah Anda yakin ingin menghapus kurikulum ${deletingItem?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
