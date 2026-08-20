'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
  GraduationCap,
  UploadCloud,
  FileCheck,
  Award,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  LayoutGrid,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { spmbService, PendaftaranCalonMhs, GelombangPenerimaan } from '@/services/spmb.service';

export default function SPMBDashboardPage() {
  const { user } = useAuth();
  const [pendaftaran, setPendaftaran] = useState<PendaftaranCalonMhs | null>(null);
  const [gelombangList, setGelombangList] = useState<GelombangPenerimaan[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pendaftaranRes, gelombangRes, prodiRes] = await Promise.all([
        spmbService.getMyPendaftaran().catch(() => null),
        spmbService.getGelombang().catch(() => null),
        spmbService.getProgramStudi().catch(() => null),
      ]);

      if (pendaftaranRes?.data?.pendaftaran) {
        setPendaftaran(pendaftaranRes.data.pendaftaran);
      } else if (pendaftaranRes?.data && !pendaftaranRes.data.pendaftaran && pendaftaranRes.data.id) {
        setPendaftaran(pendaftaranRes.data);
      }

      if (gelombangRes?.data) {
        const list = Array.isArray(gelombangRes.data)
          ? gelombangRes.data
          : gelombangRes.data.data || [];
        setGelombangList(list);
      }

      if (prodiRes?.data) {
        const pList = Array.isArray(prodiRes.data)
          ? prodiRes.data
          : prodiRes.data.data || [];
        setProdiList(pList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const displayUser = user || {
    username: 'Calon Mahasiswa',
    email: 'calon@kampus.ac.id',
  };

  // ── Determine Status & Progress State ─────────────────────────────
  const status = pendaftaran?.status || 'none';

  let statusConfig = {
    badgeText: 'Belum Mendaftar',
    badgeClass: 'badge-gray',
    title: 'Pendaftaran Belum Dimulai',
    desc: 'Anda belum memiliki pendaftaran aktif. Silakan pilih gelombang pendaftaran yang tersedia untuk mulai mendaftar.',
    progressPct: 0,
    completedSteps: 0,
    ctaText: 'Mulai Pendaftaran Sekarang',
    ctaLink: '/spmb/registrasi',
    variant: 'neutral',
  };

  if (status === 'draft') {
    statusConfig = {
      badgeText: 'Draft / Belum Lengkap',
      badgeClass: 'badge-yellow',
      title: 'Pendaftaran Belum Di-Finalisasi',
      desc: 'Biodata Anda telah tersimpan sebagai draft. Silakan lengkapi berkas dan lakukan finalisasi pendaftaran.',
      progressPct: 40,
      completedSteps: 2,
      ctaText: 'Lengkapi & Finalisasi Pendaftaran',
      ctaLink: '/spmb/registrasi',
      variant: 'warning',
    };
  } else if (status === 'submitted') {
    statusConfig = {
      badgeText: 'Menunggu Verifikasi',
      badgeClass: 'badge-cyan',
      title: 'Berkas Sedang Diverifikasi Panitia',
      desc: 'Pendaftaran Anda telah dikirim dan sedang diperiksa oleh panitia SPMB. Harap periksa status secara berkala.',
      progressPct: 66,
      completedSteps: 3,
      ctaText: 'Lihat Detail Pendaftaran',
      ctaLink: '/spmb/pendaftaran',
      variant: 'info',
    };
  } else if (status === 'verified' || status === 'lulus_administrasi') {
    statusConfig = {
      badgeText: 'Lulus Administrasi',
      badgeClass: 'badge-green',
      title: 'Selamat! Berkas Terverifikasi',
      desc: 'Persyaratan administrasi Anda telah memenuhi syarat. Silakan cek jadwal tes/seleksi masuk Anda.',
      progressPct: 83,
      completedSteps: 4,
      ctaText: 'Cek Jadwal & Ujian',
      ctaLink: '/spmb/ujian',
      variant: 'success',
    };
  } else if (status === 'gagal_administrasi') {
    statusConfig = {
      badgeText: 'Berkas Perlu Perbaikan',
      badgeClass: 'badge-red',
      title: 'Verifikasi Berkas Memerlukan Perbaikan',
      desc: 'Beberapa dokumen pendaftaran Anda tidak sesuai dengan ketentuan. Silakan unggah ulang dokumen yang diminta.',
      progressPct: 50,
      completedSteps: 2,
      ctaText: 'Perbaiki Berkas Pendaftaran',
      ctaLink: '/spmb/registrasi',
      variant: 'danger',
    };
  }

  // Active wave info
  const activeGelombang = pendaftaran?.gelombang_penerimaan || gelombangList.find(g => g.status === 'aktif') || gelombangList[0];

  // Document uploaded count
  const uploadedDocs = pendaftaran?.dokumen_pendaftaran || [];
  const verifiedDocsCount = uploadedDocs.filter(d => d.is_verified).length;

  const isPembayaranLunas = pendaftaran?.status_pembayaran === 'lunas' || pendaftaran?.status_pembayaran === 'gratis';
  const isBiodataFilled = !!pendaftaran?.nama_lengkap;
  const isDokumenUploaded = uploadedDocs.length > 0;
  const isSubmitted = status === 'submitted' || status === 'verified' || status === 'lulus_administrasi';
  const isVerified = status === 'verified' || status === 'lulus_administrasi';

  // Workflow steps definition (6 Tahap Utama Calon Mahasiswa)
  const steps = [
    { label: 'Biodata', key: 'biodata', done: isBiodataFilled },
    { label: 'Pembayaran', key: 'pembayaran', done: isPembayaranLunas },
    { label: 'Unggah Berkas', key: 'berkas', done: isDokumenUploaded || isSubmitted },
    { label: 'Finalisasi', key: 'finalize', done: isSubmitted },
    { label: 'Verifikasi & Ujian', key: 'verifikasi', done: isVerified },
    { label: 'Pengumuman', key: 'pengumuman', done: false },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const currentStepIdx = steps.findIndex(s => !s.done);
  const activeStepIdx = currentStepIdx === -1 ? 5 : currentStepIdx;

  if (status === 'draft') {
    if (!isPembayaranLunas) {
      statusConfig = {
        badgeText: 'Belum Bayar Formulir',
        badgeClass: 'badge-yellow',
        title: 'Silakan Lakukan Pembayaran Biaya Pendaftaran',
        desc: 'Biodata Anda telah tersimpan. Silakan lakukan pembayaran biaya pendaftaran via Virtual Account agar dapat mengunggah berkas & memfinalisasi pendaftaran.',
        progressPct: 20,
        completedSteps: completedCount,
        ctaText: 'Bayar Biaya Pendaftaran / Lihat VA',
        ctaLink: '/spmb/registrasi',
        variant: 'warning',
      };
    } else {
      statusConfig = {
        badgeText: 'Pembayaran Lunas (Draft)',
        badgeClass: 'badge-cyan',
        title: 'Pembayaran Lunas — Unggah Berkas & Finalisasi',
        desc: 'Pembayaran biaya pendaftaran Anda telah dikonfirmasi lunas. Silakan unggah dokumen persyaratan dan selesaikan finalisasi pendaftaran.',
        progressPct: 40,
        completedSteps: completedCount,
        ctaText: 'Unggah Berkas & Finalisasi',
        ctaLink: '/spmb/registrasi',
        variant: 'info',
      };
    }
  }

  return (
    <div className="spmb-app-page animate-fade-in">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Portal Pendaftaran SPMB"
        description="Pantau status pendaftaran, progress kelengkapan berkas, dan tahapan penerimaan Anda"
      />

      {/* ── Welcome & Status Hero Card ─────────────────────────────── */}
      <div className={`spmb-hero-card spmb-hero-${statusConfig.variant}`}>
        <div className="spmb-hero-blob spmb-hero-blob-1" aria-hidden />
        <div className="spmb-hero-blob spmb-hero-blob-2" aria-hidden />

        <div className="spmb-hero-content">
          <div className="spmb-hero-main">
            <div className="spmb-hero-badge-row">
              <span className={`badge ${statusConfig.badgeClass} spmb-status-pill`}>
                <span className="spmb-pill-dot" />
                {statusConfig.badgeText}
              </span>
              {pendaftaran?.no_pendaftaran && (
                <span className="spmb-nopend-badge">
                  No. Reg: {pendaftaran.no_pendaftaran}
                </span>
              )}
            </div>

            <h2 className="spmb-hero-title">
              Halo, {pendaftaran?.nama_lengkap || displayUser.username}! 👋
            </h2>
            <p className="spmb-hero-desc">{statusConfig.desc}</p>

            {/* Progress Bar inside Hero */}
            <div className="spmb-hero-progress-box">
              <div className="spmb-hero-progress-header">
                <span>Progress Pendaftaran</span>
                <span className="font-bold">{statusConfig.progressPct}%</span>
              </div>
              <div className="spmb-hero-progress-track">
                <div
                  className="spmb-hero-progress-bar"
                  style={{ width: `${statusConfig.progressPct}%` }}
                />
              </div>
            </div>

            {/* Hero CTA Button */}
            <div className="spmb-hero-cta-wrap">
              <Link href={statusConfig.ctaLink} className="spmb-hero-btn-primary">
                <span>{statusConfig.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Applicant KPI Summary Cards ─────────────────────── */}
      <div className="spmb-kpi-grid">
        <div className="spmb-kpi-card card">
          <div className="spmb-kpi-top">
            <span className="spmb-kpi-label">Status Pendaftaran</span>
            <div className="spmb-kpi-icon stat-icon-blue">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="spmb-kpi-value">{statusConfig.badgeText}</div>
          <div className="spmb-kpi-sub">
            {pendaftaran ? `ID Pendaftaran: #${pendaftaran.id}` : 'Belum membuat draf'}
          </div>
        </div>

        <div className="spmb-kpi-card card">
          <div className="spmb-kpi-top">
            <span className="spmb-kpi-label">Kelengkapan Berkas</span>
            <div className="spmb-kpi-icon stat-icon-green">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="spmb-kpi-value">
            {uploadedDocs.length} Dokumen
          </div>
          <div className="spmb-kpi-sub">
            {verifiedDocsCount} dokumen terverifikasi
          </div>
        </div>

        <div className="spmb-kpi-card card">
          <div className="spmb-kpi-top">
            <span className="spmb-kpi-label">Gelombang Penerimaan</span>
            <div className="spmb-kpi-icon stat-icon-amber">
              <Calendar size={18} />
            </div>
          </div>
          <div className="spmb-kpi-value">
            {activeGelombang?.nama || 'Gelombang 1'}
          </div>
          <div className="spmb-kpi-sub">
            {activeGelombang?.status === 'aktif' ? 'Sedang Dibuka' : 'Status: Off'}
          </div>
        </div>

        <div className="spmb-kpi-card card">
          <div className="spmb-kpi-top">
            <span className="spmb-kpi-label">Program Studi Pilihan</span>
            <div className="spmb-kpi-icon stat-icon-indigo">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="spmb-kpi-value text-sm sm:text-base font-bold text-slate-900 truncate" title={
            (pendaftaran as any)?.program_studi?.nama ||
            (pendaftaran as any)?.program_studi?.nama_prodi ||
            prodiList.find((p) => String(p.id) === String(pendaftaran?.program_studi_id))?.nama ||
            ''
          }>
            {
              (pendaftaran as any)?.program_studi?.nama ||
              (pendaftaran as any)?.program_studi?.nama_prodi ||
              prodiList.find((p) => String(p.id) === String(pendaftaran?.program_studi_id))?.nama ||
              (pendaftaran?.program_studi_id ? `Prodi #${pendaftaran.program_studi_id}` : 'Belum Dipilih')
            }
          </div>
          <div className="spmb-kpi-sub">Pilihan Utama</div>
        </div>
      </div>

      {/* ── Stepper / Progress Flow Section ───────────────────────────── */}
      <div className="card spmb-stepper-card">
        <div className="card-header border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary-600" />
            <h3 className="font-bold text-slate-900 text-base">Alur &amp; Tahapan Pendaftaran</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {completedCount} dari 6 Tahap Selesai
          </span>
        </div>

        <div className="card-body">
          <div className="spmb-stepper-track">
            {steps.map((step, idx) => {
              const isCurrent = idx === activeStepIdx;
              return (
                <div
                  key={step.key}
                  className={`spmb-stepper-item ${
                    step.done ? 'is-done' : isCurrent ? 'is-current' : 'is-pending'
                  }`}
                >
                  <div className="spmb-stepper-circle">
                    {step.done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span className="spmb-stepper-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Grid (Content & Sidebar) ────────────────────────────── */}
      <div className="spmb-main-grid">

        {/* ── Left / Main Content ────────────────────────────────────── */}
        <div className="spmb-main-col">

          {/* Action / Next Steps Detailed Banner */}
          <div className="card p-5 border-l-4 border-l-primary-600 bg-white">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl flex-shrink-0 mt-0.5">
                <Info size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base mb-1">
                  Langkah Selanjutnya untuk Anda
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {status === 'none' && 'Segera buat akun pendaftaran dan isi data diri awal Anda untuk mendapatkan Nomor Registrasi Pendaftaran.'}
                  {status === 'draft' && 'Lengkapi form biodata diri, data orang tua/wali, serta pastikan Anda telah mengunggah dokumen persyaratan.'}
                  {status === 'submitted' && 'Tim administrasi sedang memeriksa kelengkapan berkas Anda. Pantau halaman ini secara berkala.'}
                  {(status === 'verified' || status === 'lulus_administrasi') && 'Berkas Anda sudah Lulus Administrasi! Cetak kartu ujian atau bersiap mengikuti tes seleksi sesuai jadwal.'}
                  {status === 'gagal_administrasi' && 'Periksa catatan perbaikan berkas di bawah, perbaiki dokumen yang ditolak, lalu simpan ulang.'}
                </p>
                <Link href={statusConfig.ctaLink} className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700">
                  <span>{statusConfig.ctaText}</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Document Status Section */}
          <div className="card overflow-hidden">
            <div className="card-header border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                <h3 className="font-bold text-slate-900 text-base">Berkas Pendaftaran Saya</h3>
              </div>
              <Link href="/spmb/registrasi" className="text-xs font-semibold text-primary-600 hover:underline">
                Kelola Berkas →
              </Link>
            </div>

            <div className="card-body p-0">
              <div className="divide-y divide-slate-100">
                {[
                  { key: 'pas_foto', label: 'Pas Foto Resmi (3x4)', required: true },
                  { key: 'ktp', label: 'KTP / Kartu Pelajar', required: true },
                  { key: 'kk', label: 'Kartu Keluarga (KK)', required: true },
                  { key: 'ijazah', label: 'Ijazah / SKL', required: true },
                  { key: 'rapor', label: 'Transkrip Nilai / Rapor', required: false },
                ].map((masterItem) => {
                  const uploaded = uploadedDocs.find(
                    (d) => (d.jenis_berkas || d.jenis_dokumen) === masterItem.key
                  );
                  const isUploaded = Boolean(uploaded);

                  return (
                    <div
                      key={masterItem.key}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            uploaded?.is_verified
                              ? 'bg-emerald-50 text-emerald-600'
                              : isUploaded
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                            {masterItem.label}
                            {masterItem.required && (
                              <span className="text-red-500 font-bold ml-1">*</span>
                            )}
                          </p>
                          {uploaded?.catatan ? (
                            <p className="text-2xs text-rose-500 mt-0.5">
                              Catatan: {uploaded.catatan}
                            </p>
                          ) : (
                            <p className="text-2xs text-slate-400 font-medium">
                              {isUploaded ? 'Dokumen tersimpan' : 'Belum diunggah'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {isUploaded ? (
                          uploaded?.is_verified ? (
                            <span className="badge badge-green text-xs">✓ Terverifikasi</span>
                          ) : (
                            <span className="badge badge-yellow text-xs">Dalam Pemeriksaan</span>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="badge badge-gray text-xs text-slate-400">Belum Diunggah</span>
                            <Link
                              href="/spmb/registrasi"
                              className="text-2xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md border border-primary-200"
                            >
                              Unggah
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right / Sidebar Column ─────────────────────────────────── */}
        <div className="spmb-side-col">

          {/* Gelombang & Important Dates Card */}
          <div className="card overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-sky-400" />
                <span className="font-bold text-sm">Informasi Gelombang</span>
              </div>
              <span className="badge badge-cyan text-xs">
                {activeGelombang?.status === 'aktif' ? 'Aktif' : 'Tutup'}
              </span>
            </div>

            <div className="card-body space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Nama Gelombang
                </span>
                <p className="font-bold text-slate-900 text-base">
                  {activeGelombang?.nama || 'Gelombang 1 Reguler'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Tanggal Buka</span>
                  <span className="font-semibold text-slate-700 text-xs">
                    {activeGelombang?.tanggal_buka ? formatDate(activeGelombang.tanggal_buka) : '1 Agu 2026'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Tanggal Tutup</span>
                  <span className="font-semibold text-slate-700 text-xs">
                    {activeGelombang?.tanggal_tutup ? formatDate(activeGelombang.tanggal_tutup) : '30 Sep 2026'}
                  </span>
                </div>
              </div>

              {(activeGelombang?.tanggal_ujian || activeGelombang?.tanggal_pengumuman) && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  {activeGelombang.tanggal_ujian && (
                    <div>
                      <span className="text-xs text-slate-400 block">Pelaksanaan Ujian</span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {formatDate(activeGelombang.tanggal_ujian)}
                      </span>
                    </div>
                  )}
                  {activeGelombang.tanggal_pengumuman && (
                    <div>
                      <span className="text-xs text-slate-400 block">Pengumuman</span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {formatDate(activeGelombang.tanggal_pengumuman)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="card p-4">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Menu Cepat Pendaftar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/spmb/registrasi" className="p-3 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-slate-100 rounded-xl flex flex-col items-center text-center transition-all group">
                <FileText size={20} className="text-slate-600 group-hover:text-primary-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800">Form Biodata</span>
              </Link>

              <Link href="/spmb/registrasi" className="p-3 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-slate-100 rounded-xl flex flex-col items-center text-center transition-all group">
                <UploadCloud size={20} className="text-slate-600 group-hover:text-primary-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800">Upload Berkas</span>
              </Link>

              <Link href="/spmb/ujian" className="p-3 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-slate-100 rounded-xl flex flex-col items-center text-center transition-all group">
                <BookOpen size={20} className="text-slate-600 group-hover:text-primary-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800">Kartu Ujian</span>
              </Link>

              <Link href="/spmb/seleksi" className="p-3 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-slate-100 rounded-xl flex flex-col items-center text-center transition-all group">
                <Award size={20} className="text-slate-600 group-hover:text-primary-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800">Hasil Seleksi</span>
              </Link>
            </div>
          </div>

          {/* Integrated Portal Quick Jump */}
          <div className="card p-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">SSO Campus</span>
              <span className="text-xs text-slate-300">Kembali ke Dashboard SSO</span>
            </div>
            <Link href="/dashboard" className="btn btn-sm btn-outline text-white border-slate-700 hover:bg-slate-800">
              <ExternalLink size={14} />
              Portal SSO
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
