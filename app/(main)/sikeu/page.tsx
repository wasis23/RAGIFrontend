'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  FileText,
  ShieldCheck,
  AlertCircle,
  Plus,
  BookOpen,
  Wallet,
  Settings,
  UserCheck,
  Receipt,
  Grid,
  RefreshCw,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Hero } from '@/components/ui/Hero';

export default function SikeuDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncingBalance, setSyncingBalance] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPenerimaan: 0,
    penerimaanMahasiswa: 0,
    penerimaanEksternal: 0,
    totalPengeluaran: 0,
    saldoKasUtama: 0,
    saldoTotalKas: 0,
    pajakTerutang: 0,
    tagihanPendingApproval: 0,
    dispensasiPending: 0,
    pengajuanKasPending: 0,
    totalPendingApproval: 0,
  });

  const [paymentGateway, setPaymentGateway] = useState<any>({
    gateway_name: 'xendit',
    is_active: true,
    environment: 'sandbox',
    available_balance: 0,
    status_koneksi: 'loading',
    last_updated: '-',
    error_message: null,
  });

  const [recentJurnal, setRecentJurnal] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getDashboardSummary();
      if (res.data) {
        const m = res.data.metrics || {};
        setMetrics({
          totalPenerimaan: m.total_penerimaan || 0,
          penerimaanMahasiswa: m.penerimaan_mahasiswa || 0,
          penerimaanEksternal: m.penerimaan_eksternal || 0,
          totalPengeluaran: m.total_pengeluaran || 0,
          saldoKasUtama: m.saldo_kas_utama || 0,
          saldoTotalKas: m.saldo_total_kas || 0,
          pajakTerutang: m.pajak_terutang || 0,
          tagihanPendingApproval: m.tagihan_pending_approval || 0,
          dispensasiPending: m.dispensasi_pending || 0,
          pengajuanKasPending: m.pengajuan_kas_pending || 0,
          totalPendingApproval: m.total_pending_approval || 0,
        });

        if (res.data.payment_gateway) {
          setPaymentGateway(res.data.payment_gateway);
        }

        if (res.data.recent_jurnals) {
          setRecentJurnal(res.data.recent_jurnals);
        }
      }
    } catch (err) {
      console.error('Failed to fetch SIKEU dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshGatewayBalance = async () => {
    try {
      setSyncingBalance(true);
      const res = await sikeuService.getPaymentGatewayBalance(paymentGateway.gateway_name || 'xendit');
      if (res.data) {
        setPaymentGateway((prev: any) => ({
          ...prev,
          available_balance: res.data.available_balance || 0,
          status_koneksi: 'connected',
          last_updated: res.data.last_updated || new Date().toLocaleTimeString('id-ID'),
          error_message: null,
        }));
      }
    } catch (err: any) {
      console.error('Failed to sync gateway balance', err);
      setPaymentGateway((prev: any) => ({
        ...prev,
        status_koneksi: 'error',
        error_message: err.message || 'Gagal sinkronisasi saldo Xendit',
      }));
    } finally {
      setSyncingBalance(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="green">Ekosistem SIKEU</Badge>
          <Badge variant="indigo">Super Admin & Kabag Finansial</Badge>
        </div>
        <PageHeader
          title="Dashboard & Navigation Center Keuangan (SIKEU)"
          description="Pusat Kendali Eksekutif Penerimaan, Live Saldo Payment Gateway, Kas Kabag Keuangan, Akuntansi, & Approval Pimpinan"
          action={
            <div className="page-actions">
              <Link href="/sikeu/tagihan/create" className="btn btn-primary">
                <Plus size={16} /> Bayar Loket / Terbitkan VA
              </Link>
              <Link href="/sikeu/pengeluaran/create" className="btn btn-secondary">
                <Plus size={16} /> Catat Pengeluaran
              </Link>
              <Link href="/sikeu/approval" className="btn btn-outline">
                <ShieldCheck size={16} /> Approval ({metrics.totalPendingApproval})
              </Link>
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="btn btn-ghost btn-icon"
                title="Refresh Data Dashboard"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />
      </div>

      {/* LIVE PAYMENT GATEWAY (XENDIT) SYNC BANNER */}
      <Hero
        badge={
          <>
            <Zap size={14} /> Payment Gateway Saldo Tracker ({paymentGateway.gateway_name?.toUpperCase()})
          </>
        }
        title={`Rp ${Number(paymentGateway.available_balance || 0).toLocaleString('id-ID')}`}
        description={`Saldo siap ditarik/settlement (Update: ${paymentGateway.last_updated})`}
        actions={
          <>
            <button
              onClick={handleRefreshGatewayBalance}
              disabled={syncingBalance}
              className="btn hero-btn-white"
            >
              <RefreshCw size={14} className={syncingBalance ? 'animate-spin' : ''} />
              {syncingBalance ? 'Menyinkronkan...' : 'Sync Saldo Xendit'}
            </button>
            <Link href="/sikeu/payment-gateway" className="btn hero-btn-glass">
              <Settings size={14} /> Kelola API
            </Link>
          </>
        }
      >
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4">
          <Badge
            variant={
              paymentGateway.status_koneksi === 'connected' ? 'green' :
              paymentGateway.status_koneksi === 'unconfigured' ? 'yellow' :
              'red'
            }
            dot
          >
            {paymentGateway.status_koneksi === 'connected' ? 'Live Connected' :
             paymentGateway.status_koneksi === 'unconfigured' ? 'API Key Belum Dikonfigurasi' :
             'Offline / Error'}
          </Badge>
          <Badge variant="gray">{paymentGateway.environment}</Badge>
          {paymentGateway.error_message && (
            <span className="text-sm text-white flex items-center gap-1">
              <AlertCircle size={12} /> {paymentGateway.error_message}
            </span>
          )}
        </div>
      </Hero>

      {/* Financial Metrics Cards */}
      <div className="kpi-grid">
        <StatCard
          label="Total Penerimaan (UKT + Hibah)"
          value={`Rp ${metrics.totalPenerimaan.toLocaleString('id-ID')}`}
          icon={<TrendingUp size={18} />}
          iconVariant="green"
          footer={`Mahasiswa: Rp ${metrics.penerimaanMahasiswa.toLocaleString('id-ID')} | Hibah: Rp ${metrics.penerimaanEksternal.toLocaleString('id-ID')}`}
        />
        <StatCard
          label="Total Pengeluaran & Pencairan"
          value={`Rp ${metrics.totalPengeluaran.toLocaleString('id-ID')}`}
          icon={<TrendingDown size={18} />}
          iconVariant="red"
          footer="Belanja vendor, operasional & kas unit"
        />
        <StatCard
          label="Saldo Kas Utama Kabag"
          value={`Rp ${metrics.saldoKasUtama.toLocaleString('id-ID')}`}
          icon={<Wallet size={18} />}
          iconVariant="teal"
          footer={`Total Semua Unit Kas: Rp ${metrics.saldoTotalKas.toLocaleString('id-ID')}`}
        />
        <StatCard
          label="Pajak Terutang (PPh/PPN)"
          value={`Rp ${metrics.pajakTerutang.toLocaleString('id-ID')}`}
          icon={<AlertCircle size={18} />}
          iconVariant="amber"
          footer={
            <Link href="/sikeu/pajak" className="text-blue-600 font-semibold hover:underline">
              Kelola & Setor NTPN &rarr;
            </Link>
          }
        />
      </div>

      {/* SUPER ADMIN MENU GRID - ALL SIKEU FEATURES */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Grid size={20} className="text-blue-600" />
            <div>
              <h2 className="font-bold">Navigasi Seluruh Sub-Modul SIKEU (Super Admin Portal)</h2>
              <p className="text-sm text-slate-500">Akses penuh ke 12 sub-modul keuangan terpadu kampus</p>
            </div>
          </div>
          <Badge variant="green">12 Sub-Modul Aktif</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sikeuModules.map((m, idx) => {
              const IconComp = m.icon;
              return (
                <Link key={idx} href={m.href} className="module-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="module-card-icon">
                      <IconComp size={18} />
                    </div>
                    <Badge variant="gray">{m.badge}</Badge>
                  </div>
                  <span className="module-card-title">{m.title}</span>
                  <span className="module-card-desc">{m.desc}</span>
                </Link>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Cross-Module Integrations Section */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-bold">Integrasi Otomatis Cross-Modul Keuangan</h2>
            <p className="text-sm text-slate-500">Sinkronisasi Jurnal Akuntansi & Mutasi Kas Real-Time dari Modul Ekosistem Kampus</p>
          </div>
          <Badge variant="green" dot>4 Modul Terhubung Real-Time</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="module-card">
              <div className="flex items-center justify-between mb-1">
                <span className="module-card-title">SIMPEG Payroll</span>
                <Badge variant="blue">Auto-Post</Badge>
              </div>
              <p className="module-card-desc">Penggajian Dosen & Tendik terposting otomatis ke Beban Gaji & Utang PPh21.</p>
            </div>

            <div className="module-card">
              <div className="flex items-center justify-between mb-1">
                <span className="module-card-title">SIPPM Riset & PkM</span>
                <Badge variant="green">Auto-Post</Badge>
              </div>
              <p className="module-card-desc">Pencairan termin hibah otomatis mencatat Pemasukan Kampus & saldo Kas.</p>
            </div>

            <div className="module-card">
              <div className="flex items-center justify-between mb-1">
                <span className="module-card-title">SPMB Pendaftaran</span>
                <Badge variant="purple">Auto-Unlock</Badge>
              </div>
              <p className="module-card-desc">Callback VA lunas otomatis membuka (unlock) status pendaftaran calon mahasiswa.</p>
            </div>

            <div className="module-card">
              <div className="flex items-center justify-between mb-1">
                <span className="module-card-title">SIAKAD UKT</span>
                <Badge variant="yellow">Auto-KRS</Badge>
              </div>
              <p className="module-card-desc">Pembayaran UKT atau approval dispensasi pimpinan otomatis unlock KRS mahasiswa.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Auto-Journal Feed */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-bold">Feed Jurnal Akuntansi Terbaru</h2>
            <p className="text-sm text-slate-500">Pencatatan jurnal umum berimbang otomatis dari seluruh transaksi kampus</p>
          </div>
          <Link href="/sikeu/akuntansi" className="btn btn-ghost btn-sm">
            Lihat Semua Jurnal <ArrowUpRight size={14} />
          </Link>
        </CardHeader>
        <CardBody>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Jurnal</th>
                  <th>Tanggal</th>
                  <th>Sumber Transaksi</th>
                  <th>Keterangan</th>
                  <th className="text-right">Total Nominal</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJurnal.length > 0 ? (
                  recentJurnal.map((j) => (
                    <tr key={j.id}>
                      <td className="font-mono font-bold">{j.nomor_jurnal}</td>
                      <td className="font-mono">{j.tanggal_jurnal}</td>
                      <td>
                        <Badge variant="gray">{j.jenis_sumber?.replace('_', ' ')}</Badge>
                      </td>
                      <td>{j.keterangan}</td>
                      <td className="text-right font-mono font-bold">
                        Rp {Number(j.total_debet).toLocaleString('id-ID')}
                      </td>
                      <td className="text-center">
                        <Badge variant="green">
                          <CheckCircle size={12} /> Posted
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Belum ada data jurnal akuntansi yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
