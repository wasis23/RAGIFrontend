'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { siakadService } from '@/services/siakad.service';

/** Nilai tetap domain: semester akademik 1–8 (bukan entitas master). */
export const SEMESTER_OPTIONS: SelectOption[] = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const toId = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const distribusiMengajarSchema = z.object({
  tahun_akademik_id: z.number().nullable().optional(),
  kurikulum_id: z.number().nullable().optional(),
  mata_kuliah_id: z.number({ error: 'Mata kuliah wajib dipilih' }).min(1, 'Mata kuliah wajib dipilih'),
  semester: z.number({ error: 'Semester wajib diisi' }).min(1, 'Semester minimal 1').max(8, 'Semester maksimal 8'),
  dosen_koordinator_id: z.number().nullable().optional(),
  dosen_anggota_ids: z.array(z.number()).optional(),
});

export type DistribusiMengajarFormValues = z.infer<typeof distribusiMengajarSchema>;

interface DistribusiMengajarFormProps {
  defaultValues?: Partial<DistribusiMengajarFormValues> & {
    kurikulumOption?: SelectOption | null;
    mataKuliahOption?: SelectOption | null;
    koordinatorOption?: SelectOption | null;
    anggotaOptions?: SelectOption[];
    tahunAkademikNama?: string;
  };
  tahunAktifNama?: string;
  onSubmit: (values: DistribusiMengajarFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export const loadKurikulumOptions = async (keyword: string) => {
  const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((k: any) => ({
    value: k.id,
    label: `${k.nama} (${k.tahun_berlaku || k.tahun_mulai || '-'})`,
  }));
};

export const loadMataKuliahOptions = async (keyword: string, kurikulumId?: number | null) => {
  const res = await siakadService.getMataKuliahs({
    search: keyword || undefined,
    kurikulum_id: kurikulumId || undefined,
    per_page: 50,
  });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((m: any) => ({
    value: m.id,
    label: `${m.kode_mk} — ${m.nama}`,
    raw: m,
  }));
};

export const loadDosenOptions = async (keyword: string) => {
  const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50, is_active: true });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((d: any) => ({
    value: d.id,
    label: `${d.nama_lengkap} — NIDN ${d.nidn || d.nik || d.nip || '-'}`,
  }));
};

export function DistribusiMengajarForm({
  defaultValues,
  tahunAktifNama,
  onSubmit,
  onCancel,
  submitLabel = 'Simpan',
}: DistribusiMengajarFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DistribusiMengajarFormValues>({
    resolver: zodResolver(distribusiMengajarSchema),
    defaultValues: {
      tahun_akademik_id: null,
      kurikulum_id: null,
      mata_kuliah_id: 0,
      semester: 1,
      dosen_koordinator_id: null,
      dosen_anggota_ids: [],
      ...defaultValues,
    },
  });

  // Cascading: daftar MK difilter berdasarkan kurikulum yang dipilih.
  const selectedKurikulumId = watch('kurikulum_id');
  const isFirstKurikulumRender = useRef(true);
  useEffect(() => {
    // Lewati render pertama agar nilai awal mode edit tidak terhapus.
    if (isFirstKurikulumRender.current) {
      isFirstKurikulumRender.current = false;
      return;
    }
    setValue('mata_kuliah_id', 0);
  }, [selectedKurikulumId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input label="Tahun Akademik" value={defaultValues?.tahunAkademikNama || tahunAktifNama || '-'} disabled />
        </div>

        <Controller
          name="kurikulum_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              label="Kurikulum"
              placeholder="Cari kurikulum..."
              loadOptions={loadKurikulumOptions}
              defaultOptions={defaultValues?.kurikulumOption ? [defaultValues.kurikulumOption] : true}
              value={field.value || null}
              onChange={(opt: any) => field.onChange(toId(opt?.value))}
              isClearable
              error={errors.kurikulum_id?.message}
            />
          )}
        />

        <Controller
          name="mata_kuliah_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              key={`mk-${selectedKurikulumId || 'all'}`}
              label="Mata Kuliah"
              placeholder={selectedKurikulumId ? 'Cari kode / nama MK...' : 'Pilih kurikulum terlebih dahulu...'}
              loadOptions={(keyword: string) => loadMataKuliahOptions(keyword, toId(selectedKurikulumId))}
              defaultOptions={defaultValues?.mataKuliahOption ? [defaultValues.mataKuliahOption] : true}
              value={field.value || null}
              onChange={(opt: any) => {
                field.onChange(Number(opt?.value) || 0);
                const semAnjuran = Number(opt?.raw?.semester_anjuran);
                if (Number.isFinite(semAnjuran) && semAnjuran >= 1 && semAnjuran <= 8) {
                  setValue('semester', semAnjuran);
                }
              }}
              isDisabled={!selectedKurikulumId}
              error={errors.mata_kuliah_id?.message}
            />
          )}
        />

        <Controller
          name="semester"
          control={control}
          render={({ field }) => (
            <Select
              label="Untuk Semester"
              required
              hint="Pastikan mata kuliah ini untuk semester berapa"
              options={SEMESTER_OPTIONS}
              value={String(field.value || '1')}
              onChange={(val: any) => field.onChange(Number(val))}
              error={errors.semester?.message}
            />
          )}
        />

        <Controller
          name="dosen_koordinator_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              label="Dosen Koordinator"
              placeholder="Cari nama / NIDN dosen..."
              loadOptions={loadDosenOptions}
              defaultOptions={defaultValues?.koordinatorOption ? [defaultValues.koordinatorOption] : true}
              value={field.value || null}
              onChange={(opt: any) => field.onChange(toId(opt?.value))}
              isClearable
              error={errors.dosen_koordinator_id?.message}
            />
          )}
        />

        <div className="md:col-span-2">
          <Controller
            name="dosen_anggota_ids"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Dosen Anggota"
                placeholder="Cari berdasarkan NIDN atau nama..."
                loadOptions={loadDosenOptions}
                defaultOptions={defaultValues?.anggotaOptions || true}
                value={field.value || []}
                onChange={(opts: any) =>
                  field.onChange(Array.isArray(opts) ? opts.map((o: any) => Number(o.value)).filter(Boolean) : [])
                }
                isMulti
                isClearable
                error={errors.dosen_anggota_ids?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Sinkronisasi semester anjuran MK: simpan manual via hidden register */}
      <input type="hidden" {...register('mata_kuliah_id', { valueAsNumber: true })} />

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
