'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreatePengeluaranPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    kategori: 'operasional',
    nominal: '',
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    nama_vendor: '',
    npwp_vendor: '',
    jenis_pajak: 'tanpa_pajak',
    tarif_pajak_persen: '0',
    keterangan: '',
    file_bukti_bayar: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const nominalVal = Number(formData.nominal) || 0;
  const tarifVal = Number(formData.tarif_pajak_persen) || 0;
  const nominalPajak = (nominalVal * tarifVal) / 100;
  const netDibayarkan = nominalVal - nominalPajak;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert('Transaksi pengeluaran kampus berhasil dicatat dan jurnal akuntansi terposting.');
      router.push('/sikeu/pengeluaran');
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/pengeluaran" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="Kembali ke Pengeluaran">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Input Transaksi Pengeluaran Kampus</h1>
            <p className="text-xs text-gray-500">Pencatatan beban operasional, pemeliharaan, barang/jasa, vendor & perhitungan pajak PPh/PPN</p>
          </div>
        </div>
      </div>

      {/* Form with 3-Column Grid per crud-ui-standard */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Input 1: Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            >
              <option value="operasional">Beban Operasional Kampus</option>
              <option value="pemeliharaan">Beban Pemeliharaan Sarana/Lab</option>
              <option value="konsumsi">Beban Konsumsi & Rapat</option>
              <option value="pengadaan">Pengadaan Alat & Inventaris</option>
            </select>
          </div>

          {/* Input 2: Nominal Transaksi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              placeholder="Contoh: 15000000"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
              min={1000}
            />
          </div>

          {/* Input 3: Tanggal Transaksi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tanggal Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_transaksi}
              onChange={(e) => setFormData({ ...formData, tanggal_transaksi: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Input 4: Jenis Pajak */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Jenis Potongan Pajak
            </label>
            <select
              value={formData.jenis_pajak}
              onChange={(e) => {
                const jenis = e.target.value;
                let tarif = '0';
                if (jenis === 'pph_21') tarif = '5';
                if (jenis === 'pph_23') tarif = '2';
                if (jenis === 'ppn_11') tarif = '11';
                setFormData({ ...formData, jenis_pajak: jenis, tarif_pajak_persen: tarif });
              }}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="tanpa_pajak">Tanpa Pajak</option>
              <option value="pph_21">PPh 21 (Honorarium SDM - 5%)</option>
              <option value="pph_23">PPh 23 (Jasa Vendor - 2%)</option>
              <option value="ppn_11">PPN (11%)</option>
            </select>
          </div>

          {/* Input 5: Nama Vendor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Vendor / Rekanan (Opsional)
            </label>
            <input
              type="text"
              value={formData.nama_vendor}
              onChange={(e) => setFormData({ ...formData, nama_vendor: e.target.value })}
              placeholder="PT Solusi Lab Utama"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Input 6: NPWP Vendor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              NPWP Vendor (Opsional)
            </label>
            <input
              type="text"
              value={formData.npwp_vendor}
              onChange={(e) => setFormData({ ...formData, npwp_vendor: e.target.value })}
              placeholder="01.234.567.8-901.000"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Tax Calculation Box (Span 3 Columns) */}
          <div className="lg:col-span-3 p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase">Kalkulasi Pemotongan Pajak</span>
              <p className="text-xs text-gray-600 mt-0.5">Potongan Pajak: Rp {nominalPajak.toLocaleString('id-ID')} ({formData.tarif_pajak_persen}%)</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-600">Net Dibayarkan ke Vendor:</span>
              <div className="text-xl font-bold text-gray-900 font-mono">Rp {netDibayarkan.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* Input 7: Keterangan (Span 3 Columns) */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Keterangan & Rincian Keperluan
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Uraian rinci transaksi pengeluaran operasional..."
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/sikeu/pengeluaran"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Save size={16} /> {submitting ? 'Simpan...' : 'Simpan Transaksi Pengeluaran'}
          </button>
        </div>
      </form>
    </div>
  );
}
