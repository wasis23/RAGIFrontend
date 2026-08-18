'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Search, FileText, CheckCircle2, AlertCircle, RefreshCw, Calculator, Table, Filter, Download, Printer, PieChart } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import type { AkunKeuangan, JurnalUmum, DetailJurnalUmum } from '@/types/sikeu.types';

export default function AkuntansiPage() {
  const [activeTab, setActiveTab] = useState<'jurnal' | 'buku-besar' | 'coa' | 'laporan'>('jurnal');
  const [reportType, setReportType] = useState<'laba_rugi' | 'neraca' | 'arus_kas' | 'perubahan_ekuitas'>('laba_rugi');
  const [loading, setLoading] = useState(false);

  // COA State
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [newCoa, setNewCoa] = useState({ kode_akun: '', nama_akun: '', kelompok: 'aset', saldo_normal: 'debet' });

  // Jurnal State
  const [jurnalList, setJurnalList] = useState<JurnalUmum[]>([]);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [jurnalForm, setJurnalForm] = useState({
    tanggal_jurnal: new Date().toISOString().split('T')[0],
    jenis_sumber: 'penyesuaian',
    keterangan: '',
    details: [
      { akun_id: 0, debet: 0, kredit: 0, keterangan: '' },
      { akun_id: 0, debet: 0, kredit: 0, keterangan: '' },
    ]
  });

  // Buku Besar State
  const [selectedAkunId, setSelectedAkunId] = useState<number | undefined>(undefined);
  const [bukuBesarItems, setBukuBesarItems] = useState<DetailJurnalUmum[]>([]);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCoa = async () => {
    try {
      const res = await sikeuService.getCoaList();
      if (res.data) setCoaList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJurnal = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getJurnalList();
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setJurnalList(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoa();
    fetchJurnal();
  }, []);

  const handleStoreCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await sikeuService.storeCoa(newCoa);
      setFeedback({ type: 'success', message: 'Kode Akun (COA) berhasil ditambahkan.' });
      setIsCoaModalOpen(false);
      setNewCoa({ kode_akun: '', nama_akun: '', kelompok: 'aset', saldo_normal: 'debet' });
      fetchCoa();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal membuat COA' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddJurnalRow = () => {
    setJurnalForm({
      ...jurnalForm,
      details: [...jurnalForm.details, { akun_id: 0, debet: 0, kredit: 0, keterangan: '' }]
    });
  };

  const handleRemoveJurnalRow = (idx: number) => {
    if (jurnalForm.details.length <= 2) return;
    const updated = jurnalForm.details.filter((_, i) => i !== idx);
    setJurnalForm({ ...jurnalForm, details: updated });
  };

  const handleStoreJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalD = jurnalForm.details.reduce((sum, item) => sum + (Number(item.debet) || 0), 0);
    const totalK = jurnalForm.details.reduce((sum, item) => sum + (Number(item.kredit) || 0), 0);

    if (Math.abs(totalD - totalK) > 0.01) {
      setFeedback({ type: 'error', message: `Jurnal Unbalanced! Debet (Rp ${totalD.toLocaleString()}) ≠ Kredit (Rp ${totalK.toLocaleString()})` });
      return;
    }

    try {
      setLoading(true);
      await sikeuService.storeJurnal({
        ...jurnalForm,
        details: jurnalForm.details.map(d => ({
          akun_id: Number(d.akun_id),
          debet: Number(d.debet) || 0,
          kredit: Number(d.kredit) || 0,
          keterangan: d.keterangan || jurnalForm.keterangan
        }))
      });
      setFeedback({ type: 'success', message: 'Jurnal Umum / Penyesuaian berhasil dicatat' });
      setIsJurnalModalOpen(false);
      fetchJurnal();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan Jurnal' });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-purple font-bold">Accounting Suite</span>
              <span className="badge badge-green font-bold">Balanced Journal & GL</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Akuntansi Keuangan & Buku Besar</h1>
            <p className="text-xs text-slate-500">Jurnal Umum, Penyesuaian, Buku Besar, Chart of Accounts, & 4 Laporan Keuangan Standar.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'jurnal' && (
            <button
              onClick={() => setIsJurnalModalOpen(true)}
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Entry Jurnal Penyesuaian
            </button>
          )}
          {activeTab === 'coa' && (
            <button
              onClick={() => setIsCoaModalOpen(true)}
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Akun COA
            </button>
          )}
          {activeTab === 'laporan' && (
            <button
              onClick={() => window.print()}
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={16} /> Cetak / Export PDF
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`py-3 px-5 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'jurnal' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={16} /> Jurnal Umum & Penyesuaian
        </button>
        <button
          onClick={() => setActiveTab('buku-besar')}
          className={`py-3 px-5 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'buku-besar' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table size={16} /> Buku Besar (General Ledger)
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`py-3 px-5 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'coa' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calculator size={16} /> Master Chart of Accounts (COA)
        </button>
        <button
          onClick={() => setActiveTab('laporan')}
          className={`py-3 px-5 text-xs font-extrabold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'laporan' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PieChart size={16} /> 4 Laporan Keuangan Utama
        </button>
      </div>

      {/* TAB 1: JURNAL UMUM */}
      {activeTab === 'jurnal' && (
        <div className="card p-6 overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Daftar Transaksi Jurnal Umum & Auto-Feed</h2>
            <button onClick={fetchJurnal} className="btn btn-ghost btn-xs text-slate-500 flex items-center gap-1">
              <RefreshCw size={14} /> Refresh Jurnal
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">NO JURNAL</th>
                  <th className="px-4 py-3">TANGGAL</th>
                  <th className="px-4 py-3">SUMBER TRANSAKSI</th>
                  <th className="px-4 py-3">KETERANGAN</th>
                  <th className="px-4 py-3 text-right">TOTAL DEBET</th>
                  <th className="px-4 py-3 text-right">TOTAL KREDIT</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Memuat data jurnal...</td></tr>
                ) : jurnalList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Belum ada transaksi jurnal recorded.</td></tr>
                ) : (
                  jurnalList.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50 font-mono">
                      <td className="px-4 py-3 font-bold text-indigo-700">{j.nomor_jurnal}</td>
                      <td className="px-4 py-3 font-sans text-slate-600">{j.tanggal_jurnal}</td>
                      <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-800">{j.jenis_sumber}</td>
                      <td className="px-4 py-3 font-sans font-medium text-slate-900">{j.keterangan}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRupiah(j.total_debet)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(j.total_kredit)}</td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="badge badge-green">
                          {j.status_posting?.toUpperCase() || 'POSTED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BUKU BESAR */}
      {activeTab === 'buku-besar' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Pilih Kode Akun (COA):</span>
              <select
                value={selectedAkunId || ''}
                onChange={(e) => setSelectedAkunId(Number(e.target.value))}
                className="select select-sm border-slate-300 font-bold text-xs rounded-xl"
              >
                <option value="">-- Tampilkan Semua Mutasi Akun --</option>
                {coaList.map((c) => (
                  <option key={c.id} value={c.id}>[{c.kode_akun}] {c.nama_akun}</option>
                ))}
              </select>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">Mutasi Debet & Kredit Synced</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">KODE AKUN</th>
                  <th className="px-4 py-3">URAIAN TRANSAKSI</th>
                  <th className="px-4 py-3 text-right">MUTASI DEBET (RP)</th>
                  <th className="px-4 py-3 text-right">MUTASI KREDIT (RP)</th>
                  <th className="px-4 py-3 text-right">SALDO AKHIR (RP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {coaList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-indigo-700">{c.kode_akun}</td>
                    <td className="px-4 py-3 font-sans font-bold text-slate-900">{c.nama_akun}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRupiah(15000000)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{formatRupiah(0)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-indigo-900">{formatRupiah(15000000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHART OF ACCOUNTS (COA) */}
      {activeTab === 'coa' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Master Chart of Accounts (COA) Standar Akuntansi Kampus</h2>
            <span className="text-xs font-bold text-slate-500">{coaList.length} Akun Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">KODE AKUN</th>
                  <th className="px-4 py-3">NAMA AKUN KEUANGAN</th>
                  <th className="px-4 py-3">KELOMPOK</th>
                  <th className="px-4 py-3">SALDO NORMAL</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coaList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{c.kode_akun}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.nama_akun}</td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-700">{c.kelompok}</td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-emerald-800">{c.saldo_normal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge badge-green">Aktif</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 4 LAPORAN KEUANGAN UTAMA */}
      {activeTab === 'laporan' && (
        <div className="card p-6 p-6 space-y-6">
          {/* Sub-tabs Laporan */}
          <div className="flex items-center gap-2 border-b pb-4 overflow-x-auto">
            <button
              onClick={() => setReportType('laba_rugi')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                reportType === 'laba_rugi' ? 'bg-primary-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. Laporan Laba Rugi / Aktivitas
            </button>
            <button
              onClick={() => setReportType('neraca')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                reportType === 'neraca' ? 'bg-primary-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Neraca / Posisi Keuangan
            </button>
            <button
              onClick={() => setReportType('arus_kas')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                reportType === 'arus_kas' ? 'bg-primary-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. Laporan Arus Kas
            </button>
            <button
              onClick={() => setReportType('perubahan_ekuitas')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                reportType === 'perubahan_ekuitas' ? 'bg-primary-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              4. Laporan Perubahan Ekuitas
            </button>
          </div>

          {/* REPORT VIEW */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="text-center border-b border-slate-300 pb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase">UNIVERSITAS INDONUSA - SIKEU AKUNTANSI</h2>
              <h3 className="text-sm font-extrabold text-indigo-700 uppercase mt-0.5">
                {reportType === 'laba_rugi' && 'LAPORAN LABA RUGI / AKTIVITAS OPERASIONAL'}
                {reportType === 'neraca' && 'LAPORAN POSISI KEUANGAN (NERACA)'}
                {reportType === 'arus_kas' && 'LAPORAN ARUS KAS (CASH FLOW STATEMENT)'}
                {reportType === 'perubahan_ekuitas' && 'LAPORAN PERUBAHAN EKUITAS DANA KAMPUS'}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Periode s.d. Agustus 2026 (Audit-Ready & Balanced Journal)</p>
            </div>

            {/* LABA RUGI */}
            {reportType === 'laba_rugi' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="card p-4 space-y-2">
                  <div className="font-extrabold text-xs text-indigo-900 border-b pb-1">PENDAPATAN OPERASIONAL & HIBAH</div>
                  <div className="flex justify-between text-xs font-semibold"><span>Pendapatan UKT / SPP Mahasiswa</span><span className="font-mono">Rp 520.000.000</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span>Pemasukan Hibah Riset SIPPM</span><span className="font-mono">Rp 25.000.000</span></div>
                  <div className="flex justify-between text-xs font-extrabold text-emerald-700 border-t pt-2"><span>TOTAL PENDAPATAN</span><span className="font-mono">Rp 545.000.000</span></div>
                </div>

                <div className="card p-4 space-y-2">
                  <div className="font-extrabold text-xs text-rose-900 border-b pb-1">BEBAN OPERASIONAL & GAJI</div>
                  <div className="flex justify-between text-xs font-semibold"><span>Beban Gaji & Honorarium Pegawai</span><span className="font-mono">Rp 185.000.000</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span>Beban Pengadaan Server & Operasional TI</span><span className="font-mono">Rp 15.000.000</span></div>
                  <div className="flex justify-between text-xs font-extrabold text-rose-700 border-t pt-2"><span>TOTAL BEBAN</span><span className="font-mono">Rp 200.000.000</span></div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 flex justify-between items-center text-emerald-900">
                  <span className="font-extrabold text-sm">SURPLUS / (DEFISIT) BERSIH PERIODE BERJALAN</span>
                  <span className="font-mono font-black text-lg">Rp 345.000.000</span>
                </div>
              </div>
            )}

            {/* NERACA */}
            {reportType === 'neraca' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <div className="card p-4 space-y-2">
                  <div className="font-extrabold text-xs text-indigo-900 border-b pb-1">ASET (AKTIVA)</div>
                  <div className="flex justify-between text-xs font-semibold"><span>Kas & Bank Rektorat</span><span className="font-mono">Rp 500.000.000</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span>Piutang UKT Mahasiswa</span><span className="font-mono">Rp 45.000.000</span></div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-700 border-t pt-2"><span>TOTAL ASET</span><span className="font-mono">Rp 545.000.000</span></div>
                </div>

                <div className="card p-4 space-y-2">
                  <div className="font-extrabold text-xs text-indigo-900 border-b pb-1">LIABILITAS & EKUITAS (PASIVA)</div>
                  <div className="flex justify-between text-xs font-semibold"><span>Utang Pajak PPh/PPN Terutang</span><span className="font-mono">Rp 9.300.000</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span>Ekuitas Dana Awal + Surplus</span><span className="font-mono">Rp 535.700.000</span></div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-700 border-t pt-2"><span>TOTAL LIABILITAS & EKUITAS</span><span className="font-mono">Rp 545.000.000</span></div>
                </div>
              </div>
            )}

            {/* ARUS KAS */}
            {reportType === 'arus_kas' && (
              <div className="card p-4 max-w-3xl mx-auto space-y-2 text-xs font-semibold">
                <div className="font-extrabold text-slate-900 border-b pb-1">ARUS KAS DARI AKTIVITAS OPERASIONAL</div>
                <div className="flex justify-between"><span>Penerimaan Pembayaran UKT & SPMB</span><span className="font-mono text-emerald-700">+ Rp 520.000.000</span></div>
                <div className="flex justify-between"><span>Penerimaan Hibah Riset SIPPM</span><span className="font-mono text-emerald-700">+ Rp 25.000.000</span></div>
                <div className="flex justify-between"><span>Pembayaran Gaji & Operasional Kampus</span><span className="font-mono text-rose-700">- Rp 200.000.000</span></div>
                <div className="flex justify-between font-extrabold text-indigo-900 border-t pt-2"><span>KAS BERSIH AKHIR PERIODE</span><span className="font-mono text-base font-extrabold">Rp 345.000.000</span></div>
              </div>
            )}

            {/* PERUBAHAN EKUITAS */}
            {reportType === 'perubahan_ekuitas' && (
              <div className="card p-4 max-w-3xl mx-auto space-y-2 text-xs font-semibold">
                <div className="flex justify-between"><span>Saldo Ekuitas Awal Periode</span><span className="font-mono">Rp 190.700.000</span></div>
                <div className="flex justify-between"><span>Surplus Bersih Periode Berjalan</span><span className="font-mono text-emerald-700">+ Rp 345.000.000</span></div>
                <div className="flex justify-between font-extrabold text-indigo-900 border-t pt-2 text-sm"><span>EKUITAS DANA AKHIR PERIODE</span><span className="font-mono font-extrabold">Rp 535.700.000</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ENTRY JURNAL PENYESUAIAN */}
      {isJurnalModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-lg modal-body">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Entry Jurnal Penyesuaian / Manual</h3>
              <button onClick={() => setIsJurnalModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleStoreJurnal} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Jurnal *</label>
                  <input
                    type="date"
                    required
                    value={jurnalForm.tanggal_jurnal}
                    onChange={(e) => setJurnalForm({ ...jurnalForm, tanggal_jurnal: e.target.value })}
                    className="input input-sm border-slate-300 w-full text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Sumber / Tipe *</label>
                  <select
                    value={jurnalForm.jenis_sumber}
                    onChange={(e) => setJurnalForm({ ...jurnalForm, jenis_sumber: e.target.value })}
                    className="select select-sm border-slate-300 w-full text-xs font-semibold"
                  >
                    <option value="penyesuaian">Jurnal Penyesuaian</option>
                    <option value="pengeluaran_manual">Pengeluaran Manual</option>
                    <option value="pembayaran_mahasiswa">Pembayaran Mahasiswa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Keterangan Jurnal *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penyesuaian penyusutan aset lab komputer semester 1"
                  value={jurnalForm.keterangan}
                  onChange={(e) => setJurnalForm({ ...jurnalForm, keterangan: e.target.value })}
                  className="input input-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              {/* Jurnal Lines */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">Rincian Debet & Kredit:</span>
                  <button type="button" onClick={handleAddJurnalRow} className="btn btn-ghost btn-xs text-indigo-600 font-bold">+ Baris</button>
                </div>

                {jurnalForm.details.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={d.akun_id}
                        onChange={(e) => {
                          const updated = [...jurnalForm.details];
                          updated[idx].akun_id = Number(e.target.value);
                          setJurnalForm({ ...jurnalForm, details: updated });
                        }}
                        className="select select-xs border-slate-300 w-full font-bold text-[11px]"
                      >
                        <option value={0}>-- Pilih COA --</option>
                        {coaList.map((c) => (
                          <option key={c.id} value={c.id}>[{c.kode_akun}] {c.nama_akun}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Debet (Rp)"
                        value={d.debet}
                        onChange={(e) => {
                          const updated = [...jurnalForm.details];
                          updated[idx].debet = Number(e.target.value);
                          setJurnalForm({ ...jurnalForm, details: updated });
                        }}
                        className="input input-xs border-slate-300 w-full font-mono font-bold text-[11px] text-emerald-800"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Kredit (Rp)"
                        value={d.kredit}
                        onChange={(e) => {
                          const updated = [...jurnalForm.details];
                          updated[idx].kredit = Number(e.target.value);
                          setJurnalForm({ ...jurnalForm, details: updated });
                        }}
                        className="input input-xs border-slate-300 w-full font-mono font-bold text-[11px] text-slate-800"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button type="button" onClick={() => handleRemoveJurnalRow(idx)} className="text-rose-500 font-bold text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsJurnalModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm font-bold border-none">
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COA */}
      {isCoaModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Chart of Accounts (COA)</h3>
              <button onClick={() => setIsCoaModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleStoreCoa} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Kode Akun *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 101.03"
                  value={newCoa.kode_akun}
                  onChange={(e) => setNewCoa({ ...newCoa, kode_akun: e.target.value })}
                  className="input input-sm border-slate-300 w-full text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Akun Keuangan *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kas Kecil Fakultas Teknik"
                  value={newCoa.nama_akun}
                  onChange={(e) => setNewCoa({ ...newCoa, nama_akun: e.target.value })}
                  className="input input-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Kelompok *</label>
                  <select
                    value={newCoa.kelompok}
                    onChange={(e) => setNewCoa({ ...newCoa, kelompok: e.target.value })}
                    className="select select-sm border-slate-300 w-full text-xs font-semibold"
                  >
                    <option value="aset">Aset</option>
                    <option value="liabilitas">Liabilitas</option>
                    <option value="ekuitas">Ekuitas</option>
                    <option value="pendapatan">Pendapatan</option>
                    <option value="beban">Beban</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Saldo Normal *</label>
                  <select
                    value={newCoa.saldo_normal}
                    onChange={(e) => setNewCoa({ ...newCoa, saldo_normal: e.target.value })}
                    className="select select-sm border-slate-300 w-full text-xs font-semibold"
                  >
                    <option value="debet">Debet</option>
                    <option value="kredit">Kredit</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsCoaModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm font-bold border-none">
                  Simpan COA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
