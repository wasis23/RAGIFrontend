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
import type { MasterSatuan } from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

const satuanSchema = z.object({
  kode: z.string().trim().min(1, 'Kode satuan minimal 1 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().trim().min(1, 'Nama satuan minimal 1 karakter').max(100, 'Nama maksimal 100 karakter'),
  keterangan: z.string().optional(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  is_active: z.boolean(),
});

type SatuanFormData = z.infer<typeof satuanSchema>;

export default function MasterSatuanPage() {
  const [dataList, setDataList] = useState<MasterSatuan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States (1:1 per Kolom Informasi)
  const [kodeFilter, setKodeFilter] = useState('');
  const [namaFilter, setNamaFilter] = useState('');
  const [keteranganFilter, setKeteranganFilter] = useState('');
  const [urutanFilter, setUrutanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('urutan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterSatuan | null>(null);

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState<MasterSatuan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SatuanFormData>({
    resolver: zodResolver(satuanSchema),
    defaultValues: {
      kode: '',
      nama: '',
      keterangan: '',
      urutan: 1,
      is_active: true,
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSearch = kodeFilter || namaFilter || keteranganFilter || urutanFilter || undefined;
      const res: any = await sinapraService.getMasterSatuanList({
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
      toast.error('Gagal mengambil daftar master satuan barang');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, kodeFilter, namaFilter, keteranganFilter, urutanFilter, activeFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    reset({
      kode: '',
      nama: '',
      keterangan: '',
      urutan: dataList.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MasterSatuan) => {
    setEditingItem(item);
    reset({
      kode: item.kode,
      nama: item.nama,
      keterangan: item.keterangan || '',
      urutan: item.urutan || 1,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (formData: SatuanFormData) => {
    try {
      if (editingItem) {
        await sinapraService.updateMasterSatuan(editingItem.id, formData);
        toast.success('Satuan barang berhasil diperbarui');
      } else {
        await sinapraService.createMasterSatuan(formData);
        toast.success('Satuan barang berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data satuan barang');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await sinapraService.deleteMasterSatuan(deletingItem.id);
      toast.success('Satuan barang berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus satuan barang');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<MasterSatuan>[] = [
    {
      key: 'no',
      label: 'NO',
      render: (_item: MasterSatuan, index: number) => (
        <span className="text-slate-500 text-xs font-semibold">{((page - 1) * limit) + (index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE SATUAN',
      render: (item: MasterSatuan) => (
        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{item.kode}</span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA SATUAN UKURAN',
      render: (item: MasterSatuan) => (
        <span className="font-medium text-xs text-slate-800">{item.nama}</span>
      ),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN PENGGUNAAN',
      render: (item: MasterSatuan) => (
        <span className="text-xs text-slate-600 line-clamp-2">
          {item.keterangan || <span className="text-slate-400 italic">Tidak ada keterangan</span>}
        </span>
      ),
    },
    {
      key: 'urutan',
      label: 'URUTAN',
      render: (item: MasterSatuan) => (
        <span className="text-xs font-bold text-slate-700">{item.urutan}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item: MasterSatuan) => (
        <Badge variant={item.is_active ? 'success' : 'secondary'}>
          {item.is_active ? 'Aktif' : 'Non-aktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (item: MasterSatuan) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Satuan',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEditModal(item),
            },
            {
              label: 'Hapus Satuan',
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
        title="Master Satuan Barang & BHP (SINAPRA)"
        description="Standarisasi satuan ukuran inventaris barang sarana, alat laboratorium, dan barang habis pakai (BHP)."
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
              Tambah Satuan
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
        title="Filter Master Satuan Barang"
      >
        <div className="space-y-4">
          <Input
            label="Kode Satuan"
            placeholder="Cari kode satuan..."
            value={kodeFilter}
            onChange={(e) => setKodeFilter(e.target.value)}
          />

          <Input
            label="Nama Satuan"
            placeholder="Cari nama satuan..."
            value={namaFilter}
            onChange={(e) => setNamaFilter(e.target.value)}
          />

          <Input
            label="Keterangan Penggunaan"
            placeholder="Cari keterangan..."
            value={keteranganFilter}
            onChange={(e) => setKeteranganFilter(e.target.value)}
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
                { value: 'kode', label: 'Kode Satuan' },
                { value: 'nama', label: 'Nama Satuan' },
                { value: 'keterangan', label: 'Keterangan' },
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
                setKeteranganFilter('');
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

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Satuan Barang' : 'Tambah Satuan Barang Baru'}
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
                label="Kode Satuan *"
                placeholder="cth: UNIT, PCS, BOX"
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
              label="Nama Satuan Ukuran *"
              placeholder="cth: Pcs (Pieces), Box / Kotak, Roll"
              {...register('nama')}
            />
            {errors.nama && (
              <p className="text-xs text-[var(--module-primary)]">{errors.nama.message}</p>
            )}
          </div>

          <div>
            <Textarea
              label="Keterangan Penggunaan"
              rows={2}
              placeholder="Jelaskan jenis barang atau peruntukan satuan ini..."
              {...register('keterangan')}
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
        title="Hapus Satuan Barang?"
        message={`Apakah Anda yakin ingin menghapus satuan "${deletingItem?.nama}"?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
