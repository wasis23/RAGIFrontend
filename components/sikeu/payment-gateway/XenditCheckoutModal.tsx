import { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, X, Building2, QrCode, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface XenditCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendaftaranId: number;
  noPendaftaran: string;
  namaMhs: string;
  totalBayar: number;
  vaNumber: string;
  bankCode: string;
  onSuccess: () => void;
}

export function XenditCheckoutModal({
  isOpen,
  onClose,
  pendaftaranId,
  noPendaftaran,
  namaMhs,
  totalBayar,
  vaNumber,
  bankCode,
  onSuccess,
}: XenditCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'va_bni' | 'va_mandiri' | 'va_bri' | 'qris'>('va_bni');
  const [inputVa, setInputVa] = useState(vaNumber);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'success'>('select');

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      await api.post(`/v1/sikeu/callback/spmb/${pendaftaranId}`, {
        order_id: `XND-TRX-${Date.now()}`,
        nominal: totalBayar,
        status: 'settlement',
        bank_kode: bankCode || 'BNI',
        channel: `VA_${bankCode || 'BNI'}`,
      });

      setStep('success');
      toast.success('Pembayaran Xendit Sandbox Berhasil Diproses!');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('select');
      }, 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses simulasikan pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 flex flex-col max-h-[90vh]">
        {/* Xendit Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center font-black text-xs text-white tracking-widest">
              X
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide block">Xendit Checkout</span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" /> Secure Payment Gateway Simulator
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {step === 'select' ? (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* Merchant Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Merchant:</span>
                <span className="font-bold text-slate-900">SSO Campus SPMB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">No. Registrasi:</span>
                <span className="font-mono font-bold text-slate-800">{noPendaftaran}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama Pendaftar:</span>
                <span className="font-bold text-slate-800">{namaMhs}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">Total Tagihan:</span>
                <span className="font-black text-emerald-700 text-base">
                  Rp {new Intl.NumberFormat('id-ID').format(totalBayar)}
                </span>
              </div>
            </div>

            {/* Select Method */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 block text-xs">
                Pilih Metode Pembayaran (Simulator M-Banking / ATM)
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('va_bni')}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    selectedMethod === 'va_bni'
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-primary-600" />
                    <div className="text-left">
                      <span className="font-bold text-slate-900 block text-xs">BNI Virtual Account</span>
                      <span className="text-[11px] font-mono text-slate-500">VA: {vaNumber}</span>
                    </div>
                  </div>
                  <span className="badge badge-blue text-[10px]">Sandbox Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('va_mandiri')}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    selectedMethod === 'va_mandiri'
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-indigo-600" />
                    <div className="text-left">
                      <span className="font-bold text-slate-900 block text-xs">Mandiri Virtual Account</span>
                      <span className="text-[11px] font-mono text-slate-500">88800-{vaNumber.slice(-8)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Simulator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('qris')}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    selectedMethod === 'qris'
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode size={18} className="text-emerald-600" />
                    <div className="text-left">
                      <span className="font-bold text-slate-900 block text-xs">QRIS / E-Wallet Instant</span>
                      <span className="text-[11px] text-slate-500">Scan QR / GoPay / OVO / ShopeePay</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Simulator</span>
                </button>
              </div>
            </div>

            {/* Input Confirmation VA */}
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1.5 text-[11px] text-amber-900">
              <span className="font-bold block">💡 Simulasi Pembayaran Bank Xendit:</span>
              <p>
                Halaman ini bertindak sebagai **Gateway / M-Banking Bank**. Mengeklik tombol bayar di bawah akan menembakkan sinyal callback pembayaran lunas dan otomatis meng-update status pendaftaran Anda ke **LUNAS**.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isProcessing}
              onClick={handleSimulatePayment}
              className="w-full font-bold text-sm min-h-[46px] bg-primary-600 hover:bg-primary-700 text-white shadow-md flex items-center justify-center gap-2"
            >
              {isProcessing ? 'Memproses Pembayaran Bank...' : '⚡ Bayar Tagihan Sekarang (Simulasi Bank)'}
              {!isProcessing && <ArrowRight size={16} />}
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-500">
                Transaksi Xendit telah diverifikasi oleh Bank. Mengalihkan kembali ke halaman pendaftaran...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
