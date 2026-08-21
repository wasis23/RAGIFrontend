'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { simpegService } from '@/services/simpeg.service';
import type { PredikatKinerja, SemesterKinerja, Pegawai } from '@/types/simpeg.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const kinerjaSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  tahun: z.number().min(2000, 'Tahun minimal 2000').max(2100, 'Tahun tidak valid'),
  semester: z.enum(['ganjil', 'genap', 'tahunan'], {
    message: 'Semester wajib dipilih',
  }),
  nilai_skp: z.number().min(0, 'Nilai SKP minimal 0').max(100, 'Nilai SKP maksimal 100'),
  nilai_bkd: z.number().min(0, 'Nilai BKD minimal 0').optional().nullable(),
  predikat: z.enum(['sangat_baik', 'baik', 'cukup', 'kurang', 'sangat_kurang'], {
    message: 'Predikat Kinerja wajib dipilih',
  }),
  catatan_evaluator: z.string().optional().nullable(),
});

type KinerjaFormValues = z.infer<typeof kinerjaSchema>;

export default function CreateKinerjaPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('simpeg.kinerja.create') || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<KinerjaFormValues>({
    resolver: zodResolver(kinerjaSchema),
    defaultValues: {
      pegawai_id: '',
      tahun: new Date().getFullYear(),
      semester: 'ganjil',
      nilai_skp: 85.0,
      nilai_bkd: 12.0,
      predikat: 'baik',
      catatan_evaluator: 'Memenuhi target kinerja SKP dan Tridharma Perguruan Tinggi.',
    },
  });

  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList();
      const list: Pegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = list.filter(
        (p: Pegawai) =>
          p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
          (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
      );
      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const onSubmit = async (values: KinerjaFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menginput evaluasi kinerja.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pegawai_id: Number(values.pegawai_id),
        tahun: values.tahun,
        semester: values.semester as SemesterKinerja,
        nilai_skp: values.nilai_skp,
        nilai_bkd: values.nilai_bkd ? Number(values.nilai_bkd) : null,
        predikat: values.predikat as PredikatKinerja,
        catatan_evaluator: values.catatan_evaluator || null,
      };

      await simpegService.createKinerja(payload);
      toast.success('Penilaian Kinerja SKP/BKD berhasil disimpan!');
      router.push('/simpeg/kinerja');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan penilaian kinerja');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Input Evaluasi Kinerja Pegawai"
          description="Formulir Penilaian SKP Tahunan & Beban Kerja Dosen (BKD)"
          action={
            <Button
              variant="warning"
              onClick={() => router.back()}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>
          }
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Anda tidak memiliki permission untuk menginput evaluasi kinerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Input Evaluasi Kinerja Pegawai"
        description="Formulir Penilaian SKP Tahunan & Beban Kerja Dosen (BKD)"
        action={
          <Button
            variant="warning"
            onClick={() => router.back()}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Controller
              name="pegawai_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Pilih Pegawai Evaluasi"
                  required
                  placeholder="Cari nama pegawai / NIP..."
                  loadOptions={loadPegawaiOptions}
                  value={selectedPegawaiOption || (field.value ? { value: field.value, label: field.value } : null)}
                  onChange={(opt) => {
                    setSelectedPegawaiOption(opt);
                    field.onChange(opt ? opt.value : '');
                  }}
                  isClearable
                  error={errors.pegawai_id?.message}
                />
              )}
            />

            <Input
              label="Tahun Evaluasi"
              type="number"
              required
              error={errors.tahun?.message}
              {...register('tahun', { valueAsNumber: true })}
            />

            <Controller
              name="semester"
              control={control}
              render={({ field }) => (
                <Select
                  label="Semester Evaluasi"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.semester?.message}
                  options={[
                    { value: 'ganjil', label: 'Ganjil' },
                    { value: 'genap', label: 'Genap' },
                    { value: 'tahunan', label: 'Tahunan' },
                  ]}
                />
              )}
            />

            <Input
              label="Nilai SKP (Skala 0-100)"
              type="number"
              step="0.1"
              required
              error={errors.nilai_skp?.message}
              {...register('nilai_skp', { valueAsNumber: true })}
            />

            <Input
              label="Nilai BKD Dosen (SKS)"
              type="number"
              step="0.1"
              error={errors.nilai_bkd?.message}
              {...register('nilai_bkd', { valueAsNumber: true })}
            />

            <Controller
              name="predikat"
              control={control}
              render={({ field }) => (
                <Select
                  label="Predikat Evaluasi Kinerja"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.predikat?.message}
                  options={[
                    { value: 'sangat_baik', label: 'Sangat Baik' },
                    { value: 'baik', label: 'Baik' },
                    { value: 'cukup', label: 'Cukup' },
                    { value: 'kurang', label: 'Kurang' },
                    { value: 'sangat_kurang', label: 'Sangat Kurang' },
                  ]}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Textarea
              label="Catatan Evaluator / Asesor SDM"
              rows={3}
              placeholder="Masukkan masukan atau rekomendasi untuk peningkatan kinerja pegawai..."
              error={errors.catatan_evaluator?.message}
              {...register('catatan_evaluator')}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan Evaluasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
