'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  User,
  Sparkles,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Building2,
  GraduationCap,
  Calendar,
  Check,
  Percent,
  Coins,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface UnpaidBillItem {
  id: number;
  nomor_tagihan: string;
  jenis: string;
  periode_label: string;
  total_tagihan: number;
  total_potongan: number;
  total_denda: number;
  total_bayar: number;
  sisa: number;
  status: string;
  jatuh_tempo?: string;
  details?: Array<{
    id: number;
    master_biaya: string;
    nominal: number;
    potongan: number;
    nominal_bersih: number;
    keterangan: string;
  }>;
}

interface BillDiscountConfig {
  selected: boolean;
  mode: 'seluruhnya' | 'nominal';
  nominal: number;
}

export default function CreatePembayaranMahasiswaPotonganPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Student search state (SIAKAD & SPMB)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Unpaid bills state
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillItem[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // Bill discount configuration map: billId -> BillDiscountConfig
  const [billConfigs, setBillConfigs] = useState<Record<number, BillDiscountConfig>>({});

  // Form general information
  const [namaPotongan, setNamaPotongan] = useState('');
  const [nomorSk, setNomorSk] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [status, setStatus] = useState('aktif');

  // Debounced search for student (SIAKAD & SPMB)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setStudentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingStudent(true);
      try {
        const res = await sikeuService.searchMahasiswa(searchQuery.trim());
        setStudentResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error searching students:', err);
        setStudentResults([]);
      } finally {
        setSearchingStudent(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select student handler: auto-fetch unpaid bills
  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentResults([]);
    setSearchQuery('');
    setBillConfigs({});

    setLoadingBills(true);
    try {
      const isCalon = Boolean(student.is_calon_mahasiswa || student.calon_mahasiswa_id || student.tipe_referensi === 'calon_mahasiswa');
      const studentId = isCalon ? (student.calon_mahasiswa_id || student.id) : (student.mahasiswa_id || student.id);
      
      const res = await sikeuService.getStudentUnpaidBills(studentId, isCalon);
      const bills: UnpaidBillItem[] = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.bills)
          ? res.data.bills
          : (Array.isArray(student.tagihans) ? student.tagihans : []));
      setUnpaidBills(bills);

      // Inisialisasi konfigurasi potongan default untuk tiap tagihan
      const initialConfigs: Record<number, BillDiscountConfig> = {};
      bills.forEach((b, index) => {
        initialConfigs[b.id] = {
          selected: index === 0, // Ceklis tagihan pertama secara otomatis
          mode: 'seluruhnya',
          nominal: b.sisa,
        };
      });
      setBillConfigs(initialConfigs);
    } catch (err) {
      console.error('Error fetching unpaid bills:', err);
      toast.error('Gagal memuat tagihan mahasiswa');
      setUnpaidBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setUnpaidBills([]);
    setBillConfigs({});
  };

  // Toggle checkbox tagihan
  const handleToggleBill = (billId: number) => {
    setBillConfigs((prev) => {
      const current = prev[billId] || { selected: false, mode: 'seluruhnya', nominal: 0 };
      const bill = unpaidBills.find((b) => b.id === billId);
      const newSelected = !current.selected;
      return {
        ...prev,
        [billId]: {
          ...current,
          selected: newSelected,
          nominal: newSelected && bill ? (current.mode === 'seluruhnya' ? bill.sisa : (current.nominal || bill.sisa)) : current.nominal,
        },
      };
    });
  };

  // Ubah mode potongan tagihan ('seluruhnya' vs 'nominal')
  const handleChangeBillMode = (billId: number, mode: 'seluruhnya' | 'nominal') => {
    const bill = unpaidBills.find((b) => b.id === billId);
    if (!bill) return;

    setBillConfigs((prev) => ({
      ...prev,
      [billId]: {
        ...(prev[billId] || { selected: true, mode: 'seluruhnya', nominal: bill.sisa }),
        mode,
        nominal: mode === 'seluruhnya' ? bill.sisa : (prev[billId]?.nominal || bill.sisa),
      },
    }));
  };

  // Ubah nominal kustom potongan tagihan
  const handleChangeBillNominal = (billId: number, val: number) => {
    const bill = unpaidBills.find((b) => b.id === billId);
    if (!bill) return;

    const clampedVal = Math.min(Math.max(0, val), bill.sisa);
    setBillConfigs((prev) => ({
      ...prev,
      [billId]: {
        ...(prev[billId] || { selected: true, mode: 'nominal', nominal: clampedVal }),
        nominal: clampedVal,
      },
    }));
  };

  // Kalkulasi total tagihan terpilih dan total potongan
  const selectedBillsSummary = useMemo(() => {
    let count = 0;
    let totalPotongan = 0;
    let totalTagihanAwal = 0;

    unpaidBills.forEach((b) => {
      const config = billConfigs[b.id];
      if (config && config.selected) {
        count++;
        totalTagihanAwal += b.sisa;
        const nom = config.mode === 'seluruhnya' ? b.sisa : config.nominal;
        totalPotongan += nom;
      }
    });

    return {
      count,
      totalTagihanAwal,
      totalPotongan,
      sisaSetelahSemuaPotongan: Math.max(0, totalTagihanAwal - totalPotongan),
    };
  }, [unpaidBills, billConfigs]);

  // Submit Simpan Potongan
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Silakan cari dan pilih mahasiswa atau calon mahasiswa terlebih dahulu');
      return;
    }

    if (!namaPotongan.trim()) {
      toast.error('Nama potongan wajib diisi');
      return;
    }

    if (!nomorSk.trim()) {
      toast.error('Nomor SK / Dokumen Persetujuan wajib diisi agar potongan memiliki dasar persetujuan yang sah');
      return;
    }

    const selectedTargetBills: Array<{
      tagihan_id: number;
      nominal_potongan: number;
      mode_potongan: 'seluruhnya' | 'nominal';
    }> = [];

    unpaidBills.forEach((b) => {
      const cfg = billConfigs[b.id];
      if (cfg && cfg.selected) {
        const nom = cfg.mode === 'seluruhnya' ? b.sisa : cfg.nominal;
        if (nom > 0) {
          selectedTargetBills.push({
            tagihan_id: b.id,
            nominal_potongan: nom,
            mode_potongan: cfg.mode,
          });
        }
      }
    });

    if (selectedTargetBills.length === 0) {
      toast.error('Pilih minimal 1 tagihan untuk diberikan potongan dan pastikan nominal lebih dari 0');
      return;
    }

    const isCalon = Boolean(
      selectedStudent.is_calon_mahasiswa ||
      selectedStudent.calon_mahasiswa_id ||
      selectedStudent.tipe_referensi === 'calon_mahasiswa'
    );

    const payload = {
      mahasiswa_id: isCalon ? null : (selectedStudent.mahasiswa_id || selectedStudent.id),
      calon_mahasiswa_id: isCalon ? (selectedStudent.calon_mahasiswa_id || selectedStudent.id) : null,
      is_calon_mahasiswa: isCalon,
      tipe_referensi: isCalon ? 'calon_mahasiswa' : 'mahasiswa',
      nama_potongan: namaPotongan.trim(),
      nomor_sk: nomorSk.trim(),
      keterangan: keterangan.trim() || null,
      status,
      target_bills: selectedTargetBills,
    };

    setSubmitting(true);
    try {
      const res = await sikeuService.createPembayaranMahasiswaPotongan(payload);
      toast.success(res.message || 'Potongan mahasiswa berhasil disimpan dan diterapkan pada tagihan');
      router.push('/sikeu/pembayaran-mahasiswa/potongan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan potongan mahasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/tarif' },
          { label: 'Potongan Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/potongan' },
          { label: 'Tambah Potongan' },
        ]}
        title="Tambah Potongan Tagihan Mahasiswa"
        description="Tetapkan potongan biaya pendidikan untuk mahasiswa SIAKAD maupun calon mahasiswa SPMB dengan checklist otomatis tagihan yang belum lunas."
        action={
          <Link
            href="/sikeu/pembayaran-mahasiswa/potongan"
            className="btn btn-warning flex items-center gap-1.5 font-bold text-xs"
            title="Kembali ke Daftar Potongan"
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </Link>
        }
      />

      <form onSubmit={handleSubmitForm} className="space-y-6">
        {/* LANGKAH 1: PENCARIAN MAHASISWA (SIAKAD & SPMB) */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <User size={16} className="text-primary-600" />
            <span>1. Cari & Pilih Mahasiswa (SIAKAD / SPMB)</span>
          </h2>

          {!selectedStudent ? (
            <div className="relative space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Pencarian Mahasiswa / Calon Mahasiswa *
              </label>
              <div className="relative">
                <Input
                  placeholder="Ketik Nama, NIM Mahasiswa, No Pendaftaran SPMB, atau NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                {searchingStudent && (
                  <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-primary-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Mendukung pencarian mahasiswa aktif SIAKAD dan calon mahasiswa baru SPMB (tanpa NIM).
              </p>

              {/* Autocomplete Dropdown */}
              {studentResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {studentResults.map((s) => {
                    const isCalon = Boolean(s.is_calon_mahasiswa || s.calon_mahasiswa_id || s.tipe_referensi === 'calon_mahasiswa');
                    return (
                      <div
                        key={`${isCalon ? 'calon' : 'mhs'}-${s.id}`}
                        onClick={() => handleSelectStudent(s)}
                        className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {s.nama_mahasiswa || s.nama_lengkap}
                            </span>
                            {isCalon ? (
                              <Badge variant="purple" className="text-[10px] uppercase font-bold">
                                SPMB (Calon Mhs)
                              </Badge>
                            ) : (
                              <Badge variant="blue" className="text-[10px] uppercase font-bold">
                                SIAKAD (Aktif)
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-medium">{s.nim || s.no_pendaftaran || '-'}</span>
                            <span>•</span>
                            <span>{s.prodi || '-'}</span>
                            {s.tahun_angkatan && (
                              <>
                                <span>•</span>
                                <span>Angkatan {s.tahun_angkatan}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                            {s.unpaid_bills_count || 0} Tagihan
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Selected Student Card */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 border border-primary-200">
                  {selectedStudent.is_calon_mahasiswa ? 'SPMB' : 'MHS'}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {selectedStudent.nama_mahasiswa || selectedStudent.nama_lengkap}
                    </span>
                    {selectedStudent.is_calon_mahasiswa ? (
                      <Badge variant="purple" className="text-[10px] font-bold">
                        SPMB (Calon Mahasiswa)
                      </Badge>
                    ) : (
                      <Badge variant="blue" className="text-[10px] font-bold">
                        SIAKAD (Mahasiswa Aktif)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-mono font-bold text-primary-700">
                      {selectedStudent.nim || selectedStudent.no_pendaftaran}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 size={13} className="text-slate-400" />
                      {selectedStudent.prodi}
                    </span>
                    {selectedStudent.tahun_angkatan && (
                      <>
                        <span>•</span>
                        <span>Angkatan {selectedStudent.tahun_angkatan}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearStudent}
                className="text-xs font-bold"
              >
                Ganti Mahasiswa
              </Button>
            </div>
          )}
        </div>

        {/* LANGKAH 2: TAGIHAN OTOMATIS & PILIHAN POTONGAN */}
        {selectedStudent && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt size={16} className="text-primary-600" />
                <span>2. Tagihan Mahasiswa Belum Lunas ({unpaidBills.length} Tagihan)</span>
              </h2>
              <span className="text-2xs text-slate-500 font-medium">
                Ceklis tagihan yang ingin dipotong dan pilih opsi pemotongan
              </span>
            </div>

            {loadingBills ? (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-primary-600" />
                <p className="text-xs font-semibold">Memuat daftar tagihan belum lunas...</p>
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5">
                <AlertCircle size={24} className="mx-auto text-slate-400" />
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Tidak Ada Tagihan Tertunggak
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Mahasiswa ini tidak memiliki tagihan aktif yang belum dibayar. Potongan hanya dapat diaplikasikan pada tagihan yang berstatus belum bayar atau sebagian.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidBills.map((bill) => {
                  const cfg = billConfigs[bill.id] || { selected: false, mode: 'seluruhnya', nominal: bill.sisa };
                  const isChecked = cfg.selected;
                  const currentNominal = cfg.mode === 'seluruhnya' ? bill.sisa : cfg.nominal;
                  const sisaAkhir = Math.max(0, bill.sisa - currentNominal);

                  return (
                    <div
                      key={bill.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-primary-50/40 border-primary-300 ring-1 ring-primary-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                        {/* Checkbox & Header Tagihan */}
                        <div className="flex items-start gap-3 w-full sm:w-auto">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBill(bill.id)}
                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 mt-0.5 cursor-pointer"
                            id={`check-bill-${bill.id}`}
                          />
                          <label htmlFor={`check-bill-${bill.id}`} className="space-y-1 cursor-pointer">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-primary-800 bg-primary-100/70 px-2 py-0.5 rounded border border-primary-200">
                                {bill.nomor_tagihan}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {bill.jenis}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Periode: <span className="font-medium text-slate-700">{bill.periode_label}</span>
                              {bill.jatuh_tempo && (
                                <> • Jatuh Tempo: <span className="font-mono">{formatDate(bill.jatuh_tempo)}</span></>
                              )}
                            </p>
                          </label>
                        </div>

                        {/* Rincian Saldo Tagihan */}
                        <div className="flex items-center gap-3 sm:gap-6 ml-8 sm:ml-0 text-right shrink-0">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Tagihan</p>
                            <p className="text-xs font-mono font-medium text-slate-600">
                              {formatRupiah(bill.total_tagihan)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Tagihan</p>
                            <p className="text-xs sm:text-sm font-mono font-bold text-slate-900">
                              {formatRupiah(bill.sisa)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Panel Konfigurasi Potongan ketika Diceklis */}
                      {isChecked && (
                        <div className="mt-4 pt-3.5 border-t border-primary-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end bg-white/70 p-3 rounded-lg">
                          {/* Mode Opsi Potongan */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Percent size={13} className="text-primary-600" />
                              <span>Pilihan Mode Pemotongan</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleChangeBillMode(bill.id, 'seluruhnya')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  cfg.mode === 'seluruhnya'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                Potong Seluruhnya
                              </button>
                              <button
                                type="button"
                                onClick={() => handleChangeBillMode(bill.id, 'nominal')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  cfg.mode === 'nominal'
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                Input Nominal
                              </button>
                            </div>
                          </div>

                          {/* Input Nominal Kustom */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Nominal Potongan (Rp)
                            </label>
                            <Input
                              type="number"
                              disabled={cfg.mode === 'seluruhnya'}
                              value={currentNominal}
                              onChange={(e) => handleChangeBillNominal(bill.id, Number(e.target.value))}
                              max={bill.sisa}
                              min={1}
                              className="font-mono font-bold text-xs"
                            />
                            <p className="text-[10px] text-slate-400">
                              Maksimal: {formatRupiah(bill.sisa)}
                            </p>
                          </div>

                          {/* Simulasi Hasil Sisa Akhir */}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                            <p className="text-[10px] text-slate-500 font-medium">Sisa Tagihan Akhir:</p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                                {formatRupiah(sisaAkhir)}
                              </span>
                              {sisaAkhir === 0 ? (
                                <Badge variant="green" className="text-[10px] font-bold">
                                  LUNAS (100%)
                                </Badge>
                              ) : (
                                <Badge variant="amber" className="text-[10px] font-bold">
                                  Sebagian
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LANGKAH 3: INFORMASI POTONGAN (FORM COMPACT) */}
        {selectedStudent && unpaidBills.length > 0 && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles size={16} className="text-primary-600" />
              <span>3. Informasi & Dokumen Potongan</span>
            </h2>

            {/* Grid Form Compact Sesuai Standar UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Field 1: Nama Potongan */}
              <div className="lg:col-span-2">
                <Input
                  label="Nama / Judul Potongan *"
                  placeholder="Contoh: Keringanan Biaya Pendidikan SPMB Gelombang 1, Diskon Prestasi Rektorat..."
                  value={namaPotongan}
                  onChange={(e) => setNamaPotongan(e.target.value)}
                  required
                />
              </div>

              {/* Field 2: Nomor SK / Referensi Dokumen (Wajib) */}
              <div>
                <Input
                  label="Nomor SK / Dokumen Persetujuan *"
                  placeholder="Contoh: SK/REK/2026/045"
                  value={nomorSk}
                  onChange={(e) => setNomorSk(e.target.value)}
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Wajib sebagai dasar persetujuan pemotongan.
                </span>
              </div>

              {/* Field 3: Status Potongan */}
              <div>
                <Select
                  label="Status Potongan *"
                  options={[
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'nonaktif', label: 'Non-Aktif' },
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val as string)}
                />
              </div>

              {/* Field 4: Keterangan / Dasar Kebijakan (Rentang Penuh) */}
              <div className="col-span-full">
                <Textarea
                  label="Keterangan / Catatan Tambahan (Opsional)"
                  placeholder="Rincian pertimbangan pemberian potongan atau catatan persetujuan pimpinan..."
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 4: RINGKASAN & SUBMIT ACTION */}
        {selectedStudent && unpaidBills.length > 0 && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Ringkasan Pemotongan Tagihan:</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Receipt size={14} className="text-primary-600" />
                    <span>{selectedBillsSummary.count} Tagihan Terpilih</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Coins size={14} className="text-emerald-600" />
                    <span>Total Potongan: <strong>{formatRupiah(selectedBillsSummary.totalPotongan)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/sikeu/pembayaran-mahasiswa/potongan')}
                  disabled={submitting}
                  className="text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || selectedBillsSummary.count === 0 || selectedBillsSummary.totalPotongan === 0}
                  icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  className="text-xs font-bold shadow-sm px-6"
                >
                  {submitting ? 'Menyimpan Potongan...' : 'Simpan & Terapkan Potongan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
