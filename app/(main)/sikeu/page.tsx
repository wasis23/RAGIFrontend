'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  FileText,
  Building,
  PieChart,
  ShieldCheck,
  AlertCircle,
  Plus,
  BookOpen
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function SikeuDashboardPage() {
  const [metrics, setMetrics] = useState({
    totalPenerimaan: 525000000,
    totalPengeluaran: 142000000,
    saldoKasUtama: 383000000,
    pajakTerutang: 12500000,
    tagihanPendingApproval: 3,
    dispensasiPending: 2,
  });

  const [recentJurnal, setRecentJurnal] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jRes = await sikeuService.getJurnalList();
        if (jRes.data) {
          const list = Array.isArray(jRes.data) ? jRes.data : (jRes.data as any).data || [];
          setRecentJurnal(list.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch SIKEU dashboard data', err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-jakarta">Dashboard Keuangan (SIKEU)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan Eksekutif Penerimaan, Pengeluaran, Saldo Kas, & Status Akuntansi Real-Time
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sikeu/tagihan/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} /> Generate Tagihan
          </Link>
          <Link
            href="/sikeu/pemasukan/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} /> Catat Pemasukan Hibah
          </Link>
          <Link
            href="/sikeu/approval"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <ShieldCheck size={16} /> Approval Pimpinan ({metrics.tagihanPendingApproval + metrics.dispensasiPending})
          </Link>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Penerimaan (UKT + Hibah)</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              Rp {metrics.totalPenerimaan.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Akumulasi penerimaan lunas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Total Pengeluaran Kampus</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              Rp {metrics.totalPengeluaran.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Operasional & pencairan unit</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Saldo Kas & Bank Utama</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              Rp {metrics.saldoKasUtama.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Surplus Tersedia</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pajak Terutang (PPh/PPN)</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              Rp {metrics.pajakTerutang.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Status: Siap disetor</p>
          </div>
        </div>
      </div>

      {/* Cross-Module Integrations Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-xl text-white shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
          <div>
            <h2 className="text-lg font-bold font-jakarta text-white">Integrasi Otomatis Cross-Modul Keuangan</h2>
            <p className="text-xs text-slate-300">Sinkronisasi Jurnal Akuntansi & Mutasi Kas Real-Time dari Modul Ekosistem Kampus</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle size={14} /> 4 Modul Terhubung Real-Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-300 mb-1">
              <span>SIMPEG Payroll</span>
              <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[10px]">Auto-Post</span>
            </div>
            <p className="text-xs text-slate-300">Penggajian Dosen & Tendik terposting otomatis ke Beban Gaji & Utang PPh21.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
              <span>SIPPM Riset & PkM</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Auto-Post</span>
            </div>
            <p className="text-xs text-slate-300">Pencairan termin hibah otomatis mencatat Pemasukan Kampus & saldo Kas.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300 mb-1">
              <span>SPMB Pendaftaran</span>
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">Auto-Unlock</span>
            </div>
            <p className="text-xs text-slate-300">Callback VA lunas otomatis membuka (unlock) status pendaftaran calon mahasiswa.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
              <span>SIAKAD UKT</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">Auto-KRS</span>
            </div>
            <p className="text-xs text-slate-300">Pembayaran UKT atau approval dispensasi pimpinan otomatis unlock KRS mahasiswa.</p>
          </div>
        </div>
      </div>

      {/* Recent Auto-Journal Feed */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Feed Jurnal Akuntansi Terbaru</h2>
          <Link href="/sikeu/akuntansi/jurnal" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Lihat Semua Jurnal &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">No. Jurnal</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Sumber Transaksi</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-right">Total Nominal</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentJurnal.length > 0 ? (
                recentJurnal.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600">{j.nomor_jurnal}</td>
                    <td className="px-4 py-3">{j.tanggal_jurnal}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {j.jenis_sumber.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{j.keterangan}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      Rp {Number(j.total_debet).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Posted
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Belum ada data jurnal akuntansi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
