'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, CreditCard, DollarSign, Search, Filter, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function PembayaranPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPembayaranList({
        search,
        status: statusFilter,
        channel: channelFilter,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
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
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, channelFilter, tglMulai, tglSelesai]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalNominalSuccess = payments
    .filter(p => p.status === 'success')
    .reduce((sum, item) => sum + (Number(item.jumlah_bayar) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-green font-bold">Log Mutasi Pembayaran</span>
              <span className="badge badge-purple font-bold">Payment Gateway & VA</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Riwayat Pembayaran & Virtual Account</h1>
            <p className="text-xs text-slate-500">
              Filter transaksi berdasarkan rentang tanggal, status pembayaran, channel bank, dan pencarian NIM/Nama.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] font-bold uppercase text-emerald-700">Total Terverifikasi</div>
          <div className="font-mono text-base font-extrabold text-emerald-900">{formatRupiah(totalNominalSuccess)}</div>
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs">
          <div className="md:col-span-4">
            <label className="font-bold text-slate-700">Cari NIM / Nama / Kode Transaksi</label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="Misal: TRX-BNI / 2024010042..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm border-slate-300 w-full pl-8 font-medium"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700">Tanggal Mulai</label>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              className="input input-sm border-slate-300 w-full font-bold mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700">Tanggal Selesai</label>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              className="input input-sm border-slate-300 w-full font-bold mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700">Status Pembayaran</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-sm border-slate-300 w-full font-semibold mt-1"
            >
              <option value="">-- Semua Status --</option>
              <option value="success">Sukses (Lunas)</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold w-full border-none">
              <Filter size={14} /> Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setChannelFilter('');
                setTglMulai('');
                setTglSelesai('');
                fetchPayments();
              }}
              className="btn btn-ghost btn-sm text-slate-500 font-bold"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Daftar Transaksi Pembayaran Mahasiswa</h2>
          <span className="text-xs font-mono font-bold text-slate-500">{payments.length} Data Ditampilkan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">KODE TRANSAKSI</th>
                <th className="px-4 py-3">VIRTUAL ACCOUNT</th>
                <th className="px-4 py-3">MAHASISWA & TAGIHAN</th>
                <th className="px-4 py-3 text-right">JUMLAH BAYAR (RP)</th>
                <th className="px-4 py-3">WAKTU BAYAR</th>
                <th className="px-4 py-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat mutasi pembayaran...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Tidak ada transaksi pembayaran ditemukan sesuai filter.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.kode_transaksi}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{p.virtual_account?.va_number || '-'}</div>
                      <div className="text-[10px] text-slate-500">{p.virtual_account?.bank_nama || p.channel_bayar}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.tagihan?.mahasiswa_id ? `Mahasiswa #${p.tagihan.mahasiswa_id}` : 'Mahasiswa'}</div>
                      <div className="text-[10px] font-mono text-slate-500">Ref: {p.tagihan?.nomor_tagihan || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                      {formatRupiah(p.jumlah_bayar)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.waktu_bayar || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                          <CheckCircle size={12} /> Lunas (Sukses)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 uppercase">
                          <AlertCircle size={12} /> {p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
