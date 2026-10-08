'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { siakadService } from '@/services/siakad.service';

/** Nilai tetap domain (closed-set, bukan entitas master): terpusat di satu lokasi. */
export const TIPE_RUBRIK_OPTIONS: SelectOption[] = [
  { value: 'holistik', label: 'Holistik' },
  { value: 'analitik', label: 'Analitik' },
  { value: 'skala_persepsi', label: 'Skala Persepsi' },
];

export const STATUS_RUBRIK_FORM_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

export function suggestKodeRubrik(nama: string) {
  const base = nama.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 15) || 'RUBRIK';
  return `RBK-${base}`;
}

export const loadProdiOptions = async (keyword: string) => {
  const res = await siakadService.getProdi({ search: keyword || undefined, per_page: 50 });
  const raw = res?.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
  return list.map((p: any) => ({
    value: p.id,
    label: `${p.nama || p.nama_prodi || `Prodi #${p.id}`}${p.kode_prodi ? ` — ${p.kode_prodi}` : ''}${p.jenjang ? ` (${p.jenjang})` : ''}`,
    raw: p,
  }));
};

// Validasi ketat Zod (Bahasa Indonesia), selaras kontrak backend ObeMasterController.
const kriteriaSchema = z.object({
  nama_kriteria: z.string().trim().min(1, 'Nama kriteria wajib diisi').max(255, 'Nama kriteria maksimal 255 karakter'),
  bobot_persen: z.number({ error: 'Bobot wajib diisi' }).min(0, 'Bobot minimal 0').max(100, 'Bobot maksimal 100'),
  skor_min: z.number({ error: 'Skor min wajib diisi' }).min(0, 'Skor min minimal 0').max(100, 'Skor min maksimal 100'),
  skor_max: z.number({ error: 'Skor max wajib diisi' }).min(0, 'Skor max minimal 0').max(100, 'Skor max maksimal 100'),
  deskripsi: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional().or(z.literal('')),
}).refine((k) => Number(k.skor_min) <= Number(k.skor_max), {
  message: 'Skor min tidak boleh lebih besar dari skor max',
  path: ['skor_max'],
});

export const rubrikSchema = z.object({
  program_studi_id: z.number({ error: 'Program studi wajib dipilih' }).min(1, 'Program studi wajib dipilih'),
  kode_rubrik: z.string().trim().min(1, 'Kode rubrik wajib diisi').max(50, 'Kode rubrik maksimal 50 karakter'),
  nama_rubrik: z.string().trim().min(1, 'Nama rubrik wajib diisi').max(255, 'Nama rubrik maksimal 255 karakter'),
  tipe_rubrik: z.enum(['holistik', 'analitik', 'skala_persepsi'], { error: 'Tipe rubrik wajib dipilih' }),
  deskripsi: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional().or(z.literal('')),
  is_active: z.boolean(),
  kriterias: z.array(kriteriaSchema).min(1, 'Minimal 1 kriteria wajib diisi'),
});

export type RubrikFormValues = z.infer<typeof rubrikSchema>;

export const DEFAULT_RUBRIK_VALUES: RubrikFormValues = {
  program_studi_id: 0,
  kode_rubrik: '',
  nama_rubrik: '',
  tipe_rubrik: 'analitik',
  deskripsi: '',
  is_active: true,
  kriterias: [{ nama_kriteria: '', bobot_persen: 0, skor_min: 0, skor_max: 100, deskripsi: '' }],
};

