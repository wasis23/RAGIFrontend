'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search, UserCheck, CreditCard, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function CreateTagihanPage() {
  const router = useRouter();

  // Search & Student Selection (Select2 style)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentActiveBills, setStudentActiveBills] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    mahasiswa_id: '',
    tahun_akademik_id: '1',
    source_system: 'SIAKAD',
    requires_approval: false,
    jatuh_tempo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jenis_biaya_kode: 'UKT_REG',
    nominal: '3500000',
    keterangan: 'Tagihan UKT Semester Ganjil',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Preset tarif berdasarkan angkatan mahasiswa
  const uktTarifMap: Record<number, number> = {
    2023: 3000000,
    2024: 3500000,
    2025: 4000000,
    2026: 4500000,
  };

  // Autocomplete Mahasiswa Search (NIM / Nama)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await sikeuService.searchMahasiswa(searchQuery);
          if (res.data) {
            setSearchResults(res.data);
          }
        } catch (e) {
          console.error(e);
          // Fallback mock search results if API unavailable
          const mock = [
            { mahasiswa_id: 101, nim: '2024010042', nama_mahasiswa: 'Budi Santoso', prodi: 'Teknik Informatika', tahun_angkatan: 2024, total_tagihan: 3500000, sisa_tagihan: 3500000, status: 'belum_bayar', nomor_tagihan: 'INV-20260801-001' },
            { mahasiswa_id: 102, nim: '2025010018', nama_mahasiswa: 'Siti Rahmawati', prodi: 'Sistem Informasi', tahun_angkatan: 2025, total_tagihan: 4000000, sisa_tagihan: 4000000, status: 'belum_bayar', nomor_tagihan: 'INV-20260801-002' },
            { mahasiswa_id: 103, nim: '2023010088', nama_mahasiswa: 'Ahmad Fauzi', prodi: 'Manajemen Informatika', tahun_angkatan: 2023, total_tagihan: 3000000, sisa_tagihan: 0, status: 'lunas', nomor_tagihan: 'INV-20260801-003' },
          ].filter(m => m.nim.includes(searchQuery) || m.nama_mahasiswa.toLowerCase().includes(searchQuery.toLowerCase()));
          setSearchResults(mock);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Saat mahasiswa dipilih (Select2)
  const handleSelectStudent = (mhs: any) => {
    setSelectedStudent(mhs);
    setFormData({
      ...formData,
      mahasiswa_id: String(mhs.mahasiswa_id),
      nominal: String(uktTarifMap[mhs.tahun_angkatan] || 3500000),
      keterangan: `Tagihan UKT Semester Ganjil Angkatan ${mhs.tahun_angkatan} - ${mhs.prodi}`,
    });
    setStudentActiveBills([
      {
        nomor_tagihan: mhs.nomor_tagihan || 'INV-EXISTING-001',
        jenis: 'UKT Reguler',
        nominal: mhs.total_tagihan || 3500000,
        status: mhs.status || 'belum_bayar',
      }
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleJenisBiayaChange = (kode: string) => {
    let nominal = 3500000;
    const angkatan = selectedStudent?.tahun_angkatan || 2024;

    if (kode === 'UKT_REG') {
      nominal = uktTarifMap[angkatan] || 3500000;
    } else if (kode === 'SPMB_ADM') {
      nominal = 350000;
    } else if (kode === 'WISUDA_FEE') {
      nominal = 1750000;
    } else if (kode === 'PRAKTIKUM') {
      nominal = 750000;
    }

    setFormData({
      ...formData,
      jenis_biaya_kode: kode,
      nominal: String(nominal),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent && !formData.mahasiswa_id) {
      setError('Pilih mahasiswa terlebih dahulu');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await sikeuService.createExternalBill({
        mahasiswa_id: Number(formData.mahasiswa_id),
        tahun_akademik_id: Number(formData.tahun_akademik_id),
        source_system: formData.source_system,
        requires_approval: formData.requires_approval,
        jatuh_tempo: formData.jatuh_tempo,
        keterangan: formData.keterangan,
        details: [
          {
            jenis_biaya_kode: formData.jenis_biaya_kode,
            nominal: Number(formData.nominal),
            keterangan: formData.keterangan,
          },
        ],
      });

      router.push('/sikeu/tagihan');
    } catch (err: any) {
      setError(err.message || 'Gagal menerbitkan tagihan mahasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/tagihan" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition" title="Kembali ke Daftar Tagihan">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-indigo font-bold">Billing Generator SIKEU</span>
              <span className="badge badge-purple font-bold">Select2 Mahasiswa Lookup</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Form Generate Tagihan Mahasiswa</h1>
            <p className="text-xs text-slate-500">Menerbitkan tagihan UKT/SPP/Praktikum dengan pencarian NIM/Nama & penyesuaian tarif angkatan</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* STEP 1: SELECT2 SEARCH MAHASISWA BY NIM OR NAMA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Search size={18} className="text-indigo-600" /> 1. Cari & Pilih Mahasiswa (Pencarian NIM / Nama)
        </h2>

        <div className="relative">
          <input
            type="text"
            placeholder="Ketik minimal 2 karakter NIM atau Nama Mahasiswa (misal: 2024 / Budi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm border-slate-300 w-full pl-9 text-xs font-semibold rounded-xl"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

        {/* SELECT2 STYLE AUTOCOMPLETE DROPDOWN */}
        {searchResults.length > 0 && !selectedStudent && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto space-y-1.5 z-20">
            {searchResults.map((mhs) => (
              <div
                key={mhs.mahasiswa_id}
                onClick={() => handleSelectStudent(mhs)}
                className="p-3 hover:bg-indigo-50/80 rounded-xl cursor-pointer transition-colors text-xs border border-transparent hover:border-indigo-200 flex justify-between items-center"
              >
                <div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck size={14} className="text-indigo-600" /> {mhs.nama_mahasiswa}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    NIM: <strong className="font-mono">{mhs.nim}</strong> • Prodi: {mhs.prodi} • <span className="text-indigo-700 font-bold">Angkatan {mhs.tahun_angkatan}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge-blue font-bold text-[10px]">Pilih Mahasiswa &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED STUDENT CARD & ACTIVE BILLS LOOKUP */}
        {selectedStudent && (
          <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-green font-bold">Mahasiswa Terpilih</span>
                  <span className="badge badge-purple font-bold">Angkatan {selectedStudent.tahun_angkatan}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">{selectedStudent.nama_mahasiswa}</h3>
                <p className="text-xs text-slate-600 font-mono">
                  NIM: <strong>{selectedStudent.nim}</strong> • Program Studi: <strong>{selectedStudent.prodi}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentActiveBills([]);
                  setFormData({ ...formData, mahasiswa_id: '' });
                }}
                className="btn btn-ghost btn-xs text-rose-600 font-bold hover:bg-rose-50"
              >
                Ganti Mahasiswa
              </button>
            </div>

            {/* INFORMASI TAGIHAN AKTIF YANG MASIH ADA */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <CreditCard size={15} className="text-indigo-600" /> Riwayat Status Tagihan Aktif Mahasiswa Ini:
              </div>

              {studentActiveBills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentActiveBills.map((b, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-bold text-slate-900">{b.jenis} ({b.nomor_tagihan})</div>
                        <div className="font-mono text-emerald-800 font-bold mt-0.5">{formatRupiah(b.nominal)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        b.status === 'lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Tidak ada tagihan tertunggak. Mahasiswa siap diterbitkan tagihan baru.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: FORM DETAILS (GRID 3 KOLOM) */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Sparkles size={18} className="text-teal-600" /> 2. Rincian Komponen Tagihan & Nominal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Input 1: ID Mahasiswa (Readonly from Select2) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              ID / NIM Mahasiswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              value={selectedStudent ? `${selectedStudent.nama_mahasiswa} (${selectedStudent.nim})` : formData.mahasiswa_id}
              placeholder="Pilih mahasiswa di atas..."
              className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-800"
              required
            />
          </div>

          {/* Input 2: Jenis Biaya */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Jenis Biaya Pendidikan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.jenis_biaya_kode}
              onChange={(e) => handleJenisBiayaChange(e.target.value)}
              className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="UKT_REG">UKT Reguler (Otomatis Sesuai Angkatan)</option>
              <option value="SPMB_ADM">Biaya Pendaftaran SPMB</option>
              <option value="WISUDA_FEE">Biaya Wisuda & Kelulusan</option>
              <option value="PRAKTIKUM">Biaya Laboratorium / Praktikum</option>
            </select>
          </div>

          {/* Input 3: Nominal Tagihan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              className="w-full text-xs font-mono font-extrabold border border-slate-300 rounded-xl p-2.5 text-emerald-800 focus:ring-2 focus:ring-indigo-500"
              required
              min={1000}
            />
          </div>

          {/* Input 4: Tanggal Jatuh Tempo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Batas Jatuh Tempo <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.jatuh_tempo}
              onChange={(e) => setFormData({ ...formData, jatuh_tempo: e.target.value })}
              className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Input 5: Sistem Asal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Sistem Asal (Source System)
            </label>
            <input
              type="text"
              value={formData.source_system}
              onChange={(e) => setFormData({ ...formData, source_system: e.target.value })}
              className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5"
            />
          </div>

          {/* Input 6: Butuh Approval Pimpinan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Memerlukan Approval Pimpinan?
            </label>
            <select
              value={formData.requires_approval ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, requires_approval: e.target.value === 'true' })}
              className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-white"
            >
              <option value="false">Tidak (Langsung Terbit VA)</option>
              <option value="true">Ya (Masuk Antrean Approval Pimpinan)</option>
            </select>
          </div>

          {/* Input 7: Keterangan (Span 3 Columns) */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Keterangan & Peruntukan Tagihan
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Tuliskan catatan peruntukan atau rincian komponen tagihan..."
              className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/sikeu/tagihan"
            className="btn btn-secondary font-bold text-xs"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs border-none shadow-sm flex items-center gap-1.5"
          >
            <Save size={16} /> {submitting ? 'Simpan...' : 'Terbitkan Tagihan Mahasiswa'}
          </button>
        </div>
      </form>
    </div>
  );
}
