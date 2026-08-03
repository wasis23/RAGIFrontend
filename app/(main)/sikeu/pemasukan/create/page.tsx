'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building, FileCheck } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function CreatePemasukanPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    sumber_pemasukan: 'hibah_sippm',
    nominal: '',
    tanggal_terima: new Date().toISOString().split('T')[0],
    nama_donor_instansi: '',
    nomor_kontrak_ref: '',
    file_bukti_transfer: '',
    keterangan: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await sikeuService.storeExternalIncome({
        sumber_pemasukan: formData.sumber_pemasukan,
        nominal: Number(formData.nominal),
        tanggal_terima: formData.tanggal_terima,
        nama_donor_instansi: formData.nama_donor_instansi,
        nomor_kontrak_ref: formData.nomor_kontrak_ref,
        keterangan: formData.keterangan,
      });

      router.push('/sikeu/pemasukan');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pemasukan dana hibah');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/pemasukan" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="Kembali ke Daftar Pemasukan">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Catat Pemasukan Dana Hibah & Kerjasama</h1>
            <p className="text-xs text-gray-500">Pencatatan dana masuk dari SIPPM, donatur, atau mitra instansi eksternal</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Form with 3-Column Grid per crud-ui-standard */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Input 1: Sumber Pemasukan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Sumber Pemasukan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.sumber_pemasukan}
              onChange={(e) => setFormData({ ...formData, sumber_pemasukan: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            >
              <option value="hibah_sippm">Hibah Riset / PkM (SIPPM)</option>
              <option value="donatur">Donatur & Beasiswa Mitra</option>
              <option value="kerjasama">Kerjasama Industri / Instansi</option>
              <option value="pendapatan_lainnya">Pendapatan Non-Akademik Lainnya</option>
            </select>
          </div>

          {/* Input 2: Nominal Dana */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nominal Diterima (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              placeholder="Contoh: 50000000"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
              min={1000}
            />
          </div>

          {/* Input 3: Tanggal Terima */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tanggal Penerimaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_terima}
              onChange={(e) => setFormData({ ...formData, tanggal_terima: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Input 4: Nama Donor / Instansi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Donor / Instansi Pemberi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nama_donor_instansi}
              onChange={(e) => setFormData({ ...formData, nama_donor_instansi: e.target.value })}
              placeholder="Contoh: Kemdikbudristek / PT Telkom"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Input 5: Nomor Kontrak / SPK */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              No. Kontrak / SPK Referensi
            </label>
            <input
              type="text"
              value={formData.nomor_kontrak_ref}
              onChange={(e) => setFormData({ ...formData, nomor_kontrak_ref: e.target.value })}
              placeholder="Contoh: 045/SPK/LPPM/2026"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Input 6: File Bukti Transfer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              File Bukti Transfer / Rekening
            </label>
            <input
              type="text"
              value={formData.file_bukti_transfer}
              onChange={(e) => setFormData({ ...formData, file_bukti_transfer: e.target.value })}
              placeholder="Bukti_Transfer_Hibah_2026.pdf"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Input 7: Keterangan / Deskripsi (Span 3 Columns) */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Keterangan & Rincian Peruntukan Dana
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Tuliskan keterangan detail mengenai hibah atau peruntukan dana..."
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/sikeu/pemasukan"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Save size={16} /> {submitting ? 'Simpan...' : 'Simpan Pemasukan & Auto-Jurnal'}
          </button>
        </div>
      </form>
    </div>
  );
}
