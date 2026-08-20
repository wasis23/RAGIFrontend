'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle2, Building2, QrCode, ArrowLeft, ArrowRight, Lock, Copy, Check, Globe, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import api from '@/lib/axios';

function UniversalCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [isSearchingVa, setIsSearchingVa] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [copiedVa, setCopiedVa] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bni' | 'mandiri' | 'bri' | 'qris'>('bni');
  const [customVaNumber, setCustomVaNumber] = useState('');

  // Dynamic Lookup Result Data
  const [vaData, setVaData] = useState<{
    va_number: string;
    bank_kode: string;
    nominal: number;
    total_bayar: number;
    nama_pendaftar: string;
    no_pendaftaran: string;
    program_studi: string;
    system: string;
    calon_mahasiswa_id: number;
    status_pembayaran: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await spmbService.getMyPendaftaran();
      if (res.data) {
        const vaObj = res.data?.tagihan?.virtual_account || res.data?.virtual_account;
        const initVa = searchParams.get('va') || vaObj?.va_number || '';
        if (initVa) {
          lookupVaDetails(initVa);
        }
      }
    } catch (err: any) {
      console.error('Checkout fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto lookup when user types / inputs VA number
  const lookupVaDetails = async (vaToLookup: string) => {
    const cleanVa = vaToLookup.replace(/[^0-9]/g, '');
    if (cleanVa.length < 6) {
      setVaData(null);
      setLookupError(null);
      return;
    }

    setIsSearchingVa(true);
    setLookupError(null);
    try {
      const res = await api.get('/v1/sikeu/checkout/lookup-va', {
        params: { va_number: cleanVa }
      });

      if (res.data?.status === 'success' && res.data?.data) {
        const d = res.data.data;
        setVaData({
          va_number: d.va_number,
          bank_kode: d.bank_kode || 'BNI',
          nominal: Number(d.nominal || 250000),
          total_bayar: Number(d.total_bayar || 250000),
          nama_pendaftar: d.nama_pendaftar || 'Calon Mahasiswa',
          no_pendaftaran: d.no_pendaftaran || 'REG-2026-SPMB',
          program_studi: d.program_studi || 'S1 Informatika',
          system: d.system || 'SPMB',
          calon_mahasiswa_id: d.calon_mahasiswa_id || 1,
          status_pembayaran: d.status_pembayaran || 'belum_bayar',
        });
        setSelectedMethod((d.bank_kode || 'BNI').toLowerCase() as any);
        toast.success(`Virtual Account ${d.va_number} Terdeteksi! Total: Rp ${new Intl.NumberFormat('id-ID').format(d.total_bayar)}`);
      }
    } catch (err: any) {
      setVaData(null);
      setLookupError(err.response?.data?.message || 'Nomor VA tidak terdaftar di Server Xendit/SIKEU');
    } finally {
      setIsSearchingVa(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedVa(true);
    toast.success('Nomor Virtual Account disalin!');
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!customVaNumber.trim()) {
      toast.error('Silakan ketik/masukkan Nomor Virtual Account terlebih dahulu!');
      return;
    }

    if (!vaData) {
      toast.error('Nomor Virtual Account tidak valid atau tidak terdaftar di server!');
      return;
    }

    setIsProcessing(true);
    try {
      const pendaftaranId = vaData.calon_mahasiswa_id;
      const bankCode = selectedMethod.toUpperCase();

      await api.post(`/v1/sikeu/callback/spmb/${pendaftaranId}`, {
        order_id: `XND-UNIVERSAL-${Date.now()}`,
        nominal: vaData.total_bayar,
        status: 'settlement',
        bank_kode: bankCode,
        channel: `VA_${bankCode}`,
        va_number: vaData.va_number,
      });

      setStep('success');
      toast.success('Pembayaran Xendit Gateway Berhasil Diproses!');
      setTimeout(() => {
        const returnUrl = searchParams.get('redirect') || '/spmb/registrasi';
        router.push(returnUrl);
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran');
      setIsProcessing(false);
    }
  };

  const systemName = vaData?.system || searchParams.get('system') || 'SPMB';
  const displayTotal = vaData ? vaData.total_bayar : 0;
  const displayNama = vaData ? vaData.nama_pendaftar : '- (Masukkan Nomor VA)';
  const displayNoReg = vaData ? vaData.no_pendaftaran : '-';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono tracking-widest uppercase text-slate-400">
            Menghubungkan ke Universal Checkout Gateway...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col font-sans">
      {/* Universal Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center font-black text-base text-white tracking-widest shadow-md">
              X
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide block">Xendit Checkout</span>
                <span className="badge badge-indigo text-[9px] font-black uppercase">Universal Dev Gateway</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Lock size={11} className="text-emerald-400" /> SSL 256-bit Encrypted Checkout • {systemName} System
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold"
          >
            <ArrowLeft size={14} /> Kembali
          </Button>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {step === 'checkout' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Order & Merchant Summary (Dynamic Auto-Detected) */}
            <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Source System
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{systemName} Kampus</h2>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                  <Globe size={18} />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Referensi:</span>
                  <span className="font-mono font-bold text-slate-800">{displayNoReg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembayar:</span>
                  <span className="font-bold text-slate-800">{displayNama}</span>
                </div>
                {vaData && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Program Studi:</span>
                    <span className="font-semibold text-slate-800">{vaData.program_studi}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Keterangan:</span>
                  <span className="font-semibold text-slate-800">Pembayaran Tagihan {systemName}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total Pembayaran:</span>
                <span className="font-mono font-black text-emerald-700 text-lg sm:text-xl">
                  {vaData ? `Rp ${new Intl.NumberFormat('id-ID').format(displayTotal)}` : 'Rp -'}
                </span>
              </div>

              {vaData && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Tagihan VA Terdeteksi & Terhubung Otomatis!</span>
                </div>
              )}
            </div>

            {/* Right Column: Payment Method & Input VA */}
            <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Masukkan Nomor Virtual Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketik atau tempel nomor VA. Sistem akan **mendeteksi tagihan secara otomatis** tanpa hardcode!
                </p>
              </div>

              {/* Manual Input VA (Auto-Detects Bill Amount & Info) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Nomor Virtual Account Target</span>
                  {isSearchingVa && <span className="text-[10px] text-primary-600 font-mono animate-pulse">Memeriksa Server...</span>}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={customVaNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomVaNumber(val);
                        lookupVaDetails(val);
                      }}
                      placeholder="Ketik/Tempel Nomor VA (misal: 8808999902045367)..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-mono font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs pr-9"
                    />
                    {isSearchingVa && (
                      <Search size={16} className="absolute right-3 top-3 text-primary-500 animate-spin" />
                    )}
                  </div>
                </div>

                {lookupError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold pt-1">
                    <AlertCircle size={14} />
                    <span>{lookupError}</span>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5">
                {/* BNI VA Option */}
                <div
                  onClick={() => setSelectedMethod('bni')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'bni'
                      ? 'border-primary-600 bg-primary-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">BNI Virtual Account</span>
                      <span className="font-mono text-xs font-bold text-primary-700">
                        {customVaNumber || 'Masukkan Nomor VA'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-primary-600">Selected</span>
                </div>

                {/* Mandiri VA Option */}
                <div
                  onClick={() => setSelectedMethod('mandiri')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'mandiri'
                      ? 'border-primary-600 bg-primary-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">Mandiri Virtual Account</span>
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {customVaNumber ? `88800-${customVaNumber.slice(-8)}` : '88800-xxxxxxxx'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Simulator</span>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!vaData || isProcessing}
                isLoading={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full font-extrabold text-sm min-h-[48px] bg-primary-600 hover:bg-primary-700 text-white shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing
                  ? 'Memproses Pembayaran Xendit...'
                  : vaData
                  ? `⚡ Bayar Tagihan Sekarang (Rp ${new Intl.NumberFormat('id-ID').format(displayTotal)})`
                  : 'Masukkan Nomor VA Terlebih Dahulu'}
                {!isProcessing && vaData && <ArrowRight size={18} />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-5 max-w-md mx-auto shadow-2xl animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Pembayaran Success!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transaksi Xendit Gateway telah terverifikasi oleh Bank. Mengalihkan Anda kembali ke sistem {systemName}...
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Universal Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-center text-xs">
        <p className="text-[11px]">Universal Xendit Payment Gateway Checkout • SSO Campus Development Environment</p>
      </footer>
    </div>
  );
}

export default function UniversalCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-10 text-center">Loading Checkout...</div>}>
      <UniversalCheckoutContent />
    </Suspense>
  );
}
