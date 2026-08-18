'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, TrendingDown, CheckCircle, Search, RefreshCw, Filter, FileText } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function PengeluaranListPage() {
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [summary, setSummary] = useState({
    total_nominal: 0,
    total_pajak: 0,
    total_net: 0,
  });

  const fetchPengeluaran = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPengeluaranList({
        search: search || undefined,
        kategori: filterKategori !== 'semua' ? filterKategori : undefined,
      });

      if (res.data) {
        setPengeluaranList(Array.isArray(res.data) ? res.data : []);
      }
      if ((res as any).summary) {
        setSummary((res as any).summary);
      }
    } catch (e) {
      console.error('Failed to load pengeluaran list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengeluaran();
  }, [filterKategori]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPengeluaran();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                Pengeluaran & Belanja Kampus
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                Auto-Journal Balanced
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Pengeluaran Kampus</h1>
            <p className="text-xs text-slate-500">
              Pencatatan transaksi pengeluaran operasional, vendor, honorarium & potongan pajak PPh/PPN
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPengeluaran}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/sikeu/pengeluaran/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition"
          >
            <Plus size={16} /> Input Pengeluaran Baru
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Gross Pengeluaran</span>
          <div className="text-xl font-mono font-extrabold text-slate-900 mt-1">
            Rp {Number(summary.total_nominal || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi seluruh transaksi beban</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Total Potongan Pajak</span>
          <div className="text-xl font-mono font-extrabold text-amber-600 mt-1">
            Rp {Number(summary.total_pajak || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">PPh 21, PPh 23, & PPN 11%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Total Net Dibayarkan</span>
          <div className="text-xl font-mono font-extrabold text-rose-700 mt-1">
            Rp {Number(summary.total_net || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Kas riil yang keluar dari unit kas</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari no transaksi, vendor, uraian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button type="submit" className="px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold">
              Cari
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="text-xs border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="semua">Semua Kategori</option>
              <option value="operasional">Operasional</option>
              <option value="pemeliharaan">Pemeliharaan</option>
              <option value="laboratorium">Laboratorium</option>
              <option value="kegiatan">Kegiatan</option>
              <option value="honorarium">Honorarium</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Vendor / Rekanan</th>
                <th className="px-4 py-3 text-right">Gross Nominal</th>
                <th className="px-4 py-3">Pajak</th>
                <th className="px-4 py-3 text-right">Net Dibayarkan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : pengeluaranList.length > 0 ? (
                pengeluaranList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-rose-700">{item.nomor_transaksi}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{item.nama_vendor}</div>
                      {item.keterangan && <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.keterangan}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono">
                      Rp {Number(item.nominal).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      {item.jenis_pajak !== 'tanpa_pajak' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                          {item.jenis_pajak.toUpperCase()} (Rp {Number(item.nominal_pajak).toLocaleString('id-ID')})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-rose-700 font-mono">
                      Rp {Number(item.net_dibayarkan).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-mono">{item.tanggal_transaksi}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> {item.status_pembayaran?.toUpperCase() || 'LUNAS'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Belum ada data transaksi pengeluaran kampus.
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
