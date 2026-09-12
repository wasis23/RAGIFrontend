'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  User,
  Calendar,
  DollarSign,
  Clock,
  RefreshCw,
  Sparkles,
  Receipt,
  Building2,
  HelpCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { sikeuService } from '@/services/sikeu.service';
import toast from 'react-hot-toast';

// Helper angka ke terbilang bahasa Indonesia
function angkaTerbilang(nilai: number): string {
  const angka = Math.floor(Math.abs(nilai));
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  let hasil = '';
  if (angka < 12) {
    hasil = huruf[angka];
  } else if (angka < 20) {
    hasil = angkaTerbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    hasil = angkaTerbilang(Math.floor(angka / 10)) + ' Puluh ' + huruf[angka % 10];
  } else if (angka < 200) {
    hasil = 'Seratus ' + angkaTerbilang(angka - 100);
  } else if (angka < 1000) {
    hasil = angkaTerbilang(Math.floor(angka / 100)) + ' Ratus ' + angkaTerbilang(angka % 100);
  } else if (angka < 2000) {
    hasil = 'Seribu ' + angkaTerbilang(angka - 1000);
  } else if (angka < 1000000) {
    hasil = angkaTerbilang(Math.floor(angka / 1000)) + ' Ribu ' + angkaTerbilang(angka % 1000);
  } else if (angka < 1000000000) {
    hasil = angkaTerbilang(Math.floor(angka / 1000000)) + ' Juta ' + angkaTerbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    hasil = angkaTerbilang(Math.floor(angka / 1000000000)) + ' Milyar ' + angkaTerbilang(angka % 1000000000);
  }
  return (hasil.replace(/\s+/g, ' ').trim() || 'Nol') + ' Rupiah';
}

