'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Clock, 
  FileText, 
  CreditCard, 
  User as UserIcon,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { GajiPegawai } from '@/types/simpeg.types';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function DetailSlipGajiPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const gajiId = parseInt(resolvedParams.id, 10);

  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [gaji, setGaji] = useState<GajiPegawai | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await simpegService.getPayrollDetail(gajiId);
      if (res.data) {
        setGaji(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat rincian slip gaji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gajiId) {
      loadDetail();
    }
  }, [gajiId]);

  const handleProcessPayment = async () => {
    if (!gaji) return;
    try {
      setIsProcessingPayment(true);
      const res: any = await simpegService.processPayrollPayment(gaji.id);
      toast.success(res?.message || 'Pembayaran gaji berhasil dieksekusi dan jurnal SIKEU diterbitkan!');
      loadDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses pembayaran gaji');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Rincian Slip Gaji"
          description="Memuat dokumen rincian penggajian pegawai..."
          action={
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/payroll')}
            >
              Kembali
            </Button>
          }
        />
        <div className="card p-6 text-center text-slate-400">
          <Clock size={40} className="mx-auto mb-3 animate-spin opacity-50" />
          <p>Memuat data slip gaji...</p>
        </div>
      </div>
    );
  }

  if (!gaji) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Slip Gaji Tidak Ditemukan"
          action={
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/payroll')}
            >
              Kembali
            </Button>
          }
        />
        <div className="card p-6 text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-40" />
          <p>Dokumen slip gaji ID #{gajiId} tidak ditemukan atau Anda tidak memiliki hak akses.</p>
        </div>
      </div>
    );
  }

  const detailPendapatan = (gaji.details || []).filter((d) => d.jenis === 'pendapatan');
  const detailPotongan = (gaji.details || []).filter((d) => d.jenis === 'potongan');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Konten Tampilan Layar Interaktif (Disembunyikan sepenuhnya saat dicetak/PDF) */}
      <div className="print:hidden space-y-6">
        <PageHeader
        title={`Slip Gaji: ${gaji.pegawai?.nama_lengkap || 'Pegawai'}`}
        description={`Periode Penggajian: ${gaji.periode_bulan_tahun} • Status: ${gaji.status_transfer.toUpperCase()}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/payroll')}
            >
              Kembali
            </Button>

            {gaji.status_transfer === 'submitted_to_sikeu' && canManage && (
              <Button
                variant="primary"
                icon={<CheckCircle2 size={16} />}
                loading={isProcessingPayment}
                disabled={isProcessingPayment}
                onClick={handleProcessPayment}
              >
                Approve & Bayar Kas SIKEU
              </Button>
            )}

            <Button
              variant="primary"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
            >
              Cetak Dokumen PDF
            </Button>
          </div>
        }
      />

      {/* Hero Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Pembayaran</span>
          <div className="mt-2 flex items-center gap-2">
            {gaji.status_transfer === 'paid' ? (
              <Badge variant="green" className="uppercase font-bold">
                <CheckCircle2 size={12} className="mr-1 inline" /> Lunas / Slip Terbit
              </Badge>
            ) : gaji.status_transfer === 'submitted_to_sikeu' ? (
              <Badge variant="blue" className="uppercase font-bold">
                <Clock size={12} className="mr-1 inline animate-pulse" /> Menunggu Kasir SIKEU
              </Badge>
            ) : (
              <Badge variant="yellow" className="uppercase font-bold">
                Draft Penggajian
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            {gaji.tanggal_transfer ? `Ditransfer: ${formatDateTime(gaji.tanggal_transfer)}` : 'Belum diproses transfer'}
          </span>
        </div>

        <div className="card p-4 border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan Bruto</span>
          <span className="text-lg font-bold text-emerald-600 mt-2">
            +{formatRupiah(gaji.gaji_pokok + (gaji.total_tunjangan || 0))}
          </span>
          <span className="text-[11px] text-slate-400 mt-2">
            Gaji Pokok + Insentif SKS + Kehadiran
          </span>
        </div>

        <div className="card p-4 border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Potongan (PPh + BPJS)</span>
          <span className="text-lg font-bold text-rose-600 mt-2">
            -{formatRupiah(gaji.total_potongan || 0)}
          </span>
          <span className="text-[11px] text-slate-400 mt-2">
            PPh 21: {formatRupiah(gaji.total_pph21 || 0)}
          </span>
        </div>

        <div className="card p-4 bg-primary-50 border border-primary-200 flex flex-col justify-between">
          <span className="text-xs font-bold text-primary-900 uppercase tracking-wider">Gaji Bersih (THP)</span>
          <span className="text-xl font-black text-primary-700 mt-2">
            {formatRupiah(gaji.gaji_bersih)}
          </span>
          <span className="text-[11px] text-primary-800 mt-2 font-medium">
            Ditransfer ke Rekening Pegawai
          </span>
        </div>
      </div>

      {/* Identitas Pegawai & Bank */}
      <div className="card p-6 border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserIcon size={16} className="text-primary-600" /> Identitas Penerima & Penyaluran Kas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Nama Lengkap & NIP:</span>
            <span className="font-bold text-slate-900 block text-sm">{gaji.pegawai?.nama_lengkap || '-'}</span>
            <span className="text-slate-500 font-mono">NIP: {gaji.pegawai?.nip || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Unit Kerja & Jabatan:</span>
            <span className="font-bold text-slate-900 block">{gaji.pegawai?.unit_kerja?.nama || 'Institut'}</span>
            <span className="text-slate-500 capitalize">{gaji.pegawai?.jenis_pegawai || 'Pegawai'} ({gaji.pegawai?.status_kepegawaian || 'Tetap'})</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <CreditCard size={12} /> Rekening Bank & Jurnal SIKEU:
            </span>
            <span className="font-bold text-slate-900 block">
              {gaji.bank_nama || 'Bank Mandiri'} • {gaji.nomor_rekening || '138-00-1928374-1'}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {gaji.jurnal_id ? `Ref Jurnal: #${gaji.jurnal_id}` : 'Jurnal terbit otomatis saat bayar'}
            </span>
          </div>
        </div>
      </div>

      {/* Rincian Komponen: Pendapatan vs Potongan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom 1: Komponen Penerimaan / Pendapatan */}
        <div className="card p-6 border border-slate-200">
          <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
            <DollarSign size={16} /> 1. Komponen Penghasilan & Tunjangan
          </h4>

          <div className="space-y-3 text-xs">
            {detailPendapatan.length > 0 ? (
              detailPendapatan.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">{item.nama_komponen}</span>
                    {item.keterangan && (
                      <span className="text-[11px] text-slate-500 block">{item.keterangan}</span>
                    )}
                  </div>
                  <span className="font-bold text-emerald-600 whitespace-nowrap">
                    +{formatRupiah(item.nominal)}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800">Gaji Pokok</span>
                  <span className="font-bold text-emerald-600">+{formatRupiah(gaji.gaji_pokok)}</span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">Insentif Transport & Kehadiran</span>
                    <span className="text-[11px] text-slate-500">{gaji.jumlah_hari_hadir_tepat_waktu ?? 0} Hari Hadir Tepat Waktu</span>
                  </div>
                  <span className="font-bold text-emerald-600">+{formatRupiah(gaji.total_biaya_transport || 0)}</span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">Honor SKS Mengajar Perkuliahan</span>
                    <span className="text-[11px] text-slate-500">{gaji.total_sks_diampu ?? 0} SKS Diampu</span>
                  </div>
                  <span className="font-bold text-emerald-600">+{formatRupiah(gaji.total_honor_sks || 0)}</span>
                </div>
              </>
            )}

            <div className="pt-2 flex justify-between font-bold text-slate-900 border-t border-slate-300">
              <span>TOTAL PENGHASILAN BRUTO</span>
              <span className="text-emerald-700">
                +{formatRupiah(gaji.gaji_pokok + (gaji.total_tunjangan || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Komponen Potongan */}
        <div className="card p-6 border border-slate-200">
          <h4 className="font-bold text-sm text-rose-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
            <CreditCard size={16} /> 2. Komponen Potongan (Pajak & Iuran)
          </h4>

          <div className="space-y-3 text-xs">
            {detailPotongan.length > 0 ? (
              detailPotongan.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">{item.nama_komponen}</span>
                    {item.keterangan && (
                      <span className="text-[11px] text-slate-500 block">{item.keterangan}</span>
                    )}
                  </div>
                  <span className="font-bold text-rose-600 whitespace-nowrap">
                    -{formatRupiah(item.nominal)}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">Pajak Penghasilan (PPh 21)</span>
                    <span className="text-[11px] text-slate-500">Estimasi Tarif Efektif Bulanan</span>
                  </div>
                  <span className="font-bold text-rose-600">-{formatRupiah(gaji.total_pph21 || 0)}</span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800">Iuran BPJS (Kesehatan & TK)</span>
                  <span className="font-bold text-rose-600">-{formatRupiah(gaji.total_bpjs || 0)}</span>
                </div>
              </>
            )}

            <div className="pt-2 flex justify-between font-bold text-slate-900 border-t border-slate-300">
              <span>TOTAL POTONGAN RESMI</span>
              <span className="text-rose-700">
                -{formatRupiah(gaji.total_potongan || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Take Home Pay Banner */}
      <div className="card p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-4 rounded-xl print:hidden">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Penerimaan Bersih Pegawai (Take Home Pay)</span>
          <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
            {formatRupiah(gaji.gaji_bersih)}
          </p>
        </div>

        <div className="text-right text-xs text-slate-400">
          <p>Dokumen ini diterbitkan sah secara elektronik oleh Sistem Informasi Kepegawaian (SIMPEG)</p>
          <p>Terintegrasi dengan Modul Keuangan & Akuntansi Kampus (SIKEU).</p>
        </div>
      </div>
      </div>

      {/* ========================================================================= */}
      {/* LEMBAR CETAK DOKUMEN SLIP GAJI RESMI A4 (PRINT ONLY / PREVIEW)            */}
      {/* ========================================================================= */}
      <div className="printable-document print-document hidden print:block bg-white text-slate-950 font-sans p-6 space-y-5 border border-slate-300 rounded-lg max-w-[210mm] mx-auto">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="w-14 h-14 bg-[var(--module-primary)] text-white font-bold flex items-center justify-center rounded text-sm shrink-0">
            POLTEK
          </div>
          <div className="flex-1 text-center px-4">
            <h3 className="text-xs font-bold tracking-widest text-slate-700 uppercase">
              YAYASAN PENDIDIKAN TINGGI SURAKARTA
            </h3>
            <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wide">
              POLITEKNIK INDONUSA SURAKARTA
            </h2>
            <h4 className="text-xs font-bold text-[var(--module-primary)] uppercase">
              SLIP GAJI & BUKTI PENGHASILAN PEGAWAI
            </h4>
            <p className="text-[9px] text-slate-600 mt-0.5">
              Jl. KH Samanhudi No. 84-86, Surakarta, Jawa Tengah 57142 | Periode: {gaji.periode_bulan_tahun}
            </p>
          </div>
          <div className="w-14 text-right text-[9px] font-mono text-slate-500 shrink-0">
            ID #{gaji.id}
          </div>
        </div>

        {/* Data Pegawai & Akun Pembayaran */}
        <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-3">
          <div className="space-y-1">
            <div className="flex"><span className="w-28 text-slate-500">Nama Pegawai</span><span className="font-bold">: {gaji.pegawai?.nama_lengkap || '-'}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">NIP / NIDN</span><span className="font-mono">: {gaji.pegawai?.nip || gaji.pegawai?.nidn || '-'}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Unit Kerja</span><span>: {gaji.pegawai?.unit_kerja?.nama || 'Institut'}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Status Pegawai</span><span className="capitalize">: {gaji.pegawai?.jenis_pegawai || 'Pegawai'} ({gaji.pegawai?.status_kepegawaian || 'Tetap'})</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex"><span className="w-28 text-slate-500">Periode Gaji</span><span className="font-bold">: {gaji.periode_bulan_tahun}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Penyaluran Bank</span><span>: {gaji.bank_nama || 'Bank Mandiri'} ({gaji.nomor_rekening || '-'})</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Status Slip</span><span className="font-bold text-emerald-700">: LUNAS / DITERBITKAN</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Tanggal Transfer</span><span>: {gaji.tanggal_transfer ? formatDateTime(gaji.tanggal_transfer) : 'Diproses Keuangan'}</span></div>
          </div>
        </div>

        {/* Tabel Rincian Penghasilan vs Potongan */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Kolom Penerimaan */}
          <div className="border border-slate-300 rounded p-3 space-y-2">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
              A. Penghasilan & Tunjangan
            </div>
            {detailPendapatan.length > 0 ? (
              detailPendapatan.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <span className="block font-medium">{item.nama_komponen}</span>
                    {item.keterangan && <span className="text-[10px] text-slate-500 block">{item.keterangan}</span>}
                  </div>
                  <span className="font-semibold text-right tabular-nums">{formatRupiah(item.nominal)}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Gaji Pokok</span>
                  <span className="font-semibold tabular-nums">{formatRupiah(gaji.gaji_pokok)}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>Tunjangan Kehadiran</span>
                    <span className="text-[10px] text-slate-500 block">{gaji.jumlah_hari_hadir_tepat_waktu ?? 0} Hari Hadir</span>
                  </div>
                  <span className="font-semibold tabular-nums">{formatRupiah(gaji.total_biaya_transport || 0)}</span>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-slate-900">
              <span>Total Penghasilan (Bruto)</span>
              <span className="tabular-nums">{formatRupiah(gaji.gaji_pokok + (gaji.total_tunjangan || 0))}</span>
            </div>
          </div>

          {/* Kolom Potongan */}
          <div className="border border-slate-300 rounded p-3 space-y-2">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
              B. Potongan Resmi
            </div>
            {detailPotongan.length > 0 ? (
              detailPotongan.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <span className="block font-medium">{item.nama_komponen}</span>
                    {item.keterangan && <span className="text-[10px] text-slate-500 block">{item.keterangan}</span>}
                  </div>
                  <span className="font-semibold text-right tabular-nums">-{formatRupiah(item.nominal)}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between">
                  <span>PPh Pasal 21</span>
                  <span className="font-semibold tabular-nums">-{formatRupiah(gaji.total_pph21 || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iuran BPJS</span>
                  <span className="font-semibold tabular-nums">-{formatRupiah(gaji.total_bpjs || 0)}</span>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-rose-700">
              <span>Total Potongan</span>
              <span className="tabular-nums">-{formatRupiah(gaji.total_potongan || 0)}</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Take Home Pay */}
        <div className="border-2 border-slate-900 p-3 rounded flex justify-between items-center text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Penerimaan Bersih (Take Home Pay)</span>
            <span className="text-base font-black text-slate-900 tabular-nums">{formatRupiah(gaji.gaji_bersih)}</span>
          </div>
          <div className="text-right text-[10px] text-slate-600 italic">
            {gaji.catatan || `Kompensasi resmi periode ${gaji.periode_bulan_tahun}`}
          </div>
        </div>

        {/* Tanda Tangan Pengesahan */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-4">
          <div className="text-center space-y-12">
            <p className="text-slate-500 text-[10px]">Penerima Gaji,</p>
            <div>
              <p className="font-bold underline">{gaji.pegawai?.nama_lengkap || 'Pegawai'}</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP: {gaji.pegawai?.nip || '-'}</p>
            </div>
          </div>
          <div className="text-center space-y-12">
            <p className="text-slate-500 text-[10px]">Surakarta, Bagian Keuangan & Penggajian,</p>
            <div>
              <p className="font-bold underline">Bendahara / Bagian Keuangan SIKEU</p>
              <p className="text-[10px] text-slate-500">Politeknik Indonusa Surakarta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
