'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  User, 
  GraduationCap, 
  Users, 
  FileCheck, 
  ExternalLink, 
  Save, 
  Check, 
  AlertCircle,
  Hash,
  CreditCard,
  ChevronUp,
  ChevronDown,
  Gift,
  Wallet,
  Landmark,
  ReceiptText,
  CalendarClock
} from 'lucide-react';
import { spmbService, PendaftaranCalonMhs, PendaftaranBerkas } from '@/services/spmb.service';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SPMB_STATUS_CONFIG, SpmbStatusBadge, SpmbPaymentBadge } from '@/components/spmb/SpmbStatusBadge';

// ============================================================
// CLEAN KEY-VALUE METADATA ITEM
// ============================================================
function MetadataItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col py-1.5">
      <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">{label}</span>
      <span className="text-sm font-bold text-slate-800 break-words leading-snug">
        {value || <span className="text-slate-400 font-normal italic text-xs">-</span>}
      </span>
    </div>
  );
}

// ============================================================
// DAFTAR ULANG STATUS LABEL
// ============================================================
const STATUS_DAFTAR_ULANG_LABEL: Record<string, string> = {
  belum: 'Belum Daftar Ulang',
  menunggu_pembayaran: 'Menunggu Pembayaran',
  lunas: 'Lunas',
};

const STATUS_DAFTAR_ULANG_VARIANT: Record<string, 'green' | 'yellow' | 'blue' | 'gray'> = {
  belum: 'gray',
  menunggu_pembayaran: 'yellow',
  lunas: 'green',
};

