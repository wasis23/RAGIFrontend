'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Plus, X } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const sesiSchema = z.object({
  minggu_ke_input: z
    .string()
    .trim()
    .min(1, 'Pertemuan ke wajib diisi (cth: 1 atau 1,2,3,4)'),
  jenis_pertemuan: z.string().trim().min(1, 'Jenis pertemuan wajib dipilih'),
  cpmk_filter_id: z.string().optional(),
  sub_cpmk_ids: z
    .array(z.number())
    .min(1, 'Pilih minimal satu Sub-CPMK tahapan belajar'),
  komponen_evaluasi_id: z.string().optional(),
  indikator_penilaian: z.string().trim().optional(),
  kriteria_penilaian_id: z.string().optional(),
  teknik_penilaian: z.string().trim().optional(),
  penugasan_mahasiswa: z.string().trim().optional(),
  materi_pembelajaran: z.string().trim().optional(),
  bobot_penilaian: z.number().min(0).max(100).optional(),
});

export type SesiFormValues = z.infer<typeof sesiSchema>;

type AktivitasItem = {
  id: string;
  bentuk: string;
  metode: string;
  waktu_menit: number;
};

interface SesiFormProps {
  rpsId: number;
  mataKuliahId?: number;
  initial?: any | null;
  defaultMingguKe?: number;
  submitLabel?: string;
}

