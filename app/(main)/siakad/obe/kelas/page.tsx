'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit2, Trash2, Users, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const SORT_BY_OPTIONS = [
  { value: 'nama_kelas', label: 'Nama Kelas' },
  { value: 'tahun_angkatan', label: 'Tahun Angkatan' },
  { value: 'id', label: 'ID' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS = [
  { value: 'asc', label: 'A - Z (Naik)' },
  { value: 'desc', label: 'Z - A (Turun)' },
];

const masterKelasSchema = z.object({
  nama_kelas: z.string().min(1, 'Nama kelas wajib diisi').max(50, 'Nama kelas maksimal 50 karakter'),
  tahun_angkatan: z
    .number({ error: 'Tahun angkatan wajib diisi' })
    .int('Tahun angkatan harus bilangan bulat')
    .min(2000, 'Tahun angkatan minimal 2000')
    .max(2100, 'Tahun angkatan maksimal 2100'),
  dosen_pa_id: z.number().nullable().optional(),
  keterangan: z.string().max(255, 'Keterangan maksimal 255 karakter').optional(),
  status: z.string().min(1, 'Status wajib dipilih'),
});

type MasterKelasFormValues = z.infer<typeof masterKelasSchema>;

const DEFAULT_FORM_VALUES: MasterKelasFormValues = {
  nama_kelas: '',
  tahun_angkatan: new Date().getFullYear(),
  dosen_pa_id: null,
  keterangan: '',
  status: 'aktif',
};

export default function MasterKelasPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_kelas');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    angkatan: '',
    status: '',
    sortBy: 'nama_kelas',
    sortDir: 'asc' as 'asc' | 'desc',
  });

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
  } = useForm<MasterKelasFormValues>({
    resolver: zodResolver(masterKelasSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const loadDosenOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50, is_active: true });
      const raw = res.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
      return list.map((d: any) => ({
        value: d.id,
        label: `${d.nama_lengkap} — NIDN ${d.nidn || d.nik || d.nip || '-'}`,
      }));
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getMasterKelasList({
        search: appliedFilters.search || undefined,
        tahun_angkatan: appliedFilters.angkatan ? Number(appliedFilters.angkatan) : undefined,
        is_active:
          appliedFilters.status === 'aktif'
            ? true
            : appliedFilters.status === 'nonaktif'
            ? false
            : undefined,
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
            per_page: limit,
            total: res.data.length,
            last_page: 1,
            from: res.data.length > 0 ? 1 : 0,
            to: res.data.length,
          });
        }
      }
    } catch {
      toast.error('Gagal memuat daftar master kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({ ...DEFAULT_FORM_VALUES, tahun_angkatan: new Date().getFullYear() });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      nama_kelas: item.nama_kelas ?? '',
      tahun_angkatan: item.tahun_angkatan ?? new Date().getFullYear(),
      dosen_pa_id: item.dosen_pa_id ?? null,
      keterangan: item.keterangan ?? '',
      status: item.is_active ? 'aktif' : 'nonaktif',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: MasterKelasFormValues) => {
    try {
      const payload = {
        nama_kelas: values.nama_kelas.trim(),
        tahun_angkatan: values.tahun_angkatan,
        dosen_pa_id: values.dosen_pa_id || null,
        keterangan: values.keterangan || null,
        is_active: values.status === 'aktif',
      };

      if (editingItem) {
        await siakadService.updateMasterKelas(editingItem.id, payload);
        toast.success('Master kelas berhasil diperbarui');
      } else {
        await siakadService.createMasterKelas(payload);
        toast.success('Master kelas berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan master kelas');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      await siakadService.deleteMasterKelas(deletingItem.id);
      toast.success('Master kelas berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menghapus master kelas');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'nama_kelas',
      label: 'KELAS & ANGKATAN',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{row.nama_kelas}</span>
          <span className="text-2xs text-slate-500 block font-mono">Angkatan: {row.tahun_angkatan || '-'}</span>
        </div>
      ),
    },
    {
      key: 'dosen_pa',
      label: 'DOSEN PA / KOORDINATOR',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.dosen_pa?.nama_lengkap || '-'}
          </span>
          <span className="text-2xs text-slate-400 font-mono block">
            {row.dosen_pa?.nidn ? `NIDN: ${row.dosen_pa.nidn}` : 'Belum ditetapkan'}
          </span>
        </div>
      ),
    },
    {
      key: 'total_mahasiswa',
      label: 'JUMLAH MAHASISWA',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
          <Users size={12} />
          {row.mahasiswas_count ?? 0} Mhs
        </span>
      ),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN',
      render: (row) => <span className="text-xs text-slate-600">{row.keterangan || '-'}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'} className="text-2xs">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Pemetaan Mahasiswa',
                icon: <ArrowRight size={14} />,
                onClick: () => router.push(`/siakad/obe/pemetaan-mahasiswa-kelas?kelas=${encodeURIComponent(row.nama_kelas)}&angkatan=${row.tahun_angkatan || ''}`),
              },
              {
                label: 'Edit Kelas',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus Kelas',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingItem(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Master Kelas & Rombel"
        description="Daftar kelas rombel mahasiswa, tahun angkatan, dan penugasan Dosen Pembimbing Akademik (PA)."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'OBE', href: '/siakad/obe' },
          { label: 'Master Kelas' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Tambah Kelas
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
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada master kelas yang tersimpan."
      />

      {/* Modal Form CRUD (<= 5 input) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Master Kelas' : 'Tambah Master Kelas'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Kelas"
              required
              placeholder="Contoh: 25A, 25B, Reguler A"
              {...register('nama_kelas')}
              error={errors.nama_kelas?.message}
            />

            <Input
              label="Tahun Angkatan"
              required
              type="number"
              placeholder="Contoh: 2025"
              {...register('tahun_angkatan', { valueAsNumber: true })}
              error={errors.tahun_angkatan?.message}
            />

            <div className="md:col-span-2">
              <Controller
                name="dosen_pa_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Dosen PA / Koordinator"
                    placeholder="Cari Dosen PA..."
                    loadOptions={loadDosenOptions}
                    defaultOptions={
                      editingItem?.dosen_pa
                        ? [
                            {
                              value: editingItem.dosen_pa.id,
                              label: `${editingItem.dosen_pa.nama_lengkap} — NIDN ${editingItem.dosen_pa.nidn || '-'}`,
                            },
                          ]
                        : true
                    }
                    value={field.value || null}
                    onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : null)}
                    isClearable
                    error={errors.dosen_pa_id?.message}
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Keterangan"
                placeholder="Catatan kelas (opsional)..."
                {...register('keterangan')}
                error={errors.keterangan?.message}
              />
            </div>

            <div className="md:col-span-2">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status"
                    required
                    options={STATUS_OPTIONS}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    error={errors.status?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Master Kelas"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterAngkatan('');
                setFilterStatus('');
                setFilterSortBy('nama_kelas');
                setFilterSortDir('asc');
                setAppliedFilters({
                  search: '',
                  angkatan: '',
                  status: '',
                  sortBy: 'nama_kelas',
                  sortDir: 'asc',
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  angkatan: filterAngkatan,
                  status: filterStatus,
                  sortBy: filterSortBy,
                  sortDir: filterSortDir,
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian"
            placeholder="Cari nama kelas atau Dosen PA..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Input
            label="Tahun Angkatan"
            type="number"
            placeholder="Semua Angkatan..."
            value={filterAngkatan}
            onChange={(e) => setFilterAngkatan(e.target.value)}
          />

          <Select
            label="Status"
            placeholder="Semua Status"
            options={FILTER_STATUS_OPTIONS}
            value={filterStatus}
            onChange={(val: any) => setFilterStatus(val ? String(val) : '')}
            isClearable
          />

          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val: any) => setFilterSortBy(val ? String(val) : 'nama_kelas')}
              options={SORT_BY_OPTIONS}
            />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val: any) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')}
              options={SORT_DIR_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Master Kelas?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus kelas <strong>{deletingItem?.nama_kelas}</strong>?
          </span>
        }
        isLoading={deleting}
      />
    </div>
  );
}
