'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const sesiSection1Schema = z.object({
  minggu_ke_input: z
    .string()
    .trim()
    .min(1, 'Pertemuan ke wajib diisi (cth: 1 atau 1,2,3,4)'),
  jenis_pertemuan: z.string().trim().min(1, 'Jenis pertemuan wajib dipilih'),
  cpmk_filter_id: z.string().optional(),
  sub_cpmk_ids: z
    .array(z.number())
    .min(1, 'Pilih minimal satu Sub-CPMK tahapan belajar'),
});

export type SesiSection1FormValues = z.infer<typeof sesiSection1Schema>;

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
  } = useForm<SesiSection1FormValues>({
    resolver: zodResolver(sesiSection1Schema),
    defaultValues: {
      minggu_ke_input: initial?.minggu_ke ? String(initial.minggu_ke) : String(defaultMingguKe),
      jenis_pertemuan: initial?.jenis_pertemuan || '',
      cpmk_filter_id: '',
      sub_cpmk_ids: initialSubIds,
    },
  });

  const selectedCpmkFilter = watch('cpmk_filter_id');

  // Muat master jenis pembelajaran dinamis murni dari API
  useEffect(() => {
    let active = true;
    const fetchJenis = async () => {
      try {
        const res = await siakadService.getRpsReferensi({ tipe: 'jenis_pembelajaran', per_page: 50 });
        const list: any[] = Array.isArray(res.data) ? res.data : [];
        if (!active) return;
        setJenisOptions(list.map((j: any) => ({ value: String(j.id ?? j.kode ?? j.nama), label: j.nama })));
      } catch {
        if (active) setJenisOptions([]);
      }
    };
    fetchJenis();
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

  const onSubmit = async (values: SesiSection1FormValues) => {
    // Parsing daftar minggu (mis: "1" atau "1,2,3,4")
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

    try {
      setSaving(true);
      for (const m of rawSessions) {
        await siakadService.storeRpsSesi(rpsId, {
          id: rawSessions.length === 1 ? initial?.id : undefined,
          minggu_ke: m,
          jenis_pertemuan: values.jenis_pertemuan,
          sub_cpmk_id: values.sub_cpmk_ids[0] || undefined,
          sub_cpmk_ids: values.sub_cpmk_ids,
          kemampuan_akhir: kemampuanAkhirSummary || `Sub-CPMK Pertemuan ${m}`,
          bahan_kajian: initial?.bahan_kajian || `Bahan kajian pertemuan ${m}`,
          bobot_penilaian: initial?.bobot_penilaian !== undefined ? Number(initial.bobot_penilaian) : 3,
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
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
      </form>
    </Card>
  );
}
