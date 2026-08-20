'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, ShieldCheck, CreditCard, Building2, Plus, RefreshCw, FileText, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';

interface RecentJurnal {
  id: number;
  nomor_jurnal: string;
  tanggal_jurnal: string;
  keterangan: string;
  total_debet: number;
  status: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function SikeuDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    saldoTotalKas: 0,
    totalPendingApproval: 0,
  });
  const [recentJurnal, setRecentJurnal] = useState<RecentJurnal[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getDashboardSummary();
      if (res.data) {
        const m = res.data.metrics || {};
        setMetrics({
          totalPenerimaan: m.total_penerimaan || 0,
          totalPengeluaran: m.total_pengeluaran || 0,
          saldoTotalKas: m.saldo_total_kas || 0,
          totalPendingApproval: m.total_pending_approval || 0,
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      render: (row) => (
        <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Balanced
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard Executive Keuangan"
        description="Ringkasan arus kas, mutasi penerimaan/pengeluaran, dan status approval pimpinan."
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Kas & Bank Kampus</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(metrics.saldoTotalKas)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Penerimaan (Inflow)</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {formatRupiah(metrics.totalPenerimaan)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pengeluaran (Outflow)</p>
            <p className="text-xl font-extrabold text-rose-700 mt-1 tabular-nums">
              {formatRupiah(metrics.totalPengeluaran)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/sikeu/master" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Master Biaya</p>
          <p className="text-2xs text-slate-500">Delegasi ke Modul</p>
        </Link>

        <Link href="/sikeu/tagihan" className="p-3.5 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1">Tagihan & SPP</p>
          <p className="text-2xs text-slate-500">Invoice Semester</p>
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
          <p className="text-2xs text-slate-500">Persetujuan Pimpinan</p>
        </Link>
      </div>

      {/* Recent Jurnals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Jurnal Umum Terbaru</h2>
          <Link href="/sikeu/akuntansi" className="text-xs font-bold text-primary-600 hover:underline">
            Lihat Semua Jurnal →
          </Link>
        </div>
        <DataTable data={recentJurnal} isLoading={loading} columns={columns} emptyMessage="Belum ada transaksi jurnal umum." />
      </div>
    </div>
  );
}
