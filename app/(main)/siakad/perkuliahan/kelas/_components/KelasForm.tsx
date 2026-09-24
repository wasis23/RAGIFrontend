'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, BookOpen, Users, MapPin, CalendarDays, Snowflake, Projector, Wifi } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const kelasSchema = z.object({
  mata_kuliah_id: z.number({ error: 'Mata kuliah wajib dipilih' }).min(1, 'Mata kuliah wajib dipilih'),
  tahun_akademik_id: z.number({ error: 'Periode akademik wajib dipilih' }).min(1, 'Periode akademik wajib dipilih'),
  program_studi_id: z.number({ error: 'Program studi wajib dipilih' }).min(1, 'Program studi wajib dipilih'),
  ruangan_id: z.number({ error: 'Ruangan wajib dipilih' }).min(1, 'Ruangan wajib dipilih'),
  dosen_id: z.number({ error: 'Dosen pengampu wajib dipilih' }).min(1, 'Dosen pengampu wajib dipilih'),
  team_teaching_dosen_ids: z.array(z.number()).optional(),
  kode_kelas: z.string().min(2, 'Kode kelas minimal 2 karakter').max(50, 'Kode kelas maksimal 50 karakter'),
  nama_kelas: z.string().min(3, 'Nama kelas minimal 3 karakter').max(150, 'Nama kelas maksimal 150 karakter'),
  kapasitas: z.number({ error: 'Kapasitas wajib diisi' }).min(1, 'Kapasitas minimal 1 kursi'),
  kuota_krs: z.number({ error: 'Kuota KRS wajib diisi' }).min(1, 'Kuota minimal 1 mahasiswa'),
  hari: z.string().min(1, 'Hari wajib dipilih'),
  jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
  jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
});

export type KelasFormValues = z.infer<typeof kelasSchema>;

export interface KelasFormInitial {
  mata_kuliah_id: number;
  tahun_akademik_id: number;
  program_studi_id: number;
  ruangan_id: number;
  dosen_id: number;
  team_teaching_dosen_ids: number[];
  kode_kelas: string;
  nama_kelas: string;
  kapasitas: number;
  kuota_krs: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
}

