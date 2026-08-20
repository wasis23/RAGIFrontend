'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Filter, CheckCircle2, XCircle, Loader2, Save, Download
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
import { useForm } from 'react-hook-form';

interface TaxItem {
  id: number;
  nomor: string;
  jenis: string;
  deskripsi: string;
  vendor?: string;
  nominal_pajak: number;
  status: 'disetor' | 'terutang' | string;
  ntpn?: string;
  tanggal_setor?: string;
}

interface SetorFormValues {
  ntpn: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function TaxReportPage() {
  const [data, setData] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', jenis: 'all', status: 'all' });

  // Modal Setor State
  const [activeItem, setActiveItem] = useState<TaxItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SetorFormValues>({
    defaultValues: { ntpn: '' },
  });

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPajakList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(list);
    } catch {
      setData([]);
      toast.error('Gagal memuat data kewajiban pajak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleOpenSetor = (item: TaxItem) => {
    setActiveItem(item);
    reset({ ntpn: '' });
  };

  const onSubmitSetor = async (formData: SetorFormValues) => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await sikeuService.setorPajak(activeItem.id, { ntpn: formData.ntpn });
      toast.success(`Bukti setor NTPN ${formData.ntpn} berhasil dicatat`);
      setActiveItem(null);
      fetchTaxes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menginput NTPN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, jenis: filterJenis, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterJenis('all');
    setFilterStatus('all');
    setAppliedFilters({ search: '', jenis: 'all', status: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nomor?.toLowerCase().includes(q) && !item.deskripsi?.toLowerCase().includes(q) && !item.ntpn?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.jenis !== 'all' && item.jenis !== appliedFilters.jenis) return false;
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const totalTerutang = useMemo(() => {
    return filteredData
      .filter((t) => t.status === 'terutang')
      .reduce((sum, t) => sum + (t.nominal_pajak || 0), 0);
  }, [filteredData]);

  const totalDisetor = useMemo(() => {
    return filteredData
      .filter((t) => t.status === 'disetor')
      .reduce((sum, t) => sum + (t.nominal_pajak || 0), 0);
  }, [filteredData]);

  const columns: ColumnDef<TaxItem>[] = [
    {
      key: 'nomor',
      label: 'NOMOR & DESKRIPSI',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor || `TAX-${row.id}`}
          </span>
          <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">{row.deskripsi}</p>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'JENIS PAJAK',
      render: (row) => (
        <span className="badge badge-purple text-xs font-bold uppercase">{row.jenis || 'PPh 21'}</span>
      ),
    },
    {
      key: 'nominal_pajak',
      label: 'NOMINAL PAJAK (RP)',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_pajak || 0)}
        </span>
      ),
    },
    {
      key: 'ntpn',
      label: 'NTPN BUKTI SETOR',
      render: (row) =>
        row.ntpn ? (
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md">
            {row.ntpn}
          </span>
        ) : (
          <span className="text-2xs text-slate-400 font-semibold">— Belum Disetor</span>
        ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status === 'disetor' ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Sudah Disetor
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Terutang
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'disetor' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOpenSetor(row)}
              className="font-bold text-primary-600 hover:bg-primary-50"
            >
              Input NTPN
            </Button>
          ) : (
            <span className="text-2xs text-slate-400 font-semibold">Tuntas</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Rekapitulasi Kewajiban Pajak Kampus"
        description="Pencatatan pemotongan PPh 21, PPh 23, PPN & pelaporan bukti setor NTPN ke kas negara."
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
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pajak Terutang</p>
            <p className="text-xl font-extrabold text-rose-700 mt-1 tabular-nums">
              {formatRupiah(totalTerutang)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pajak Disetor (NTPN)</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {formatRupiah(totalDisetor)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data rekapan pajak." />

      {/* Modal Input NTPN */}
      <Modal isOpen={Boolean(activeItem)} onClose={() => setActiveItem(null)} title="Input Bukti Setor NTPN Pajak">
        <form onSubmit={handleSubmit(onSubmitSetor)} className="space-y-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-900">{activeItem?.nomor}</p>
            <p className="text-xs text-slate-600 mt-0.5">{activeItem?.deskripsi}</p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">{formatRupiah(activeItem?.nominal_pajak || 0)}</p>
          </div>

          <Input label="Kode NTPN (Nomor Transaksi Penerimaan Negara) *" placeholder="Contoh: 81092830192830"
            {...register('ntpn', { required: 'Kode NTPN wajib diisi' })}
            error={errors.ntpn?.message} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setActiveItem(null)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : 'Simpan Bukti Setor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Pajak Kampus" width="420px"
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
          <Input label="Cari Nomor / NTPN / Deskripsi" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Jenis Pajak"
            value={filterJenis}
            onChange={(val) => setFilterJenis(val as string)}
            options={[
              { value: 'all', label: 'Semua Jenis Pajak' },
              { value: 'pph21', label: 'PPh Pasal 21 (Gaji)' },
              { value: 'pph23', label: 'PPh Pasal 23 (Jasa/Sewa)' },
              { value: 'ppn', label: 'PPN 11%' },
            ]} />

          <Select label="Status Penyetoran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'disetor', label: 'Sudah Disetor (Ada NTPN)' },
              { value: 'terutang', label: 'Belum Disetor (Terutang)' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
