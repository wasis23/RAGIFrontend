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
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Card, CardBody } from '@/components/ui/Card';
import { ArrowLeft, FileText, Layers, BookOpen, Users } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import {
  DOSEN_BISA_EDIT_OPTIONS,
  JENIS_PEMBELAJARAN_OPTIONS,
  RpsMkBanner,
} from '@/components/siakad/RpsFormShared';
import toast from 'react-hot-toast';

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

  const onMataKuliahChange = useCallback(async (opt: any) => {
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

      // Otomatis tarik Dosen Anggota & Koordinator RMK dari Distribusi Mata Kuliah
      try {
        const resDistribusi = await siakadService.getDistribusiMengajarList({ mata_kuliah_id: mkId, per_page: 1 });
        const listDist = resDistribusi?.data || [];
        const dist = Array.isArray(listDist) ? listDist[0] : null;

        if (dist && Array.isArray(dist.dosen_anggota_ids)) {
          const anggotaIds = dist.dosen_anggota_ids.map(Number).filter(Boolean);
          setValue('dosen_anggota_ids', anggotaIds);
        } else {
          setValue('dosen_anggota_ids', []);
        }

        if (dist?.dosen_koordinator_id) {
          setValue('koordinator_rmk_id', Number(dist.dosen_koordinator_id));
        }
      } catch {
        setValue('dosen_anggota_ids', []);
      }

      // Ka Prodi = Ketua Program Studi pada prodi kurikulum mata kuliah
      const prodiKaprodiId = mk?.kurikulum?.program_studi?.kaprodi_id || mk?.kurikulum?.programStudi?.kaprodi_id;
      if (prodiKaprodiId) {
        setValue('kaprodi_id', Number(prodiKaprodiId));
      }
    }
  }, [setValue]);

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
  }, [paramMkId, onMataKuliahChange]);

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
    <div className="space-y-4 animate-fade-in">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: 3/4 (lg:col-span-8) - Form Input Utama */}
        <div className="lg:col-span-8">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardBody className="space-y-6">
                {/* Section 1: Pemilihan Mata Kuliah */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <BookOpen size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Mata Kuliah Pemilik RPS</h3>
                      <p className="text-2xs text-slate-500">Pilih mata kuliah yang akan dibuatkan dokumen silabus RPS.</p>
                    </div>
                  </div>

                  <Controller
                    name="mata_kuliah_id"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Pilih Mata Kuliah *"
                        placeholder="Cari nama atau kode mata kuliah..."
                        loadOptions={loadMataKuliahOptions}
                        value={field.value || null}
                        onChange={onMataKuliahChange}
                        error={errors.mata_kuliah_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Section 2: Detail Dokumen RPS */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <FileText size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Detail Dokumen RPS</h3>
                      <p className="text-2xs text-slate-500">Kode dokumen, tanggal penyusunan, semester, dan izin edit dosen.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      label="Kode RPS *"
                      placeholder="Contoh: RPS--PM-IK-1-1-2026"
                      error={errors.kode_rps?.message}
                      {...register('kode_rps')}
                    />
                    <Input
                      type="date"
                      label="Tanggal Penyusunan *"
                      error={errors.tanggal_penyusunan?.message}
                      {...register('tanggal_penyusunan')}
                    />
                    <Input
                      type="number"
                      label="Semester RPS *"
                      min={1}
                      max={14}
                      error={errors.semester_rps?.message}
                      {...register('semester_rps', { valueAsNumber: true })}
                    />
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

                {/* Section 3: Prasyarat & Metode Pembelajaran */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <Layers size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Prasyarat & Metode</h3>
                      <p className="text-2xs text-slate-500">Mata kuliah syarat dan jenis metode pembelajaran yang digunakan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mata Kuliah Syarat"
                      placeholder="Nama Mata Kuliah(kode) atau -"
                      hint="Jika tidak ada mata kuliah syarat maka isi dengan -"
                      error={errors.mata_kuliah_syarat?.message}
                      {...register('mata_kuliah_syarat')}
                    />
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

                {/* Section 4: Deskripsi & Pokok Bahasan */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <BookOpen size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Deskripsi & Pokok Bahasan</h3>
                      <p className="text-2xs text-slate-500">Ringkasan materi perkuliahan dan pokok-pokok bahan kajian mata kuliah.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                </div>

                {/* Section 5: Pengesahan Tim Pengajar & Pimpinan */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <Users size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Pengesahan</h3>
                      <p className="text-2xs text-slate-500">Dosen anggota tim penyusun, koordinator RMK, dan ketua program studi.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Controller
                      name="dosen_anggota_ids"
                      control={control}
                      render={({ field }) => (
                        <AsyncSelect
                          label="Dosen Anggota"
                          placeholder="Cari NIDN / nama..."
                          loadOptions={loadDosenOptions}
                          defaultOptions={true}
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
                    <Controller
                      name="koordinator_rmk_id"
                      control={control}
                      render={({ field }) => (
                        <AsyncSelect
                          label="Koordinator RMK"
                          placeholder="Pilih Koordinator..."
                          loadOptions={loadDosenOptions}
                          value={field.value || null}
                          onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                          isClearable
                          error={errors.koordinator_rmk_id?.message}
                        />
                      )}
                    />
                    <Controller
                      name="kaprodi_id"
                      control={control}
                      render={({ field }) => (
                        <AsyncSelect
                          label="Ka Prodi"
                          placeholder="Pilih Ka Prodi..."
                          loadOptions={loadDosenOptions}
                          value={field.value || null}
                          onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                          isClearable
                          error={errors.kaprodi_id?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Footer Tombol Simpan selalu di kanan */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => router.push('/siakad/obe/rps/kelola')}
                    disabled={saving}
                  >
                    Batal
                  </Button>
                  <Button variant="primary" type="submit" isLoading={saving}>
                    Simpan
                  </Button>
                </div>
              </CardBody>
            </form>
          </Card>
        </div>

        {/* Kolom Kanan: 1/4 (lg:col-span-4) - Informasi Read-Only Sticky */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900">Identitas Mata Kuliah</h3>
                <span className="text-2xs text-slate-400 font-medium">Otomatis Terisi</span>
              </div>
              <RpsMkBanner mk={selectedMk} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
