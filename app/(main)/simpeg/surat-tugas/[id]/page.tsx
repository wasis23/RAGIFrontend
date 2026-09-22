'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Briefcase,
  Car,
  Users,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import { useAuth } from '@/hooks/useAuth';
import type { SuratTugas, SuratTugasStatus } from '@/types/simpeg.surat-tugas.types';

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

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'disetujui' | 'ditolak'>('disetujui');
  const [nomorSurat, setNomorSurat] = useState('');
  const [catatanApproval, setCatatanApproval] = useState('');
  const [fileSuratTugas, setFileSuratTugas] = useState<File | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // LPJ modal state
  const [lpjModalOpen, setLpjModalOpen] = useState(false);
  const [fileLpj, setFileLpj] = useState<File | null>(null);
  const [laporanKegiatan, setLaporanKegiatan] = useState('');
  const [biayaRealisasi, setBiayaRealisasi] = useState('');
  const [isSubmittingLpj, setIsSubmittingLpj] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (approvalStatus === 'disetujui' && !nomorSurat.trim()) {
      toast.error('Nomor surat tugas resmi wajib diisi.');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      await simpegSuratTugasService.approve(item.id, {
        status: approvalStatus,
        nomor_surat: nomorSurat,
        catatan_approval: catatanApproval,
        file_surat_tugas: fileSuratTugas,
      });

      toast.success(
        approvalStatus === 'disetujui'
          ? 'Surat tugas disetujui! Presensi dinas luar tim telah diaktifkan otomatis.'
          : 'Surat tugas ditolak.'
      );
      setApprovalModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan surat tugas.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Submit LPJ
  const handleSubmitLpj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !fileLpj) {
      toast.error('Berkas laporan LPJ (PDF) wajib diunggah.');
      return;
    }

    setIsSubmittingLpj(true);
    try {
      await simpegSuratTugasService.uploadLpj(item.id, {
        file_lpj: fileLpj,
        laporan_kegiatan: laporanKegiatan,
        biaya_realisasi: biayaRealisasi ? parseFloat(biayaRealisasi) : undefined,
      });

      toast.success('Laporan LPJ dinas berhasil diunggah.');
      setLpjModalOpen(false);
      setFileLpj(null);
      setLaporanKegiatan('');
      setBiayaRealisasi('');
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah laporan LPJ.');
    } finally {
      setIsSubmittingLpj(false);
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
            {canApprove && item.status === 'diajukan' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setNomorSurat(item.nomor_surat || '');
                  setCatatanApproval('');
                  setApprovalStatus('disetujui');
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
                  setLaporanKegiatan(item.laporan_kegiatan || '');
                  setBiayaRealisasi(item.biaya_realisasi ? item.biaya_realisasi.toString() : '');
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

      {/* Approval Details Banner if Approved or Rejected */}
      {item.status === 'disetujui' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-900">
          <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950">Surat Tugas Resmi Telah Disetujui</p>
            <p>
              Presensi kepegawaian otomatis terisi sebagai <strong>DINAS LUAR</strong> untuk seluruh anggota
              tim pada rentang tanggal dinas ({item.tanggal_berangkat} s/d {item.tanggal_kembali}).
            </p>
            {item.catatan_approval && (
              <p className="text-emerald-800 italic mt-1">&quot;{item.catatan_approval}&quot;</p>
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

      {/* CARD 4: BERKAS DOKUMEN & LPJ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText size={18} className="text-primary-600 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">Dokumen Resmi & Pelaporan LPJ</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      setLaporanKegiatan('');
                      setBiayaRealisasi('');
                      setLpjModalOpen(true);
                    }}
                    className="text-xs flex items-center gap-1 border-slate-300"
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
        <form onSubmit={handleSubmitApproval} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Keputusan Approval <span className="text-rose-500">*</span>
              </label>
              <Select
                options={[
                  { value: 'disetujui', label: 'Setujui & Terbitkan Surat' },
                  { value: 'ditolak', label: 'Tolak Permohonan' },
                ]}
                value={approvalStatus}
                onChange={(val: any) => setApprovalStatus(val as 'disetujui' | 'ditolak')}
              />
            </div>

            {approvalStatus === 'disetujui' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nomor Surat Tugas Resmi <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: ST/102/REK/IX/2026"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Pimpinan / Disposisi
            </label>
            <Input
              placeholder="Catatan disposisi..."
              value={catatanApproval}
              onChange={(e) => setCatatanApproval(e.target.value)}
            />
          </div>

          {approvalStatus === 'disetujui' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Unggah Berkas Surat Tugas Bertandatangan (PDF, Opsional)
              </label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileSuratTugas(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              isLoading={isSubmittingApproval}
            >
              {approvalStatus === 'disetujui' ? 'Setujui & Terbitkan' : 'Tolak Pengajuan'}
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
        <form onSubmit={handleSubmitLpj} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Berkas Laporan LPJ (PDF) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="file"
              accept=".pdf"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileLpj(e.target.files[0]);
                }
              }}
            />
            <p className="text-[11px] text-slate-500 mt-1">Format PDF, maksimal 10MB.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Total Realisasi Biaya (Rp)
            </label>
            <Input
              type="number"
              placeholder="Contoh: 3500000"
              value={biayaRealisasi}
              onChange={(e) => setBiayaRealisasi(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ringkasan Capaian / Laporan Kegiatan
            </label>
            <Input
              placeholder="Uraian ringkas capaian dinas yang telah diselesaikan..."
              value={laporanKegiatan}
              onChange={(e) => setLaporanKegiatan(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLpjModalOpen(false)}
              disabled={isSubmittingLpj}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingLpj}>
              Simpan LPJ
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
    </div>
  );
}
