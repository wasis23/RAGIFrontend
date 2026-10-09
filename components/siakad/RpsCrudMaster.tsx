'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit, Trash2, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export interface RpsRefFormSchema {
  nama: string;
  kode?: string;
  deskripsi?: string;
}

const formSchema = z.object({
  kode: z.string().trim().max(50, 'Kode maksimal 50 karakter').optional(),
  nama: z.string().trim().min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter'),
  deskripsi: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface RpsCrudMasterProps {
  title: string;
  description: string;
  breadcrumbLabel: string;
  itemTypeLabel: string;
  initialData: Array<{ id: number; kode: string; nama: string; deskripsi: string; created_at: string }>;
}

export function RpsCrudMaster({
  title,
  description,
  breadcrumbLabel,
  itemTypeLabel,
  initialData,
}: RpsCrudMasterProps) {
  const [items, setItems] = useState(initialData);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    sortBy: 'nama',
    sortDir: 'asc' as 'asc' | 'desc',
  });
  const [showFilter, setShowFilter] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [deletingItem, setDeletingItem] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { kode: '', nama: '', deskripsi: '' },
  });

  const filteredItems = useMemo(() => {
    let res = [...items];
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      res = res.filter(
        (i) =>
          i.nama?.toLowerCase().includes(q) ||
          i.kode?.toLowerCase().includes(q) ||
          i.deskripsi?.toLowerCase().includes(q)
      );
    }
    res.sort((a: any, b: any) => {
      const va = String(a[appliedFilters.sortBy] || '');
      const vb = String(b[appliedFilters.sortBy] || '');
      const cmp = va.localeCompare(vb);
      return appliedFilters.sortDir === 'desc' ? -cmp : cmp;
    });
    return res;
  }, [items, appliedFilters]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const meta = useMemo(
    () => ({
      current_page: page,
      per_page: limit,
      total: filteredItems.length,
      last_page: Math.max(1, Math.ceil(filteredItems.length / limit)),
      from: filteredItems.length > 0 ? (page - 1) * limit + 1 : 0,
      to: Math.min(filteredItems.length, page * limit),
    }),
    [filteredItems.length, page, limit]
  );

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({ kode: '', nama: '', deskripsi: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      kode: item.kode || '',
      nama: item.nama || '',
      deskripsi: item.deskripsi || '',
    });
    setModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editingItem?.id) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                kode: values.kode?.trim() || i.kode,
                nama: values.nama.trim(),
                deskripsi: values.deskripsi?.trim() || '',
              }
            : i
        )
      );
      toast.success(`${itemTypeLabel} berhasil diperbarui`);
    } else {
      const newItem = {
        id: Date.now(),
        kode: values.kode?.trim() || `REF-${Math.floor(100 + Math.random() * 900)}`,
        nama: values.nama.trim(),
        deskripsi: values.deskripsi?.trim() || '',
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success(`${itemTypeLabel} baru berhasil disimpan`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem?.id) return;
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    toast.success(`${itemTypeLabel} berhasil dihapus`);
    setDeletingItem(null);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSortBy('nama');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', sortBy: 'nama', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode',
      label: 'KODE',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 block text-xs">{row.kode || '-'}</span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA / LABEL',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-800 text-xs block">{row.nama}</span>,
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI / KETERANGAN',
      render: (row) => (
        <span className="text-xs text-slate-600 block line-clamp-2 leading-relaxed">
          {row.deskripsi || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      render: (row) => (
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
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS' },
          { label: breadcrumbLabel },
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
              Tambah {itemTypeLabel}
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={paginatedItems}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage={`Belum ada data ${itemTypeLabel.toLowerCase()}. Klik tombol 'Tambah ${itemTypeLabel}' untuk membuat data baru.`}
      />

      {/* Modal Form CRUD */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Edit ${itemTypeLabel}` : `Tambah ${itemTypeLabel}`}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Kode (Opsional)"
              placeholder="Contoh: KOD-01"
              error={errors.kode?.message}
              {...register('kode')}
            />

            <Input
              label="Nama / Label *"
              placeholder={`Tulis nama ${itemTypeLabel.toLowerCase()}...`}
              error={errors.nama?.message}
              {...register('nama')}
            />

            <Textarea
              label="Deskripsi / Keterangan (Opsional)"
              rows={3}
              placeholder={`Tulis deskripsi detail ${itemTypeLabel.toLowerCase()}...`}
              error={errors.deskripsi?.message}
              {...register('deskripsi')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Drawer Filter */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title={`Filter ${itemTypeLabel}`}>
        <div className="space-y-4">
          <Input
            label="Kata Kunci"
            placeholder="Cari kode, nama, atau deskripsi..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              options={[
                { value: 'nama', label: 'Nama / Label' },
                { value: 'kode', label: 'Kode' },
                { value: 'created_at', label: 'Waktu Dibuat' },
              ]}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'nama'))}
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
        title={`Hapus ${itemTypeLabel}`}
        message={`Apakah Anda yakin ingin menghapus "${deletingItem?.nama}"? Aksi ini akan menghapus data.`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
