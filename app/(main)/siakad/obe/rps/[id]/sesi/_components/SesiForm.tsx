'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Card, CardBody } from '@/components/ui/Card';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const sesiSchema = z.object({
  minggu_ke: z.number({ error: 'Pertemuan ke wajib diisi' }).min(1, 'Pertemuan minimal 1').max(16, 'Pertemuan maksimal 16'),
  sub_cpmk_id: z.number().nullable().optional(),
  kemampuan_akhir: z.string().trim().min(3, 'Kemampuan akhir minimal 3 karakter'),
  indikator_penilaian: z.string().trim().optional(),
  kriteria_teknik: z.string().trim().optional(),
  bentuk_luring: z.string().trim().optional(),
  bentuk_daring: z.string().trim().optional(),
  bahan_kajian: z.string().trim().min(3, 'Materi pembelajaran minimal 3 karakter'),
  penugasan_mahasiswa: z.string().trim().optional(),
  bobot_penilaian: z.number({ error: 'Bobot penilaian wajib diisi' }).min(0, 'Bobot minimal 0').max(100, 'Bobot maksimal 100'),
});

export type SesiFormValues = z.infer<typeof sesiSchema>;

interface SesiFormProps {
  rpsId: number;
  mataKuliahId?: number;
  initial?: any | null;
  defaultMingguKe?: number;
  submitLabel?: string;
}

export function SesiForm({ rpsId, mataKuliahId, initial, defaultMingguKe = 1, submitLabel = 'Simpan Sesi' }: SesiFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const loadSubCpmkOptions = useCallback(
    async (keyword: string) => {
      try {
        const res = await siakadService.getSubCpmk({
          mata_kuliah_id: mataKuliahId,
          search: keyword || undefined,
        });
        const list: any[] = Array.isArray(res.data) ? res.data : [];
        return list.map((s: any) => ({
          value: s.id,
          label: `${s.kode_sub_cpmk || `Sub #${s.id}`} - ${(s.deskripsi || '').substring(0, 60)}`,
          raw: s,
        }));
      } catch {
        return [];
      }
    },
    [mataKuliahId]
  );

  const initialSubOption = useMemo(() => {
    const sub = initial?.sub_cpmk || initial?.subCpmk;
    if (!sub?.id) return null;
    return {
      value: sub.id,
      label: `${sub.kode_sub_cpmk || `Sub #${sub.id}`} - ${(sub.deskripsi || '').substring(0, 60)}`,
      raw: sub,
    };
  }, [initial]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SesiFormValues>({
    resolver: zodResolver(sesiSchema),
    defaultValues: {
      minggu_ke: initial?.minggu_ke ? Number(initial.minggu_ke) : defaultMingguKe,
      sub_cpmk_id: initial?.sub_cpmk_id ? Number(initial.sub_cpmk_id) : null,
      kemampuan_akhir: initial?.kemampuan_akhir || '',
      indikator_penilaian: initial?.indikator_penilaian || '',
      kriteria_teknik: initial?.kriteria_teknik || '',
      bentuk_luring: initial?.bentuk_luring || '',
      bentuk_daring: initial?.bentuk_daring || '',
      bahan_kajian: initial?.bahan_kajian || '',
      penugasan_mahasiswa: initial?.penugasan_mahasiswa || '',
      bobot_penilaian: initial?.bobot_penilaian !== undefined ? Number(initial.bobot_penilaian) : 3,
    },
  });

  const onSubmit = async (values: SesiFormValues) => {
    try {
      setSaving(true);
      await siakadService.storeRpsSesi(rpsId, {
        id: initial?.id,
        minggu_ke: values.minggu_ke,
        sub_cpmk_id: values.sub_cpmk_id || undefined,
        kemampuan_akhir: values.kemampuan_akhir.trim(),
        bahan_kajian: values.bahan_kajian.trim(),
        indikator_penilaian: values.indikator_penilaian?.trim() || undefined,
        kriteria_teknik: values.kriteria_teknik?.trim() || undefined,
        bentuk_luring: values.bentuk_luring?.trim() || undefined,
        bentuk_daring: values.bentuk_daring?.trim() || undefined,
        penugasan_mahasiswa: values.penugasan_mahasiswa?.trim() || undefined,
        bobot_penilaian: values.bobot_penilaian,
      });
      toast.success(initial ? 'Sesi pertemuan berhasil diperbarui' : 'Sesi pertemuan berhasil ditambahkan');
      router.push(`/siakad/obe/rps/${rpsId}/edit`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan sesi pertemuan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Pertemuan Ke *"
              min={1}
              max={16}
              error={errors.minggu_ke?.message}
              {...register('minggu_ke', { valueAsNumber: true })}
            />
            <Input
              type="number"
              label="Bobot Penilaian *"
              min={0}
              max={100}
              error={errors.bobot_penilaian?.message}
              {...register('bobot_penilaian', { valueAsNumber: true })}
            />
          </div>

          <Controller
            name="sub_cpmk_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Sub-CPMK Rujukan"
                placeholder="Cari kode atau rumusan Sub-CPMK..."
                loadOptions={loadSubCpmkOptions}
                defaultOptions={initialSubOption ? [initialSubOption] : true}
                value={field.value || null}
                onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                isClearable
                error={errors.sub_cpmk_id?.message}
              />
            )}
          />

          <Textarea
            label="Kemampuan Akhir Tiap Tahapan Belajar (Sub-CPMK) *"
            rows={2}
            placeholder="Tuliskan kemampuan akhir yang direncanakan pada pertemuan ini..."
            error={errors.kemampuan_akhir?.message}
            {...register('kemampuan_akhir')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Indikator Penilaian"
              rows={2}
              placeholder="Tuliskan indikator capaian penilaian..."
              error={errors.indikator_penilaian?.message}
              {...register('indikator_penilaian')}
            />
            <Textarea
              label="Kriteria & Teknik Penilaian"
              rows={2}
              placeholder="Tuliskan kriteria dan teknik penilaian (rubrik, tes, observasi)..."
              error={errors.kriteria_teknik?.message}
              {...register('kriteria_teknik')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Aktivitas Luring"
              rows={2}
              placeholder="Tuliskan bentuk, metode, dan penugasan luring..."
              error={errors.bentuk_luring?.message}
              {...register('bentuk_luring')}
            />
            <Textarea
              label="Aktivitas Daring"
              rows={2}
              placeholder="Tuliskan bentuk, metode, dan penugasan daring..."
              error={errors.bentuk_daring?.message}
              {...register('bentuk_daring')}
            />
          </div>

          <Textarea
            label="Materi Pembelajaran *"
            rows={2}
            placeholder="Tuliskan materi/bahan kajian pertemuan ini..."
            error={errors.bahan_kajian?.message}
            {...register('bahan_kajian')}
          />

          <Textarea
            label="Penugasan Mahasiswa"
            rows={2}
            placeholder="Tuliskan penugasan terstruktur/mandiri mahasiswa..."
            error={errors.penugasan_mahasiswa?.message}
            {...register('penugasan_mahasiswa')}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/siakad/obe/rps/${rpsId}/edit`)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {submitLabel}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
