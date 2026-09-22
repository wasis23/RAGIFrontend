'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  User,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Receipt,
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';

interface DispensasiValidationResult {
  nomor_dispensasi: string;
  status: string;
  is_valid: boolean;
  verified_at: string;
  tipe_dispensasi: string;
  nominal_per_cicilan: number;
  jumlah_cicilan?: number;
  jatuh_tempo_baru?: string;
  tanggal_persetujuan?: string;
  mahasiswa: {
    nama_mahasiswa: string;
    nim?: string;
    program_studi: string;
    tahun_angkatan?: number;
  };
  tagihan: {
    nomor_tagihan: string;
    total_tagihan: number;
    total_bayar: number;
    sisa: number;
    status: string;
  };
  security_hash: string;
}

export default function ValidasiDispensasiPublikPage() {
  const params = useParams();
  const signatureHash = typeof params?.kode === 'string' ? decodeURIComponent(params.kode) : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DispensasiValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!signatureHash) {
      setErrorMsg('Kode verifikasi surat dispensasi tidak ditentukan.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await sikeuService.validateDispensasiPublic(signatureHash);
        if (res?.status === 'success' && res.data) {
          setData(res.data);
        } else {
          setErrorMsg(res?.message || 'Surat dispensasi tidak ditemukan.');
        }
      } catch (err: any) {
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memverifikasi dokumen. Kode tidak valid atau tidak terdaftar di sistem.'
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [signatureHash]);

  const handleCopyCode = () => {
    if (!data?.security_hash) return;
    navigator.clipboard.writeText(data.security_hash);
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
              Layanan Validasi Surat Dispensasi Pembayaran
            </p>
            <p className="text-2xs text-slate-500 mt-0.5">
              Wakil Rektor II Bidang Keuangan & Sumber Daya
            </p>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 shadow-xs text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-primary-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Sedang Memverifikasi Dokumen...</h3>
              <p className="text-2xs text-slate-500 font-mono">Kode: {signatureHash}</p>
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
                Nomor Referensi: {signatureHash || '-'}
              </div>
            </div>
            <p className="text-2xs text-slate-400">
              Jika Anda merasa memiliki surat dispensasi yang sah, silakan konfirmasi langsung ke Bagian Keuangan Kampus.
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
                  ? 'SURAT SAH & TERVERIFIKASI'
                  : `STATUS SURAT: ${data.status.toUpperCase()}`}
              </h2>
              <p className="text-2xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Surat dispensasi ini tercatat resmi di database keuangan universitas dan dinyatakan sah.
              </p>
            </div>

            {/* NOMOR SURAT */}
            <div className="p-4 bg-slate-50/60 flex items-center justify-between gap-2">
              <div>
                <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider block">
                  Nomor Surat Dispensasi
                </span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {data.nomor_dispensasi}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Tersalin' : 'Salin Hash'}</span>
              </button>
            </div>

            {/* IDENTITAS MAHASISWA */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={15} className="text-primary-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Identitas Mahasiswa
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
                  <span className="text-2xs text-slate-500 block">NIM</span>
                  <span className="font-mono font-bold text-slate-800">
                    {data.mahasiswa?.nim || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Program Studi</span>
                  <span className="font-semibold text-slate-800">
                    {data.mahasiswa?.program_studi || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Angkatan</span>
                  <span className="font-semibold text-slate-800">
                    {data.mahasiswa?.tahun_angkatan || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* RINCIAN DISPENSASI */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Receipt size={15} className="text-primary-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Skema Dispensasi Disetujui
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
                  <span className="text-slate-500">Nominal per Cicilan:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatRupiah(data.nominal_per_cicilan)}
                  </span>
                </div>
                {data.jumlah_cicilan ? (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Jumlah Tahapan:</span>
                    <span className="font-bold text-slate-900">{data.jumlah_cicilan} kali</span>
                  </div>
                ) : null}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Batas Pelunasan Baru:</span>
                  <span className="font-mono font-bold text-slate-900">{data.jatuh_tempo_baru || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Sudah Dibayar / Sisa:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(data.tagihan?.total_bayar || 0)} / {formatRupiah(data.tagihan?.sisa || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Tanggal Persetujuan:</span>
                  <span className="font-medium text-slate-800">{data.tanggal_persetujuan || '-'}</span>
                </div>
              </div>
            </div>

            {/* KEAMANAN & DIGITAL STAMP */}
            <div className="p-4 bg-slate-50/70 text-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Terverifikasi Otomatis oleh Sistem Keuangan Kampus</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Surat digital ini memiliki keabsahan sebagai keterangan dispensasi sah. Tidak memerlukan tanda tangan basah atau stempel manual.
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
