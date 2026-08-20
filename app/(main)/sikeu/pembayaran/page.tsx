'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, CreditCard, DollarSign, Search, Filter,
  RefreshCw, Calendar, AlertCircle, Home, ChevronRight, X, RotateCcw,
  Building, CheckCircle2, Clock
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';

export default function PembayaranPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Temp states in Drawer
  const [tempStatus, setTempStatus] = useState('');
  const [tempChannel, setTempChannel] = useState('');
  const [tempTglMulai, setTempTglMulai] = useState('');
  const [tempTglSelesai, setTempTglSelesai] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPembayaranList({
        search,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        tgl_mulai: tglMulai || undefined,
        tgl_selesai: tglSelesai || undefined,
      });

      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setPayments(list);
      }
    } catch (e) {
      console.error(e);
      // Fallback mock payments
      setPayments([
        {
          id: 1,
          kode_transaksi: 'TRX-BNI-20260801-001',
          virtual_account: { va_number: '880120260801001', bank_nama: 'Bank BNI' },
          tagihan: { nomor_tagihan: 'INV-SIAKAD-20260801-001', mahasiswa_id: 101 },
          jumlah_bayar: 3000000,
          waktu_bayar: '2026-08-01 10:15:30',
          channel_bayar: 'VA_BANK',
          status: 'success'
        },
        {
          id: 2,
          kode_transaksi: 'TRX-MDR-20260802-002',
          virtual_account: { va_number: '880220260802002', bank_nama: 'Bank Mandiri' },
          tagihan: { nomor_tagihan: 'INV-SIAKAD-20260802-002', mahasiswa_id: 102 },
          jumlah_bayar: 3500000,
          waktu_bayar: '2026-08-02 14:22:10',
          channel_bayar: 'VA_BANK',
          status: 'success'
        },
        {
          id: 3,
          kode_transaksi: 'TRX-QRS-20260803-003',
          virtual_account: { va_number: 'QRIS-CAMPUS-003', bank_nama: 'QRIS' },
          tagihan: { nomor_tagihan: 'INV-SPMB-20260803-003', mahasiswa_id: 103 },
          jumlah_bayar: 750000,
          waktu_bayar: '2026-08-03 09:05:00',
          channel_bayar: 'QRIS',
          status: 'pending'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, channelFilter, tglMulai, tglSelesai]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalNominalSuccess = payments
    .filter(p => p.status === 'success')
    .reduce((sum, item) => sum + (Number(item.jumlah_bayar) || 0), 0);

  const totalSuccessCount = payments.filter(p => p.status === 'success').length;
  const totalPendingCount = payments.filter(p => p.status === 'pending').length;

  const hasActiveFilter = !!(statusFilter || channelFilter || tglMulai || tglSelesai);

  const filteredPayments = payments.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchTrx = p.kode_transaksi?.toLowerCase().includes(q);
    const matchVa = p.virtual_account?.va_number?.toLowerCase().includes(q);
    const matchBank = p.virtual_account?.bank_nama?.toLowerCase().includes(q);
    const matchInv = p.tagihan?.nomor_tagihan?.toLowerCase().includes(q);
    const matchMhs = String(p.tagihan?.mahasiswa_id || '').includes(q);
    return matchTrx || matchVa || matchBank || matchInv || matchMhs;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Standard SSO PageHeader with integrated Breadcrumbs */}
      <PageHeader
        title="Riwayat Pembayaran & Virtual Account"
        description="Monitoring log mutasi transaksi pembayaran mahasiswa, virtual account, dan payment gateway."
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary-600 transition">
              <Home size={13} />
              <span>SSO Dashboard</span>
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link href="/sikeu" className="hover:text-primary-600 transition">
              SIKEU
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-800 font-semibold">Riwayat Pembayaran &amp; VA</span>
          </nav>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                setTempStatus(statusFilter);
                setTempChannel(channelFilter);
                setTempTglMulai(tglMulai);
                setTempTglSelesai(tglSelesai);
                setShowFilter(true);
              }}
            >
              Filter
              {hasActiveFilter && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary-600 text-white rounded-full">
                  !
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran Lunas</div>
                <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(totalNominalSuccess)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaksi Sukses</div>
                <div className="text-base font-extrabold text-slate-900">{totalSuccessCount} Transaksi</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Pembayaran</div>
                <div className="text-base font-extrabold text-slate-900">{totalPendingCount} Transaksi</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-bold text-slate-900">Daftar Transaksi Pembayaran Mahasiswa</h2>
            <p className="text-xs text-slate-500">
              {hasActiveFilter && <span className="text-primary-600 font-semibold mr-1">Filter aktif •</span>}
              {filteredPayments.length} transaksi ditampilkan
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Live Search with proper prefix/suffix icon positioning */}
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Cari TRX, VA, invoice, NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-icon-left input-icon-right text-xs w-64 bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="input-suffix-icon"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="btn btn-ghost btn-icon btn-sm"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat mutasi pembayaran...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <CreditCard size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Transaksi Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilter
                  ? 'Tidak ada transaksi pembayaran yang cocok dengan filter yang diterapkan.'
                  : 'Belum ada riwayat transaksi pembayaran yang tercatat.'}
              </p>
              {hasActiveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  className="mt-3"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setChannelFilter('');
                    setTglMulai('');
                    setTglSelesai('');
                    fetchPayments();
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kode Transaksi</th>
                    <th>Virtual Account / Channel</th>
                    <th>Referensi Tagihan</th>
                    <th className="text-right">Jumlah Bayar</th>
                    <th>Waktu Bayar</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-emerald-700">{p.kode_transaksi}</td>
                      <td>
                        <div className="font-mono font-bold text-slate-900">{p.virtual_account?.va_number || '-'}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {p.virtual_account?.bank_nama || p.channel_bayar}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">
                          {p.tagihan?.mahasiswa_id ? `Mahasiswa #${p.tagihan.mahasiswa_id}` : 'Mahasiswa'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">Ref: {p.tagihan?.nomor_tagihan || '-'}</div>
                      </td>
                      <td className="text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatRupiah(p.jumlah_bayar)}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{p.waktu_bayar || '-'}</td>
                      <td className="text-center">
                        {p.status === 'success' ? (
                          <Badge variant="green" dot>
                            Lunas (Sukses)
                          </Badge>
                        ) : p.status === 'pending' ? (
                          <Badge variant="gray" dot>
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="red" dot>
                            {p.status?.toUpperCase()}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* FILTER DRAWER — Standar SSO */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mutasi Pembayaran"
        width="360px"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setTempStatus('');
                setTempChannel('');
                setTempTglMulai('');
                setTempTglSelesai('');
                setStatusFilter('');
                setChannelFilter('');
                setTglMulai('');
                setTglSelesai('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setStatusFilter(tempStatus);
                setChannelFilter(tempChannel);
                setTglMulai(tempTglMulai);
                setTglSelesai(tempTglSelesai);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Status Pembayaran</label>
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status</option>
              <option value="success">Sukses (Lunas)</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
            {tempStatus && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempStatus.toUpperCase()}</strong>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Channel Pembayaran</label>
            <select
              value={tempChannel}
              onChange={(e) => setTempChannel(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Channel</option>
              <option value="VA_BANK">Virtual Account (Bank)</option>
              <option value="QRIS">QRIS</option>
              <option value="TELLER">Teller / Kasir Kampus</option>
            </select>
            {tempChannel && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempChannel}</strong>
              </p>
            )}
          </div>

          <Input
            label="Tanggal Mulai"
            type="date"
            value={tempTglMulai}
            onChange={(e) => setTempTglMulai(e.target.value)}
          />

          <Input
            label="Tanggal Selesai"
            type="date"
            value={tempTglSelesai}
            onChange={(e) => setTempTglSelesai(e.target.value)}
          />

          <hr className="border-t border-slate-200" />
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold">Catatan:</span> Klik &quot;Terapkan&quot; untuk menyaring data mutasi pembayaran.
          </div>
        </div>
      </Drawer>
    </div>
  );
}
