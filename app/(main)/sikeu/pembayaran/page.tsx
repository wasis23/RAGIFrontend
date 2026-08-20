'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, DollarSign, Filter, RefreshCw, CheckCircle2, Clock, XCircle, Building, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface PaymentItem {
  id: number;
  kode_transaksi: string;
  virtual_account?: { va_number?: string; bank_nama?: string };
  tagihan?: { nomor_tagihan?: string; mahasiswa_id?: number };
  jumlah_bayar: number;
  waktu_bayar: string;
  channel_bayar: string;
  status: 'success' | 'pending' | 'failed' | string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function PembayaranPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', channel: '' });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPembayaranList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setPayments(list);
    } catch {
      setPayments([]);
      toast.error('Gagal memuat data histori pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus, channel: filterChannel });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterChannel('');
    setAppliedFilters({ search: '', status: '', channel: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return payments.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchKode = item.kode_transaksi?.toLowerCase().includes(q);
        const matchVA = item.virtual_account?.va_number?.toLowerCase().includes(q);
        const matchTagihan = item.tagihan?.nomor_tagihan?.toLowerCase().includes(q);
        if (!matchKode && !matchVA && !matchTagihan) return false;
      }
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.channel && item.channel_bayar !== appliedFilters.channel) return false;
      return true;
    });
  }, [payments, appliedFilters]);

  const totalSuccess = useMemo(() => {
    return filteredData
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + (p.jumlah_bayar || 0), 0);
  }, [filteredData]);

  const columns: ColumnDef<PaymentItem>[] = [
    {
      key: 'kode_transaksi',
      label: 'KODE TRANSAKSI',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.kode_transaksi}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">{row.waktu_bayar || '-'}</span>
        </div>
      ),
    },
    {
      key: 'virtual_account',
      label: 'CHANNEL / BANK VA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.virtual_account?.bank_nama || row.channel_bayar || 'VA Bank'}</p>
          <p className="font-mono text-2xs text-slate-500">{row.virtual_account?.va_number || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tagihan',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          {row.tagihan?.nomor_tagihan || '-'}
        </span>
      ),
    },
    {
      key: 'jumlah_bayar',
      label: 'JUMLAH BAYAR',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.jumlah_bayar || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'success') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Berhasil (Lunas)
            </span>
          );
        }
        if (row.status === 'pending') {
          return (
            <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Menunggu Verifikasi
            </span>
          );
        }
        return (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Gagal / Expired
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Histori Transaksi Pembayaran & Virtual Account"
        description="Monitoring log pembayaran lunas, settlement payment gateway, dan mutasi masuk rekening bank."
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
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Transaksi Lunas</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalSuccess)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jumlah Transaksi</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.length} Transaksi
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data histori pembayaran." />

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Pembayaran" width="420px"
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
          <Input label="Cari Kode Transaksi / VA / Invoice" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Status Transaksi"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'success', label: 'Berhasil (Lunas)' },
              { value: 'pending', label: 'Menunggu Verifikasi' },
              { value: 'failed', label: 'Gagal / Expired' },
            ]} />

          <Select label="Channel Pembayaran"
            value={filterChannel}
            onChange={(val) => setFilterChannel(val as string)}
            options={[
              { value: '', label: 'Semua Channel' },
              { value: 'VA_BANK', label: 'Virtual Account Bank' },
              { value: 'QRIS', label: 'QRIS Instant' },
              { value: 'LOKET', label: 'Loket Kasir Tunai' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
