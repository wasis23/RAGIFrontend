'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2, ShieldAlert, CheckCircle2, XCircle, Clock, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { MasterJenisCuti, TipeDurasiCuti } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

const masterJenisCutiSchema = z.object({
  nama: z.string().min(1, 'Nama jenis izin/cuti wajib diisi'),
  kode: z.string().optional(),
  tipe_durasi: z.enum(['ditetapkan', 'fleksibel'], {
    message: 'Tipe durasi wajib dipilih',
  }),
  durasi_hari: z.number().min(0, 'Durasi hari tidak boleh bernilai negatif').optional(),
  satuan: z.string(),
  lampiran_wajib: z.boolean(),
  keterangan: z.string().optional(),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.tipe_durasi === 'ditetapkan') {
    return (data.durasi_hari ?? 0) >= 1;
  }
  return true;
}, {
  message: 'Durasi hari wajib diisi minimal 1 hari jika tipe durasi ditetapkan',
  path: ['durasi_hari'],
});

type MasterJenisCutiFormValues = z.infer<typeof masterJenisCutiSchema>;

export default function MasterJenisCutiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.cuti.read') || hasPermission('simpeg.cuti.manage') || hasPermission('simpeg.cuti.update');
  const canManage = hasPermission('simpeg.cuti.manage') || hasPermission('simpeg.cuti.update') || hasPermission('simpeg.cuti.create');

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<MasterJenisCuti[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Sorting states
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<MasterJenisCuti | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MasterJenisCutiFormValues>({
    resolver: zodResolver(masterJenisCutiSchema),
    defaultValues: {
      nama: '',
      kode: '',
      tipe_durasi: 'fleksibel',
      durasi_hari: 0,
      satuan: 'hari',
      lampiran_wajib: false,
      keterangan: '',
      is_active: true,
    },
  });

  const watchTipeDurasi = watch('tipe_durasi');

  const loadData = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getMasterJenisCutiList({
        page,
        limit,
        search: search || undefined,
        tipe_durasi: filterTipe || undefined,
        is_active: filterStatus !== '' ? filterStatus : undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setDataList(res.data || []);
        setMeta(res.meta);
      } else {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setDataList(items);
      }
    } catch (err) {
      console.error('Gagal memuat master jenis cuti', err);
      toast.error('Gagal memuat daftar jenis izin & cuti.');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterTipe, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({
      nama: '',
      kode: '',
      tipe_durasi: 'fleksibel',
      durasi_hari: 0,
      satuan: 'hari',
      lampiran_wajib: false,
      keterangan: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MasterJenisCuti) => {
    setEditId(item.id);
    reset({
      nama: item.nama,
      kode: item.kode || '',
      tipe_durasi: item.tipe_durasi,
      durasi_hari: item.durasi_hari || 0,
      satuan: item.satuan || 'hari',
      lampiran_wajib: Boolean(item.lampiran_wajib),
      keterangan: item.keterangan || '',
      is_active: Boolean(item.is_active),
    });
    setShowModal(true);
  };

  const onSubmit = async (values: MasterJenisCutiFormValues) => {
    if (!canManage) {
      toast.error('Akses ditolak: Anda tidak memiliki izin mengelola master jenis cuti.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<MasterJenisCuti> = {
        nama: values.nama,
        kode: values.kode ? values.kode.toUpperCase().trim() : undefined,
        tipe_durasi: values.tipe_durasi,
        durasi_hari: values.tipe_durasi === 'ditetapkan' ? Number(values.durasi_hari) : 0,
        satuan: values.satuan || 'hari',
        lampiran_wajib: values.lampiran_wajib,
        keterangan: values.keterangan || '',
        is_active: values.is_active,
      };

      if (editId) {
        await simpegService.updateMasterJenisCuti(editId, payload);
        toast.success('Master jenis izin/cuti berhasil diperbarui');
      } else {
        await simpegService.createMasterJenisCuti(payload);
        toast.success('Master jenis izin/cuti baru berhasil ditambahkan');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan master jenis cuti';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDelete) return;
    setIsDeleting(true);
    try {
      await simpegService.deleteMasterJenisCuti(selectedDelete.id);
      toast.success(`Jenis cuti ${selectedDelete.nama} berhasil dihapus/dinonaktifkan.`);
      setShowDeleteModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jenis cuti.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<MasterJenisCuti>[] = [
    {
      key: 'nama',
      label: 'Nama Jenis Izin & Cuti',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.nama}</span>
          {row.kode && (
            <span className="text-xs text-slate-400 font-mono tracking-wider">{row.kode}</span>
          )}
          {row.keterangan && (
            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.keterangan}</span>
          )}
        </div>
      ),
    },
    {
      key: 'tipe_durasi',
      label: 'Tipe Durasi',
      render: (row) => {
        const isDitetapkan = row.tipe_durasi === 'ditetapkan';
        return (
          <Badge
            variant={isDitetapkan ? 'amber' : 'blue'}
            className="capitalize font-medium flex items-center gap-1 w-fit"
          >
            {isDitetapkan ? <Clock size={12} /> : <CalendarDays size={12} />}
            {isDitetapkan ? 'Durasi Ditetapkan' : 'Durasi Fleksibel'}
          </Badge>
        );
      },
    },
    {
      key: 'durasi_hari',
      label: 'Durasi Baku',
      render: (row) => (
        <div className="text-sm">
          {row.tipe_durasi === 'ditetapkan' ? (
            <span className="font-bold text-slate-900 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
              {row.durasi_hari} {row.satuan || 'Hari'}
            </span>
          ) : (
            <span className="text-slate-400 italic">Fleksibel (Bebas)</span>
          )}
        </div>
      ),
    },
    {
      key: 'lampiran_wajib',
      label: 'Berkas Lampiran',
      render: (row) => (
        <Badge
          variant={row.lampiran_wajib ? 'warning' : 'secondary'}
          className="text-xs font-medium"
        >
          {row.lampiran_wajib ? 'Wajib Lampiran' : 'Opsional'}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge
          variant={row.is_active ? 'success' : 'danger'}
          className="capitalize text-xs font-medium"
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => {
                  setSelectedDelete(row);
                  setShowDeleteModal(true);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  if (!canRead) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-800">Akses Dibatasi</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Anda tidak memiliki izin untuk melihat modul Master Jenis Cuti & Izin Kepegawaian.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mobile-first Header with Action Buttons */}
      <PageHeader
        title="Master Jenis Izin & Cuti"
        description="Pengaturan durasi cuti baku (ditetapkan) dan fleksibel untuk seluruh pegawai dan dosen"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canManage && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
                Tambah Jenis Cuti
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Drawer (Right-to-Left) */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jenis Izin & Cuti"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari nama, kode, atau keterangan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Tipe Durasi"
            value={filterTipe}
            onChange={(val) => {
              setFilterTipe(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Tipe Durasi' },
              { value: 'ditetapkan', label: 'Durasi Ditetapkan (Pasti)' },
              { value: 'fleksibel', label: 'Durasi Fleksibel (Bebas)' },
            ]}
          />

          <Select
            label="Status Aktif"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: '1', label: 'Hanya Aktif' },
              { value: '0', label: 'Hanya Nonaktif' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          {/* Sorting 2-Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'nama', label: 'Nama' },
                { value: 'kode', label: 'Kode' },
                { value: 'tipe_durasi', label: 'Tipe Durasi' },
                { value: 'durasi_hari', label: 'Durasi Hari' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch('');
                setFilterTipe('');
                setFilterStatus('');
                setFilterOrderBy('nama');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button className="w-full" onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={dataList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        emptyMessage="Belum ada data master jenis cuti / izin."
      />

      {/* Modal Form Tambah / Ubah */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Ubah Jenis Izin & Cuti' : 'Tambah Jenis Izin & Cuti'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Jenis Cuti / Izin"
              placeholder="Contoh: Izin Menikah"
              required
              error={errors.nama?.message}
              {...register('nama')}
            />

            <Input
              label="Kode Unik (Opsional)"
              placeholder="Contoh: IZIN_MENIKAH"
              error={errors.kode?.message}
              {...register('kode')}
            />

            <Controller
              name="tipe_durasi"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipe Durasi"
                  required
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    if (val === 'fleksibel') {
                      setValue('durasi_hari', 0);
                    }
                  }}
                  error={errors.tipe_durasi?.message}
                  options={[
                    { value: 'ditetapkan', label: 'Durasi Ditetapkan (Baku/Pasti)' },
                    { value: 'fleksibel', label: 'Durasi Fleksibel (Bebas Dipilih)' },
                  ]}
                />
              )}
            />

            {watchTipeDurasi === 'ditetapkan' ? (
              <Input
                label="Durasi Baku (Hari)"
                type="number"
                min={1}
                required
                placeholder="Contoh: 14"
                error={errors.durasi_hari?.message}
                {...register('durasi_hari', { valueAsNumber: true })}
              />
            ) : (
              <div className="flex flex-col justify-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Durasi Hari</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  Tipe fleksibel: durasi ditentukan pemohon saat pengajuan
                </span>
              </div>
            )}

            <Controller
              name="lampiran_wajib"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kebutuhan Berkas Lampiran"
                  value={field.value ? '1' : '0'}
                  onChange={(val) => field.onChange(val === '1')}
                  options={[
                    { value: '0', label: 'Opsional (Tidak Wajib)' },
                    { value: '1', label: 'Wajib Lampirkan Dokumen / Surat' },
                  ]}
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status Aktif"
                  value={field.value ? '1' : '0'}
                  onChange={(val) => field.onChange(val === '1')}
                  options={[
                    { value: '1', label: 'Aktif' },
                    { value: '0', label: 'Nonaktif' },
                  ]}
                />
              )}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Keterangan / Persyaratan"
                placeholder="Deskripsi singkat atau aturan pemakaian izin/cuti ini..."
                rows={2}
                error={errors.keterangan?.message}
                {...register('keterangan')}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editId ? 'Simpan Perubahan' : 'Tambah Jenis Cuti'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus Jenis Cuti"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus jenis izin/cuti{' '}
            <strong className="text-slate-900">{selectedDelete?.nama}</strong>?
          </p>
          <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
            Jika jenis cuti ini telah memiliki riwayat permohonan, data hanya akan dinonaktifkan
            (soft deleted) agar rekaman cuti pegawai tetap valid.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
