'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, PieChart, TrendingUp, DollarSign, Layers } from 'lucide-react';

export default function LaporanKeuanganPage() {
  const [activeTab, setActiveTab] = useState<'laba_rugi' | 'neraca' | 'arus_kas' | 'ekuitas'>('laba_rugi');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Portal 4 Laporan Keuangan Utama</h1>
            <p className="text-xs text-gray-500">Laporan Laba Rugi, Neraca Posisi Keuangan, Arus Kas, & Laporan Perubahan Ekuitas Kampus</p>
          </div>
        </div>
        <button
          onClick={() => alert('Fitur unduh Laporan PDF/Excel sedang disiapkan.')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Download size={16} /> Unduh Laporan (PDF)
        </button>
      </div>

      {/* Financial Statement Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 pt-3 rounded-t-xl">
        <button
          onClick={() => setActiveTab('laba_rugi')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'laba_rugi' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={16} /> 1. Laba Rugi / Aktivitas
        </button>
        <button
          onClick={() => setActiveTab('neraca')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'neraca' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart size={16} /> 2. Neraca / Posisi Keuangan
        </button>
        <button
          onClick={() => setActiveTab('arus_kas')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'arus_kas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign size={16} /> 3. Laporan Arus Kas
        </button>
        <button
          onClick={() => setActiveTab('ekuitas')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ekuitas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} /> 4. Perubahan Ekuitas
        </button>
      </div>

      {/* Tab Content 1: Laba Rugi */}
      {activeTab === 'laba_rugi' && (
        <div className="bg-white p-6 rounded-b-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">Laporan Aktivitas & Laba Rugi (Periode Agustus 2026)</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-emerald-700 uppercase text-xs tracking-wider mb-2">I. PENDAPATAN OPERASIONAL</h3>
              <div className="space-y-1.5 pl-4">
                <div className="flex justify-between"><span>Pendapatan UKT / SPP Mahasiswa</span><span className="font-mono">Rp 500.000.000</span></div>
                <div className="flex justify-between"><span>Pendapatan Hibah Riset & PkM (SIPPM)</span><span className="font-mono">Rp 25.000.000</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>TOTAL PENDAPATAN</span><span className="font-mono text-emerald-700">Rp 525.000.000</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-rose-700 uppercase text-xs tracking-wider mb-2">II. BEBAN OPERASIONAL</h3>
              <div className="space-y-1.5 pl-4">
                <div className="flex justify-between"><span>Beban Gaji & Honorarium Pegawai</span><span className="font-mono">Rp 85.000.000</span></div>
                <div className="flex justify-between"><span>Beban Operasional Listrik & Internet</span><span className="font-mono">Rp 22.000.000</span></div>
                <div className="flex justify-between"><span>Beban Pemeliharaan Sarana</span><span className="font-mono">Rp 35.000.000</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>TOTAL BEBAN</span><span className="font-mono text-rose-700">Rp 142.000.000</span></div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center font-bold text-indigo-900 text-base">
              <span>SURPLUS / LABA OPERASIONAL</span>
              <span className="font-mono text-xl">Rp 383.000.000</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Neraca */}
      {activeTab === 'neraca' && (
        <div className="bg-white p-6 rounded-b-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">Laporan Posisi Keuangan / Neraca (Per 31 Agustus 2026)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* ASET */}
            <div className="space-y-3">
              <h3 className="font-semibold text-indigo-700 uppercase text-xs tracking-wider border-b pb-1">ASET (AKTIVA)</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Kas & Bank Kampus</span><span className="font-mono">Rp 383.000.000</span></div>
                <div className="flex justify-between"><span>Piutang UKT Mahasiswa</span><span className="font-mono">Rp 45.000.000</span></div>
                <div className="flex justify-between"><span>Aset Tetap Gedung & Peralatan</span><span className="font-mono">Rp 1.250.000.000</span></div>
                <div className="flex justify-between font-bold border-t pt-2 text-indigo-900">
                  <span>TOTAL ASET</span>
                  <span className="font-mono">Rp 1.678.000.000</span>
                </div>
              </div>
            </div>

            {/* LIABILITAS & EKUITAS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-700 uppercase text-xs tracking-wider border-b pb-1">LIABILITAS & EKUITAS (PASIVA)</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Utang Pajak PPh/PPN Terutang</span><span className="font-mono">Rp 12.500.000</span></div>
                <div className="flex justify-between"><span>Ekuitas Dana Terikat Institusi</span><span className="font-mono">Rp 1.282.500.000</span></div>
                <div className="flex justify-between"><span>Surplus Laba Tahun Berjalan</span><span className="font-mono">Rp 383.000.000</span></div>
                <div className="flex justify-between font-bold border-t pt-2 text-purple-900">
                  <span>TOTAL LIABILITAS & EKUITAS</span>
                  <span className="font-mono">Rp 1.678.000.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Arus Kas */}
      {activeTab === 'arus_kas' && (
        <div className="bg-white p-6 rounded-b-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">Laporan Arus Kas (Cash Flow Statement)</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Arus Kas dari Aktivitas Operasional</span><span className="font-mono text-emerald-700 font-bold">+ Rp 383.000.000</span></div>
            <div className="flex justify-between"><span>Arus Kas dari Aktivitas Investasi</span><span className="font-mono text-gray-500">Rp 0</span></div>
            <div className="flex justify-between"><span>Arus Kas dari Aktivitas Pendanaan</span><span className="font-mono text-gray-500">Rp 0</span></div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center font-bold text-emerald-900 text-base">
              <span>SALDO AKHIR KAS & EQUIVALENT</span>
              <span className="font-mono text-xl">Rp 383.000.000</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Ekuitas */}
      {activeTab === 'ekuitas' && (
        <div className="bg-white p-6 rounded-b-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">Laporan Perubahan Ekuitas Dana</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Saldo Ekuitas Awal Periode</span><span className="font-mono">Rp 1.282.500.000</span></div>
            <div className="flex justify-between text-emerald-700"><span>Surplus Laba Periode Berjalan</span><span className="font-mono font-bold">+ Rp 383.000.000</span></div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center font-bold text-purple-900 text-base">
              <span>SALDO EKUITAS AKHIR PERIODE</span>
              <span className="font-mono text-xl">Rp 1.665.500.000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
