'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

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
    unit_kas_id: '',
    keterangan: '',
    file_bukti_bayar: '',
  });

  const [unitKasList, setUnitKasList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnitKas = async () => {
      try {
        const res = await sikeuService.getUnitKasList();
        const unitKas = res.data;
        if (unitKas) {
          setUnitKasList(unitKas);
          if (unitKas.length > 0) {
            setFormData(prev => ({ ...prev, unit_kas_id: unitKas[0].id.toString() }));
          }
        }
      } catch (e) {
        console.error('Failed to load unit kas', e);
      }
    };
    fetchUnitKas();
  }, []);

  const nominalVal = Number(formData.nominal) || 0;
  const tarifVal = Number(formData.tarif_pajak_persen) || 0;
  const nominalPajak = (nominalVal * tarifVal) / 100;
  const netDibayarkan = (formData.jenis_pajak === 'pph_21' || formData.jenis_pajak === 'pph_23')
    ? nominalVal - nominalPajak
    : nominalVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await sikeuService.storePengeluaran({
        kategori: formData.kategori,
        nominal: nominalVal,
        tanggal_transaksi: formData.tanggal_transaksi,
        nama_vendor: formData.nama_vendor,
        npwp_vendor: formData.npwp_vendor || undefined,
        jenis_pajak: formData.jenis_pajak,
        unit_kas_id: formData.unit_kas_id ? Number(formData.unit_kas_id) : undefined,
        keterangan: formData.keterangan || undefined,
      });

      router.push('/sikeu/pengeluaran');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi pengeluaran');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/pengeluaran" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition" title="Kembali">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge badge-red">
                Form Pengeluaran Baru
              </span>
              <span className="badge badge-gray">
                Auto Debet Kas & Balanced Journal
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Input Transaksi Pengeluaran Kampus</h1>
            <p className="text-xs text-slate-500">
              Pencatatan beban operasional, pemeliharaan, barang/jasa, vendor & perhitungan pajak PPh/PPN
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Form with 3-Column Grid per crud-ui-standard */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Input 1: Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              className="select select-sm"
              required
            >
              <option value="operasional">Beban Operasional Kampus</option>
              <option value="pemeliharaan">Beban Pemeliharaan Sarana/Lab</option>
              <option value="laboratorium">Beban Alat & Praktikum Lab</option>
              <option value="kegiatan">Beban Kegiatan & Acara</option>
              <option value="honorarium">Honorarium Dosen/Narasumber</option>
              <option value="lainnya">Pengeluaran Lainnya</option>
            </select>
          </div>

          {/* Input 2: Nominal Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gross Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              placeholder="Contoh: 15000000"
              className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
              min={1000}
            />
          </div>

          {/* Input 3: Tanggal Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_transaksi}
              onChange={(e) => setFormData({ ...formData, tanggal_transaksi: e.target.value })}
              className="select select-sm"
              required
            />
          </div>

          {/* Input 4: Jenis Pajak */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
              className="select select-sm"
            >
              <option value="tanpa_pajak">Tanpa Pajak</option>
              <option value="pph_21">PPh 21 (Honorarium SDM - 5%)</option>
              <option value="pph_23">PPh 23 (Jasa Vendor - 2%)</option>
              <option value="ppn_11">PPN (11%)</option>
            </select>
          </div>

          {/* Input 5: Unit Kas Sumber Dana */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sumber Unit Kas
            </label>
            <select
              value={formData.unit_kas_id}
              onChange={(e) => setFormData({ ...formData, unit_kas_id: e.target.value })}
              className="select select-sm"
            >
              {unitKasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kas} (Saldo: Rp {Number(k.saldo_saat_ini || 0).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* Input 6: Nama Vendor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Rekanan / Vendor <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nama_vendor}
              onChange={(e) => setFormData({ ...formData, nama_vendor: e.target.value })}
              placeholder="PT Solusi Lab Utama / Nama Dosen"
              className="select select-sm"
              required
            />
          </div>

          {/* Input 7: NPWP Vendor */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              NPWP Rekanan (Opsional)
            </label>
            <input
              type="text"
              value={formData.npwp_vendor}
              onChange={(e) => setFormData({ ...formData, npwp_vendor: e.target.value })}
              placeholder="01.234.567.8-901.000"
              className="select select-sm"
            />
          </div>

          {/* Input 8: Keterangan (Span 2 Columns) */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Uraian Rinci Pengeluaran
            </label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Pembelian Router Cisco Core & Kabel UTP Cat6 Lab TI..."
              className="select select-sm"
            />
          </div>

          {/* Tax Calculation Box (Span 3 Columns) */}
          <div className="lg:col-span-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Kalkulasi Pemotongan Pajak Otomatis</span>
              <p className="text-xs text-slate-600 mt-0.5">
                Potongan Pajak: <strong className="text-amber-800 font-mono">Rp {nominalPajak.toLocaleString('id-ID')} ({formData.tarif_pajak_persen}%)</strong> &mdash; otomatis tercatat di modul Perpajakan SIKEU.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-600">Net Pengeluaran Kas:</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                Rp {netDibayarkan.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/sikeu/pengeluaran"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            <Save size={16} /> {submitting ? 'Menyimpan Transaksi...' : 'Simpan Transaksi Pengeluaran'}
          </button>
        </div>
      </form>
    </div>
  );
}
