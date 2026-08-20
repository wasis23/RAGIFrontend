'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Filter, DollarSign, Wallet, Building, CheckCircle2, XCircle, Loader2, Save, Send
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
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';

interface UnitKas {
  id: number;
  nama_kas: string;
  tipe_kas: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  penanggung_jawab?: string;
  saldo_saat_ini?: number;
  status: boolean;
  deskripsi?: string;
}

interface PengajuanFormValues {
  unit_kas_id: number;
  judul_pengajuan: string;
  nominal_diajukan: number;
  deskripsi: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function UnitKasPage() {
  const [data, setData] = useState<UnitKas[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', tipe: 'all' });

  // Modal Pengajuan Kas State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PengajuanFormValues>({
    defaultValues: {
      unit_kas_id: 1,
      judul_pengajuan: 'Pengisian Uang Muka Operasional Unit (Petty Cash)',
      nominal_diajukan: 5000000,
      deskripsi: 'Pengisian ulang saldo kas operasional harian fakultas/unit',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getUnitKasList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(list);
    } catch {
      setData([]);
      toast.error('Gagal memuat data unit kas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmitPengajuan = async (formData: PengajuanFormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.storePengajuanKas(formData);
      toast.success('Pengajuan dana kas unit berhasil dikirim');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mengajukan kas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, tipe: filterTipe });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterTipe('all');
    setAppliedFilters({ search: '', tipe: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama_kas?.toLowerCase().includes(q) &&
            !item.bank_name?.toLowerCase().includes(q) &&
            !item.bank_account_number?.toLowerCase().includes(q) &&
            !item.penanggung_jawab?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.tipe !== 'all' && item.tipe_kas !== appliedFilters.tipe) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const totalSaldoUtama = useMemo(() => {
    return filteredData
      .filter((u) => u.tipe_kas === 'utama')
      .reduce((sum, u) => sum + (u.saldo_saat_ini || 0), 0);
  }, [filteredData]);

  const columns: ColumnDef<UnitKas>[] = [
    {
      key: 'nama_kas',
      label: 'NAMA KAS / REKENING',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_kas}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'tipe_kas',
      label: 'TIPE & PENANGGUNG JAWAB',
      render: (row) => (
        <div>
          <span className="badge badge-purple text-xs font-bold uppercase">{row.tipe_kas || 'Operasional'}</span>
          <p className="text-2xs text-slate-500 font-semibold mt-1">PJ: {row.penanggung_jawab || '-'}</p>
        </div>
      ),
    },
    {
      key: 'bank_info',
      label: 'INFORMASI REKENING BANK',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{row.bank_name || 'Bank'} - {row.bank_account_number || '-'}</p>
          <p className="text-2xs text-slate-500">{row.bank_account_name || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status !== false ? (
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
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Kas Unit & Mutasi Operasional"
        description="Kelola kas operasional fakultas, petty cash, dan mutasi saldo pencairan dari Kas Utama."
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
              icon={<Send size={16} />}
              onClick={() => setIsModalOpen(true)}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Pengajuan Kas Unit
            </Button>
          </div>
        }
      />

      {/* Summary Card */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Kas & Rekening Utama Rektorat</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatRupiah(totalSaldoUtama)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <Wallet size={20} />
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data kas unit & rekening." />

      {/* Modal Pengajuan Kas */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengajuan Pencairan Kas Unit">
        <form onSubmit={handleSubmit(onSubmitPengajuan)} className="space-y-5">
          <Select
            label="Pilih Kas Unit Pemohon *"
            options={data.map(u => ({ value: u.id.toString(), label: u.nama_kas }))}
            value={watch('unit_kas_id')?.toString() || '1'}
            onChange={(val) => setValue('unit_kas_id', Number(val))}
          />

          <Input label="Judul / Peruntukan Pengajuan *" placeholder="Contoh: Pengisian Uang Muka Petty Cash FEB"
            {...register('judul_pengajuan', { required: 'Judul pengajuan wajib diisi' })}
            error={errors.judul_pengajuan?.message} />

          <Input type="number" label="Nominal Pencairan (Rp) *" placeholder="5000000"
            {...register('nominal_diajukan', { required: 'Nominal wajib diisi', valueAsNumber: true })}
            error={errors.nominal_diajukan?.message} />

          <Textarea label="Deskripsi & Kebutuhan *" placeholder="Penjelasan mengenai kebutuhan dana..."
            {...register('deskripsi', { required: 'Deskripsi wajib diisi' })}
            error={errors.deskripsi?.message} />

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
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Unit Kas" width="420px"
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
          <Input label="Cari Nama Kas / Rekening / PJ" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Tipe Kas"
            value={filterTipe}
            onChange={(val) => setFilterTipe(val as string)}
            options={[
              { value: 'all', label: 'Semua Tipe Kas' },
              { value: 'utama', label: 'Kas Utama (Rektorat)' },
              { value: 'operasional', label: 'Kas Operasional Unit' },
              { value: 'petty_cash', label: 'Petty Cash / Kas Kecil' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
