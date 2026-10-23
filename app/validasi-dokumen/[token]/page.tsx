'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Building2,
  User,
  GraduationCap,
  ShieldCheck,
  Loader2,
  FileText,
  Hash,
} from 'lucide-react';
import { siakadService } from '@/services/siakad.service';

export default function ValidasiDokumenPublikPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? decodeURIComponent(params.token) : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token dokumen tidak ditentukan.');
      setLoading(false);
      return;
    }
    const verify = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await siakadService.validasiDokumenPublic(token);
        if (res?.status === 'success' && res.data) {
          setData(res.data);
        } else {
          setErrorMsg(res?.message || 'Dokumen tidak ditemukan.');
        }
      } catch (err: any) {
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memverifikasi dokumen. Token tidak valid atau tidak terdaftar di sistem.'
        );
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const snap = data?.snapshot || {};

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-5 my-auto">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              Validasi Dokumen Akademik
            </h1>
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              KHS & Transkrip — Verifikasi Keaslian Digital
            </p>
            <p className="text-2xs text-slate-500 mt-0.5">
              Bagian Administrasi Akademik • Sistem Terpadu Perkuliahan
            </p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 shadow-xs text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-primary-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Memverifikasi dokumen...</p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-xs text-center space-y-3">
            <XCircle size={40} className="text-rose-500 mx-auto" />
            <h2 className="text-sm font-black text-slate-900 uppercase">Dokumen Tidak Valid</h2>
            <p className="text-xs text-slate-500">{errorMsg}</p>
          </div>
        )}

        {!loading && data && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
            <div className="text-center space-y-1">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <h2 className="text-sm font-black text-slate-900 uppercase">Dokumen Valid & Terdaftar</h2>
              <p className="text-2xs text-slate-500">Diverifikasi: {data.verified_at}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs border-t border-slate-100 pt-4">
              <p className="flex items-center gap-2"><FileText size={14} className="text-slate-400" /> <strong>{data.jenis}</strong> • Periode {data.periode || '-'}</p>
              <p className="flex items-center gap-2"><Hash size={14} className="text-slate-400" /> <span className="font-mono">{data.nomor_dokumen}</span></p>
              <p className="flex items-center gap-2"><User size={14} className="text-slate-400" /> <strong>{data.mahasiswa?.nama_lengkap}</strong></p>
              <p className="flex items-center gap-2"><GraduationCap size={14} className="text-slate-400" /> <span className="font-mono">{data.mahasiswa?.nim}</span> • {data.mahasiswa?.program_studi}</p>
              <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-slate-400" />
                {data.jenis === 'KHS'
                  ? <span>IPS <strong className="font-mono">{snap.ips}</strong> • SKS {snap.sks_semester} • IPK <strong className="font-mono">{snap.ipk}</strong></span>
                  : <span>SKS Lulus <strong className="font-mono">{snap.total_sks_lulus}</strong> • IPK <strong className="font-mono">{snap.ipk}</strong> • {snap.predikat}</span>}
              </p>
            </div>
            <p className="text-2xs text-slate-400 text-center">Diterbitkan: {data.tanggal_terbit} • Cocokkan angka di atas dengan dokumen fisik.</p>
          </div>
        )}
      </div>
    </div>
  );
}
