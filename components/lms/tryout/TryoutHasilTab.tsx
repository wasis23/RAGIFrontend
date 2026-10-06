'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { lmsService } from '@/services/lms.service';
import type { LmsQuizAttempt } from '@/types/lms.types';
import { Eye, Award, RotateCcw, X, Save } from 'lucide-react';

const nilaiSchema = z.object({
  poin: z.coerce.number({ message: 'Poin harus berupa angka.' }).min(0, 'Poin minimal 0.'),
  feedback_dosen: z.string().max(1000, 'Respon maksimal 1000 karakter.').optional().default(''),
});

type NilaiFormValues = z.infer<typeof nilaiSchema>;

interface TryoutHasilTabProps {
  quizId: number;
  refreshKey: number;
}

export default function TryoutHasilTab({ quizId, refreshKey }: TryoutHasilTabProps) {
  const [attempts, setAttempts] = useState<LmsQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [grading, setGrading] = useState<{
    attemptJawabanId: number;
    pertanyaan: string;
    jawaban: string;
    maxPoin: number;
    tipeSoal?: string;
    autoBenar?: boolean | null;
    kunci?: string | null;
    feedbackAwal?: string;
  } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: '',
  });
  const [resetting, setResetting] = useState(false);

  const nilaiForm = useForm<NilaiFormValues>({
    resolver: zodResolver(nilaiSchema) as any,
    defaultValues: { poin: 0, feedback_dosen: '' },
  });

  const getTipeJawaban = (j: any): string =>
    String(j?.tipe_soal || j?.quiz_soal?.bank_soal?.tipe_soal || j?.quiz_soal?.tipe_soal || '');

  const getKunciJawaban = (j: any): string | null => {
    const k = j?.kunci_jawaban ?? j?.quiz_soal?.bank_soal?.kunci_jawaban ?? j?.quiz_soal?.bank_soal?.kunci ?? j?.jawaban_benar ?? null;
    return k !== null && k !== undefined && String(k).trim() !== '' ? String(k) : null;
  };

  const openGrading = (j: any, pertanyaan: string, jawabanMhs: string, maxPoin: number) => {
    setGrading({
      attemptJawabanId: j.id,
      pertanyaan: String(pertanyaan),
      jawaban: String(jawabanMhs),
      maxPoin: Number(maxPoin ?? 100),
      tipeSoal: getTipeJawaban(j),
      autoBenar: j.is_benar ?? null,
      kunci: getKunciJawaban(j),
      feedbackAwal: j.feedback_dosen || '',
    });
    nilaiForm.reset({ poin: 0, feedback_dosen: j.feedback_dosen || '' });
  };

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lmsService.listQuizAttempts(quizId, { per_page: 100 });
      if (res.status === 'success') setAttempts(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat hasil pengerjaan');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts, refreshKey]);

  const openDetail = async (attemptId: number) => {
    setDetailId(attemptId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await lmsService.getAttemptDetail(attemptId);
      if (res.status === 'success') setDetail(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat detail pengerjaan');
    } finally {
      setDetailLoading(false);
    }
  };

  const onSubmitNilai = async (values: NilaiFormValues) => {
    if (!grading) return;
    try {
      await lmsService.beriNilaiManual(grading.attemptJawabanId, values.poin, values.feedback_dosen || undefined);
      toast.success('Nilai manual tersimpan & tersync OBE');
      setGrading(null);
      if (detailId) openDetail(detailId);
      fetchAttempts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nilai');
    }
  };

  const handleReset = async () => {
    if (!resetTarget.id) return;
    setResetting(true);
    try {
      await lmsService.resetAttempt(resetTarget.id);
      toast.success('Pengerjaan direset — mahasiswa dapat mengulang dari awal');
      setResetTarget({ isOpen: false, id: null, name: '' });
      fetchAttempts();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset pengerjaan');
    } finally {
      setResetting(false);
    }
  };

  const columns: ColumnDef<LmsQuizAttempt>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (a) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{a.mahasiswa?.nama_lengkap || `ID #${a.mahasiswa_id}`}</span>
          <span className="text-2xs text-slate-500 font-mono block">{a.mahasiswa?.nim || '-'}</span>
        </div>
      ),
    },
    {
      key: 'attempt_ke',
      label: 'KE',
      align: 'center',
      render: (a) => <span className="text-xs text-slate-700">{a.attempt_ke}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (a) => <Badge variant={a.status === 'selesai' ? 'green' : 'amber'}>{a.status}</Badge>,
    },
    {
      key: 'nilai',
      label: 'NILAI',
      align: 'center',
      render: (a) => (
        <span className="text-xs font-bold text-slate-800">
          {a.nilai_akhir !== null && a.nilai_akhir !== undefined ? Number(a.nilai_akhir).toFixed(2) : '-'}
        </span>
      ),
    },
    {
      key: 'rincian',
      label: 'BENAR / SALAH / KOSONG',
      align: 'center',
      render: (a) => {
        const any_a = a as any;
        if (any_a.jumlah_benar === undefined && any_a.benar === undefined) {
          return <span className="text-2xs text-slate-400">-</span>;
        }
        const benar = any_a.jumlah_benar ?? any_a.benar ?? 0;
        const salah = any_a.jumlah_salah ?? any_a.salah ?? 0;
        const kosong = any_a.jumlah_kosong ?? any_a.kosong ?? any_a.tidak_dijawab ?? 0;
        return (
          <span className="text-2xs text-slate-700">
            <span className="text-emerald-600 font-bold">{benar}</span>
            {' / '}
            <span className="text-rose-600 font-bold">{salah}</span>
            {' / '}
            <span className="text-slate-500 font-bold">{kosong}</span>
          </span>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (a) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Lihat Detail', icon: <Eye size={16} />, onClick: () => openDetail(a.id) },
              ...(a.butuh_penilaian_manual
                ? [{ label: 'Nilai Manual Uraian', icon: <Award size={16} />, onClick: () => openDetail(a.id) }]
                : []),
              {
                label: 'Reset Pengerjaan',
                icon: <RotateCcw size={16} />,
                onClick: () =>
                  setResetTarget({
                    isOpen: true,
                    id: a.id,
                    name: a.mahasiswa?.nama_lengkap || `#${a.mahasiswa_id}`,
                  }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const detailRows: any[] = detail
    ? detail.jawaban || detail.questions || detail.data || []
    : [];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={attempts}
        isLoading={loading}
        meta={{ current_page: 1, last_page: 1, per_page: attempts.length || 50, total: attempts.length }}
        onPageChange={() => {}}
        emptyMessage="Belum ada attempt mahasiswa untuk tryout ini."
      />

      <Modal open={detailId !== null} onClose={() => setDetailId(null)} title="Detail Pengerjaan" size="lg">
        {detailLoading ? (
          <p className="text-xs text-slate-500">Memuat detail...</p>
        ) : !detail ? (
          <EmptyState title="Tidak ada detail" description="Detail pengerjaan tidak tersedia." />
        ) : (
          <div className="space-y-3">
            {detailRows.length === 0 && (
              <p className="text-2xs text-slate-400">Backend belum mengembalikan rincian jawaban.</p>
            )}
            {detailRows.map((j: any, idx: number) => {
              const pertanyaan =
                j.pertanyaan || j.quiz_soal?.bank_soal?.pertanyaan || j.quiz_soal?.pertanyaan || `Soal ${idx + 1}`;
              const jawabanMhs =
                j.jawaban_teks ?? j.jawaban_mahasiswa ?? j.opsi_dipilih?.teks ?? j.bank_opsi?.teks ?? '-';
              const kunci = j.kunci_jawaban || j.quiz_soal?.bank_soal?.kunci || j.jawaban_benar || null;
              const benar = j.is_benar;
              const maxPoin = j.quiz_soal?.poin ?? j.poin_maks ?? j.maks_poin ?? null;
              const dapat = j.poin_diperoleh ?? j.poin_dapat ?? null;
              const tipeSoal = getTipeJawaban(j);
              const perluManual = benar === null || benar === undefined;
              const bisaKoreksi = perluManual || tipeSoal === 'isian_singkat';
              return (
                <Card key={j.id || idx} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap flex-1">{pertanyaan}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tipeSoal ? <Badge variant="gray">{tipeSoal}</Badge> : null}
                      {benar === true ? (
                        <Badge variant="green">Benar</Badge>
                      ) : benar === false ? (
                        <Badge variant="red">Salah</Badge>
                      ) : (
                        <Badge variant="amber">Perlu dinilai</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 whitespace-pre-wrap">
                    <span className="text-2xs text-slate-400 block">Jawaban mahasiswa</span>
                    {String(jawabanMhs)}
                  </div>
                  {kunci ? (
                    <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 whitespace-pre-wrap">
                      <span className="text-2xs text-emerald-500 block">Kunci</span>
                      {String(kunci)}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs text-slate-500">
                      Poin: {dapat !== null && dapat !== undefined ? dapat : '-'}
                      {maxPoin !== null && maxPoin !== undefined ? ` / ${maxPoin}` : ''}
                    </span>
                    {bisaKoreksi && j.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Award size={16} />}
                        onClick={() => openGrading(j, pertanyaan, String(jawabanMhs), Number(maxPoin ?? 100))}
                      >
                        {perluManual ? 'Nilai Manual' : 'Koreksi'}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={grading !== null}
        onClose={() => setGrading(null)}
        title="Nilai Manual Uraian"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setGrading(null)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="form-nilai-manual-tryout"
              loading={nilaiForm.formState.isSubmitting}
              disabled={nilaiForm.formState.isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan & Sync OBE
            </Button>
          </div>
        }
      >
        <form id="form-nilai-manual-tryout" onSubmit={nilaiForm.handleSubmit(onSubmitNilai)} className="space-y-4">
          <p className="text-xs text-slate-600 whitespace-pre-wrap">{grading?.pertanyaan}</p>
          <div className="p-2 bg-slate-50 rounded border text-xs whitespace-pre-wrap">{grading?.jawaban}</div>
          {grading?.tipeSoal === 'isian_singkat' && grading?.autoBenar !== null && grading?.autoBenar !== undefined && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={grading.autoBenar ? 'green' : 'red'}>
                Hasil auto: {grading.autoBenar ? 'Benar' : 'Salah'}
              </Badge>
              {grading?.kunci && (
                <span className="text-2xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
                  Kunci: {grading.kunci}
                </span>
              )}
            </div>
          )}
          <Input
            type="number"
            label={`Poin (maks ${grading?.maxPoin ?? '-'})`}
            error={nilaiForm.formState.errors.poin?.message}
            {...nilaiForm.register('poin')}
          />
          <Textarea
            label="Respon/Umpan balik untuk mahasiswa (opsional)"
            placeholder="Tulis respon atau penjelasan koreksi untuk mahasiswa..."
            rows={3}
            error={nilaiForm.formState.errors.feedback_dosen?.message}
            {...nilaiForm.register('feedback_dosen')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={resetTarget.isOpen}
        onClose={() => setResetTarget({ isOpen: false, id: null, name: '' })}
        onConfirm={handleReset}
        isLoading={resetting}
        title="Reset Pengerjaan"
        message={
          <span>
            Yakin reset pengerjaan <strong>{resetTarget.name}</strong>? Mahasiswa harus mengulang dari awal dan
            nilai/jawaban saat ini dihapus.
          </span>
        }
        confirmText="Reset"
        cancelText="Batal"
        variant="warning"
      />
    </div>
  );
}
