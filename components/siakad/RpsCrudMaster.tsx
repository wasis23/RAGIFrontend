'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Filter, Edit, Trash2 } from 'lucide-react';
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
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const formSchema = z.object({
  kode: z.string().trim().max(50, 'Kode maksimal 50 karakter').optional(),
  nama: z.string().trim().min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter'),
  deskripsi: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface RpsCrudMasterProps {
  tipe: 'jenis_pembelajaran' | 'bentuk' | 'metode' | 'kriteria' | 'komponen';
  title: string;
  description: string;
  breadcrumbLabel: string;
  itemTypeLabel: string;
}

export function RpsCrudMaster({
  tipe,
  title,
  description,
  breadcrumbLabel,
  itemTypeLabel,
}: RpsCrudMasterProps) {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [saving, setSaving] = useState(false);

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { kode: '', nama: '', deskripsi: '' },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siakadService.getRpsReferensi({
        tipe,
        search: appliedFilters.search || undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      const raw = res?.data;
      setItems(Array.isArray(raw) ? raw : []);
      setMeta(res?.meta || null);
    } catch {
      toast.error(`Gagal memuat data ${itemTypeLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [tipe, appliedFilters, page, limit, itemTypeLabel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editingItem?.id) {
        await siakadService.updateRpsReferensi(editingItem.id, {
          kode: values.kode?.trim() || undefined,
          nama: values.nama.trim(),
          deskripsi: values.deskripsi?.trim() || undefined,
        });
        toast.success(`${itemTypeLabel} berhasil diperbarui`);
      } else {
        await siakadService.createRpsReferensi({
          tipe,
          kode: values.kode?.trim() || undefined,
          nama: values.nama.trim(),
          deskripsi: values.deskripsi?.trim() || undefined,
        });
        toast.success(`${itemTypeLabel} baru berhasil disimpan`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Gagal menyimpan ${itemTypeLabel.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;
    setDeleting(true);
    try {
      await siakadService.deleteRpsReferensi(deletingItem.id);
      toast.success(`${itemTypeLabel} berhasil dihapus`);
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Gagal menghapus ${itemTypeLabel.toLowerCase()}`);
    } finally {
      setDeleting(false);
    }
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
        data={items}
        isLoading={loading}
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
        onClose={() => !saving && setModalOpen(false)}
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
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
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
        isLoading={deleting}
      />
    </div>
  );
}
