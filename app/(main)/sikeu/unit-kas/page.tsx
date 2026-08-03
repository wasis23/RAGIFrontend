'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, DollarSign, CheckCircle, ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function UnitKasPage() {
  const [kasList] = useState([
    { id: 1, nama: 'Kas Kabag Keuangan (Kas Utama Kabag)', saldoAwal: 500000000, saldoSaatIni: 883000000, pj: 'Kabag Keuangan', deskripsi: 'Kas Utama Operasional & Verifikasi Bagian Keuangan', isKabag: true, status: true },
    { id: 2, nama: 'Petty Cash Fakultas Teknik & TIK', saldoAwal: 10000000, saldoSaatIni: 10000000, pj: 'Kabag TU FTIK', deskripsi: 'Kas operasional kecil fakultas', isKabag: false, status: true },
    { id: 3, nama: 'Petty Cash Fakultas Ekonomi & Bisnis', saldoAwal: 15000000, saldoSaatIni: 12500000, pj: 'Kasir FEB', deskripsi: 'Kas operasional harian FEB', isKabag: false, status: true },
  ]);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    ke_kas_id: 1,
    nominal: 5000000,
    keterangan: 'Penyetoran mutasi pendapatan unit ke Kas Kabag Keuangan',
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-purple font-bold">Kas Unit & Treasury</span>
              <span className="badge badge-amber font-bold">Akses Kabag Keuangan</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Pengelolaan Kas Unit & Kas Kabag Keuangan</h1>
            <p className="text-xs text-slate-500">
              Monitoring saldo kas utama Kabag Keuangan, petty cash fakultas, & mutasi penyetoran antar unit kas.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <ArrowUpRight size={16} /> Mutasi ke Kas Kabag
        </button>
      </div>

      {/* Kas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kasList.map((k) => (
          <div
            key={k.id}
            className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-all ${
              k.isKabag
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700'
                : 'bg-white border-slate-100 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-extrabold tracking-wide ${k.isKabag ? 'text-amber-400 flex items-center gap-1' : 'text-indigo-700'}`}>
                {k.isKabag && <ShieldCheck size={16} />} {k.nama}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                k.isKabag ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {k.isKabag ? 'KAS UTAMA KABAG' : 'PETTY CASH'}
              </span>
            </div>

            <div>
              <div className={`text-xs ${k.isKabag ? 'text-slate-300' : 'text-slate-500'}`}>Saldo Tersedia:</div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${k.isKabag ? 'text-emerald-400' : 'text-slate-900'}`}>
                {formatRupiah(k.saldoSaatIni)}
              </div>
            </div>

            <div className={`text-xs border-t pt-3 space-y-1 ${k.isKabag ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
              <div>Penanggung Jawab: <strong className={k.isKabag ? 'text-white' : 'text-slate-800'}>{k.pj}</strong></div>
              <div>Saldo Awal: {formatRupiah(k.saldoAwal)}</div>
              <div className="text-[11px] italic">{k.deskripsi}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL MUTASI KAS KABAG */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Wallet size={18} className="text-indigo-600" /> Mutasi Penyetoran ke Kas Kabag Keuangan
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Mutasi penyetoran dana ke Kas Kabag Keuangan berhasil dicatat.');
                setIsTransferModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-700">Tujuan Kas Utama *</label>
                <select className="select select-sm border-slate-300 w-full font-bold text-xs" readOnly>
                  <option value={1}>Kas Kabag Keuangan (Kas Utama Kabag)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nominal Penyetoran (Rp) *</label>
                <input
                  type="number"
                  required
                  value={transferForm.nominal}
                  onChange={(e) => setTransferForm({ ...transferForm, nominal: Number(e.target.value) })}
                  className="input input-sm border-slate-300 w-full font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Keterangan Mutasi *</label>
                <textarea
                  required
                  rows={3}
                  value={transferForm.keterangan}
                  onChange={(e) => setTransferForm({ ...transferForm, keterangan: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
                  Proses Mutasi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
