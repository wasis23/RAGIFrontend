'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Filter,
  Layers,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
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
import type { MasterTipeRuangan } from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

const tipeRuanganSchema = z.object({
  kode: z.string().trim().min(2, 'Kode minimal 2 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().trim().min(2, 'Nama tipe ruangan minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  deskripsi: z.string().optional(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  is_active: z.boolean(),
});

type TipeRuanganFormData = z.infer<typeof tipeRuanganSchema>;

export default function MasterTipeRuanganPage() {
  const [dataList, setDataList] = useState<MasterTipeRuangan[]>([]);
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
  const [editingItem, setEditingItem] = useState<MasterTipeRuangan | null>(null);

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState<MasterTipeRuangan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TipeRuanganFormData>({
    resolver: zodResolver(tipeRuanganSchema),
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
      const res: any = await sinapraService.getMasterTipeRuanganList({
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
      toast.error('Gagal mengambil daftar master tipe ruangan');
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

  const handleOpenEditModal = (item: MasterTipeRuangan) => {
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

  const onSubmitForm = async (formData: TipeRuanganFormData) => {
    try {
      if (editingItem) {
        await sinapraService.updateMasterTipeRuangan(editingItem.id, formData);
        toast.success('Tipe ruangan berhasil diperbarui');
      } else {
        await sinapraService.createMasterTipeRuangan(formData);
        toast.success('Tipe ruangan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data tipe ruangan');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await sinapraService.deleteMasterTipeRuangan(deletingItem.id);
      toast.success('Tipe ruangan berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus tipe ruangan');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<MasterTipeRuangan>[] = [
    {
      key: 'no',
      label: 'NO',
      render: (_item: MasterTipeRuangan, index: number) => (
        <span className="text-slate-500 text-xs font-semibold">{((page - 1) * limit) + (index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE & NAMA TIPE',
      render: (item: MasterTipeRuangan) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">{item.kode}</span>
          <span className="text-xs text-slate-600 font-medium">{item.nama}</span>
        </div>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI FASILITAS',
      render: (item: MasterTipeRuangan) => (
        <span className="text-xs text-slate-600 line-clamp-2">
          {item.deskripsi || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
        </span>
      ),
    },
    {
      key: 'urutan',
      label: 'URUTAN',
      render: (item: MasterTipeRuangan) => (
        <span className="text-xs font-bold text-slate-700">{item.urutan}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item: MasterTipeRuangan) => (
        <Badge variant={item.is_active ? 'success' : 'secondary'}>
          {item.is_active ? 'Aktif' : 'Non-aktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (item: MasterTipeRuangan) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Tipe Ruangan',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEditModal(item),
            },
            {
              label: 'Hapus Tipe Ruangan',
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
        title="Master Tipe Ruangan (SINAPRA)"
        description="Pengelolaan kategori dan tipe ruangan perkuliahan, laboratorium, kantor, dan fasilitas kampus."
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
            >
              Tambah Tipe Ruangan
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

      {/* FILTER DRAWER */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Master Tipe Ruangan"
      >
        <div className="space-y-4">
          <Input
            label="Kode Tipe"
            placeholder="Cari kode tipe ruangan..."
            value={kodeFilter}
            onChange={(e) => setKodeFilter(e.target.value)}
          />

          <Input
            label="Nama Tipe"
            placeholder="Cari nama tipe ruangan..."
            value={namaFilter}
            onChange={(e) => setNamaFilter(e.target.value)}
          />

          <Input
            label="Deskripsi Fasilitas"
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
            onChange={(val) => setActiveFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif Saja' },
              { value: 'false', label: 'Non-aktif Saja' },
            ]}
          />

          <hr className="border-t border-slate-200 my-4" />

          {/* Grid 2 Kolom Sorting Wajib (Paritas 1:1) */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'urutan', label: 'Urutan' },
                { value: 'kode', label: 'Kode Tipe' },
                { value: 'nama', label: 'Nama Tipe' },
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
              onClick={() => {
                setKodeFilter('');
                setNamaFilter('');
                setDeskripsiFilter('');
                setUrutanFilter('');
                setActiveFilter('');
                setSortBy('urutan');
                setSortDir('asc');
                setPage(1);
              }}
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

      {/* MODAL FORM CREATE / EDIT (FORM <= 5 INPUTS) */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Tipe Ruangan' : 'Tambah Tipe Ruangan Baru'}
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
                label="Kode Tipe Ruangan *"
                placeholder="cth: lab_komputer, kelas"
                {...register('kode')}
              />
              {errors.kode && (
                <p className="text-xs text-[var(--module-primary)]">{errors.kode.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Urutan Tampilan *"
                type="number"
                min={1}
                {...register('urutan', { valueAsNumber: true })}
              />
              {errors.urutan && (
                <p className="text-xs text-[var(--module-primary)]">{errors.urutan.message}</p>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Nama Tipe Ruangan *"
              placeholder="cth: Laboratorium Komputer Lanjut"
              {...register('nama')}
            />
            {errors.nama && (
              <p className="text-xs text-[var(--module-primary)]">{errors.nama.message}</p>
            )}
          </div>

          <div>
            <Textarea
              label="Deskripsi Fasilitas"
              rows={2}
              placeholder="Jelaskan peruntukan fungsi ruangan ini..."
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

      {/* CONFIRM DIALOG DELETE */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Master Tipe Ruangan?"
        message={`Apakah Anda yakin ingin menghapus tipe ruangan "${deletingItem?.nama}"? Tindakan ini tidak dapat dibatalkan jika ruangan telah terdaftar.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
