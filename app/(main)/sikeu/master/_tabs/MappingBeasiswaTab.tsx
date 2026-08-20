'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface MahasiswaBeasiswa {
  id: number;
  mahasiswa_id: number;
  nama_mahasiswa: string;
  nim: string;
  nama_beasiswa: string;
  potongan_text?: string;
  status: string;
  berlaku_mulai?: string;
  berlaku_sampai?: string;
}

interface FormValues {
  mahasiswa_id: number;
  beasiswa_id: number;
  berlaku_mulai: string;
  berlaku_sampai: string;
}

export function MappingBeasiswaTab() {
  const [data, setData] = useState<MahasiswaBeasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [beasiswaOptions, setBeasiswaOptions] = useState<any[]>([]);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mahasiswa_id: 101,
      beasiswa_id: 1,
      berlaku_mulai: '2024-01-01',
      berlaku_sampai: '2027-12-31',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getMahasiswaBeasiswaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data penerima beasiswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeasiswaList = async () => {
    try {
      const res = await sikeuService.getBeasiswaList();
      setBeasiswaOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBeasiswaOptions([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBeasiswaList();
  }, []);

  const handleOpenAdd = () => {
    reset({
      mahasiswa_id: 101,
      beasiswa_id: beasiswaOptions[0]?.id || 1,
      berlaku_mulai: '2024-01-01',
      berlaku_sampai: '2027-12-31',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.assignMahasiswaBeasiswa(formData);
      toast.success('Penerima beasiswa berhasil ditetapkan');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menetapkan beasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setAppliedFilters({ search: '', status: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama_mahasiswa?.toLowerCase().includes(q) && !item.nim?.toLowerCase().includes(q) && !item.nama_beasiswa?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<MahasiswaBeasiswa>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA PENERIMA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'nama_beasiswa',
      label: 'PROGRAM BEASISWA',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">{row.nama_beasiswa}</span>
      ),
    },
    {
      key: 'potongan_text',
      label: 'POTONGAN',
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">{row.potongan_text || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status === 'aktif' ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
          </span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Penetapan Penerima Beasiswa"
        description="Daftar mahasiswa penerima alokasi beasiswa dan potongan biaya perkuliahan."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tetapkan Penerima Beasiswa
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data penerima beasiswa." />

      {/* Modal Add */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tetapkan Penerima Beasiswa Baru">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input type="number" label="ID Mahasiswa *" placeholder="101"
            {...register('mahasiswa_id', { required: 'ID Mahasiswa wajib diisi', valueAsNumber: true })}
            error={errors.mahasiswa_id?.message} />

          <Select label="Program Beasiswa *"
            options={beasiswaOptions.map(b => ({ value: b.id.toString(), label: b.nama }))}
            value={watch('beasiswa_id')?.toString()}
            onChange={(val) => setValue('beasiswa_id', Number(val))} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" label="Berlaku Mulai *"
              {...register('berlaku_mulai', { required: 'Tanggal mulai wajib diisi' })} />
            <Input type="date" label="Berlaku Sampai *"
              {...register('berlaku_sampai', { required: 'Tanggal selesai wajib diisi' })} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : 'Simpan Penetapan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Penerima Beasiswa" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nama / NIM / Beasiswa" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Non-Aktif' },
            ]} />
        </div>
      </Drawer>
    </>
  );
}
