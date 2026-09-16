'use client';

import { formatRupiah } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, ShieldCheck, CreditCard, Building2,
  RefreshCw, FileText, CheckCircle2, Calendar, Filter, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';

interface RecentJurnal {
  id: number;
  nomor_jurnal: string;
  tanggal_jurnal: string;
  keterangan: string;
  total_debet: number;
  status: string;
  jenis_sumber?: string;
}

type DatePreset = 'all' | 'today' | 'last_7_days' | 'this_month' | 'this_year' | 'custom';

export default function SikeuDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeRangeLabel, setActiveRangeLabel] = useState('Bulan Ini');

  const [metrics, setMetrics] = useState({
    totalPenerimaan: 0,
    penerimaanMahasiswa: 0,
    penerimaanEksternal: 0,
    totalPengeluaran: 0,
    pengeluaranOperasional: 0,
    pengeluaranKasUnit: 0,
    saldoKasUtama: 0,
    saldoTotalKas: 0,
    totalPiutangMahasiswa: 0,
    totalPendingApproval: 0,
    totalTransaksiJurnal: 0,
  });
  const [recentJurnal, setRecentJurnal] = useState<RecentJurnal[]>([]);

  // Format Helper: YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to compute start and end date for a preset
  const calculatePresetDates = (preset: DatePreset): { start: string; end: string; label: string } => {
    const now = new Date();
    if (preset === 'today') {
      const today = formatYmd(now);
      return { start: today, end: today, label: 'Hari Ini' };
    }
    if (preset === 'last_7_days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      return { start: formatYmd(past), end: formatYmd(now), label: '7 Hari Terakhir' };
    }
    if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatYmd(firstDay), end: formatYmd(now), label: 'Bulan Ini' };
    }
    if (preset === 'this_year') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: formatYmd(firstDayOfYear), end: formatYmd(now), label: 'Tahun Ini' };
    }
    if (preset === 'all') {
      return { start: '', end: '', label: 'Semua Waktu' };
    }
    return { start: startDate, end: endDate, label: 'Rentang Kustom' };
  };

  const loadDashboardData = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const params: { start_date?: string; end_date?: string } = {};
      if (start && end) {
        params.start_date = start;
        params.end_date = end;
      }
      const res = await sikeuService.getDashboardSummary(params);
      if (res.data) {
        const m = res.data.metrics || {};
        setMetrics({
          totalPenerimaan: m.total_penerimaan || 0,
          penerimaanMahasiswa: m.penerimaan_mahasiswa || 0,
          penerimaanEksternal: m.penerimaan_eksternal || 0,
          totalPengeluaran: m.total_pengeluaran || 0,
          pengeluaranOperasional: m.pengeluaran_operasional || 0,
          pengeluaranKasUnit: m.pengeluaran_kas_unit || 0,
          saldoKasUtama: m.saldo_kas_utama || 0,
          saldoTotalKas: m.saldo_total_kas || 0,
          totalPiutangMahasiswa: m.total_piutang_mahasiswa || 0,
          totalPendingApproval: m.total_pending_approval || 0,
          totalTransaksiJurnal: m.total_transaksi_jurnal || 0,
        });
        if (Array.isArray(res.data.recent_jurnals)) {
          setRecentJurnal(res.data.recent_jurnals);
        }
      }
    } catch {
      toast.error('Gagal memuat ringkasan dashboard keuangan');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: Default to 'this_month'
  useEffect(() => {
    const { start, end, label } = calculatePresetDates('this_month');
    setStartDate(start);
    setEndDate(end);
    setActiveRangeLabel(label);
    loadDashboardData(start, end);
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      return;
    }
    const { start, end, label } = calculatePresetDates(preset);
    setStartDate(start);
    setEndDate(end);
    setActiveRangeLabel(label);
    loadDashboardData(start, end);
  };

  // Handle Custom Range Submit
  const handleApplyCustomFilter = () => {
    if (!startDate || !endDate) {
      toast.error('Harap pilih tanggal mulai dan tanggal akhir');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }
    setSelectedPreset('custom');
    setActiveRangeLabel(`${startDate} s/d ${endDate}`);
    loadDashboardData(startDate, endDate);
  };

  // Handle Reset Filter to All
  const handleResetFilter = () => {
    setSelectedPreset('all');
    setStartDate('');
    setEndDate('');
    setActiveRangeLabel('Semua Waktu');
    loadDashboardData('', '');
  };

  // Source Badge Helper for Recent Jurnals
  const renderSourceBadge = (source?: string) => {
    if (!source) {
      return <Badge variant="secondary">Jurnal Umum</Badge>;
    }
    const upper = source.toUpperCase();
    if (upper.includes('SIAKAD') || upper.includes('SPMB') || upper.includes('PEMBAYARAN')) {
      return <Badge variant="success">Pembayaran Mhs</Badge>;
    }
    if (upper.includes('PENGELUARAN') || upper.includes('EXP')) {
      return <Badge variant="danger">Beban Operasional</Badge>;
    }
    if (upper.includes('HIBAH') || upper.includes('PEMASUKAN') || upper.includes('INC')) {
      return <Badge variant="info">Pemasukan Hibah</Badge>;
    }
    if (upper.includes('KAS') || upper.includes('PENCAIRAN')) {
      return <Badge variant="warning">Pencairan Kas</Badge>;
    }
    if (upper.includes('PAJAK') || upper.includes('TAX')) {
      return <Badge variant="secondary">Setor Pajak</Badge>;
    }
    if (upper.includes('PAYROLL') || upper.includes('SIMPEG') || upper.includes('GAJI')) {
      return <Badge variant="warning">Payroll SIMPEG</Badge>;
    }
    return <Badge variant="secondary">{source}</Badge>;
  };

  const columns: ColumnDef<RecentJurnal>[] = [
    {
      key: 'nomor_jurnal',
      label: 'NOMOR JURNAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_jurnal || `JRN-${row.id}`}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">{row.tanggal_jurnal || '-'}</span>
        </div>
      ),
    },
    {
      key: 'jenis_sumber',
      label: 'SUMBER TRANSAKSI',
      render: (row) => renderSourceBadge(row.jenis_sumber),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN TRANSAKSI',
      render: (row) => (
        <span className="font-medium text-slate-800 text-xs line-clamp-1">{row.keterangan || '-'}</span>
      ),
    },
    {
      key: 'total_debet',
      label: 'TOTAL DEBET (RP)',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.total_debet || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status === 'posted' || row.status === 'balanced' ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Posted
          </span>
        ) : (
          <span className="badge badge-amber text-xs font-bold inline-flex items-center gap-1">
            Draft
          </span>
        ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard Executive Keuangan"
        description="Ringkasan arus kas, mutasi penerimaan/pengeluaran, total piutang, dan status approval pimpinan."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/sikeu/master">
              <Button variant="outline" icon={<Building2 size={16} />} className="font-bold min-h-[40px]">
                Master Biaya
              </Button>
            </Link>
            <Link href="/sikeu/tagihan">
              <Button variant="primary" icon={<CreditCard size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
                Tagihan Mahasiswa
              </Button>
            </Link>
          </div>
        }
      />

      {/* Date Range Filter Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Filter Periode Transaksi
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                  {activeRangeLabel}
                </span>
              </p>
              <p className="text-2xs text-slate-500">
                Data penerimaan, pengeluaran, piutang, dan jurnal otomatis disesuaikan berdasarkan rentang tanggal aktif.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={() => loadDashboardData(startDate, endDate)}
              disabled={loading}
              title="Segarkan Data"
            >
              Segarkan
            </Button>
          </div>
        </div>

        {/* Preset Pills & Date Inputs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectPreset('this_month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedPreset === 'this_month'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedPreset === 'today'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('last_7_days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedPreset === 'last_7_days'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('this_year')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedPreset === 'this_year'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tahun Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedPreset === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
            <div className="w-full sm:w-40">
              <Input
                label="Dari Tanggal"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPreset('custom');
                }}
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                label="Sampai Tanggal"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPreset('custom');
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Button
                variant="primary"
                size="sm"
                icon={<Filter size={14} />}
                onClick={handleApplyCustomFilter}
                disabled={loading}
                className="h-[38px] px-3.5"
              >
                Terapkan
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleResetFilter}
                disabled={loading}
                className="h-[38px] px-3"
                title="Reset ke Semua Periode"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards - 4 Grid Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Kas & Bank Kampus</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(metrics.saldoTotalKas)}
            </p>
            <p className="text-2xs text-slate-400 mt-1 font-medium">
              Kas Utama: {formatRupiah(metrics.saldoKasUtama)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Penerimaan (Inflow)</p>
            <p className="text-lg font-extrabold text-emerald-700 mt-1 tabular-nums">
              {formatRupiah(metrics.totalPenerimaan)}
            </p>
            <p className="text-2xs text-emerald-600 mt-1 font-medium">
              Mhs: {formatRupiah(metrics.penerimaanMahasiswa)} • Hibah: {formatRupiah(metrics.penerimaanEksternal)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Piutang Mahasiswa</p>
            <p className="text-lg font-extrabold text-amber-700 mt-1 tabular-nums">
              {formatRupiah(metrics.totalPiutangMahasiswa)}
            </p>
            <p className="text-2xs text-amber-600 mt-1 font-medium">
              Sisa Tagihan Belum Lunas
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pengeluaran (Outflow)</p>
            <p className="text-lg font-extrabold text-rose-700 mt-1 tabular-nums">
              {formatRupiah(metrics.totalPengeluaran)}
            </p>
            <p className="text-2xs text-rose-600 mt-1 font-medium">
              Ops: {formatRupiah(metrics.pengeluaranOperasional)} • Kas: {formatRupiah(metrics.pengeluaranKasUnit)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link href="/sikeu/master" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Master Biaya</p>
          <p className="text-2xs text-slate-500">Tarif & Biaya</p>
        </Link>

        <Link href="/sikeu/tagihan" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Tagihan & SPP</p>
          <p className="text-2xs text-slate-500">Invoice Semester</p>
        </Link>

        <Link href="/sikeu/piutang" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Piutang Mahasiswa</p>
          <p className="text-2xs text-slate-500">Tunggakan & Excel</p>
        </Link>

        <Link href="/sikeu/pengeluaran" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Pengeluaran</p>
          <p className="text-2xs text-slate-500">Beban Operasional</p>
        </Link>

        <Link href="/sikeu/approval" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Approval</p>
          <p className="text-2xs text-slate-500">
            {metrics.totalPendingApproval > 0 ? `${metrics.totalPendingApproval} Menunggu` : 'Persetujuan Pimpinan'}
          </p>
        </Link>
      </div>

      {/* Recent Jurnals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Jurnal Umum Terintegrasi
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700">
                {activeRangeLabel}
              </span>
            </h2>
            <p className="text-2xs text-slate-500 mt-0.5">
              Seluruh transaksi pembayaran mahasiswa, beban operasional, dan mutasi kas otomatis terposting ke Jurnal Umum Akuntansi.
            </p>
          </div>
          <Link href="/sikeu/akuntansi" className="text-xs font-bold text-primary-600 hover:underline shrink-0">
            Lihat Semua Jurnal →
          </Link>
        </div>
        <DataTable data={recentJurnal} isLoading={loading} columns={columns} emptyMessage="Belum ada transaksi jurnal umum pada periode ini." />
      </div>
    </div>
  );
}
