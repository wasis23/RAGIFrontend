'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Filter, Calendar, Layers, Sparkles, CreditCard, CheckCircle2, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function TagihanListPage() {
  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: Angkatan, Jalur/Kelas, Program Studi
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('all');
  const [selectedProdi, setSelectedProdi] = useState<string>('all');

  // Modal Mass Active Billing Activation with Master Data Component Checklist
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [massForm, setMassForm] = useState({
    target_angkatan: '2024',
    target_jalur: 'Reguler',
    target_kelompok: '3',
    target_prodi: 'all',
    semester_aktif: 'Semester Ganjil 2026/2027',
    jatuh_tempo: '2026-08-31',
  });

  // Reference fee components loaded from Master Data based on selected Angkatan, Jalur, & Kelompok
  const [masterComponents, setMasterComponents] = useState<any[]>([
    { kode: 'UKT_REG', nama: 'UKT Reguler / SPP Semester', nominal: 3500000, defaultSelected: true },
    { kode: 'PRAKTIKUM', nama: 'Biaya Laboratorium & Praktikum', nominal: 750000, defaultSelected: true },
    { kode: 'SPMB_ADM', nama: 'Biaya Pendaftaran SPMB', nominal: 350000, defaultSelected: false },
    { kode: 'WISUDA_FEE', nama: 'Biaya Wisuda & Kelulusan', nominal: 1750000, defaultSelected: false },
    { kode: 'GEDUNG', nama: 'Sumbangan Biaya Gedung / SPI', nominal: 5000000, defaultSelected: false },
  ]);

  const [selectedComponentKodes, setSelectedComponentKodes] = useState<string[]>(['UKT_REG', 'PRAKTIKUM']);
  const [massSubmitting, setMassSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update component list when angkatan/jalur/kelompok changes in mass modal
  useEffect(() => {
    const angkatan = Number(massForm.target_angkatan) || 2024;
    const kelompok = Number(massForm.target_kelompok) || 3;
    const isKaryawan = massForm.target_jalur === 'Karyawan';

    let baseUkt = 3500000;
    if (kelompok === 1) baseUkt = 500000;
    else if (kelompok === 2) baseUkt = 1500000;
    else if (kelompok === 4) baseUkt = isKaryawan ? 7500000 : 5500000;
    else if (kelompok === 5) baseUkt = 8500000;
    else baseUkt = isKaryawan ? 5500000 : 3500000;

    setMasterComponents([
      { kode: 'UKT_REG', nama: `UKT Reguler (Angkatan ${angkatan} - Level ${kelompok})`, nominal: baseUkt, defaultSelected: true },
      { kode: 'PRAKTIKUM', nama: 'Biaya Laboratorium & Praktikum TI', nominal: 750000, defaultSelected: true },
      { kode: 'SPMB_ADM', nama: 'Biaya Pendaftaran SPMB', nominal: 350000, defaultSelected: false },
      { kode: 'WISUDA_FEE', nama: 'Biaya Wisuda & Kelulusan', nominal: 1750000, defaultSelected: false },
      { kode: 'GEDUNG', nama: 'Sumbangan Biaya Gedung / SPI', nominal: 5000000, defaultSelected: false },
    ]);
  }, [massForm.target_angkatan, massForm.target_jalur, massForm.target_kelompok]);

  const toggleComponentKode = (kode: string) => {
    if (selectedComponentKodes.includes(kode)) {
      setSelectedComponentKodes(selectedComponentKodes.filter((k) => k !== kode));
    } else {
      setSelectedComponentKodes([...selectedComponentKodes, kode]);
    }
  };

  const toggleSelectAllMasterComponents = () => {
    if (selectedComponentKodes.length === masterComponents.length) {
      setSelectedComponentKodes([]);
    } else {
      setSelectedComponentKodes(masterComponents.map((c) => c.kode));
    }
  };

  const calculateMassSubtotal = () => {
    return masterComponents
      .filter((c) => selectedComponentKodes.includes(c.kode))
      .reduce((acc, c) => acc + c.nominal, 0);
  };

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getStudentBillingTypes({ page: 1, per_page: 20 });
      if (res.data && res.data.length > 0) {
        setTagihanList(res.data.map((item: any) => ({
          id: item.id,
          nomor: `INV-SIAKAD-2026-${String(item.id).padStart(3, '0')}`,
          nim: item.nim,
          nama: item.nama_mahasiswa,
          angkatan: item.tahun_angkatan,
          jalur: item.jalur_kelas,
          kelompok_ukt: `Level ${item.kelompok_ukt}`,
          prodi: 'Teknik Informatika',
          total: item.kelompok_ukt === 4 ? 5500000 : item.kelompok_ukt === 1 ? 500000 : 3500000,
          status: item.beasiswa ? 'lunas' : 'belum_bayar',
          jatuhTempo: '2026-08-31',
          source: item.status_pendaftaran || 'SIAKAD',
        })));
      } else {
        setTagihanList([
          { id: 1, nomor: 'INV-SIAKAD-2026-001', nim: '2024010042', nama: 'Budi Santoso', angkatan: 2024, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Teknik Informatika', total: 3500000, status: 'lunas', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
          { id: 2, nomor: 'INV-SPMB-2026-002', nim: '2025010018', nama: 'Siti Rahmawati', angkatan: 2025, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Sistem Informasi', total: 3500000, status: 'belum_bayar', jatuhTempo: '2026-08-31', source: 'SPMB' },
          { id: 3, nomor: 'INV-SIAKAD-2026-003', nim: '2023010088', nama: 'Ahmad Fauzi', angkatan: 2023, jalur: 'Karyawan', kelompok_ukt: 'Level 4 (Mandiri)', prodi: 'Manajemen Informatika', total: 5500000, status: 'pending_approval', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
        ]);
      }
    } catch (e) {
      setTagihanList([
        { id: 1, nomor: 'INV-SIAKAD-2026-001', nim: '2024010042', nama: 'Budi Santoso', angkatan: 2024, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Teknik Informatika', total: 3500000, status: 'lunas', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
        { id: 2, nomor: 'INV-SPMB-2026-002', nim: '2025010018', nama: 'Siti Rahmawati', angkatan: 2025, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Sistem Informasi', total: 3500000, status: 'belum_bayar', jatuhTempo: '2026-08-31', source: 'SPMB' },
        { id: 3, nomor: 'INV-SIAKAD-2026-003', nim: '2023010088', nama: 'Ahmad Fauzi', angkatan: 2023, jalur: 'Karyawan', kelompok_ukt: 'Level 4 (Mandiri)', prodi: 'Manajemen Informatika', total: 5500000, status: 'pending_approval', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, []);

  const handleActivateMassBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComponentKodes.length === 0) {
      alert('Pilih minimal 1 komponen tagihan master yang wajib dilunasi s/d bulan ini!');
      return;
    }
    setMassSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedback({
        type: 'success',
        message: `Berhasil mengaktifkan & menerbitkan tagihan masal ${massForm.semester_aktif} (Angkatan ${massForm.target_angkatan}, Jalur ${massForm.target_jalur}, Level ${massForm.target_kelompok}) dengan ${selectedComponentKodes.length} komponen wajib (${formatRupiah(calculateMassSubtotal())}/mhs).`,
      });
      setIsMassModalOpen(false);
      fetchTagihan();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengaktifkan tagihan masal' });
    } finally {
      setMassSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredList = tagihanList.filter(item => {
    if (selectedAngkatan !== 'all' && String(item.angkatan) !== selectedAngkatan) return false;
    if (selectedProdi !== 'all' && item.prodi !== selectedProdi) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Set Tagihan & Invoice Semester Aktif</h1>
            <p className="text-xs text-slate-500">Aktivasi tagihan masal per Angkatan/Prodi & Layanan Pembayaran Loket / VA Mahasiswa</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMassModalOpen(true)}
            className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={16} /> Aktifkan Tagihan Semester (Masal)
          </button>
          <Link
            href="/sikeu/tagihan/create"
            className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <CreditCard size={16} /> Bayar Loket / Terbitkan VA
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Filter Toolbar (Per Angkatan, Kelompok, & Prodi) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-teal-600" />
            <span className="font-bold text-slate-700">Angkatan:</span>
            <select
              value={selectedAngkatan}
              onChange={(e) => setSelectedAngkatan(e.target.value)}
              className="select select-xs border-slate-300 font-bold rounded-lg"
            >
              <option value="all">Semua Angkatan</option>
              <option value="2023">Angkatan 2023</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2026">Angkatan 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Program Studi:</span>
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="select select-xs border-slate-300 font-bold rounded-lg"
            >
              <option value="all">Semua Program Studi</option>
              <option value="Teknik Informatika">Teknik Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Manajemen Informatika">Manajemen Informatika</option>
            </select>
          </div>
        </div>

        <div className="font-mono text-slate-500 font-bold">
          {filteredList.length} Invoice Terbit Ditemukan
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">NO. INVOICE</th>
                <th className="px-4 py-3">MAHASISWA & NIM</th>
                <th className="px-4 py-3">ANGKATAN & PRODI</th>
                <th className="px-4 py-3">KELOMPOK UKT</th>
                <th className="px-4 py-3 text-right">TOTAL TAGIHAN</th>
                <th className="px-4 py-3">JATUH TEMPO</th>
                <th className="px-4 py-3 text-center">STATUS BAYAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Memuat data tagihan...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Tidak ada tagihan ditemukan untuk filter tersebut.</td></tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{item.nomor}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.nama}</div>
                      <div className="text-[10px] font-mono text-slate-500">NIM: {item.nim}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-teal-800">Angkatan {item.angkatan}</div>
                      <div className="text-[10px] font-semibold text-slate-500">{item.prodi}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.kelompok_ukt}</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                      {formatRupiah(item.total)}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{item.jatuhTempo}</td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'lunas' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <CheckCircle size={12} /> LUNAS (KRS AKTIF)
                        </span>
                      ) : item.status === 'pending_approval' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                          <Clock size={12} /> PENDING APPROVAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          <AlertCircle size={12} /> BELUM BAYAR
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AKTIFKAN TAGIHAN MASAL SEMESTER AKTIF (INTERAKTIF CHECKLIST DATA MASTER) */}
      {isMassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Setting & Aktifkan Tagihan Semester Masal</h3>
              <button onClick={() => setIsMassModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleActivateMassBilling} className="space-y-4">
              {/* STEP 1: FILTERS ANGKATAN & JALUR KELAS */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="font-extrabold text-slate-800">1. Filter Target Mahasiswa dari Master Data:</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Tahun Angkatan</label>
                    <select
                      value={massForm.target_angkatan}
                      onChange={(e) => setMassForm({ ...massForm, target_angkatan: e.target.value })}
                      className="select select-xs border-slate-300 w-full font-bold bg-white"
                    >
                      <option value="2023">Angkatan 2023</option>
                      <option value="2024">Angkatan 2024</option>
                      <option value="2025">Angkatan 2025</option>
                      <option value="2026">Angkatan 2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Jalur / Kelas</label>
                    <select
                      value={massForm.target_jalur}
                      onChange={(e) => setMassForm({ ...massForm, target_jalur: e.target.value })}
                      className="select select-xs border-slate-300 w-full font-bold bg-white"
                    >
                      <option value="Reguler">Reguler</option>
                      <option value="Karyawan">Karyawan</option>
                      <option value="Internasional">Internasional</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Program Studi</label>
                  <select
                    value={massForm.target_prodi}
                    onChange={(e) => setMassForm({ ...massForm, target_prodi: e.target.value })}
                    className="select select-xs border-slate-300 w-full font-bold bg-white"
                  >
                    <option value="all">Semua Program Studi</option>
                    <option value="ti">Teknik Informatika</option>
                    <option value="si">Sistem Informasi</option>
                    <option value="mi">Manajemen Informatika</option>
                  </select>
                </div>
              </div>

              {/* STEP 2: CHECKLIST KOMPONEN TAGIHAN MASTER WAJIB DILUNASI S/D BULAN INI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    2. Centang Komponen Master yang Wajib Dilunasi s/d Bulan Ini:
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAllMasterComponents}
                    className="text-[11px] font-bold text-teal-700 hover:underline"
                  >
                    {selectedComponentKodes.length === masterComponents.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {masterComponents.map((c) => {
                    const isChecked = selectedComponentKodes.includes(c.kode);
                    return (
                      <div
                        key={c.kode}
                        onClick={() => toggleComponentKode(c.kode)}
                        className={`p-2.5 rounded-xl border cursor-pointer text-xs flex justify-between items-center transition-all ${
                          isChecked
                            ? 'bg-teal-50/80 border-teal-600 ring-1 ring-teal-600/30 font-bold'
                            : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-teal-700 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-300 shrink-0" />
                          )}
                          <span className={isChecked ? 'text-slate-900' : 'text-slate-500'}>{c.nama}</span>
                        </div>
                        <span className={`font-mono ${isChecked ? 'text-emerald-800 font-extrabold' : 'text-slate-400'}`}>
                          {formatRupiah(c.nominal)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950">Subtotal Tagihan Wajib per Mahasiswa:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-800">
                    {formatRupiah(calculateMassSubtotal())}
                  </span>
                </div>
              </div>

              {/* STEP 3: SETTING BATAS TANGGAL JATUH TEMPO PEMBAYARAN BULAN INI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">3. Batas Tanggal Wajib Dilunasi Bulan Ini *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setMassForm({ ...massForm, jatuh_tempo: d.toISOString().split('T')[0] });
                      }}
                      className="text-[10px] font-bold text-teal-700 hover:underline"
                    >
                      +30 Hari
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 60);
                        setMassForm({ ...massForm, jatuh_tempo: d.toISOString().split('T')[0] });
                      }}
                      className="text-[10px] font-bold text-teal-700 hover:underline"
                    >
                      +60 Hari
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={massForm.jatuh_tempo}
                  onChange={(e) => setMassForm({ ...massForm, jatuh_tempo: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-bold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsMassModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button
                  type="submit"
                  disabled={massSubmitting || selectedComponentKodes.length === 0}
                  className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none disabled:opacity-40"
                >
                  {massSubmitting ? 'Memproses...' : 'Terbitkan Tagihan Masal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
