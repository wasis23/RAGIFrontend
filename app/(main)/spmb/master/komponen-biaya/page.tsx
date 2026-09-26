'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Edit, Trash2, Filter, Save, Info, Gift } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { spmbService } from '@/services/spmb.service';
import type { MasterKomponenBiaya } from '@/types/spmb.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const schema = z.object({
  kode: z.string().max(50, 'Kode komponen maksimal 50 karakter').optional().or(z.literal('')),
  nama: z.string().min(1, 'Nama komponen biaya wajib diisi').max(150, 'Nama komponen maksimal 150 karakter'),
  kategori: z.string().min(1, 'Kategori komponen biaya wajib diisi').max(50, 'Kategori maksimal 50 karakter'),
  tipe_potongan: z.boolean(),
  is_active: z.boolean(),
  keterangan: z.string().max(255, 'Keterangan maksimal 255 karakter').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function MasterKomponenBiayaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<MasterKomponenBiaya[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);

  // Form Modal State (create & edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterKomponenBiaya | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingComponents, setExistingComponents] = useState<MasterKomponenBiaya[]>([]);
  const [positionType, setPositionType] = useState<'keep' | 'start' | 'end' | 'after' | 'before'>('end');
  const [referenceId, setReferenceId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode: '',
      nama: '',
      kategori: 'Daftar Ulang',
      tipe_potongan: false,
      is_active: true,
      keterangan: '',
    },
  });

  // Delete State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MasterKomponenBiaya | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter Drawer State (URL synchronized like jalur)
  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQ = searchParams.get('search') || '';
  const kategoriQ = searchParams.get('kategori') || '';
  const statusQ = searchParams.get('status') || '';
  const orderByQ = searchParams.get('sort_by') || 'urutan';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterKategori, setFilterKategori] = useState(kategoriQ);
  const [filterStatus, setFilterStatus] = useState(statusQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] !== undefined && newParams[key] !== '') {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getKomponenBiayaList({
        page,
        limit,
        search: searchQ || undefined,
        kategori: kategoriQ || undefined,
        is_active: statusQ || undefined,
        sort_by: orderByQ,
        sort_order: orderDirQ,
      });
      setData(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Gagal memuat komponen biaya');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, kategoriQ, statusQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep local filter inputs synced when URL params change
  useEffect(() => {
    setFilterSearch(searchQ);
    setFilterKategori(kategoriQ);
    setFilterStatus(statusQ);
    setFilterOrderBy(orderByQ);
    setFilterOrderDir(orderDirQ);
  }, [searchQ, kategoriQ, statusQ, orderByQ, orderDirQ]);

  const fetchExistingComponents = async () => {
    try {
      const res = await spmbService.getKomponenBiayaList({
        limit: 100,
        sort_by: 'urutan',
        sort_order: 'asc',
      });
      setExistingComponents(res.data || []);
    } catch {
      setExistingComponents([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setPositionType('end');
    setReferenceId('');
    reset({ kode: '', nama: '', kategori: 'Daftar Ulang', tipe_potongan: false, is_active: true, keterangan: '' });
    setFormOpen(true);
    fetchExistingComponents();
  };

  const openEdit = (row: MasterKomponenBiaya) => {
    setEditing(row);
    setPositionType('keep');
    setReferenceId('');
    reset({
      kode: row.kode || '',
      nama: row.nama || '',
      kategori: row.kategori || 'Daftar Ulang',
      tipe_potongan: Boolean(row.tipe_potongan),
      is_active: Boolean(row.is_active),
      keterangan: row.keterangan || '',
    });
    setFormOpen(true);
    fetchExistingComponents();
  };

  const onSubmit = async (values: FormValues) => {
    if ((positionType === 'after' || positionType === 'before') && !referenceId) {
      toast.error('Silakan pilih komponen acuan posisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        kode: values.kode?.trim() || undefined,
        nama: values.nama.trim(),
        kategori: values.kategori.trim(),
        tipe_potongan: values.tipe_potongan,
        is_active: values.is_active,
        keterangan: values.keterangan?.trim() || undefined,
        position_type: positionType,
        reference_id: referenceId ? Number(referenceId) : undefined,
      };

      if (editing?.id) {
        await spmbService.updateKomponenBiaya(editing.id, payload);
        toast.success('Komponen biaya berhasil diperbarui');
      } else {
        await spmbService.createKomponenBiaya(payload);
        toast.success('Komponen biaya berhasil ditambahkan');
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || error.message || 'Gagal menyimpan komponen biaya');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      search: filterSearch,
      kategori: filterKategori,
      status: filterStatus,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKategori('');
    setFilterStatus('');
    setFilterOrderBy('urutan');
    setFilterOrderDir('asc');
    updateURLParams({
      page: 1,
      search: '',
      kategori: '',
      status: '',
      sort_by: 'urutan',
      sort_dir: 'asc',
    });
    setShowFilter(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item?.id) return;
    try {
      setDeleteLoading(true);
      await spmbService.deleteKomponenBiaya(deleteModal.item.id);
      toast.success(`Komponen biaya "${deleteModal.item.nama}" berhasil dihapus`);
      setDeleteModal({ isOpen: false, item: null });
      fetchData();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Gagal menghapus komponen biaya');
    } finally {
      setDeleteLoading(false);
    }
  };

  const otherComponents = existingComponents.filter((c) => c.id !== editing?.id);

  const columns: ColumnDef<MasterKomponenBiaya>[] = [
    {
      key: 'urutan',
      label: 'Urutan',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-xs text-slate-700">
          #{row.urutan}
        </span>
      ),
    },
    {
      key: 'kode',
      label: 'Kode',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
          {row.kode || '-'}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'Nama Komponen Biaya',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-xs text-slate-900">{row.nama}</div>
          {row.keterangan && (
            <div className="text-2xs text-slate-500 mt-2">{row.keterangan}</div>
          )}
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'Kategori Tahap',
      render: (row) => (
        <Badge variant="secondary">{row.kategori || 'Umum'}</Badge>
      ),
    },
    {
      key: 'tipe_potongan',
      label: 'Jenis',
      render: (row) =>
        row.tipe_potongan ? (
          <Badge variant="danger">Potongan / Diskon</Badge>
        ) : (
          <Badge variant="info">Biaya / Tagihan</Badge>
        ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="danger">Tidak Aktif</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Data',
                icon: <Edit size={16} />,
                onClick: () => openEdit(row),
              },
              {
                label: 'Reward Referral',
                icon: <Gift size={16} />,
                onClick: () => router.push(`/spmb/master/komponen-biaya/${row.id}/reward`),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={16} className="text-red-500" />,
                variant: 'danger',
                onClick: () => setDeleteModal({ isOpen: true, item: row }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Komponen Biaya"
        description="Kelola komponen biaya pendaftaran dan daftar ulang secara dinamis (DPI, UKT, Seragam, Atribut, dll)."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={openCreate}
            >
              Tambah Komponen
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(newPage) => updateURLParams({ page: newPage })}
        onLimitChange={(newLimit) => updateURLParams({ page: 1, limit: newLimit })}
        columns={columns}
        emptyMessage="Belum ada komponen biaya. Silakan tambahkan komponen biaya baru seperti Pendaftaran, DPI, Seragam, UKT, dll."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Komponen Biaya"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pencarian"
            placeholder="Kode atau nama komponen..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Kategori"
            value={filterKategori}
            onChange={(val) => setFilterKategori(val)}
            options={[
              { value: '', label: 'Semua Kategori' },
              { value: 'Pendaftaran', label: 'Pendaftaran' },
              { value: 'Daftar Ulang', label: 'Daftar Ulang' },
              { value: 'UKT', label: 'UKT' },
              { value: 'Seragam', label: 'Seragam' },
              { value: 'Lainnya', label: 'Lainnya' },
            ]}
          />

          <Select
            label="Status Aktif"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Tidak Aktif' },
            ]}
          />

          <hr className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'urutan', label: 'Urutan Tampil' },
                { value: 'nama', label: 'Nama Komponen' },
                { value: 'kode', label: 'Kode Komponen' },
                { value: 'id', label: 'ID' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />

            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Form Modal (Create & Edit) */}
      <Modal
        open={formOpen}
        onClose={() => !submitting && setFormOpen(false)}
        size="lg"
        title={editing ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Komponen"
              placeholder="Contoh: PENDAFTARAN, DPI, SERAGAM"
              hint="Kode unik untuk komponen ini."
              error={errors.kode?.message}
              {...register('kode')}
            />

            <Input
              label="Nama Komponen Biaya"
              placeholder="Contoh: Dana Pengembangan Institusi (DPI)"
              required
              hint="Nama lengkap komponen biaya atau tagihan."
              error={errors.nama?.message}
              {...register('nama')}
            />

            <Input
              label="Kategori / Kelompok Biaya"
              placeholder="Contoh: Pendaftaran, Daftar Ulang, UKT, Seragam"
              required
              hint="Tahapan pengelompokan biaya."
              error={errors.kategori?.message}
              {...register('kategori')}
            />

            <Select
              label="Posisi Urutan Tampil"
              value={positionType}
              onChange={(val) => {
                setPositionType(val as 'keep' | 'start' | 'end' | 'after' | 'before');
                if (val === 'keep' || val === 'end' || val === 'start') {
                  setReferenceId('');
                }
              }}
              options={[
                ...(editing ? [{ value: 'keep', label: 'Tetap di Posisi Saat Ini' }] : []),
                { value: 'start', label: 'Pindah ke Paling Awal (Urutan ke-1)' },
                { value: 'end', label: 'Pindah ke Paling Akhir' },
                { value: 'after', label: 'Pindah Setelah Komponen...' },
                { value: 'before', label: 'Pindah Sebelum Komponen...' },
              ]}
            />

            {(positionType === 'after' || positionType === 'before') && (
              <Select
                label="Pilih Komponen Acuan"
                value={referenceId}
                onChange={(val) => setReferenceId(val)}
                options={[
                  { value: '', label: '-- Pilih Komponen Acuan --' },
                  ...otherComponents.map((c) => ({
                    value: String(c.id),
                    label: `#${c.urutan} - ${c.nama} (${c.kode || 'Tanpa Kode'})`,
                  })),
                ]}
              />
            )}

            <div className="md:col-span-2">
              <Textarea
                label="Keterangan"
                placeholder="Catatan tambahan, contoh: Khusus untuk mahasiswa baru program sarjana dan diploma"
                hint="Opsional, informasi tambahan mengenai komponen biaya ini."
                error={errors.keterangan?.message}
                rows={3}
                {...register('keterangan')}
              />
            </div>

            <Checkbox
              label="Tipe Komponen Potongan"
              hint="Aktifkan jika komponen ini mengurangi tagihan (diskon / beasiswa)."
              {...register('tipe_potongan')}
            />

            <Checkbox
              label="Status Aktif (Komponen ini digunakan)"
              hint="Komponen aktif dapat dipilih pada master biaya SPMB."
              {...register('is_active')}
            />

            <div className="md:col-span-2 flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <Info size={16} className="shrink-0" style={{ color: 'var(--module-primary)' }} />
              <span>
                Komponen ini menentukan posisi urutan tampil pada rincian Master Biaya SPMB.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={<Save size={16} />}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Hapus Komponen Biaya"
        message={
          <span>
            Apakah Anda yakin ingin menghapus komponen biaya <strong>&quot;{deleteModal.item?.nama}&quot;</strong>?
            Komponen yang sudah digunakan pada master biaya tidak disarankan untuk dihapus.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
