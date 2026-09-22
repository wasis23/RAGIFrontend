'use client';

import { useState } from 'react';
import {
  CreditCard,
  Building2,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileText,
  X,
  ExternalLink,
  Receipt,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Upload,
  Landmark,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/lib/utils';
import { sikeuService } from '@/services/sikeu.service';

export interface PaymentChannel {
  id: string;
  name: string;
  code: string;
  type: string;
  category: 'va' | 'instant';
  prefix: string;
  logo_color: string;
  badge: string;
  description: string;
  fee: number;
  is_active: boolean;
}

export interface ManualAccount {
  id: number;
  nama_kas: string;
  kanal: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
}

interface XenditStudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBills: any[];
  totalAmount: number;
  studentNim: string;
  studentName: string;
  channels: PaymentChannel[];
  onConfirmPayment: (channel: PaymentChannel, vaNumber: string) => Promise<void>;
  onPrintInvoice?: (bankCode: string) => void;
  isProcessing: boolean;
  manualAccounts?: ManualAccount[];
  onManualComplete?: () => Promise<void> | void;
}

export function XenditStudentPaymentModal({
  isOpen,
  onClose,
  selectedBills,
  totalAmount,
  studentNim,
  studentName,
  channels,
  onConfirmPayment,
  onPrintInvoice,
  isProcessing,
  manualAccounts = [],
  onManualComplete,
}: XenditStudentPaymentModalProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('BSN');
  const [activeCategory, setActiveCategory] = useState<'all' | 'va' | 'instant'>('all');
  const [copiedVa, setCopiedVa] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment_detail' | 'manual'>('checkout');

  // Transfer manual BNI/BSN (kode unik)
  const [selectedManualId, setSelectedManualId] = useState<number | null>(null);
  const [manualNominals, setManualNominals] = useState<Record<number, string>>({});
  const [manualInits, setManualInits] = useState<any[]>([]);
  const [requestingKode, setRequestingKode] = useState(false);
  const [manualFiles, setManualFiles] = useState<Record<number, File | null>>({});
  const [manualDates, setManualDates] = useState<Record<number, string>>({});
  const [sendingBukti, setSendingBukti] = useState<Record<number, boolean>>({});
  const [sentBukti, setSentBukti] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const defaultChannels: PaymentChannel[] = [
    {
      id: 'BSN',
      name: 'BSN Virtual Account (H2H)',
      code: 'BSN',
      type: 'VIRTUAL_ACCOUNT',
      category: 'va',
      prefix: '90012',
      logo_color: 'from-teal-700 to-emerald-800',
      badge: 'Verifikasi Otomatis',
      description: 'VA Host-to-Host BSN, verifikasi otomatis & masuk saldo BSN',
      fee: 0,
      is_active: true,
    },
    {
      id: 'MANDIRI',
      name: 'Mandiri Virtual Account',
      code: 'MANDIRI',
      type: 'VIRTUAL_ACCOUNT',
      category: 'va',
      prefix: '88800',
      logo_color: 'from-blue-700 to-indigo-800',
      badge: 'Verifikasi Otomatis',
      description: 'Livin\' by Mandiri, ATM Mandiri, & Internet Banking Mandiri',
      fee: 0,
      is_active: true,
    },
    {
      id: 'BRI',
      name: 'BRI Virtual Account (BRIVA)',
      code: 'BRI',
      type: 'VIRTUAL_ACCOUNT',
      category: 'va',
      prefix: '70012',
      logo_color: 'from-blue-600 to-cyan-600',
      badge: 'Verifikasi Otomatis',
      description: 'BRImo, ATM BRI, Mini ATM, & Agen BRILink',
      fee: 0,
      is_active: true,
    },
    {
      id: 'BCA',
      name: 'BCA Virtual Account',
      code: 'BCA',
      type: 'VIRTUAL_ACCOUNT',
      category: 'va',
      prefix: '10204',
      logo_color: 'from-blue-800 to-blue-950',
      badge: 'Verifikasi Otomatis',
      description: 'myBCA, BCA mobile, KlikBCA, & ATM BCA',
      fee: 0,
      is_active: true,
    },
    {
      id: 'PERMATA',
      name: 'Permata Virtual Account',
      code: 'PERMATA',
      type: 'VIRTUAL_ACCOUNT',
      category: 'va',
      prefix: '85220',
      logo_color: 'from-emerald-700 to-teal-800',
      badge: 'Verifikasi Otomatis',
      description: 'PermataMobile X, PermataNet, & ATM Permata',
      fee: 0,
      is_active: true,
    },
    {
      id: 'QRIS',
      name: 'QRIS (Semua E-Wallet & M-Banking)',
      code: 'QRIS',
      type: 'QR_CODE',
      category: 'instant',
      prefix: 'QRIS',
      logo_color: 'from-rose-600 to-red-600',
      badge: 'Scan & Bayar Langsung',
      description: 'GoPay, OVO, ShopeePay, DANA, BCA Mobile, Livin, dll.',
      fee: 0,
      is_active: true,
    },
  ];

  const availableChannels = channels && channels.length > 0 ? channels : defaultChannels;

  const vaChannels = availableChannels.filter((c) => c.category === 'va');
  const instantChannels = availableChannels.filter((c) => c.category === 'instant');

  const selectedChannel =
    availableChannels.find((c) => c.id === selectedChannelId) || availableChannels[0];

  function pregClean(str: string) {
    const res = (str || '').replace(/[^0-9]/g, '');
    return res.length > 0 ? res : '20240001';
  }

  // Calculate dynamic Virtual Account number based on channel prefix & student NIM
  const cleanNim = pregClean(studentNim || '20240001');
  const computedVaNumber =
    selectedChannel.code === 'QRIS'
      ? `QRIS-${cleanNim}`
      : `${selectedChannel.prefix}${cleanNim}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVa(true);
    toast.success(`Nomor ${selectedChannel.name} disalin!`);
    setTimeout(() => setCopiedVa(false), 2500);
  };

  const handlePay = async () => {
    await onConfirmPayment(selectedChannel, computedVaNumber);
  };

  const selectedManual = manualAccounts.find((a) => a.id === selectedManualId) || null;

  const pickManual = (id: number) => {
    setSelectedManualId(id);
    setSelectedChannelId('');
    setManualInits([]);
    setCurrentStep('manual');
    const init: Record<number, string> = {};
    selectedBills.forEach((b) => {
      init[b.id] = String(b.sisa_bayar || 0);
    });
    setManualNominals(init);
  };

  const pickChannel = (id: string) => {
    setSelectedChannelId(id);
    setSelectedManualId(null);
    setManualInits([]);
  };

  const handleRequestKode = async () => {
    if (!selectedManual) {
      toast.error('Pilih rekening tujuan (BNI / BSN).');
      return;
    }
    const items = selectedBills.map((b) => {
      const nominal = Number(manualNominals[b.id] ?? b.sisa_bayar ?? 0);
      return { tagihan_id: b.id, jumlah_bayar: nominal };
    });
    if (items.some((it) => !it.jumlah_bayar || it.jumlah_bayar <= 0)) {
      toast.error('Nominal tiap tagihan wajib lebih dari 0.');
      return;
    }
    const over = selectedBills.find((b) => Number(manualNominals[b.id] ?? b.sisa_bayar ?? 0) > Number(b.sisa_bayar || 0));
    if (over) {
      toast.error(`Nominal ${over.nomor_tagihan} melebihi sisa tagihan.`);
      return;
    }
    setRequestingKode(true);
    try {
      const res = await sikeuService.manualInit({ unit_kas_id: selectedManual.id, items });
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length === 0) throw new Error('Inisiasi kosong.');
      setManualInits(list);
      const dates: Record<number, string> = {};
      list.forEach((it: any) => {
        dates[it.pembayaran_id] = new Date().toISOString().split('T')[0];
      });
      setManualDates(dates);
      toast.success(res?.message || 'Kode unik diterbitkan.');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal meminta kode unik.');
    } finally {
      setRequestingKode(false);
    }
  };

  const handleSendBukti = async (init: any) => {
    const file = manualFiles[init.pembayaran_id];
    if (!file) {
      toast.error('Pilih foto/scan bukti transfer.');
      return;
    }
    setSendingBukti((p) => ({ ...p, [init.pembayaran_id]: true }));
    try {
      const form = new FormData();
      form.append('pembayaran_id', String(init.pembayaran_id));
      form.append('tanggal_transfer', manualDates[init.pembayaran_id] || new Date().toISOString().split('T')[0]);
      form.append('bukti_transfer', file);
      const res = await sikeuService.uploadBuktiManual(form);
      toast.success(res?.message || 'Bukti terkirim, menunggu verifikasi keuangan.');
      setSentBukti((p) => ({ ...p, [init.pembayaran_id]: true }));
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah bukti.');
    } finally {
      setSendingBukti((p) => ({ ...p, [init.pembayaran_id]: false }));
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`);
  };

  // Kunci: bila ada tagihan menunggu validasi, semua aksi bayar dikunci.
  const lockedBills = selectedBills.filter((b) => b?.pending_verification);
  const isLockedSelection = lockedBills.length > 0;
  const lockTitle = 'Terkunci: ada tagihan menunggu validasi keuangan.';

  // Calculate breakdown items across all chosen bills
  const billSummaryItems = selectedBills.map((b) => ({
    id: b.id,
    label: b.nomor_tagihan || b.periode_label || 'Tagihan Pendidikan',
    subtotal: b.total_tagihan || 0,
    potongan: b.total_potongan || 0,
    sisa: b.sisa_bayar || 0,
    semester: b.semester || 1,
    periode: b.periode_label || `Semester ${b.semester || 1}`,
  }));

  const totalRaw = selectedBills.reduce((acc, b) => acc + (b.total_tagihan || 0), 0);
  const totalPotongan = selectedBills.reduce((acc, b) => acc + (b.total_potongan || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in font-sans">
      <div className="bg-[#f8f9fa] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Minimalist Header bar */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Xendit Official Style Badge */}
            <div className="flex items-center gap-1.5 font-sans">
              <div className="w-6 h-6 rounded bg-[#1e40af] text-white flex items-center justify-center font-black text-xs tracking-tighter">
                x
              </div>
              <span className="font-extrabold text-sm text-slate-800 tracking-tight">xendit</span>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-xs font-semibold text-slate-600">Checkout Terpadu SIKEU</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              <Lock size={11} className="text-emerald-600" /> 256-bit SSL Enkripsi
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Tutup Halaman Checkout"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Responsive Two-Column Layout (Xendit Checkout Pattern) */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
          
          {/* ── LEFT COLUMN: Order Summary & Selected Bills ──────────────────── */}
          <div className="lg:w-[42%] bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              
              {/* Merchant / Institution Brand Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-700 to-primary-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                  SIKEU
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Universitas SSO Campus
                  </h3>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Direktorat Keuangan & Akuntansi Kampus
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block mt-1">
                    Verified Merchant
                  </span>
                </div>
              </div>

              {/* Total Amount Payable Banner */}
              <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-4">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Total Yang Harus Dibayar (1 VA):
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tracking-tight mt-1">
                  {formatRupiah(totalAmount)}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={13} /> Pelunasan otomatis untuk {selectedBills.length} tagihan semester
                </div>
              </div>

              {/* Student Identity Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Data Mahasiswa Pembayar:
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-bold text-slate-900">{studentName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500">NIM:</span>
                  <span className="font-mono font-bold text-primary-700">{studentNim}</span>
                </div>
              </div>

              {/* Collapsible Order Item Details (Checklist Bills) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Receipt size={14} className="text-primary-600" />
                    Rincian Tagihan Terpilih ({selectedBills.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                    className="text-2xs text-primary-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {isOrderSummaryOpen ? 'Sembunyikan' : 'Lihat Detail'}
                    {isOrderSummaryOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl bg-slate-50/50 overflow-hidden text-xs">
                  {billSummaryItems.map((item, idx) => (
                    <div key={item.id} className="p-3 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span className="truncate max-w-[200px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                          {item.label}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatRupiah(item.sisa)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pl-3">
                        <span>{item.periode}</span>
                        {item.potongan > 0 && (
                          <span className="text-emerald-700 font-medium">
                            Diskon: -{formatRupiah(item.potongan)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Summary Footer */}
                  <div className="p-3 bg-slate-100/80 space-y-1 text-2xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Subtotal Biaya ({selectedBills.length} Tagihan):</span>
                      <span className="font-mono">{formatRupiah(totalRaw)}</span>
                    </div>
                    {totalPotongan > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Total Beasiswa / Potongan:</span>
                        <span className="font-mono">-{formatRupiah(totalPotongan)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-xs">
                      <span>Total Tagihan Bersih:</span>
                      <span className="font-mono text-emerald-700">{formatRupiah(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Invoice Button */}
            {onPrintInvoice && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onPrintInvoice(selectedChannel.code)}
                  className="w-full py-2 px-3 text-2xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText size={13} /> Cetak Tagihan / Invoice PDF ({selectedChannel.code})
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Xendit Payment Methods & Checkout Actions ─────── */}
          <div className="lg:w-[58%] bg-[#f8f9fa] p-6 flex flex-col justify-between space-y-5">

            {isLockedSelection && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <Lock size={13} /> Pembayaran Dikunci Sementara
                </p>
                <p>
                  {lockedBills.length} tagihan ({lockedBills.map((b) => b.nomor_tagihan).join(', ')}) sedang menunggu
                  validasi keuangan. Tutup modal ini dan keluarkan dari pilihan untuk membayar tagihan lain.
                </p>
              </div>
            )}
            
            {currentStep === 'checkout' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Pilih Metode Pembayaran
                  </h4>
                  <span className="text-2xs text-slate-500 font-medium">
                    Didukung resmi oleh Xendit
                  </span>
                </div>

                {/* Virtual Account Group */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={13} className="text-primary-600" /> Virtual Account (Transfer Bank)
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {vaChannels.map((channel) => {
                      const isSelected = selectedChannelId === channel.id;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => pickChannel(channel.id)}
                          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer bg-white ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${channel.logo_color} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}
                            >
                              {channel.code}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                {channel.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {channel.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 hidden sm:inline-block">
                              Bebas Biaya
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={10} />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instant Payment Group: QRIS */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <QrCode size={13} className="text-emerald-600" /> QRIS & E-Wallet
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {instantChannels.map((channel) => {
                      const isSelected = selectedChannelId === channel.id;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => pickChannel(channel.id)}
                          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer bg-white ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${channel.logo_color} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}
                            >
                              <QrCode size={18} />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                {channel.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {channel.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 hidden sm:inline-block">
                              Instan
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={10} />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Xendit Security Notice */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
                  <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span>
                      Pembayaran Anda diproses secara aman oleh <strong>Xendit Payment Gateway</strong>. Seluruh tagihan yang dicentang ({selectedBills.length} semester) akan otomatis terverifikasi lunas dalam 1 transaksi.
                    </span>
                  </div>
                </div>

                {/* Manual Transfer Group: BNI / BSN */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Landmark size={13} className="text-indigo-600" /> Transfer Manual (Rekening Kampus)
                  </div>

                  {manualAccounts.length === 0 ? (
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-white text-[11px] text-slate-500">
                      Rekening transfer manual belum disetting oleh bagian keuangan. Silakan gunakan Virtual Account / QRIS.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {manualAccounts.map((acc) => {
                        const isSelected = selectedManualId === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => pickManual(acc.id)}
                            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer bg-white ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-700 to-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                {acc.bank_name}
                              </div>
                              <div>
                                <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                  Bank {acc.bank_name} — {acc.bank_account_number}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  a.n. {acc.bank_account_name} • kode unik 3 digit
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 hidden sm:inline-block">
                                Upload Struk
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check size={10} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : currentStep === 'manual' && selectedManual ? (
              /* Step Manual: kode unik + upload struk per tagihan */
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('checkout');
                      setSelectedManualId(null);
                      setManualInits([]);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Ganti Metode Pembayaran
                  </button>
                  <span className="text-2xs text-slate-400 font-mono">Transfer Manual {selectedManual.bank_name}</span>
                </div>

                {/* Rekening tujuan */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="text-2xs font-extrabold uppercase text-indigo-300 tracking-wider">
                    Transfer ke Rekening Kampus
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-2xs text-slate-300 block">Bank {selectedManual.bank_name} a.n. {selectedManual.bank_account_name}</span>
                        <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                          {selectedManual.bank_account_number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(selectedManual.bank_account_number, 'Nomor rekening')}
                        className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Copy size={14} /> Salin
                      </button>
                    </div>
                    <p className="text-2xs text-slate-300">
                      Transfer <strong className="text-white">tepat sampai 3 digit terakhir</strong> (kode unik) agar pembayaran cepat ditemukan keuangan.
                    </p>
                  </div>
                </div>

                {manualInits.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="font-bold text-slate-900 text-xs">Nominal per tagihan (maksimal sisa):</div>
                    {selectedBills.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-700 truncate">{b.nomor_tagihan}</span>
                        <input
                          type="number"
                          min={1}
                          max={b.sisa_bayar || 0}
                          value={manualNominals[b.id] ?? b.sisa_bayar ?? 0}
                          onChange={(e) => setManualNominals((p) => ({ ...p, [b.id]: e.target.value }))}
                          className="w-36 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleRequestKode}
                      disabled={requestingKode || isLockedSelection}
                      title={isLockedSelection ? lockTitle : undefined}
                      className={`w-full px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                        isLockedSelection ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      {requestingKode ? (
                        <><RefreshCw size={15} className="animate-spin" /><span>Menerbitkan kode...</span></>
                      ) : (
                        <><Hash size={15} /><span>Minta Kode Unik & Nominal Transfer</span></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manualInits.map((init: any) => (
                      <div key={init.pembayaran_id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{init.nomor_tagihan}</span>
                          {sentBukti[init.pembayaran_id] && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              Terkirim
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Tagihan</div>
                            <div className="font-mono font-bold text-xs text-slate-900">{formatRupiah(init.jumlah_bayar)}</div>
                          </div>
                          <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200/70">
                            <div className="text-[10px] text-indigo-500 font-bold uppercase">Kode Unik</div>
                            <div className="font-mono font-black text-sm text-indigo-700">+{init.kode_unik_tampil}</div>
                          </div>
                          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/70">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase">Transfer</div>
                            <div className="font-mono font-black text-xs text-emerald-700">{formatRupiah(init.nominal_transfer)}</div>
                            <button
                              type="button"
                              onClick={() => copyText(String(init.nominal_transfer).replace(/[^0-9]/g, ''), 'Nominal transfer')}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                            >
                              <Copy size={11} /> Salin nominal
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200/70 rounded-lg p-2.5">
                          Pastikan <strong>3 digit terakhir nominal transfer sama persis</strong> dengan kode unik di atas — ini mempercepat keuangan menemukan & memvalidasi pembayaran Anda.
                          {init.reused && (
                            <span className="block mt-1 text-indigo-700 font-semibold">Kode ini dipakai ulang dari permintaan sebelumnya (tidak berubah).</span>
                          )}
                        </p>
                        {!sentBukti[init.pembayaran_id] && (
                          <div className="space-y-2.5 pt-1">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tanggal Transfer *</label>
                                <input
                                  type="date"
                                  max={new Date().toISOString().split('T')[0]}
                                  value={manualDates[init.pembayaran_id] || ''}
                                  onChange={(e) => setManualDates((p) => ({ ...p, [init.pembayaran_id]: e.target.value }))}
                                  className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">Struk / Bukti * <span className="font-normal text-slate-400">(JPG/PNG, maks 5MB)</span></label>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png"
                                  onChange={(e) => setManualFiles((p) => ({ ...p, [init.pembayaran_id]: e.target.files?.[0] || null }))}
                                  className="block w-full text-[11px] border border-slate-200 rounded-lg p-1.5 bg-white"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendBukti(init)}
                              disabled={!!sendingBukti[init.pembayaran_id] || isLockedSelection}
                              title={isLockedSelection ? lockTitle : undefined}
                              className={`w-full px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                                isLockedSelection ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              {sendingBukti[init.pembayaran_id] ? (
                                <><RefreshCw size={14} className="animate-spin" /><span>Mengunggah...</span></>
                              ) : (
                                <><Upload size={14} /><span>Kirim Struk Pembayaran</span></>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleRequestKode}
                      disabled={requestingKode}
                      className="w-full text-2xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Minta ulang kode unik
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('checkout')}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Ganti Metode Pembayaran
                  </button>
                  <span className="text-2xs text-slate-400 font-mono">1 Virtual Account untuk {selectedBills.length} Tagihan</span>
                </div>

                {/* Virtual Account / QRIS Box */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-extrabold uppercase text-indigo-300 tracking-wider">
                      {selectedChannel.name}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                      Aktif Siap Bayar
                    </span>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-2xs text-slate-300 block">
                        {selectedChannel.code === 'QRIS' ? 'Kode Pembayaran / QRIS:' : 'Nomor Virtual Account:'}
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                        {computedVaNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(computedVaNumber)}
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      {copiedVa ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>

                  <div className="text-2xs text-slate-300 flex justify-between pt-1">
                    <span>Nominal Transfer: <strong className="text-white font-mono">{formatRupiah(totalAmount)}</strong></span>
                    <span className="text-amber-300 font-semibold">Tepat tanpa dibulatkan</span>
                  </div>
                </div>

                {/* Petunjuk Transfer */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-primary-600" />
                    Tata Cara Bayar Melalui {selectedChannel.code}:
                  </div>

                  {selectedChannel.code === 'BSN' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka aplikasi mobile banking BSN.</li>
                      <li>Pilih menu <strong>Pembayaran</strong> → <strong>Virtual Account</strong>.</li>
                      <li>Masukkan Nomor VA: <strong className="font-mono text-slate-900">{computedVaNumber}</strong>.</li>
                      <li>Periksa nama ({studentName}) & nominal persis {formatRupiah(totalAmount)}.</li>
                      <li>Masukkan PIN untuk menyelesaikan.</li>
                    </ol>
                  )}

                  {selectedChannel.code === 'MANDIRI' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka aplikasi <strong>Livin&apos; by Mandiri</strong>.</li>
                      <li>Pilih menu <strong>Bayar</strong> → cari penyedia jasa <strong>Xendit / Multi Payment</strong>.</li>
                      <li>Masukkan Nomor Mandiri VA: <strong className="font-mono text-slate-900">{computedVaNumber}</strong>.</li>
                      <li>Pastikan nominal total {formatRupiah(totalAmount)} lalu konfirmasi PIN.</li>
                    </ol>
                  )}

                  {selectedChannel.code === 'BRI' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka aplikasi <strong>BRImo</strong> lalu login.</li>
                      <li>Pilih <strong>Tagihan</strong> → <strong>BRIVA</strong> → <strong>Pembayaran Baru</strong>.</li>
                      <li>Masukkan Nomor BRIVA: <strong className="font-mono text-slate-900">{computedVaNumber}</strong>.</li>
                      <li>Verifikasi rincian tagihan gabungan lalu selesaikan pembayaran.</li>
                    </ol>
                  )}

                  {selectedChannel.code === 'BCA' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka aplikasi <strong>BCA mobile</strong> atau <strong>myBCA</strong>.</li>
                      <li>Pilih <strong>m-Transfer</strong> → <strong>BCA Virtual Account</strong>.</li>
                      <li>Ketik Nomor VA: <strong className="font-mono text-slate-900">{computedVaNumber}</strong>.</li>
                      <li>Konfirmasi pembayaran persis {formatRupiah(totalAmount)} dengan PIN m-BCA.</li>
                    </ol>
                  )}

                  {selectedChannel.code === 'PERMATA' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka <strong>PermataMobile X</strong>.</li>
                      <li>Pilih <strong>Bayar Tagihan</strong> → <strong>Virtual Account</strong>.</li>
                      <li>Masukkan Nomor VA: <strong className="font-mono text-slate-900">{computedVaNumber}</strong>.</li>
                      <li>Konfirmasi dan masukkan respon token.</li>
                    </ol>
                  )}

                  {selectedChannel.code === 'QRIS' && (
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Buka aplikasi e-wallet (GoPay, OVO, ShopeePay, DANA) atau m-Banking apapun.</li>
                      <li>Pilih <strong>Scan QRIS</strong>.</li>
                      <li>Scan QRIS yang tampil atau masukkan kode referensi {computedVaNumber}.</li>
                      <li>Periksa nominal {formatRupiah(totalAmount)} lalu otorisasi PIN.</li>
                    </ol>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions Card */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-2xs text-slate-500 font-medium block">Total Pembayaran</span>
                <span className="font-mono font-black text-slate-900 text-base">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {currentStep === 'checkout' ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('payment_detail')}
                    disabled={totalAmount <= 0 || isLockedSelection}
                    title={isLockedSelection ? lockTitle : undefined}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                      isLockedSelection ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#1e40af] hover:bg-[#1d4ed8]'
                    }`}
                  >
                    <span>Lanjut Bayar via {selectedChannel.code}</span>
                    <ArrowRight size={15} />
                  </button>
                ) : currentStep === 'manual' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (onManualComplete) await onManualComplete();
                      else onClose();
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-700 text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Selesai & Tutup</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isProcessing || totalAmount <= 0 || isLockedSelection}
                    title={isLockedSelection ? lockTitle : undefined}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                      isLockedSelection ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Memvalidasi Pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Saya Sudah Bayar / Konfirmasi Lunas</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
