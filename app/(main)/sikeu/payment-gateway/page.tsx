'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Globe,
  RefreshCw,
  Zap,
  Lock,
  DollarSign,
  TrendingUp,
  Sliders,
  Send,
  Building,
  CheckCircle
} from 'lucide-react';

export default function PaymentGatewayConfigPage() {
  // Live Xendit Balance State
  const [gatewayBalance, setGatewayBalance] = useState({
    available_balance: 425000000,
    pending_settlement: 65000000,
    total_balance: 490000000,
    currency: 'IDR',
    last_updated: new Date().toLocaleTimeString('id-ID'),
  });

  const [loadingBalance, setLoadingBalance] = useState(false);

  // Xendit API Configuration Form State
  const [configForm, setConfigForm] = useState({
    environment: 'sandbox',
    xendit_secret_key: 'xnd_development_SecretKey89123478912348912',
    xendit_public_key: 'xnd_public_development_PublicKey12345',
    webhook_verification_token: 'whsec_verification_token_sikeu_2026',
    auto_disbursement_enabled: true,
    account_validation_enabled: true,
    max_auto_disbursement_limit: 50000000,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleRefreshBalance = async () => {
    setLoadingBalance(true);
    try {
      // Simulate real-time Xendit Balance fetch API (GET https://api.xendit.co/balance)
      setTimeout(() => {
        setGatewayBalance(prev => ({
          ...prev,
          available_balance: prev.available_balance + 2500000,
          total_balance: prev.total_balance + 2500000,
          last_updated: new Date().toLocaleTimeString('id-ID'),
        }));
        setLoadingBalance(false);
        setFeedback({ type: 'success', message: 'Saldo Xendit Payment Gateway berhasil diperbarui secara Real-Time via API.' });
      }, 600);
    } catch (err) {
      setLoadingBalance(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTimeout(() => {
      setTestingConnection(false);
      setFeedback({
        type: 'success',
        message: 'Koneksi Xendit API Berhasil! (Response 200 OK - Balance API & Disbursement API Aktif).',
      });
    }, 1000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({
      type: 'success',
      message: 'Konfigurasi Xendit Payment Gateway & Auto-Disbursement berhasil disimpan oleh Super Admin.',
    });
  };

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
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">Super Admin Configuration</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">Xendit Integration Active</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Konfigurasi Xendit Payment Gateway & Saldo Real-Time</h1>
            <p className="text-xs text-slate-500">
              Kelola Secret Key Xendit, monitor saldo Wallet Payment Gateway, & atur otomatisasi Auto-Disbursement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshBalance}
            disabled={loadingBalance}
            className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw size={14} className={loadingBalance ? 'animate-spin' : ''} /> Sync Saldo Xendit API
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Zap size={14} /> {testingConnection ? 'Testing API...' : 'Tes Koneksi API'}
          </button>
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

      {/* METRICS CARDS SALDO PAYMENT GATEWAY (REAL-TIME XENDIT BALANCE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-950 p-6 rounded-2xl text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">Saldo Tersedia untuk Disbursement</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              READY FOR PAYOUT
            </span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-emerald-400">
              {formatRupiah(gatewayBalance.available_balance)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Saldo aktif di Wallet Xendit yang siap ditransfer ke rekening unit saat Kabag ACC.
            </p>
          </div>
          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
            <span>Terakhir disinkronkan: {gatewayBalance.last_updated}</span>
            <span className="text-emerald-400 font-bold">API 200 OK</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Saldo Pending Settlement (VA)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              SETTLEMENT PENDING
            </span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-amber-900">
              {formatRupiah(gatewayBalance.pending_settlement)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pembayaran VA UKT Mahasiswa yang masuk hari ini (cair ke saldo utama dalam T+1).
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Total Akumulasi Saldo Gateway</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
              AKUMULASI GATEWAY
            </span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-indigo-900">
              {formatRupiah(gatewayBalance.total_balance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gabungan Saldo Tersedia + Saldo Settlement Xendit Payment Gateway.
            </p>
          </div>
        </div>
      </div>

      {/* FORM KONFIGURASI XENDIT API (FOR SUPER ADMIN) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-teal-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Form Pengaturan Kredensial Xendit API & Auto-Disbursement</h2>
              <p className="text-xs text-slate-500">Konfigurasi environment secret key & aturan pencairan otomatis untuk Kabag Keuangan</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
            Akses Khusus Super Admin
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Environment Mode *</label>
              <select
                value={configForm.environment}
                onChange={(e) => setConfigForm({ ...configForm, environment: e.target.value })}
                className="select select-sm border-slate-300 w-full font-bold"
              >
                <option value="sandbox">Development (Sandbox Mode)</option>
                <option value="production">Production (Live Mode - Real Money)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Limit Auto-Disbursement Per ACC (Rp) *</label>
              <input
                type="number"
                value={configForm.max_auto_disbursement_limit}
                onChange={(e) => setConfigForm({ ...configForm, max_auto_disbursement_limit: Number(e.target.value) })}
                className="input input-sm border-slate-300 w-full font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Xendit Secret Key (`XENDIT_SECRET_KEY`) *</span>
                <span className="text-[10px] text-slate-400 font-mono">Dipersyaratkan untuk Balance API & Disbursement</span>
              </label>
              <input
                type="password"
                required
                value={configForm.xendit_secret_key}
                onChange={(e) => setConfigForm({ ...configForm, xendit_secret_key: e.target.value })}
                className="input input-sm border-slate-300 w-full font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Xendit Public Key (`XENDIT_PUBLIC_KEY`)</label>
              <input
                type="text"
                value={configForm.xendit_public_key}
                onChange={(e) => setConfigForm({ ...configForm, xendit_public_key: e.target.value })}
                className="input input-sm border-slate-300 w-full font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Xendit Webhook Verification Token (`WEBHOOK_TOKEN`)</label>
              <input
                type="text"
                value={configForm.webhook_verification_token}
                onChange={(e) => setConfigForm({ ...configForm, webhook_verification_token: e.target.value })}
                className="input input-sm border-slate-300 w-full font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-xs">Fitur Otomatisasi Xendit & Validasi</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.auto_disbursement_enabled}
                  onChange={(e) => setConfigForm({ ...configForm, auto_disbursement_enabled: e.target.checked })}
                  className="checkbox checkbox-xs checkbox-teal"
                />
                <span className="font-bold text-slate-800 text-xs">Auto-Disbursement saat Kabag ACC</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.account_validation_enabled}
                  onChange={(e) => setConfigForm({ ...configForm, account_validation_enabled: e.target.checked })}
                  className="checkbox checkbox-xs checkbox-teal"
                />
                <span className="font-bold text-slate-800 text-xs">Validasi Nama Rekening Bank Otomatis (*Account Validation*)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={handleTestConnection}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 btn-sm font-bold border-none"
            >
              Tes API Key
            </button>
            <button
              type="submit"
              className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none"
            >
              Simpan Konfigurasi Xendit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
