'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function TagihanListPage() {
  const [tagihanList] = useState([
    { id: 1, nomor: 'INV-SIAKAD-20260801-001', mhsId: 101, total: 5000000, bayar: 5000000, status: 'lunas', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
    { id: 2, nomor: 'INV-SPMB-20260801-002', mhsId: 99, total: 350000, bayar: 0, status: 'belum_bayar', jatuhTempo: '2026-08-31', source: 'SPMB' },
    { id: 3, nomor: 'INV-SIAKAD-20260801-003', mhsId: 100, total: 4500000, bayar: 0, status: 'pending_approval', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
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
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Daftar Tagihan Mahasiswa</h1>
            <p className="text-xs text-gray-500">Kelola invoice tagihan UKT, pendaftaran SPMB, wisuda, & status kuncian KRS</p>
          </div>
        </div>
        <Link
          href="/sikeu/tagihan/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} /> Generate Tagihan Baru
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">No. Tagihan</th>
                <th className="px-4 py-3">ID Mhs</th>
                <th className="px-4 py-3">Sistem Asal</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-center">Status Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tagihanList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-medium text-indigo-600">{item.nomor}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">Mahasiswa #{item.mhsId}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    Rp {item.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">{item.jatuhTempo}</td>
                  <td className="px-4 py-3 text-center">
                    {item.status === 'lunas' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Lunas (Unlock KRS)
                      </span>
                    ) : item.status === 'pending_approval' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <Clock size={12} /> Pending Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                        <AlertCircle size={12} /> Belum Bayar
                      </span>
                    )}
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
