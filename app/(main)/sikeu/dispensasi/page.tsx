'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Filter, CheckCircle2, Clock, XCircle, Loader2, Save, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface DispensasiItem {
  id: number;
  mahasiswa_id: number;
  nama_mahasiswa: string;
  nim: string;
  tipe_dispensasi: string;
  nominal_per_cicilan: number;
  jatuh_tempo_baru: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  alasan?: string;
}

interface FormValues {
  mahasiswa_id: number;
  tipe_dispensasi: string;
  jatuh_tempo_baru: string;
  nominal_per_cicilan: number;
  alasan: string;
}

const TIPE_DISPENSASI_OPTIONS = [
  { value: 'penundaan_jatuh_tempo', label: 'Penundaan Tanggal Jatuh Tempo' },
  { value: 'pembayaran_cicilan', label: 'Skema Pembayaran Per-Cicilan' },
  { value: 'keringanan_potongan', label: 'Permohonan Keringanan Khusus' },
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function DispensasiListPage() {
  const [data, setData] = useState<DispensasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'all' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mahasiswa_id: 101,
      tipe_dispensasi: 'penundaan_jatuh_tempo',
      jatuh_tempo_baru: '2026-09-30',
      nominal_per_cicilan: 1500000,
      alasan: '',
    },
  });

  const fetchDispensasi = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getDispensasiList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(list);
    } catch {
      setData([]);
      toast.error('Gagal memuat data dispensasi tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispensasi();
  }, []);

  const handleOpenAdd = () => {
    reset({
      mahasiswa_id: 101,
      tipe_dispensasi: 'penundaan_jatuh_tempo',
      jatuh_tempo_baru: '2026-09-30',
      nominal_per_cicilan: 1500000,
      alasan: '',
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.submitDispensasi({
        tagihan_id: 1,
        ...formData,
      });
      toast.success('Pengajuan dispensasi pembayaran berhasil dikirim');
      setIsModalOpen(false);
      fetchDispensasi();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mengajukan dispensasi');
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
    setFilterStatus('all');
    setAppliedFilters({ search: '', status: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama_mahasiswa?.toLowerCase().includes(q) && !item.nim?.toLowerCase().includes(q) && !item.alasan?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<DispensasiItem>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa || `Mahasiswa #${row.mahasiswa_id}`}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tipe_dispensasi',
      label: 'TIPE DISPENSASI',
      render: (row) => {
        const label = TIPE_DISPENSASI_OPTIONS.find(t => t.value === row.tipe_dispensasi)?.label || row.tipe_dispensasi;
        return <span className="badge badge-purple text-xs font-semibold">{label}</span>;
      },
    },
    {
      key: 'jatuh_tempo_baru',
      label: 'JATUH TEMPO BARU',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
          {row.jatuh_tempo_baru || '-'}
        </span>
      ),
    },
    {
      key: 'nominal_per_cicilan',
      label: 'NOMINAL CICILAN / DISPENSASI',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_per_cicilan || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'approved') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Disetujui
            </span>
          );
        }
        if (row.status === 'rejected') {
          return (
            <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
              <XCircle size={12} /> Ditolak
            </span>
          );
        }
        return (
          <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> Menunggu Persetujuan
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Dispensasi & Keringanan Pembayaran Tagihan"
        description="Kelola permohonan cicilan, penundaan tanggal jatuh tempo, dan peringanan beban biaya mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAdd}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Pengajuan Dispensasi Baru
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada permohonan dispensasi tagihan." />

      {/* Modal Pengajuan */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengajuan Dispensasi Tagihan Baru">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
          <Input type="number" label="ID Mahasiswa *" placeholder="101"
            {...register('mahasiswa_id', { required: 'ID Mahasiswa wajib diisi', valueAsNumber: true })}
            error={errors.mahasiswa_id?.message} />

          <Select label="Tipe Dispensasi *"
            options={TIPE_DISPENSASI_OPTIONS}
            value={watch('tipe_dispensasi')}
            onChange={(val) => setValue('tipe_dispensasi', val as string)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" label="Batas Tanggal Jatuh Tempo Baru *"
              {...register('jatuh_tempo_baru', { required: 'Tanggal jatuh tempo baru wajib diisi' })}
              error={errors.jatuh_tempo_baru?.message} />

            <Input type="number" label="Nominal Per Cicilan (Rp) *" placeholder="1500000"
              {...register('nominal_per_cicilan', { required: 'Nominal wajib diisi', valueAsNumber: true })}
              error={errors.nominal_per_cicilan?.message} />
          </div>

          <Textarea label="Alasan Permohonan Dispensasi *" placeholder="Jelaskan kendala finansial / pertimbangan permohonan..."
            {...register('alasan', { required: 'Alasan wajib diisi' })}
            error={errors.alasan?.message} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Dispensasi" width="420px"
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
          <Input label="Cari Nama / NIM / Alasan" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Status Persetujuan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'pending', label: 'Menunggu Persetujuan' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'rejected', label: 'Ditolak' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
