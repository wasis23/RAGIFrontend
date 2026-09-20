'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  User,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Printer,
  RotateCcw,
  Building2,
  Check,
  Loader2,
  FileText,
  BadgePercent,
  Receipt,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface StudentInfo {
  id: number;
  mahasiswa_id?: number;
  calon_mahasiswa_id?: number;
  tipe_referensi?: string;
  is_calon_mahasiswa?: boolean;
  nim?: string;
  no_pendaftaran?: string;
  nama_mahasiswa: string;
  prodi?: string;
  tahun_angkatan?: number;
  jalur_kelas?: string;
  total_unpaid_amount?: number;
  unpaid_bills_count?: number;
}

interface BillItem {
  id: number;
  nomor_tagihan: string;
  jenis: string;
  periode_label?: string;
  total_tagihan: number;
  total_potongan: number;
  total_denda?: number;
  total_bayar: number;
  sisa: number;
  kelebihan_bayar?: number;
  status: string;
  jatuh_tempo?: string;
  details?: Array<{
    id: number;
    master_biaya: string;
    nominal: number;
    potongan: number;
    nominal_bersih: number;
  }>;
}

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

function BayarKasirContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStudentId = searchParams.get('student_id');
  const initialIsCalon = searchParams.get('is_calon') === '1' || searchParams.get('is_calon') === 'true';
  const initialTagihanId = searchParams.get('tagihan_id');

  // Student Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

  // Student Bills State
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

  // Payment Form State
  const [channelBayar, setChannelBayar] = useState<'LOKET_TUNAI' | 'LOKET_TRANSFER'>('LOKET_TUNAI');
  const [jumlahBayar, setJumlahBayar] = useState('');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch Bills for Student
  const fetchStudentBills = useCallback(async (studentId: number | string, isCalon: boolean) => {
    setLoadingBills(true);
    try {
      const res = await sikeuService.getStudentUnpaidBills(studentId, isCalon);
      const fetchedBills: BillItem[] = res?.data?.bills || (Array.isArray(res?.data) ? res.data : []);
      setBills(fetchedBills);

      if (res?.data?.mahasiswa && !selectedStudent) {
        setSelectedStudent({
          id: Number(studentId),
          mahasiswa_id: !isCalon ? Number(studentId) : undefined,
          calon_mahasiswa_id: isCalon ? Number(studentId) : undefined,
          is_calon_mahasiswa: isCalon,
          nim: res.data.mahasiswa.nim,
          no_pendaftaran: res.data.mahasiswa.no_pendaftaran,
          nama_mahasiswa: res.data.mahasiswa.nama || res.data.mahasiswa.nama_mahasiswa,
          prodi: res.data.mahasiswa.prodi,
          tahun_angkatan: res.data.mahasiswa.tahun_angkatan || res.data.mahasiswa.angkatan,
          jalur_kelas: res.data.mahasiswa.jalur_kelas || res.data.mahasiswa.jalur,
        });
      }

      // Preselect tagihan if param matches
      if (initialTagihanId) {
        const found = fetchedBills.find((b) => String(b.id) === initialTagihanId);
        if (found) {
          setSelectedBillIds([found.id]);
          setJumlahBayar(String(found.sisa));
        }
      }
    } catch {
      setBills([]);
      toast.error('Gagal mengambil daftar tagihan mahasiswa');
    } finally {
      setLoadingBills(false);
    }
  }, [initialTagihanId, selectedStudent]);

  // Initial URL Parameter Loader
  useEffect(() => {
    if (initialStudentId) {
      fetchStudentBills(initialStudentId, initialIsCalon);
    }
  }, [initialStudentId, initialIsCalon, fetchStudentBills]);

  // Handle Search Mahasiswa
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Masukkan kata kunci pencarian (Nama, NIM, atau No Pendaftaran)');
      return;
    }

    setSearching(true);
    try {
      const res = await sikeuService.searchMahasiswa(searchQuery.trim());
      const list = res.data || [];
      setSearchResults(list);
      if (list.length === 0) {
        toast.error('Data mahasiswa atau calon mahasiswa tidak ditemukan');
      }
    } catch {
      setSearchResults([]);
      toast.error('Gagal melakukan pencarian mahasiswa');
    } finally {
      setSearching(false);
    }
  };

  // Handle Student Selected
  const handleSelectStudent = (student: StudentInfo) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedBillIds([]);
    setJumlahBayar('');
    fetchStudentBills(student.id || student.mahasiswa_id || student.calon_mahasiswa_id!, !!student.is_calon_mahasiswa);
  };

  // Reset Student
  const handleResetStudent = () => {
    setSelectedStudent(null);
    setBills([]);
    setSelectedBillIds([]);
    setJumlahBayar('');
    setCatatan('');
  };

  // Toggle Bill Selection
  const handleToggleBill = (billId: number) => {
    setSelectedBillIds((prev) => {
      const updated = prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId];

      // Auto calculate sum of sisa for selected bills
      const sumSisa = bills
        .filter((b) => updated.includes(b.id))
        .reduce((sum, b) => sum + (Number(b.sisa) || 0), 0);
      setJumlahBayar(sumSisa > 0 ? String(sumSisa) : '');

      return updated;
    });
  };

  // Select All Bills
  const handleSelectAllBills = () => {
    if (selectedBillIds.length === bills.length) {
      setSelectedBillIds([]);
      setJumlahBayar('');
    } else {
      const allIds = bills.map((b) => b.id);
      setSelectedBillIds(allIds);
      const totalSisa = bills.reduce((sum, b) => sum + (Number(b.sisa) || 0), 0);
      setJumlahBayar(String(totalSisa));
    }
  };

  // Computed total sisa of selected bills
  const totalSisaSelected = useMemo(() => {
    return bills
      .filter((b) => selectedBillIds.includes(b.id))
      .reduce((sum, b) => sum + (Number(b.sisa) || 0), 0);
  }, [bills, selectedBillIds]);

  // Set Full Payment
  const handleSetFullPayment = () => {
    if (totalSisaSelected > 0) {
      setJumlahBayar(String(totalSisaSelected));
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Pilih mahasiswa terlebih dahulu.');
      return;
    }
    if (selectedBillIds.length === 0) {
      toast.error('Pilih minimal satu tagihan untuk dibayarkan.');
      return;
    }
    const nominal = Number(jumlahBayar);
    if (isNaN(nominal) || nominal <= 0) {
      toast.error('Masukkan nominal pembayaran yang valid.');
      return;
    }
    if (nominal > totalSisaSelected + 100) {
      toast.error(`Nominal pembayaran (Rp ${nominal.toLocaleString('id-ID')}) melebihi total sisa tagihan terpilih (${formatRupiah(totalSisaSelected)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await sikeuService.processKasirPayment({
        tagihan_ids: selectedBillIds,
        jumlah_bayar: nominal,
        channel_bayar: channelBayar,
        catatan: catatan.trim() || undefined,
      });

      if (res.status === 'success') {
        toast.success(res.message || 'Pembayaran kasir loket berhasil diproses!');
        const kuitansi = res.data?.kuitansi || {
          kode_transaksi: 'TRX-' + Date.now(),
          tanggal: new Date().toISOString(),
          mahasiswa_id: selectedStudent.id,
          nomor_tagihan: bills.filter((b) => selectedBillIds.includes(b.id)).map((b) => b.nomor_tagihan).join(', '),
          jumlah_bayar: nominal,
          channel: channelBayar,
          sisa_setelah_bayar: Math.max(0, totalSisaSelected - nominal),
          status_tagihan: nominal >= totalSisaSelected ? 'lunas' : 'sebagian',
          kasir: 'Admin Keuangan',
        };

        setReceiptData({
          ...kuitansi,
          student: selectedStudent,
          bills_detail: bills.filter((b) => selectedBillIds.includes(b.id)),
        });
        setShowReceiptModal(true);

        // Refresh bills for current student
        fetchStudentBills(selectedStudent.id, !!selectedStudent.is_calon_mahasiswa);
        setSelectedBillIds([]);
        setJumlahBayar('');
        setCatatan('');
      } else {
        toast.error(res.message || 'Gagal memproses pembayaran');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Print Kuitansi via Hidden Iframe (100% Reliable & Isolates Print Styles)
  const handlePrintReceipt = () => {
    if (!receiptData) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const terbilangStr = angkaTerbilang(receiptData.jumlah_bayar);
    const channelName =
      receiptData.channel === 'LOKET_TUNAI'
        ? 'Tunai di Loket Kasir Kampus'
        : 'Transfer Rekening Resmi Kampus';
    const statusText = (receiptData.status_tagihan || 'LUNAS').toUpperCase();
    const nimOrReg =
      receiptData.student?.nim && receiptData.student?.nim !== '-'
        ? `NIM: ${receiptData.student?.nim}`
        : `No. Registrasi: ${receiptData.student?.no_pendaftaran || '-'}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kuitansi Pembayaran - ${receiptData.kode_transaksi}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 10pt;
              line-height: 1.4;
              background: #fff;
            }
            .kuitansi-card {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 24px;
              position: relative;
              background: #fff;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 52pt;
              font-weight: 900;
              color: rgba(16, 185, 129, 0.12);
              text-transform: uppercase;
              border: 6px solid rgba(16, 185, 129, 0.16);
              padding: 8px 36px;
              border-radius: 20px;
              pointer-events: none;
              letter-spacing: 8px;
            }
            .header-kop {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .kampus-title {
              font-size: 13pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              margin: 0;
            }
            .doc-title {
              font-size: 11pt;
              font-weight: 700;
              text-transform: uppercase;
              color: #334155;
              margin: 3px 0 0 0;
            }
            .kampus-sub {
              font-size: 8.5pt;
              color: #64748b;
              margin: 2px 0 0 0;
            }
            .ref-box {
              text-align: right;
            }
            .ref-no {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 700;
              color: #0f172a;
            }
            .ref-date {
              font-size: 8.5pt;
              color: #64748b;
              margin-top: 2px;
            }
            .status-badge {
              display: inline-block;
              font-size: 8pt;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 4px;
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
              margin-top: 4px;
              text-transform: uppercase;
            }
            .meta-table {
              width: 100%;
              margin-top: 14px;
              border-collapse: collapse;
            }
            .meta-table td {
              padding: 5px 0;
              vertical-align: top;
              font-size: 9.5pt;
            }
            .meta-table .label {
              width: 170px;
              color: #475569;
              font-weight: 600;
            }
            .meta-table .colon {
              width: 15px;
              color: #64748b;
            }
            .meta-table .value {
              font-weight: 700;
              color: #0f172a;
            }
            .terbilang-box {
              margin-top: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
              font-size: 9.5pt;
            }
            .terbilang-title {
              font-weight: 600;
              color: #64748b;
              font-size: 8pt;
              text-transform: uppercase;
            }
            .terbilang-text {
              font-style: italic;
              font-weight: 700;
              color: #0f172a;
              margin-top: 2px;
            }
            .item-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
            }
            .item-table th, .item-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              font-size: 9pt;
            }
            .item-table th {
              background: #f1f5f9;
              font-weight: 700;
              text-align: left;
            }
            .item-table .text-right {
              text-align: right;
            }
            .total-banner {
              margin-top: 14px;
              background: #0f172a;
              color: #ffffff;
              border-radius: 6px;
              padding: 12px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 9pt;
              font-weight: 700;
              color: #cbd5e1;
              text-transform: uppercase;
            }
            .total-amount {
              font-family: monospace;
              font-size: 14pt;
              font-weight: 900;
              color: #fcd34d;
            }
            .footer-sig {
              margin-top: 28px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              font-size: 8.5pt;
              width: 190px;
            }
            .sig-line {
              margin-top: 50px;
              border-top: 1px solid #0f172a;
              font-weight: 700;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="kuitansi-card">
            <div class="watermark">${statusText}</div>
            
            <div class="header-kop">
              <div>
                <h1 class="kampus-title">UNIVERSITAS SSO CAMPUS</h1>
                <h2 class="doc-title">Tanda Bukti Pembayaran Kasir Loket</h2>
                <p class="kampus-sub">Bagian Administrasi Keuangan • Sistem Terpadu Pembayaran Kuliah</p>
              </div>
              <div class="ref-box">
                <div class="ref-no">${receiptData.kode_transaksi}</div>
                <div class="ref-date">Tanggal: ${receiptData.tanggal}</div>
                <span class="status-badge">${statusText}</span>
              </div>
            </div>

            <table class="meta-table">
              <tr>
                <td class="label">Telah Terima Dari</td>
                <td class="colon">:</td>
                <td class="value">${receiptData.student?.nama_mahasiswa || '-'}</td>
              </tr>
              <tr>
                <td class="label">Identitas Mahasiswa</td>
                <td class="colon">:</td>
                <td class="value">${nimOrReg}</td>
              </tr>
              <tr>
                <td class="label">Program Studi</td>
                <td class="colon">:</td>
                <td class="value">${receiptData.student?.prodi || '-'} ${receiptData.student?.tahun_angkatan ? `(Angkatan ${receiptData.student?.tahun_angkatan})` : ''}</td>
              </tr>
              <tr>
                <td class="label">Metode Pembayaran</td>
                <td class="colon">:</td>
                <td class="value">${channelName}</td>
              </tr>
            </table>

            <div class="terbilang-box">
              <div class="terbilang-title">Uang Sejumlah:</div>
              <div class="terbilang-text">"${terbilangStr}"</div>
            </div>

            <table class="item-table">
              <thead>
                <tr>
                  <th>No. Tagihan / Invoice</th>
                  <th>Komponen Biaya</th>
                  <th class="text-right">Nominal Tagihan</th>
                  <th class="text-right">Dibayarkan</th>
                </tr>
              </thead>
              <tbody>
                ${(receiptData.bills_detail && receiptData.bills_detail.length > 0
                  ? receiptData.bills_detail.map((b: any) => `
                    <tr>
                      <td style="font-family: monospace; font-weight: bold;">${b.nomor_tagihan}</td>
                      <td>${b.jenis || b.periode_label || 'Biaya Kuliah'}</td>
                      <td class="text-right" style="font-family: monospace;">${formatRupiah(b.total_tagihan)}</td>
                      <td class="text-right" style="font-family: monospace; font-weight: bold;">${formatRupiah(receiptData.jumlah_bayar)}</td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td style="font-family: monospace; font-weight: bold;">${receiptData.nomor_tagihan}</td>
                      <td>Biaya Pendidikan Mahasiswa</td>
                      <td class="text-right" style="font-family: monospace;">${formatRupiah(receiptData.jumlah_bayar)}</td>
                      <td class="text-right" style="font-family: monospace; font-weight: bold;">${formatRupiah(receiptData.jumlah_bayar)}</td>
                    </tr>
                  `
                )}
              </tbody>
            </table>

            <div class="total-banner">
              <span class="total-label">Total Pembayaran Diterima</span>
              <span class="total-amount">${formatRupiah(receiptData.jumlah_bayar)}</span>
            </div>

            <table class="meta-table" style="margin-top: 10px;">
              <tr>
                <td class="label">Sisa Tagihan Setelah Bayar</td>
                <td class="colon">:</td>
                <td class="value" style="color: ${receiptData.sisa_setelah_bayar > 0 ? '#b91c1c' : '#047857'}; font-family: monospace;">
                  ${formatRupiah(receiptData.sisa_setelah_bayar || 0)} ${receiptData.sisa_setelah_bayar <= 0 ? '(LUNAS PENUH)' : ''}
                </td>
              </tr>
            </table>

            <div class="footer-sig">
              <div class="sig-box">
                <div>Mahasiswa / Penyetor,</div>
                <div class="sig-line">${receiptData.student?.nama_mahasiswa || 'Mahasiswa'}</div>
              </div>
              <div class="sig-box">
                <div>Petugas Kasir Keuangan,</div>
                <div class="sig-line">${receiptData.kasir || 'Admin Keuangan'}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 2000);
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Pembayaran Kasir / Loket Keuangan"
        description="Penerimaan transaksi pembayaran biaya kuliah mahasiswa secara tunai atau transfer di loket keuangan kampus."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sikeu/pembayaran-mahasiswa/tagihan')}
              className="font-bold min-h-[38px] text-xs"
            >
              Kembali ke Tagihan
            </Button>
          </div>
        }
      />

      {/* LANGKAH 1: PENCARIAN & IDENTITAS MAHASISWA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identitas Mahasiswa / Pembayar</h3>
              <p className="text-2xs text-slate-500">Cari mahasiswa berdasarkan Nama, NIM, atau No. Pendaftaran SPMB.</p>
            </div>
          </div>
          {selectedStudent && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={handleResetStudent}
              className="text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Ganti Mahasiswa
            </Button>
          )}
        </div>

        {!selectedStudent ? (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ketik Nama Mahasiswa, NIM, No Pendaftaran SPMB, atau NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={searching}
                  prefixIcon={<Search size={16} className="text-slate-400" />}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={searching || !searchQuery.trim()}
                className="font-bold text-xs px-5 shadow-xs"
              >
                {searching ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                Cari Mahasiswa
              </Button>
            </form>

            {/* Hasil Pencarian */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-72 overflow-y-auto">
                {searchResults.map((m) => {
                  const studentId = m.id || m.mahasiswa_id || m.calon_mahasiswa_id;
                  return (
                    <div
                      key={studentId}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {m.nama_mahasiswa?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{m.nama_mahasiswa}</span>
                            {m.is_calon_mahasiswa ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                SPMB
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                SIAKAD
                              </span>
                            )}
                          </div>
                          <span className="text-2xs text-slate-500 font-mono block">
                            {m.nim && m.nim !== '-' ? `NIM: ${m.nim}` : `No. Reg: ${m.no_pendaftaran || '-'}`} • {m.prodi || 'Program Studi'}
                            {m.tahun_angkatan ? ` • Angkatan ${m.tahun_angkatan}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.total_unpaid_amount !== undefined && (
                          <div className="text-right">
                            <span className="text-2xs text-slate-500 block">Sisa Tagihan</span>
                            <span className="text-xs font-mono font-bold text-rose-700">
                              {formatRupiah(m.total_unpaid_amount)}
                            </span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectStudent(m)}
                          className="font-bold text-xs"
                        >
                          Pilih
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Mahasiswa Terpilih Info Card */
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {selectedStudent.nama_mahasiswa?.charAt(0) || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-slate-900">{selectedStudent.nama_mahasiswa}</h4>
                  {selectedStudent.is_calon_mahasiswa ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      SPMB CALON MAHASISWA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                      MAHASISWA AKTIF SIAKAD
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-mono font-semibold">
                    {selectedStudent.nim && selectedStudent.nim !== '-'
                      ? `NIM: ${selectedStudent.nim}`
                      : `No Reg: ${selectedStudent.no_pendaftaran || '-'}`}
                  </span>
                  <span>•</span>
                  <span>{selectedStudent.prodi || '-'}</span>
                  {selectedStudent.tahun_angkatan && (
                    <>
                      <span>•</span>
                      <span>Angkatan {selectedStudent.tahun_angkatan}</span>
                    </>
                  )}
                  {selectedStudent.jalur_kelas && (
                    <>
                      <span>•</span>
                      <span>Kelas {selectedStudent.jalur_kelas}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right w-full sm:w-auto">
              <span className="text-2xs text-slate-500 uppercase tracking-wider font-bold block">
                Total Tagihan Aktif
              </span>
              <span className="text-sm font-extrabold font-mono text-primary-700">
                {bills.length} Invoice Tagihan
              </span>
            </div>
          </div>
        )}
      </div>

      {/* INFORMASI & PENGALIHAN DISPENSASI (KETIKA MAHASISWA MEMINTA DICICIL) */}
      {selectedStudent && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Mahasiswa Meminta Skema Cicilan atau Penundaan Pembayaran?
              </h4>
              <p className="text-2xs text-amber-900 mt-0.5 leading-relaxed">
                Jika mahasiswa belum dapat melunasi tagihan secara penuh dan memerlukan skema cicilan bertahap atau perpanjangan jatuh tempo, silakan ajukan <strong>Dispensasi Pembayaran</strong> terlebih dahulu agar disetujui pimpinan keuangan.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/sikeu/dispensasi/create?mahasiswa_id=${selectedStudent.id || selectedStudent.mahasiswa_id}`
              )
            }
            className="text-xs font-bold border-amber-300 text-amber-900 bg-white hover:bg-amber-100 shrink-0 w-full sm:w-auto shadow-2xs"
          >
            Ajukan Dispensasi Cicilan
          </Button>
        </div>
      )}

      {/* LANGKAH 2: PILIH TAGIHAN YANG DIBAYAR */}
      {selectedStudent && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Tagihan Belum Lunas</h3>
                <p className="text-2xs text-slate-500">Pilih satu atau beberapa tagihan yang akan dibayarkan oleh mahasiswa.</p>
              </div>
            </div>

            {bills.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllBills}
                className="text-xs font-bold"
              >
                {selectedBillIds.length === bills.length ? 'Batalkan Semua' : 'Pilih Semua Tagihan'}
              </Button>
            )}
          </div>

          {loadingBills ? (
            <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary-600" /> Memuat daftar tagihan...
            </div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
              <p className="font-bold text-slate-800">Tidak ada tagihan yang belum lunas</p>
              <p className="mt-0.5 text-slate-500">Seluruh tagihan mahasiswa ini sudah terbayar lunas atau belum ada tagihan diterbitkan.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {bills.map((bill) => {
                const isChecked = selectedBillIds.includes(bill.id);
                return (
                  <div
                    key={bill.id}
                    onClick={() => handleToggleBill(bill.id)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {bill.nomor_tagihan}
                          </span>
                          <span className="text-2xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {bill.jenis || bill.periode_label || 'Tagihan Kuliah'}
                          </span>
                          {bill.status === 'sebagian' && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              Dibayar Sebagian
                            </span>
                          )}
                        </div>
                        <span className="text-2xs text-slate-500 font-mono block mt-0.5">
                          Jatuh Tempo: {bill.jatuh_tempo || '-'} • Total Tagihan: {formatRupiah(bill.total_tagihan)}
                          {Number(bill.total_bayar) > 0 ? ` • Sudah Bayar: ${formatRupiah(bill.total_bayar)}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xs text-slate-500 block">Sisa Harus Dibayar</span>
                      <span className="text-sm font-mono font-extrabold text-rose-600">
                        {formatRupiah(bill.sisa)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ringkasan Seleksi */}
          {selectedBillIds.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-700">
                {selectedBillIds.length} tagihan dipilih
              </span>
              <div className="text-right">
                <span className="text-slate-500 text-2xs block">Total Sisa Tagihan Terpilih:</span>
                <span className="font-extrabold text-primary-700 text-sm">
                  {formatRupiah(totalSisaSelected)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LANGKAH 3: FORM PROSES PEMBAYARAN KASIR */}
      {selectedStudent && selectedBillIds.length > 0 && (
        <form onSubmit={handleSubmitPayment} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Proses Transaksi Pembayaran</h3>
              <p className="text-2xs text-slate-500">Pilih metode pembayaran loket dan tentukan nominal yang diterima kasir.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Metode / Channel Pembayaran"
              options={[
                { value: 'LOKET_TUNAI', label: 'Tunai di Loket Kasir Kampus' },
                { value: 'LOKET_TRANSFER', label: 'Transfer Manual Rekening Resmi Kampus' },
              ]}
              value={channelBayar}
              onChange={(val) => setChannelBayar(val as any)}
            />

            <div>
              <Input
                label="Nominal Pembayaran Diterima (Rp)"
                type="number"
                placeholder="Contoh: 2500000"
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(e.target.value)}
                required
              />
              <div className="flex items-center justify-between mt-1 text-2xs">
                <span className="text-slate-500">Maksimal sisa: {formatRupiah(totalSisaSelected)}</span>
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  className="text-primary-700 font-bold hover:underline"
                >
                  Bayar Penuh Sisa
                </button>
              </div>
            </div>
          </div>

          <Input
            label="Catatan / Nomor Referensi Bukti (Opsional)"
            placeholder="Contoh: Tunai via Ibu Siti / Bukti transfer BCA 12345"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-xs">
              <span className="text-slate-500">Total Dibayarkan: </span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">
                {formatRupiah(Number(jumlahBayar) || 0)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting || Number(jumlahBayar) <= 0}
              className="font-bold text-xs px-6 py-2.5 shadow-sm min-h-[40px]"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-1.5" />
                  Memproses Transaksi...
                </>
              ) : (
                <>
                  <CreditCard size={15} className="mr-1.5" />
                  Proses Pembayaran Kasir
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* MODAL KUITANSI PEMBAYARAN */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Kuitansi Bukti Pembayaran Loket"
        size="lg"
      >
        {receiptData && (
          <div className="space-y-4">
            {/* AREA DOKUMEN CETAK KUITANSI */}
            <div className="printable-document print-document p-6 border-2 border-slate-900 rounded-2xl bg-white space-y-4 text-slate-900 relative overflow-hidden shadow-xs print:p-0 print:border-none print:shadow-none">
              {/* Watermark Status */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 rotate-[-25deg] select-none">
                <span className="text-6xl font-black text-emerald-800 uppercase tracking-widest border-8 border-emerald-800 px-8 py-4 rounded-3xl">
                  {receiptData.status_tagihan || 'LUNAS'}
                </span>
              </div>

              {/* Kop Kuitansi Resmi */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                    UNIVERSITAS SSO CAMPUS
                  </h3>
                  <h4 className="font-bold text-xs text-slate-700 uppercase">
                    Kuitansi Bukti Pembayaran Kasir Loket
                  </h4>
                  <p className="text-2xs text-slate-500">
                    Bagian Administrasi Keuangan • Sistem Terpadu Pembayaran Kuliah
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {receiptData.kode_transaksi}
                  </div>
                  <div className="text-2xs text-slate-500">Tgl: {receiptData.tanggal}</div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase mt-1 inline-block bg-emerald-100 text-emerald-800 border border-emerald-300">
                    STATUS: {receiptData.status_tagihan || 'LUNAS'}
                  </span>
                </div>
              </div>

              {/* Informasi Pembayar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Telah Terima Dari:</span>
                  <span className="font-bold text-slate-900">{receiptData.student?.nama_mahasiswa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIM / No. Pendaftaran:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {receiptData.student?.nim !== '-' ? receiptData.student?.nim : receiptData.student?.no_pendaftaran}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program Studi:</span>
                  <span className="text-slate-800 font-medium">
                    {receiptData.student?.prodi || '-'} {receiptData.student?.tahun_angkatan ? `(Angkatan ${receiptData.student?.tahun_angkatan})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kanal Pembayaran:</span>
                  <span className="font-bold text-slate-800">
                    {receiptData.channel === 'LOKET_TUNAI' ? 'Tunai di Loket Kasir Kampus' : 'Transfer Rekening Resmi Kampus'}
                  </span>
                </div>
              </div>

              {/* Uang Sejumlah Terbilang */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                  Uang Sejumlah:
                </span>
                <p className="font-serif italic font-bold text-slate-800 text-xs mt-0.5">
                  &quot;{angkaTerbilang(receiptData.jumlah_bayar)}&quot;
                </p>
              </div>

              {/* Tagihan yang Dibayarkan */}
              <div>
                <p className="text-2xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                  Rincian Tagihan yang Dibayar:
                </p>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs overflow-hidden">
                  <div className="p-2.5 flex justify-between bg-white font-mono">
                    <span className="text-slate-700">{receiptData.nomor_tagihan}</span>
                    <span className="font-bold text-slate-900">{formatRupiah(receiptData.jumlah_bayar)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between bg-slate-900 text-white font-bold">
                    <span>Jumlah Diterima:</span>
                    <span className="font-mono text-amber-300 text-sm">{formatRupiah(receiptData.jumlah_bayar)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between bg-white text-2xs">
                    <span className="text-slate-500">Sisa Tagihan Setelah Bayar:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(receiptData.sisa_setelah_bayar || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="flex justify-between items-end pt-6 text-xs text-center">
                <div className="w-44">
                  <p className="text-2xs text-slate-500">Mahasiswa / Penyetor,</p>
                  <div className="mt-12 border-t border-slate-800 font-bold text-slate-900 pt-1">
                    {receiptData.student?.nama_mahasiswa || 'Mahasiswa'}
                  </div>
                </div>
                <div className="w-44">
                  <p className="text-2xs text-slate-500">Petugas Kasir Keuangan,</p>
                  <div className="mt-12 border-t border-slate-800 font-bold text-slate-900 pt-1">
                    {receiptData.kasir || 'Admin Keuangan'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Kuitansi */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Printer size={14} />}
                onClick={handlePrintReceipt}
                className="text-xs font-bold"
              >
                Cetak Kuitansi
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptModal(false)}
                  className="text-xs font-bold"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowReceiptModal(false);
                    router.push('/sikeu/pembayaran-mahasiswa/tagihan');
                  }}
                  className="text-xs font-bold"
                >
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function BayarKasirMahasiswaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <Loader2 className="animate-spin mx-auto text-primary-600" size={24} />
          <p className="mt-2 text-xs text-slate-500 font-medium">Memuat halaman pembayaran...</p>
        </div>
      }
    >
      <BayarKasirContent />
    </Suspense>
  );
}
