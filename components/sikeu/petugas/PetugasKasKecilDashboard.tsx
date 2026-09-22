'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Building2,
  TrendingDown,
  ReceiptText,
  HandCoins,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah, formatDate } from '@/lib/utils';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import type { KasKecilUnit, KasKecilTransaksi, KasKecilPengajuan } from '@/types/sikeu.types';

type DatePreset = 'all' | 'today' | 'last_7_days' | 'this_month' | 'this_year';

const STATUS_PENGAJUAN: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending_keuangan: { label: 'Menunggu Approval', variant: 'warning' },
  disetujui: { label: 'Disetujui', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
};

export default function PetugasKasKecilDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this_month');
  const [activeRangeLabel, setActiveRangeLabel] = useState('Bulan Ini');
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pengajuan'>('transaksi');

  const [metrics, setMetrics] = useState({
    saldoSaatIni: 0,
    saldoAwal: 0,
    totalPengeluaran: 0,
    totalTransaksi: 0,
    pengajuanPending: 0,
    unitCount: 0,
  });

  const [units, setUnits] = useState<KasKecilUnit[]>([]);
  const [transaksis, setTransaksis] = useState<KasKecilTransaksi[]>([]);
  const [pengajuans, setPengajuans] = useState<KasKecilPengajuan[]>([]);

  // Format Helper: YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    return { start: '', end: '', label: 'Semua Waktu' };
  };

  const loadData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params: { start_date?: string; end_date?: string } = {};
      if (start && end) {
        params.start_date = start;
        params.end_date = end;
      }
      const res = await sikeuService.getDashboardSummary(params);
      if (res.data) {
        const m = res.data.metrics || {};
        setMetrics({
          saldoSaatIni: Number(m.saldo_saat_ini) || 0,
          saldoAwal: Number(m.saldo_awal) || 0,
          totalPengeluaran: Number(m.total_pengeluaran) || 0,
          totalTransaksi: Number(m.total_transaksi) || 0,
          pengajuanPending: Number(m.pengajuan_pending) || 0,
          unitCount: Number(m.unit_count) || 0,
        });
        if (Array.isArray(res.data.unit_kas)) setUnits(res.data.unit_kas);
        if (Array.isArray(res.data.recent_transaksis)) setTransaksis(res.data.recent_transaksis);
        if (Array.isArray(res.data.recent_pengajuans)) setPengajuans(res.data.recent_pengajuans);
      }
    } catch {
      toast.error('Gagal memuat ringkasan kas kecil unit Anda');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { start, end, label } = calculatePresetDates('this_month');
    setActiveRangeLabel(label);
    loadData(start, end);
  }, [loadData]);

  const handleSelectPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const { start, end, label } = calculatePresetDates(preset);
    setActiveRangeLabel(label);
    loadData(start, end);
  };

  const trxColumns: ColumnDef<KasKecilTransaksi>[] = [
    {
      key: 'nomor_transaksi',
      label: 'NO. TRANSAKSI',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {row.nomor_transaksi}
          </span>
          <p className="text-2xs text-slate-400 font-semibold mt-1">{formatDate(row.tanggal_transaksi)}</p>
        </div>
      ),
    },
    {
      key: 'uraian',
      label: 'URAIAN TRANSAKSI',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.uraian}</p>
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-2xs font-bold mt-1">
            {row.kategori?.nama || 'Pengeluaran Kas Kecil'}
          </span>
          {row.penerima && <p className="text-2xs text-slate-500 mt-0.5">Penerima: {row.penerima}</p>}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL (RP)',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-sm text-rose-600">
          -{formatRupiah(Number(row.nominal) || 0)}
        </span>
      ),
    },
  ];

  const pgjColumns: ColumnDef<KasKecilPengajuan>[] = [
    {
      key: 'nomor_pengajuan',
      label: 'NO. PENGAJUAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {row.nomor_pengajuan}
          </span>
          <p className="text-2xs text-slate-400 font-semibold mt-1">{formatDate(row.created_at || '')}</p>
        </div>
      ),
    },
    {
      key: 'judul_pengajuan',
      label: 'KEPERLUAN PENGAJUAN',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.judul_pengajuan}</p>
          {row.keperluan && <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{row.keperluan}</p>}
        </div>
      ),
    },
    {
      key: 'nominal_diajukan',
      label: 'NOMINAL DIAJUKAN',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-700">
          {formatRupiah(Number(row.nominal_diajukan) || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS APPROVAL',
      render: (row) => {
        const cfg = STATUS_PENGAJUAN[row.status] || { label: row.status, variant: 'warning' as const };
        return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
      },
    },
  ];

  const primaryUnit = units[0];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Dashboard Kas Kecil (Petty Cash)"
        description={`Selamat datang, ${user?.username || 'Petugas'}. Ringkasan saldo kas kecil dan mutasi pengeluaran unit Anda.`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {primaryUnit && (
              <Link href={`/sikeu/kas-kecil/${primaryUnit.id}/transaksi/create`}>
                <Button variant="primary" icon={<Plus size={16} />} className="font-bold min-h-[38px] text-xs shadow-sm">
                  Catat Transaksi Keluar
                </Button>
              </Link>
            )}
            <Link href="/sikeu/kas-kecil">
              <Button variant="outline" icon={<Wallet size={16} />} className="font-bold min-h-[38px] text-xs">
                Kelola Kas Kecil
              </Button>
            </Link>
          </div>
        }
      />

      {/* Preset Filter Rentang Waktu */}
      <div className="card p-3 sm:p-4 border border-slate-200/90 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
          <Calendar size={15} className="text-primary-600" />
          <span>Periode Transaksi:</span>
          <span className="badge bg-primary-50 text-primary-700 border border-primary-200 text-xs px-2.5 py-0.5 font-bold">
            {activeRangeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: 'last_7_days', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'this_year', label: 'Tahun Ini' },
              { id: 'all', label: 'Semua' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedPreset === p.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kartu Metrik Utama Kas Kecil Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Saat Ini */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Kecil Saat Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono tabular-nums">
            {formatRupiah(metrics.saldoSaatIni)}
          </p>
          <p className="text-2xs text-slate-400 mt-1">
            Dari Saldo Awal: <span className="font-semibold text-slate-600 font-mono">{formatRupiah(metrics.saldoAwal)}</span>
          </p>
        </div>

        {/* 2. Total Pengeluaran Kas Periode */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran ({activeRangeLabel})</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2 font-mono tabular-nums">
            {formatRupiah(metrics.totalPengeluaran)}
          </p>
          <p className="text-2xs text-slate-400 mt-1">
            Total Transaksi: <span className="font-semibold text-slate-700">{metrics.totalTransaksi} transaksi</span>
          </p>
        </div>

        {/* 3. Pengajuan Top-Up Pending */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengajuan Top-Up Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2 font-mono tabular-nums">
            {metrics.pengajuanPending}
          </p>
          <p className="text-2xs text-slate-400 mt-1">
            Menunggu verifikasi dan approval Keuangan Pusat
          </p>
        </div>

        {/* 4. Unit Kas yang Dipegang */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Kas Dipegang</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2 font-mono tabular-nums">
            {metrics.unitCount}
          </p>
          <p className="text-2xs text-slate-500 mt-1 font-semibold truncate">
            {primaryUnit ? `${primaryUnit.nama_kas} (${primaryUnit.fakultas?.nama || '-'})` : 'Belum ditugaskan'}
          </p>
        </div>
      </div>

      {/* Kartu Informasi Unit Kas Kecil */}
      {units.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((u) => (
            <div key={u.id} className="card p-4 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary-600" />
                    <h3 className="font-bold text-sm text-slate-900">{u.nama_kas}</h3>
                  </div>
                  <Badge variant={u.status !== false && u.status !== 0 ? 'green' : 'red'} dot>
                    {u.status !== false && u.status !== 0 ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Fakultas: <span className="font-semibold text-slate-700">{u.fakultas?.nama || '-'}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akun COA: <span className="font-mono text-2xs font-bold text-indigo-600">
                    [{(u.akunKeuangan || u.akun_keuangan)?.kode_akun || '-'}] {(u.akunKeuangan || u.akun_keuangan)?.nama_akun || '-'}
                  </span>
                </p>
                {u.deskripsi && <p className="text-2xs text-slate-400 mt-1 italic">{u.deskripsi}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase">Saldo Saat Ini</span>
                  <p className="font-mono text-base font-extrabold text-emerald-700">
                    {formatRupiah(Number(u.saldo_saat_ini) || 0)}
                  </p>
                </div>
                <Link href={`/sikeu/kas-kecil/${u.id}`}>
                  <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} className="font-bold text-xs">
                    Detail & Mutasi
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigasi Tab (Divided Bottom Border Navigation Sesuai Standar Reviewer) */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'transaksi'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <ReceiptText size={15} className={activeTab === 'transaksi' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Transaksi Pengeluaran Terbaru</span>
          <span className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
            activeTab === 'transaksi' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200/80 text-slate-600'
          }`}>
            {transaksis.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengajuan')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pengajuan'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <HandCoins size={15} className={activeTab === 'pengajuan' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Riwayat Pengajuan Top-Up Kas Langsung</span>
          <span className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
            activeTab === 'pengajuan' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200/80 text-slate-600'
          }`}>
            {pengajuans.length}
          </span>
        </button>
      </div>

      {/* Konten Tab */}
      <div className="card p-4 sm:p-6 border border-slate-200/80">
        {activeTab === 'transaksi' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transaksi Pengeluaran Kas Kecil</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan mutasi pengeluaran kas kecil yang telah dicatatkan pada unit Anda.
                </p>
              </div>
              {primaryUnit && (
                <Link href={`/sikeu/kas-kecil/${primaryUnit.id}`}>
                  <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} className="font-bold text-xs">
                    Semua Transaksi
                  </Button>
                </Link>
              )}
            </div>
            <DataTable
              columns={trxColumns}
              data={transaksis}
              isLoading={loading}
              emptyMessage="Belum ada transaksi pengeluaran kas kecil pada periode ini."
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Pengajuan Kas Langsung (Top-up)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar pengajuan pengisian kembali kas kecil ke bendahara/keuangan pusat.
                </p>
              </div>
              {primaryUnit && (
                <Link href={`/sikeu/kas-kecil/${primaryUnit.id}`}>
                  <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} className="font-bold text-xs">
                    Lihat Semua
                  </Button>
                </Link>
              )}
            </div>
            <DataTable
              columns={pgjColumns}
              data={pengajuans}
              isLoading={loading}
              emptyMessage="Belum ada pengajuan kas langsung yang dicatat."
            />
          </div>
        )}
      </div>
    </div>
  );
}
