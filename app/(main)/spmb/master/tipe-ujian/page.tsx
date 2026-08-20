'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { TipeUjianMaster } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface FormValues {
  kode: string;
  nama: string;
  deskripsi: string;
  is_active: boolean;
}

export default function MasterTipeUjianPage() {
  const [data, setData] = useState<TipeUjianMaster[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
  });

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipeUjianMaster | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      kode: '',
      nama: '',
      deskripsi: '',
      is_active: true,
    },
  });

  const isActiveValue = watch('is_active');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await spmbService.getTipeUjian({
        search: appliedFilters.search || undefined,
        is_active: appliedFilters.status ? appliedFilters.status === 'active' : undefined,
      });
      const list = res.data?.data || res.data || [];
      setData(Array.isArray(list) ? list : []);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data master tipe ujian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      kode: '',
      nama: '',
      deskripsi: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TipeUjianMaster) => {
    setEditingItem(item);
    reset({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      is_active: Boolean(item.is_active),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus master tipe ujian ini?')) return;
    try {
      await spmbService.deleteTipeUjian(id);
      toast.success('Master tipe ujian berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus tipe ujian');
    }
  };

  const onSubmitForm = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await spmbService.updateTipeUjian(editingItem.id, formData);
        toast.success('Master tipe ujian berhasil diperbarui');
      } else {
        await spmbService.createTipeUjian(formData);
        toast.success('Master tipe ujian baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data tipe ujian');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const query = appliedFilters.search.toLowerCase();
        const matchName = item.nama.toLowerCase().includes(query);
        const matchCode = item.kode.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }
      if (appliedFilters.status === 'active' && !item.is_active) return false;
      if (appliedFilters.status === 'inactive' && item.is_active) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      status: filterStatus,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setAppliedFilters({ search: '', status: '' });
    setShowFilter(false);
  };

  const columns: ColumnDef<TipeUjianMaster>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md uppercase">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA TIPE UJIAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) =>
        row.is_active ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(row)}
            icon={<Edit size={14} />}
            className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            icon={<Trash2 size={14} />}
            className="font-semibold text-rose-600 hover:bg-rose-50"
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Master Tipe Pelaksanaan Ujian"
        description="Kelola jenis dan metode seleksi ujian masuk SPMB (CBT, Praktik, Wawancara, dll.)"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              icon={<Filter size={16} />}
              className="font-bold min-h-[40px]"
            >
              Filter &amp; Pencarian
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenAdd}
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Tambah Tipe Ujian
            </Button>
          </div>
        }
      />

      {/* ── Data Table ─────────────────────────────────────────────── */}
      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data master tipe ujian."
      />

      {/* ── Modal Add / Edit Tipe Ujian ────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Master Tipe Ujian' : 'Tambah Master Tipe Ujian Baru'}
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
          <Input
            label="Kode Tipe Ujian *"
            placeholder="Contoh: cbt, praktik, wawancara"
            {...register('kode', { required: 'Kode wajib diisi' })}
            error={errors.kode?.message}
            hint="Gunakan huruf kecil tanpa spasi (unik)"
          />

          <Input
            label="Nama Tipe Pelaksanaan Ujian *"
            placeholder="Contoh: Ujian Tulis Komputer (CBT)"
            {...register('nama', { required: 'Nama tipe ujian wajib diisi' })}
            error={errors.nama?.message}
          />

          <Input
            label="Deskripsi / Catatan Tambahan"
            placeholder="Penjelasan singkat mengenai metode pelaksanaan tes ini..."
            {...register('deskripsi')}
          />

          <Select
            label="Status Aktif *"
            options={[
              { value: 'true', label: 'Aktif (Dapat Digunakan)' },
              { value: 'false', label: 'Non-Aktif (Diarsipkan)' },
            ]}
            value={isActiveValue ? 'true' : 'false'}
            onChange={(val) => setValue('is_active', val === 'true')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Tipe Ujian' : 'Simpan Tipe Ujian'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Filter Drawer (Sesuai admin_filter_standard) ───────────── */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Master Tipe Ujian"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              Pencarian &amp; Status
            </h4>
            <Input
              label="Cari Kode atau Nama Tipe Ujian"
              placeholder="Ketik kata kunci..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />

            <Select
              label="Status Keaktifan"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as string)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'active', label: 'Hanya Yang Aktif' },
                { value: 'inactive', label: 'Hanya Yang Non-Aktif' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
