'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  User,
  GraduationCap,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Receipt,
  Wallet
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ValidationResult {
  kode_transaksi: string;
  status: string;
  is_valid: boolean;
  verified_at: string;
  waktu_bayar: string;
  jumlah_bayar: number;
  channel_bayar: string;
  channel_label: string;
  kasir: string;
  catatan?: string;
  mahasiswa: {
    nama_mahasiswa: string;
    nim?: string;
    no_pendaftaran?: string;
    is_calon_mahasiswa?: boolean;
    program_studi: string;
    tahun_angkatan?: number | string;
  };
  tagihan: {
    id?: number;
    nomor_tagihan: string;
    uraian: string;
    total_tagihan: number;
    total_bayar: number;
    sisa: number;
    status: string;
  };
  security_hash: string;
}

export default function ValidasiPembayaranPublikPage() {
  const params = useParams();
  const router = useRouter();
  const kodeTransaksi = typeof params?.kode === 'string' ? decodeURIComponent(params.kode) : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!kodeTransaksi) {
      setErrorMsg('Kode transaksi pembayaran tidak ditentukan.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await sikeuService.validatePembayaranPublic(kodeTransaksi);
        if (res?.status === 'success' && res.data) {
          setData(res.data);
        } else {
          setErrorMsg(res?.message || 'Dokumen transaksi pembayaran tidak ditemukan.');
        }
      } catch (err: any) {
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memverifikasi dokumen. Kode transaksi tidak valid atau tidak terdaftar di sistem.'
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [kodeTransaksi]);

  const handleCopyCode = () => {
    if (!data?.kode_transaksi) return;
    navigator.clipboard.writeText(data.kode_transaksi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-5 my-auto">
        {/* KOP RESMI INSTITUSI */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              UNIVERSITAS SSO CAMPUS
            </h1>
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              Layanan Validasi & Verifikasi Dokumen Pembayaran Digital
            </p>
            <p className="text-2xs text-slate-500 mt-0.5">
              Bagian Administrasi Keuangan • Sistem Terpadu Pembayaran Kuliah
            </p>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 shadow-xs text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-primary-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Sedang Memverifikasi Dokumen...</h3>
              <p className="text-2xs text-slate-500 font-mono">Kode: {kodeTransaksi}</p>
            </div>
          </div>
        )}

        {/* ERROR / TIDAK VALID STATE */}
        {!loading && errorMsg && (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-rose-900">
                Dokumen Tidak Terverifikasi
              </h2>
              <p className="text-xs text-rose-700 leading-relaxed max-w-md mx-auto">
                {errorMsg}
              </p>
              <div className="bg-rose-50/80 rounded-xl p-2.5 font-mono text-xs text-rose-800 border border-rose-100 max-w-sm mx-auto mt-2">
                Nomor Referensi: {kodeTransaksi || '-'}
              </div>
            </div>
            <p className="text-2xs text-slate-400">
              Jika Anda merasa memiliki bukti fisik kuitansi ini, silakan konfirmasi langsung ke Bagian Keuangan Kampus.
            </p>
          </div>
        )}

        {/* SUCCESS / VERIFIED STATE */}
        {!loading && data && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
            {/* STATUS BANNER */}
            <div
              className={`p-5 text-center ${
                data.is_valid
                  ? 'bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100'
                  : 'bg-gradient-to-b from-amber-50 to-white border-b border-amber-100'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xs ${
                  data.is_valid
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                    : 'bg-amber-500 text-white ring-4 ring-amber-100'
                }`}
              >
                {data.is_valid ? <CheckCircle2 size={30} /> : <AlertTriangle size={30} />}
              </div>
              <h2
                className={`text-base sm:text-lg font-black tracking-tight ${
                  data.is_valid ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                {data.is_valid
                  ? 'DOKUMEN SAH & TERVERIFIKASI'
                  : `STATUS TRANSAKSI: ${data.status.toUpperCase()}`}
              </h2>
              <p className="text-2xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Tanda bukti pembayaran ini tercatat resmi di database keuangan universitas dan dinyatakan sah.
              </p>
            </div>

            {/* KODE TRANSAKSI & WAKTU */}
            <div className="p-4 bg-slate-50/60 flex items-center justify-between gap-2">
              <div>
                <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider block">
                  Nomor Transaksi
                </span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {data.kode_transaksi}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>

            {/* IDENTITAS MAHASISWA */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={15} className="text-primary-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Identitas Penyetor / Mahasiswa
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-2xs text-slate-500 block">Nama Lengkap</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {data.mahasiswa?.nama_mahasiswa || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">NIM / No. Pendaftaran</span>
                  <span className="font-mono font-bold text-slate-800">
                    {data.mahasiswa?.nim && data.mahasiswa.nim !== '-'
                      ? data.mahasiswa.nim
                      : data.mahasiswa?.no_pendaftaran || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Program Studi</span>
                  <span className="font-semibold text-slate-800">
                    {data.mahasiswa?.program_studi || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Status Akademik</span>
                  <span className="font-semibold text-slate-800">
                    {data.mahasiswa?.is_calon_mahasiswa ? 'Calon Mahasiswa (SPMB)' : 'Mahasiswa Aktif (SIAKAD)'}
                    {data.mahasiswa?.tahun_angkatan ? ` • Angkatan ${data.mahasiswa.tahun_angkatan}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* RINCIAN TAGIHAN & PEMBAYARAN */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Receipt size={15} className="text-primary-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Transaksi Pembayaran
                </h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nomor Invoice Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data.tagihan?.nomor_tagihan || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Komponen Biaya / Uraian:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[240px]">
                    {data.tagihan?.uraian || 'Biaya Pendidikan Mahasiswa'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Kanal Pembayaran:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {data.channel_bayar === 'LOKET_TUNAI' ? (
                      <Wallet size={13} className="text-emerald-600" />
                    ) : (
                      <CreditCard size={13} className="text-blue-600" />
                    )}
                    {data.channel_label}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Waktu Transaksi:</span>
                  <span className="font-medium text-slate-800">{data.waktu_bayar || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Petugas / Sistem:</span>
                  <span className="font-medium text-slate-800">{data.kasir}</span>
                </div>

                {/* BANNER TOTAL DITERIMA */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between mt-2 shadow-xs">
                  <div>
                    <span className="text-2xs uppercase tracking-wider font-bold text-slate-400 block">
                      Jumlah Pembayaran Diterima
                    </span>
                    <span className="text-xs text-slate-300 font-medium">Lunas Resmi</span>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-lg sm:text-xl">
                    {formatRupiah(data.jumlah_bayar)}
                  </span>
                </div>

                {data.tagihan?.sisa !== undefined && (
                  <div className="flex justify-between text-2xs pt-1 px-1">
                    <span className="text-slate-500">Sisa Tagihan Setelah Bayar:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(data.tagihan.sisa)} {data.tagihan.sisa <= 0 ? '(LUNAS PENUH)' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* KEAMANAN & DIGITAL STAMP */}
            <div className="p-4 bg-slate-50/70 text-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Terverifikasi Otomatis oleh Sistem Keuangan Kampus</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Dokumen digital ini memiliki keabsahan hukum sebagai tanda terima pembayaran sah. Tidak memerlukan tanda tangan basah atau stempel manual.
              </p>
              <div className="font-mono text-[10px] text-slate-400 truncate pt-1">
                Security Hash: {data.security_hash}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center text-2xs text-slate-400 space-y-1">
          <p>&copy; {new Date().getFullYear()} Universitas SSO Campus. All rights reserved.</p>
          <p>Sistem Terintegrasi Kampus Modern • Keuangan & Pembayaran Terpadu</p>
        </div>
      </div>
    </div>
  );
}
