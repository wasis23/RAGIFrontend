'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, BookOpen } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan } from '@/types/sikeu.types';

export default function CreateJurnalPage() {
  const router = useRouter();

  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [tanggalJurnal, setTanggalJurnal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisSumber, setJenisSumber] = useState('penyesuaian');
  const [keterangan, setKeterangan] = useState('');

  // Dynamic Debet & Kredit Lines
  const [lines, setLines] = useState([
    { akun_id: 0, debet: 0, kredit: 0, keterangan: '' },
    { akun_id: 0, debet: 0, kredit: 0, keterangan: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const addLine = () => {
    setLines([...lines, { akun_id: 0, debet: 0, kredit: 0, keterangan: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const totalDebet = lines.reduce((sum, l) => sum + Number(l.debet || 0), 0);
  const totalKredit = lines.reduce((sum, l) => sum + Number(l.kredit || 0), 0);
  const isBalanced = Math.abs(totalDebet - totalKredit) < 0.01 && totalDebet > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError(`Total Debet (Rp ${totalDebet.toLocaleString('id-ID')}) dan Total Kredit (Rp ${totalKredit.toLocaleString('id-ID')}) harus seimbang dan > 0.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await sikeuService.storeJurnal({
        tanggal_jurnal: tanggalJurnal,
        jenis_sumber: jenisSumber,
        keterangan,
        details: lines.map((l) => ({
          akun_id: Number(l.akun_id),
          debet: Number(l.debet),
          kredit: Number(l.kredit),
          keterangan: l.keterangan || keterangan,
        })),
      });

      router.push('/sikeu/akuntansi/jurnal');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan jurnal akuntansi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/akuntansi/jurnal" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="Kembali ke Daftar Jurnal">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Entry Jurnal Umum & Penyesuaian Manual</h1>
            <p className="text-xs text-gray-500">Pencatatan entri jurnal ganda (Double-entry debet/kredit seimbang)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Metadata Form (Grid 3-Column per crud-ui-standard) */}
        <div className="card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tanggal Jurnal <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalJurnal}
              onChange={(e) => setTanggalJurnal(e.target.value)}
              className="textarea textarea-sm w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Jenis Sumber Jurnal <span className="text-rose-500">*</span>
            </label>
            <select
              value={jenisSumber}
              onChange={(e) => setJenisSumber(e.target.value)}
              className="select select-sm"
              required
            >
              <option value="penyesuaian">Jurnal Penyesuaian (Adjustment)</option>
              <option value="pengeluaran_manual">Pengeluaran Operasional</option>
              <option value="pemasukan_hibah">Pemasukan Hibah / Donor</option>
              <option value="penutupan">Jurnal Penutupan Akhir Periode</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Status Imbangan (Debet vs Kredit)
            </label>
            <div className={`p-2.5 rounded-lg text-xs font-bold text-center border ${
              isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG'}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Keterangan Transaksi <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Penjelasan deskriptif mengenai penyesuaian atau transaksi jurnal..."
              className="textarea textarea-sm w-full"
              rows={2}
              required
            />
          </div>
        </div>

        {/* Dynamic Lines Table */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Rincian Baris Debet & Kredit</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
            >
              <Plus size={14} /> Tambah Baris Akun
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 w-1/3">Pilih Akun COA</th>
                  <th className="px-4 py-3 w-1/5 text-right">Debet (Rp)</th>
                  <th className="px-4 py-3 w-1/5 text-right">Kredit (Rp)</th>
                  <th className="px-4 py-3">Catatan Baris</th>
                  <th className="px-4 py-3 text-center w-12">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <select
                        value={line.akun_id}
                        onChange={(e) => updateLine(idx, 'akun_id', e.target.value)}
                        className="select select-sm"
                        required
                      >
                        <option value={0}>-- Pilih Akun COA --</option>
                        {coaList.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.kode_akun}] {a.nama_akun} ({a.kelompok.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={line.debet}
                        onChange={(e) => updateLine(idx, 'debet', e.target.value)}
                        className="w-full text-xs font-mono text-right border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={line.kredit}
                        onChange={(e) => updateLine(idx, 'kredit', e.target.value)}
                        className="w-full text-xs font-mono text-right border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={line.keterangan}
                        onChange={(e) => updateLine(idx, 'keterangan', e.target.value)}
                        placeholder="Keterangan baris (opsional)"
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 2}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold text-xs uppercase text-gray-900 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 text-right">Total Seimbang:</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-600">
                    Rp {totalDebet.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-600">
                    Rp {totalKredit.toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/sikeu/akuntansi/jurnal"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting || !isBalanced}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save size={16} /> {submitting ? 'Simpan...' : 'Simpan Entry Jurnal'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
