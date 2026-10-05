'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Building2, Save, Wind, Tv, Wifi, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { sinapraService } from '@/services/sinapra.service';
import { siakadService } from '@/services/siakad.service';
import type { Ruangan, RuanganFormPayload } from '@/types/sinapra.types';

export const ruanganSchema = z.object({
  gedung_id: z.coerce
    .number({ error: 'Gedung kampus wajib dipilih' })
    .min(1, 'Gedung kampus wajib dipilih'),
  kode: z
    .string()
    .min(1, 'Kode ruangan wajib diisi')
    .max(50, 'Kode ruangan maksimal 50 karakter'),
  nama: z
    .string()
    .min(2, 'Nama ruangan minimal 2 karakter')
    .max(255, 'Nama ruangan maksimal 255 karakter'),
  lantai: z.coerce
    .number({ error: 'Posisi lantai wajib diisi' })
    .min(1, 'Posisi lantai minimal lantai 1'),
  kapasitas: z.coerce
    .number({ error: 'Kapasitas ruangan wajib diisi' })
    .min(1, 'Kapasitas minimal 1 orang'),
  luas_m2: z.coerce
    .number()
    .optional()
    .nullable(),
  tipe_ruangan_id: z.coerce
    .number({ error: 'Tipe ruangan wajib dipilih' })
    .min(1, 'Tipe ruangan wajib dipilih'),
  program_studi_id: z.coerce
    .number()
    .optional()
    .nullable(),
  status: z.enum(['aktif', 'maintenance', 'nonaktif']),
  keterangan: z.string().optional().nullable(),
  ada_ac: z.boolean().default(false),
  jumlah_ac: z.coerce.number().min(0, 'Minimal 0').default(0),
  ada_proyektor: z.boolean().default(false),
  jumlah_proyektor: z.coerce.number().min(0, 'Minimal 0').default(0),
  ada_wifi: z.boolean().default(false),
  jumlah_wifi: z.coerce.number().min(0, 'Minimal 0').default(0),
});

export type RuanganFormValues = z.infer<typeof ruanganSchema>;

interface RuanganFormProps {
  initialData?: Ruangan;
  isEdit?: boolean;
}

