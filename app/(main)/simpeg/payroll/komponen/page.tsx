'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  DollarSign, 
  Layers, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { MasterKomponenGaji } from '@/types/simpeg.types';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').toUpperCase(),
  nama: z.string().min(3, 'Nama komponen minimal 3 karakter'),
  jenis: z.enum(['pendapatan', 'potongan']),
  tipe_nilai: z.enum(['tetap', 'rumus_sks', 'rumus_kehadiran', 'rumus_pph21', 'persentase']),
  nilai_default: z.number().min(0, 'Nilai default tidak boleh negatif'),
  is_taxable: z.boolean(),
  is_active: z.boolean(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  keterangan: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MasterKomponenGajiPage() {
  const router = useRouter();
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [komponenList, setKomponenList] = useState<MasterKomponenGaji[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterKomponenGaji | null>(null);

  // Confirm Delete State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MasterKomponenGaji | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode: '',
      nama: '',
      jenis: 'pendapatan',
      tipe_nilai: 'tetap',
      nilai_default: 0,
      is_taxable: true,
      is_active: true,
      urutan: 1,
      keterangan: '',
    },
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await simpegService.getKomponenGajiList({ search });
      setKomponenList(res?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master komponen gaji');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      kode: '',
      nama: '',
      jenis: 'pendapatan',
      tipe_nilai: 'tetap',
      nilai_default: 0,
      is_taxable: true,
      is_active: true,
      urutan: (komponenList.length || 0) + 1,
      keterangan: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MasterKomponenGaji) => {
    setEditingItem(item);
    reset({
      kode: item.kode,
      nama: item.nama,
      jenis: item.jenis,
      tipe_nilai: item.tipe_nilai,
      nilai_default: item.nilai_default,
      is_taxable: item.is_taxable,
      is_active: item.is_active,
      urutan: item.urutan,
      keterangan: item.keterangan || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingItem) {
        await simpegService.updateKomponenGaji(editingItem.id, values);
        toast.success(`Komponen '${values.nama}' berhasil diperbarui`);
      } else {
        await simpegService.createKomponenGaji(values);
        toast.success(`Komponen '${values.nama}' berhasil ditambahkan`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan komponen gaji');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      await simpegService.deleteKomponenGaji(deleteModal.item.id);
      toast.success(`Komponen '${deleteModal.item.nama}' berhasil dihapus`);
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus komponen gaji');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns: ColumnDef<MasterKomponenGaji>[] = [
    {
      key: 'urutan',
      label: 'No',
      render: (row) => <span className="font-bold font-mono text-slate-500">#{row.urutan}</span>,
    },
    {
      key: 'nama',
      label: 'Nama Komponen & Kode',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.nama}</span>
          <span className="text-[11px] font-mono text-slate-500">Kode: {row.kode}</span>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => (
        <Badge variant={row.jenis === 'pendapatan' ? 'green' : 'red'} className="uppercase font-bold">
          {row.jenis}
        </Badge>
      ),
    },
    {
      key: 'tipe_nilai',
      label: 'Metode Kalkulasi',
      render: (row) => {
        const labels: Record<string, string> = {
          tetap: 'Nominal Tetap',
          rumus_sks: 'Formula SKS SIAKAD',
          rumus_kehadiran: 'Presensi Hadir SIMPEG',
          rumus_pph21: 'Formula PPh 21 (TER)',
          persentase: 'Persentase Gaji',
        };
        return (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
            {labels[row.tipe_nilai] || row.tipe_nilai}
          </span>
        );
      },
    },
    {
      key: 'nilai_default',
      label: 'Tarif / Nilai Default',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800">
          {row.tipe_nilai === 'rumus_sks'
            ? `${formatRupiah(row.nilai_default)} / SKS`
            : row.tipe_nilai === 'rumus_kehadiran'
            ? `${formatRupiah(row.nilai_default)} / Hari`
            : row.tipe_nilai === 'rumus_pph21'
            ? 'Dinamis (TER / PTKP)'
            : formatRupiah(row.nilai_default)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Ubah Konfigurasi',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEdit(row),
                },
                {
                  label: 'Hapus Komponen',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => setDeleteModal({ isOpen: true, item: row, isLoading: false }),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Komponen Gaji & Insentif"
        description="Konfigurasi formula insentif fungsional dosen, honor mengajar SKS, transport, dan potongan pajak PPh 21"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/payroll')}
            >
              Kembali ke Payroll
            </Button>
            {canManage && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreate}
              >
                Tambah Komponen
              </Button>
            )}
          </div>
        }
      />

      <div className="card p-4 border border-slate-200">
        <Input
          placeholder="Cari nama komponen atau kode (misal: SKS, TRANSPORT, BPJS)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={komponenList}
        isLoading={loading}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <Layers size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada master komponen gaji yang terdaftar.</p>
          </div>
        }
      />

      {/* Modal Form Tambah / Ubah Komponen */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Ubah Komponen: ${editingItem.nama}` : 'Tambah Master Komponen Gaji Baru'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              <CheckCircle2 size={16} /> Simpan Komponen
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Kode Komponen (Unik)"
                placeholder="Contoh: HONOR_SKS"
                {...register('kode')}
                error={errors.kode?.message}
                required
              />
            </div>
            <div>
              <Input
                label="Nama Komponen"
                placeholder="Contoh: Honor Mengajar SKS"
                {...register('nama')}
                error={errors.nama?.message}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Jenis Komponen"
                value={watch('jenis')}
                onChange={(val) => setValue('jenis', val as 'pendapatan' | 'potongan')}
                options={[
                  { value: 'pendapatan', label: 'Pendapatan / Tunjangan (+)' },
                  { value: 'potongan', label: 'Potongan Pajak / Iuran (-)' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Metode / Rumus Nilai"
                value={watch('tipe_nilai')}
                onChange={(val) => setValue('tipe_nilai', val as any)}
                options={[
                  { value: 'tetap', label: 'Nominal Tetap Bulanan' },
                  { value: 'rumus_sks', label: 'Formula Total SKS Mengajar (SIAKAD)' },
                  { value: 'rumus_kehadiran', label: 'Formula Hari Hadir Tepat Waktu (SIMPEG)' },
                  { value: 'rumus_pph21', label: 'Formula Pajak PPh 21 (TER)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Tarif / Nilai Default (Rp)"
                type="number"
                placeholder="0"
                {...register('nilai_default', { valueAsNumber: true })}
                error={errors.nilai_default?.message}
                required
              />
            </div>
            <div>
              <Input
                label="Urutan Tampil"
                type="number"
                placeholder="1"
                {...register('urutan', { valueAsNumber: true })}
                error={errors.urutan?.message}
                required
              />
            </div>
          </div>

          <div>
            <Input
              label="Keterangan Tambahan (Opsional)"
              placeholder="Penjelasan komponen atau dasar peraturan..."
              {...register('keterangan')}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteModal.isLoading}
        title="Hapus Komponen Gaji"
        message={
          <span>
            Apakah Anda yakin ingin menghapus komponen <strong>{deleteModal.item?.nama}</strong>? Seluruh formula yang menggunakannya akan terpengaruh.
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
