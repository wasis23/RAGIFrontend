'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  ClipboardCheck,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  User,
  FlaskConical,
} from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { ReviewerKegiatan, RekomendasiReviewer } from '@/types/sippm.types';

const evaluationSchema = z.object({
  skor_rekam_jejak: z.number().min(0, 'Skor minimal 0').max(100, 'Skor maksimal 100'),
  skor_substansi: z.number().min(0, 'Skor minimal 0').max(100, 'Skor maksimal 100'),
  skor_rab: z.number().min(0, 'Skor minimal 0').max(100, 'Skor maksimal 100'),
  catatan_reviewer: z.string().min(10, 'Catatan masukan reviewer minimal 10 karakter'),
  rekomendasi: z.enum(['terima', 'revisi', 'tolak'] as const),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

export default function EvaluateProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [reviewerData, setReviewerData] = useState<ReviewerKegiatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema) as any,
    defaultValues: {
      skor_rekam_jejak: 0,
      skor_substansi: 0,
      skor_rab: 0,
      catatan_reviewer: '',
      rekomendasi: 'terima',
    },
  });

  const skorRekamJejak = watch('skor_rekam_jejak') || 0;
  const skorSubstansi = watch('skor_substansi') || 0;
  const skorRab = watch('skor_rab') || 0;

  // Total Skor Weighted (25% Rekam Jejak, 50% Substansi, 25% RAB)
  const totalSkor = Math.round(skorRekamJejak * 0.25 + skorSubstansi * 0.5 + skorRab * 0.25);

  useEffect(() => {
    const loadAssigned = async () => {
      try {
        setLoading(true);
        const res = await sippmService.myAssignedProposals();
        const list = Array.isArray(res?.data)
          ? res.data
          : (res?.data as any)?.items || (res?.data as any)?.data || [];
        const found = list.find((r: any) => r.id === Number(resolvedParams.id));
        if (found) {
          setReviewerData(found);
          if (found.penilaian) {
            setValue('skor_rekam_jejak', found.penilaian.skor_rekam_jejak);
            setValue('skor_substansi', found.penilaian.skor_substansi);
            setValue('skor_rab', found.penilaian.skor_rab);
            setValue('catatan_reviewer', found.penilaian.catatan_reviewer || '');
            setValue('rekomendasi', found.penilaian.rekomendasi);
          }
        }
      } catch (err) {
        console.error('Failed to load assigned reviewer item', err);
      } finally {
        setLoading(false);
      }
    };
    loadAssigned();
  }, [resolvedParams.id, setValue]);

  const onSubmit = async (data: EvaluationFormValues) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await sippmService.submitPenilaian(Number(resolvedParams.id), data);
      router.push('/sippm/reviewer');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan penilaian proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat form desk evaluation...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER & BACK BUTTON (crud-ui-standard) */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Form Penilaian Desk Evaluation</h1>
          <p className="text-slate-500 text-xs mt-0.5">Berikan bobot skor rubrik & rekomendasi kelayakan proposal riset.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <XCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Ringkasan Proposal Card */}
      {reviewerData?.proposal && (
        <div className="card bg-teal-900 text-white p-6 shadow-md border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-800 text-teal-200 mb-2">
                {reviewerData.proposal.skema?.nama_skema || 'Skema Riset'}
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                {reviewerData.proposal.judul}
              </h2>
              <div className="flex items-center gap-4 text-xs text-teal-200 mt-2">
                <span>Ketua: <strong>{reviewerData.proposal.ketua?.nama_lengkap || 'Dosen Pengusul'}</strong></span>
                <span>•</span>
                <span>Dana Diusulkan: <strong>Rp {(reviewerData.proposal.dana_diusulkan || 0).toLocaleString('id-ID')}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* RUBRIK PENILAIAN CARD (COMPACT GRID LAYOUT MAKS 3 KOLOM) */}
        <div className="card">
          <div className="card-header bg-slate-50">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-teal-600" /> Rubrik Bobot Penilaian (Skala 0 - 100)
            </h2>
          </div>
          <div className="card-body">
            {/* GRID LAYOUT MAKS 3 KOLOM per crud-ui-standard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Field 1: Rekam Jejak (25%) */}
              <div className="form-group">
                <label className="form-label">Skor Rekam Jejak (Bobot 25%) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`input ${errors.skor_rekam_jejak ? 'error' : ''}`}
                  placeholder="0 - 100"
                  {...register('skor_rekam_jejak', { valueAsNumber: true })}
                />
                {errors.skor_rekam_jejak && <span className="form-error">{errors.skor_rekam_jejak.message}</span>}
              </div>

              {/* Field 2: Substansi (50%) */}
              <div className="form-group">
                <label className="form-label">Skor Substansi Usulan (Bobot 50%) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`input ${errors.skor_substansi ? 'error' : ''}`}
                  placeholder="0 - 100"
                  {...register('skor_substansi', { valueAsNumber: true })}
                />
                {errors.skor_substansi && <span className="form-error">{errors.skor_substansi.message}</span>}
              </div>

              {/* Field 3: RAB (25%) */}
              <div className="form-group">
                <label className="form-label">Skor Kelayakan RAB (Bobot 25%) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`input ${errors.skor_rab ? 'error' : ''}`}
                  placeholder="0 - 100"
                  {...register('skor_rab', { valueAsNumber: true })}
                />
                {errors.skor_rab && <span className="form-error">{errors.skor_rab.message}</span>}
              </div>

              {/* Total Skor Calculation Highlight */}
              <div className="col-span-full p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wide">TOTAL SKOR PENILAIAN</div>
                  <div className="text-xs text-teal-600">Terhitung otomatis dari 3 kriteria di atas</div>
                </div>
                <div className="text-3xl font-extrabold text-teal-800">{totalSkor} / 100</div>
              </div>

              {/* Rekomendasi Select */}
              <div className="form-group col-span-full md:col-span-1">
                <label className="form-label">Rekomendasi Akhir Reviewer <span className="required">*</span></label>
                <select className="input font-bold" {...register('rekomendasi')}>
                  <option value="terima">Terima (Disetujui)</option>
                  <option value="revisi">Perlu Revisi Usulan</option>
                  <option value="tolak">Tolak Usulan</option>
                </select>
              </div>

              {/* Catatan Masukan Reviewer (col-span-full exception) */}
              <div className="form-group col-span-full">
                <label className="form-label">Catatan & Masukan Kritis Reviewer <span className="required">*</span></label>
                <textarea
                  rows={5}
                  className={`input ${errors.catatan_reviewer ? 'error' : ''}`}
                  placeholder="Ketik uraian evaluasi substansi, masukan perbaikan metode, serta kewajaran alokasi dana RAB..."
                  {...register('catatan_reviewer')}
                />
                {errors.catatan_reviewer && <span className="form-error">{errors.catatan_reviewer.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS (crud-ui-standard) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => router.back()} className="btn btn-secondary font-semibold">
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none font-bold"
          >
            <Save size={18} /> {submitting ? 'Menyimpan Penilaian...' : 'Simpan Desk Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
