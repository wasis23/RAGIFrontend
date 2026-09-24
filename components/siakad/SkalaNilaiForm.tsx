'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';

export const skalaNilaiSchema = z.object({
  program_studi_id: z.number().nullable().optional(),
  nilai_huruf: z.string().min(1, 'Nilai huruf wajib diisi').max(5, 'Maksimal 5 karakter'),
  bobot_indeks: z.number({ error: 'Bobot wajib diisi' }).min(0, 'Minimal 0').max(4, 'Maksimal 4.00'),
  batas_bawah: z.number({ error: 'Batas bawah wajib diisi' }).min(0, 'Minimal 0').max(100, 'Maksimal 100'),
  batas_atas: z.number({ error: 'Batas atas wajib diisi' }).min(0, 'Minimal 0').max(100, 'Maksimal 100'),
  is_lulus: z.boolean(),
  keterangan: z.string().max(255, 'Maksimal 255 karakter').optional().or(z.literal('')),
}).refine((v) => v.batas_atas >= v.batas_bawah, {
  message: 'Batas atas harus >= batas bawah',
  path: ['batas_atas'],
});

export type SkalaNilaiFormValues = z.infer<typeof skalaNilaiSchema>;

interface SkalaNilaiFormProps {
  prodiOptions: { value: number; label: string }[];
  defaultValues?: Partial<SkalaNilaiFormValues>;
  onSubmit: (values: SkalaNilaiFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SkalaNilaiForm({ prodiOptions, defaultValues, onSubmit, onCancel, submitLabel = 'Simpan Skala Nilai' }: SkalaNilaiFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SkalaNilaiFormValues>({
    resolver: zodResolver(skalaNilaiSchema),
    defaultValues: {
      program_studi_id: null,
      nilai_huruf: '',
      bobot_indeks: 4,
      batas_bawah: 85,
      batas_atas: 100,
      is_lulus: true,
      keterangan: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="program_studi_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Program Studi"
              placeholder="Berlaku Umum (Universitas)"
              options={prodiOptions}
              value={field.value || ''}
              onChange={(val: any) => field.onChange(val ? Number(val) : null)}
              isClearable
              hint="Kosongkan untuk standar universitas"
            />
          )}
        />
        <Input label="Nilai Huruf" required placeholder="cth. A, B+, C" error={errors.nilai_huruf?.message} {...register('nilai_huruf', { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })} />
        <Input label="Bobot Indeks (0 - 4.00)" type="number" step="0.01" min={0} max={4} required error={errors.bobot_indeks?.message} {...register('bobot_indeks', { valueAsNumber: true })} />
        <Input label="Keterangan / Predikat" placeholder="cth. Sangat Baik" error={errors.keterangan?.message} {...register('keterangan')} />
        <Input label="Batas Bawah Angka (0 - 100)" type="number" step="0.01" min={0} max={100} required error={errors.batas_bawah?.message} {...register('batas_bawah', { valueAsNumber: true })} />
        <Input label="Batas Atas Angka (0 - 100)" type="number" step="0.01" min={0} max={100} required error={errors.batas_atas?.message} {...register('batas_atas', { valueAsNumber: true })} />
        <div className="md:col-span-2">
          <Controller
            name="is_lulus"
            control={control}
            render={({ field }) => (
              <Checkbox label="Dinyatakan Lulus Mata Kuliah" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
            )}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
