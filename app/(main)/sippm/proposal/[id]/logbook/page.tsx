'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Upload,
  FlaskConical,
  Award,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { ProposalKegiatan } from '@/types/sippm.types';

const logbookSchema = z.object({
  tgl_kegiatan: z.string().min(1, 'Tanggal kegiatan wajib diisi'),
  persentase_capaian: z.number().min(1, 'Persentase minimal 1%').max(100, 'Persentase maksimal 100%'),
  uraian_kegiatan: z.string().min(10, 'Uraian kegiatan minimal 10 karakter'),
  hambatan: z.string().optional(),
});

type LogbookFormValues = z.infer<typeof logbookSchema>;

interface LogbookEntry {
  id: number;
  tgl_kegiatan: string;
  persentase_capaian: number;
  uraian_kegiatan: string;
  hambatan?: string;
  status_verifikasi: 'verified' | 'pending';
}

export default function LogbookKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const proposalId = Number(resolvedParams.id);

  const [proposal, setProposal] = useState<ProposalKegiatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initial Sample Logbook Entries
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([
    {
      id: 1,
      tgl_kegiatan: '2026-09-10',
      persentase_capaian: 25,
      uraian_kegiatan: 'Studi literatur awal & penyusunan dataset sampel citra medis oncology.',
      hambatan: 'Beberapa jurnal rujukan memerlukan akses berbayar.',
      status_verifikasi: 'verified',
    },
    {
      id: 2,
      tgl_kegiatan: '2026-09-28',
      persentase_capaian: 50,
      uraian_kegiatan: 'Pelaksanaan eksperimen pelatihan arsitektur Deep Learning ResNet-50 pada GPU server kampus.',
      hambatan: 'Waktu training membutuhkan waktu 14 jam per epoch.',
      status_verifikasi: 'verified',
    },
    {
      id: 3,
      tgl_kegiatan: '2026-10-15',
      persentase_capaian: 75,
      uraian_kegiatan: 'Pengujian akurasi model & penyusunan Draf Laporan Kemajuan serta draf artikel jurnal.',
      status_verifikasi: 'pending',
    },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogbookFormValues>({
    resolver: zodResolver(logbookSchema) as any,
    defaultValues: {
      tgl_kegiatan: new Date().toISOString().split('T')[0],
      persentase_capaian: 75,
      uraian_kegiatan: '',
      hambatan: '',
    },
  });

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const res = await sippmService.getProposalDetail(proposalId);
        if (res.data) setProposal(res.data);
      } catch (err) {
        console.error('Failed to load proposal detail for logbook', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [proposalId]);

  const onSubmit = async (data: LogbookFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      const newEntry: LogbookEntry = {
        id: Date.now(),
        tgl_kegiatan: data.tgl_kegiatan,
        persentase_capaian: data.persentase_capaian,
        uraian_kegiatan: data.uraian_kegiatan,
        hambatan: data.hambatan,
        status_verifikasi: 'pending',
      };
      setLogbookEntries([newEntry, ...logbookEntries]);
      setFeedback({ type: 'success', message: 'Catatan logbook riset harian berhasil ditambahkan' });
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Gagal menambah logbook kegiatan' });
    } finally {
      setSubmitting(false);
    }
  };

  // Highest recorded progress percentage
  const maxProgress = logbookEntries.reduce((max, entry) => Math.max(max, entry.persentase_capaian), 0);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat logbook kegiatan riset...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER & BACK BUTTON (crud-ui-standard) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} /> Kembali
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Logbook Activities & Monev Riset</h1>
            <p className="text-slate-500 text-xs mt-0.5">Catatan kemajuan pelaksanaan riset harian/mingguan dan verifikasi monev.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none font-bold shadow-xs flex items-center gap-1.5"
        >
          <Plus size={18} /> Tambah Catatan Logbook
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Header Context Banner */}
      {proposal && (
        <div className="card bg-teal-900 text-white p-6 border-none shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-800 text-teal-200">
                {proposal.skema?.nama_skema || 'Skema Riset'}
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight">{proposal.judul}</h2>
              <div className="text-xs text-teal-200 flex items-center gap-3 pt-1">
                <span>Ketua: <strong>{proposal.ketua?.nama_lengkap || 'Dosen Pengusul'}</strong></span>
                <span>•</span>
                <span>Tahun: <strong>{proposal.created_at?.substring(0, 4) || '2026'}</strong></span>
              </div>
            </div>

            {/* Progress Meter */}
            <div className="bg-teal-950/70 border border-teal-500/40 p-4 rounded-2xl shrink-0 min-w-56 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-200 font-bold">TOTAL KEMAJUAN RISET</span>
                <span className="text-emerald-300 font-mono font-black">{maxProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-teal-900 overflow-hidden border border-teal-700">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${maxProgress}%` }}></div>
              </div>
              <div className="text-[11px] text-teal-300 text-center font-medium pt-0.5">
                {maxProgress >= 70 ? '✅ Syarat Monev & Pencairan 30% Terpenuhi' : '⏳ Capai min 70% untuk Termin 2'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logbook History Entries */}
      <div className="card">
        <div className="card-header bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-600" /> Riwayat Logbook Progres Kegiatan Lapangan
          </h2>
          <span className="text-xs text-slate-500 font-medium">Total {logbookEntries.length} Catatan Masuk</span>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-slate-100">
            {logbookEntries.map((entry) => (
              <div key={entry.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-teal font-mono text-xs font-bold">{entry.tgl_kegiatan}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Progress: {entry.persentase_capaian}%
                    </span>
                  </div>
                  <div>
                    {entry.status_verifikasi === 'verified' ? (
                      <span className="badge badge-green text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Diverifikasi Reviewer Monev
                      </span>
                    ) : (
                      <span className="badge badge-amber text-[11px] font-bold flex items-center gap-1">
                        <Clock size={12} /> Menunggu Review Monev
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-800 text-sm font-medium leading-relaxed">{entry.uraian_kegiatan}</p>

                {entry.hambatan && (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-amber-600" />
                    <span><strong>Catatan Kendala:</strong> {entry.hambatan}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL FORM <= 5 INPUTS (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FlaskConical className="text-teal-600" size={20} /> Input Catatan Logbook Kegiatan Riset
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* FORM HAS <= 5 INPUTS -> MODAL GRID MAKS 2 KOLOM per crud-ui-standard */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input 1: Tanggal Kegiatan */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Tanggal Kegiatan <span className="text-rose-500">*</span></label>
                  <input type="date" className={`input text-xs ${errors.tgl_kegiatan ? 'error' : ''}`} {...register('tgl_kegiatan')} />
                  {errors.tgl_kegiatan && <span className="form-error">{errors.tgl_kegiatan.message}</span>}
                </div>

                {/* Input 2: Persentase Capaian (%) */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Capaian Progres (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.persentase_capaian ? 'error' : ''}`}
                    placeholder="1 - 100"
                    {...register('persentase_capaian', { valueAsNumber: true })}
                  />
                  {errors.persentase_capaian && <span className="form-error">{errors.persentase_capaian.message}</span>}
                </div>
              </div>

              {/* Input 3: Uraian Kegiatan */}
              <div className="form-group">
                <label className="form-label text-xs font-bold text-slate-700">Uraian Aktivitas Kemajuan <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  className={`input text-xs ${errors.uraian_kegiatan ? 'error' : ''}`}
                  placeholder="Ketik rincian aktivitas riset, pengumpulan data, pengujian laboratorium..."
                  {...register('uraian_kegiatan')}
                />
                {errors.uraian_kegiatan && <span className="form-error">{errors.uraian_kegiatan.message}</span>}
              </div>

              {/* Input 4: Hambatan / Kendala (Optional) */}
              <div className="form-group">
                <label className="form-label text-xs font-bold text-slate-700">Hambatan / Catatan Solusi (Opsional)</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="Hambatan alat, akses jurnal, atau kondisi cuaca lapangan..."
                  {...register('hambatan')}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm bg-teal-600 hover:bg-teal-700 border-none font-bold">
                  {submitting ? 'Menyimpan...' : 'Simpan Logbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
