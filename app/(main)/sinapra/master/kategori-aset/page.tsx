'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Filter,
  Tag,
  Edit2,
  Trash2,
  RotateCcw,
  Save,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import type { KategoriAset, KategoriAsetFormPayload } from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

const kategoriAsetSchema = z.object({
  kode: z.string().trim().min(1, 'Kode kategori wajib diisi').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  parent_id: z.number().nullable().optional(),
  masa_manfaat_tahun: z.number().min(1, 'Masa manfaat minimal 1 tahun').max(100, 'Masa manfaat maksimal 100 tahun'),
  tarif_penyusutan_persen: z.number().min(0, 'Tarif penyusutan tidak boleh negatif').max(100, 'Tarif penyusutan maksimal 100%'),
});

type KategoriAsetFormData = z.infer<typeof kategoriAsetSchema>;

export default function MasterKategoriAsetPage() {
  const [dataList, setDataList] = useState<KategoriAset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States (Paritas 1:1 Kolom Informasi)
  const [kodeFilter, setKodeFilter] = useState('');
  const [namaFilter, setNamaFilter] = useState('');
  const [parentFilter, setParentFilter] = useState<{ value: string; label: string } | null>(null);
  const [masaManfaatFilter, setMasaManfaatFilter] = useState('');
  const [tarifFilter, setTarifFilter] = useState('');
  const [sortBy, setSortBy] = useState('kode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal Form States (<= 5 inputs)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KategoriAset | null>(null);
  const [selectedParent, setSelectedParent] = useState<{ value: string; label: string } | null>(null);

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState<KategoriAset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KategoriAsetFormData>({
    resolver: zodResolver(kategoriAsetSchema),
    defaultValues: {
      kode: '',
      nama: '',
      parent_id: null,
      masa_manfaat_tahun: 4,
      tarif_penyusutan_persen: 25.0,
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSearch = kodeFilter || namaFilter || undefined;
      const res: any = await sinapraService.getKategoriList({
        page,
        per_page: limit,
        search: activeSearch,
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      const items: KategoriAset[] = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || [];

      setDataList(items);

      if (res?.meta) {
        setMeta({
          current_page: res.meta.current_page || 1,
          per_page: res.meta.per_page || limit,
          total: res.meta.total || items.length,
          last_page: res.meta.last_page || 1,
        });
      }
    } catch {
      toast.error('Gagal memuat master kategori aset');
      setDataList([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, kodeFilter, namaFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load options for Kategori Induk/Parent AsyncSelect server-side
  const loadParentOptions = async (keyword: string, pageNum: number = 1) => {
    try {
      const res: any = await sinapraService.getKategoriList({
        search: keyword || undefined,
        page: pageNum,
        per_page: 20,
      });
      const items: KategoriAset[] = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || [];
      return items
        .filter((item: KategoriAset) => !editingItem || item.id !== editingItem.id)
        .map((item: KategoriAset) => ({
          value: String(item.id),
          label: `${item.kode} - ${item.nama}`,
        }));
    } catch {
      return [];
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedParent(null);
    reset({
      kode: '',
      nama: '',
      parent_id: null,
      masa_manfaat_tahun: 4,
      tarif_penyusutan_persen: 25.0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KategoriAset) => {
    setEditingItem(item);
    if (item.parent) {
      setSelectedParent({
        value: String(item.parent.id),
        label: `${item.parent.kode} - ${item.parent.nama}`,
      });
    } else {
      setSelectedParent(null);
    }
    reset({
      kode: item.kode,
      nama: item.nama,
      parent_id: item.parent_id || null,
      masa_manfaat_tahun: item.masa_manfaat_tahun || 4,
      tarif_penyusutan_persen: Number(item.tarif_penyusutan_persen || 25),
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (values: KategoriAsetFormData) => {
    try {
      const payload: KategoriAsetFormPayload = {
        kode: values.kode,
        nama: values.nama,
        parent_id: values.parent_id || null,
        masa_manfaat_tahun: values.masa_manfaat_tahun,
        tarif_penyusutan_persen: values.tarif_penyusutan_persen,
      };

      if (editingItem) {
        await sinapraService.updateKategori(editingItem.id, payload);
        toast.success('Kategori aset berhasil diperbarui');
      } else {
        await sinapraService.createKategori(payload);
        toast.success('Kategori aset berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan kategori aset');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await sinapraService.deleteKategori(deletingItem.id);
      toast.success('Kategori aset berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus kategori aset');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setKodeFilter('');
    setNamaFilter('');
    setParentFilter(null);
    setMasaManfaatFilter('');
    setTarifFilter('');
    setSortBy('kode');
    setSortDir('asc');
    setPage(1);
  };

  const columns: ColumnDef<KategoriAset>[] = [
    {
      key: 'nama',
      label: 'KODE & NAMA KATEGORI',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            {item.nama}
          </span>
          <span className="text-2xs font-mono text-slate-500 font-medium">
            {item.kode}
          </span>
        </div>
      ),
    },
    {
      key: 'parent',
      label: 'KATEGORI INDUK',
      render: (item) =>
        item.parent ? (
          <div className="flex items-center gap-2">
            <Layers size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-700 font-medium">{item.parent.nama}</span>
          </div>
        ) : (
          <span className="text-2xs text-slate-400 italic">Kategori Utama (Root)</span>
        ),
    },
    {
      key: 'masa_manfaat_tahun',
      label: 'MASA MANFAAT',
      render: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.masa_manfaat_tahun ?? '-'} Tahun
        </span>
      ),
    },
    {
      key: 'tarif_penyusutan_persen',
      label: 'TARIF PENYUSUTAN',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700">
          {item.tarif_penyusutan_persen != null ? `${Number(item.tarif_penyusutan_persen)}% / tahun` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Kategori',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(item),
              },
              {
                label: 'Hapus Kategori',
                icon: <Trash2 size={14} className="text-rose-500" />,
                variant: 'danger',
                onClick: () => setDeletingItem(item),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* ── PageHeader ── */}
      <PageHeader
        title="Master Kategori Aset & Penyusutan"
        description="Pengelolaan klasifikasi aset, kelompok umur ekonomis, dan regulasi tarif penyusutan sarpras kampus"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterOpen(true)}
              style={{
                borderColor: 'var(--module-primary)',
                color: 'var(--module-primary)',
              }}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Tambah Kategori
            </Button>
          </div>
        }
      />

      {/* ── Table Container ── */}
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

      {/* ── Modal Form (Form <= 5 Inputs) ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Master Kategori Aset' : 'Tambah Master Kategori Aset'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Kategori"
              placeholder="Contoh: KAT-KOMP"
              {...register('kode')}
              error={errors.kode?.message}
            />
            <Input
              label="Nama Kategori"
              placeholder="Contoh: Perangkat Komputer"
              {...register('nama')}
              error={errors.nama?.message}
            />
          </div>

          <div>
            <AsyncSelect
              label="Kategori Induk (Opsional)"
              placeholder="Pilih jika merupakan sub-kategori..."
              loadOptions={loadParentOptions}
              value={selectedParent}
              onChange={(val: any) => {
                setSelectedParent(val);
                setValue('parent_id', val ? Number(val.value) : null, { shouldValidate: true });
              }}
            />
            <p className="text-2xs text-slate-400">
              Kosongkan jika kategori ini merupakan kategori utama (root).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Masa Manfaat (Tahun)"
              type="number"
              min={1}
              max={100}
              placeholder="Contoh: 4"
              {...register('masa_manfaat_tahun', { valueAsNumber: true })}
              error={errors.masa_manfaat_tahun?.message}
            />
            <Input
              label="Tarif Penyusutan (%/Tahun)"
              type="number"
              step="0.01"
              min={0}
              max={100}
              placeholder="Contoh: 25.0"
              {...register('tarif_penyusutan_persen', { valueAsNumber: true })}
              error={errors.tarif_penyusutan_persen?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {editingItem ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Filter Drawer (Pola SIMPEG: Paritas 1:1 Kolom Tabel) ── */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter & Urutan Data"
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

          <div>
            <AsyncSelect
              label="Kategori Induk"
              placeholder="Pilih kategori induk..."
              loadOptions={loadParentOptions}
              value={parentFilter}
              onChange={(val: any) => setParentFilter(val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Masa Manfaat (Thn)"
              type="number"
              placeholder="Contoh: 4"
              value={masaManfaatFilter}
              onChange={(e) => setMasaManfaatFilter(e.target.value)}
            />
            <Input
              label="Tarif (%/Thn)"
              type="number"
              placeholder="Contoh: 25"
              value={tarifFilter}
              onChange={(e) => setTarifFilter(e.target.value)}
            />
          </div>

          {/* Sorting 1:1 Seluruh Kolom Informasi Tabel */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'kode', label: 'Kode Kategori' },
                { value: 'nama', label: 'Nama Kategori' },
                { value: 'parent', label: 'Kategori Induk' },
                { value: 'masa_manfaat_tahun', label: 'Masa Manfaat' },
                { value: 'tarif_penyusutan_persen', label: 'Tarif Penyusutan' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
            />
          </div>

          <hr className="border-slate-200" />

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetFilter}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPage(1);
                setIsFilterOpen(false);
                fetchData();
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Master Kategori Aset"
        message={`Apakah Anda yakin ingin menghapus kategori aset "${deletingItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Kategori"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
