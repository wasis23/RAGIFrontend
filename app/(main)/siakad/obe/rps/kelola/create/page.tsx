'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { ArrowLeft } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const DOSEN_BISA_EDIT_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Ya' },
  { value: 'false', label: 'Tidak' },
];

const JENIS_PEMBELAJARAN_OPTIONS: SelectOption[] = [
  { value: 'Kuliah / Responsi', label: 'Kuliah / Responsi' },
  { value: 'Seminar / Diskusi Kelompok', label: 'Seminar / Diskusi Kelompok' },
  { value: 'Praktikum / Praktik Studio', label: 'Praktikum / Praktik Studio' },
  { value: 'Praktik Lapangan / Magang', label: 'Praktik Lapangan / Magang' },
  { value: 'Penelitian & Proyek Mandiri', label: 'Penelitian & Proyek Mandiri' },
  { value: 'Pembelajaran Daring / E-Learning', label: 'Pembelajaran Daring / E-Learning' },
  { value: 'Blended / Hybrid Learning', label: 'Blended / Hybrid Learning' },
];

const rpsCreateSchema = z.object({
  mata_kuliah_id: z.number({ error: 'Mata Kuliah wajib dipilih' }).min(1, 'Mata Kuliah wajib dipilih'),
  kode_rps: z.string().trim().min(1, 'Kode RPS wajib diisi').max(100, 'Kode RPS maksimal 100 karakter'),
  tanggal_penyusunan: z.string().min(1, 'Tanggal Penyusunan wajib diisi'),
  semester_rps: z.number({ error: 'Semester RPS wajib diisi' }).min(1, 'Semester minimal 1').max(14, 'Semester maksimal 14'),
  dosen_bisa_edit: z.boolean(),
  deskripsi_singkat: z.string().trim().optional(),
  bahan_kajian_mk: z.string().trim().optional(),
  mata_kuliah_syarat: z.string().trim().optional(),
  jenis_pembelajaran: z.string().optional(),
  dosen_pengembang_id: z.number().nullable().optional(),
  dosen_anggota_ids: z.array(z.number()).optional(),
  koordinator_rmk_id: z.number().nullable().optional(),
  kaprodi_id: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof rpsCreateSchema>;

export default function CreateRpsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramMkId = searchParams.get('mata_kuliah_id');

  const [saving, setSaving] = useState(false);
  const [selectedMk, setSelectedMk] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(rpsCreateSchema),
    defaultValues: {
      mata_kuliah_id: paramMkId ? Number(paramMkId) : 0,
      kode_rps: '',
      tanggal_penyusunan: new Date().toISOString().split('T')[0],
      semester_rps: 1,
      dosen_bisa_edit: true,
      deskripsi_singkat: '',
      bahan_kajian_mk: '',
      mata_kuliah_syarat: '-',
      jenis_pembelajaran: 'Kuliah / Responsi',
      dosen_pengembang_id: null,
      dosen_anggota_ids: [],
      koordinator_rmk_id: null,
      kaprodi_id: null,
    },
  });

  useEffect(() => {
    if (paramMkId) {
      const initMk = async () => {
        try {
          const res = await siakadService.getMataKuliahs({ per_page: 200 });
          const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
          const found = list.find((m: any) => Number(m.id) === Number(paramMkId));
          if (found) {
            onMataKuliahChange({ value: found.id, label: `${found.kode_mk} - ${found.nama}`, raw: found });
          }
        } catch {}
      };
      initMk();
    }
  }, [paramMkId]);

  const loadMataKuliahOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getMataKuliahs({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((m: any) => ({
        value: m.id,
        label: `${m.kode_mk} - ${m.nama}${m.total_sks ? ` (${m.total_sks} SKS)` : ''}`,
        raw: m,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadDosenOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((d: any) => ({
        value: d.id,
        label: `${d.nama || d.nama_lengkap || d.name}${d.nidn ? ` (${d.nidn})` : ''}`,
        raw: d,
      }));
    } catch {
      return [];
    }
  }, []);

  const onMataKuliahChange = async (opt: any) => {
    const mk = opt?.raw || null;
    setSelectedMk(mk);
    const mkId = Number(opt?.value) || 0;
    setValue('mata_kuliah_id', mkId);

    if (mk) {
      // Auto-generate saran kode RPS
      const kodeMk = mk.kode_mk || 'MK';
      const year = new Date().getFullYear();
      setValue('kode_rps', `RPS-${kodeMk}-${year}`);
      setValue('semester_rps', Number(mk.semester_anjuran) || 1);

      // Auto-fill deskripsi singkat jika ada di relasi MK
      if (mk.deskripsi) {
        setValue('deskripsi_singkat', mk.deskripsi);
      }

      // Otomatis tarik Mata Kuliah Syarat dari master prasyarat mata kuliah
      try {
        const resPrasyarat = await siakadService.getPrasyaratMks({ mata_kuliah_id: mkId });
        const listPrasyarat = Array.isArray(resPrasyarat?.data) ? resPrasyarat.data : (resPrasyarat?.data?.items || []);
        if (listPrasyarat.length > 0) {
          const syaratsFormatted = listPrasyarat
            .map((p: any) => {
              const pMk = p.prasyarat || p.mata_kuliah_prasyarat;
              return pMk ? `${pMk.nama}(${pMk.kode_mk})` : null;
            })
            .filter(Boolean)
            .join(', ');
          setValue('mata_kuliah_syarat', syaratsFormatted || '-');
        } else {
          setValue('mata_kuliah_syarat', '-');
        }
      } catch {
        setValue('mata_kuliah_syarat', '-');
      }

      // Otomatis tarik Bahan Kajian MK jika mata kuliah sudah dipetakan ke Bahan Kajian
      try {
        const resBk = await siakadService.getBahanKajians({ mata_kuliah_id: mkId, per_page: 50 });
        const listBk = Array.isArray(resBk?.data) ? resBk.data : (resBk?.data?.items || []);
        if (listBk.length > 0) {
          const bksFormatted = listBk.map((b: any) => `${b.kode_bk} - ${b.nama_bk}`).join('\n');
          setValue('bahan_kajian_mk', bksFormatted);
        }
      } catch {}

      // Otomatis ambil Dosen Koordinator & Anggota dari Distribusi Mata Kuliah
      try {
        const resDistribusi = await siakadService.getDistribusiMengajarList({ mata_kuliah_id: mkId, per_page: 1 });
        const listDist = resDistribusi?.data || [];
        const dist = Array.isArray(listDist) ? listDist[0] : null;

        if (dist) {
          if (dist.dosen_koordinator_id) {
            setValue('koordinator_rmk_id', dist.dosen_koordinator_id);
          }
          const anggotaIds = Array.isArray(dist.dosen_anggota_ids) ? dist.dosen_anggota_ids.map(Number).filter(Boolean) : [];
          setValue('dosen_anggota_ids', anggotaIds);
        }
      } catch {}

      // Otomatis isi Kaprodi jika prodi memiliki kaprodi terdaftar
      const prodiKaprodiId = mk?.kurikulum?.program_studi?.kaprodi_id;
      if (prodiKaprodiId) {
        setValue('kaprodi_id', Number(prodiKaprodiId));
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await siakadService.storeRps({
        mata_kuliah_id: values.mata_kuliah_id,
        kode_rps: values.kode_rps,
        tanggal_penyusunan: values.tanggal_penyusunan,
        semester: values.semester_rps,
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        dosen_bisa_edit: values.dosen_bisa_edit,
        deskripsi_singkat: values.deskripsi_singkat?.trim() || `RPS untuk mata kuliah ${selectedMk?.nama || ''}`,
        bahan_kajian_mk: values.bahan_kajian_mk?.trim() || undefined,
        mata_kuliah_syarat: values.mata_kuliah_syarat?.trim() || '-',
        jenis_pembelajaran: values.jenis_pembelajaran || 'Kuliah / Responsi',
        dosen_anggota_ids: values.dosen_anggota_ids || [],
        dosen_pengembang_id: values.dosen_pengembang_id || values.dosen_anggota_ids?.[0] || undefined,
        koordinator_rmk_id: values.koordinator_rmk_id || undefined,
        kaprodi_id: values.kaprodi_id || undefined,
      });
      toast.success('Dokumen RPS baru berhasil dibuat');
      router.push('/siakad/obe/rps/kelola');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan dokumen RPS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Buat Dokumen RPS"
        description="Penyusunan header, deskripsi, bahan kajian, dan pengesahan Rencana Pembelajaran Semester (RPS) mata kuliah."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS', href: '/siakad/obe/rps/kelola' },
          { label: 'Buat RPS' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/obe/rps/kelola')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Section 1: Detail RPS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Detail RPS</h3>
            </div>

            {/* Baris 1: Mata Kuliah Selector & Info Terisi Otomatis */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <Controller
                  name="mata_kuliah_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Pilih Mata Kuliah *"
                      placeholder="Cari mata kuliah..."
                      loadOptions={loadMataKuliahOptions}
                      value={field.value || null}
                      onChange={onMataKuliahChange}
                      error={errors.mata_kuliah_id?.message}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Kode"
                  value={selectedMk?.kode_mk || '-'}
                  disabled
                  readOnly
                  className="bg-slate-50 font-mono font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Rumpun"
                  value={selectedMk?.rumpun_mata_kuliah?.nama_rumpun || selectedMk?.rumpun || '-'}
                  disabled
                  readOnly
                  className="bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Bobot"
                  value={selectedMk ? `T = ${selectedMk.sks_teori || selectedMk.total_sks || 0}${selectedMk.sks_praktik ? ` P = ${selectedMk.sks_praktik}` : ''}` : '-'}
                  disabled
                  readOnly
                  className="bg-slate-50 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Semester Mengajar"
                  value={selectedMk?.semester_anjuran ? String(selectedMk.semester_anjuran) : '-'}
                  disabled
                  readOnly
                  className="bg-slate-50 text-center font-bold"
                />
              </div>
            </div>

            {/* Baris 2: Input Spesifik RPS sesuai gambar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-4">
                <Input
                  label="Kode RPS *"
                  placeholder="Contoh: RPS--PM-IK-1-1-2026"
                  error={errors.kode_rps?.message}
                  {...register('kode_rps')}
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  type="date"
                  label="Tanggal Penyusunan *"
                  error={errors.tanggal_penyusunan?.message}
                  {...register('tanggal_penyusunan')}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  type="number"
                  label="Semester RPS *"
                  min={1}
                  max={14}
                  error={errors.semester_rps?.message}
                  {...register('semester_rps', { valueAsNumber: true })}
                />
              </div>

              <div className="md:col-span-3">
                <Controller
                  name="dosen_bisa_edit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Dosen Bisa Edit RPS? *"
                      options={DOSEN_BISA_EDIT_OPTIONS}
                      value={field.value ? 'true' : 'false'}
                      onChange={(opt: any) => field.onChange(opt?.value === 'true' || opt === 'true')}
                      error={errors.dosen_bisa_edit?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Baris 3: Deskripsi Singkat MK & Bahan Kajian MK */}
            <div className="space-y-4 pt-2">
              <Textarea
                label="Deskripsi Singkat MK"
                rows={3}
                placeholder="Tuliskan ringkasan deskripsi cakupan materi mata kuliah..."
                error={errors.deskripsi_singkat?.message}
                {...register('deskripsi_singkat')}
              />

              <Textarea
                label="Bahan Kajian MK"
                rows={3}
                placeholder="Tuliskan pokok-pokok bahasan dan bahan kajian mata kuliah..."
                error={errors.bahan_kajian_mk?.message}
                {...register('bahan_kajian_mk')}
              />
            </div>

            {/* Baris 4: Mata Kuliah Syarat & Jenis Pembelajaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Input
                  label="Mata Kuliah Syarat"
                  placeholder="Nama Mata Kuliah(kode) atau -"
                  hint="jika tidak ada mata kuliah syarat maka isi dengan - | jika ada mata kuliah syarat maka isi dengan Nama Mata Kuliah(kode)"
                  error={errors.mata_kuliah_syarat?.message}
                  {...register('mata_kuliah_syarat')}
                />
              </div>

              <div>
                <Controller
                  name="jenis_pembelajaran"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Jenis Pembelajaran"
                      placeholder="Pilih Jenis Pembelajaran"
                      options={JENIS_PEMBELAJARAN_OPTIONS}
                      value={field.value || 'Kuliah / Responsi'}
                      onChange={(opt: any) => field.onChange(opt?.value || opt)}
                      error={errors.jenis_pembelajaran?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pengesahan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Pengesahan</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Controller
                  name="dosen_pengembang_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Dosen Pengembang"
                      placeholder="Pilih Dosen Pengembang..."
                      loadOptions={loadDosenOptions}
                      value={field.value || null}
                      onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                      isClearable
                    />
                  )}
                />
              </div>

              <div className="md:col-span-1">
                <Controller
                  name="koordinator_rmk_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Koordinator RMK"
                      placeholder="Pilih Koordinator RMK..."
                      loadOptions={loadDosenOptions}
                      value={field.value || null}
                      onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                      isClearable
                    />
                  )}
                />
              </div>

              <div className="md:col-span-1">
                <Controller
                  name="kaprodi_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Ka Prodi"
                      placeholder="Pilih Ketua Program Studi..."
                      loadOptions={loadDosenOptions}
                      value={field.value || null}
                      onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                      isClearable
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push('/siakad/obe/rps/kelola')}
              disabled={saving}
            >
              Kembali
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={saving}
            >
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
