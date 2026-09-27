'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Upload,
  Send,
  Award,
  Download,
  ExternalLink,
  Edit,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage, getStorageFileUrl } from '@/lib/utils';
import type { PenilaianKinerja, SkpItem, StatusSkp, PredikatKinerja } from '@/types/simpeg.types';

const realisasiSchema = z.object({
  realisasi_output: z.string().min(1, 'Realisasi output wajib diisi'),
  realisasi_mutu: z
    .string()
    .min(1, 'Realisasi mutu wajib diisi')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: 'Realisasi mutu harus di antara 0 sampai 100',
    }),
  realisasi_waktu: z.string().min(1, 'Realisasi waktu wajib diisi'),
  realisasi_biaya: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d+$/.test(val.trim()), {
      message: 'Realisasi biaya harus berupa angka nominal bulat',
    }),
  keterangan: z.string().optional().nullable(),
});

type RealisasiFormValues = z.infer<typeof realisasiSchema>;

const evaluasiSchema = z.object({
  nilai_skp: z
    .string()
    .min(1, 'Nilai SKP wajib diisi')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: 'Nilai SKP akhir harus di antara 0 sampai 100',
    }),
  nilai_bkd: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Nilai BKD harus berupa angka non-negatif',
    }),
  predikat: z.enum(['sangat_baik', 'baik', 'cukup', 'kurang', 'sangat_kurang'], {
    message: 'Predikat kinerja wajib dipilih',
  }),
  catatan_evaluator: z.string().optional().nullable(),
});

type EvaluasiFormValues = z.infer<typeof evaluasiSchema>;