function SectionTitle({ step, title, description, icon }: { step: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-extrabold text-slate-900">
          <span style={{ color: 'var(--module-primary)' }}>{step}.</span> {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export interface KelasFormProps {
  mode: 'create' | 'edit';
  kelasId?: number;
  initialValues?: Partial<KelasFormInitial> | null;
  loadingInitial?: boolean;
  title: string;
  description: string;
  breadcrumbLabel: string;
  submitLabel: string;
}

export default function KelasForm({
  mode,
  kelasId,
  initialValues,
  loadingInitial = false,
  title,
  description,
  breadcrumbLabel,
  submitLabel,
}: KelasFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KelasFormValues>({
    resolver: zodResolver(kelasSchema),
    defaultValues: {
      mata_kuliah_id: 0,
      tahun_akademik_id: 0,
      program_studi_id: 0,
      ruangan_id: 0,
      dosen_id: 0,
      team_teaching_dosen_ids: [],
      kode_kelas: '',
      nama_kelas: '',
      kapasitas: 40,
      kuota_krs: 40,
      hari: 'senin',
      jam_mulai: '08:00',
      jam_selesai: '10:30',
    },
  });

  const programStudiId = watch('program_studi_id');
  const mataKuliahId = watch('mata_kuliah_id');
  const dosenId = watch('dosen_id');
  const tahunAkademikId = watch('tahun_akademik_id');
  const hariOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.HARI_KULIAH);

  useEffect(() => {
    const init = async () => {
      try {
        const [mRes, dRes, pRes, rRes, kRes, taRes] = await Promise.all([
          siakadService.getMataKuliahs({ per_page: 300 }),
          siakadService.getDosens({ per_page: 300 }),
          siakadService.getProdi(),
          siakadService.getRefRuangan(),
          siakadService.getKelas({}),
          siakadService.getTahunAkademiks(),
        ]);

        const prodis: any[] = pRes.data || [];
        const mks: any[] = mRes.data || [];
        const dosens: any[] = dRes.data || [];
        const ruangans: any[] = rRes.data || [];
        const opened: any[] = kRes.data || [];
        const periods: any[] = taRes.data || [];

        const activePeriod = periods.find((t) => t.is_active) || periods[0];
        const defaultProdiId = prodis[0]?.id || 0;
        const openedMkIds: number[] = opened
          .filter((k: any) => (mode === 'edit' ? k.id !== kelasId : true))
          .map((k: any) => k.mata_kuliah_id);
        const availableMks = mks.filter(
          (m: any) =>
            (!m.kurikulum?.program_studi_id || m.kurikulum?.program_studi_id === defaultProdiId) &&
            !openedMkIds.includes(m.id)
        );
        const defaultMk = availableMks[0] || mks[0];
        const defaultDosen = dosens[0];
        const defaultRoom = ruangans[0];

        try {
          sessionStorage.setItem('siakad-ref-prodi', JSON.stringify(prodis));
          sessionStorage.setItem('siakad-ref-mk', JSON.stringify(mks));
          sessionStorage.setItem('siakad-ref-dosen', JSON.stringify(dosens));
          sessionStorage.setItem('siakad-ref-ruangan', JSON.stringify(ruangans));
          sessionStorage.setItem('siakad-ref-opened-mk-ids', JSON.stringify(openedMkIds));
        } catch {}

        // Mode edit: nilai awal diisi dari data kelas oleh parent via initialValues
        if (mode === 'create') {
          reset({
            mata_kuliah_id: defaultMk?.id || 0,
            tahun_akademik_id: activePeriod?.id || 0,
            program_studi_id: defaultProdiId,
            ruangan_id: defaultRoom?.id || 0,
            dosen_id: defaultDosen?.id || 0,
            team_teaching_dosen_ids: [],
            kode_kelas: defaultMk ? `${defaultMk.kode_mk}-A` : '',
            nama_kelas: defaultMk ? `${defaultMk.nama} (Kelas A)` : '',
            kapasitas: defaultRoom?.kapasitas || 40,
            kuota_krs: defaultRoom?.kapasitas || 40,
            hari: 'senin',
            jam_mulai: '08:00',
            jam_selesai: '10:30',
          });
        }
      } catch {
        toast.error('Gagal memuat opsi referensi kelas');
      }
    };
    init();
  }, [reset, mode, kelasId]);

  // Terapkan nilai awal mode edit setelah referensi siap
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        mata_kuliah_id: initialValues.mata_kuliah_id || 0,
        tahun_akademik_id: initialValues.tahun_akademik_id || 0,
        program_studi_id: initialValues.program_studi_id || 0,
        ruangan_id: initialValues.ruangan_id || 0,
        dosen_id: initialValues.dosen_id || 0,
        team_teaching_dosen_ids: initialValues.team_teaching_dosen_ids || [],
        kode_kelas: initialValues.kode_kelas || '',
        nama_kelas: initialValues.nama_kelas || '',
        kapasitas: initialValues.kapasitas || 40,
        kuota_krs: initialValues.kuota_krs || 40,
        hari: initialValues.hari || 'senin',
        jam_mulai: initialValues.jam_mulai || '08:00',
        jam_selesai: initialValues.jam_selesai || '10:30',
      });
    }
  }, [mode, initialValues, reset]);

  const refCache = useMemo(() => {
    const read = (key: string) => {
      try {
        return JSON.parse(sessionStorage.getItem(key) || '[]');
      } catch {
        return [];
      }
    };
    if (typeof window === 'undefined') return { prodis: [], mks: [], dosens: [], ruangans: [], openedMkIds: [] };
    return {
      prodis: read('siakad-ref-prodi'),
      mks: read('siakad-ref-mk'),
      dosens: read('siakad-ref-dosen'),
      ruangans: read('siakad-ref-ruangan'),
      openedMkIds: read('siakad-ref-opened-mk-ids') as number[],
    };
  }, [programStudiId, mataKuliahId, dosenId, tahunAkademikId]);

  const prodiOptions = useMemo(
    () =>
      (refCache.prodis as any[]).map((p: any) => ({
        value: p.id,
        label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
      })),
    [refCache]
  );

  const mkOptions = useMemo(() => {
    const openedIds = new Set((refCache.openedMkIds as number[]) || []);
    return (refCache.mks as any[])
      .filter((mk: any) => {
        const matchProdi =
          !mk.kurikulum?.program_studi_id || mk.kurikulum?.program_studi_id === programStudiId;
        return matchProdi && !openedIds.has(mk.id);
      })
      .map((mk: any) => ({
        value: mk.id,
        label: `${mk.kode_mk} — ${mk.nama} (${mk.total_sks} SKS • Smtr ${mk.semester_anjuran ?? '-'})`,
        raw: mk,
      }));
  }, [refCache, programStudiId]);

  const loadDosenOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({ per_page: 50, search: keyword || undefined });
      const list: any[] = res.data || refCache.dosens;
      const q = keyword.toLowerCase();
      return list
        .filter((d: any) =>
          !keyword
            ? true
            : d.nama_lengkap?.toLowerCase().includes(q) || d.nidn?.includes(keyword)
        )
        .map((d: any) => ({
          value: d.id,
          label: `${d.nama_lengkap} — NIDN ${d.nidn || '-'}`,
          sublabel: d.program_studi?.nama || '',
          raw: d,
        }));
    } catch {
      return [];
    }
  };

  const loadRuanganOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getRefRuangan({ search: keyword || undefined });
      const list: any[] = res.data || refCache.ruangans;
      const q = keyword.toLowerCase();
      return list
        .filter((r: any) =>
          !keyword
            ? true
            : r.nama?.toLowerCase().includes(q) ||
              r.kode?.toLowerCase().includes(q) ||
              r.gedung?.nama?.toLowerCase().includes(q)
        )
        .map((r: any) => ({
          value: r.id,
          label: `${r.nama} (${r.kode}) — ${r.gedung?.nama || ''} • ${r.kapasitas} kursi`,
          raw: r,
        }));
    } catch {
      return [];
    }
  };

  const teamTeachingOptions = useMemo(() => {
    return (refCache.dosens as any[])
      .filter((d: any) => d.id !== dosenId)
      .map((d: any) => ({
        value: d.id,
        label: `${d.nama_lengkap} (NIDN ${d.nidn || '-'})`,
      }));
  }, [refCache, dosenId]);

  const handleProdiChange = (val: any) => {
    const prodiId = Number(val);
    setValue('program_studi_id', prodiId, { shouldValidate: true });
    const openedIds = new Set((refCache.openedMkIds as number[]) || []);
    const firstMk = (refCache.mks as any[]).find(
      (m: any) =>
        (!m.kurikulum?.program_studi_id || m.kurikulum?.program_studi_id === prodiId) &&
        !openedIds.has(m.id)
    );
    if (firstMk) {
      setValue('mata_kuliah_id', firstMk.id, { shouldValidate: true });
      setValue('kode_kelas', `${firstMk.kode_mk}-A`, { shouldValidate: true });
      setValue('nama_kelas', `${firstMk.nama} (Kelas A)`, { shouldValidate: true });
    }
  };

  const handleMkChange = (val: any) => {
    const mkId = Number(val);
    setValue('mata_kuliah_id', mkId, { shouldValidate: true });
    const selected = (refCache.mks as any[]).find((m: any) => m.id === mkId);
    if (selected) {
      setValue('kode_kelas', `${selected.kode_mk}-A`, { shouldValidate: true });
      setValue('nama_kelas', `${selected.nama} (Kelas A)`, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: KelasFormValues) => {
    try {
      if (mode === 'edit' && kelasId) {
        await siakadService.updateKelas(kelasId, {
          nama_kelas: values.nama_kelas,
          ruangan_id: values.ruangan_id,
          dosen_id: values.dosen_id,
          team_teaching_dosen_ids: values.team_teaching_dosen_ids || [],
          kapasitas: values.kapasitas,
          kuota_krs: values.kuota_krs,
          hari: values.hari,
          jam_mulai: values.jam_mulai,
          jam_selesai: values.jam_selesai,
        });
        toast.success('Kelas perkuliahan berhasil diperbarui');
      } else {
        await siakadService.createKelas({
          ...values,
          team_teaching_dosen_ids: values.team_teaching_dosen_ids || [],
        });
        toast.success('Kelas perkuliahan baru berhasil dibuka');
      }
      router.push('/siakad/perkuliahan/kelas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || (mode === 'edit' ? 'Gagal memperbarui kelas' : 'Gagal membuka kelas baru'));
    }
  };

  const isEdit = mode === 'edit';

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <span className="text-xs font-bold animate-pulse">Memuat data kelas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Jadwal Kelas', href: '/siakad/perkuliahan/kelas' },
          { label: breadcrumbLabel },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/perkuliahan/kelas')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <SectionTitle
                  step="0"
                  title="Periode Akademik Aktif"
                  description="Kelas dibuka dan terikat pada satu periode semester."
                  icon={<CalendarDays size={16} />}
                />
              </div>
              <Controller
                name="tahun_akademik_id"
                control={control}
                render={({ field }) => (
                  <PeriodeSelector
                    value={field.value || null}
                    onChange={(id) => field.onChange(id)}
                    required
                    isDisabled={isEdit}
                    hint={isEdit ? 'Periode terkunci mengikuti kelas yang dibuka' : undefined}
                    error={errors.tahun_akademik_id?.message}
                  />
                )}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <SectionTitle
              step="1"
              title="Identitas Mata Kuliah & Program Studi"
              description="Pilih program studi, lalu mata kuliah yang belum dibuka pada periode ini."
              icon={<BookOpen size={16} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Controller
                name="program_studi_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Program Studi"
                    required
                    placeholder="Pilih program studi..."
                    options={prodiOptions}
                    value={field.value || ''}
                    onChange={handleProdiChange}
                    isDisabled={isEdit}
                    error={errors.program_studi_id?.message}
                  />
                )}
              />

              <div className="md:col-span-2">
                <Controller
                  name="mata_kuliah_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Mata Kuliah Ditawarkan"
                      required
                      placeholder="Cari kode / nama mata kuliah..."
                      options={mkOptions}
                      value={field.value || ''}
                      onChange={handleMkChange}
                      isDisabled={isEdit}
                      error={errors.mata_kuliah_id?.message}
                      hint={isEdit ? 'Mata kuliah terkunci mengikuti kelas yang dibuka' : 'Hanya menampilkan MK yang belum dibuka kelasnya'}
                    />
                  )}
                />
              </div>

              <Input
                label="Kode Kelas Internal"
                required
                placeholder="cth. IF101-A"
                disabled={isEdit}
                error={errors.kode_kelas?.message}
                {...register('kode_kelas')}
              />

              <div className="md:col-span-2">
                <Input
                  label="Nama Kelas Lengkap"
                  required
                  placeholder="cth. Algoritma & Pemrograman (Kelas A)"
                  error={errors.nama_kelas?.message}
                  {...register('nama_kelas')}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <SectionTitle
              step="2"
              title="Dosen Pengampu & Team Teaching"
              description="Dosen utama tercatat sebagai penanggung jawab dan pelapor Feeder."
              icon={<Users size={16} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="dosen_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Dosen Pengampu Utama"
                    required
                    placeholder="Cari nama / NIDN dosen..."
                    loadOptions={loadDosenOptions}
                    value={field.value || null}
                    onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : 0)}
                    error={errors.dosen_id?.message}
                    formatOptionLabel={(opt: any) => (
                      <div>
                        <span className="block font-semibold">{opt.raw?.nama_lengkap || opt.label}</span>
                        <span className="block text-xs text-slate-500">
                          NIDN {opt.raw?.nidn || '-'} • {opt.raw?.program_studi?.nama || ''}
                        </span>
                      </div>
                    )}
                  />
                )}
              />

              <Controller
                name="team_teaching_dosen_ids"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Team Teaching"
                    placeholder="Pilih dosen pendamping..."
                    options={teamTeachingOptions}
                    value={field.value || []}
                    onChange={(vals: any) => field.onChange((vals || []).map(Number))}
                    isMulti
                    hint={`${(field.value || []).length} dosen pendamping dipilih`}
                  />
                )}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <SectionTitle
              step="3"
              title="Ruangan, Jadwal & Kuota"
              description="Alokasi sarana SINAPRA, jadwal tatap muka, dan kapasitas peserta."
              icon={<MapPin size={16} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <Controller
                  name="ruangan_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Ruangan Perkuliahan"
                      required
                      placeholder="Cari ruang / gedung / kode..."
                      loadOptions={loadRuanganOptions}
                      value={field.value || null}
                      onChange={(opt: any) => {
                        const id = opt?.value ? Number(opt.value) : 0;
                        field.onChange(id);
                        const room = opt?.raw;
                        if (room?.kapasitas) {
                          setValue('kapasitas', room.kapasitas, { shouldValidate: true });
                          setValue('kuota_krs', room.kapasitas, { shouldValidate: true });
                        }
                      }}
                      error={errors.ruangan_id?.message}
                      formatOptionLabel={(opt: any) => (
                        <div>
                          <span className="flex items-center gap-2 font-semibold">
                            {opt.raw?.nama || opt.label}
                            {opt.raw?.kode && <Badge variant="gray">{opt.raw.kode}</Badge>}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>
                              {opt.raw?.gedung?.nama || ''} • Lt. {opt.raw?.lantai ?? '-'} • {opt.raw?.kapasitas} kursi
                            </span>
                            {opt.raw?.ada_ac && (
                              <span className="inline-flex items-center gap-1 text-sky-600">
                                <Snowflake size={12} /> AC
                              </span>
                            )}
                            {opt.raw?.ada_proyektor && (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <Projector size={12} /> Proyektor
                              </span>
                            )}
                            {opt.raw?.ada_wifi && (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <Wifi size={12} /> WiFi
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    />
                  )}
                />
              </div>

              <Controller
                name="hari"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Hari Perkuliahan"
                    required
                    options={hariOptions}
                    value={field.value || ''}
                    onChange={(val: any) => field.onChange(val)}
                    error={errors.hari?.message}
                  />
                )}
              />

              <Input
                label="Jam Mulai"
                type="time"
                required
                error={errors.jam_mulai?.message}
                {...register('jam_mulai')}
              />
              <Input
                label="Jam Selesai"
                type="time"
                required
                error={errors.jam_selesai?.message}
                {...register('jam_selesai')}
              />
              <Input
                label="Kapasitas Ruang"
                type="number"
                min={1}
                required
                error={errors.kapasitas?.message}
                {...register('kapasitas', { valueAsNumber: true })}
              />
              <Input
                label="Kuota Maksimal KRS"
                type="number"
                min={1}
                required
                error={errors.kuota_krs?.message}
                {...register('kuota_krs', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => router.push('/siakad/perkuliahan/kelas')}>
                Batal
              </Button>
              <Button type="submit" variant="primary" icon={<Save size={16} />} loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : submitLabel}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
