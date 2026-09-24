'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';

export const mataKuliahSchema = z.object({
  kurikulum_id: z.number({ error: 'Kurikulum wajib dipilih' }).min(1, 'Kurikulum wajib dipilih'),
  kode_mk: z.string().min(1, 'Kode MK wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  nama: z.string().min(3, 'Nama MK minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  sks_teori: z.number({ error: 'SKS teori wajib diisi' }).min(0, 'Minimal 0').max(12, 'Maksimal 12'),
  sks_praktik: z.number({ error: 'SKS praktik wajib diisi' }).min(0, 'Minimal 0').max(12, 'Maksimal 12'),
  semester_anjuran: z.number({ error: 'Semester wajib diisi' }).min(1, 'Minimal semester 1').max(14, 'Maksimal semester 14'),
  tipe: z.string().min(1, 'Tipe wajib dipilih'),
});

export type MataKuliahFormValues = z.infer<typeof mataKuliahSchema>;

export const prasyaratSchema = z.object({
  prasyarat_id: z.number({ error: 'Mata kuliah prasyarat wajib dipilih' }).min(1, 'Mata kuliah prasyarat wajib dipilih'),
  tipe: z.string().min(1, 'Kriteria wajib dipilih'),
  nilai_minimum: z.number({ error: 'Nilai minimum wajib diisi' }).min(0, 'Minimal 0').max(100, 'Maksimal 100'),
});

export type PrasyaratFormValues = z.infer<typeof prasyaratSchema>;

interface MataKuliahFormProps {
  kurikulumOptions: { value: number; label: string }[];
  defaultValues?: Partial<MataKuliahFormValues>;
  onSubmit: (values: MataKuliahFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEditing?: boolean;
}

const loadMkOptions = async (keyword: string, excludeId?: number) => {
  const res = await siakadService.getMataKuliahs({ per_page: 50, search: keyword || undefined });
  const list: any[] = res.data || [];
  return list
    .filter((m: any) => m.id !== excludeId)
    .map((m: any) => ({
      value: m.id,
      label: `${m.kode_mk} — ${m.nama} (${m.total_sks ?? '-'} SKS)`,
    }));
};

export function MataKuliahForm({ kurikulumOptions, defaultValues, onSubmit, onCancel, submitLabel = 'Simpan Mata Kuliah', isEditing = false }: MataKuliahFormProps) {
  const tipeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.TIPE_MK);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MataKuliahFormValues>({
    resolver: zodResolver(mataKuliahSchema),
    defaultValues: {
      kurikulum_id: 0,
      kode_mk: '',
      nama: '',
      sks_teori: 2,
      sks_praktik: 1,
      semester_anjuran: 1,
      tipe: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Kode Mata Kuliah" required disabled={isEditing} placeholder="cth. IF2101" error={errors.kode_mk?.message} {...register('kode_mk')} />
        <Input label="Nama Mata Kuliah" required placeholder="cth. Pemrograman Web Lanjut" error={errors.nama?.message} {...register('nama')} />
        <Controller
          name="kurikulum_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Kurikulum Acuan"
              required
              placeholder="Pilih kurikulum..."
              options={kurikulumOptions}
              value={field.value || ''}
              onChange={(val: any) => field.onChange(Number(val))}
              isDisabled={isEditing}
              error={errors.kurikulum_id?.message}
            />
          )}
        />
        <Controller
          name="tipe"
          control={control}
          render={({ field }) => (
            <Select
              label="Tipe Mata Kuliah"
              required
              options={tipeOptions}
              value={field.value || ''}
              onChange={(val: any) => field.onChange(val)}
              error={errors.tipe?.message}
            />
          )}
        />
        <Input label="SKS Teori" type="number" min={0} max={12} required error={errors.sks_teori?.message} {...register('sks_teori', { valueAsNumber: true })} />
        <Input label="SKS Praktik" type="number" min={0} max={12} required error={errors.sks_praktik?.message} {...register('sks_praktik', { valueAsNumber: true })} />
        <Input label="Semester Anjuran (1 - 14)" type="number" min={1} max={14} required error={errors.semester_anjuran?.message} {...register('semester_anjuran', { valueAsNumber: true })} />
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

interface PrasyaratFormProps {
  excludeMkId: number;
  onSubmit: (values: PrasyaratFormValues) => Promise<void>;
}

export function PrasyaratForm({ excludeMkId, onSubmit }: PrasyaratFormProps) {
  const tipeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.TIPE_PRASYARAT);
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrasyaratFormValues>({
    resolver: zodResolver(prasyaratSchema),
    defaultValues: { prasyarat_id: 0, tipe: '', nilai_minimum: 55 },
  });

  const tipe = watch('tipe');

  const submitAndReset = async (values: PrasyaratFormValues) => {
    await onSubmit(values);
    reset({ prasyarat_id: 0, tipe: '', nilai_minimum: 55 });
  };

  return (
    <form onSubmit={handleSubmit(submitAndReset)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="prasyarat_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              label="Mata Kuliah Prasyarat"
              required
              placeholder="Cari kode / nama MK..."
              loadOptions={(kw: string) => loadMkOptions(kw, excludeMkId)}
              value={field.value || null}
              onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : 0)}
              error={errors.prasyarat_id?.message}
            />
          )}
        />
        <Controller
          name="tipe"
          control={control}
          render={({ field }) => (
            <Select
              label="Kriteria Prasyarat"
              required
              options={tipeOptions}
              value={field.value || ''}
              onChange={(val: any) => field.onChange(val)}
              error={errors.tipe?.message}
            />
          )}
        />
        {tipe === 'lulus' && (
          <Input label="Batas Nilai Angka Minimum" type="number" step="0.1" min={0} max={100} required error={errors.nilai_minimum?.message} {...register('nilai_minimum', { valueAsNumber: true })} />
        )}
      </div>
      <div className="flex items-center justify-end">
        <Button type="submit" variant="primary" size="sm" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Tambahkan Prasyarat'}
        </Button>
      </div>
    </form>
  );
}
