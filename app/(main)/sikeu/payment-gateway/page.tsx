'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Sliders,
  Wallet
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function PaymentGatewayConfigPage() {
  const [activeTab, setActiveTab] = useState('xendit');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [gatewayBalance, setGatewayBalance] = useState({
    available_balance: 0,
    pending_settlement: 0,
    total_balance: 0,
    currency: 'IDR',
    last_updated: '-',
  });
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    handleRefreshBalance();
  }, [activeTab]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPaymentGateways();
      const configMap: Record<string, any> = {};
      if (res.data) {
        res.data.forEach((c: any) => {
          configMap[c.gateway_name.toLowerCase()] = {
            ...c,
            api_key: c.api_key_encrypted || '',
            public_key: c.public_key_encrypted || '',
            webhook_token: c.webhook_token_encrypted || ''
          };
        });
      }
      
      // Defaults if not exists in DB yet
      if (!configMap['xendit']) {
        configMap['xendit'] = {
          environment: 'sandbox',
          api_key: '',
          public_key: '',
          webhook_token: '',
          auto_disbursement_enabled: false,
          account_validation_enabled: false,
          max_disbursement_limit: 50000000,
          is_active: false
        };
      }
      if (!configMap['duitku']) {
        configMap['duitku'] = {
          environment: 'sandbox',
          api_key: '',
          public_key: '',
          webhook_token: '',
          auto_disbursement_enabled: false,
          account_validation_enabled: false,
          max_disbursement_limit: 50000000,
          is_active: false
        };
      }
      
      setConfigs(configMap);
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal mengambil konfigurasi: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await sikeuService.getPaymentGatewayBalance(activeTab);
      if (res.data) {
        setGatewayBalance(res.data);
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal sinkronisasi saldo: ' + error.message });
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = configs[activeTab];
      await sikeuService.updatePaymentGateway(activeTab.toLowerCase(), payload);
      setFeedback({
        type: 'success',
        message: `Konfigurasi ${activeTab.toUpperCase()} berhasil disimpan.`,
      });
      fetchConfigs(); // Refresh to ensure single active state is reflected
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal menyimpan: ' + error.message });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="p-10 text-center">Loading configurations...</div>;

  const currentConfig = configs[activeTab];

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
              {currentConfig.is_active && (
                 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">{activeTab.toUpperCase()} Active</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Konfigurasi Payment Gateway</h1>
            <p className="text-xs text-slate-500">
              Kelola API Key, pantau saldo Real-Time, & aktifkan salah satu Payment Gateway.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshBalance}
            disabled={loadingBalance}
            className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw size={14} className={loadingBalance ? 'animate-spin' : ''} /> Sync Saldo
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 gap-4 px-2">
        <button
          onClick={() => setActiveTab('xendit')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'xendit' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Xendit Gateway {configs['xendit']?.is_active && '🟢'}
        </button>
        <button
          onClick={() => setActiveTab('duitku')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'duitku' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Duitku Gateway {configs['duitku']?.is_active && '🟢'}
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-950 p-6 rounded-2xl text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">Saldo Tersedia ({activeTab.toUpperCase()})</span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-emerald-400">
              {formatRupiah(gatewayBalance.available_balance)}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
            <span>Terakhir disinkronkan: {gatewayBalance.last_updated}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Pending Settlement</span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-amber-900">
              {formatRupiah(gatewayBalance.pending_settlement)}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Total Akumulasi</span>
          </div>
          <div>
            <div className="text-3xl font-mono font-extrabold text-indigo-900">
              {formatRupiah(gatewayBalance.total_balance)}
            </div>
          </div>
        </div>
      </div>

      {/* FORM CONFIG */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-teal-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Form Pengaturan Kredensial {activeTab.toUpperCase()} API</h2>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
             <input
               type="checkbox"
               checked={currentConfig.is_active}
               onChange={(e) => handleFormChange('is_active', e.target.checked)}
               className="toggle toggle-sm toggle-success"
             />
             <span className="text-xs font-extrabold text-slate-700">Jadikan Gateway Utama (Aktif)</span>
          </label>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Environment Mode *</label>
              <select
                value={currentConfig.environment}
                onChange={(e) => handleFormChange('environment', e.target.value)}
                className="select select-sm border-slate-300 w-full font-bold"
              >
                <option value="sandbox">Development (Sandbox Mode)</option>
                <option value="production">Production (Live Mode - Real Money)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Limit Auto-Disbursement (Rp) *</label>
              <input
                type="number"
                value={currentConfig.max_disbursement_limit}
                onChange={(e) => handleFormChange('max_disbursement_limit', Number(e.target.value))}
                className="input input-sm border-slate-300 w-full font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">API / Secret Key *</label>
              <input
                type="password"
                required
                value={currentConfig.api_key}
                onChange={(e) => handleFormChange('api_key', e.target.value)}
                className="input input-sm border-slate-300 w-full font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Public Key / Merchant Code</label>
              <input
                type="text"
                value={currentConfig.public_key}
                onChange={(e) => handleFormChange('public_key', e.target.value)}
                className="input input-sm border-slate-300 w-full font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Webhook Verification Token / Callback Key</label>
              <input
                type="text"
                value={currentConfig.webhook_token}
                onChange={(e) => handleFormChange('webhook_token', e.target.value)}
                className="input input-sm border-slate-300 w-full font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-xs">Otomatisasi & Validasi</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentConfig.auto_disbursement_enabled}
                  onChange={(e) => handleFormChange('auto_disbursement_enabled', e.target.checked)}
                  className="checkbox checkbox-xs checkbox-teal"
                />
                <span className="font-bold text-slate-800 text-xs">Auto-Disbursement saat Kabag ACC</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentConfig.account_validation_enabled}
                  onChange={(e) => handleFormChange('account_validation_enabled', e.target.checked)}
                  className="checkbox checkbox-xs checkbox-teal"
                />
                <span className="font-bold text-slate-800 text-xs">Validasi Nama Rekening Bank Otomatis</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none"
            >
              Simpan Konfigurasi {activeTab.toUpperCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
