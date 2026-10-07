'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import { Plus, X, Save, Trash2, Award } from 'lucide-react';

const nilaiSchema = z.object({
  poin: z.coerce.number().min(0, 'Poin minimal 0'),
  feedback_dosen: z.string().max(1000, 'Respon maksimal 1000 karakter.').optional().default(''),
});

type NilaiFormValues = z.infer<typeof nilaiSchema>;

interface QuizManagePanelProps {
  quizId: number;
  onChanged: () => void;
}

export default function QuizManagePanel({ quizId, onChanged }: QuizManagePanelProps) {
  const [manageDetail, setManageDetail] = useState<any | null>(null);
  const [loadingManage, setLoadingManage] = useState(false);
  const [selectedBankSoal, setSelectedBankSoal] = useState<string>('');
  const [poinSoal, setPoinSoal] = useState<number>(10);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [grading, setGrading] = useState<any | null>(null);

  const nilaiForm = useForm<NilaiFormValues>({
    resolver: zodResolver(nilaiSchema) as any,
    defaultValues: { poin: 0, feedback_dosen: '' },
  });

  const getKunciJawaban = (j: any): string | null => {
    const k = j?.kunci_jawaban ?? j?.quiz_soal?.bank_soal?.kunci_jawaban ?? j?.quiz_soal?.bank_soal?.kunci ?? j?.jawaban_benar ?? null;
    return k !== null && k !== undefined && String(k).trim() !== '' ? String(k) : null;
  };

  const getTipeSoal = (j: any): string =>
    String(j?.tipe_soal || j?.quiz_soal?.bank_soal?.tipe_soal || j?.quiz_soal?.tipe_soal || '');

  /** Daftar jawaban yang bisa dikoreksi: uraian pending + isian_singkat (koreksi hasil auto). */
  const getKoreksiItems = (a: any): Array<{ label: string; jawaban: any }> => {
    const list: any[] = Array.isArray(a?.jawaban) ? a.jawaban : [];
    return list
      .filter((j: any) => j?.is_benar === null || j?.is_benar === undefined || getTipeSoal(j) === 'isian_singkat')
      .map((j: any) => {
        const tipe = getTipeSoal(j);
        const potongan = String(j?.quiz_soal?.bank_soal?.pertanyaan || j?.quiz_soal?.pertanyaan || '').slice(0, 30);
        if (tipe === 'isian_singkat' && j?.is_benar !== null && j?.is_benar !== undefined) {
          return { label: `Koreksi: ${potongan}... (${j.is_benar ? 'auto Benar' : 'auto Salah'})`, jawaban: j };
        }
        return { label: `Nilai: ${potongan}...`, jawaban: j };
      });
  };

  const loadManage = async () => {
    setLoadingManage(true);
    try {
      const [detailRes, attRes] = await Promise.all([
        lmsService.getQuizManage(quizId),
        lmsService.listQuizAttempts(quizId, { per_page: 50 }),
      ]);
      setManageDetail(detailRes.data);
      setAttempts(attRes.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat detail quiz');
    } finally {
      setLoadingManage(false);
    }
  };

  useEffect(() => {
    loadManage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handleAttach = async () => {
    if (!selectedBankSoal) return;
    try {
      await lmsService.attachQuizSoal(quizId, { bank_soal_id: Number(selectedBankSoal), poin: poinSoal });
      toast.success('Soal berhasil dilampirkan');
      setSelectedBankSoal('');
      loadManage();
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.bank_soal_id?.[0] || err.response?.data?.message || 'Gagal melampirkan soal');
    }
  };

  const handleDetach = async (quizSoalId: number) => {
    try {
      await lmsService.detachQuizSoal(quizSoalId);
      toast.success('Soal dilepas dari quiz');
      loadManage();
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.quiz?.[0] || 'Gagal melepas soal (quiz terkunci attempt?)');
    }
  };

  const onSubmitNilai = async (values: NilaiFormValues) => {
    if (!grading) return;
    try {
      await lmsService.beriNilaiManual(grading.id, values.poin, values.feedback_dosen || undefined);
      toast.success('Nilai manual tersimpan & tersync OBE');
      setGrading(null);
      loadManage();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nilai');
    }
  };

  if (loadingManage || !manageDetail) {
    return <p className="text-xs text-slate-500">Memuat detail quiz...</p>;
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Kelola: {manageDetail.quiz?.judul} ({manageDetail.total_soal} soal, {Number(manageDetail.total_poin || 0)} poin)
        </h5>
        {manageDetail.total_attempt > 0 && (
          <Badge variant="yellow">Terkunci — {manageDetail.total_attempt} attempt sudah masuk</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div className="md:col-span-2">
          <AsyncSelect
            label="Lampirkan Soal dari Bank Soal"
            placeholder="Cari soal bank soal..."
            value={selectedBankSoal}
            onChange={(val) => setSelectedBankSoal(val ? String(val) : '')}
            loadOptions={async (input) => {
              try {
                const res: any = await siakadService.getSoalList({ search: input, per_page: 20 } as any);
                const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
                return items.map((s: any) => ({
                  value: String(s.id),
                  label: `[${s.tipe_soal}] ${(s.pertanyaan || '').slice(0, 80)}`,
                }));
              } catch {
                return [];
              }
            }}
            isClearable
          />
          <a href="/lms/bank-soal/create" className="text-2xs mt-1 inline-block" style={{ color: 'var(--module-primary)' }}>Buat soal baru →</a>
        </div>
        <div className="flex gap-2 items-end">
          <Input type="number" label="Poin" value={poinSoal} onChange={(e) => setPoinSoal(Number(e.target.value))} />
          <Button size="sm" icon={<Plus size={16} />} onClick={handleAttach} disabled={!selectedBankSoal}>
            Tambah
          </Button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'soal', label: 'Soal', render: (s: any) => <span className="text-xs">{s.bank_soal?.pertanyaan?.slice(0, 100)}</span> },
          { key: 'tipe', label: 'Tipe', render: (s: any) => <Badge variant="gray">{s.bank_soal?.tipe_soal}</Badge> },
          { key: 'poin', label: 'Poin', render: (s: any) => <span className="text-xs">{s.poin}</span> },
          { key: 'aksi', label: 'Aksi', render: (s: any) => (
              <DropdownMenu items={[{ label: 'Lepas', icon: <Trash2 size={16} />, onClick: () => handleDetach(s.id) }]} />
            ),
          },
        ] as ColumnDef<any>[]}
        data={manageDetail.quiz?.soal || []}
        meta={{ current_page: 1, last_page: 1, per_page: 50, total: manageDetail.total_soal || 0 }}
        onPageChange={() => {}}
      />

      <h6 className="text-2xs font-bold text-slate-700 uppercase tracking-wider">Attempt Mahasiswa</h6>
      <DataTable
        columns={[
          { key: 'mahasiswa', label: 'Mahasiswa', render: (a: any) => <span className="text-xs font-semibold">{a.mahasiswa?.nama_lengkap}<br /><span className="text-2xs text-slate-500">{a.mahasiswa?.nim}</span></span> },
          { key: 'ke', label: 'Ke', render: (a: any) => <span className="text-xs">{a.attempt_ke}</span> },
          { key: 'status', label: 'Status', render: (a: any) => <Badge variant={a.status === 'selesai' ? 'green' : 'yellow'}>{a.status}</Badge> },
          { key: 'nilai', label: 'Nilai', render: (a: any) => <span className="text-xs font-bold">{a.nilai_akhir !== null && a.nilai_akhir !== undefined ? Number(a.nilai_akhir).toFixed(2) : '-'}</span> },
          { key: 'aksi', label: 'Aksi', render: (a: any) =>
              a.butuh_penilaian_manual || getKoreksiItems(a).length > 0 ? (
                <DropdownMenu
                  items={getKoreksiItems(a).map((item) => ({
                    label: item.label,
                    icon: <Award size={16} />,
                    onClick: () => {
                      setGrading(item.jawaban);
                      nilaiForm.reset({ poin: 0, feedback_dosen: item.jawaban?.feedback_dosen || '' });
                    },
                  }))}
                />
              ) : (
                <span className="text-2xs text-slate-400">-</span>
              ),
          },
        ] as ColumnDef<any>[]}
        data={attempts}
        meta={{ current_page: 1, last_page: 1, per_page: 50, total: attempts.length }}
        onPageChange={() => {}}
      />

      <Modal
        open={Boolean(grading)}
        onClose={() => setGrading(null)}
        title="Nilai Manual Uraian"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setGrading(null)}>Batal</Button>
            <Button type="submit" form="form-nilai-quiz-panel" loading={nilaiForm.formState.isSubmitting} disabled={nilaiForm.formState.isSubmitting} icon={<Save size={16} />}>
              Simpan & Sync OBE
            </Button>
          </div>
        }
      >
        <form id="form-nilai-quiz-panel" onSubmit={nilaiForm.handleSubmit(onSubmitNilai)} className="space-y-4">
          <p className="text-xs text-slate-600 whitespace-pre-wrap">{grading?.quiz_soal?.bank_soal?.pertanyaan}</p>
          {grading?.jawaban_teks && (
            <div className="p-2 bg-slate-50 rounded border text-xs whitespace-pre-wrap">{grading.jawaban_teks}</div>
          )}
          {getTipeSoal(grading) === 'isian_singkat' && grading?.is_benar !== null && grading?.is_benar !== undefined && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={grading.is_benar ? 'green' : 'red'}>
                Hasil auto: {grading.is_benar ? 'Benar' : 'Salah'}
              </Badge>
              {getKunciJawaban(grading) && (
                <span className="text-2xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
                  Kunci: {getKunciJawaban(grading)}
                </span>
              )}
            </div>
          )}
          {!getKunciJawaban(grading) ? null : getTipeSoal(grading) !== 'isian_singkat' ? (
            <div className="text-2xs text-emerald-700 bg-emerald-50 rounded-lg p-2 whitespace-pre-wrap">
              <span className="text-2xs text-emerald-500 block">Kunci</span>
              {getKunciJawaban(grading)}
            </div>
          ) : null}
          <Input type="number" label={`Poin (maks ${grading?.quiz_soal?.poin})`} error={nilaiForm.formState.errors.poin?.message} {...nilaiForm.register('poin')} />
          <Textarea
            label="Respon/Umpan balik untuk mahasiswa (opsional)"
            placeholder="Tulis respon atau penjelasan koreksi untuk mahasiswa..."
            rows={3}
            error={nilaiForm.formState.errors.feedback_dosen?.message}
            {...nilaiForm.register('feedback_dosen')}
          />
        </form>
      </Modal>
    </Card>
  );
}
