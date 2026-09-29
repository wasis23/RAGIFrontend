'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { lmsService } from '@/services/lms.service';
import { referensiService, MasterReferensiItem } from '@/services/referensi.service';
import {
  LmsPertemuanDetail,
  LmsMateriItem,
  LmsTugasItem,
  LmsPengumpulanTugas,
  LmsIzinAbsensiItem,
} from '@/types/lms.types';
import { PaginationMeta } from '@/types/api.types';
import {
  Calendar,
  Clock,
  QrCode,
  Users,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Download,
  Award,
  Link as LinkIcon,
  AlertTriangle,
  Send,
  Save,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── ZOD SCHEMAS DI LUAR KOMPONEN ──
const materiSchema = z.object({
  judul: z.string().min(1, 'Judul materi wajib diisi'),
  tipe_konten_id: z.coerce.number().min(1, 'Tipe konten wajib dipilih'),
  deskripsi: z.string().optional().default(''),
  link_eksternal: z.string().optional().default(''),
});

type MateriFormValues = z.infer<typeof materiSchema>;

const tugasSchema = z.object({
  judul: z.string().min(1, 'Judul tugas wajib diisi'),
  deskripsi: z.string().optional().default(''),
  deadline_at: z.string().optional().default(''),
  maks_nilai: z.coerce.number().min(1, 'Nilai maksimal minimal 1').max(1000, 'Nilai maksimal 1000'),
  komponen_penilaian_id: z.union([z.coerce.number(), z.literal('')]).optional().default(''),
});

type TugasFormValues = z.infer<typeof tugasSchema>;

const nilaiSchema = z.object({
  nilai: z.coerce.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
  feedback_dosen: z.string().optional().default(''),
});

type NilaiFormValues = z.infer<typeof nilaiSchema>;

interface PageProps {
  params: Promise<{
    kelasId: string;
    pertemuanId: string;
  }>;
}

export default function LmsPertemuanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const kelasId = Number(resolvedParams.kelasId);
  const pertemuanId = Number(resolvedParams.pertemuanId);
  const router = useRouter();

  // State Utama
  const [detail, setDetail] = useState<LmsPertemuanDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'presensi' | 'materi' | 'tugas'>('presensi');

  // Pagination Meta untuk DataTable Presensi & Submisi Tugas
  const [absensiMeta, setAbsensiMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  });

  // Master Referensi State
  const [tipeKontenOptions, setTipeKontenOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [statusAbsensiOptions, setStatusAbsensiOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [statusPersetujuanMap, setStatusPersetujuanMap] = useState<Record<string, number>>({});

  // Token Absensi State
  const [tokenInfo, setTokenInfo] = useState<{ token: string; expired_at: string } | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);

  // File Upload State untuk Materi
  const [materiFile, setMateriFile] = useState<File | null>(null);

  // Modal State
  const [showMateriModal, setShowMateriModal] = useState<boolean>(false);
  const [showTugasModal, setShowTugasModal] = useState<boolean>(false);
  const [selectedPengumpulan, setSelectedPengumpulan] = useState<LmsPengumpulanTugas | null>(null);

  // Modal Konfirmasi Hapus
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'materi' | 'tugas' | null;
    id: number | null;
    name: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Presensi Manual Dosen Grid State
  const [attendanceChanges, setAttendanceChanges] = useState<Record<number, number>>({});
  const [isSavingBulkAbsensi, setIsSavingBulkAbsensi] = useState<boolean>(false);

  // React Hook Form Instances dengan Zod Resolver
  const materiFormHook = useForm<MateriFormValues>({
    resolver: zodResolver(materiSchema) as any,
    defaultValues: {
      judul: '',
      tipe_konten_id: undefined as any,
      deskripsi: '',
      link_eksternal: '',
    },
  });

  const tugasFormHook = useForm<TugasFormValues>({
    resolver: zodResolver(tugasSchema) as any,
    defaultValues: {
      judul: '',
      deskripsi: '',
      deadline_at: '',
      maks_nilai: 100,
      komponen_penilaian_id: '',
    },
  });

  const nilaiFormHook = useForm<NilaiFormValues>({
    resolver: zodResolver(nilaiSchema) as any,
    defaultValues: {
      nilai: 85,
      feedback_dosen: '',
    },
  });

  // Fetch Data Master Referensi
  const fetchMasterReferensi = useCallback(async () => {
    try {
      const res = await referensiService.getPaginated({ modul: 'siakad', per_page: 100 });
      if (res.data) {
        const kontenList = res.data
          .filter((r: MasterReferensiItem) => r.tipe === 'tipe_konten_lms')
          .map((r: MasterReferensiItem) => ({ value: r.id, label: r.nama }));
        setTipeKontenOptions(kontenList);

        const absensiList = res.data
          .filter((r: MasterReferensiItem) => r.tipe === 'status_absensi')
          .map((r: MasterReferensiItem) => ({ value: r.id, label: r.nama }));
        setStatusAbsensiOptions(absensiList);

        const persetujuanObj: Record<string, number> = {};
        res.data
          .filter((r: MasterReferensiItem) => r.tipe === 'status_persetujuan_izin')
          .forEach((r: MasterReferensiItem) => {
            persetujuanObj[(r.kode || r.nama).toLowerCase()] = r.id;
          });
        setStatusPersetujuanMap(persetujuanObj);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Detail Sesi Pertemuan
  const fetchDetail = useCallback(async () => {
    try {
      const res = await lmsService.getPertemuanDetail(pertemuanId);
      if (res.status === 'success' && res.data) {
        setDetail(res.data);
        setAbsensiMeta({
          current_page: 1,
          last_page: 1,
          per_page: res.data.absensi_list?.length || 50,
          total: res.data.absensi_list?.length || 0,
        });
        if (res.data.pertemuan.token_absensi && res.data.pertemuan.token_expired_at) {
          setTokenInfo({
            token: res.data.pertemuan.token_absensi,
            expired_at: res.data.pertemuan.token_expired_at,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat detail pertemuan LMS');
    }
  }, [pertemuanId]);

  useEffect(() => {
    fetchMasterReferensi();
    fetchDetail();
  }, [fetchMasterReferensi, fetchDetail]);

  // Generate Token Absensi Realtime
  const handleGenerateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const res = await lmsService.generateTokenAbsensi(pertemuanId);
      if (res.status === 'success' && res.data) {
        setTokenInfo({
          token: res.data.token,
          expired_at: res.data.token_expired_at,
        });
        toast.success(`Token berhasil diaktifkan: ${res.data.token} (15 Menit)`);
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate token absensi');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Simpan Bulk Presensi Mahasiswa oleh Dosen
  const handleSaveBulkAbsensi = async () => {
    const list = Object.entries(attendanceChanges).map(([mhsId, statusId]) => ({
      mahasiswa_id: Number(mhsId),
      status_id: statusId,
    }));

    if (list.length === 0) return;

    setIsSavingBulkAbsensi(true);
    try {
      const res = await lmsService.bulkInputAbsensi(pertemuanId, list);
      if (res.status === 'success') {
        toast.success('Presensi mahasiswa berhasil disimpan');
        setAttendanceChanges({});
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan absensi');
    } finally {
      setIsSavingBulkAbsensi(false);
    }
  };

  // Proses Persetujuan Izin Mahasiswa (Zero Hardcode via Referensi ID)
  const handleProsesIzin = async (izinId: number, targetStatusId: number) => {
    try {
      const res = await lmsService.prosesIzin(izinId, {
        status_id: targetStatusId,
        catatan_dosen: `Diproses oleh dosen pada ${new Date().toLocaleDateString('id-ID')}`,
      });
      if (res.status === 'success') {
        toast.success('Permohonan izin mahasiswa berhasil diproses');
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses permohonan izin');
    }
  };

  // Submit Materi Baru
  const onSaveMateri = async (values: MateriFormValues) => {
    const formData = new FormData();
    formData.append('judul', values.judul);
    formData.append('tipe_konten_id', String(values.tipe_konten_id));
    if (values.deskripsi) formData.append('deskripsi', values.deskripsi);
    if (values.link_eksternal) formData.append('link_eksternal', values.link_eksternal);
    if (materiFile) {
      formData.append('file', materiFile);
    }

    try {
      const res = await lmsService.createMateri(pertemuanId, formData);
      if (res.status === 'success') {
        toast.success('Materi pembelajaran berhasil ditambahkan');
        setShowMateriModal(false);
        materiFormHook.reset();
        setMateriFile(null);
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan materi');
    }
  };

  // Submit Tugas Baru
  const onSaveTugas = async (values: TugasFormValues) => {
    try {
      const payload: any = {
        judul: values.judul,
        deskripsi: values.deskripsi,
        maks_nilai: values.maks_nilai,
        can_submit_late: true,
        is_published: true,
      };

      if (values.deadline_at) payload.deadline_at = values.deadline_at;
      if (values.komponen_penilaian_id) payload.komponen_penilaian_id = Number(values.komponen_penilaian_id);

      const res = await lmsService.createTugas(pertemuanId, payload);
      if (res.status === 'success') {
        toast.success('Tugas perkuliahan berhasil dibuat');
        setShowTugasModal(false);
        tugasFormHook.reset();
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat tugas');
    }
  };

  // Submit Penilaian Tugas Mahasiswa (Sync ke OBE)
  const onSaveNilai = async (values: NilaiFormValues) => {
    if (!selectedPengumpulan) return;

    try {
      const res = await lmsService.beriNilaiTugas(selectedPengumpulan.id, {
        nilai: values.nilai,
        feedback_dosen: values.feedback_dosen,
      });

      if (res.status === 'success') {
        toast.success('Nilai tugas berhasil disimpan & disinkronkan ke OBE');
        setSelectedPengumpulan(null);
        nilaiFormHook.reset();
        fetchDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan nilai');
    }
  };

  // Eksekusi Hapus Materi / Tugas
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'materi') {
        await lmsService.deleteMateri(deleteConfirm.id);
        toast.success('Materi berhasil dihapus');
      } else {
        await lmsService.deleteTugas(deleteConfirm.id);
        toast.success('Tugas berhasil dihapus');
      }
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' });
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  // Kolom Presensi Pertemuan DataTable
  const absensiColumns: ColumnDef<any>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.nama_lengkap}</span>
          <span className="text-2xs text-slate-500 font-mono block">{row.nim}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS SAAT INI',
      render: (row) => (
        <Badge
          variant={
            row.status === 'hadir'
              ? 'green'
              : row.status === 'alfa'
              ? 'red'
              : 'gray'
          }
          style={
            row.status === 'sakit'
              ? { borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }
              : undefined
          }
        >
          {row.status ? String(row.status).toUpperCase() : 'BELUM ABSEN'}
        </Badge>
      ),
    },
    {
      key: 'ubah_status',
      label: 'UBAH STATUS (MANUAL DOSEN)',
      render: (row) => (
        <div className="w-48">
          <Select
            placeholder="Pilih status..."
            options={statusAbsensiOptions}
            value={attendanceChanges[row.mahasiswa_id]}
            onChange={(val) => {
              setAttendanceChanges((prev) => ({
                ...prev,
                [row.mahasiswa_id]: Number(val),
              }));
            }}
          />
        </div>
      ),
    },
    {
      key: 'catatan',
      label: 'CATATAN',
      render: (row) => (
        <span className="text-2xs text-slate-500">{row.catatan || '-'}</span>
      ),
    },
  ];

  // Helper untuk Submisi Tugas DataTable Columns
  const getSubmisiColumns = (tugas: LmsTugasItem): ColumnDef<LmsPengumpulanTugas>[] => [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{p.mahasiswa?.nama_lengkap}</span>
          <span className="text-2xs text-slate-500 font-mono block">{p.mahasiswa?.nim}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (p) => (
        <Badge variant={p.is_late ? 'yellow' : 'green'}>
          {p.is_late ? 'Terlambat' : 'Tepat Waktu'}
        </Badge>
      ),
    },
    {
      key: 'berkas',
      label: 'BERKAS',
      render: (p) =>
        p.file_path ? (
          <a
            href={p.file_path}
            target="_blank"
            rel="noreferrer"
            className="text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-2 text-2xs font-medium"
          >
            <Download size={16} /> {p.nama_file_asli || 'Berkas Tugas'}
          </a>
        ) : (
          <span className="text-2xs text-slate-400">Teks / Catatan</span>
        ),
    },
    {
      key: 'nilai',
      label: 'NILAI OBE',
      align: 'center',
      render: (p) => (
        <span className="font-bold text-xs">
          {p.nilai !== null ? <span className="text-emerald-600">{p.nilai}</span> : <span className="text-slate-400">-</span>}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (p) => (
        <DropdownMenu
          items={[
            {
              label: p.nilai !== null ? 'Koreksi Nilai' : 'Beri Nilai',
              icon: <Award size={16} />,
              onClick: () => {
                setSelectedPengumpulan(p);
                nilaiFormHook.setValue('nilai', p.nilai ?? 85);
                nilaiFormHook.setValue('feedback_dosen', p.feedback_dosen || '');
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={`Pertemuan Ke-${detail?.pertemuan.pertemuan_ke || ''}: ${detail?.pertemuan.materi || 'Sesi Perkuliahan'}`}
        description={`Sesi perkuliahan tanggal ${detail?.pertemuan.tanggal || ''} • ${detail?.pertemuan.jam_mulai || ''} - ${detail?.pertemuan.jam_selesai || 'Selesai'}`}
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad/dashboard' },
          { label: 'LMS', href: '/siakad/lms' },
          { label: 'Kelas', href: `/siakad/lms/${kelasId}` },
          { label: `P${detail?.pertemuan.pertemuan_ke}` },
        ]}
        action={
          <Button
            onClick={() => router.push(`/siakad/lms/${kelasId}`)}
            style={{ background: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      {/* Top Banner: Realtime Token Absensi Widget (Slate Netral Theme) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <QrCode size={24} className="text-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xs text-slate-300 uppercase tracking-wider font-semibold">
              Presensi Realtime Mahasiswa
            </div>
            <div className="flex items-center gap-2">
              {tokenInfo?.token ? (
                <>
                  <span className="text-2xl font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30">
                    {tokenInfo.token}
                  </span>
                  <span className="text-2xs text-slate-300">
                    (Aktif s/d {tokenInfo.expired_at ? new Date(tokenInfo.expired_at).toLocaleTimeString('id-ID') : '15 mnt'})
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-300">
                  Token belum diaktifkan untuk sesi pertemuan ini.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            loading={isGeneratingToken}
            disabled={isGeneratingToken}
            icon={<QrCode size={16} />}
            onClick={handleGenerateToken}
          >
            {tokenInfo?.token ? 'Regenerate Token Baru' : 'Buka Token Presensi (15 Mnt)'}
          </Button>
        </div>
      </div>

      {/* Tab Menu Underline Standard */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('presensi')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'presensi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Presensi Mahasiswa ({detail?.absensi_list?.length || 0})</span>
        </Button>

        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('materi')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'materi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={16} />
          <span>Materi Pembelajaran ({detail?.materi_list?.length || 0})</span>
        </Button>

        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('tugas')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tugas'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText size={16} />
          <span>Penugasan & Nilai OBE ({detail?.tugas_list?.length || 0})</span>
        </Button>
      </div>

      {/* Tab 1: Presensi Mahasiswa & Verifikasi Izin */}
      {activeTab === 'presensi' && (
        <div className="space-y-6">
          {/* Permohonan Izin / Sakit yang Masuk */}
          {detail?.izin_list && detail.izin_list.length > 0 && (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-4">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                Permohonan Izin / Sakit Mahasiswa ({detail.izin_list.length})
              </h4>

              <div className="flex flex-col gap-2">
                {detail.izin_list.map((iz: LmsIzinAbsensiItem) => (
                  <div
                    key={iz.id}
                    className="p-4 bg-white rounded-lg border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{iz.mahasiswa?.nama_lengkap}</span>
                        <span className="font-mono text-2xs text-slate-500">({iz.mahasiswa?.nim})</span>
                        <Badge
                          variant="gray"
                          style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                        >
                          {iz.tipe_izin.toUpperCase()}
                        </Badge>
                        <Badge variant={iz.status === 'disetujui' ? 'green' : iz.status === 'ditolak' ? 'red' : 'gray'}>
                          {iz.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-2xs">Alasan: {iz.alasan}</p>
                    </div>

                    <DropdownMenu
                      items={[
                        ...(iz.surat_path
                          ? [
                              {
                                label: 'Lihat Surat Keterangan',
                                icon: <Download size={16} />,
                                onClick: () => {
                                  window.open(iz.surat_path || '#', '_blank');
                                },
                              },
                            ]
                          : []),
                        ...(iz.status === 'pending'
                          ? [
                              {
                                label: 'Setujui Permohonan',
                                icon: <Check size={16} />,
                                onClick: () => handleProsesIzin(iz.id, statusPersetujuanMap['disetujui'] || 2),
                              },
                              {
                                label: 'Tolak Permohonan',
                                icon: <X size={16} />,
                                variant: 'danger' as const,
                                onClick: () => handleProsesIzin(iz.id, statusPersetujuanMap['ditolak'] || 3),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabel Presensi Mahasiswa Kelas via Mandatory DataTable */}
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Daftar Kehadiran Sesi Pertemuan</h4>
                <p className="text-2xs text-slate-500">
                  Dosen dapat mengubah status presensi mahasiswa secara langsung lalu menekan Simpan Presensi.
                </p>
              </div>

              {Object.keys(attendanceChanges).length > 0 && (
                <Button
                  size="sm"
                  loading={isSavingBulkAbsensi}
                  disabled={isSavingBulkAbsensi}
                  icon={<Send size={16} />}
                  onClick={handleSaveBulkAbsensi}
                >
                  Simpan Perubahan Presensi ({Object.keys(attendanceChanges).length})
                </Button>
              )}
            </div>

            <DataTable
              columns={absensiColumns}
              data={detail?.absensi_list || []}
              meta={absensiMeta}
              onPageChange={(page) => {
                setAbsensiMeta((prev) => ({ ...prev, current_page: page }));
                fetchDetail();
              }}
              onLimitChange={(limit) => {
                setAbsensiMeta((prev) => ({ ...prev, per_page: limit, current_page: 1 }));
                fetchDetail();
              }}
              emptyMessage="Belum ada data mahasiswa terdaftar untuk sesi pertemuan ini."
            />
          </div>
        </div>
      )}

      {/* Tab 2: Materi Pembelajaran */}
      {activeTab === 'materi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">Materi & Bahan Perkuliahan</h4>
            <Button
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowMateriModal(true)}
            >
              Tambah Materi
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail?.materi_list?.map((m: LmsMateriItem) => (
              <div
                key={m.id}
                className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-2xs">
                        #{m.urutan}
                      </span>
                      <h5 className="font-bold text-slate-900 text-xs">{m.judul}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="gray"
                        style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                      >
                        {m.tipe_konten}
                      </Badge>
                      <DropdownMenu
                        items={[
                          {
                            label: 'Hapus Materi',
                            icon: <Trash2 size={16} />,
                            variant: 'danger',
                            onClick: () => setDeleteConfirm({ isOpen: true, type: 'materi', id: m.id, name: m.judul }),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  {m.deskripsi && (
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      {m.deskripsi}
                    </p>
                  )}

                  {m.link_eksternal && (
                    <div>
                      <a
                        href={m.link_eksternal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-2 font-medium"
                      >
                        <LinkIcon size={16} /> Buka Tautan Eksternal
                      </a>
                    </div>
                  )}

                  {/* Berkas Lampiran */}
                  {m.files && m.files.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <hr className="border-t border-slate-100 my-4" />
                      <div className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">
                        Berkas Unduhan ({m.files.length})
                      </div>
                      {m.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-2xs"
                        >
                          <span className="font-medium text-slate-700 truncate max-w-xs">{f.nama_file}</span>
                          <DropdownMenu
                            items={[
                              {
                                label: 'Unduh Berkas',
                                icon: <Download size={16} />,
                                onClick: () => {
                                  window.open(f.file_path, '_blank');
                                },
                              },
                            ]}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Penugasan & Sync Nilai OBE */}
      {activeTab === 'tugas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Penugasan Mahasiswa & Nilai OBE</h4>
              <p className="text-2xs text-slate-500">
                Nilai yang diinputkan dosen akan otomatis tersinkronisasi ke sistem OBE (siakad_nilai_komponen_mhs).
              </p>
            </div>
            <Button
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowTugasModal(true)}
            >
              Buat Tugas Baru
            </Button>
          </div>

          <div className="space-y-4">
            {detail?.tugas_list?.map((t: LmsTugasItem) => (
              <div key={t.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 text-xs">{t.judul}</h5>
                      {t.komponen_penilaian && (
                        <Badge variant="green">
                          OBE: {t.komponen_penilaian.nama_komponen} ({t.komponen_penilaian.bobot}%)
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xs text-slate-600">{t.deskripsi}</p>
                    <div className="flex items-center gap-4 text-2xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-2">
                        <Clock size={16} /> Deadline: {t.deadline_at ? new Date(t.deadline_at).toLocaleString('id-ID') : 'Tidak ditentukan'}
                      </span>
                      <span>Maks Nilai: {t.maks_nilai}</span>
                      <span>Terkumpul: {t.pengumpulan?.length || 0} Mahasiswa</span>
                    </div>
                  </div>

                  <DropdownMenu
                    items={[
                      {
                        label: 'Hapus Tugas',
                        icon: <Trash2 size={16} />,
                        variant: 'danger',
                        onClick: () => setDeleteConfirm({ isOpen: true, type: 'tugas', id: t.id, name: t.judul }),
                      },
                    ]}
                  />
                </div>

                {/* Submisi Mahasiswa via Mandatory DataTable */}
                <div className="flex flex-col gap-2">
                  <hr className="border-t border-slate-100 my-4" />
                  <h6 className="text-2xs font-bold text-slate-700 uppercase tracking-wider">
                    Pengumpulan Tugas Mahasiswa
                  </h6>

                  <DataTable
                    columns={getSubmisiColumns(t)}
                    data={t.pengumpulan || []}
                    meta={{
                      current_page: 1,
                      last_page: 1,
                      per_page: t.pengumpulan?.length || 50,
                      total: t.pengumpulan?.length || 0,
                    }}
                    onPageChange={() => {
                      fetchDetail();
                    }}
                    onLimitChange={() => {
                      fetchDetail();
                    }}
                    emptyMessage="Belum ada mahasiswa yang mengumpulkan tugas ini."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah Materi dengan Zod & react-hook-form */}
      <Modal
        open={showMateriModal}
        onClose={() => setShowMateriModal(false)}
        title="Tambah Materi Pembelajaran"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setShowMateriModal(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="form-tambah-materi"
              loading={materiFormHook.formState.isSubmitting}
              disabled={materiFormHook.formState.isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan Materi
            </Button>
          </div>
        }
      >
        <form id="form-tambah-materi" onSubmit={materiFormHook.handleSubmit(onSaveMateri)} className="space-y-4">
          <Input
            label="Judul Materi"
            placeholder="Contoh: Modul 01 - Pengantar Cloud Architecture"
            error={materiFormHook.formState.errors.judul?.message}
            {...materiFormHook.register('judul')}
          />

          <Controller
            name="tipe_konten_id"
            control={materiFormHook.control}
            render={({ field }) => (
              <Select
                label="Tipe Konten Pembelajaran"
                options={tipeKontenOptions}
                value={field.value}
                onChange={(val) => field.onChange(Number(val))}
                error={materiFormHook.formState.errors.tipe_konten_id?.message}
              />
            )}
          />

          <Textarea
            label="Deskripsi / Catatan Materi"
            placeholder="Tuliskan petunjuk pembelajaran bagi mahasiswa..."
            error={materiFormHook.formState.errors.deskripsi?.message}
            {...materiFormHook.register('deskripsi')}
          />

          <Input
            label="Tautan Eksternal / Video Embed (Opsional)"
            placeholder="https://..."
            error={materiFormHook.formState.errors.link_eksternal?.message}
            {...materiFormHook.register('link_eksternal')}
          />

          <Input
            type="file"
            label="Berkas Dokumen / Slide / PDF (Opsional)"
            onChange={(e) => setMateriFile(e.target.files?.[0] || null)}
          />
        </form>
      </Modal>

      {/* Modal Buat Tugas dengan Zod & react-hook-form */}
      <Modal
        open={showTugasModal}
        onClose={() => setShowTugasModal(false)}
        title="Buat Tugas Perkuliahan Baru"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setShowTugasModal(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="form-buat-tugas"
              loading={tugasFormHook.formState.isSubmitting}
              disabled={tugasFormHook.formState.isSubmitting}
              icon={<Save size={16} />}
            >
              Terbitkan Tugas
            </Button>
          </div>
        }
      >
        <form id="form-buat-tugas" onSubmit={tugasFormHook.handleSubmit(onSaveTugas)} className="space-y-4">
          <Input
            label="Judul Penugasan"
            placeholder="Contoh: Tugas 1: Implementasi Relasi Database"
            error={tugasFormHook.formState.errors.judul?.message}
            {...tugasFormHook.register('judul')}
          />

          <Textarea
            label="Instruksi Tugas"
            placeholder="Jelaskan spesifikasi pengerjaan tugas..."
            error={tugasFormHook.formState.errors.deskripsi?.message}
            {...tugasFormHook.register('deskripsi')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Tenggat Waktu (Deadline)"
              error={tugasFormHook.formState.errors.deadline_at?.message}
              {...tugasFormHook.register('deadline_at')}
            />

            <Input
              type="number"
              label="Nilai Maksimal"
              error={tugasFormHook.formState.errors.maks_nilai?.message}
              {...tugasFormHook.register('maks_nilai')}
            />
          </div>

          <Controller
            name="komponen_penilaian_id"
            control={tugasFormHook.control}
            render={({ field }) => (
              <AsyncSelect
                label="Hubungkan ke Komponen Penilaian OBE (Auto-Sync)"
                placeholder="Cari komponen penilaian OBE..."
                value={field.value}
                onChange={(val) => field.onChange(val ? String(val) : '')}
                loadOptions={async (input) => {
                  try {
                    const res = await lmsService.getPertemuanDetail(pertemuanId);
                    const list = (res.data?.komponen_obe_list || []).map((k) => ({
                      value: String(k.id),
                      label: `${k.nama_komponen} (Bobot ${k.bobot}%)`,
                    }));
                    if (!input) return list;
                    return list.filter((item) =>
                      item.label.toLowerCase().includes(input.toLowerCase())
                    );
                  } catch {
                    return [];
                  }
                }}
                isClearable
                error={tugasFormHook.formState.errors.komponen_penilaian_id?.message}
              />
            )}
          />
        </form>
      </Modal>

      {/* Modal Beri Nilai Tugas (OBE Sync) dengan Zod & react-hook-form */}
      <Modal
        open={Boolean(selectedPengumpulan)}
        onClose={() => setSelectedPengumpulan(null)}
        title={`Penilaian Tugas: ${selectedPengumpulan?.mahasiswa?.nama_lengkap}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setSelectedPengumpulan(null)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="form-nilai-tugas"
              loading={nilaiFormHook.formState.isSubmitting}
              disabled={nilaiFormHook.formState.isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan & Sync ke OBE
            </Button>
          </div>
        }
      >
        <form id="form-nilai-tugas" onSubmit={nilaiFormHook.handleSubmit(onSaveNilai)} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg text-xs flex flex-col gap-2">
            <div>
              <span className="text-slate-500">Mahasiswa:</span>{' '}
              <strong className="text-slate-900">{selectedPengumpulan?.mahasiswa?.nama_lengkap}</strong> (
              {selectedPengumpulan?.mahasiswa?.nim})
            </div>
            {selectedPengumpulan?.catatan_mahasiswa && (
              <div>
                <span className="text-slate-500">Catatan Mahasiswa:</span>{' '}
                <span className="text-slate-800">{selectedPengumpulan.catatan_mahasiswa}</span>
              </div>
            )}
          </div>

          <Input
            type="number"
            label="Nilai Tugas (0 - 100)"
            error={nilaiFormHook.formState.errors.nilai?.message}
            {...nilaiFormHook.register('nilai')}
          />

          <Textarea
            label="Feedback / Catatan Evaluasi Dosen"
            placeholder="Berikan saran konstruktif untuk mahasiswa..."
            error={nilaiFormHook.formState.errors.feedback_dosen?.message}
            {...nilaiFormHook.register('feedback_dosen')}
          />
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={`Hapus ${deleteConfirm.type === 'materi' ? 'Materi' : 'Tugas'}`}
        message={
          <span>
            Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Tindakan ini akan menghapus berkas lampiran terkait.
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