export default function SkpDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const { user, isAdmin, hasPermission } = useAuth();
  const canEvaluate = isAdmin || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');

  const [skp, setSkp] = useState<PenilaianKinerja | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow Action Loading
  const [submittingTarget, setSubmittingTarget] = useState(false);
  const [approvingTarget, setApprovingTarget] = useState(false);

  // Modal Realisasi State & Form
  const [realisasiModalOpen, setRealisasiModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SkpItem | null>(null);
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [submittingRealisasi, setSubmittingRealisasi] = useState(false);

  const {
    register: registerRealisasi,
    handleSubmit: handleSubmitRealisasi,
    reset: resetRealisasi,
    formState: { errors: errorsRealisasi },
  } = useForm<RealisasiFormValues>({
    resolver: zodResolver(realisasiSchema),
    defaultValues: {
      realisasi_output: '',
      realisasi_mutu: '100',
      realisasi_waktu: '',
      realisasi_biaya: '',
      keterangan: '',
    },
  });

  // Modal Evaluasi State & Form
  const [evaluasiModalOpen, setEvaluasiModalOpen] = useState(false);
  const [submittingEvaluasi, setSubmittingEvaluasi] = useState(false);

  const {
    register: registerEvaluasi,
    handleSubmit: handleSubmitEvaluasi,
    control: controlEvaluasi,
    reset: resetEvaluasi,
    formState: { errors: errorsEvaluasi },
  } = useForm<EvaluasiFormValues>({
    resolver: zodResolver(evaluasiSchema),
    defaultValues: {
      nilai_skp: '85',
      nilai_bkd: '',
      predikat: 'baik',
      catatan_evaluator: '',
    },
  });

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await simpegService.getKinerjaDetail(id);
      if (res?.data) {
        setSkp(res.data);
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat detail SKP'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmitTarget = async () => {
    if (!skp) return;
    setSubmittingTarget(true);
    try {
      await simpegService.submitTargetKinerja(skp.id);
      toast.success('Sasaran kinerja berhasil diajukan kepada Pejabat Penilai');
      loadDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengajukan sasaran kinerja'));
    } finally {
      setSubmittingTarget(false);
    }
  };

  const handleApproveTarget = async () => {
    if (!skp) return;
    setApprovingTarget(true);
    try {
      await simpegService.approveTargetKinerja(skp.id);
      toast.success('Target sasaran kinerja telah disetujui');
      loadDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyetujui target SKP'));
    } finally {
      setApprovingTarget(false);
    }
  };

  const handleOpenRealisasi = (item: SkpItem) => {
    setSelectedItem(item);
    resetRealisasi({
      realisasi_output: item.realisasi_output || item.target_output || '',
      realisasi_mutu: String(item.realisasi_mutu ?? item.target_mutu ?? 100),
      realisasi_waktu: item.realisasi_waktu || item.target_waktu || '',
      realisasi_biaya: item.realisasi_biaya !== null && item.realisasi_biaya !== undefined ? String(item.realisasi_biaya) : '',
      keterangan: item.keterangan || '',
    });
    setFileBukti(null);
    setRealisasiModalOpen(true);
  };

  const handleOpenEvaluasi = () => {
    resetEvaluasi({
      nilai_skp: skp?.nilai_skp !== null && skp?.nilai_skp !== undefined ? String(skp.nilai_skp) : '85',
      nilai_bkd: skp?.nilai_bkd !== null && skp?.nilai_bkd !== undefined ? String(skp.nilai_bkd) : '',
      predikat: (skp?.predikat as any) || 'baik',
      catatan_evaluator: skp?.catatan_evaluator || '',
    });
    setEvaluasiModalOpen(true);
  };

  const onSaveRealisasi = async (values: RealisasiFormValues) => {
    if (!skp || !selectedItem) return;

    setSubmittingRealisasi(true);
    try {
      const formData = new FormData();
      formData.append('items[0][id]', String(selectedItem.id));
      formData.append('items[0][realisasi_output]', values.realisasi_output);
      formData.append('items[0][realisasi_mutu]', values.realisasi_mutu);
      formData.append('items[0][realisasi_waktu]', values.realisasi_waktu);
      if (values.realisasi_biaya) {
        formData.append('items[0][realisasi_biaya]', values.realisasi_biaya);
      }
      if (values.keterangan) {
        formData.append('items[0][keterangan]', values.keterangan);
      }
      if (fileBukti) {
        formData.append('items[0][berkas_bukti]', fileBukti);
      }

      await simpegService.submitRealisasiKinerja(skp.id, formData);
      toast.success('Realisasi capaian & berkas bukti berhasil disimpan');
      setRealisasiModalOpen(false);
      loadDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan realisasi'));
    } finally {
      setSubmittingRealisasi(false);
    }
  };

  const onSaveEvaluasi = async (values: EvaluasiFormValues) => {
    if (!skp) return;

    setSubmittingEvaluasi(true);
    try {
      const payload = {
        nilai_skp: Number(values.nilai_skp),
        nilai_bkd: values.nilai_bkd ? Number(values.nilai_bkd) : null,
        predikat: values.predikat as PredikatKinerja,
        catatan_evaluator: values.catatan_evaluator || null,
      };

      await simpegService.evaluateKinerja(skp.id, payload);
      toast.success('Evaluasi akhir capaian SKP berhasil ditetapkan');
      setEvaluasiModalOpen(false);
      loadDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan evaluasi'));
    } finally {
      setSubmittingEvaluasi(false);
    }
  };

  const getStatusBadge = (status?: StatusSkp) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">Draft Target</Badge>;
      case 'diajukan':
        return <Badge variant="amber">Menunggu Persetujuan Atasan</Badge>;
      case 'disetujui':
        return <Badge variant="simpeg">Target Disetujui (Pengisian Realisasi)</Badge>;
      case 'dinilai':
        return <Badge variant="success">Selesai Dinilai</Badge>;
      default:
        return <Badge variant="gray">{status || 'Draft'}</Badge>;
    }
  };

  const getPredikatBadge = (p: PredikatKinerja) => {
    switch (p) {
      case 'sangat_baik':
        return <Badge variant="success" className="uppercase">Sangat Baik</Badge>;
      case 'baik':
        return <Badge variant="simpeg" className="uppercase">Baik</Badge>;
      case 'cukup':
        return <Badge variant="yellow" className="uppercase">Cukup</Badge>;
      case 'kurang':
        return <Badge variant="warning" className="uppercase">Kurang</Badge>;
      case 'sangat_kurang':
        return <Badge variant="danger" className="uppercase">Sangat Kurang</Badge>;
      default:
        return <Badge variant="gray" className="uppercase">{p}</Badge>;
    }
  };

  const isUserPejabatPenilai =
    Boolean((user as any)?.pegawai?.id && skp?.pejabat_penilai_id === (user as any)?.pegawai?.id);

  const isOwner =
    Boolean((user as any)?.pegawai?.id && skp?.pegawai_id === (user as any)?.pegawai?.id);

  const columns: ColumnDef<SkpItem>[] = [
    {
      key: 'kategori',
      label: 'Kategori & Uraian Tugas',
      render: (row) => (
        <div className="space-y-1 max-w-[320px]">
          <Badge variant="gray" className="text-[10px]">
            {row.kategori?.nama || 'Tugas Pokok'}
          </Badge>
          <div className="text-xs font-semibold text-slate-900 leading-relaxed">
            {row.uraian_tugas}
          </div>
        </div>
      ),
    },
    {
      key: 'target',
      label: 'Target Sasaran',
      render: (row) => (
        <div className="text-xs space-y-0.5 text-slate-700">
          <div><span className="font-semibold text-slate-500">Output:</span> {row.target_output}</div>
          <div><span className="font-semibold text-slate-500">Mutu:</span> {row.target_mutu}%</div>
          <div><span className="font-semibold text-slate-500">Waktu:</span> {row.target_waktu}</div>
          {row.target_biaya ? (
            <div><span className="font-semibold text-slate-500">Biaya:</span> Rp {Number(row.target_biaya).toLocaleString()}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'realisasi',
      label: 'Realisasi Capaian',
      render: (row) => (
        <div className="text-xs space-y-0.5 text-slate-700">
          {row.realisasi_output ? (
            <>
              <div><span className="font-semibold text-slate-500">Output:</span> {row.realisasi_output}</div>
              <div><span className="font-semibold text-slate-500">Mutu:</span> {row.realisasi_mutu}%</div>
              <div><span className="font-semibold text-slate-500">Waktu:</span> {row.realisasi_waktu || '-'}</div>
              {row.realisasi_biaya !== null && row.realisasi_biaya !== undefined && (
                <div><span className="font-semibold text-slate-500">Biaya:</span> Rp {Number(row.realisasi_biaya).toLocaleString()}</div>
              )}
            </>
          ) : (
            <span className="text-slate-400 italic">Belum diisi</span>
          )}
        </div>
      ),
    },
    {
      key: 'bukti',
      label: 'Berkas Bukti',
      render: (row) => (
        <div>
          {row.berkas_bukti ? (
            <a
              href={getStorageFileUrl(row.berkas_bukti)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--module-primary)] hover:underline bg-[var(--module-primary-subtle)] p-2 rounded-lg transition"
            >
              <Download size={16} />
              Bukti Luaran
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">Tidak ada</span>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const canEditRealisasi =
          (isOwner || isAdmin) && (skp?.status === 'disetujui' || skp?.status === 'dinilai');

        return (
          <div className="flex justify-end">
            {canEditRealisasi ? (
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={14} />}
                onClick={() => handleOpenRealisasi(row)}
              >
                Isi Realisasi
              </Button>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in p-6 text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Memuat rincian Sasaran Kinerja Pegawai...</p>
      </div>
    );
  }

  if (!skp) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Rincian Sasaran Kinerja"
          action={
            <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => router.push('/simpeg/kinerja')}>
              Kembali
            </Button>
          }
        />
        <div className="card p-8 text-center text-slate-500">
          Dokumen Sasaran Kinerja Pegawai tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <PageHeader
        title={`SKP: ${skp.pegawai?.nama_lengkap || 'Pegawai'}`}
        description={`Periode Tahun ${skp.tahun} (Semester ${skp.semester.toUpperCase()})`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/kinerja')}
            >
              Kembali
            </Button>

            {/* Workflow Action 1: Ajukan Target (Jika Draft & Pemilik/Admin) */}
            {skp.status === 'draft' && (isOwner || isAdmin) && (
              <Button
                variant="primary"
                icon={<Send size={16} />}
                isLoading={submittingTarget}
                onClick={handleSubmitTarget}
              >
                Ajukan Target
              </Button>
            )}

            {/* Workflow Action 2: Setujui Target (Jika Diajukan & Penilai/Admin) */}
            {skp.status === 'diajukan' && (isUserPejabatPenilai || canEvaluate) && (
              <Button
                variant="primary"
                icon={<CheckCircle2 size={16} />}
                isLoading={approvingTarget}
                onClick={handleApproveTarget}
              >
                Setujui Target SKP
              </Button>
            )}

            {/* Workflow Action 3: Evaluasi Nilai Akhir (Jika Disetujui/Dinilai & Penilai/Admin) */}
            {(skp.status === 'disetujui' || skp.status === 'dinilai') && (isUserPejabatPenilai || canEvaluate) && (
              <Button
                variant="primary"
                icon={<Award size={16} />}
                onClick={handleOpenEvaluasi}
              >
                {skp.status === 'dinilai' ? 'Ubah Evaluasi Nilai' : 'Evaluasi & Beri Nilai'}
              </Button>
            )}
          </div>
        }
      />

      {/* HEADER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pegawai Card */}
        <div className="card p-4 bg-white border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <UserCheck size={14} className="text-primary-600" />
            Pegawai Bersangkutan
          </div>
          <div className="font-bold text-base text-slate-900 leading-snug">
            {skp.pegawai?.nama_lengkap}
          </div>
          <div className="text-xs text-slate-500">
            NIP: {skp.pegawai?.nip || '-'} | NIDN: {skp.pegawai?.nidn || '-'}
          </div>
          <div className="text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">
            Unit: {skp.pegawai?.unit_kerja?.nama || 'Universitas'}
          </div>
        </div>

        {/* Pejabat Penilai Card */}
        <div className="card p-4 bg-white border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <UserCheck size={14} className="text-slate-600" />
            Pejabat Penilai / Atasan
          </div>
          <div className="font-bold text-base text-slate-900 leading-snug">
            {skp.pejabat_penilai?.nama_lengkap || 'Belum Ditentukan'}
          </div>
          <div className="text-xs text-slate-500">
            NIP: {skp.pejabat_penilai?.nip || '-'}
          </div>
          <div className="text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">
            Jabatan: {(skp.pejabat_penilai as any)?.jabatan_terakhir || 'Pimpinan'}
          </div>
        </div>

        {/* Status Card */}
        <div className="card p-4 bg-white border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" />
            Status Alur Kinerja
          </div>
          <div>{getStatusBadge(skp.status)}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-0.5">
            {skp.tanggal_pengajuan && <div>Diajukan: {new Date(skp.tanggal_pengajuan).toLocaleDateString('id-ID')}</div>}
            {skp.tanggal_persetujuan && <div>Disetujui: {new Date(skp.tanggal_persetujuan).toLocaleDateString('id-ID')}</div>}
            {skp.evaluated_at && <div>Dinilai: {new Date(skp.evaluated_at).toLocaleDateString('id-ID')}</div>}
          </div>
        </div>

        {/* Nilai Akhir Card */}
        <div className="card p-4 bg-white border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award size={14} className="text-emerald-600" />
            Capaian & Predikat
          </div>
          {skp.status === 'dinilai' ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{skp.nilai_skp}</span>
                <span className="text-xs text-slate-500">/ 100</span>
                {skp.nilai_bkd && (
                  <span className="text-xs font-semibold text-slate-700 ml-auto bg-slate-100 px-2 py-0.5 rounded">
                    BKD: {skp.nilai_bkd} SKS
                  </span>
                )}
              </div>
              <div className="mt-1">{getPredikatBadge(skp.predikat)}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              Evaluasi belum dilakukan oleh pejabat penilai.
            </div>
          )}
          {skp.catatan_evaluator && (
            <div className="text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
              &quot;{skp.catatan_evaluator}&quot;
            </div>
          )}
        </div>
      </div>

      {/* TABLE BUTIR SASARAN KINERJA */}
      <div className="card bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900">Butir-Butir Sasaran Kinerja (Target vs Realisasi)</h2>
            <p className="text-xs text-slate-500">
              Daftar kegiatan Tridharma, target mutu/output, dan bukti fisik luaran
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={skp.items || []}
          isLoading={false}
          emptyMessage={
            <div className="py-8 text-center text-slate-400">
              Belum ada butir sasaran kinerja yang disusun.
            </div>
          }
        />
      </div>

      {/* MODAL INPUT REALISASI CAPAIAN */}
      <Modal
        isOpen={realisasiModalOpen}
        onClose={() => setRealisasiModalOpen(false)}
        title="Input Realisasi Capaian Butir Kinerja"
      >
        <form onSubmit={handleSubmitRealisasi(onSaveRealisasi)} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
            <span className="font-semibold text-slate-700 block">Tugas:</span>
            <p className="text-slate-600">{selectedItem?.uraian_tugas}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Realisasi Output / Luaran"
                placeholder="Contoh: 1 Berkas Laporan Tuntas"
                {...registerRealisasi('realisasi_output')}
                error={errorsRealisasi.realisasi_output?.message}
                required
              />
            </div>

            <div>
              <Input
                label="Realisasi Mutu Kualitas (%)"
                type="number"
                placeholder="100"
                {...registerRealisasi('realisasi_mutu')}
                error={errorsRealisasi.realisasi_mutu?.message}
                required
              />
            </div>

            <div>
              <Input
                label="Realisasi Waktu"
                placeholder="Contoh: 6 Bulan"
                {...registerRealisasi('realisasi_waktu')}
                error={errorsRealisasi.realisasi_waktu?.message}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Realisasi Biaya / Anggaran (Rp) - Opsional"
                type="number"
                placeholder="0"
                {...registerRealisasi('realisasi_biaya')}
                error={errorsRealisasi.realisasi_biaya?.message}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Keterangan Capaian"
                rows={2}
                placeholder="Catatan kendala, luaran tambahan, atau capaian khusus..."
                {...registerRealisasi('keterangan')}
                error={errorsRealisasi.keterangan?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unggah Berkas Bukti Fisik Luaran (PDF / ZIP max 20MB)
              </label>
              <input
                type="file"
                accept=".pdf,.zip,.doc,.docx"
                onChange={(e) => setFileBukti(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedItem?.berkas_bukti && (
                <div className="mt-4 text-xs text-slate-500">
                  File saat ini:{' '}
                  <a
                    href={getStorageFileUrl(selectedItem.berkas_bukti)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--module-primary)] underline font-medium"
                  >
                    Lihat Bukti
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRealisasiModalOpen(false)}
              disabled={submittingRealisasi}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingRealisasi}
            >
              Simpan Realisasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL EVALUASI CAPAIAN (ASESOR) */}
      <Modal
        isOpen={evaluasiModalOpen}
        onClose={() => setEvaluasiModalOpen(false)}
        title="Evaluasi & Penetapan Nilai Kinerja"
      >
        <form onSubmit={handleSubmitEvaluasi(onSaveEvaluasi)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nilai SKP Akhir (0 - 100)"
                type="number"
                step="0.01"
                placeholder="85.50"
                {...registerEvaluasi('nilai_skp')}
                error={errorsEvaluasi.nilai_skp?.message}
                required
              />
            </div>

            <div>
              <Input
                label="Nilai BKD Dosen (SKS) - Opsional"
                type="number"
                step="0.01"
                placeholder="14.00"
                {...registerEvaluasi('nilai_bkd')}
                error={errorsEvaluasi.nilai_bkd?.message}
              />
            </div>

            <div className="md:col-span-2">
              <Controller
                name="predikat"
                control={controlEvaluasi}
                render={({ field }) => (
                  <Select
                    label="Predikat Kinerja"
                    value={field.value}
                    onChange={field.onChange}
                    error={errorsEvaluasi.predikat?.message}
                    options={[
                      { value: 'sangat_baik', label: 'Sangat Baik (>= 90)' },
                      { value: 'baik', label: 'Baik (75 - 89.99)' },
                      { value: 'cukup', label: 'Cukup (60 - 74.99)' },
                      { value: 'kurang', label: 'Kurang (50 - 59.99)' },
                      { value: 'sangat_kurang', label: 'Sangat Kurang (< 50)' },
                    ]}
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Catatan Evaluator / Asesor"
                rows={3}
                placeholder="Umpan balik pembinaan, saran perbaikan mutu, atau apresiasi capaian kerja..."
                {...registerEvaluasi('catatan_evaluator')}
                error={errorsEvaluasi.catatan_evaluator?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEvaluasiModalOpen(false)}
              disabled={submittingEvaluasi}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingEvaluasi}
            >
              Tetapkan Nilai Evaluasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
