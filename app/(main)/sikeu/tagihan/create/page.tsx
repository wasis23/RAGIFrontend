'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Search, CheckCircle2, Copy, Check, ArrowLeft, Loader2, Save, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';

interface Student {
  id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
}

interface Bill {
  id: number;
  nomor_tagihan: string;
  jenis: string;
  total_tagihan: number;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function CreateTagihanPage() {
  const router = useRouter();

  // Search Mahasiswa
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Student Bills
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'va_bank' | 'tunai_loket'>('va_bank');
  const [catatan, setCatatan] = useState('Penerbitan Virtual Account gabungan tagihan semester aktif');

  // Result state
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(searchQuery);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (mhs: Student) => {
    setSelectedStudent(mhs);
    setSearchQuery('');
    setSearchResults([]);

    const mhsBills: Bill[] = [
      {
        id: 101,
        nomor_tagihan: `INV-SIAKAD-2026-${mhs.nim}`,
        jenis: `UKT Reguler Semester (Angkatan ${mhs.tahun_angkatan})`,
        total_tagihan: mhs.kelompok_ukt === 4 ? 5500000 : mhs.kelompok_ukt === 1 ? 500000 : 3500000,
      },
      {
        id: 102,
        nomor_tagihan: `INV-PRAK-2026-${mhs.nim}`,
        jenis: 'Biaya Laboratorium & Praktikum TI',
        total_tagihan: 750000,
      },
    ];

    setBills(mhsBills);
    setSelectedBillIds(mhsBills.map((b) => b.id));
  };

  const toggleBill = (id: number) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const combinedTotal = bills
    .filter((b) => selectedBillIds.includes(b.id))
    .reduce((sum, b) => sum + b.total_tagihan, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Pilih mahasiswa terlebih dahulu');
      return;
    }
    if (selectedBillIds.length === 0) {
      toast.error('Pilih minimal 1 komponen tagihan');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const vaNum = `88012${selectedStudent.nim}${Math.floor(Math.random() * 100)}`;
      setResult({
        nama: selectedStudent.nama_mahasiswa,
        nim: selectedStudent.nim,
        va_number: vaNum,
        bank: 'Bank BNI',
        total: combinedTotal,
        method: paymentMethod,
        expired: '2026-08-31 23:59:59',
      });

      toast.success(
        paymentMethod === 'va_bank'
          ? 'Virtual Account berhasil diterbitkan!'
          : 'Pembayaran loket kasir berhasil diproses!'
      );
    } catch {
      toast.error('Gagal menerbitkan tagihan');
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
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Search size={16} className="text-primary-600" />
              1. Cari Mahasiswa (NIM / Nama)
            </h2>

            {!selectedStudent ? (
              <div className="relative">
                <Input
                  placeholder="Ketik NIM atau nama mahasiswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100">
                    {searchResults.map((mhs) => (
                      <button
                        key={mhs.id}
                        type="button"
                        onClick={() => handleSelectStudent(mhs)}
                        className="w-full p-3 text-left hover:bg-primary-50 transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{mhs.nama_mahasiswa}</p>
                          <p className="font-mono text-xs text-slate-500">NIM: {mhs.nim} • Angkatan {mhs.tahun_angkatan}</p>
                        </div>
                        <span className="badge badge-purple text-xs font-bold">{mhs.jalur_kelas}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-primary-50/80 border border-primary-200 rounded-xl">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedStudent.nama_mahasiswa}</p>
                  <p className="font-mono text-xs text-slate-600">NIM: {selectedStudent.nim} • Angkatan {selectedStudent.tahun_angkatan} ({selectedStudent.jalur_kelas})</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedStudent(null)}
                  className="font-bold text-rose-600 hover:bg-rose-50"
                >
                  Ganti
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Select Bills */}
          {selectedStudent && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard size={16} className="text-primary-600" />
                2. Komponen Tagihan Yang Dilunasi / Diterbitkan
              </h2>

              <div className="space-y-2 divide-y divide-slate-100">
                {bills.map((b) => {
                  const isChecked = selectedBillIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBill(b.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked ? 'bg-slate-50 border-primary-300' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isChecked} onChange={() => toggleBill(b.id)} label="" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{b.jenis}</p>
                          <p className="font-mono text-2xs text-slate-500">{b.nomor_tagihan}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">
                        {formatRupiah(b.total_tagihan)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-600">Total Gabungan Tagihan:</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {formatRupiah(combinedTotal)}
                </span>
              </div>
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
                  onClick={() => setPaymentMethod('va_bank')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === 'va_bank'
                      ? 'bg-primary-50/80 border-primary-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">Virtual Account BNI</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Terbitkan nomor VA unik untuk transfer ATM/Mobile Banking</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('tunai_loket')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === 'tunai_loket'
                      ? 'bg-primary-50/80 border-primary-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">Bayar Tunai Loket Kasir</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Pelunasan tunai langsung di tempat via Kasir Kampus</p>
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
                  disabled={submitting}
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
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-md mx-auto">
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
                  className="font-bold"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </Button>
              </div>
              <p className="text-2xs text-slate-400">Jatuh Tempo: {result.expired}</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl inline-block">
            <p className="text-xs text-slate-500 font-bold">TOTAL NOMINAL DILUNASI / DITERBITKAN</p>
            <p className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">{formatRupiah(result.total)}</p>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-100">
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