export function SesiForm({
  rpsId,
  mataKuliahId,
  initial,
  defaultMingguKe = 1,
  submitLabel = 'Simpan Sesi',
}: SesiFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [cpmkList, setCpmkList] = useState<any[]>([]);
  const [subCpmkList, setSubCpmkList] = useState<any[]>([]);
  const [jenisOptions, setJenisOptions] = useState<{ value: string; label: string }[]>([]);
  const [komponenOptions, setKomponenOptions] = useState<{ value: string; label: string }[]>([]);
  const [kriteriaOptions, setKriteriaOptions] = useState<{ value: string; label: string }[]>([]);
  const [bentukOptions, setBentukOptions] = useState<{ value: string; label: string }[]>([]);
  const [metodeOptions, setMetodeOptions] = useState<{ value: string; label: string }[]>([]);

  // State Aktivitas Luring & Daring (dinamis per-baris)
  const [luringList, setLuringList] = useState<AktivitasItem[]>([]);
  const [daringList, setDaringList] = useState<AktivitasItem[]>([]);

  const initialSubIds: number[] = useMemo(() => {
    if (Array.isArray(initial?.sub_cpmk_ids) && initial.sub_cpmk_ids.length > 0) {
      return initial.sub_cpmk_ids.map(Number).filter(Boolean);
    }
    if (initial?.sub_cpmk_id) {
      return [Number(initial.sub_cpmk_id)];
    }
    return [];
  }, [initial]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SesiFormValues>({
    resolver: zodResolver(sesiSchema),
    defaultValues: {
      minggu_ke_input: initial?.minggu_ke ? String(initial.minggu_ke) : String(defaultMingguKe),
      jenis_pertemuan: initial?.jenis_pertemuan || '',
      cpmk_filter_id: '',
      sub_cpmk_ids: initialSubIds,
      komponen_evaluasi_id: initial?.komponen_evaluasi_id ? String(initial.komponen_evaluasi_id) : '',
      indikator_penilaian: initial?.indikator_penilaian || '',
      kriteria_penilaian_id: initial?.kriteria_penilaian_id ? String(initial.kriteria_penilaian_id) : '',
      teknik_penilaian: initial?.teknik_penilaian || initial?.kriteria_teknik || '',
      penugasan_mahasiswa: initial?.penugasan_mahasiswa || '',
      materi_pembelajaran: initial?.bahan_kajian || '',
      bobot_penilaian: initial?.bobot_penilaian !== undefined ? Number(initial.bobot_penilaian) : 3,
    },
  });

  const selectedCpmkFilter = watch('cpmk_filter_id');

  // Inisialisasi aktivitas Luring & Daring dari initial data
  useEffect(() => {
    if (Array.isArray(initial?.aktivitas_luring) && initial.aktivitas_luring.length > 0) {
      setLuringList(
        initial.aktivitas_luring.map((item: any, idx: number) => ({
          id: `luring_${idx}_${Date.now()}`,
          bentuk: item.bentuk || '',
          metode: item.metode || '',
          waktu_menit: Number(item.waktu_menit) || 50,
        }))
      );
    } else {
      setLuringList([{ id: 'luring_1', bentuk: '', metode: '', waktu_menit: 50 }]);
    }

    if (Array.isArray(initial?.aktivitas_daring) && initial.aktivitas_daring.length > 0) {
      setDaringList(
        initial.aktivitas_daring.map((item: any, idx: number) => ({
          id: `daring_${idx}_${Date.now()}`,
          bentuk: item.bentuk || '',
          metode: item.metode || '',
          waktu_menit: Number(item.waktu_menit) || 50,
        }))
      );
    } else {
      setDaringList([{ id: 'daring_1', bentuk: '', metode: '', waktu_menit: 50 }]);
    }
  }, [initial]);

  // Muat referensi RPS: jenis_pembelajaran, komponen, kriteria, bentuk, metode
  useEffect(() => {
    let active = true;
    const fetchReferences = async () => {
      try {
        const [jenisRes, kompRes, kritRes, btkRes, mtdRes] = await Promise.all([
          siakadService.getRpsReferensi({ tipe: 'jenis_pembelajaran', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'komponen', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'kriteria', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'bentuk', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'metode', per_page: 50 }),
        ]);
        if (!active) return;
        const jList: any[] = Array.isArray(jenisRes.data) ? jenisRes.data : [];
        const kList: any[] = Array.isArray(kompRes.data) ? kompRes.data : [];
        const rList: any[] = Array.isArray(kritRes.data) ? kritRes.data : [];
        const bList: any[] = Array.isArray(btkRes.data) ? btkRes.data : [];
        const mList: any[] = Array.isArray(mtdRes.data) ? mtdRes.data : [];

        setJenisOptions(jList.map((j: any) => ({ value: String(j.id ?? j.kode ?? j.nama), label: j.nama })));
        setKomponenOptions([
          { value: '', label: 'Pilih' },
          ...kList.map((k: any) => ({ value: String(k.id), label: `${k.kode ? `[${k.kode}] ` : ''}${k.nama}` })),
        ]);
        setKriteriaOptions([
          { value: '', label: 'Pilih' },
          ...rList.map((r: any) => ({ value: String(r.id), label: `${r.kode ? `[${r.kode}] ` : ''}${r.nama}` })),
        ]);
        setBentukOptions([
          { value: '', label: 'Pilih Bentuk Perkuliahan' },
          ...bList.map((b: any) => ({ value: String(b.id), label: `${b.kode ? `[${b.kode}] ` : ''}${b.nama}` })),
        ]);
        setMetodeOptions([
          { value: '', label: 'Pilih Metode Perkuliahan' },
          ...mList.map((m: any) => ({ value: String(m.id), label: `${m.kode ? `[${m.kode}] ` : ''}${m.nama}` })),
        ]);
      } catch {
        if (active) {
          setJenisOptions([]);
          setKomponenOptions([]);
          setKriteriaOptions([]);
          setBentukOptions([]);
          setMetodeOptions([]);
        }
      }
    };
    fetchReferences();
    return () => {
      active = false;
    };
  }, []);

  // Muat CPMK dan Sub-CPMK milik mata kuliah
  useEffect(() => {
    let active = true;
    const loadCpmkData = async () => {
      try {
        const [cpmkRes, subRes] = await Promise.all([
          siakadService.getCpmk(mataKuliahId ? { mata_kuliah_id: mataKuliahId } : undefined),
          siakadService.getSubCpmk(mataKuliahId ? { mata_kuliah_id: mataKuliahId } : undefined),
        ]);
        if (!active) return;
        const cpmks: any[] = Array.isArray(cpmkRes.data) ? cpmkRes.data : [];
        const subs: any[] = Array.isArray(subRes.data) ? subRes.data : [];
        setCpmkList(cpmks);
        setSubCpmkList(subs);
      } catch {
        if (active) {
          setCpmkList([]);
          setSubCpmkList([]);
        }
      }
    };
    loadCpmkData();
    return () => {
      active = false;
    };
  }, [mataKuliahId]);

  const cpmkSelectOptions = useMemo(
    () => [
      { value: '', label: 'Semua CPMK' },
      ...cpmkList.map((c: any) => ({
        value: String(c.id),
        label: `${c.kode_cpmk || `CPMK #${c.id}`} - ${(c.deskripsi || '').substring(0, 60)}...`,
      })),
    ],
    [cpmkList]
  );

  const filteredSubCpmkList = useMemo(() => {
    if (!selectedCpmkFilter) return subCpmkList;
    return subCpmkList.filter((s: any) => String(s.cpmk_id) === String(selectedCpmkFilter));
  }, [subCpmkList, selectedCpmkFilter]);

  // Handler Luring Items
  const handleAddLuring = () => {
    setLuringList((prev) => [
      ...prev,
      { id: `luring_${Date.now()}_${Math.random()}`, bentuk: '', metode: '', waktu_menit: 50 },
    ]);
  };
  const handleRemoveLuring = (idx: number) => {
    setLuringList((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleUpdateLuring = (idx: number, field: keyof AktivitasItem, val: any) => {
    setLuringList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Handler Daring Items
  const handleAddDaring = () => {
    setDaringList((prev) => [
      ...prev,
      { id: `daring_${Date.now()}_${Math.random()}`, bentuk: '', metode: '', waktu_menit: 50 },
    ]);
  };
  const handleRemoveDaring = (idx: number) => {
    setDaringList((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleUpdateDaring = (idx: number, field: keyof AktivitasItem, val: any) => {
    setDaringList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const onSubmit = async (values: SesiFormValues) => {
    const rawSessions = values.minggu_ke_input
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 16);

    if (rawSessions.length === 0) {
      toast.error('Format pertemuan ke tidak valid. Masukkan angka 1 s.d 16, pisahkan dengan koma.');
      return;
    }

    const selectedSubs = subCpmkList.filter((s: any) => values.sub_cpmk_ids.includes(Number(s.id)));
    const kemampuanAkhirSummary = selectedSubs
      .map((s: any) => `${s.kode_sub_cpmk ? `[${s.kode_sub_cpmk}] ` : ''}${s.deskripsi || ''}`)
      .join('; ');

    const luringSummary = luringList
      .filter((l) => l.bentuk || l.metode)
      .map((l) => `${l.bentuk ? `Bentuk: ${l.bentuk}` : ''}${l.metode ? `, Metode: ${l.metode}` : ''} (${l.waktu_menit} mnt)`)
      .join('; ');

    const daringSummary = daringList
      .filter((d) => d.bentuk || d.metode)
      .map((d) => `${d.bentuk ? `Bentuk: ${d.bentuk}` : ''}${d.metode ? `, Metode: ${d.metode}` : ''} (${d.waktu_menit} mnt)`)
      .join('; ');

    try {
      setSaving(true);
      for (const m of rawSessions) {
        await siakadService.storeRpsSesi(rpsId, {
          id: rawSessions.length === 1 ? initial?.id : undefined,
          minggu_ke: m,
          jenis_pertemuan: values.jenis_pertemuan,
          sub_cpmk_id: values.sub_cpmk_ids[0] || undefined,
          sub_cpmk_ids: values.sub_cpmk_ids,
          komponen_evaluasi_id: values.komponen_evaluasi_id ? Number(values.komponen_evaluasi_id) : undefined,
          kriteria_penilaian_id: values.kriteria_penilaian_id ? Number(values.kriteria_penilaian_id) : undefined,
          indikator_penilaian: values.indikator_penilaian?.trim() || undefined,
          teknik_penilaian: values.teknik_penilaian?.trim() || undefined,
          kriteria_teknik: values.teknik_penilaian?.trim() || undefined,
          bentuk_luring: luringSummary || undefined,
          bentuk_daring: daringSummary || undefined,
          aktivitas_luring: luringList.filter((l) => l.bentuk || l.metode),
          aktivitas_daring: daringList.filter((d) => d.bentuk || d.metode),
          penugasan_mahasiswa: values.penugasan_mahasiswa?.trim() || undefined,
          kemampuan_akhir: kemampuanAkhirSummary || `Sub-CPMK Pertemuan ${m}`,
          bahan_kajian: values.materi_pembelajaran?.trim() || initial?.bahan_kajian || `Bahan kajian pertemuan ${m}`,
          bobot_penilaian: values.bobot_penilaian !== undefined ? Number(values.bobot_penilaian) : 3,
        });
      }

      toast.success(
        rawSessions.length > 1
          ? `Berhasil menyimpan ${rawSessions.length} sesi pertemuan (${rawSessions.join(', ')})`
          : 'Sesi pertemuan berhasil disimpan'
      );
      router.push(`/siakad/obe/rps/${rpsId}/edit`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan sesi pertemuan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* SECTION 1: Pertemuan & Sub-CPMK */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Pertemuan &amp; Sub-CPMK</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Pertemuan Ke"
                placeholder="1 atau 1,2,3,4"
                error={errors.minggu_ke_input?.message}
                hint="jika untuk banyak sesi sekaligus, maka pisahkan dengan koma. cth: 1,2,3,4 yang artinya data ini untuk perkuliahan sesi 1 sampai 4"
                {...register('minggu_ke_input')}
              />
            </div>
            <div>
              <Controller
                name="jenis_pertemuan"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Jenis Pertemuan"
                    placeholder="Pilih Jenis Pertemuan"
                    options={jenisOptions}
                    value={field.value}
                    onChange={(opt: any) => {
                      const val = typeof opt === 'object' ? opt?.value : opt;
                      field.onChange(val ? String(val) : '');
                    }}
                    error={errors.jenis_pertemuan?.message}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <Controller
              name="cpmk_filter_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="CPMK"
                  placeholder="Pilih CPMK"
                  options={cpmkSelectOptions}
                  value={field.value || ''}
                  onChange={(opt: any) => {
                    const val = typeof opt === 'object' ? opt?.value : opt;
                    field.onChange(val || '');
                  }}
                  error={errors.cpmk_filter_id?.message}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Kemampuan akhir tiap tahapan belajar (Sub-CPMK) *
            </span>

            <Controller
              name="sub_cpmk_ids"
              control={control}
              render={({ field }) => (
                <div className="min-h-36 max-h-72 overflow-y-auto p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  {filteredSubCpmkList.length === 0 ? (
                    <p className="text-2xs text-slate-400 italic py-6 text-center">
                      Belum ada Sub-CPMK yang tersedia untuk mata kuliah ini.
                    </p>
                  ) : (
                    filteredSubCpmkList.map((sub: any) => {
                      const subId = Number(sub.id);
                      const isChecked = Array.isArray(field.value) && field.value.includes(subId);
                      return (
                        <div
                          key={sub.id}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                        >
                          <Checkbox
                            id={`sub-cpmk-${sub.id}`}
                            label={`${sub.kode_sub_cpmk || `Sub-CPMK #${sub.id}`} — ${sub.deskripsi || ''}`}
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const current = Array.isArray(field.value) ? [...field.value] : [];
                              if (checked) {
                                field.onChange([...current, subId]);
                              } else {
                                field.onChange(current.filter((id) => id !== subId));
                              }
                            }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            />

            <p className="text-2xs text-slate-400">Pilih Sub-CPMK dengan mencentang lebih dari satu</p>
            {errors.sub_cpmk_ids?.message && (
              <p className="text-2xs text-rose-600 font-semibold">{errors.sub_cpmk_ids.message}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* SECTION 2: Penilaian */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Penilaian</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Controller
              name="komponen_evaluasi_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Komponen"
                  placeholder="Pilih"
                  hint="Boleh dikosongkan jika tidak ada komponen pengambilan nilai pada pertemuan ini"
                  options={komponenOptions}
                  value={field.value || ''}
                  onChange={(opt: any) => {
                    const val = typeof opt === 'object' ? opt?.value : opt;
                    field.onChange(val || '');
                  }}
                  error={errors.komponen_evaluasi_id?.message}
                />
              )}
            />
          </div>

          <div>
            <Textarea
              label="Indikator"
              rows={3}
              placeholder="Tuliskan indikator capaian penilaian..."
              error={errors.indikator_penilaian?.message}
              {...register('indikator_penilaian')}
            />
          </div>

          <div>
            <Controller
              name="kriteria_penilaian_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kriteria"
                  placeholder="Pilih"
                  options={kriteriaOptions}
                  value={field.value || ''}
                  onChange={(opt: any) => {
                    const val = typeof opt === 'object' ? opt?.value : opt;
                    field.onChange(val || '');
                  }}
                  error={errors.kriteria_penilaian_id?.message}
                />
              )}
            />
          </div>

          <div>
            <Textarea
              label="Teknik"
              rows={3}
              placeholder="Tuliskan teknik penilaian yang digunakan..."
              error={errors.teknik_penilaian?.message}
              {...register('teknik_penilaian')}
            />
          </div>
        </CardBody>
      </Card>

      {/* SECTION 3: Bentuk Pembelajaran; Metode Pembelajaran; Penugasan Mahasiswa; [Estimasi Waktu] */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Bentuk Pembelajaran; Metode Pembelajaran; Penugasan Mahasiswa; [Estimasi Waktu]
          </h3>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Sub-grup Luring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={handleAddLuring}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              >
                Tambah Luring
              </Button>
            </div>

            <div className="space-y-3">
              {luringList.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
                >
                  <div className="md:col-span-4">
                    <Select
                      label="Bentuk Luring"
                      placeholder="Pilih Bentuk Perkuliahan"
                      options={bentukOptions}
                      value={item.bentuk}
                      onChange={(opt: any) => {
                        const val = typeof opt === 'object' ? opt?.value : opt;
                        handleUpdateLuring(idx, 'bentuk', val || '');
                      }}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Select
                      label="Metode Luring"
                      placeholder="Pilih Metode Perkuliahan"
                      options={metodeOptions}
                      value={item.metode}
                      onChange={(opt: any) => {
                        const val = typeof opt === 'object' ? opt?.value : opt;
                        handleUpdateLuring(idx, 'metode', val || '');
                      }}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      label="Waktu Luring (menit)"
                      min={1}
                      value={item.waktu_menit}
                      onChange={(e) => handleUpdateLuring(idx, 'waktu_menit', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveLuring(idx)}
                      disabled={luringList.length <= 1}
                      className="p-2 text-rose-600 border-rose-200 hover:bg-rose-50 disabled:opacity-30"
                      title="Hapus baris luring"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Sub-grup Daring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={handleAddDaring}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              >
                Tambah Daring
              </Button>
            </div>

            <div className="space-y-3">
              {daringList.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
                >
                  <div className="md:col-span-4">
                    <Select
                      label="Bentuk Daring"
                      placeholder="Pilih Bentuk Perkuliahan"
                      options={bentukOptions}
                      value={item.bentuk}
                      onChange={(opt: any) => {
                        const val = typeof opt === 'object' ? opt?.value : opt;
                        handleUpdateDaring(idx, 'bentuk', val || '');
                      }}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Select
                      label="Metode Daring"
                      placeholder="Pilih Metode Perkuliahan"
                      options={metodeOptions}
                      value={item.metode}
                      onChange={(opt: any) => {
                        const val = typeof opt === 'object' ? opt?.value : opt;
                        handleUpdateDaring(idx, 'metode', val || '');
                      }}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      label="Waktu Daring (menit)"
                      min={1}
                      value={item.waktu_menit}
                      onChange={(e) => handleUpdateDaring(idx, 'waktu_menit', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveDaring(idx)}
                      disabled={daringList.length <= 1}
                      className="p-2 text-rose-600 border-rose-200 hover:bg-rose-50 disabled:opacity-30"
                      title="Hapus baris daring"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
      </Card>
    </form>
  );
}
