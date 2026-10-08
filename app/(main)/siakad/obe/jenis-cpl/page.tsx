'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const jenisCplSchema = z.object({
  nama_jenis: z
    .string({ error: 'Nama jenis CPL wajib diisi' })
    .trim()
    .min(3, 'Nama jenis CPL minimal 3 karakter')
    .max(150, 'Nama jenis CPL maksimal 150 karakter'),
});

type JenisCplFormValues = z.infer<typeof jenisCplSchema>;

const DEFAULT_FORM: JenisCplFormValues = {
  nama_jenis: '',
};

export default function JenisCplPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_jenis');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', sortBy: 'nama_jenis', sortDir: 'asc' as 'asc' | 'desc' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JenisCplFormValues>({
    resolver: zodResolver(jenisCplSchema),
    defaultValues: DEFAULT_FORM,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getJenisCpl({
        search: appliedFilters.search || undefined,
        is_active: appliedFilters.status === 'aktif' ? true : appliedFilters.status === 'nonaktif' ? false : undefined,
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
      toast.error('Gagal memuat jenis CPL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset(DEFAULT_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      nama_jenis: item.nama_jenis || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: JenisCplFormValues) => {
    try {
      const payload = {
        kode_jenis: values.nama_jenis.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
        nama_jenis: values.nama_jenis.trim(),
        urutan: items.length + 1,
        is_active: true,
      };
      if (editingItem) {
        await siakadService.updateJenisCpl(editingItem.id, payload);
        toast.success('Jenis CPL berhasil diperbarui');
      } else {
        await siakadService.createJenisCpl(payload);
        toast.success('Jenis CPL berhasil disimpan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan jenis CPL');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteJenisCpl(deletingItem.id);
      toast.success('Jenis CPL berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jenis CPL');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'nama_jenis', label: 'JENIS CPL SN DIKTI', render: (r) => <span className="font-bold text-slate-900 text-xs">{r.nama_jenis}</span> },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Jenis CPL', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Jenis CPL', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tambah Jenis CPL SN DIKTI"
        description="Klasifikasi taksonomi aspek CPL sesuai standar SN-DIKTI."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Jenis CPL' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Jenis CPL SN DIKTI
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
        emptyMessage="Belum ada jenis CPL yang terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jenis CPL"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => { setFilterSearch(''); setFilterStatus(''); setAppliedFilters({ search: '', status: '', sortBy: 'nama_jenis', sortDir: 'asc' }); setPage(1); setShowFilter(false); }}>Reset</Button>
            <Button variant="primary" onClick={() => { setAppliedFilters({ search: filterSearch, status: filterStatus, sortBy: filterSortBy, sortDir: filterSortDir }); setPage(1); setShowFilter(false); }}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari jenis CPL..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select
            label="Status"
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
          />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(val || 'nama_jenis')} options={[{ value: 'nama_jenis', label: 'Jenis' }]} />
            <Select label="Arah" value={filterSortDir} onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')} options={[{ value: 'asc', label: 'A - Z' }, { value: 'desc', label: 'Z - A' }]} />
          </div>
        </div>
      </Drawer>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Jenis CPL' : 'Tambah Jenis CPL SN DIKTI'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Jenis *" placeholder="Contoh: Sikap / Keterampilan Umum" error={errors.nama_jenis?.message} {...register('nama_jenis')} />
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
        title="Hapus Jenis CPL?"
        message={`Apakah Anda yakin ingin menghapus jenis CPL ${deletingItem?.nama_jenis}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
