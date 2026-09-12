'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Save,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  UserCheck,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

interface Student {
  id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  prodi?: string;
  unpaid_bills_count?: number;
  total_unpaid_amount?: number;
}

interface Bill {
  id: number;
  nomor_tagihan: string;
  jenis: string;
  periode_label?: string;
  total_tagihan: number;
  total_potongan?: number;
  total_bayar?: number;
  sisa: number;
  status: string;
  jatuh_tempo?: string;
}

interface DirectItem {
  master_biaya_id?: number;
  master_biaya_kode?: string;
  nama_biaya: string;
  nominal: number;
  keterangan: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function CreateTagihanPage() {
  const router = useRouter();

  // Search Mahasiswa
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Student Bills
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // Master Biaya List for Direct Cashier Billing
  const [masterBiayaList, setMasterBiayaList] = useState<any[]>([]);
  const [directItems, setDirectItems] = useState<DirectItem[]>([
    { master_biaya_kode: 'UKT_REG', nama_biaya: 'UKT / SPP Semester Aktif', nominal: 3500000, keterangan: 'Pembayaran UKT Semester Aktif' }
  ]);

  // Potongan / Diskon Tambahan Kasir
  const [potonganTambahan, setPotonganTambahan] = useState<number>(0);
  const [alasanPotongan, setAlasanPotongan] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'va_bank' | 'tunai_loket'>('tunai_loket');
  const [catatan, setCatatan] = useState('Pembayaran loket kasir kampus');

  // Result state
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load initial students & master biaya on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [resStudents, resBiaya] = await Promise.all([
          sikeuService.searchMahasiswa(''),
          sikeuService.getJenisBiayaList().catch(() => ({ data: [] })),
        ]);
        if (Array.isArray(resStudents.data)) {
          setSearchResults(resStudents.data);
        }
        if (Array.isArray(resBiaya.data)) {
          setMasterBiayaList(resBiaya.data);
        }
      } catch {
        // Fallback
      }
    };
    initData();
  }, []);

  // Search Debounce Effect
  useEffect(() => {
    let isMounted = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(searchQuery);
        if (isMounted) {
          setSearchResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (isMounted) setSearchResults([]);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectStudent = async (mhs: Student) => {
    setSelectedStudent(mhs);
    setLoadingBills(true);
    setPotonganTambahan(0);

    try {
      const res = await sikeuService.getStudentUnpaidBills(mhs.id);
      if (res.data && Array.isArray(res.data.bills) && res.data.bills.length > 0) {
        const fetchedBills: Bill[] = res.data.bills.map((b: any) => ({
          id: b.id,
          nomor_tagihan: b.nomor_tagihan,
          jenis: b.jenis || 'Tagihan Semester Aktif',
          periode_label: b.periode_label || b.jenis || 'Tagihan Semester Aktif',
          total_tagihan: b.total_tagihan,
          total_potongan: b.total_potongan || 0,
          total_bayar: b.total_bayar || 0,
          sisa: b.sisa !== undefined ? b.sisa : b.total_tagihan,
          status: b.status,
          jatuh_tempo: b.jatuh_tempo,
        }));
        setBills(fetchedBills);
        setSelectedBillIds(fetchedBills.map((b) => b.id));
      } else {
        setBills([]);
        setSelectedBillIds([]);
        // Default standard direct billing items based on student
        const defaultUkt = mhs.kelompok_ukt === 1 ? 500000 : mhs.kelompok_ukt === 2 ? 1000000 : 3500000;
        setDirectItems([
          { master_biaya_kode: 'UKT_REG', nama_biaya: 'UKT / SPP Semester Aktif', nominal: defaultUkt, keterangan: 'Pembayaran UKT Semester' }
        ]);
      }
    } catch {
      toast.error('Gagal mengambil daftar tagihan mahasiswa dari database');
      setBills([]);
      setSelectedBillIds([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const toggleBill = (id: number) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddDirectItem = () => {
    setDirectItems((prev) => [
      ...prev,
      { master_biaya_kode: 'PRAKTIKUM', nama_biaya: 'Biaya Praktikum / Ujian', nominal: 750000, keterangan: 'Biaya Praktikum Laboratorium' }
    ]);
  };

  const handleRemoveDirectItem = (index: number) => {
    setDirectItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDirectItem = (index: number, field: keyof DirectItem, value: any) => {
    setDirectItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'master_biaya_kode') {
          const matched = masterBiayaList.find((mb) => (mb.kode || mb.kode_biaya) === value);
          if (matched) {
            updated.nama_biaya = matched.nama || matched.nama_biaya;
            if (matched.nominal_standar && (!updated.nominal || updated.nominal === 0)) {
              updated.nominal = Number(matched.nominal_standar);
            }
          }
        }
        return updated;
      })
    );
  };

  // Calculations
  const hasExistingBills = bills.length > 0;
  const rawCombinedTotal = hasExistingBills
    ? bills.filter((b) => selectedBillIds.includes(b.id)).reduce((sum, b) => sum + (b.sisa || b.total_tagihan), 0)
    : directItems.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  const combinedTotal = Math.max(0, rawCombinedTotal - (potonganTambahan || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Pilih mahasiswa terlebih dahulu');
      return;
    }

    if (hasExistingBills && selectedBillIds.length === 0) {
      toast.error('Pilih minimal 1 komponen tagihan');
      return;
    }

    if (!hasExistingBills && directItems.length === 0) {
      toast.error('Tambahkan minimal 1 komponen biaya yang akan dibayarkan');
      return;
    }

    setSubmitting(true);
    try {
      if (hasExistingBills) {
        // Mode A: Pay existing bills
        if (paymentMethod === 'tunai_loket') {
          const res = await sikeuService.processKasirPayment({
            tagihan_id: selectedBillIds[0],
            tagihan_ids: selectedBillIds,
            jumlah_bayar: combinedTotal,
            channel_bayar: 'LOKET_TUNAI',
            potongan: potonganTambahan > 0 ? potonganTambahan : undefined,
            alasan_potongan: alasanPotongan || undefined,
            catatan: catatan,
          });

          const paidBillsList = bills.filter((b) => selectedBillIds.includes(b.id));

          setResult({
            nama: selectedStudent.nama_mahasiswa,
            nim: selectedStudent.nim,
            kode_transaksi: res.data?.kuitansi?.kode_transaksi || 'TRX-LOKET-XXX',
            nomor_tagihan: res.data?.kuitansi?.nomor_tagihan || paidBillsList.map(b => b.nomor_tagihan).join(', '),
            paid_bills: paidBillsList,
            total: combinedTotal,
            potongan: potonganTambahan,
            method: paymentMethod,
            sisa: res.data?.kuitansi?.sisa_setelah_bayar || 0,
            waktu: res.data?.kuitansi?.waktu_transaksi || new Date().toLocaleString('id-ID'),
          });

          toast.success(`Pembayaran loket kasir berhasil diproses untuk ${selectedBillIds.length} tagihan!`);
        } else {
          // Generate VA
          const res = await sikeuService.createExternalBill({
            mahasiswa_id: selectedStudent.id,
            source_system: 'SIKEU_LOKET',
            requires_approval: false,
            jatuh_tempo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            keterangan: catatan,
            details: bills
              .filter((b) => selectedBillIds.includes(b.id))
              .map((b) => ({
                master_biaya_kode: 'UKT_REG',
                nominal: b.sisa || b.total_tagihan,
                keterangan: b.jenis,
              })),
          });

          const vaData = res.data?.virtual_account;
          setResult({
            nama: selectedStudent.nama_mahasiswa,
            nim: selectedStudent.nim,
            va_number: vaData?.va_number || `88012${selectedStudent.nim}${Math.floor(Math.random() * 100)}`,
            bank: vaData?.bank_nama || 'Bank BNI',
            total: combinedTotal,
            method: paymentMethod,
            expired: vaData?.expired_at || '2026-08-31 23:59:59',
          });

          toast.success('Virtual Account berhasil diterbitkan!');
        }
      } else {
        // Mode B: Direct Cashier Billing
        if (paymentMethod === 'va_bank') {
          // Mode B-1: Generate VA for Direct Items
          const res = await sikeuService.createExternalBill({
            mahasiswa_id: selectedStudent.id,
            source_system: 'SIKEU_LOKET',
            requires_approval: false,
            jatuh_tempo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            keterangan: catatan,
            details: directItems.map((it) => ({
              master_biaya_kode: it.master_biaya_kode || 'UKT_REG',
              nominal: Number(it.nominal),
              keterangan: it.keterangan || it.nama_biaya,
            })),
            potongan: potonganTambahan > 0 ? [{
              tipe: 'diskon_kasir',
              nominal_potongan: potonganTambahan,
              keterangan: alasanPotongan || 'Potongan Kasir',
            }] : undefined,
          });

          const vaData = res.data?.virtual_account;
          setResult({
            nama: selectedStudent.nama_mahasiswa,
            nim: selectedStudent.nim,
            va_number: vaData?.va_number || `88012${selectedStudent.nim}${Math.floor(Math.random() * 100)}`,
            bank: vaData?.bank_nama || 'Bank BNI',
            total: combinedTotal,
            method: paymentMethod,
            expired: vaData?.expired_at || '2026-08-31 23:59:59',
          });

          toast.success('Virtual Account pembayaran langsung berhasil diterbitkan!');
        } else {
          // Mode B-2: Direct Cash Payment on-the-spot
          const res = await sikeuService.processDirectCashierPayment({
            mahasiswa_id: selectedStudent.id,
            items: directItems.map((it) => ({
              master_biaya_kode: it.master_biaya_kode || 'UKT_REG',
              nominal: Number(it.nominal),
              keterangan: it.keterangan || it.nama_biaya,
            })),
            jumlah_bayar: combinedTotal,
            potongan: potonganTambahan > 0 ? potonganTambahan : undefined,
            alasan_potongan: alasanPotongan || undefined,
            channel_bayar: 'LOKET_TUNAI',
            catatan: catatan,
          });

          setResult({
            nama: selectedStudent.nama_mahasiswa,
            nim: selectedStudent.nim,
            kode_transaksi: res.data?.kuitansi?.kode_transaksi || 'TRX-LOKET-XXX',
            nomor_tagihan: res.data?.kuitansi?.nomor_tagihan || 'INV-LOKET-DIRECT',
            paid_bills: directItems.map((it, idx) => ({
              id: idx + 1,
              nomor_tagihan: 'DIRECT-FEE',
              jenis: it.nama_biaya,
              total_tagihan: it.nominal,
              sisa: 0,
              status: 'lunas',
            })),
            total: combinedTotal,
            potongan: potonganTambahan,
            method: paymentMethod,
            sisa: 0,
            waktu: res.data?.kuitansi?.waktu_transaksi || new Date().toLocaleString('id-ID'),
          });

          toast.success('Pembayaran langsung kasir berhasil diproses & kuitansi siap dicetak!');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses pembayaran kasir');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyVa = () => {
    if (!result?.va_number) return;
    navigator.clipboard.writeText(result.va_number);
    setCopied(true);
    toast.success('Nomor Virtual Account berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Pembayaran Loket & Penerbitan Virtual Account (VA)"
        description="Layanan kasir kampus untuk pembayaran gabungan & penerbitan nomor VA bank mahasiswa."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/tagihan')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Search Student */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Search size={16} className="text-primary-600" />
                1. Cari Mahasiswa (NIM / Nama / NIK)
              </h2>
              {selectedStudent && (
                <span className="badge badge-green text-2xs font-bold">
                  Mahasiswa Terpilih
                </span>
              )}
            </div>

            {!selectedStudent ? (
              <div className="relative space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Ketik NIM, Nama Mahasiswa, atau NIK..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    </div>
                  )}
                </div>

                {/* Dropdown Floating Search Results when Typing/Focusing */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl shadow-lg bg-white overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Daftar Mahasiswa Ditemukan ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsSearchFocused(false)}
                        className="text-primary-600 hover:underline"
                      >
                        Tutup
                      </button>
                    </div>
                    {searchResults.map((mhs) => (
                      <button
                        key={mhs.id}
                        type="button"
                        onClick={() => {
                          handleSelectStudent(mhs);
                          setIsSearchFocused(false);
                        }}
                        className="w-full p-3 text-left hover:bg-primary-50/80 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition">
                            {mhs.nama_mahasiswa}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-700">NIM: {mhs.nim}</span>
                            <span>•</span>
                            <span>{mhs.prodi || 'Program Studi'}</span>
                            <span>•</span>
                            <span>Angkatan {mhs.tahun_angkatan}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="badge badge-purple text-2xs font-bold">{mhs.jalur_kelas}</span>
                          {mhs.unpaid_bills_count && mhs.unpaid_bills_count > 0 ? (
                            <span className="text-2xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              {mhs.unpaid_bills_count} Tagihan Aktif
                            </span>
                          ) : (
                            <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Siap Bayar Langsung
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Recommendation list when not focusing search dropdown */}
                {!isSearchFocused && searchResults.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Daftar Cepat Mahasiswa (Klik untuk Memilih):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {searchResults.slice(0, 6).map((mhs) => (
                        <div
                          key={mhs.id}
                          onClick={() => handleSelectStudent(mhs)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-primary-50 hover:border-primary-300 cursor-pointer transition flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{mhs.nama_mahasiswa}</p>
                            <p className="text-2xs text-slate-500 font-mono">NIM: {mhs.nim} • {mhs.jalur_kelas}</p>
                          </div>
                          <span className="text-2xs font-bold px-2 py-1 rounded bg-white text-primary-700 border border-slate-200 shrink-0">
                            Pilih
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary-50/80 border border-primary-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-600 text-white rounded-xl">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedStudent.nama_mahasiswa}</p>
                    <p className="font-mono text-xs text-slate-600">
                      NIM: {selectedStudent.nim} • Angkatan {selectedStudent.tahun_angkatan} • {selectedStudent.jalur_kelas} • {selectedStudent.prodi || 'Program Studi'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setBills([]);
                    setSelectedBillIds([]);
                  }}
                  className="font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Ganti Mahasiswa
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Select Bills OR Direct Cashier Billing */}
          {selectedStudent && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary-600" />
                  2. Komponen Biaya & Rincian Pembayaran
                </h2>
                {hasExistingBills && (
                  <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {selectedBillIds.length} dari {bills.length} invoice dipilih
                  </span>
                )}
              </div>

              {loadingBills ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-primary-600" />
                  <p className="text-xs font-semibold">Memuat tagihan riil mahasiswa dari database...</p>
                </div>
              ) : hasExistingBills ? (
                /* Mode A: Existing Scheduled Unpaid Bills */
                <div className="space-y-3">
                  <div className="space-y-2 divide-y divide-slate-100">
                    {bills.map((b) => {
                      const isChecked = selectedBillIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBill(b.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked ? 'bg-primary-50/40 border-primary-300 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onChange={() => toggleBill(b.id)} label="" />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{b.jenis}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-mono text-2xs text-slate-500 font-semibold">{b.nomor_tagihan}</span>
                                {b.periode_label && (
                                  <span className="text-2xs font-bold text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200/60">
                                    {b.periode_label}
                                  </span>
                                )}
                                <span className="badge badge-amber text-2xs font-bold uppercase">{b.status}</span>
                                {b.jatuh_tempo && (
                                  <span className="text-2xs text-slate-400">Jatuh Tempo: {b.jatuh_tempo}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 text-sm tabular-nums block">
                              {formatRupiah(b.sisa || b.total_tagihan)}
                            </span>
                            {(b.total_potongan || 0) > 0 && (
                              <span className="text-2xs text-emerald-600 font-semibold">
                                Potongan: {formatRupiah(b.total_potongan || 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Potongan Tambahan Kasir */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-800">Potongan / Keringanan Khusus Kasir (Opsional):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-2xs font-bold text-slate-600 block mb-1">Nominal Potongan (Rp)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={potonganTambahan || ''}
                          onChange={(e) => setPotonganTambahan(Math.max(0, parseFloat(e.target.value) || 0))}
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-bold text-slate-600 block mb-1">Alasan / Catatan Potongan</label>
                        <Input
                          placeholder="Contoh: Diskon Khusus / Keringanan WR II"
                          value={alasanPotongan}
                          onChange={(e) => setAlasanPotongan(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Total Tagihan Bersih:</span>
                      {potonganTambahan > 0 && (
                        <span className="text-2xs text-emerald-700 font-semibold">
                          (Setelah dipotong diskon {formatRupiah(potonganTambahan)})
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(combinedTotal)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode B: Direct Cashier Billing (Student has no generated invoice yet) */
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">
                        Mode Pembayaran Langsung di Loket (Direct Billing)
                      </p>
                      <p className="text-2xs text-blue-700 mt-0.5">
                        Mahasiswa ini belum memiliki invoice terjadwal. Anda dapat memilih jenis komponen biaya di bawah ini untuk langsung memproses pembayaran tunai atau transfer di loket kasir.
                      </p>
                    </div>
                  </div>

                  {/* Direct Items List */}
                  <div className="space-y-3">
                    {directItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Komponen Biaya #{idx + 1}
                          </span>
                          {directItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDirectItem(idx)}
                              className="text-rose-600 hover:text-rose-700 text-2xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-2xs font-bold text-slate-600 block mb-1">Jenis Biaya</label>
                            <select
                              value={item.master_biaya_kode}
                              onChange={(e) => handleUpdateDirectItem(idx, 'master_biaya_kode', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">-- Pilih Jenis Biaya --</option>
                              {masterBiayaList.map((mb) => {
                                const kode = mb.kode || mb.kode_biaya || `BIAYA_${mb.id}`;
                                const nama = mb.nama || mb.nama_biaya || 'Komponen Biaya';
                                return (
                                  <option key={mb.id} value={kode}>
                                    {nama} ({kode})
                                  </option>
                                );
                              })}
                              {masterBiayaList.length === 0 && (
                                <>
                                  <option value="UKT_REG">UKT / SPP Semester (UKT_REG)</option>
                                  <option value="PRAKTIKUM">Biaya Praktikum Lab (PRAKTIKUM)</option>
                                  <option value="WISUDA">Biaya Wisuda (WISUDA)</option>
                                  <option value="LAINNYA">Biaya Lainnya (LAINNYA)</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-2xs font-bold text-slate-600 block mb-1">Nominal (Rp)</label>
                            <Input
                              type="number"
                              value={item.nominal}
                              onChange={(e) => handleUpdateDirectItem(idx, 'nominal', parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div>
                            <label className="text-2xs font-bold text-slate-600 block mb-1">Keterangan / Catatan</label>
                            <Input
                              value={item.keterangan}
                              onChange={(e) => handleUpdateDirectItem(idx, 'keterangan', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={handleAddDirectItem}
                      className="font-bold w-full border-dashed"
                    >
                      Tambah Komponen Biaya Lainnya
                    </Button>

                    {/* Potongan Tambahan Kasir */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-slate-800">Potongan / Keringanan Khusus Kasir (Opsional):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-2xs font-bold text-slate-600 block mb-1">Nominal Potongan (Rp)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={potonganTambahan || ''}
                            onChange={(e) => setPotonganTambahan(Math.max(0, parseFloat(e.target.value) || 0))}
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-bold text-slate-600 block mb-1">Alasan / Catatan Potongan</label>
                          <Input
                            placeholder="Contoh: Diskon Khusus / Keringanan WR II"
                            value={alasanPotongan}
                            onChange={(e) => setAlasanPotongan(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-600 block">Total Pembayaran Langsung:</span>
                        {potonganTambahan > 0 && (
                          <span className="text-2xs text-emerald-700 font-semibold">
                            (Setelah dipotong diskon {formatRupiah(potonganTambahan)})
                          </span>
                        )}
                      </div>
                      <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                        {formatRupiah(combinedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment Method */}
          {selectedStudent && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Save size={16} className="text-primary-600" />
                3. Metode Pembayaran & Catatan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tunai_loket')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'tunai_loket'
                      ? 'bg-primary-50/80 border-primary-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">1. Bayar Tunai Loket Kasir</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Pelunasan tunai langsung di tempat via Kasir Kampus & cetak kuitansi resmi.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('va_bank')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'va_bank'
                      ? 'bg-primary-50/80 border-primary-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">2. Terbitkan Virtual Account Bank</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Terbitkan nomor VA unik BNI/Mandiri/BSI untuk transfer ATM atau Mobile Banking.</p>
                </button>
              </div>

              <Input
                label="Catatan Transaksi"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || combinedTotal <= 0}
                  icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  className="font-bold shadow-md min-h-[44px] px-6"
                >
                  {submitting ? 'Memproses...' : paymentMethod === 'va_bank' ? 'Terbitkan Nomor VA' : 'Proses Pembayaran Loket'}
                </Button>
              </div>
            </div>
          )}
        </form>
      ) : (
        /* Result Display Card */
        <div className="printable-document print-document p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 text-center print:border-none print:shadow-none print:p-2">
          {/* Printable Official Receipt Header */}
          <div className="hidden print:flex justify-between items-start border-b-2 border-slate-900 pb-3 text-left">
            <div>
              <h3 className="font-extrabold text-sm tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
              <h4 className="font-bold text-[11px] text-slate-700 uppercase">DIREKTORAT KEUANGAN & KASIR KAMPUS (SIKEU)</h4>
              <p className="text-[9px] text-slate-600">Bukti Pembayaran / Penerbitan Virtual Account Resmi</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900 uppercase tracking-widest font-mono">
                {result.method === 'va_bank' ? 'BUKTI BILLING VA' : 'KUITANSI LOKET'}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-700">{result.kode_transaksi || result.va_number || '-'}</div>
            </div>
          </div>

          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto print:hidden">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {result.method === 'va_bank' ? 'Virtual Account Berhasil Diterbitkan!' : 'Pembayaran Loket Berhasil!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atas nama <span className="font-bold text-slate-800">{result.nama}</span> (NIM: {result.nim})
            </p>
          </div>

          {result.method === 'va_bank' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-md mx-auto print:bg-white print:border-slate-300">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{result.bank} Virtual Account</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider">
                  {result.va_number}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  icon={copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  onClick={handleCopyVa}
                  className="font-bold print:hidden"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </Button>
              </div>
              <p className="text-2xs text-slate-400">Jatuh Tempo: {result.expired}</p>
            </div>
          )}

          {result.method === 'tunai_loket' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-lg mx-auto text-left print:bg-white print:border-slate-300">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Kode Transaksi:</span>
                <span className="font-mono font-bold text-slate-900">{result.kode_transaksi}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-mono font-bold text-slate-900">{result.nomor_tagihan}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Program Studi:</span>
                <span className="font-semibold text-slate-800">{selectedStudent?.prodi || 'Teknik Informatika'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Periode / Keterangan:</span>
                <span className="font-bold text-primary-800">{catatan || 'Semester Ganjil 2026/2027'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-bold text-slate-900">Tunai Loket Kasir Kampus</span>
              </div>
              {result.paid_bills && result.paid_bills.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-bold block mb-1.5">Rincian Komponen Dilunasi:</span>
                  <div className="space-y-1">
                    {result.paid_bills.map((b: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-2xs">
                        <span className="text-slate-700 font-medium">{b.jenis}</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(b.sisa || b.total_tagihan)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.potongan > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Potongan Kasir:</span>
                  <span className="font-bold">-{formatRupiah(result.potongan)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Sisa Tagihan Tertunggak:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(result.sisa || 0)}</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl inline-block print:bg-white print:border print:border-slate-300">
            <p className="text-xs text-slate-500 font-bold">TOTAL NOMINAL DILUNASI / DITERBITKAN</p>
            <p className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">{formatRupiah(result.total)}</p>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-100 print:hidden">
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
              className="font-bold"
            >
              Cetak Kuitansi
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setResult(null);
                setSelectedStudent(null);
                setBills([]);
                setSelectedBillIds([]);
              }}
              className="font-bold shadow-md"
            >
              Transaksi Baru
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