export default function StudentTagihanPage() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'bills' | 'history' | 'guide'>('bills');
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPay, setProcessingPay] = useState(false);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected bills for payment / consolidated invoice
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

  // Modals & UI States
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'BNI_VA' | 'ONLINE_PAYMENT'>('BNI_VA');
  const [copiedVa, setCopiedVa] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVa(text);
    toast.success('Nomor Virtual Account berhasil disalin!');
    setTimeout(() => setCopiedVa(null), 2500);
  };

  // Fetch Bills & History directly for logged in student
  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [resBills, resHistory] = await Promise.all([
        sikeuService.getMyBills(),
        sikeuService.getMyPaymentHistory().catch(() => ({ data: [] })),
      ]);

      if (Array.isArray(resBills.data)) {
        setBills(resBills.data);
        // Auto select unpaid bills by default
        const unpaid = resBills.data.filter((b: any) => b.status !== 'lunas').map((b: any) => b.id);
        setSelectedBillIds(unpaid);
      } else {
        setBills([]);
        setSelectedBillIds([]);
      }

      if (Array.isArray(resHistory.data)) {
        setPayments(resHistory.data);
      } else {
        setPayments([]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Mahasiswa profile info from bills or auth
  const studentProfile = bills[0]?.mahasiswa || {
    nama: (user as any)?.nama_lengkap || (user as any)?.name || user?.username || 'Ahmad Fadillah',
    nim: user?.username || '2301001001',
    prodi: 'Teknik Informatika',
    angkatan: 2023,
  };

  // Extract unique semesters from bills
  const availableSemesters = Array.from(
    new Set(
      bills.map((b) => ({
        semester: b.semester || 1,
        label: b.periode_label || b.tahun_akademik || `Semester ${b.semester || 1}`,
      }))
    )
  ).filter((v, i, a) => a.findIndex((t) => t.semester === v.semester) === i)
    .sort((a, b) => a.semester - b.semester);

  // Filtered bills
  const filteredBills = bills.filter((b) => {
    if (selectedSemester !== 'ALL' && (b.semester?.toString() !== selectedSemester && !b.periode_label?.includes(`Semester ${selectedSemester}`))) {
      return false;
    }
    if (selectedStatus !== 'ALL' && b.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const unpaidFilteredBills = filteredBills.filter((b) => b.status !== 'lunas');

  // Toggle single bill selection
  const toggleSelectBill = (id: number) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all unpaid bills
  const handleSelectAllUnpaid = () => {
    const unpaidIds = unpaidFilteredBills.map((b) => b.id);
    const allSelected = unpaidIds.every((id) => selectedBillIds.includes(id));
    if (allSelected) {
      setSelectedBillIds((prev) => prev.filter((id) => !unpaidIds.includes(id)));
    } else {
      setSelectedBillIds((prev) => Array.from(new Set([...prev, ...unpaidIds])));
    }
  };

  // Calculations for selected bills
  const selectedBills = bills.filter((b) => selectedBillIds.includes(b.id));
  const selectedTotalTagihan = selectedBills.reduce((acc, b) => acc + (b.total_tagihan || 0), 0);
  const selectedTotalPotongan = selectedBills.reduce((acc, b) => acc + (b.total_potongan || 0), 0);
  const selectedTotalBayar = selectedBills.reduce((acc, b) => acc + (b.total_bayar || 0), 0);
  const selectedTotalSisa = selectedBills.reduce((acc, b) => acc + (b.sisa_bayar || 0), 0);

  const totalOutstandingAll = bills.filter((b) => b.status !== 'lunas').reduce((acc, b) => acc + (b.sisa_bayar || 0), 0);

  // Open Single or Consolidated Invoice Modal
  const handleOpenInvoice = async (tagihanId?: number) => {
    try {
      const idsToFetch = tagihanId ? [tagihanId] : selectedBillIds;
      if (idsToFetch.length === 0) {
        toast.error('Pilih minimal 1 tagihan untuk mencetak Invoice');
        return;
      }

      if (idsToFetch.length === 1) {
        const res = await sikeuService.getInvoice(idsToFetch[0]);
        if (res.data) setSelectedInvoice(res.data);
      } else {
        const res = await sikeuService.generateBatchInvoice(idsToFetch);
        if (res.data) setSelectedInvoice(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengambil data invoice');
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (payment: any) => {
    const mhs = payment.mahasiswa || studentProfile;
    setSelectedReceipt({
      kode_transaksi: payment.kode_transaksi,
      nomor_kuitansi: `KWT-${payment.kode_transaksi}`,
      tanggal_bayar: payment.waktu_bayar,
      jumlah_bayar: payment.jumlah_bayar,
      terbilang: angkaTerbilang(payment.jumlah_bayar),
      channel_bayar: payment.channel_bayar,
      periode_label: payment.periode_label,
      rincian_pembayaran: payment.rincian_pembayaran,
      mahasiswa: {
        nama: mhs.nama || mhs.nama_lengkap || studentProfile.nama,
        nim: mhs.nim || studentProfile.nim,
        prodi: mhs.prodi || studentProfile.prodi,
        angkatan: mhs.angkatan || studentProfile.angkatan,
      },
      catatan: payment.catatan || 'Pelunasan Biaya Pendidikan',
    });
  };

  // Process Student Payment for selected bills
  const handleProcessPayment = async () => {
    if (selectedBillIds.length === 0) {
      toast.error('Pilih minimal 1 tagihan yang akan dibayarkan');
      return;
    }

    setProcessingPay(true);
    try {
      const res = await sikeuService.payStudentBills({
        tagihan_ids: selectedBillIds,
        channel_bayar: payMethod,
        catatan: `Pelunasan Mandiri Mahasiswa (${selectedBillIds.length} Tagihan Semester)`,
      });

      if (res.status === 'success') {
        toast.success(res.message || 'Pembayaran berhasil diverifikasi lunas!');
        setShowPayModal(false);
        // Refresh data
        await fetchStudentData();
        // Automatically open receipt of first paid transaction
        if (res.data?.payments && res.data.payments.length > 0) {
          const firstPay = res.data.payments[0];
          setSelectedReceipt({
            kode_transaksi: firstPay.kode_transaksi,
            nomor_kuitansi: `KWT-${firstPay.kode_transaksi}`,
            tanggal_bayar: new Date().toISOString().replace('T', ' ').substring(0, 19),
            jumlah_bayar: res.data.total_paid || selectedTotalSisa,
            terbilang: angkaTerbilang(res.data.total_paid || selectedTotalSisa),
            channel_bayar: payMethod,
            periode_label: `Pelunasan ${selectedBills.map((b) => b.periode_label).join(' & ')}`,
            rincian_pembayaran: selectedBills.flatMap((b) => b.details?.map((d: any) => d.nama_biaya || d.keterangan)).join(', '),
            mahasiswa: studentProfile,
            catatan: 'Pelunasan Mandiri Terverifikasi Sistem SIKEU',
          });
        }
      } else {
        toast.error(res.message || 'Gagal memproses pembayaran');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setProcessingPay(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── HEADER BANNER ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} /> Portal Keuangan Mahasiswa
              </span>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full text-xs font-bold">
                SIKEU Integrated Payment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tagihan Kuliah & Pembayaran Mandiri
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola pembayaran biaya pendidikan per semester. Pilih untuk melunasi seluruh semester sekaligus atau bayar sebagian tagihan dengan Virtual Account Bank BNI, unduh Surat Tagihan Resmi (Invoice), dan cetak Kuitansi Lunas.
            </p>
          </div>

          {/* Student Profile Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 min-w-[280px] sm:min-w-[320px] space-y-2">
            <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User size={13} className="text-primary-300" /> Mahasiswa Terautentikasi
            </div>
            <div className="text-base font-extrabold text-white">{studentProfile.nama}</div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300">{studentProfile.nim}</span>
              <span>•</span>
              <span>{studentProfile.prodi}</span>
            </div>
            <div className="text-2xs text-slate-400">
              Angkatan {studentProfile.angkatan} • Status: <strong className="text-emerald-300">Aktif Kuliah</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">Total Tagihan Tertunggak</span>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">{formatRupiah(totalOutstandingAll)}</div>
            <span className="text-2xs text-slate-500 mt-1 block">
              {bills.filter((b) => b.status !== 'lunas').length} tagihan semester aktif
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">Nominal Terpilih Siap Bayar</span>
            <div className="text-2xl font-black text-indigo-900 font-mono mt-1">{formatRupiah(selectedTotalSisa)}</div>
            <span className="text-2xs text-slate-500 mt-1 block">{selectedBillIds.length} tagihan dipilih</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Layers size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">Riwayat Transaksi Lunas</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{payments.length} Transaksi</div>
            <span className="text-2xs text-slate-500 mt-1 block">Tercatat di pembukuan kasir</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Receipt size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">Virtual Account BNI Utama</span>
            <div className="text-base font-black text-indigo-900 font-mono mt-1">
              {'88012' + studentProfile.nim}
            </div>
            <span className="text-2xs text-emerald-600 font-bold mt-1 block">● Aktif Siap Bayar</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <QrCode size={24} />
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bills'
              ? 'bg-primary-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard size={16} /> 1. Tagihan Berjalan & Pembayaran
          {bills.filter((b) => b.status !== 'lunas').length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${activeTab === 'bills' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {bills.filter((b) => b.status !== 'lunas').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt size={16} /> 2. Riwayat Pembayaran & Kuitansi Lunas
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'guide'
              ? 'bg-primary-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={16} /> 3. Tata Cara Pembayaran (VA BNI / ATM)
        </button>
      </div>

      {/* ── TAB 1: TAGIHAN BERJALAN & PEMBAYARAN ─────────────────────────────────── */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          {/* Filter Bar & Semester Quick Selector */}
          <div className="card p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 mr-2">
                  <Filter size={14} className="text-primary-600" /> Filter Semester:
                </span>
                <button
                  onClick={() => setSelectedSemester('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedSemester === 'ALL'
                      ? 'bg-primary-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Semester ({bills.length})
                </button>
                {availableSemesters.map((s) => {
                  const count = bills.filter((b) => b.semester === s.semester || b.periode_label?.includes(`Semester ${s.semester}`)).length;
                  return (
                    <button
                      key={s.semester}
                      onClick={() => setSelectedSemester(s.semester.toString())}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedSemester === s.semester.toString()
                          ? 'bg-primary-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semester {s.semester} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-2xs font-bold text-slate-500 uppercase">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="belum_bayar">Belum Bayar</option>
                  <option value="sebagian">Sebagian</option>
                  <option value="dispensasi">Dispensasi</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
            </div>

            {/* Select All / Batch Control Bar */}
            {unpaidFilteredBills.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAllUnpaid}
                    className="flex items-center gap-2 text-xs font-extrabold text-primary-900 hover:text-primary-700 cursor-pointer"
                  >
                    {unpaidFilteredBills.length > 0 && unpaidFilteredBills.every((b) => selectedBillIds.includes(b.id)) ? (
                      <CheckSquare size={16} className="text-primary-600" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                    <span>Pilih Semua Tagihan Belum Lunas ({unpaidFilteredBills.length})</span>
                  </button>
                  {selectedBillIds.length > 0 && (
                    <span className="text-2xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedBillIds.length} tagihan dipilih
                    </span>
                  )}
                </div>

                {selectedBillIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice()}
                      className="btn btn-secondary btn-sm text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText size={14} /> Cetak Invoice Gabungan ({selectedBillIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPayModal(true)}
                      className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CreditCard size={14} /> Bayar Tagihan Terpilih ({formatRupiah(selectedTotalSisa)})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List of Bill Cards */}
          {loading ? (
            <div className="card p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-primary-600" />
              <span>Memuat rincian tagihan pendidikan mahasiswa...</span>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="card p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="p-4 bg-emerald-50 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Tidak Ada Tagihan Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada tagihan yang cocok dengan filter yang dipilih. Silakan pilih semester lain atau reset filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBills.map((b) => {
                const isLunas = b.status === 'lunas';
                const isDispensasi = b.status === 'dispensasi';
                const isSelected = selectedBillIds.includes(b.id);

                return (
                  <div
                    key={b.id}
                    className={`card p-6 border rounded-2xl transition-all space-y-5 ${
                      isLunas
                        ? 'bg-emerald-50/20 border-emerald-200/80'
                        : isSelected
                        ? 'bg-primary-50/20 border-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                        : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    {/* Bill Header with Checkbox */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                      <div className="flex items-start gap-3">
                        {!isLunas ? (
                          <button
                            type="button"
                            onClick={() => toggleSelectBill(b.id)}
                            className="mt-1 text-primary-600 hover:text-primary-800 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={20} className="text-primary-600" /> : <Square size={20} className="text-slate-400" />}
                          </button>
                        ) : (
                          <div className="mt-1 text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                              {b.nomor_tagihan}
                            </span>
                            <span className="badge badge-purple font-bold text-xs">
                              {b.periode_label || b.tahun_akademik || `Semester ${b.semester || 1}`}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                isLunas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isDispensasi
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-3">
                            <span>Batas Waktu: <strong className="text-slate-800">{b.jatuh_tempo || '-'}</strong></span>
                            {b.catatan && <span>• Catatan: <em className="text-slate-600">{b.catatan}</em></span>}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(b.id)}
                          className="btn btn-secondary btn-sm font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={14} /> Cetak Invoice Resmi
                        </button>
                        {!isLunas && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBillIds([b.id]);
                              setShowPayModal(true);
                            }}
                            className="btn btn-primary btn-sm font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <CreditCard size={14} /> Bayar Tagihan Ini ({formatRupiah(b.sisa_bayar)})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rincian Komponen Biaya Table */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                      <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Rincian Komponen Biaya:</span>
                        <span>Nominal Bersih</span>
                      </div>

                      {Array.isArray(b.details) && b.details.length > 0 ? (
                        <div className="space-y-2">
                          {b.details.map((d: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/50 last:border-0">
                              <div>
                                <span className="font-bold text-slate-900">{d.nama_biaya || 'Biaya Kuliah'}</span>
                                {d.keterangan && d.keterangan !== d.nama_biaya && (
                                  <span className="text-2xs text-slate-500 block">{d.keterangan}</span>
                                )}
                              </div>
                              <div className="text-right">
                                {d.potongan > 0 && (
                                  <span className="text-2xs text-emerald-600 font-bold block">
                                    Beasiswa/Diskon: -{formatRupiah(d.potongan)}
                                  </span>
                                )}
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {formatRupiah(d.nominal_bersih || d.nominal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">Rincian standar Uang Kuliah Tunggal (UKT).</div>
                      )}
                    </div>

                    {/* Financial Matrix & VA Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-2xs text-slate-500 font-bold block">Total Biaya</span>
                          <span className="font-mono font-extrabold text-slate-900 text-sm block mt-0.5">
                            {formatRupiah(b.total_tagihan)}
                          </span>
                        </div>
                        <div>
                          <span className="text-2xs text-emerald-700 font-bold block">Beasiswa/Diskon</span>
                          <span className="font-mono font-extrabold text-emerald-700 text-sm block mt-0.5">
                            -{formatRupiah(b.total_potongan)}
                          </span>
                        </div>
                        <div>
                          <span className="text-2xs text-indigo-700 font-bold block">Telah Dibayar</span>
                          <span className="font-mono font-extrabold text-indigo-700 text-sm block mt-0.5">
                            {formatRupiah(b.total_bayar)}
                          </span>
                        </div>
                        <div>
                          <span className="text-2xs text-rose-700 font-bold block">Sisa Tagihan</span>
                          <span className="font-mono font-extrabold text-rose-700 text-sm block mt-0.5">
                            {formatRupiah(b.sisa_bayar)}
                          </span>
                        </div>
                      </div>

                      {/* Right: VA Box */}
                      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                            <Building2 size={13} /> {b.bank_nama || 'Bank BNI (Virtual Account)'}
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                            VA Auto-Detect
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="font-mono text-lg font-black text-amber-300 tracking-wider">
                            {b.va_number || ('88012' + studentProfile.nim)}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(b.va_number || ('88012' + studentProfile.nim))}
                            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-xs flex items-center gap-1 font-bold cursor-pointer"
                            title="Salin Nomor VA"
                          >
                            {copiedVa === (b.va_number || ('88012' + studentProfile.nim)) ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                            <span className="text-2xs">Salin</span>
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-300 flex justify-between">
                          <span>Instruksi: Transfer Tepat Nominal</span>
                          <span>Batas: {b.jatuh_tempo || '30 Hari'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STICKY BATCH ACTIONS BAR ────────────────────────────────────────── */}
          {selectedBillIds.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-40 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="badge badge-green font-bold text-2xs">{selectedBillIds.length} Tagihan Dipilih</span>
                  <span className="text-xs text-slate-400">Total Wajib Bayar:</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  {formatRupiah(selectedTotalSisa)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenInvoice()}
                  className="btn btn-secondary btn-sm text-xs font-bold flex items-center gap-1.5"
                >
                  <FileText size={14} /> Invoice Gabungan
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  <CreditCard size={14} /> Bayar Sekarang ({formatRupiah(selectedTotalSisa)})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: RIWAYAT PEMBAYARAN & KUITANSI ─────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-primary-600" /> Riwayat Pembayaran & Kuitansi Lunas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar semua transaksi yang telah sukses diverifikasi dan dibukukan oleh bagian keuangan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-green font-bold text-xs">
                Total {payments.length} Transaksi Tercatat
              </span>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <Receipt size={36} className="mx-auto text-slate-300" />
              <p>Belum ada riwayat pembayaran yang tercatat untuk akun mahasiswa ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-extrabold uppercase">
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Waktu Bayar</th>
                    <th className="py-3 px-4">Periode / Rincian Biaya</th>
                    <th className="py-3 px-4">Metode Pembayaran</th>
                    <th className="py-3 px-4 text-right">Jumlah Bayar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-900">
                        {p.kode_transaksi}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{p.waktu_bayar?.split(' ')[0] || p.waktu_bayar}</div>
                        <div className="text-2xs text-slate-400">{p.waktu_bayar?.split(' ')[1] || ''}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{p.periode_label || 'Biaya Kuliah'}</span>
                        <span className="text-2xs text-slate-500 block truncate max-w-xs">{p.rincian_pembayaran}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <CreditCard size={13} className="text-primary-600" />
                          {p.channel_bayar || 'LOKET_KASIR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                        {formatRupiah(p.jumlah_bayar)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {p.status || 'SUCCESS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(p)}
                          className="btn btn-secondary btn-sm font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer size={14} /> Cetak Kuitansi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TATA CARA PEMBAYARAN ────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Pembayaran via Virtual Account Bank BNI</h3>
                <p className="text-2xs text-slate-500">ATM BNI, BNI Mobile Banking, & Agen BNI 46</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs">A. Melalui BNI Mobile Banking:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Buka aplikasi BNI Mobile Banking dan login.</li>
                  <li>Pilih menu <strong>Pembayaran</strong> → <strong>Virtual Account Billing</strong>.</li>
                  <li>Masukkan <strong>Nomor Virtual Account</strong> yang tertera pada Invoice.</li>
                  <li>Periksa detail tagihan (Nama Mahasiswa, Nominal Tagihan).</li>
                  <li>Masukkan Password Transaksi dan selesaikan pembayaran.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs">B. Melalui ATM Bank BNI:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Masukkan kartu ATM dan PIN BNI anda.</li>
                  <li>Pilih menu <strong>Menu Lain</strong> → <strong>Pembayaran</strong> → <strong>Virtual Account Billing</strong>.</li>
                  <li>Ketikkan <strong>Nomor Virtual Account</strong> tagihan anda.</li>
                  <li>Konfirmasi tagihan dan tekan <strong>Ya / Benar</strong>.</li>
                  <li>Simpan struk ATM sebagai bukti pembayaran resmi.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Transfer Antar Bank & Loket Kasir Kampus</h3>
                <p className="text-2xs text-slate-500">ATM Bersama, Prima, Mandiri, BCA, BRI, & Kasir Loket</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs">A. Transfer Antar Bank (BCA / Mandiri / BRI):</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Pilih menu <strong>Transfer Antar Bank</strong>.</li>
                  <li>Pilih Bank Tujuan: <strong>Bank BNI (Kode Bank: 009)</strong>.</li>
                  <li>Masukkan Rekening Tujuan: <strong>Nomor Virtual Account</strong> anda.</li>
                  <li>Masukkan nominal transfer <strong>persis sama</strong> dengan sisa tagihan.</li>
                  <li>Verifikasi nama rekening terdaftar dan konfirmasi transfer.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs">B. Pembayaran di Loket Kasir Kampus:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Kunjungi Kantor Bagian Keuangan Kampus.</li>
                  <li>Sebutkan <strong>NIM ({studentProfile.nim})</strong> atau tunjukkan Invoice.</li>
                  <li>Petugas kasir memproses pelunasan (Tunai atau Mesin EDC Debit).</li>
                  <li>Petugas langsung menerbitkan <strong>Kuitansi Resmi Lunas</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PEMBAYARAN TAGIHAN TERPILIH ───────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Pembayaran Tagihan Terpilih</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selected Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Jumlah Tagihan Terpilih:</span>
                <span className="font-bold text-slate-900">{selectedBills.length} Tagihan Semester</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Biaya:</span>
                <span className="font-mono">{formatRupiah(selectedTotalTagihan)}</span>
              </div>
              {selectedTotalPotongan > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Potongan Beasiswa:</span>
                  <span className="font-mono">-{formatRupiah(selectedTotalPotongan)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-rose-700 border-t pt-2">
                <span>Total Harus Dibayar:</span>
                <span className="font-mono">{formatRupiah(selectedTotalSisa)}</span>
              </div>
            </div>

            {/* Virtual Account Box */}
            <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-indigo-200">Nomor Virtual Account BNI:</span>
                <span className="text-2xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-black text-amber-300 tracking-wider">
                  {'88012' + studentProfile.nim}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('88012' + studentProfile.nim)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} /> Salin
                </button>
              </div>
              <div className="text-[10px] text-slate-300">
                Transfer persis <strong>{formatRupiah(selectedTotalSisa)}</strong> ke nomor VA di atas.
              </div>
            </div>

            {/* Metode Bayar Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Metode Pembayaran:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPayMethod('BNI_VA')}
                  className={`p-3 rounded-xl border text-left font-bold transition flex items-center gap-2 cursor-pointer ${
                    payMethod === 'BNI_VA'
                      ? 'border-primary-600 bg-primary-50/50 text-primary-900 ring-2 ring-primary-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 size={16} className="text-primary-600" />
                  <div>
                    <div>VA Bank BNI</div>
                    <div className="text-2xs font-normal text-slate-500">Otomatis Lunas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('ONLINE_PAYMENT')}
                  className={`p-3 rounded-xl border text-left font-bold transition flex items-center gap-2 cursor-pointer ${
                    payMethod === 'ONLINE_PAYMENT'
                      ? 'border-primary-600 bg-primary-50/50 text-primary-900 ring-2 ring-primary-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={16} className="text-primary-600" />
                  <div>
                    <div>Online Gateway</div>
                    <div className="text-2xs font-normal text-slate-500">QRIS / E-Wallet</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="btn btn-ghost btn-sm text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={processingPay || selectedTotalSisa <= 0}
                className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 border-none"
              >
                {processingPay ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Konfirmasi Bayar ({formatRupiah(selectedTotalSisa)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INVOICE RESMI (SINGLE / GABUNGAN) ─────────────────────────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Surat Tagihan Resmi (Invoice)</span>
                <span className="text-xs text-slate-500 font-mono">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold"
                >
                  <Printer size={15} /> Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="btn btn-ghost btn-sm"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* DOKUMEN CETAK INVOICE RESMI */}
            <div className="printable-document p-6 sm:p-8 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed">
              {/* Kop Invoice */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
                  <h4 className="font-bold text-xs text-slate-700 uppercase">DIREKTORAT KEUANGAN & AKUNTANSI (SIKEU)</h4>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: sikeu@campus.ac.id</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-indigo-900 uppercase tracking-widest font-mono">INVOICE</div>
                  <div className="text-xs font-mono font-bold text-slate-700">{selectedInvoice.invoice_number}</div>
                  <div className="text-[10px] text-slate-500">Tgl Terbit: {selectedInvoice.tanggal_terbit}</div>
                </div>
              </div>

              {/* Data Mahasiswa & VA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Ditujukan Kepada:</div>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedInvoice.mahasiswa?.nama}</div>
                  <div>NIM: <strong className="font-mono">{selectedInvoice.mahasiswa?.nim}</strong></div>
                  <div>Program Studi: {selectedInvoice.mahasiswa?.prodi} (Angkatan {selectedInvoice.mahasiswa?.angkatan})</div>
                  <div className="text-2xs text-primary-800 font-bold bg-primary-50 px-2 py-0.5 rounded inline-block mt-1">
                    Periode: {selectedInvoice.periode || 'Semester Berjalan'}
                  </div>
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-700 uppercase flex items-center gap-1">
                    <QrCode size={13} className="text-primary-600" /> Nomor Virtual Account BNI:
                  </div>
                  <div className="font-mono text-base font-extrabold text-primary-900 tracking-wider">
                    {selectedInvoice.virtual_account?.va_number || ('88012' + (selectedInvoice.mahasiswa?.nim || studentProfile.nim))}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">
                    {selectedInvoice.virtual_account?.bank || 'Bank BNI (Virtual Account)'}
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold">
                    Jatuh Tempo: {selectedInvoice.jatuh_tempo || selectedInvoice.virtual_account?.expired_at || '-'}
                  </div>
                </div>
              </div>

              {/* Rincian Items */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-900 uppercase">Rincian Komponen Biaya Pendidikan:</div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-y border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Komponen Biaya</th>
                      <th className="py-2.5 px-3 text-right">Tarif</th>
                      <th className="py-2.5 px-3 text-right">Beasiswa / Diskon</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium">
                          {item.deskripsi || item.nama_biaya}
                          {item.tagihan_nomor && (
                            <span className="text-2xs text-slate-400 block font-mono">Ref: {item.tagihan_nomor}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(item.nominal)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">-{formatRupiah(item.potongan)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiah(item.nominal_bersih)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Tagihan:</span>
                    <span className="font-mono font-bold">{formatRupiah(selectedInvoice.ringkasan?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Total Beasiswa/Potongan:</span>
                    <span className="font-mono font-bold">-{formatRupiah(selectedInvoice.ringkasan?.potongan || 0)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Telah Dibayar:</span>
                    <span className="font-mono font-bold">{formatRupiah(selectedInvoice.ringkasan?.total_dibayar || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold border-t border-slate-300 pt-2 text-rose-700">
                    <span>Sisa Harus Dibayar:</span>
                    <span className="font-mono">{formatRupiah(selectedInvoice.ringkasan?.sisa_tagihan || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Footer & Signature */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs">
                <div className="text-[10px] text-slate-500 space-y-1">
                  <p><strong>Catatan Penting:</strong></p>
                  <p>1. Pembayaran otomatis tercatat lunas dalam sistem secara realtime setelah transfer.</p>
                  <p>2. Jika mengalami kendala transfer, hubungi Bagian Keuangan Kampus.</p>
                </div>
                <div className="text-right space-y-12">
                  <div className="text-[11px] text-slate-600">Direktorat Keuangan & Akuntansi</div>
                  <div className="font-bold underline text-slate-900">Bagian Kasir & Penagihan SIKEU</div>
                </div>
              </div>

              <div className="pt-2 text-[9px] text-slate-400 font-mono text-center border-t border-dashed">
                DOKUMEN SURAT TAGIHAN RESMI DIKELUARKAN OTOMATIS OLEH SISTEM SIKEU INTEGRATED CAMPUS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL KUITANSI PEMBAYARAN RESMI ─────────────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-green font-bold">Kuitansi Pembayaran Lunas</span>
                <span className="text-xs text-slate-500 font-mono">{selectedReceipt.kode_transaksi}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold"
                >
                  <Printer size={15} /> Cetak Kuitansi
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn btn-ghost btn-sm"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* DOKUMEN CETAK KUITANSI RESMI */}
            <div className="printable-document p-6 sm:p-8 border-2 border-slate-900 rounded-xl bg-white space-y-6 text-slate-900 relative overflow-hidden">
              {/* Watermark Lunas */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 rotate-[-25deg]">
                <span className="text-7xl font-black text-emerald-800 uppercase tracking-widest border-8 border-emerald-800 px-8 py-4 rounded-3xl">
                  L U N A S
                </span>
              </div>

              {/* Kop Kuitansi */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
                  <h4 className="font-bold text-xs text-slate-700 uppercase">KUITANSI PEMBAYARAN BIAYA PENDIDIKAN</h4>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-slate-900">{selectedReceipt.nomor_kuitansi}</div>
                  <div className="text-[10px] text-slate-500">Tgl: {selectedReceipt.tanggal_bayar}</div>
                  <span className="badge badge-green font-extrabold text-[10px] mt-1 inline-block">STATUS: LUNAS</span>
                </div>
              </div>

              {/* Isi Kuitansi */}
              <div className="space-y-3.5 text-xs relative z-10">
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-4 text-slate-500 font-semibold">Telah Terima Dari:</span>
                  <span className="col-span-8 font-extrabold text-slate-900 text-sm">
                    {selectedReceipt.mahasiswa?.nama} <span className="font-mono text-xs font-normal text-slate-600">({selectedReceipt.mahasiswa?.nim})</span>
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-4 text-slate-500 font-semibold">Program Studi / Angkatan:</span>
                  <span className="col-span-8 font-bold text-slate-800">
                    {selectedReceipt.mahasiswa?.prodi} (Angkatan {selectedReceipt.mahasiswa?.angkatan})
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-200 bg-slate-50 p-2.5 rounded-lg">
                  <span className="col-span-4 text-slate-500 font-semibold">Uang Sejumlah:</span>
                  <span className="col-span-8 font-serif italic font-bold text-slate-900 text-sm">
                    &quot;{selectedReceipt.terbilang}&quot;
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-4 text-slate-500 font-semibold">Untuk Pembayaran:</span>
                  <span className="col-span-8 font-semibold text-slate-800">
                    {selectedReceipt.periode_label} — {selectedReceipt.rincian_pembayaran || selectedReceipt.catatan}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-4 text-slate-500 font-semibold">Metode & Transaksi:</span>
                  <span className="col-span-8 font-mono text-xs text-slate-700">
                    Channel: <strong>{selectedReceipt.channel_bayar}</strong> • Ref: <strong>{selectedReceipt.kode_transaksi}</strong>
                  </span>
                </div>
              </div>

              {/* Total Box & Signature */}
              <div className="grid grid-cols-2 items-end pt-4 gap-4">
                <div className="bg-slate-900 text-white p-3.5 rounded-xl inline-block">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Jumlah Terbayar (IDR):</div>
                  <div className="font-mono text-xl font-black text-amber-300 mt-0.5">
                    {formatRupiah(selectedReceipt.jumlah_bayar)}
                  </div>
                </div>

                <div className="text-right space-y-10">
                  <div className="text-[10px] text-slate-600">Kasir / Bagian Keuangan Kampus,</div>
                  <div className="font-bold text-xs underline text-slate-900">Petugas Keuangan SIKEU</div>
                </div>
              </div>

              <div className="pt-2 text-[9px] text-slate-400 font-mono text-center border-t border-dashed">
                BUKTI PEMBAYARAN SAH KEUANGAN MAHASISWA UNIVERSITAS TERINTEGRASI
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