// ============================================================
// SECTION WRAPPER
// ============================================================
function DetailSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true,
  badgeCount
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badgeCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-200/60 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-100/60 text-primary-700">
            <Icon size={18} />
          </div>
          <span className="font-bold text-slate-900 text-sm md:text-base">{title}</span>
          {badgeCount !== undefined && (
            <span className="px-2.5 py-0.5 text-2xs font-extrabold rounded-full bg-slate-200 text-slate-700">
              {badgeCount}
            </span>
          )}
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-5 animate-fade-in divide-y divide-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SEPARATE DETAIL PAGE FOR PENDAFTARAN VERIFICATION
// ============================================================
export default function DetailPendaftaranPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = Number(resolvedParams.id);

  const [pendaftar, setPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');

  // Fetch Detail Pendaftaran by ID
  const fetchDetail = async (pendaftarId: number) => {
    try {
      setLoading(true);
      const res = await spmbService.getPendaftaranDetail(pendaftarId);
      const pData = res.data?.id ? res.data : res.data?.data || res;
      setPendaftar(pData);
      setNewStatus(pData.status || 'draft');
      setCatatanVerifikasi(pData.catatan_verifikasi || '');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat detail pendaftar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  // Document Verification Handler
  const handleVerifyBerkas = async (berkasId: number, isVerified: boolean) => {
    try {
      await spmbService.verifyBerkasPendaftaran(berkasId, { is_verified: isVerified });
      toast.success(`Berkas ditandai sebagai ${isVerified ? 'Valid' : 'Belum Valid'}`);
      fetchDetail(id);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi berkas');
    }
  };

  // Decision Handler
  const handleUpdateStatus = async () => {
    if (!pendaftar) return;
    try {
      setUpdateStatusLoading(true);
      await spmbService.updateStatusPendaftaran(pendaftar.id, { 
        status: newStatus, 
        catatan_verifikasi: catatanVerifikasi 
      });
      toast.success('Keputusan pendaftaran berhasil disimpan');
      fetchDetail(id);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan keputusan pendaftaran');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  if (loading || !pendaftar) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PageHeader 
          title="Detail & Verifikasi Pendaftaran"
          action={
            <button 
              onClick={() => router.push('/spmb/pendaftaran')} 
              className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm font-bold text-xs"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Kembali
            </button>
          }
        />
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-xl border border-slate-200 p-8">
          <div className="spinner spinner-primary"></div>
          <span className="text-xs font-semibold text-slate-500">Memuat detail pendaftaran...</span>
        </div>
      </div>
    );
  }

  const daftarUlang = pendaftar.daftar_ulang;
  const tagihanDaftarUlang = daftarUlang?.tagihan ?? null;
  const statusDaftarUlang = daftarUlang?.status_daftar_ulang || 'belum';
  const daftarUlangLunas = (tagihanDaftarUlang?.sisa_kurang ?? 0) <= 0;

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header with Back Button (Orange styling as per CRUD standard) */}
      <PageHeader 
        title="Detail & Verifikasi Pendaftaran"
        description="Kelola verifikasi berkas dan tentukan keputusan pendaftaran calon mahasiswa."
        action={
          <button 
            onClick={() => router.push('/spmb/pendaftaran')} 
            className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm font-bold text-xs flex items-center gap-1.5 px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={16} /> Kembali ke Daftar
          </button>
        }
      />

      {/* 1. VISUAL ANCHOR HEADER CARD */}
      <div className="p-5 md:p-6 rounded-xl bg-white border border-slate-200 border-l-4 border-l-primary-600 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest block">NAMA CALON MAHASISWA</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {pendaftar.nama_lengkap}
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 font-mono font-bold">
              <Hash size={13} className="text-slate-400 shrink-0" />
              <span>{pendaftar.no_pendaftaran}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-semibold">
              <CreditCard size={13} className="text-slate-400 shrink-0" />
              <span>NIK: {pendaftar.nik || '-'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
          <SpmbStatusBadge status={pendaftar.status} />
          <SpmbPaymentBadge status={pendaftar.status_pembayaran} />
        </div>
      </div>

      {/* 2. GRID DETAILS AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER COLUMN: INFORMATION SECTIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION A: BIODATA & IDENTITAS */}
          <DetailSection title="Identitas & Biodata Pendaftar" icon={User} defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
              <MetadataItem label="Tempat, Tgl Lahir" value={`${pendaftar.tempat_lahir || '-'}, ${pendaftar.tanggal_lahir ? new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} />
              <MetadataItem label="Jenis Kelamin" value={pendaftar.jenis_kelamin === 'L' ? 'Laki-laki' : pendaftar.jenis_kelamin === 'P' ? 'Perempuan' : '-'} />
              <MetadataItem label="Agama" value={pendaftar.agama} />
              <MetadataItem label="Kewarganegaraan" value={pendaftar.kewarganegaraan} />
              <MetadataItem label="No. Handphone" value={pendaftar.no_hp || pendaftar.user?.phone} />
              <MetadataItem label="Email Account" value={pendaftar.user?.email || pendaftar.user?.username} />
            </div>
            <div className="pt-2">
              <MetadataItem label="Alamat Lengkap" value={pendaftar.alamat} />
            </div>
          </DetailSection>

          {/* SECTION B: INFORMASI AKADEMIK & PRODI */}
          <DetailSection title="Informasi Akademik & Prodi" icon={GraduationCap} defaultOpen={true}>
            <div className="space-y-4 pt-1">
              {/* Highlight Card for Program Studi */}
              <div className="p-4 bg-gradient-to-br from-primary-50/80 to-primary-50/40 border border-primary-200/80 rounded-xl space-y-1">
                <span className="text-2xs font-extrabold text-primary-700 uppercase tracking-widest block">PROGRAM STUDI PILIHAN</span>
                <div className="text-base font-black text-slate-900">
                  1. {pendaftar.program_studi?.nama || '-'} <span className="text-xs font-semibold text-primary-700">({pendaftar.program_studi?.jenjang || 'S1'})</span>
                </div>
                {pendaftar.program_studi_pilihan2?.nama && (
                  <div className="text-xs font-bold text-slate-700">
                    2. {pendaftar.program_studi_pilihan2.nama} <span className="text-2xs text-slate-500">({pendaftar.program_studi_pilihan2.jenjang || 'S1'})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
                <MetadataItem label="Asal Sekolah" value={pendaftar.asal_sekolah} />
                <MetadataItem label="Jurusan Sekolah" value={pendaftar.jurusan_sekolah} />
                <MetadataItem label="Tahun Lulus" value={pendaftar.tahun_lulus} />
                <MetadataItem label="NPSN Sekolah" value={pendaftar.npsn_sekolah} />
                <MetadataItem label="Nilai Rata Rapor" value={pendaftar.nilai_rata_rapor ? String(pendaftar.nilai_rata_rapor) : '-'} />
                <MetadataItem label="Gelombang Penerimaan" value={pendaftar.gelombang_penerimaan?.nama || 'Gelombang 1'} />
              </div>
            </div>
          </DetailSection>

          {/* SECTION C: DATA ORANG TUA / WALI */}
          <DetailSection title="Data Orang Tua & Wali" icon={Users} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
              <MetadataItem label="Nama Ayah" value={pendaftar.nama_ayah} />
              <MetadataItem label="Pekerjaan Ayah" value={pendaftar.pekerjaan_ayah} />
              <MetadataItem label="Nama Ibu" value={pendaftar.nama_ibu} />
              <MetadataItem label="Pekerjaan Ibu" value={pendaftar.pekerjaan_ibu} />
              <MetadataItem label="Penghasilan Ortu" value={pendaftar.penghasilan_ortu} />
              <MetadataItem label="Wali / Telepon" value={pendaftar.nama_wali ? `${pendaftar.nama_wali} (${pendaftar.telepon_wali || '-'})` : '-'} />
            </div>
          </DetailSection>

          {/* SECTION C2: KODE REFERRAL */}
          <DetailSection title="Kode Referral" icon={Gift} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <MetadataItem label="Kode Digunakan" value={pendaftar.used_referral_code || '-'} />
              <MetadataItem label="Direferensikan Oleh" value={pendaftar.referrer?.name || pendaftar.referrer?.username || '-'} />
              <MetadataItem label="Kode Referrer" value={pendaftar.referrer?.referral_code || '-'} />
              <MetadataItem
                label="Divalidasi Pada"
                value={pendaftar.referral_validated_at ? new Date(pendaftar.referral_validated_at).toLocaleString('id-ID') : '-'}
              />
            </div>
          </DetailSection>

          {/* SECTION C3: PEMBAYARAN DAFTAR ULANG */}
          <DetailSection title="Pembayaran Daftar Ulang" icon={Wallet} defaultOpen={true}>
            {!tagihanDaftarUlang ? (
              <EmptyState
                icon={<ReceiptText size={32} className="text-slate-400" />}
                title="Belum ada tagihan daftar ulang"
                description="Tagihan daftar ulang diterbitkan setelah calon mahasiswa dinyatakan lulus seleksi."
                className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_DAFTAR_ULANG_VARIANT[statusDaftarUlang] || 'gray'} className="text-2xs font-extrabold px-3 py-1">
                      {STATUS_DAFTAR_ULANG_LABEL[statusDaftarUlang] || statusDaftarUlang}
                    </Badge>
                    <Badge variant={daftarUlangLunas ? 'green' : (tagihanDaftarUlang.sudah_dibayar > 0 ? 'yellow' : 'red')} className="text-2xs font-extrabold px-3 py-1">
                      Tagihan: {(tagihanDaftarUlang.status || '-').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="text-2xs font-bold text-slate-500 font-mono">
                    {tagihanDaftarUlang.nomor_tagihan || '-'}
                  </span>
                </div>

                {/* Ringkasan nominal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">Total Tagihan</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(tagihanDaftarUlang.total_bersih)}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-600 block">Sudah Dibayar</span>
                    <span className="text-base font-black text-emerald-700">{formatCurrency(tagihanDaftarUlang.sudah_dibayar)}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${daftarUlangLunas ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
                    <span className={`text-2xs font-extrabold uppercase tracking-wider block ${daftarUlangLunas ? 'text-emerald-600' : 'text-red-500'}`}>Sisa Kurang</span>
                    <span className={`text-base font-black ${daftarUlangLunas ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(tagihanDaftarUlang.sisa_kurang)}</span>
                  </div>
                </div>

                {/* Progress pembayaran */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500">
                    <span>Progres Pembayaran</span>
                    <span>{tagihanDaftarUlang.persen_terbayar}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, tagihanDaftarUlang.persen_terbayar))}%`, backgroundColor: 'var(--module-primary)' }}
                    />
                  </div>
                </div>

                {/* Meta & VA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetadataItem
                    label="Jatuh Tempo"
                    value={tagihanDaftarUlang.due_date ? new Date(tagihanDaftarUlang.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  />
                  <MetadataItem
                    label="Potongan / Denda"
                    value={`${formatCurrency(tagihanDaftarUlang.total_potongan)} / ${formatCurrency(tagihanDaftarUlang.total_denda)}`}
                  />
                  {tagihanDaftarUlang.virtual_account && (
                    <>
                      <MetadataItem
                        label="Virtual Account"
                        value={`${tagihanDaftarUlang.virtual_account.bank_nama || tagihanDaftarUlang.virtual_account.bank_kode || '-'} • ${tagihanDaftarUlang.virtual_account.va_number || '-'}`}
                      />
                      <MetadataItem
                        label="VA Berlaku Hingga"
                        value={tagihanDaftarUlang.virtual_account.expired_at ? new Date(tagihanDaftarUlang.virtual_account.expired_at).toLocaleString('id-ID') : '-'}
                      />
                    </>
                  )}
                </div>

                {/* Riwayat pembayaran */}
                <div>
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                    <CalendarClock size={16} /> Riwayat Pembayaran
                  </span>
                  {tagihanDaftarUlang.riwayat_pembayaran.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada pembayaran tercatat.</p>
                  ) : (
                    <div className="space-y-4">
                      {tagihanDaftarUlang.riwayat_pembayaran.map((bayar) => (
                        <div key={bayar.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                              <Landmark size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{formatCurrency(bayar.jumlah_bayar)}</span>
                              <span className="text-2xs text-slate-400 font-semibold">{bayar.kode_transaksi || '-'} • {bayar.channel_bayar || '-'}</span>
                            </div>
                          </div>
                          <span className="text-2xs font-bold text-slate-500">
                            {bayar.paid_at ? new Date(bayar.paid_at).toLocaleString('id-ID') : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DetailSection>

          {/* SECTION D: DOCUMENT VERIFICATION */}
          <DetailSection 
            title="Berkas Pendukung" 
            icon={FileCheck} 
            defaultOpen={true}
            badgeCount={pendaftar.dokumen_pendaftaran?.length || 0}
          >
            {(!pendaftar.dokumen_pendaftaran || pendaftar.dokumen_pendaftaran.length === 0) ? (
              <EmptyState
                icon={<FileText size={32} className="text-slate-400" />}
                title="Belum ada berkas terunggah"
                description="Calon mahasiswa ini belum mengunggah berkas persyaratan pendaftaran."
                className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
              />
            ) : (
              <div className="space-y-3 pt-1">
                {pendaftar.dokumen_pendaftaran.map((berkas: PendaftaranBerkas) => (
                  <div key={berkas.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 shadow-2xs transition-all space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <FileText size={18} className="text-primary-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm capitalize">
                          {(berkas.jenis_berkas || berkas.jenis_dokumen || 'dokumen').replace(/_/g, ' ')}
                        </span>
                      </div>
                      {berkas.is_verified ? (
                        <Badge variant="green" className="text-2xs font-extrabold px-3 py-1">
                          <Check size={12} className="mr-1" /> Valid
                        </Badge>
                      ) : (
                        <Badge variant="yellow" className="text-2xs font-extrabold px-3 py-1">
                          <Clock size={12} className="mr-1" /> Belum Valid
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL || ''}/storage/${berkas.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-extrabold hover:underline"
                      >
                        <ExternalLink size={14} />
                        Lihat Dokumen Fullscreen
                      </a>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant={berkas.is_verified ? "primary" : "outline"}
                          onClick={() => handleVerifyBerkas(berkas.id, true)}
                          className="text-xs py-1 px-3.5 h-8 font-extrabold"
                        >
                          Set Valid
                        </Button>
                        <Button 
                          size="sm" 
                          variant={!berkas.is_verified ? "danger" : "outline"}
                          onClick={() => handleVerifyBerkas(berkas.id, false)}
                          className="text-xs py-1 px-3.5 h-8 font-extrabold"
                        >
                          Tidak Valid
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

        </div>

        {/* RIGHT COLUMN: KEPUTUSAN ADMINISTRASI STICKY ACTION CARD */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <ShieldCheck size={20} className="text-primary-600" />
              <h3 className="font-black text-base uppercase tracking-wide">Keputusan Administrasi</h3>
            </div>

            <div className="space-y-4">
              <Select
                label="Status Pendaftaran"
                value={newStatus}
                onChange={(val) => setNewStatus(val)}
                options={[
                  { value: 'draft', label: 'Draft (Pengisian)' },
                  { value: 'submitted', label: 'Submitted (Menunggu Verifikasi)' },
                  { value: 'verified', label: 'Verified (Berkas Terverifikasi)' },
                  { value: 'lulus_administrasi', label: 'Lulus Administrasi (Lanjut Tes/Pengumuman)' },
                  { value: 'gagal_administrasi', label: 'Gagal Administrasi (Ditolak)' }
                ]}
              />

              {/* HELPER TEXT BASED ON SELECTED DECISION */}
              {newStatus === 'gagal_administrasi' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-800 text-xs">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <span><strong>Perhatian:</strong> Mohon jelaskan alasan penolakan secara spesifik pada catatan verifikasi di bawah.</span>
                </div>
              )}
              {newStatus === 'lulus_administrasi' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Calon mahasiswa akan mendapatkan status LUNAS Administrasi dan berhak mengikuti tahap berikutnya.</span>
                </div>
              )}

              <Textarea
                label="Catatan Verifikasi (Tampil ke Calon Mhs)"
                value={catatanVerifikasi}
                onChange={(e) => setCatatanVerifikasi(e.target.value)}
                placeholder="Contoh: Berkas Ijazah belum terunggah dengan jelas, mohon unggah ulang..."
                rows={4}
              />

              <Button 
                onClick={handleUpdateStatus} 
                isLoading={updateStatusLoading}
                variant="primary"
                icon={<Save size={16} />}
                className="w-full font-black shadow-md min-h-[46px] text-sm"
              >
                {updateStatusLoading ? 'Menyimpan Keputusan...' : 'Simpan Keputusan'}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
