'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan } from '@/types/sikeu.types';

export default function CoaPage() {
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states <= 5 inputs (use Modal 2-column grid per crud-ui-standard)
  const [formData, setFormData] = useState({
    kode_akun: '',
    nama_akun: '',
    kelompok: 'aset',
    saldo_normal: 'debet',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCoa = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getCoaList();
      if (res.data) {
        setCoaList(res.data);
      }
    } catch (err) {
      console.error('Failed to load COA', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoa();
  }, []);

  const handleCreateCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await sikeuService.storeCoa(formData);
      setShowModal(false);
      setFormData({ kode_akun: '', nama_akun: '', kelompok: 'aset', saldo_normal: 'debet' });
      await loadCoa();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat akun COA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Chart of Accounts (COA / Master Akun)</h1>
            <p className="text-xs text-gray-500">Master pengkodean akun akuntansi (Aset, Liabilitas, Ekuitas, Pendapatan, Beban)</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} /> Tambah Akun COA
        </button>
      </div>

      {/* COA Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading COA...</div>
        ) : coaList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Kode Akun</th>
                  <th className="px-4 py-3">Nama Akun Keuangan</th>
                  <th className="px-4 py-3">Kelompok</th>
                  <th className="px-4 py-3">Saldo Normal</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coaList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{item.kode_akun}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.nama_akun}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        item.kelompok === 'aset' ? 'bg-emerald-50 text-emerald-700' :
                        item.kelompok === 'liabilitas' ? 'bg-rose-50 text-rose-700' :
                        item.kelompok === 'ekuitas' ? 'bg-purple-50 text-purple-700' :
                        item.kelompok === 'pendapatan' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.kelompok}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-xs font-semibold text-gray-700">{item.saldo_normal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            Belum ada data master COA. Klik tombol **Tambah Akun COA** untuk membuat.
          </div>
        )}
      </div>

      {/* Modal <= 5 Input Grid 2-Column (per crud-ui-standard) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Tambah Akun COA Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}

            <form onSubmit={handleCreateCoa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input 1: Kode Akun */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kode Akun *</label>
                  <input
                    type="text"
                    value={formData.kode_akun}
                    onChange={(e) => setFormData({ ...formData, kode_akun: e.target.value })}
                    placeholder="Contoh: 101.03"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Input 2: Nama Akun */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Akun *</label>
                  <input
                    type="text"
                    value={formData.nama_akun}
                    onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
                    placeholder="Kas Kecil Fakultas"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Input 3: Kelompok */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kelompok Akun *</label>
                  <select
                    value={formData.kelompok}
                    onChange={(e) => setFormData({ ...formData, kelompok: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="aset">Aset (100)</option>
                    <option value="liabilitas">Liabilitas (200)</option>
                    <option value="ekuitas">Ekuitas (300)</option>
                    <option value="pendapatan">Pendapatan (400)</option>
                    <option value="beban">Beban (500)</option>
                  </select>
                </div>

                {/* Input 4: Saldo Normal */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Saldo Normal *</label>
                  <select
                    value={formData.saldo_normal}
                    onChange={(e) => setFormData({ ...formData, saldo_normal: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="debet">DEBET</option>
                    <option value="kredit">KREDIT</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition"
                >
                  {submitting ? 'Simpan...' : 'Simpan Akun COA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