interface RubrikFormProps {
  defaultValues?: Partial<RubrikFormValues> & { prodiOption?: SelectOption | null };
  onSubmit: (values: RubrikFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function RubrikForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Simpan' }: RubrikFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RubrikFormValues>({
    resolver: zodResolver(rubrikSchema) as any,
    defaultValues: { ...DEFAULT_RUBRIK_VALUES, ...defaultValues },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'kriterias' });
  const watchedNama = watch('nama_rubrik');
  const watchedKode = watch('kode_rubrik');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-sm text-slate-900">1. Identitas Rubrik</h3>
        <p className="text-2xs text-slate-500">Program studi pemilik, kode unik, nama instrumen, dan tipe penilaian.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-2 lg:col-span-3">
          <Controller
            name="program_studi_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Program Studi *"
                placeholder="Cari program studi..."
                loadOptions={loadProdiOptions}
                defaultOptions={defaultValues?.prodiOption ? [defaultValues.prodiOption] : true}
                value={field.value || null}
                onChange={(opt: any) => field.onChange(Number(opt?.value) || 0)}
                error={errors.program_studi_id?.message}
              />
            )}
          />
        </div>

        <Controller
          name="tipe_rubrik"
          control={control}
          render={({ field }) => (
            <Select
              label="Tipe Rubrik *"
              options={TIPE_RUBRIK_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.tipe_rubrik?.message}
            />
          )}
        />
        <Input
          label="Kode Rubrik *"
          placeholder={suggestKodeRubrik(watchedNama || '')}
          hint="Kode bersifat unik. Kosongkan nama lalu isi manual, atau biarkan terisi otomatis."
          error={errors.kode_rubrik?.message}
          {...register('kode_rubrik')}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Nama Rubrik *"
              placeholder="Masukkan nama rubrik..."
              error={errors.nama_rubrik?.message}
              {...register('nama_rubrik')}
            />
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Deskripsi"
            placeholder="Deskripsi singkat instrumen rubrik..."
            rows={3}
            error={errors.deskripsi?.message}
            {...register('deskripsi')}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Select
                label="Status *"
                options={STATUS_RUBRIK_FORM_OPTIONS}
                value={field.value ? 'true' : 'false'}
                onChange={(val: any) => field.onChange(val === 'true')}
                error={errors.is_active?.message}
              />
            )}
          />
        </div>
        {!watchedKode && !!watchedNama.trim() && (
          <p className="md:col-span-2 lg:col-span-3 text-2xs text-slate-400 font-mono -mt-2">
            Saran kode otomatis: {suggestKodeRubrik(watchedNama)}{' '}
            <button type="button" className="text-[var(--module-primary)] font-bold cursor-pointer" onClick={() => setValue('kode_rubrik', suggestKodeRubrik(watchedNama), { shouldValidate: true })}>
              pakai saran
            </button>
          </p>
        )}
      </div>

      <div className="border-b border-slate-100 pb-3 pt-2">
        <h3 className="font-extrabold text-sm text-slate-900">2. Kriteria, Bobot & Rentang Skor</h3>
        <p className="text-2xs text-slate-500">Setiap kriteria wajib punya nama, bobot persen, dan rentang skor min ≤ max.</p>
      </div>

      {errors.kriterias?.message && <p className="form-error">{errors.kriterias.message}</p>}
      {typeof errors.kriterias === 'object' && !Array.isArray(errors.kriterias) && (errors.kriterias as any)?.root?.message && (
        <p className="form-error">{(errors.kriterias as any).root.message}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800">Isi Rubrik (Kriteria, Bobot, Skor, Deskripsi)</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => append({ nama_kriteria: '', bobot_persen: 0, skor_min: 0, skor_max: 100, deskripsi: '' })}
          >
            Tambah Baris
          </Button>
        </div>

        {fields.map((f, idx) => (
          <div key={f.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <Input
                  label={`Kriteria ${idx + 1} *`}
                  placeholder="Nama kriteria..."
                  error={(errors.kriterias?.[idx] as any)?.nama_kriteria?.message}
                  {...register(`kriterias.${idx}.nama_kriteria` as const)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Bobot % *"
                  type="number"
                  min={0}
                  max={100}
                  error={(errors.kriterias?.[idx] as any)?.bobot_persen?.message}
                  {...register(`kriterias.${idx}.bobot_persen` as const, { valueAsNumber: true })}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Skor Min *"
                  type="number"
                  min={0}
                  max={100}
                  error={(errors.kriterias?.[idx] as any)?.skor_min?.message}
                  {...register(`kriterias.${idx}.skor_min` as const, { valueAsNumber: true })}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Skor Max *"
                  type="number"
                  min={0}
                  max={100}
                  error={(errors.kriterias?.[idx] as any)?.skor_max?.message}
                  {...register(`kriterias.${idx}.skor_max` as const, { valueAsNumber: true })}
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-start md:justify-center pb-1">
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(idx)}
                  disabled={fields.length <= 1}
                  className="text-rose-500 hover:text-rose-700 p-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Hapus Baris"
                  aria-label={`Hapus kriteria ${idx + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="md:col-span-11">
                <Input
                  label="Deskripsi"
                  placeholder="Deskripsi pencapaian..."
                  error={(errors.kriterias?.[idx] as any)?.deskripsi?.message}
                  {...register(`kriterias.${idx}.deskripsi` as const)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
