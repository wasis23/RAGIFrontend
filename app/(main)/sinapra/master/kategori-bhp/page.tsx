'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Filter,
  Edit2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import type { MasterKategoriBhp } from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

const kategoriBhpSchema = z.object({
  kode: z.string().trim().min(1, 'Kode kategori minimal 1 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().trim().min(1, 'Nama kategori minimal 1 karakter').max(100, 'Nama maksimal 100 karakter'),
  deskripsi: z.string().optional(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  is_active: z.boolean(),
});

type KategoriBhpFormData = z.infer<typeof kategoriBhpSchema>;

export default function MasterKategoriBhpPage() {
  const [dataList, setDataList] = useState<MasterKategoriBhp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States (1:1 per Kolom Informasi)
  const [kodeFilter, setKodeFilter] = useState('');
  const [namaFilter, setNamaFilter] = useState('');
  const [deskripsiFilter, setDeskripsiFilter] = useState('');
  const [urutanFilter, setUrutanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('urutan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal Form States (Form <= 5 inputs menggunakan Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterKategoriBhp | null>(null);

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState<MasterKategoriBhp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KategoriBhpFormData>({
    resolver: zodResolver(kategoriBhpSchema),
    defaultValues: {
      kode: '',
      nama: '',
      deskripsi: '',
      urutan: 1,
      is_active: true,
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSearch = kodeFilter || namaFilter || deskripsiFilter || urutanFilter || undefined;
      const res: any = await sinapraService.getMasterKategoriBhpList({
        page,
        per_page: limit,
        search: activeSearch,
        is_active: activeFilter || undefined,
        sort_by: sortBy,
        sort_order: sortDir,
      });

      setDataList(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal mengambil daftar master kategori BHP');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, kodeFilter, namaFilter, deskripsiFilter, urutanFilter, activeFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    reset({
      kode: '',
      nama: '',
      deskripsi: '',
      urutan: dataList.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MasterKategoriBhp) => {
    setEditingItem(item);
    reset({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      urutan: item.urutan || 1,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (formData: KategoriBhpFormData) => {
    try {
      if (editingItem) {
        await sinapraService.updateMasterKategoriBhp(editingItem.id, formData);
        toast.success('Kategori BHP berhasil diperbarui');
      } else {
        await sinapraService.createMasterKategoriBhp(formData);
        toast.success('Kategori BHP berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data kategori BHP');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await sinapraService.deleteMasterKategoriBhp(deletingItem.id);
      toast.success('Kategori BHP berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus kategori BHP');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setKodeFilter('');
    setNamaFilter('');
    setDeskripsiFilter('');
    setUrutanFilter('');
    setActiveFilter('');
    setSortBy('urutan');
    setSortDir('asc');
    setPage(1);
  };

  const columns: ColumnDef<MasterKategoriBhp>[] = [
    {
      key: 'no',
      label: 'NO',
      render: (_item: MasterKategoriBhp, index?: number) => (
        <span className="text-slate-500 text-xs font-semibold">{((page - 1) * limit) + (index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE & NAMA KATEGORI',
      render: (item: MasterKategoriBhp) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">{item.kode}</span>
          <span className="text-xs text-slate-600 font-medium">{item.nama}</span>
        </div>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI',
      render: (item: MasterKategoriBhp) => (
        <span className="text-xs text-slate-600 line-clamp-2">
          {item.deskripsi || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
        </span>
      ),
    },
    {
      key: 'urutan',
      label: 'URUTAN',
      render: (item: MasterKategoriBhp) => (
        <span className="text-xs font-bold text-slate-700">{item.urutan}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item: MasterKategoriBhp) => (
        <Badge variant={item.is_active ? 'success' : 'secondary'}>
          {item.is_active ? 'Aktif' : 'Non-aktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (item: MasterKategoriBhp) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Kategori',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEditModal(item),
            },
            {
              label: 'Hapus Kategori',
              icon: <Trash2 size={14} className="text-rose-500" />,
              variant: 'danger',
              onClick: () => setDeletingItem(item),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Kategori BHP (SINAPRA)"
        description="Pengelolaan master data kategori bahan habis pakai (BHP) laboratorium dan unit operasional kampus."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Filter size={16} />}
              onClick={() => setIsFilterOpen(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAddModal}
              style={{ background: 'var(--module-primary)' }}
            >
              Tambah Data
            </Button>
          </div>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={dataList}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* FILTER DRAWER — Paritas 1:1 Kolom Informasi Tabel */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Master Kategori BHP"
      >
        <div className="space-y-4">
          <Input
            label="Kode Kategori"
            placeholder="Cari kode kategori..."
            value={kodeFilter}
            onChange={(e) => setKodeFilter(e.target.value)}
          />

          <Input
            label="Nama Kategori"
            placeholder="Cari nama kategori..."
            value={namaFilter}
            onChange={(e) => setNamaFilter(e.target.value)}
          />

          <Input
            label="Deskripsi"
            placeholder="Cari deskripsi..."
            value={deskripsiFilter}
            onChange={(e) => setDeskripsiFilter(e.target.value)}
          />

          <Input
            label="Urutan"
            type="number"
            placeholder="Filter nomor urutan..."
            value={urutanFilter}
            onChange={(e) => setUrutanFilter(e.target.value)}
          />

          <Select
            label="Status Keaktifan"
            value={activeFilter}
            onChange={(val) => setActiveFilter(String(val))}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif Saja' },
              { value: 'false', label: 'Non-aktif Saja' },
            ]}
          />

          <hr className="border-t border-slate-200 my-4" />

          {/* Grid 2 Kolom Sorting Komprehensif Seluruh Kolom */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(String(val))}
              options={[
                { value: 'urutan', label: 'Urutan' },
                { value: 'kode', label: 'Kode Kategori' },
                { value: 'nama', label: 'Nama Kategori' },
                { value: 'deskripsi', label: 'Deskripsi' },
                { value: 'is_active', label: 'Status' },
              ]}
            />

            <Select
              label="Arah"
              value={sortDir}
              onChange={(val) => setSortDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A-Z / Naik' },
                { value: 'desc', label: 'Z-A / Turun' },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleResetFilter}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* MODAL FORM TAMBAH / EDIT (≤ 5 inputs) */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Kategori BHP' : 'Tambah Kategori BHP Baru'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmitForm)} isLoading={isSubmitting}>
              {editingItem ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Kode Kategori *"
                placeholder="Contoh: KOMP_ELEKTRONIK"
                {...register('kode')}
              />
              {errors.kode && (
                <p className="text-xs text-rose-500">{errors.kode.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Urutan Tampilan *"
                type="number"
                min={1}
                placeholder="1"
                {...register('urutan', { valueAsNumber: true })}
              />
              {errors.urutan && (
                <p className="text-xs text-rose-500">{errors.urutan.message}</p>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Nama Kategori *"
              placeholder="Contoh: Komponen Elektronik & Jaringan"
              {...register('nama')}
            />
            {errors.nama && (
              <p className="text-xs text-rose-500">{errors.nama.message}</p>
            )}
          </div>

          <div>
            <Textarea
              label="Deskripsi"
              rows={2}
              placeholder="Keterangan singkat kategori bahan habis pakai..."
              {...register('deskripsi')}
            />
          </div>

          <div>
            <Select
              label="Status Keaktifan *"
              value={watch('is_active') ? 'true' : 'false'}
              onChange={(val) => setValue('is_active', val === 'true')}
              options={[
                { value: 'true', label: 'Aktif & Dapat Digunakan' },
                { value: 'false', label: 'Non-aktif' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG HAPUS */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Hapus Master Kategori BHP?"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingItem?.nama}"? Seluruh BHP dalam kategori ini akan terpengaruh.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
