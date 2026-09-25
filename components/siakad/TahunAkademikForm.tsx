'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';

const dateField = z.string().optional().or(z.literal(''));

export const tahunAkademikSchema = z.object({
  kode: z.string().min(1, 'Kode periode wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  nama: z.string().min(3, 'Nama periode minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  tahun_mulai: z.number({ error: 'Tahun mulai wajib diisi' }).min(2000, 'Tahun tidak valid').max(2100, 'Tahun tidak valid'),
  tahun_selesai: z.number({ error: 'Tahun selesai wajib diisi' }).min(2000, 'Tahun tidak valid').max(2100, 'Tahun tidak valid'),
  mode_penilaian: z.string().optional().or(z.literal('')),
  krs_mulai: dateField,
  krs_selesai: dateField,
  kprs_mulai: dateField,
  kprs_selesai: dateField,
  perkuliahan_mulai: dateField,
  perkuliahan_selesai: dateField,
  input_nilai_mulai: dateField,
  input_nilai_selesai: dateField,
});

export type TahunAkademikFormValues = z.infer<typeof tahunAkademikSchema>;

interface TahunAkademikFormProps {
  defaultValues?: Partial<TahunAkademikFormValues>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEditing?: boolean;
}

export function tahunAkademikDefaults(): TahunAkademikFormValues {
  const year = new Date().getFullYear();
  return {
    kode: '',
    nama: '',
    tahun_mulai: year,
    tahun_selesai: year + 1,
    mode_penilaian: '',
    krs_mulai: '',
    krs_selesai: '',
    kprs_mulai: '',
    kprs_selesai: '',
    perkuliahan_mulai: '',
    perkuliahan_selesai: '',
    input_nilai_mulai: '',
    input_nilai_selesai: '',
  };
}

const toDateInput = (v: any) => (typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : '');

export function tahunAkademikFromRow(row: any): Partial<TahunAkademikFormValues> {
  return {
    kode: row.kode,
    nama: row.nama,
    tahun_mulai: row.tahun_mulai,
    tahun_selesai: row.tahun_selesai,
    mode_penilaian: row.mode_penilaian || '',
    krs_mulai: toDateInput(row.krs_mulai),
    krs_selesai: toDateInput(row.krs_selesai),
    kprs_mulai: toDateInput(row.kprs_mulai),
    kprs_selesai: toDateInput(row.kprs_selesai),
    perkuliahan_mulai: toDateInput(row.perkuliahan_mulai),
    perkuliahan_selesai: toDateInput(row.perkuliahan_selesai),
    input_nilai_mulai: toDateInput(row.input_nilai_mulai),
    input_nilai_selesai: toDateInput(row.input_nilai_selesai),
  };
}

function DateRange({ fromLabel, toLabel, fromName, toName, register, errors }: any) {
  return (
    <>
      <Input label={fromLabel} type="date" error={errors[fromName]?.message} {...register(fromName)} />
      <Input label={toLabel} type="date" error={errors[toName]?.message} {...register(toName)} />
    </>
  );
}

export function TahunAkademikForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Simpan Periode', isEditing = false }: TahunAkademikFormProps) {
  const modeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.MODE_PENILAIAN);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TahunAkademikFormValues>({
    resolver: zodResolver(tahunAkademikSchema),
    defaultValues: { ...tahunAkademikDefaults(), ...defaultValues },
  });

  const toPayload = (v: TahunAkademikFormValues) => {
    const cleaned: Record<string, any> = { ...v };
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '') cleaned[k] = null;
    });
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit(async (v) => onSubmit(toPayload(v)))} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input label="Kode Periode" required disabled={isEditing} placeholder="cth. 20262" error={errors.kode?.message} {...register('kode')} />
        <div className="md:col-span-2">
          <Input label="Nama Periode" required placeholder="cth. 2026/2027 Genap" error={errors.nama?.message} {...register('nama')} />
        </div>
        <Input label="Tahun Mulai" type="number" required error={errors.tahun_mulai?.message} {...register('tahun_mulai', { valueAsNumber: true })} />
        <Input label="Tahun Selesai" type="number" required error={errors.tahun_selesai?.message} {...register('tahun_selesai', { valueAsNumber: true })} />
        <Controller
          name="mode_penilaian"
          control={control}
          render={({ field }) => (
            <Select
              label="Mode Penilaian"
              options={modeOptions}
              value={field.value || ''}
              onChange={(val: any) => field.onChange(val)}
              hint="Berlaku untuk seluruh kelas pada periode ini"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <DateRange fromLabel="KRS Mulai" toLabel="KRS Selesai" fromName="krs_mulai" toName="krs_selesai" register={register} errors={errors} />
        <DateRange fromLabel="KPRS Mulai" toLabel="KPRS Selesai" fromName="kprs_mulai" toName="kprs_selesai" register={register} errors={errors} />
        <DateRange fromLabel="Perkuliahan Mulai" toLabel="Perkuliahan Selesai" fromName="perkuliahan_mulai" toName="perkuliahan_selesai" register={register} errors={errors} />
        <DateRange fromLabel="Input Nilai Mulai" toLabel="Input Nilai Selesai" fromName="input_nilai_mulai" toName="input_nilai_selesai" register={register} errors={errors} />
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
