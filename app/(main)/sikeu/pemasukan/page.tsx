'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Building, FileText, CheckCircle } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PemasukanKampus } from '@/types/sikeu.types';

export default function PemasukanListPage() {
  const [pemasukanList, setPemasukanList] = useState<PemasukanKampus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPemasukan = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getPemasukanList();
        if (res.data) {
          setPemasukanList(res.data);
        }
      } catch (err) {
        console.error('Failed to load pemasukan list', err);
      } finally {
        setLoading(false);
      }
    };
    loadPemasukan();
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
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Daftar Pemasukan Kampus & Hibah</h1>
            <p className="text-xs text-gray-500">Rekapitulasi penerimaan dana hibah penelitian (SIPPM), donatur, kerjasama & pendapatan non-akademik</p>
          </div>
        </div>
        <Link
          href="/sikeu/pemasukan/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} /> Catat Pemasukan Hibah
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading data pemasukan...</div>
        ) : pemasukanList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Sumber Pemasukan</th>
                  <th className="px-4 py-3">Donor / Instansi</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Tgl Terima</th>
                  <th className="px-4 py-3 text-center">Status Jurnal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pemasukanList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-600">{item.nomor_transaksi}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded">
                        {item.sumber_pemasukan.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.nama_donor_instansi}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Rp {Number(item.nominal).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{item.tanggal_terima}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Auto-Posted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            Belum ada pencatatan pemasukan dana hibah. Klik tombol <strong>Catat Pemasukan Hibah</strong> untuk menambahkan.
          </div>
        )}
      </div>
    </div>
  );
}
