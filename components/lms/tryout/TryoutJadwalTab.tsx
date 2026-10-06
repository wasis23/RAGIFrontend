'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { lmsService } from '@/services/lms.service';
import type { LmsQuizItem } from '@/types/lms.types';
import { YA_TIDAK_OPTIONS } from '@/types/lms.types';
import { Save, Trash2, Globe, Archive, ArchiveRestore } from 'lucide-react';
import { toDateTimeLocalValue, fromDateTimeLocalValue } from './tryoutHelpers';

const jadwalSchema = z.object({
  judul: z.string().min(1, 'Judul tryout wajib diisi.').max(255, 'Judul maksimal 255 karakter.'),
  deskripsi: z.string().max(2000, 'Deskripsi maksimal 2000 karakter.').optional().default(''),
  durasi_menit: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: 'Durasi harus berupa angka.' }).int('Durasi harus bilangan bulat.').min(1, 'Durasi minimal 1 menit.').max(1440, 'Durasi maksimal 1440 menit.').optional()
  ),
  max_attempt: z.coerce.number({ message: 'Max attempt harus berupa angka.' }).int().min(1, 'Minimal 1.').max(10, 'Maksimal 10.'),
  batch_size: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(1).max(100).optional()
  ),
  dibuka_at: z.string().optional().default(''),
  ditutup_at: z.string().optional().default(''),
  acak_soal: z.enum(['1', '0']),
  acak_jawaban: z.enum(['1', '0']),
  kode_akses: z.string().max(20, 'Kode akses maksimal 20 karakter.').optional().default(''),
}).refine(
  (v) => {
    if (!v.dibuka_at || !v.ditutup_at) return true;
    return new Date(v.ditutup_at).getTime() >= new Date(v.dibuka_at).getTime();
  },
  { message: 'Waktu ditutup harus sesudah waktu dibuka.', path: ['ditutup_at'] }
);

type JadwalFormValues = z.infer<typeof jadwalSchema>;

interface TryoutJadwalTabProps {
  quiz: LmsQuizItem;
  onChanged: () => void;
}

