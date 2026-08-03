'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, TrendingDown, CheckCircle } from 'lucide-react';

export default function PengeluaranListPage() {
  const [pengeluaranList] = useState([
    { id: 1, nomor: 'EXP-202608-001', kategori: 'operasional', nominal: 22000000, pajak: 'tanpa_pajak', net: 22000000, tgl: '2026-08-01', vendor: 'PT Telkom Indonesia', keterangan: 'Langganan Internet Bandwidth Kampus' },
    { id: 2, nomor: 'EXP-202608-002', kategori: 'pemeliharaan', nominal: 35000000, pajak: 'pph_23', net: 34300000, tgl: '2026-08-01', vendor: 'PT Solusi Lab Utama', keterangan: 'Perawatan Server & AC Central' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Daftar Pengeluaran Kampus</h1>
            <p className="text-xs text-gray-500">Pencatatan transaksi pengeluaran operasional, pemeliharaan, vendor, & potongan pajak PPh/PPN</p>
          </div>
        </div>
        <Link
          href="/sikeu/pengeluaran/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} /> Input Pengeluaran Baru
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Vendor / Rekanan</th>
                <th className="px-4 py-3 text-right">Gross Nominal</th>
                <th className="px-4 py-3 text-right">Net Dibayarkan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pengeluaranList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-medium text-rose-600">{item.nomor}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.vendor}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    Rp {item.nominal.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-700">
                    Rp {item.net.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">{item.tgl}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircle size={12} /> Lunas
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
