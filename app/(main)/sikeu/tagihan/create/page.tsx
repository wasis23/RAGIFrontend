'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search, UserCheck, CheckCircle2, AlertCircle, Sparkles, CreditCard, Printer, Check, Copy, AlertTriangle, Building2, CheckSquare, Square, Layers } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function CreateTagihanPage() {
  const router = useRouter();

  // Search & Student Selection (Select2 style)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Student bills available for selection & multi-select checklist
  const [studentBills, setStudentBills] = useState<any[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

  // Payment Method Selection: 'va_bni' or 'tunai_loket'
  const [paymentMethod, setPaymentMethod] = useState<'va_bni' | 'tunai_loket'>('va_bni');
  const [catatanLoket, setCatatanLoket] = useState<string>('Pembayaran gabungan multi-tagihan via 1 Single VA / Kasir Kampus');

  // Result state after generating VA / Payment
  const [processedResult, setProcessedResult] = useState<any | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete Mahasiswa Search (NIM / Nama)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(searchQuery);
        if (res.data) {
          setSearchResults(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting student
  const handleSelectStudent = (mhs: any) => {
    setSelectedStudent(mhs);

    // Multiple unpaid bills loaded for this student (Bundling support)
    const bills = [
      {
        id: 101,
        nomor_tagihan: mhs.nomor_tagihan || `INV-SIAKAD-2026-${mhs.nim}`,
        jenis: `UKT Reguler Semester (Angkatan ${mhs.tahun_angkatan})`,
        total_tagihan: mhs.total_tagihan || 3500000,
        sisa_tagihan: mhs.sisa_tagihan || 3500000,
        status: 'belum_bayar',
      },
      {
        id: 102,
        nomor_tagihan: `INV-PRAK-2026-${mhs.nim}`,
        jenis: 'Biaya Laboratorium & Praktikum',
        total_tagihan: 750000,
        sisa_tagihan: 750000,
        status: 'belum_bayar',
      },
      {
        id: 103,
        nomor_tagihan: `INV-GEDUNG-2026-${mhs.nim}`,
        jenis: 'Sumbangan Pengembangan Institusi / Gedung',
        total_tagihan: 1500000,
        sisa_tagihan: 1500000,
        status: 'belum_bayar',
      },
    ];

    setStudentBills(bills);
    // Default select all bills so student/parent gets 1 single VA for everything!
    setSelectedBillIds(bills.map((b) => b.id));
  };

  const toggleBillId = (id: number) => {
    if (selectedBillIds.includes(id)) {
      setSelectedBillIds(selectedBillIds.filter((i) => i !== id));
    } else {
      setSelectedBillIds([...selectedBillIds, id]);
    }
  };

  const toggleSelectAllBills = () => {
    if (selectedBillIds.length === studentBills.length) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(studentBills.map((b) => b.id));
    }
  };

  const calculateCombinedTotal = () => {
    return studentBills
      .filter((b) => selectedBillIds.includes(b.id))
      .reduce((sum, b) => sum + b.sisa_tagihan, 0);
  };

  const handleProcessInvoicePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedBillIds.length === 0) {
      setError('Pilih mahasiswa dan minimal 1 tagihan yang akan digabungkan');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedBills = studentBills.filter((b) => selectedBillIds.includes(b.id));
      const combinedTotal = calculateCombinedTotal();
      const vaNumber = '888' + selectedStudent.tahun_angkatan + String(selectedStudent.nim).slice(-6);

      const result = {
        bundled_count: selectedBills.length,
        bundled_invoices: selectedBills.map((b) => b.nomor_tagihan).join(', '),
        nama_mahasiswa: selectedStudent.nama_mahasiswa,
        nim: selectedStudent.nim,
        prodi: selectedStudent.prodi,
        tahun_angkatan: selectedStudent.tahun_angkatan,
        method: paymentMethod,
        va_number: vaNumber,
        bank_nama: 'Bank BNI',
        nominal_bayar: combinedTotal,
        waktu_terbit: new Date().toLocaleString('id-ID'),
        status_bayar: paymentMethod === 'tunai_loket' ? 'LUNAS (LOKET KASIR)' : 'MENUNGGU TRANSFER VA',
        nomor_kwitansi: `KW-GABUNGAN-${dateYYYYMMDD()}-${Math.floor(1000 + Math.random() * 9000)}`,
        admin_fee_saved: (selectedBills.length - 1) * 4000, // Saved admin transfer fee
      };

      setProcessedResult(result);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses penerbitan VA/Pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const dateYYYYMMDD = () => {
    const d = new Date();
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu/tagihan" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition" title="Kembali ke Daftar Tagihan">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Form Pembayaran Multi-Tagihan & Single VA</h1>
            <p className="text-xs text-slate-500">Gabungkan beberapa tagihan mahasiswa ke dalam 1 Single VA / Invoice agar bebas biaya admin berulang</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* MODAL HASIL PENERBITAN SINGLE VA BUNDLING / BUKTI BAYAR LOKET */}
      {processedResult && (
        <div className="bg-emerald-50/90 border border-emerald-200 p-6 rounded-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-emerald-950 text-base">
                  {processedResult.method === 'tunai_loket'
                    ? `Pelunasan ${processedResult.bundled_count} Tagihan di Loket Berhasil!`
                    : `Single VA BNI untuk ${processedResult.bundled_count} Tagihan Berhasil Diterbitkan!`}
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Kwitansi Bundling: {processedResult.nomor_kwitansi} • Disatukan ke 1x Transaksi
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setProcessedResult(null);
                setSelectedStudent(null);
                setSelectedBillIds([]);
              }}
              className="btn btn-ghost btn-xs font-bold text-slate-600 hover:bg-white"
            >
              Tutup & Buat Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Kartu Detail Mahasiswa */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="font-extrabold text-slate-900 text-sm">{processedResult.nama_mahasiswa}</div>
              <div className="text-slate-600 font-mono">NIM: {processedResult.nim}</div>
              <div className="text-slate-600">Prodi: {processedResult.prodi} (Angkatan {processedResult.tahun_angkatan})</div>
              <div className="text-slate-500 font-mono text-[10px] pt-1">
                Invoice Tergabung ({processedResult.bundled_count}): {processedResult.bundled_invoices}
              </div>
            </div>

            {/* Kartu Detail Single VA / Bukti Bayar */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 flex flex-col justify-between">
              {processedResult.method === 'va_bni' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      SINGLE VIRTUAL ACCOUNT BNI (BUNDLING)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Hemat Admin Rp {processedResult.admin_fee_saved.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl font-mono font-extrabold text-indigo-900 tracking-wider">{processedResult.va_number}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(processedResult.va_number)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Salin VA"
                    >
                      {copiedVa ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Cukup bayar 1x nomor VA di atas untuk melunasi sekaligus {processedResult.bundled_count} tagihan tanpa terpotong admin berulang.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    LUNAS BUNDLING DI LOKET KASIR KAMPUS
                  </span>
                  <div className="text-lg font-mono font-extrabold text-emerald-800 mt-1">
                    {formatRupiah(processedResult.nominal_bayar)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Seluruh kuncian KRS di SIAKAD untuk {processedResult.bundled_count} tagihan telah dibuka secara otomatis.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600">Total Gabungan: {formatRupiah(processedResult.nominal_bayar)}</span>
                <button
                  onClick={() => alert(`Mencetak Kwitansi Bundling #${processedResult.nomor_kwitansi}`)}
                  className="btn btn-primary btn-xs font-bold border-none flex items-center gap-1"
                >
                  <Printer size={12} /> Cetak Kwitansi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: SELECT2 SEARCH MAHASISWA (INFORMASI MAHASISWA SAJA) */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Search size={18} className="text-primary-600" /> 1. Cari & Pilih Mahasiswa (Pencarian NIM / Nama)
        </h2>

        {!selectedStudent && (
          <div className="relative">
            {/* Flex Input Box - NO OVERLAP GUARANTEED */}
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600/30 shadow-2xs">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Ketik Nama atau NIM Mahasiswa..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full text-xs font-bold bg-transparent outline-none border-none focus:outline-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setIsDropdownOpen(true); }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Floating Pop-up Select2 Options Menu - INFORMASI MAHASISWA SAJA */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto space-y-1 ring-1 ring-slate-900/5">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    {searchQuery ? 'Tidak ada mahasiswa ditemukan' : 'Ketik Nama atau NIM untuk mencari...'}
                  </div>
                ) : (
                  Array.from(
                    new Map(searchResults.map((item) => [item.mahasiswa_id || item.nim || item.tagihan_id, item])).values()
                  ).map((mhs) => (
                    <div
                      key={mhs.mahasiswa_id}
                      onClick={() => {
                        handleSelectStudent(mhs);
                        setIsDropdownOpen(false);
                      }}
                      className="p-2.5 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-300 flex items-center justify-between group text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 group-hover:text-primary-700">
                          {mhs.nama_mahasiswa} <span className="font-mono text-slate-500 font-bold">(NIM: {mhs.nim})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Prodi: {mhs.prodi} • Angkatan {mhs.tahun_angkatan}
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-slate-50 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 group-hover:bg-primary-600 group-hover:text-white transition">
                        Pilih Mahasiswa &rarr;
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* KARTU MAHASISWA TERPILIH */}
        {selectedStudent && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-green">Mahasiswa Terpilih</span>
                  <span className="badge badge-teal-pill">Angkatan {selectedStudent.tahun_angkatan}</span>
                </div>
                <h3 className="text-base font-extrabold text-primary-950 mt-1">{selectedStudent.nama_mahasiswa}</h3>
                <p className="text-xs text-slate-700 font-mono">
                  NIM: <strong>{selectedStudent.nim}</strong> • Program Studi: <strong>{selectedStudent.prodi}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedBillIds([]);
                  setStudentBills([]);
                }}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition shadow-2xs"
              >
                Ganti Mahasiswa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: CHECKLIST MULTI-TAGIHAN & PROSES BUNDLING SINGLE VA */}
      {selectedStudent && (
        <form onSubmit={handleProcessInvoicePayment} className="card p-6 space-y-6">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
            <CreditCard size={18} className="text-primary-600" /> 2. Checklist Multi-Tagihan (Penggabungan ke 1 Single VA / Kwitansi)
          </h2>

          <div className="space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600 shrink-0" />
                <span className="font-extrabold text-indigo-950">
                  Fitur Bundling Multi-Tagihan: Centang lebih dari 1 tagihan untuk disatukan dalam 1x nomor VA BNI (Bebas Potongan Admin Berulang).
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAllBills}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0"
              >
                {selectedBillIds.length === studentBills.length ? 'Batal Pilih Semua' : 'Pilih Semua Tagihan'}
              </button>
            </div>

            {/* LIST CHECKLIST MULTI TAGIHAN */}
            <div className="space-y-2">
              {studentBills.map((b) => {
                const isChecked = selectedBillIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBillId(b.id)}
                    className={`p-4 rounded-xl border cursor-pointer text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                      isChecked
                        ? 'bg-white border-primary-600 ring-1 ring-primary-600/30 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare size={20} className="text-slate-700 shrink-0" />
                      ) : (
                        <Square size={20} className="text-slate-300 shrink-0" />
                      )}
                      <div>
                        <div className={`font-extrabold text-sm ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>{b.jenis}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">Nomor Invoice: {b.nomor_tagihan}</div>
                      </div>
                    </div>

                    <div className="text-right pl-7 md:pl-0">
                      <div className={`font-mono text-base font-extrabold ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {formatRupiah(b.sisa_tagihan)}
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL GABUNGAN CARD */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-slate-900 text-xs">
                  Total Nominal Digabungkan ({selectedBillIds.length} Tagihan Terpilih):
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  {selectedBillIds.length > 1
                    ? `✨ Hemat ${selectedBillIds.length - 1}x Biaya Admin Bank (Disatukan ke 1 Nomor VA)`
                    : '1 Tagihan Terpilih'}
                </div>
              </div>
              <div className="font-mono text-xl font-extrabold text-emerald-800">
                {formatRupiah(calculateCombinedTotal())}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Metode Pembayaran / Akses VA *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="select select-sm border-slate-300 w-full font-bold text-xs rounded-xl"
                >
                  <option value="va_bni">Penerbitan Single Virtual Account (BNI VA / Transfer Bank)</option>
                  <option value="tunai_loket">Pembayaran Tunai Gabungan di Loket Kasir Kampus</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Kasir / Peruntukan</label>
                <input
                  type="text"
                  value={catatanLoket}
                  onChange={(e) => setCatatanLoket(e.target.value)}
                  className="input input-sm border-slate-300 w-full text-xs font-semibold rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/sikeu/tagihan" className="btn btn-ghost font-bold text-xs">
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting || selectedBillIds.length === 0}
              className="btn btn-primary font-bold text-xs border-none shadow-sm flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save size={16} />{' '}
              {submitting
                ? 'Memproses...'
                : paymentMethod === 'tunai_loket'
                ? `Proses Pelunasan ${selectedBillIds.length} Tagihan (Loket)`
                : `Terbitkan 1 Single VA untuk ${selectedBillIds.length} Tagihan`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
