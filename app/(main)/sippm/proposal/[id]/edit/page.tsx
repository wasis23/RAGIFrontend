'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FlaskConical, XCircle } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { ProposalKegiatan } from '@/types/sippm.types';

const editSchema = z.object({
  judul: z.string().min(10, 'Judul proposal minimal 10 karakter'),
  rumpun_ilmu: z.string().min(3, 'Rumpun ilmu wajib diisi'),
  dana_diusulkan: z.number().min(1000000, 'Dana diusulkan minimal Rp 1.000.000'),
  abstrak: z.string().min(50, 'Abstrak proposal minimal 50 karakter'),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
  });

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const res = await sippmService.getProposalDetail(Number(resolvedParams.id));
        if (res.data) {
          setValue('judul', res.data.judul);
          setValue('rumpun_ilmu', res.data.rumpun_ilmu);
          setValue('dana_diusulkan', res.data.dana_diusulkan);
          setValue('abstrak', res.data.abstrak);
        }
      } catch (err) {
        console.error('Failed to load proposal', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [resolvedParams.id, setValue]);

  const onSubmit = async (data: EditFormValues) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await sippmService.updateProposal(Number(resolvedParams.id), data);
      router.push(`/sippm/proposal/${resolvedParams.id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat data proposal...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER & BACK BUTTON (crud-ui-standard) */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Proposal Usulan</h1>
          <p className="text-slate-500 text-xs mt-0.5">Perbarui rincian usulan proposal riset atau pengabdian masyarakat.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <XCircle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header bg-slate-50">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FlaskConical size={18} className="text-teal-600" /> Form Perubahan Data Proposal
            </h2>
          </div>
          <div className="card-body">
            {/* GRID LAYOUT MAKS 3 KOLOM (crud-ui-standard) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="form-group md:col-span-2">
                <label className="form-label">Judul Proposal <span className="required">*</span></label>
                <input type="text" className={`input ${errors.judul ? 'error' : ''}`} {...register('judul')} />
                {errors.judul && <span className="form-error">{errors.judul.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Rumpun Ilmu <span className="required">*</span></label>
                <input type="text" className={`input ${errors.rumpun_ilmu ? 'error' : ''}`} {...register('rumpun_ilmu')} />
                {errors.rumpun_ilmu && <span className="form-error">{errors.rumpun_ilmu.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Dana Diusulkan (Rp) <span className="required">*</span></label>
                <input type="number" className={`input ${errors.dana_diusulkan ? 'error' : ''}`} {...register('dana_diusulkan')} />
                {errors.dana_diusulkan && <span className="form-error">{errors.dana_diusulkan.message}</span>}
              </div>

              <div className="form-group col-span-full">
                <label className="form-label">Abstrak Proposal <span className="required">*</span></label>
                <textarea rows={6} className={`input ${errors.abstrak ? 'error' : ''}`} {...register('abstrak')} />
                {errors.abstrak && <span className="form-error">{errors.abstrak.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS (crud-ui-standard) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => router.back()} className="btn btn-secondary font-semibold">
            Batal
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none font-bold">
            <Save size={18} /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
