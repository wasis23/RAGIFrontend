'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  ArrowRightLeft,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  Plus
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function SikeuKabagPage() {
  const [activeTab, setActiveTab] = useState<'approval' | 'kas-utama' | 'akuntansi'>('approval');

  // Approval Pending Lists
  const [pendingDispensasi, setPendingDispensasi] = useState<any[]>([
    { id: 201, mhs: 'Budi Santoso (2024010042)', prodi: 'Teknik Informatika 2024', tipe: 'Cicilan UKT 50%', nominal: 3500000, deadline: '2026-09-15', alasan: 'Kendala musibah keluarga, mohon perpanjangan cicilan 2x.' },
    { id: 202, mhs: 'Siti Rahmawati (2025010018)', prodi: 'Sistem Informasi 2025', tipe: 'Penundaan Pembayaran', nominal: 4000000, deadline: '2026-09-30', alasan: 'Menunggu pencairan beasiswa Pemda.' },
  ]);

  const [pendingMutasi, setPendingMutasi] = useState<any[]>([
    { id: 301, kode: 'MUT-KAS-202608-01', dari: 'Kas Utama Kabag Keuangan', ke: 'Kas Operasional SPMB', nominal: 15000000, alasan: 'Pengisian kas operasional pendaftaran SPMB' },
    { id: 302, kode: 'MUT-KAS-202608-02', dari: 'Kas Bank BNI Kampus', ke: 'Kas Bank Mandiri Payroll', nominal: 45000000, alasan: 'Transfer likuiditas gaji dosen & pegawai' },
  ]);

  const [pendingOperasional, setPendingOperasional] = useState<any[]>([
    { id: 401, no: 'EXP-OPR-202608-01', unit: 'Laboratorium Komputer TI', nama: 'Pembelian Router CISCO Lab TI', nominal: 18500000, pemohon: 'Ka. Lab Komputer' },
  ]);

  // Modal Approval Action
  const [modalAction, setModalAction] = useState<{ id: number; title: string; type: string } | null>(null);
  const [catatan, setCatatan] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Mutasi Kas Kabag
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [mutasiForm, setMutasiForm] = useState({
    unit_asal: 'Kas Utama Kabag Keuangan',
    unit_tujuan: 'Kas Operasional SPMB',
    nominal: '5000000',
    peruntukan: 'Pengisian kas tunai operasional kasir kampus',
  });

  const handleApprove = () => {
    if (!modalAction) return;
    setFeedback({
      type: 'success',
      message: `Berhasil MENYETUJUI pengajuan ${modalAction.title}. Status disetujui Kabag Keuangan & jurnal terposting otomatis.`,
    });

    if (modalAction.type === 'dispensasi') {
      setPendingDispensasi(prev => prev.filter(i => i.id !== modalAction.id));
    } else if (modalAction.type === 'mutasi') {
      setPendingMutasi(prev => prev.filter(i => i.id !== modalAction.id));
    } else {
      setPendingOperasional(prev => prev.filter(i => i.id !== modalAction.id));
    }

    setModalAction(null);
    setCatatan('');
  };

  const handleCreateMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({
      type: 'success',
      message: `Berhasil menerbitkan pengajuan Mutasi Kas (${mutasiForm.unit_asal} -> ${mutasiForm.unit_tujuan}) sebesar Rp ${Number(mutasiForm.nominal).toLocaleString('id-ID')}.`,
    });
    setIsMutasiModalOpen(false);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Portal Kabag Keuangan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge badge-teal-pill">Otoritas Finansial Tertinggi</span>
              <span className="badge badge-indigo">Kabag Keuangan Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Khusus Kabag Keuangan</h1>
            <p className="text-xs text-slate-500">Pusat Otorisasi Kas Utama, Persetujuan Dispensasi, Mutasi Likuiditas, & Pengawasan Akuntansi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMutasiModalOpen(true)}
            className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <ArrowRightLeft size={16} /> Buat Mutasi Kas Kabag
          </button>
          <Link
            href="/sikeu/approval"
            className="btn btn-secondary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={16} /> Portal Approval ({pendingDispensasi.length + pendingMutasi.length + pendingOperasional.length})
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

      {/* METRICS CARDS KHUSUS KABAG KEUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Saldo Kas Utama Kabag</span>
            <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">Rp 383.000.000</div>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Surplus Tersedia untuk Mutasi</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl">
            <Wallet size={24} />
          </div>
        </div>

        <div className="card p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Pengajuan Menunggu Persetujuan Kabag</span>
            <div className="text-2xl font-mono font-extrabold text-amber-900 mt-1">
              {pendingDispensasi.length + pendingMutasi.length + pendingOperasional.length} Item Pending
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Membutuhkan Keputusan Kabag</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="card p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">Total Mutasi Kas Ter-Otorisasi</span>
            <div className="text-2xl font-mono font-extrabold text-indigo-900 mt-1">Rp 60.000.000</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bulan Ini (2 Transaksi Mutasi)</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
            <ArrowRightLeft size={24} />
          </div>
        </div>
      </div>

      {/* TAB SUB-NAVIGASI OTORITAS KABAG */}
      <div className="card p-6 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'approval'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck size={16} /> 1. Otorisasi Approval ({pendingDispensasi.length + pendingMutasi.length + pendingOperasional.length})
          </button>
          <button
            onClick={() => setActiveTab('kas-utama')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'kas-utama'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Wallet size={16} /> 2. Kas Utama Kabag & Mutasi Unit
          </button>
          <button
            onClick={() => setActiveTab('akuntansi')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'akuntansi'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen size={16} /> 3. Pengawasan Akuntansi & Jurnal Umum
          </button>
        </div>

        {/* CONTENT TAB 1: OTORISASI APPROVAL KABAG */}
        {activeTab === 'approval' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Antrean Perizinan & Otorisasi Keputusan Kabag Keuangan</h2>
                <p className="text-xs text-slate-500">Pilih setujui atau tolak untuk memproses status dispensasi, mutasi kas, dan pengeluaran operasional</p>
              </div>
            </div>

            {/* SEKSI 1: DISPENSASI PEMBAYARAN MAHASISWA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <User size={16} className="text-amber-600" /> Permohonan Dispensasi Pembayaran Mahasiswa ({pendingDispensasi.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {pendingDispensasi.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-slate-900">{d.mhs}</div>
                      <div className="text-[11px] text-slate-600 font-semibold">{d.prodi} • {d.tipe}</div>
                      <div className="text-[11px] text-slate-500 italic mt-0.5">&ldquo;{d.alasan}&rdquo;</div>
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <div className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(d.nominal)}</div>
                      <button
                        onClick={() => setModalAction({ id: d.id, title: `Dispensasi ${d.mhs}`, type: 'dispensasi' })}
                        className="btn btn-secondary btn-xs font-bold border-none"
                      >
                        Proses Keputusan &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEKSI 2: PERIZINAN MUTASI KAS UNTUK KABAG */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary-950 flex items-center gap-1.5">
                  <ArrowRightLeft size={16} className="text-slate-700" /> Permohonan Mutasi Kas Antar Unit ({pendingMutasi.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {pendingMutasi.map((k) => (
                  <div key={k.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-primary-900">{k.kode}</div>
                      <div className="text-[11px] text-slate-700 font-bold">{k.dari} &rarr; {k.ke}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{k.alasan}</div>
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <div className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(k.nominal)}</div>
                      <button
                        onClick={() => setModalAction({ id: k.id, title: `Mutasi Kas ${k.kode}`, type: 'mutasi' })}
                        className="btn btn-primary btn-xs font-bold border-none"
                      >
                        Setujui Mutasi &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB 2: KAS UTAMA KABAG & MUTASI UNIT */}
        {activeTab === 'kas-utama' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Kas Utama Kabag Keuangan & Unit Kas Kampus</h2>
                <p className="text-xs text-slate-500">Daftar saldo unit kas aktif & fasilitas mutasi likuiditas dana institusi</p>
              </div>
              <button
                onClick={() => setIsMutasiModalOpen(true)}
                className="btn btn-primary btn-xs font-bold border-none"
              >
                + Buat Mutasi Kas Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-primary-900">Kas Utama Kabag Keuangan</div>
                <div className="text-xl font-mono font-extrabold text-primary-950">Rp 383.000.000</div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">KAS UTAMA INSTANSI</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Kas Bank BNI Kampus</div>
                <div className="text-xl font-mono font-extrabold text-slate-900">Rp 125.000.000</div>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">BANK PENAMPUNG VA</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Kas Operasional SPMB</div>
                <div className="text-xl font-mono font-extrabold text-slate-900">Rp 15.000.000</div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">KAS TUNAI LOKET</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB 3: PENGAWASAN AKUNTANSI & JURNAL UMUM */}
        {activeTab === 'akuntansi' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Pengawasan Jurnal Akuntansi & Balanced Ledger</h2>
                <p className="text-xs text-slate-500">Pencatatan otomatis jurnal debet & kredit dari transaksi yang disetujui Kabag</p>
              </div>
              <Link href="/sikeu/akuntansi" className="btn btn-secondary btn-xs font-bold border-none">
                Buka Portal Akuntansi Lengkap &rarr;
              </Link>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
              ✨ <strong>Sistem Balanced Journal (100% Synced)</strong>: Setiap pembayaran UKT, mutasi unit kas, maupun pengeluaran operasional yang disetujui Kabag secara otomatis terposting ke Jurnal Umum dengan perimbangan Debet & Kredit seimbang.
            </div>
          </div>
        )}
      </div>

      {/* MODAL HASIL OTORISASI DECISION KABAG */}
      {modalAction && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <h3 className="text-base font-extrabold text-slate-900">Otorisasi Kabag Keuangan: {modalAction.title}</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Instruksi Kabag Keuangan (Opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau dispensasi..."
                className="textarea textarea-sm w-full"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setModalAction(null)} className="btn btn-ghost btn-sm font-bold">Batal</button>
              <button
                onClick={handleApprove}
                className="btn btn-primary btn-sm font-bold border-none"
              >
                Setujui & Terbitkan Otorisasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT MUTASI KAS KABAG */}
      {isMutasiModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Form Mutasi Dana Kas Kabag Keuangan</h3>
              <button onClick={() => setIsMutasiModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateMutasi} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Kas Asal (Sumber Dana) *</label>
                <select
                  value={mutasiForm.unit_asal}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, unit_asal: e.target.value })}
                  className="select select-sm border-slate-300 w-full font-bold"
                >
                  <option value="Kas Utama Kabag Keuangan">Kas Utama Kabag Keuangan</option>
                  <option value="Kas Bank BNI Kampus">Kas Bank BNI Kampus</option>
                  <option value="Kas Bank Mandiri Payroll">Kas Bank Mandiri Payroll</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Kas Tujuan *</label>
                <select
                  value={mutasiForm.unit_tujuan}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, unit_tujuan: e.target.value })}
                  className="select select-sm border-slate-300 w-full font-bold"
                >
                  <option value="Kas Operasional SPMB">Kas Operasional SPMB</option>
                  <option value="Kas Operasional Laboratorium">Kas Operasional Laboratorium</option>
                  <option value="Kas Bank Mandiri Payroll">Kas Bank Mandiri Payroll</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Mutasi Dana (Rp) *</label>
                <input
                  type="number"
                  required
                  value={mutasiForm.nominal}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, nominal: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-mono font-extrabold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Peruntukan / Catatan Mutasi</label>
                <textarea
                  rows={2}
                  value={mutasiForm.peruntukan}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, peruntukan: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsMutasiModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold border-none">
                  Terbitkan Mutasi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
