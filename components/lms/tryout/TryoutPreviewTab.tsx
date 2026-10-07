'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { lmsService } from '@/services/lms.service';
import type { LmsQuizBatchSoal } from '@/types/lms.types';
import { Eye } from 'lucide-react';

export default function TryoutPreviewTab({ quizId }: { quizId: number }) {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [soal, setSoal] = useState<LmsQuizBatchSoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lmsService.previewQuiz(quizId);
      if (res.status === 'success' && res.data) {
        const raw: any = res.data;
        const quiz = raw.quiz || {};
        setJudul(quiz.judul || '');
        setDeskripsi(quiz.deskripsi || '');
        const list: LmsQuizBatchSoal[] = raw.soal || raw.data || (Array.isArray(raw) ? raw : []);
        setSoal(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat preview');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (soal.length === 0) {
    return <EmptyState title="Belum ada soal" description="Lampirkan soal dari bank soal pada tab Soal untuk melihat preview." />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-start gap-2 bg-slate-50/60">
        <Eye size={16} className="shrink-0 mt-0.5 text-slate-400" />
        <p className="text-2xs text-slate-500">
          Simulasi tampilan mahasiswa (read-only, tanpa kunci jawaban){judul ? ` — ${judul}` : ''}.
          {deskripsi ? ` ${deskripsi}` : ''}
        </p>
      </Card>

      {soal.map((s, idx) => (
        <Card key={s.quiz_soal_id || idx} className="p-4 space-y-3 opacity-90">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap">
              {s.urutan || idx + 1}. {s.pertanyaan}
            </p>
            <Badge>{s.poin} poin</Badge>
          </div>
          {s.tipe_soal === 'pilihan_ganda' ? (
            <div className="space-y-2">
              {(s.opsi || []).map((o) => (
                <label key={o.id} className="flex items-start gap-2 text-xs rounded-lg border p-2 bg-white cursor-not-allowed">
                  <input type="radio" disabled className="mt-1" />
                  <span>{o.teks}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-2xs text-slate-400 border border-dashed rounded-lg p-2">
              {s.tipe_soal === 'isian_singkat' ? 'Kolom jawaban singkat (mahasiswa)' : 'Kolom uraian jawaban (mahasiswa)'}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