export default function TryoutJadwalTab({ quiz, onChanged }: TryoutJadwalTabProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [acting, setActing] = useState<'publish' | 'arsip' | null>(null);

  const form = useForm<JadwalFormValues>({
    resolver: zodResolver(jadwalSchema) as any,
    defaultValues: {
      judul: '',
      deskripsi: '',
      max_attempt: 1,
      dibuka_at: '',
      ditutup_at: '',
      acak_soal: '1',
      acak_jawaban: '1',
      kode_akses: '',
    },
  });

  useEffect(() => {
    form.reset({
      judul: quiz.judul || '',
      deskripsi: quiz.deskripsi || '',
      durasi_menit: quiz.durasi_menit ?? undefined,
      max_attempt: quiz.max_attempt ?? 1,
      batch_size: quiz.batch_size ?? undefined,
      dibuka_at: toDateTimeLocalValue(quiz.dibuka_at),
      ditutup_at: toDateTimeLocalValue(quiz.ditutup_at),
      acak_soal: quiz.acak_soal ? '1' : '0',
      acak_jawaban: quiz.acak_jawaban ? '1' : '0',
      kode_akses: (quiz as any).kode_akses || '',
    });
  }, [quiz, form]);

  const onSubmit = async (values: JadwalFormValues) => {
    try {
      await lmsService.updateQuiz(quiz.id, {
        judul: values.judul,
        deskripsi: values.deskripsi || null,
        durasi_menit: values.durasi_menit ?? null,
        max_attempt: values.max_attempt,
        batch_size: values.batch_size ?? null,
        dibuka_at: fromDateTimeLocalValue(values.dibuka_at),
        ditutup_at: fromDateTimeLocalValue(values.ditutup_at),
        acak_soal: values.acak_soal === '1',
        acak_jawaban: values.acak_jawaban === '1',
        kode_akses: values.kode_akses || null,
      } as any);
      toast.success('Jadwal & konfigurasi tryout tersimpan');
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi');
    }
  };

  const setPublish = async (published: boolean) => {
    setActing('publish');
    try {
      await lmsService.updateQuiz(quiz.id, { is_published: published } as any);
      toast.success(published ? 'Tryout dipublish' : 'Tryout dikembalikan ke draft');
      onChanged();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status publikasi');
    } finally {
      setActing(null);
    }
  };

  const setArsip = async () => {
    setActing('arsip');
    try {
      await lmsService.updateQuiz(quiz.id, { is_archived: !quiz.is_archived } as any);
      toast.success(quiz.is_archived ? 'Tryout dibuka dari arsip' : 'Tryout diarsipkan');
      onChanged();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status arsip');
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await lmsService.deleteQuiz(quiz.id);
      toast.success('Tryout dihapus');
      router.push('/lms/tryout');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tryout');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Konfigurasi & Jadwal</h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Judul Tryout" required placeholder="cth: Tryout UTS Genap" error={form.formState.errors.judul?.message} {...form.register('judul')} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Deskripsi" placeholder="Petunjuk pengerjaan untuk mahasiswa..." error={form.formState.errors.deskripsi?.message} {...form.register('deskripsi')} />
          </div>
          <Input type="number" label="Durasi (menit)" min={1} max={1440} error={form.formState.errors.durasi_menit?.message} {...form.register('durasi_menit')} />
          <Input type="number" label="Max Attempt" required min={1} max={10} error={form.formState.errors.max_attempt?.message} {...form.register('max_attempt')} />
          <Input type="datetime-local" label="Dibuka Pada" error={form.formState.errors.dibuka_at?.message} {...form.register('dibuka_at')} />
          <Input type="datetime-local" label="Ditutup Pada" error={form.formState.errors.ditutup_at?.message} {...form.register('ditutup_at')} />
          <Controller
            name="acak_soal"
            control={form.control}
            render={({ field }) => (
              <Select label="Acak Urutan Soal" value={field.value} onChange={field.onChange} options={YA_TIDAK_OPTIONS} error={form.formState.errors.acak_soal?.message} />
            )}
          />
          <Controller
            name="acak_jawaban"
            control={form.control}
            render={({ field }) => (
              <Select label="Acak Urutan Jawaban" value={field.value} onChange={field.onChange} options={YA_TIDAK_OPTIONS} error={form.formState.errors.acak_jawaban?.message} />
            )}
          />
          <Input type="number" label="Batch Size (soal per halaman)" min={1} max={100} hint="Kosongkan = semua soal sekaligus" error={form.formState.errors.batch_size?.message} {...form.register('batch_size')} />
          <Input label="Kode Akses (opsional)" placeholder="cth: TO123 — kosongkan = terbuka" error={form.formState.errors.kode_akses?.message} {...form.register('kode_akses')} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={form.formState.isSubmitting} disabled={form.formState.isSubmitting} icon={<Save size={16} />}>
            Simpan Konfigurasi
          </Button>
        </div>
      </form>

      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Publikasi</h5>
        <ToggleSwitch
          id="toggle-publish"
          checked={Boolean(quiz.is_published)}
          onChange={(v) => setPublish(v)}
          loading={acting === 'publish'}
          disabled={acting !== null}
          label={quiz.is_published ? 'Tryout Terbit (published)' : 'Tryout Draft'}
          description="Mahasiswa hanya dapat melihat & mengerjakan tryout yang terbit dalam jendela jadwal."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Globe size={16} />}
            loading={acting === 'publish'}
            disabled={acting !== null}
            onClick={() => setPublish(!quiz.is_published)}
          >
            {quiz.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={quiz.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            loading={acting === 'arsip'}
            disabled={acting !== null}
            onClick={setArsip}
          >
            {quiz.is_archived ? 'Buka Arsip' : 'Arsipkan'}
          </Button>
          <Button size="sm" variant="outline-danger" icon={<Trash2 size={16} />} onClick={() => setDeleteConfirm(true)}>
            Hapus Tryout
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Hapus Tryout"
        message={<span>Yakin hapus <strong>{quiz.judul}</strong>? Seluruh soal & attempt ikut terhapus.</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