export function RuanganForm({ initialData, isEdit = false }: RuanganFormProps) {
  const router = useRouter();

  // AsyncSelect states for initial prefilling
  const [selectedGedung, setSelectedGedung] = useState<{ value: string; label: string } | null>(
    initialData?.gedung
      ? { value: initialData.gedung.id.toString(), label: `${initialData.gedung.kode} - ${initialData.gedung.nama}` }
      : null
  );

  const [selectedTipeRuangan, setSelectedTipeRuangan] = useState<{ value: string; label: string } | null>(
    initialData?.tipe_ruangan
      ? { value: initialData.tipe_ruangan.id.toString(), label: `${initialData.tipe_ruangan.nama} (${initialData.tipe_ruangan.kode})` }
      : null
  );

  const [selectedProdi, setSelectedProdi] = useState<{ value: string; label: string } | null>(
    initialData?.program_studi
      ? { value: initialData.program_studi.id.toString(), label: `${initialData.program_studi.nama} (${initialData.program_studi.kode_prodi})` }
      : null
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RuanganFormValues>({
    resolver: zodResolver(ruanganSchema) as any,
    defaultValues: {
      gedung_id: initialData?.gedung_id || 0,
      kode: initialData?.kode || '',
      nama: initialData?.nama || '',
      lantai: initialData?.lantai || 1,
      kapasitas: initialData?.kapasitas || 40,
      luas_m2: initialData?.luas_m2 ?? undefined,
      tipe_ruangan_id: initialData?.tipe_ruangan_id || (initialData?.tipe_ruangan?.id ?? 0),
      program_studi_id: initialData?.program_studi_id || (initialData?.program_studi?.id ?? null),
      status: initialData?.status || 'aktif',
      keterangan: initialData?.keterangan || '',
      ada_ac: Boolean(initialData?.ada_ac || (initialData?.jumlah_ac && initialData.jumlah_ac > 0)),
      jumlah_ac: initialData?.jumlah_ac ?? (initialData?.ada_ac ? 1 : 0),
      ada_proyektor: Boolean(initialData?.ada_proyektor || (initialData?.jumlah_proyektor && initialData.jumlah_proyektor > 0)),
      jumlah_proyektor: initialData?.jumlah_proyektor ?? (initialData?.ada_proyektor ? 1 : 0),
      ada_wifi: Boolean(initialData?.ada_wifi || (initialData?.jumlah_wifi && initialData.jumlah_wifi > 0)),
      jumlah_wifi: initialData?.jumlah_wifi ?? (initialData?.ada_wifi ? 1 : 0),
    },
  });

  const watchAdaAc = watch('ada_ac');
  const watchJumlahAc = watch('jumlah_ac');
  const watchAdaProyektor = watch('ada_proyektor');
  const watchJumlahProyektor = watch('jumlah_proyektor');
  const watchAdaWifi = watch('ada_wifi');
  const watchJumlahWifi = watch('jumlah_wifi');

  // Option loaders
  const loadGedungOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getGedungList({ search: inputValue });
      const list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((g: any) => ({
          value: g.id.toString(),
          label: `${g.kode} - ${g.nama}`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const loadTipeRuanganOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getMasterTipeRuanganList({ search: inputValue, is_active: true });
      const list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((item: any) => ({
          value: item.id.toString(),
          label: `${item.nama} (${item.kode})`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const loadProdiOptions = async (inputValue: string) => {
    try {
      const res: any = await siakadService.getProdi({ search: inputValue });
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((p: any) => ({
          value: p.id.toString(),
          label: `${p.nama} (${p.kode_prodi})`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const onSubmit = async (values: RuanganFormValues) => {
    const payload: RuanganFormPayload = {
      gedung_id: Number(values.gedung_id),
      kode: values.kode.trim(),
      nama: values.nama.trim(),
      lantai: Number(values.lantai),
      kapasitas: Number(values.kapasitas),
      luas_m2: values.luas_m2 ? Number(values.luas_m2) : undefined,
      tipe_ruangan_id: values.tipe_ruangan_id ? Number(values.tipe_ruangan_id) : null,
      program_studi_id: values.program_studi_id ? Number(values.program_studi_id) : null,
      status: values.status,
      keterangan: values.keterangan || undefined,
      ada_ac: Boolean(values.ada_ac || (values.jumlah_ac && values.jumlah_ac > 0)),
      jumlah_ac: Number(values.jumlah_ac || 0),
      ada_proyektor: Boolean(values.ada_proyektor || (values.jumlah_proyektor && values.jumlah_proyektor > 0)),
      jumlah_proyektor: Number(values.jumlah_proyektor || 0),
      ada_wifi: Boolean(values.ada_wifi || (values.jumlah_wifi && values.jumlah_wifi > 0)),
      jumlah_wifi: Number(values.jumlah_wifi || 0),
    };

    try {
      if (isEdit && initialData?.id) {
        await sinapraService.updateRuangan(initialData.id, payload);
        toast.success(`Ruangan ${payload.nama} berhasil diperbarui!`);
      } else {
        await sinapraService.createRuangan(payload);
        toast.success(`Ruangan baru ${payload.nama} berhasil ditambahkan!`);
      }
      router.push('/sinapra/gedung-ruangan');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data ruangan.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* ── SECTION 1: INFORMASI UTAMA RUANGAN ─────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Building2 size={18} className="text-[var(--module-primary)]" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Identitas & Lokasi Ruangan
          </h3>
        </div>

        {/* Compact Grid Layout Maksimal 3 Kolom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Gedung Kampus */}
          <Controller
            name="gedung_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Gedung Kampus"
                required
                placeholder="Cari gedung..."
                value={selectedGedung}
                onChange={(selected: any) => {
                  setSelectedGedung(selected);
                  field.onChange(selected ? parseInt(selected.value) : 0);
                }}
                loadOptions={loadGedungOptions}
                error={errors.gedung_id?.message}
              />
            )}
          />

          {/* 2. Kode Ruangan */}
          <Input
            label="Kode Ruangan"
            required
            placeholder="cth: R-101, LAB-KOMP-01"
            error={errors.kode?.message}
            {...register('kode')}
          />

          {/* 3. Nama Ruangan */}
          <Input
            label="Nama Ruangan"
            required
            placeholder="cth: Lab Komputer Jaringan"
            error={errors.nama?.message}
            {...register('nama')}
          />

          {/* 4. Tipe Ruangan */}
          <Controller
            name="tipe_ruangan_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Tipe Ruangan"
                required
                placeholder="Pilih atau cari tipe ruangan..."
                value={selectedTipeRuangan}
                onChange={(selected: any) => {
                  setSelectedTipeRuangan(selected);
                  field.onChange(selected ? parseInt(selected.value) : 0);
                }}
                loadOptions={loadTipeRuanganOptions}
                error={errors.tipe_ruangan_id?.message}
              />
            )}
          />

          {/* 5. Posisi Lantai */}
          <Input
            label="Posisi Lantai"
            type="number"
            required
            min={1}
            placeholder="1"
            error={errors.lantai?.message}
            {...register('lantai')}
          />

          {/* 6. Kapasitas */}
          <Input
            label="Kapasitas (Orang)"
            type="number"
            required
            min={1}
            placeholder="40"
            error={errors.kapasitas?.message}
            {...register('kapasitas')}
          />

          {/* 7. Luas (m²) */}
          <Input
            label="Luas Area (m²)"
            type="number"
            step="0.1"
            min={0}
            placeholder="cth: 72"
            error={errors.luas_m2?.message}
            {...register('luas_m2')}
          />

          {/* 8. Program Studi (Opsional) */}
          <Controller
            name="program_studi_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Program Studi (Lab / Ruang Khusus Prodi)"
                placeholder="Pilih Prodi (Kosongkan jika Umum)..."
                value={selectedProdi}
                onChange={(selected: any) => {
                  setSelectedProdi(selected);
                  field.onChange(selected ? parseInt(selected.value) : null);
                }}
                loadOptions={loadProdiOptions}
                isClearable
                error={errors.program_studi_id?.message}
              />
            )}
          />

          {/* 9. Status Ruangan */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status Operasional Ruangan"
                required
                value={field.value}
                onChange={(val) => field.onChange(val)}
                options={[
                  { value: 'aktif', label: 'Aktif & Siap Digunakan' },
                  { value: 'maintenance', label: 'Sedang Maintenance / Perbaikan' },
                  { value: 'nonaktif', label: 'Non-aktif / Tidak Digunakan' },
                ]}
                error={errors.status?.message}
              />
            )}
          />

          {/* 10. Keterangan / Deskripsi Ruangan (Col-span Full) */}
          <div className="col-span-full">
            <Textarea
              label="Keterangan / Fasilitas Tambahan / Catatan Khusus"
              placeholder="Tuliskan catatan teknis ruangan bila ada (misal: AC sentral, panel listrik mandiri, dsb)..."
              error={errors.keterangan?.message}
              {...register('keterangan')}
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: FASILITAS TERSEDIA & JUMLAH KUANTITAS ─────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[var(--module-primary)]" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Fasilitas Fisik & Kuantitas Unit
            </h3>
          </div>
          <span className="text-2xs text-slate-500">
            Aktifkan fasilitas dan tentukan jumlah unit yang terpasang
          </span>
        </div>

        {/* 3 Kolom Card Fasilitas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Air Conditioner (AC) */}
          <div className={`p-4 rounded-xl border transition-all ${
            watchAdaAc
              ? 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  watchAdaAc ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Wind size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Air Conditioner (AC)
                  </span>
                  <span className="text-2xs text-slate-400 block">Pendingin Ruangan</span>
                </div>
              </div>
              <Checkbox
                label="Tersedia"
                checked={watchAdaAc}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('ada_ac', checked);
                  if (checked && (!watchJumlahAc || watchJumlahAc === 0)) {
                    setValue('jumlah_ac', 1);
                  } else if (!checked) {
                    setValue('jumlah_ac', 0);
                  }
                }}
              />
            </div>

            <Input
              label="Jumlah Unit AC"
              type="number"
              min={0}
              placeholder="0"
              disabled={!watchAdaAc}
              error={errors.jumlah_ac?.message}
              value={watchJumlahAc}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setValue('jumlah_ac', val);
                if (val > 0 && !watchAdaAc) setValue('ada_ac', true);
                if (val === 0 && watchAdaAc) setValue('ada_ac', false);
              }}
            />
          </div>

          {/* 2. Proyektor LCD */}
          <div className={`p-4 rounded-xl border transition-all ${
            watchAdaProyektor
              ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  watchAdaProyektor ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Tv size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Proyektor LCD
                  </span>
                  <span className="text-2xs text-slate-400 block">Presentasi & Media</span>
                </div>
              </div>
              <Checkbox
                label="Tersedia"
                checked={watchAdaProyektor}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('ada_proyektor', checked);
                  if (checked && (!watchJumlahProyektor || watchJumlahProyektor === 0)) {
                    setValue('jumlah_proyektor', 1);
                  } else if (!checked) {
                    setValue('jumlah_proyektor', 0);
                  }
                }}
              />
            </div>

            <Input
              label="Jumlah Unit Proyektor"
              type="number"
              min={0}
              placeholder="0"
              disabled={!watchAdaProyektor}
              error={errors.jumlah_proyektor?.message}
              value={watchJumlahProyektor}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setValue('jumlah_proyektor', val);
                if (val > 0 && !watchAdaProyektor) setValue('ada_proyektor', true);
                if (val === 0 && watchAdaProyektor) setValue('ada_proyektor', false);
              }}
            />
          </div>

          {/* 3. Koneksi WiFi High-Speed */}
          <div className={`p-4 rounded-xl border transition-all ${
            watchAdaWifi
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  watchAdaWifi ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Wifi size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Koneksi WiFi High-Speed
                  </span>
                  <span className="text-2xs text-slate-400 block">Akses Internet</span>
                </div>
              </div>
              <Checkbox
                label="Tersedia"
                checked={watchAdaWifi}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('ada_wifi', checked);
                  if (checked && (!watchJumlahWifi || watchJumlahWifi === 0)) {
                    setValue('jumlah_wifi', 1);
                  } else if (!checked) {
                    setValue('jumlah_wifi', 0);
                  }
                }}
              />
            </div>

            <Input
              label="Jumlah Titik Akses (AP)"
              type="number"
              min={0}
              placeholder="0"
              disabled={!watchAdaWifi}
              error={errors.jumlah_wifi?.message}
              value={watchJumlahWifi}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setValue('jumlah_wifi', val);
                if (val > 0 && !watchAdaWifi) setValue('ada_wifi', true);
                if (val === 0 && watchAdaWifi) setValue('ada_wifi', false);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── FORM ACTIONS (Batal & Simpan) ─────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          icon={<Save size={16} />}
        >
          {isEdit ? 'Simpan Perubahan Ruangan' : 'Simpan Ruangan Baru'}
        </Button>
      </div>
    </form>
  );
}
