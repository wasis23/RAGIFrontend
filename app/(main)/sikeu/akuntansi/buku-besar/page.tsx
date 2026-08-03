'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan, DetailJurnalUmum } from '@/types/sikeu.types';

export default function BukuBesarPage() {
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedAkunId, setSelectedAkunId] = useState<number | undefined>(undefined);
  const [glItems, setGlItems] = useState<DetailJurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoa = async () => {
      try {
        const res = await sikeuService.getCoaList();
        if (res.data) setCoaList(res.data);
      } catch (err) {
        console.error('Failed to load COA', err);
      }
    };
    loadCoa();
  }, []);

  useEffect(() => {
    const loadGl = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getBukuBesar(selectedAkunId);
        if (res.data) setGlItems(res.data);
      } catch (err) {
        console.error('Failed to load Buku Besar', err);
      } finally {
        setLoading(false);
      }
    };
    loadGl();
  }, [selectedAkunId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/akuntansi/jurnal" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Buku Besar & Mutasi Akun (General Ledger)</h1>
            <p className="text-xs text-gray-500">Rincian histori mutasi debet/kredit dan saldo berjalan per akun COA</p>
          </div>
        </div>
      </div>

      {/* Account Filter */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter Akun COA:</label>
        <select
          value={selectedAkunId || ''}
          onChange={(e) => setSelectedAkunId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full md:w-96 text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">-- Semua Akun Keuangan --</option>
          {coaList.map((a) => (
            <option key={a.id} value={a.id}>
              [{a.kode_akun}] {a.nama_akun} ({a.kelompok.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* GL Items Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading data Buku Besar...</div>
        ) : glItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kode Akun</th>
                  <th className="px-4 py-3">Nama Akun</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Debet (Rp)</th>
                  <th className="px-4 py-3 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {glItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">{item.jurnal?.tanggal_jurnal || '-'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{item.akun?.kode_akun}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.akun?.nama_akun}</td>
                    <td className="px-4 py-3">{item.keterangan || item.jurnal?.keterangan}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                      {Number(item.debet) > 0 ? `Rp ${Number(item.debet).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-indigo-700">
                      {Number(item.kredit) > 0 ? `Rp ${Number(item.kredit).toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            Tidak ada mutasi buku besar untuk akun yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
}
