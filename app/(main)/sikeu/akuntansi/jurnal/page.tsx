'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { JurnalUmum } from '@/types/sikeu.types';

export default function JurnalListPage() {
  const [jurnalList, setJurnalList] = useState<JurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJurnal = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getJurnalList();
        if (res.data) setJurnalList(res.data);
      } catch (err) {
        console.error('Failed to load jurnal', err);
      } finally {
        setLoading(false);
      }
    };
    loadJurnal();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Jurnal Umum & Auto-Journal Feed</h1>
            <p className="text-xs text-gray-500">Rekapitulasi pencatatan jurnal transaksi otomatis & penyesuaian manual</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sikeu/akuntansi/coa"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
          >
            Master COA
          </Link>
          <Link
            href="/sikeu/akuntansi/buku-besar"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg transition"
          >
            <BookOpen size={16} /> Buku Besar
          </Link>
          <Link
            href="/sikeu/akuntansi/jurnal/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} /> Entry Jurnal Manual
          </Link>
        </div>
      </div>

      {/* Jurnal List */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading data jurnal...</div>
        ) : jurnalList.length > 0 ? (
          <div className="space-y-6">
            {jurnalList.map((j) => (
              <div key={j.id} className="border border-gray-200 rounded-xl p-5 space-y-3 bg-gray-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-600 text-base">{j.nomor_jurnal}</span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded capitalize">
                      {j.jenis_sumber.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">| Tgl: {j.tanggal_jurnal}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Total: <strong className="text-gray-900">Rp {Number(j.total_debet).toLocaleString('id-ID')}</strong></span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircle size={12} /> Posted
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600">{j.keterangan}</p>

                {/* Details Lines */}
                {j.details && j.details.length > 0 && (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs text-gray-600 bg-white border border-gray-100 rounded-lg">
                      <thead className="bg-gray-50 font-semibold text-gray-700">
                        <tr>
                          <th className="px-3 py-2">Kode & Nama Akun COA</th>
                          <th className="px-3 py-2 text-right">Debet (Rp)</th>
                          <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                          <th className="px-3 py-2">Catatan Baris</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {j.details.map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              [{d.akun?.kode_akun || '-'}] {d.akun?.nama_akun || 'Akun'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                              {Number(d.debet) > 0 ? `Rp ${Number(d.debet).toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">
                              {Number(d.kredit) > 0 ? `Rp ${Number(d.kredit).toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{d.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            Belum ada data jurnal. Lakukan pencatatan tagihan, pembayaran, atau pemasukan hibah untuk meng-generate jurnal otomatis.
          </div>
        )}
      </div>
    </div>
  );
}
