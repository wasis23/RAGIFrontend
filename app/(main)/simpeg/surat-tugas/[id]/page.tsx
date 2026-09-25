'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Briefcase,
  Car,
  Users,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  Trash2,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import { useAuth } from '@/hooks/useAuth';
import type { SuratTugas, SuratTugasStatus } from '@/types/simpeg.surat-tugas.types';

const approvalFormSchema = z.object({
  status: z.enum(['disetujui', 'ditolak'], {
    error: 'Keputusan persetujuan wajib ditentukan',
  }),
  nomor_surat: z.string().optional(),
  nominal_disetujui: z.coerce.number().min(0, 'Nominal tidak boleh bernilai negatif').default(0),
  catatan_approval: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

const lpjFormSchema = z.object({
  laporan_kegiatan: z.string().optional(),
  biaya_realisasi: z.coerce.number().min(0, 'Biaya realisasi tidak boleh negatif').optional(),
});

type LpjFormValues = z.infer<typeof lpjFormSchema>;

export default function SuratTugasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const { user, isAdmin, hasRole, hasPermission } = useAuth();
  const canApprove = isAdmin || hasPermission('simpeg.surat_tugas.approve');
  const canDelete = isAdmin || hasPermission('simpeg.surat_tugas.delete');
  const canUploadLpj = canApprove || hasRole('superadmin') || hasPermission('simpeg.surat_tugas.update');

  const [item, setItem] = useState<SuratTugas | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approval modal state & form
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [fileSuratTugas, setFileSuratTugas] = useState<File | null>(null);

  const {
    register: registerApproval,
    handleSubmit: handleSubmitApprovalForm,
    watch: watchApproval,
    reset: resetApproval,
    control: controlApproval,
    formState: { errors: errorsApproval, isSubmitting: isSubmittingApproval },
  } = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema) as any,
    defaultValues: {
      status: 'disetujui',
      nomor_surat: '',
      nominal_disetujui: 0,
      catatan_approval: '',
    },
  });

  const approvalStatus = watchApproval('status');

  // LPJ modal state & form
  const [lpjModalOpen, setLpjModalOpen] = useState(false);
  const [fileLpj, setFileLpj] = useState<File | null>(null);

  const {
    register: registerLpj,
    handleSubmit: handleSubmitLpjForm,
    watch: watchLpj,
    reset: resetLpj,
    formState: { errors: errorsLpj, isSubmitting: isSubmittingLpj },
  } = useForm<LpjFormValues>({
    resolver: zodResolver(lpjFormSchema) as any,
    defaultValues: {
      laporan_kegiatan: '',
      biaya_realisasi: undefined,
    },
  });

  const watchBiayaRealisasi = watchLpj('biaya_realisasi');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm Panjar dialog state (Tahap 4)
  const [confirmPanjarDialogOpen, setConfirmPanjarDialogOpen] = useState(false);
  const [isConfirmingPanjar, setIsConfirmingPanjar] = useState(false);

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await simpegSuratTugasService.getById(id);
      if (res.status === 'success' && res.data) {
        setItem(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat detail surat tugas.');
      router.push('/simpeg/surat-tugas');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Status badge
  const renderStatusBadge = (status: SuratTugasStatus) => {
    switch (status) {
      case 'disetujui':
        return <Badge variant="success">Disetujui</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'selesai':
        return <Badge variant="info">Selesai (LPJ Terunggah)</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draf</Badge>;
      case 'diajukan':
      default:
        return <Badge variant="warning">Menunggu Persetujuan</Badge>;
    }
  };

  // Format rupiah
  const formatRupiah = (val?: number | string | null) => {
    if (!val) return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Submit Approval
  const onSubmitApproval = async (values: any) => {
    if (!item) return;
    if (values.status === 'disetujui' && (!values.nomor_surat || !values.nomor_surat.trim())) {
      toast.error('Nomor surat tugas resmi wajib diisi.');
      return;
    }

    try {
      await simpegSuratTugasService.approve(item.id, {
        status: values.status,
        nomor_surat: values.nomor_surat || '',
        nominal_disetujui: values.status === 'disetujui' ? Number(values.nominal_disetujui || 0) : 0,
        catatan_approval: values.catatan_approval || '',
        file_surat_tugas: fileSuratTugas,
      });

      toast.success(
        values.status === 'disetujui'
          ? 'Surat tugas disetujui! Presensi dinas luar tim telah diaktifkan otomatis.'
          : 'Surat tugas ditolak.'
      );
      setApprovalModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan surat tugas.');
    }
  };

  // Submit LPJ
  const onSubmitLpj = async (values: any) => {
    if (!item || !fileLpj) {
      toast.error('Berkas laporan LPJ (PDF) wajib diunggah.');
      return;
    }

    try {
      await simpegSuratTugasService.uploadLpj(item.id, {
        file_lpj: fileLpj,
        laporan_kegiatan: values.laporan_kegiatan,
        biaya_realisasi: values.biaya_realisasi !== undefined && values.biaya_realisasi !== null ? Number(values.biaya_realisasi) : undefined,
      });

      toast.success('Laporan LPJ dinas berhasil diunggah.');
      setLpjModalOpen(false);
      setFileLpj(null);
      resetLpj();
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah laporan LPJ.');
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await simpegSuratTugasService.delete(item.id);
      toast.success('Pengajuan surat tugas berhasil dihapus.');
      router.push('/simpeg/surat-tugas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus surat tugas.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Konfirmasi Panjar Dosen (Tahap 4)
  const handleConfirmPanjar = async () => {
    if (!item) return;
    setIsConfirmingPanjar(true);
    try {
      await simpegSuratTugasService.konfirmasiPanjar(item.id);
      toast.success('Panjar perjalanan dinas berhasil dikonfirmasi! Antrean siap dicairkan oleh Keuangan.');
      setConfirmPanjarDialogOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengonfirmasi panjar.');
    } finally {
      setIsConfirmingPanjar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-6 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium">Memuat detail surat tugas kedinasan...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-6">
      <PageHeader
        title={item.nama_kegiatan}
        description={
          item.nomor_surat
            ? `Nomor Resmi: ${item.nomor_surat}`
            : 'Permohonan Kedinasan Luar Kampus'
        }
        backUrl="/simpeg/surat-tugas"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tahap 4: Konfirmasi Panjar oleh Dosen */}
            {item.status_pencairan === 'panjar_disetujui' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmPanjarDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle size={16} />
                <span>Konfirmasi Panjar ({formatRupiah(item.nominal_disetujui)})</span>
              </Button>
            )}

            {canApprove && item.status === 'diajukan' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resetApproval({
                    status: 'disetujui',
                    nomor_surat: item.nomor_surat || '',
                    nominal_disetujui: Number(item.nominal_disetujui ?? item.estimasi_biaya ?? 0),
                    catatan_approval: '',
                  });
                  setFileSuratTugas(null);
                  setApprovalModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                <span>Persetujuan / Approval</span>
              </Button>
            )}

            {canUploadLpj && ['disetujui', 'selesai'].includes(item.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetLpj({
                    laporan_kegiatan: item.laporan_kegiatan || '',
                    biaya_realisasi: item.biaya_realisasi ? Number(item.biaya_realisasi) : undefined,
                  });
                  setFileLpj(null);
                  setLpjModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                <span>{item.file_lpj ? 'Perbarui LPJ' : 'Unggah LPJ'}</span>
              </Button>
            )}

            {canDelete && ['draft', 'diajukan', 'ditolak'].includes(item.status) && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span>Hapus</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Header Info Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {renderStatusBadge(item.status)}
            {item.kategori_kegiatan && (
              <span className="text-xs text-slate-700 bg-slate-100 font-medium px-2.5 py-1 rounded-full">
                {item.kategori_kegiatan.nama}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Diajukan pada: {new Date(item.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>

        {item.nomor_surat && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 text-right">
            <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider">
              Nomor Surat Resmi
            </p>
            <p className="text-sm font-mono font-bold text-primary-900 mt-0.5">{item.nomor_surat}</p>
          </div>
        )}
      </div>

      {/* BANNERS ALUR PANJAR & PENCAIRAN SIKEU */}
      {/* Tahap 4: Banner Menunggu Konfirmasi Panjar */}
      {item.status_pencairan === 'panjar_disetujui' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-4 text-xs text-amber-900 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <div className="flex flex-col gap-2">
              <p className="font-bold text-amber-950 text-sm">Panjar Disetujui Keuangan: {formatRupiah(item.nominal_disetujui)}</p>
              <p>
                Bagian Keuangan telah menyetujui alokasi panjar dana tugas dinas ini{item.pencairan_kas?.unit_kas?.nama_kas ? ` melalui ${item.pencairan_kas.unit_kas.nama_kas}` : ''}.
                Silakan periksa dan klik tombol konfirmasi agar panjar dapat segera dicairkan ke rekening Anda.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmPanjarDialogOpen(true)}
            className="shrink-0 font-bold flex items-center gap-2"
          >
            <CheckCircle size={16} />
            <span>Konfirmasi Panjar</span>
          </Button>
        </div>
      )}

      {/* Tahap 4 Selesai: Banner Siap Dicairkan (Dynamic Module Color Binding) */}
      {item.status_pencairan === 'siap_cair' && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3 text-xs"
          style={{
            borderColor: 'var(--module-primary)',
            backgroundColor: 'var(--module-primary-subtle)',
          }}
        >
          <CheckCircle size={18} style={{ color: 'var(--module-primary)' }} className="shrink-0" />
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm" style={{ color: 'var(--module-primary)' }}>
              Menunggu Pencairan Dana oleh Keuangan
            </p>
            <p style={{ color: 'var(--module-primary)' }}>
              Panjar sebesar {formatRupiah(item.nominal_disetujui)} telah Anda konfirmasi dan saat ini berada dalam antrean pencairan Bagian Keuangan (SIKEU).
            </p>
          </div>
        </div>
      )}

      {/* Tahap 5: Banner Dana Dicairkan & Unduh Resi Transfer */}
      {item.status_pencairan === 'dicairkan' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between gap-4 text-xs text-emerald-950 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <div className="flex flex-col gap-2">
              <p className="font-bold text-emerald-950 text-sm">Dana Panjar Telah Dicairkan oleh Keuangan</p>
              <p>
                Dana sebesar <strong className="tabular-nums">{formatRupiah(item.nominal_disetujui)}</strong> telah dicairkan
                {item.pencairan_kas?.unit_kas?.nama_kas ? ` dari ${item.pencairan_kas.unit_kas.nama_kas}` : ''}
                {item.pencairan_kas?.tanggal_pencairan ? ` pada tanggal ${item.pencairan_kas.tanggal_pencairan}` : ''}.
                Setelah tugas selesai dilaksanakan, silakan unggah berkas LPJ serta rincian biaya riil yang terpakai.
              </p>
            </div>
          </div>
          {item.pencairan_kas?.bukti_pencairan_path && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.pencairan_kas.bukti_pencairan_path}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: 'var(--module-primary)' }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-bold text-xs hover:opacity-90 transition shrink-0"
            >
              <Download size={16} />
              <span>Unduh Bukti Transfer</span>
            </a>
          )}
        </div>
      )}

      {/* Approval Details Banner if Approved or Rejected */}
      {item.status === 'disetujui' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-slate-900">Surat Tugas Resmi Telah Disetujui Pimpinan</p>
            <p>
              Presensi kepegawaian otomatis terisi sebagai <strong>DINAS LUAR</strong> untuk seluruh anggota
              tim pada rentang tanggal dinas ({item.tanggal_berangkat} s/d {item.tanggal_kembali}).
            </p>
            {item.catatan_approval && (
              <p className="text-slate-600 italic pt-2">&quot;{item.catatan_approval}&quot;</p>
            )}
          </div>
        </div>
      )}

      {item.status === 'ditolak' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-900">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-950">Permohonan Surat Tugas Ditolak</p>
            {item.catatan_approval && (
              <p className="text-rose-800 mt-1">Alasan: {item.catatan_approval}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: DATA KEGIATAN & JADWAL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase size={18} className="text-primary-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">Jadwal & Lokasi Dinas</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Penanggung Jawab / Ketua Rombongan</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {item.pegawai?.nama_lengkap || '-'}
              </p>
              <p className="text-slate-500">
                {item.pegawai?.nip ? `NIP: ${item.pegawai.nip}` : ''} ({item.pegawai?.unit_kerja?.nama || 'SDM'})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-slate-500 font-medium">Tempat Asal</p>
                <p className="font-semibold text-slate-900 mt-0.5">{item.tempat_berangkat}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Lokasi / Kota Tujuan</p>
                <p className="font-semibold text-slate-900 mt-0.5">{item.lokasi_tujuan}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-slate-500 font-medium">Jadwal Perjalanan</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {item.tanggal_berangkat} s/d {item.tanggal_kembali}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Waktu Pelaksanaan Kegiatan</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {item.tanggal_mulai} s/d {item.tanggal_selesai}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-slate-500 font-medium">Maksud & Tujuan Kedinasan</p>
              <p className="text-slate-800 leading-relaxed mt-1 whitespace-pre-line">
                {item.maksud_tujuan || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: LOGISTIK & TRANSPORTASI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Car size={18} className="text-primary-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">Armada & Pembiayaan</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Moda Transportasi</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {item.jenis_transportasi?.nama || '-'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-slate-500 font-medium">Kendaraan Dinas / Nopol</p>
                <p className="font-semibold text-slate-900 mt-0.5">{item.kendaraan_dinas || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Driver / Pengemudi</p>
                <p className="font-semibold text-slate-900 mt-0.5">{item.nama_driver || '-'}</p>
                {item.kontak_driver && (
                  <p className="text-slate-500 text-[11px]">{item.kontak_driver}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-slate-500 font-medium">Beban Anggaran</p>
                <p className="font-semibold text-slate-900 mt-0.5">{item.beban_anggaran || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Estimasi Biaya</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {formatRupiah(item.estimasi_biaya)}
                </p>
              </div>
            </div>

            {item.keterangan && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-500 font-medium">Catatan Logistik Tambahan</p>
                <p className="text-slate-800 mt-0.5">{item.keterangan}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 3: ROMBONGAN TIM KEDINASAN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Users size={18} className="text-primary-600 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Anggota Tim Rombongan ({1 + (item.anggota?.length || 0)} Orang)
          </h3>
        </div>

        {(() => {
          interface RombonganItem {
            id: string | number;
            nama: string;
            nip: string;
            unit_kerja: string;
            peran: string;
            is_ketua: boolean;
            keterangan: string;
          }

          const rombonganData: RombonganItem[] = [
            {
              id: 'ketua',
              nama: item.pegawai?.nama_lengkap || 'Ketua',
              nip: item.pegawai?.nip || '-',
              unit_kerja: item.pegawai?.unit_kerja?.nama || '-',
              peran: 'Penanggung Jawab / Ketua',
              is_ketua: true,
              keterangan: 'Ketua Pelaksana',
            },
            ...(item.anggota?.map((ang, idx) => ({
              id: ang.id || idx,
              nama: ang.pegawai?.nama_lengkap || 'Anggota',
              nip: ang.pegawai?.nip || '-',
              unit_kerja: ang.pegawai?.unit_kerja?.nama || '-',
              peran: ang.peran,
              is_ketua: false,
              keterangan: ang.keterangan || '-',
            })) || []),
          ];

          const rombonganColumns: ColumnDef<RombonganItem>[] = [
            {
              key: 'nama',
              label: 'Nama Pegawai',
              render: (row) => (
                <span className={row.is_ketua ? 'font-semibold text-slate-900' : 'text-slate-800'}>
                  {row.nama}
                </span>
              ),
            },
            {
              key: 'nip',
              label: 'NIP / Identitas',
              render: (row) => <span className="text-slate-600">{row.nip}</span>,
            },
            {
              key: 'unit_kerja',
              label: 'Unit Kerja',
              render: (row) => <span className="text-slate-600">{row.unit_kerja}</span>,
            },
            {
              key: 'peran',
              label: 'Peran',
              render: (row) =>
                row.is_ketua ? (
                  <Badge variant="simpeg">{row.peran}</Badge>
                ) : (
                  <span className="font-medium text-slate-700">{row.peran}</span>
                ),
            },
            {
              key: 'keterangan',
              label: 'Keterangan',
              render: (row) => <span className="text-slate-500">{row.keterangan}</span>,
            },
          ];

          return (
            <DataTable
              columns={rombonganColumns}
              data={rombonganData}
              emptyMessage="Tidak ada anggota rombongan tambahan (perjalanan dinas perorangan)."
            />
          );
        })()}
      </div>

      {/* CARD: REKAPITULASI ANGGARAN & LPJ DINAS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign size={18} style={{ color: 'var(--module-primary)' }} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">Rekapitulasi Anggaran, Pencairan SIKEU & Realisasi LPJ</h3>
          </div>
          <div>
            {item.status_pencairan === 'menunggu_keuangan' && (
              <Badge variant="warning">
                Pencairan Dana: Menunggu Keuangan
              </Badge>
            )}
            {item.status_pencairan === 'panjar_disetujui' && (
              <Badge variant="info">
                Pencairan Dana: Panjar Disetujui Keuangan
              </Badge>
            )}
            {item.status_pencairan === 'siap_cair' && (
              <Badge variant="info">
                Pencairan Dana: Siap Dicairkan Keuangan
              </Badge>
            )}
            {item.status_pencairan === 'dicairkan' && (
              <Badge variant="success">
                Pencairan Dana: Telah Dicairkan SIKEU
              </Badge>
            )}
            {item.status_pencairan === 'lpj_diunggah' && (
              <Badge variant="warning">
                LPJ: Menunggu Verifikasi SIKEU
              </Badge>
            )}
            {item.status_pencairan === 'selesai' && (
              <Badge variant="success">
                LPJ: Terverifikasi & Kas Selesai
              </Badge>
            )}
            {item.status_pencairan === 'tidak_perlu' && (
              <Badge style={{ backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}>
                Pencairan Dana: Non-Anggaran
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border space-y-4">
            <p className="font-medium">Estimasi Biaya Diajukan</p>
            <p className="text-base font-bold">{formatRupiah(item.estimasi_biaya)}</p>
            <p className="text-2xs">Beban: {item.beban_anggaran || '-'}</p>
          </div>

          <div
            className="p-4 rounded-xl border space-y-4"
            style={{
              borderColor: 'var(--module-primary)',
              backgroundColor: 'var(--module-primary-subtle)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--module-primary)' }}>Panjar Disetujui Pimpinan</p>
            <p className="text-base font-bold" style={{ color: 'var(--module-primary)' }}>{formatRupiah(item.nominal_disetujui)}</p>
            <p className="text-2xs font-medium" style={{ color: 'var(--module-primary)' }}>
              {Number(item.nominal_disetujui) > 0 ? 'Diteruskan ke Pengajuan Operasional SIKEU' : 'Dinas non-anggaran (tanpa pencairan)'}
            </p>
          </div>

          <div className="p-4 rounded-xl border space-y-4">
            <p className="font-medium">Realisasi Biaya Terpakai (LPJ)</p>
            <p className="text-base font-bold">
              {item.biaya_realisasi !== null && item.biaya_realisasi !== undefined
                ? formatRupiah(item.biaya_realisasi)
                : '-'}
            </p>
            <p className="text-2xs">
              {item.file_lpj ? 'LPJ telah diunggah' : 'Menunggu unggah berkas LPJ'}
            </p>
          </div>
        </div>

        {/* Banner Selisih Biaya Realisasi */}
        {item.biaya_realisasi !== null && item.biaya_realisasi !== undefined && Number(item.nominal_disetujui) > 0 && (() => {
          const disetujui = Number(item.nominal_disetujui || 0);
          const terpakai = Number(item.biaya_realisasi || 0);
          const selisih = disetujui - terpakai;

          if (selisih > 0) {
            return (
              <div
                className="p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4"
                style={{
                  borderColor: 'var(--module-primary)',
                  backgroundColor: 'var(--module-primary-subtle)',
                }}
              >
                <div className="space-y-4">
                  <Badge style={{ backgroundColor: 'var(--module-primary)', color: 'white' }}>
                    Kelebihan Dana Panjar Kedinasan
                  </Badge>
                  <p className="text-xs">
                    Disetujui {formatRupiah(disetujui)} • Terpakai {formatRupiah(terpakai)}. Wajib disetorkan kembali ke kas kampus / bendahara keuangan.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xs font-bold uppercase tracking-wider block" style={{ color: 'var(--module-primary)' }}>
                    Dana yang Harus Dikembalikan
                  </span>
                  <span className="text-lg font-extrabold" style={{ color: 'var(--module-primary)' }}>
                    {formatRupiah(selisih)}
                  </span>
                </div>
              </div>
            );
          } else if (selisih < 0) {
            return (
              <div
                className="p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4"
                style={{
                  borderColor: 'var(--module-primary)',
                  backgroundColor: 'var(--module-primary-subtle)',
                }}
              >
                <div className="space-y-4">
                  <Badge style={{ backgroundColor: 'var(--module-primary)', color: 'white' }}>
                    Biaya Terpakai Melebihi Panjar
                  </Badge>
                  <p className="text-xs">
                    Disetujui {formatRupiah(disetujui)} • Terpakai {formatRupiah(terpakai)}. Pegawai berhak mengajukan reimbursement selisih biaya.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xs font-bold uppercase tracking-wider block" style={{ color: 'var(--module-primary)' }}>
                    Klaim Kurang Bayar
                  </span>
                  <span className="text-lg font-extrabold" style={{ color: 'var(--module-primary)' }}>
                    {formatRupiah(Math.abs(selisih))}
                  </span>
                </div>
              </div>
            );
          } else {
            return (
              <div className="p-4 border rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold">Realisasi Biaya Tepat Sesuai Panjar</span>
                <span className="font-bold">Nihil ({formatRupiah(disetujui)})</span>
              </div>
            );
          }
        })()}
      </div>

      {/* CARD 4: BERKAS DOKUMEN & LPJ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100">
          <FileText size={18} style={{ color: 'var(--module-primary)' }} className="shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">Dokumen Resmi & Pelaporan LPJ</h3>
        </div>

        <div className={`grid grid-cols-1 ${item.pencairan_kas?.bukti_pencairan_path ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {/* Berkas Surat Tugas */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <p className="text-xs font-semibold text-slate-800">Berkas Surat Tugas Resmi</p>
            {item.file_surat_tugas ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-slate-600 truncate">Surat_Tugas_Resmi.pdf</span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.file_surat_tugas}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition shrink-0"
                >
                  <Download size={16} />
                  <span>Unduh PDF</span>
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Belum ada berkas surat tugas resmi yang diunggah.
              </p>
            )}
          </div>

          {/* Bukti Pencairan Kasbon / Transfer Keuangan jika ada */}
          {item.pencairan_kas?.bukti_pencairan_path && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-800">Bukti Transfer Kasbon (SIKEU)</p>
              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-xs text-slate-600 truncate">Bukti_Pencairan_Kas.pdf</span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.pencairan_kas.bukti_pencairan_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--module-primary)' }}
                  className="inline-flex items-center gap-2 text-xs font-semibold hover:underline transition shrink-0"
                >
                  <Download size={16} />
                  <span>Unduh Bukti</span>
                </a>
              </div>
              <p className="text-2xs text-slate-500">
                Dicairkan: {formatRupiah(item.pencairan_kas.nominal_disetujui)} {item.pencairan_kas.unit_kas ? `(${item.pencairan_kas.unit_kas.nama_kas})` : ''}
              </p>
            </div>
          )}

          {/* Berkas LPJ */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <p className="text-xs font-semibold text-slate-800">Laporan Pertanggungjawaban (LPJ)</p>
            {item.file_lpj ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-slate-600 truncate">Laporan_LPJ_Dinas.pdf</span>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.file_lpj}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition shrink-0"
                  >
                    <Download size={16} />
                    <span>Unduh LPJ</span>
                  </a>
                </div>
                {item.biaya_realisasi && (
                  <p className="text-xs text-slate-700">
                    <strong>Realisasi Biaya:</strong> {formatRupiah(item.biaya_realisasi)}
                  </p>
                )}
                {item.laporan_kegiatan && (
                  <p className="text-xs text-slate-600 italic line-clamp-2">
                    &quot;{item.laporan_kegiatan}&quot;
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-amber-600 font-medium">Belum ada laporan LPJ</span>
                {['disetujui', 'selesai'].includes(item.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetLpj({
                        laporan_kegiatan: '',
                        biaya_realisasi: undefined,
                      });
                      setFileLpj(null);
                      setLpjModalOpen(true);
                    }}
                    className="text-xs flex items-center gap-2 border-slate-300"
                  >
                    <Upload size={13} />
                    <span>Unggah LPJ</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => {
          if (!isSubmittingApproval) setApprovalModalOpen(false);
        }}
        title="Persetujuan Surat Tugas & Penomoran Resmi"
        size="md"
      >
        <form onSubmit={handleSubmitApprovalForm(onSubmitApproval)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={controlApproval}
              name="status"
              render={({ field }) => (
                <Select
                  label="Keputusan Approval"
                  required
                  options={[
                    { value: 'disetujui', label: 'Setujui & Terbitkan Surat' },
                    { value: 'ditolak', label: 'Tolak Permohonan' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errorsApproval.status?.message}
                />
              )}
            />

            {approvalStatus === 'disetujui' && (
              <Input
                label="Nomor Surat Tugas Resmi"
                placeholder="Contoh: ST/102/REK/IX/2026"
                required
                error={errorsApproval.nomor_surat?.message}
                {...registerApproval('nomor_surat')}
              />
            )}
          </div>

          {approvalStatus === 'disetujui' && (
            <Input
              label="Nominal Panjar Disetujui (Rp)"
              type="number"
              placeholder="Contoh: 500000"
              min="0"
              hint="* Isi Rp 0 jika non-anggaran (kegiatan daring/Zoom). Jika > 0, otomatis diteruskan ke antrean pencairan kas operasional di modul Keuangan (SIKEU)."
              error={errorsApproval.nominal_disetujui?.message}
              {...registerApproval('nominal_disetujui')}
            />
          )}

          <Input
            label="Catatan Pimpinan / Disposisi"
            placeholder="Catatan disposisi..."
            error={errorsApproval.catatan_approval?.message}
            {...registerApproval('catatan_approval')}
          />

          {approvalStatus === 'disetujui' && (
            <Input
              label="Unggah Berkas Surat Tugas Bertandatangan (PDF, Opsional)"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileSuratTugas(e.target.files[0]);
                }
              }}
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovalModalOpen(false)}
              disabled={isSubmittingApproval}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={approvalStatus === 'disetujui' ? 'primary' : 'danger'}
              size="sm"
              loading={isSubmittingApproval}
              disabled={isSubmittingApproval}
              className="flex items-center gap-2"
            >
              {approvalStatus === 'disetujui' ? (
                <>
                  <Check size={16} />
                  <span>Setujui & Terbitkan</span>
                </>
              ) : (
                <>
                  <X size={16} />
                  <span>Tolak Pengajuan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LPJ Modal */}
      <Modal
        isOpen={lpjModalOpen}
        onClose={() => {
          if (!isSubmittingLpj) setLpjModalOpen(false);
        }}
        title="Unggah Laporan Pertanggungjawaban (LPJ)"
        size="md"
      >
        <form onSubmit={handleSubmitLpjForm(onSubmitLpj)} className="space-y-4">
          <Input
            label="Berkas Laporan LPJ (PDF)"
            type="file"
            accept=".pdf"
            required
            hint="Format PDF, maksimal 10MB."
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFileLpj(e.target.files[0]);
              }
            }}
          />

          <Input
            label="Total Realisasi Biaya (Rp)"
            type="number"
            placeholder="Contoh: 3500000"
            min="0"
            error={errorsLpj.biaya_realisasi?.message}
            {...registerLpj('biaya_realisasi')}
          />

          {(() => {
            const panjarDisetujui = Number(item?.nominal_disetujui ?? item?.estimasi_biaya ?? 0);
            const realisasiNum = watchBiayaRealisasi !== undefined && watchBiayaRealisasi !== null && !isNaN(Number(watchBiayaRealisasi))
              ? Number(watchBiayaRealisasi)
              : null;
            if (panjarDisetujui > 0 && realisasiNum !== null) {
              const selisih = panjarDisetujui - realisasiNum;
              if (selisih > 0) {
                return (
                  <div
                    className="p-4 border rounded-xl text-xs space-y-4"
                    style={{
                      borderColor: 'var(--module-primary)',
                      backgroundColor: 'var(--module-primary-subtle)',
                    }}
                  >
                    <div className="flex justify-between font-medium">
                      <span>Panjar Disetujui:</span>
                      <span>{formatRupiah(panjarDisetujui)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Biaya Terpakai:</span>
                      <span>{formatRupiah(realisasiNum)}</span>
                    </div>
                    <div className="border-t font-bold flex justify-between text-sm" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}>
                      <span>Dana yang Harus Dikembalikan:</span>
                      <span>{formatRupiah(selisih)}</span>
                    </div>
                    <p className="text-2xs flex items-center gap-2">
                      <Check size={14} className="shrink-0" style={{ color: 'var(--module-primary)' }} />
                      <span>Kelebihan dana panjar dinas wajib disetorkan kembali ke kas kampus / bendahara keuangan.</span>
                    </p>
                  </div>
                );
              } else if (selisih < 0) {
                return (
                  <div
                    className="p-4 border rounded-xl text-xs space-y-4"
                    style={{
                      borderColor: 'var(--module-primary)',
                      backgroundColor: 'var(--module-primary-subtle)',
                    }}
                  >
                    <div className="flex justify-between font-medium">
                      <span>Panjar Disetujui:</span>
                      <span>{formatRupiah(panjarDisetujui)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Biaya Terpakai:</span>
                      <span>{formatRupiah(realisasiNum)}</span>
                    </div>
                    <div className="border-t font-bold flex justify-between text-sm" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}>
                      <span>Klaim Kurang Bayar (Reimbursement):</span>
                      <span>{formatRupiah(Math.abs(selisih))}</span>
                    </div>
                    <p className="text-2xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" style={{ color: 'var(--module-primary)' }} />
                      <span>Biaya kedinasan yang terpakai melebihi panjar yang telah disetujui.</span>
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="p-4 border rounded-xl text-xs flex justify-between font-semibold">
                    <span>Biaya Tepat Sesuai Panjar (Nihil):</span>
                    <span>{formatRupiah(panjarDisetujui)}</span>
                  </div>
                );
              }
            }
            return null;
          })()}

          <Textarea
            label="Ringkasan Capaian / Laporan Kegiatan"
            placeholder="Uraian ringkas capaian dinas yang telah diselesaikan..."
            rows={3}
            error={errorsLpj.laporan_kegiatan?.message}
            {...registerLpj('laporan_kegiatan')}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLpjModalOpen(false)}
              disabled={isSubmittingLpj}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmittingLpj}
              disabled={isSubmittingLpj}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              <span>Simpan LPJ</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Pengajuan Surat Tugas"
        message="Apakah Anda yakin ingin menghapus permohonan surat tugas ini? Tindakan ini tidak dapat dibatalkan."
      />

      {/* Confirm Panjar Dialog (Tahap 4) */}
      <ConfirmDialog
        isOpen={confirmPanjarDialogOpen}
        onClose={() => setConfirmPanjarDialogOpen(false)}
        onConfirm={handleConfirmPanjar}
        isLoading={isConfirmingPanjar}
        title="Konfirmasi Panjar Perjalanan Dinas"
        message={`Apakah Anda menyetujui dan mengonfirmasi panjar sebesar ${formatRupiah(item.nominal_disetujui)} untuk penugasan ini? Setelah dikonfirmasi, pengajuan akan siap dicairkan oleh Keuangan.`}
        confirmText="Konfirmasi Panjar"
        cancelText="Batal"
      />
    </div>
  );
}
