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
  BookOpen,
  Wallet,
  Settings,
  UserCheck,
  Receipt,
  Grid,
  Layers,
  Award
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

  // Full SIKEU Sub-Module Navigation for Super Admin
  const sikeuModules = [
    { title: 'Portal Kabag Keuangan', desc: 'Otorisasi Kas Utama, Mutasi Dana, & Approval Finansial', href: '/sikeu/kabag', icon: ShieldCheck, badge: 'Kabag Portal' },
    { title: 'Payment Gateway Xendit', desc: 'Secret Key Xendit API & Real-Time Balance Tracker', href: '/sikeu/payment-gateway', icon: Wallet, badge: 'Super Admin API' },
    { title: 'Tagihan & Semester', desc: 'Set tagihan masal per Angkatan & terbitkan Single VA', href: '/sikeu/tagihan', icon: FileText, badge: 'Penerbitan' },
    { title: 'Kas Unit & Kas Kabag', desc: 'Kas Utama Kabag, Kas SPMB, & Mutasi antar Unit Kas', href: '/sikeu/unit-kas', icon: Wallet, badge: 'Likuiditas' },
    { title: 'Approval Pimpinan', desc: 'Persetujuan 4 Card (Dispensasi, Mutasi Kas, & Operasional)', href: '/sikeu/approval', icon: ShieldCheck, badge: 'Perizinan' },
    { title: 'Dispensasi Pembayaran', desc: 'Pengajuan cicilan/penundaan & unlock KRS sementara', href: '/sikeu/dispensasi', icon: UserCheck, badge: 'Mahasiswa' },
    { title: 'Akuntansi & Jurnal', desc: 'Jurnal Umum Balanced, COA, & Buku Besar Otomatis', href: '/sikeu/akuntansi', icon: BookOpen, badge: 'Keuangan' },
    { title: 'Master Data SIKEU', desc: 'Komponen Biaya, Tarif Angkatan, Jalur & Master Beasiswa', href: '/sikeu/master', icon: Settings, badge: 'Konfigurasi' },
    { title: 'Pemasukan & Hibah', desc: 'Penerimaan UKT, SPMB, & Hibah Penelitian SIPPM', href: '/sikeu/pemasukan', icon: TrendingUp, badge: 'Income' },
    { title: 'Pengeluaran Operasional', desc: 'Pencairan operasional unit, laboratorium & kegiatan', href: '/sikeu/pengeluaran', icon: TrendingDown, badge: 'Expense' },
    { title: 'Pajak & Potongan', desc: 'Pengelolaan utang & setoran PPh 21, PPh 23, PPN', href: '/sikeu/pajak', icon: Receipt, badge: 'Perpajakan' },
    { title: 'Riwayat Pembayaran', desc: 'Daftar transaksi pembayaran lunas & bukti kwitansi', href: '/sikeu/pembayaran', icon: CheckCircle, badge: 'Transaksi' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">Ekosistem SIKEU</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">Super Admin Complete Menu</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard & Navigation Center Keuangan (SIKEU)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat Kendali Eksekutif Penerimaan, Kas Kabag Keuangan, Mutasi Unit, Akuntansi, & Approval Pimpinan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sikeu/tagihan/create"
            className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Bayar Loket / Terbitkan VA
          </Link>
          <Link
            href="/sikeu/pemasukan/create"
            className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <Plus size={16} /> Catat Pemasukan Hibah
          </Link>
          <Link
            href="/sikeu/approval"
            className="btn bg-amber-500 hover:bg-amber-600 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={16} /> Approval Pimpinan ({metrics.tagihanPendingApproval + metrics.dispensasiPending})
          </Link>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Total Penerimaan (UKT + Hibah)</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-slate-900">
              Rp {metrics.totalPenerimaan.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Akumulasi penerimaan lunas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Total Pengeluaran Operasional</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-slate-900">
              Rp {metrics.totalPengeluaran.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Belanja & pencairan unit</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">Saldo Kas Utama Kabag</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-slate-900">
              Rp {metrics.saldoKasUtama.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">Ter-sinkronisasi di Unit Kas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Pajak Terutang (PPh/PPN)</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-slate-900">
              Rp {metrics.pajakTerutang.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Status: Siap disetor ke kas negara</p>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN MENU GRID - ALL SIKEU FEATURES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Grid size={20} className="text-teal-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Navigasi Seluruh Sub-Modul SIKEU (Super Admin Portal)</h2>
              <p className="text-xs text-slate-500">Akses penuh ke 10 sub-modul keuangan sebelum dikonfigurasi perizinannya di SSO IAM</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
            10 Sub-Modul Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {sikeuModules.map((m, idx) => {
            const IconComp = m.icon;
            return (
              <Link
                key={idx}
                href={m.href}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-600 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                      <IconComp size={18} />
                    </div>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xs mt-2 group-hover:text-teal-900 transition">{m.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{m.desc}</p>
                </div>
                <div className="text-[10px] font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 pt-1">
                  Buka Modul &rarr;
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Cross-Module Integrations Section */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-2xl text-white shadow-sm space-y-4">
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
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-300 mb-1">
              <span>SIMPEG Payroll</span>
              <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[10px]">Auto-Post</span>
            </div>
            <p className="text-xs text-slate-300">Penggajian Dosen & Tendik terposting otomatis ke Beban Gaji & Utang PPh21.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
              <span>SIPPM Riset & PkM</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Auto-Post</span>
            </div>
            <p className="text-xs text-slate-300">Pencairan termin hibah otomatis mencatat Pemasukan Kampus & saldo Kas.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300 mb-1">
              <span>SPMB Pendaftaran</span>
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">Auto-Unlock</span>
            </div>
            <p className="text-xs text-slate-300">Callback VA lunas otomatis membuka (unlock) status pendaftaran calon mahasiswa.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
              <span>SIAKAD UKT</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">Auto-KRS</span>
            </div>
            <p className="text-xs text-slate-300">Pembayaran UKT atau approval dispensasi pimpinan otomatis unlock KRS mahasiswa.</p>
          </div>
        </div>
      </div>

      {/* Recent Auto-Journal Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Feed Jurnal Akuntansi Terbaru</h2>
          <Link href="/sikeu/akuntansi" className="text-xs font-bold text-teal-700 hover:text-teal-900">
            Lihat Semua Jurnal &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">No. Jurnal</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Sumber Transaksi</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-right">Total Nominal</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJurnal.length > 0 ? (
                recentJurnal.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{j.nomor_jurnal}</td>
                    <td className="px-4 py-3 font-mono">{j.tanggal_jurnal}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold capitalize">
                        {j.jenis_sumber.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{j.keterangan}</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                      Rp {Number(j.total_debet).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Posted
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
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
