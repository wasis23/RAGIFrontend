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
import { formatRupiah } from '@/lib/utils';
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
            {gaji.tanggal_transfer ? `Ditransfer: ${gaji.tanggal_transfer}` : 'Belum diproses transfer'}
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
      <div className="card p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-4 rounded-xl">
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
  );
}
