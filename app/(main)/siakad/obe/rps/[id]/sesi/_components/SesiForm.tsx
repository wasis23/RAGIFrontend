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
import { Modal } from '@/components/ui/Modal';
import { Plus, X } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

// Schema Section 1: Pertemuan & Sub-CPMK
const section1Schema = z.object({
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
type Section1FormValues = z.infer<typeof section1Schema>;

// Schema Section 2: Penilaian
const section2Schema = z.object({
  komponen_evaluasi_id: z.string().optional(),
  indikator_penilaian: z.string().trim().optional(),
  kriteria_penilaian_id: z.string().optional(),
  teknik_penilaian: z.string().trim().optional(),
});
type Section2FormValues = z.infer<typeof section2Schema>;

// Schema Section 3: Bentuk & Metode Pembelajaran
const aktivitasItemSchema = z.object({
  id: z.string(),
  bentuk: z.string().optional(),
  metode: z.string().optional(),
  waktu_menit: z.number().min(0, 'Waktu minimal 0 menit'),
});

const section3Schema = z.object({
  luringList: z.array(aktivitasItemSchema),
  daringList: z.array(aktivitasItemSchema),
});
type Section3FormValues = z.infer<typeof section3Schema>;

type AktivitasItem = z.infer<typeof aktivitasItemSchema>;

// Schema Section 4: Materi Pembelajaran [Pustaka]
const section4Schema = z.object({
  topik_materi: z.string().trim().min(1, 'Topik materi wajib diisi'),
  sub_topik_materi: z.string().trim().optional(),
  pustaka_ids: z.array(z.string()).optional(),
});
type Section4FormValues = z.infer<typeof section4Schema>;

// Schema Section 5: Rubrik & Bobot Penilaian
const section5Schema = z.object({
  rubrik_id: z.string().optional(),
  bobot_penilaian: z
    .number({ error: 'Bobot penilaian wajib berupa angka' })
    .min(0, 'Bobot minimal 0%')
    .max(100, 'Bobot maksimal 100%'),
});
type Section5FormValues = z.infer<typeof section5Schema>;

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
}: SesiFormProps) {
  const router = useRouter();
  const [currentSesiId, setCurrentSesiId] = useState<number | undefined>(initial?.id);

  const [savingSec1, setSavingSec1] = useState(false);
  const [savingSec2, setSavingSec2] = useState(false);
  const [savingSec3, setSavingSec3] = useState(false);
  const [savingSec4, setSavingSec4] = useState(false);
  const [savingSec5, setSavingSec5] = useState(false);

  const [cpmkList, setCpmkList] = useState<any[]>([]);
  const [subCpmkList, setSubCpmkList] = useState<any[]>([]);
  const [jenisOptions, setJenisOptions] = useState<{ value: string; label: string }[]>([]);
  const [komponenOptions, setKomponenOptions] = useState<{ value: string; label: string }[]>([]);
  const [kriteriaOptions, setKriteriaOptions] = useState<{ value: string; label: string }[]>([]);
  const [bentukOptions, setBentukOptions] = useState<{ value: string; label: string }[]>([]);
  const [metodeOptions, setMetodeOptions] = useState<{ value: string; label: string }[]>([]);
  const [rubrikOptions, setRubrikOptions] = useState<{ value: string; label: string }[]>([]);
  const [rpsPustakaOptions, setRpsPustakaOptions] = useState<{ value: string; label: string }[]>([]);

  const initialSubIds: number[] = useMemo(() => {
    if (Array.isArray(initial?.sub_cpmk_ids) && initial.sub_cpmk_ids.length > 0) {
      return initial.sub_cpmk_ids.map(Number).filter(Boolean);
    }
    if (initial?.sub_cpmk_id) {
      return [Number(initial.sub_cpmk_id)];
    }
    return [];
  }, [initial]);

  // Form Section 1
  const {
    register: registerSec1,
    handleSubmit: handleSubmitSec1,
    control: controlSec1,
    watch: watchSec1,
    getValues: getValuesSec1,
    formState: { errors: errorsSec1 },
  } = useForm<Section1FormValues>({
    resolver: zodResolver(section1Schema),
    defaultValues: {
      minggu_ke_input: initial?.minggu_ke ? String(initial.minggu_ke) : String(defaultMingguKe),
      jenis_pertemuan: initial?.jenis_pertemuan || '',
      cpmk_filter_id: '',
      sub_cpmk_ids: initialSubIds,
    },
  });

  const selectedCpmkFilter = watchSec1('cpmk_filter_id');

  // Form Section 2
  const {
    register: registerSec2,
    handleSubmit: handleSubmitSec2,
    control: controlSec2,
    formState: { errors: errorsSec2 },
  } = useForm<Section2FormValues>({
    resolver: zodResolver(section2Schema),
    defaultValues: {
      komponen_evaluasi_id: initial?.komponen_evaluasi_id ? String(initial.komponen_evaluasi_id) : '',
      indikator_penilaian: initial?.indikator_penilaian || '',
      kriteria_penilaian_id: initial?.kriteria_penilaian_id ? String(initial.kriteria_penilaian_id) : '',
      teknik_penilaian: initial?.teknik_penilaian || initial?.kriteria_teknik || '',
    },
  });

  // Form Section 3
  const initialLuringList: AktivitasItem[] = useMemo(() => {
    if (Array.isArray(initial?.aktivitas_luring) && initial.aktivitas_luring.length > 0) {
      return initial.aktivitas_luring.map((item: any, idx: number) => ({
        id: `luring_${idx + 1}`,
        bentuk: item.bentuk || '',
        metode: item.metode || '',
        waktu_menit: Number(item.waktu_menit) || 50,
      }));
    }
    return [{ id: 'luring_1', bentuk: '', metode: '', waktu_menit: 50 }];
  }, [initial]);

  const initialDaringList: AktivitasItem[] = useMemo(() => {
    if (Array.isArray(initial?.aktivitas_daring) && initial.aktivitas_daring.length > 0) {
      return initial.aktivitas_daring.map((item: any, idx: number) => ({
        id: `daring_${idx + 1}`,
        bentuk: item.bentuk || '',
        metode: item.metode || '',
        waktu_menit: Number(item.waktu_menit) || 50,
      }));
    }
    return [{ id: 'daring_1', bentuk: '', metode: '', waktu_menit: 50 }];
  }, [initial]);

  const {
    handleSubmit: handleSubmitSec3,
    setValue: setValueSec3,
    watch: watchSec3,
  } = useForm<Section3FormValues>({
    resolver: zodResolver(section3Schema),
    defaultValues: {
      luringList: initialLuringList,
      daringList: initialDaringList,
    },
  });

  const luringList = watchSec3('luringList') || initialLuringList;
  const daringList = watchSec3('daringList') || initialDaringList;

  // Form Section 4: Materi Pembelajaran [Pustaka]
  const initialPustakaIds: string[] = useMemo(() => {
    if (Array.isArray(initial?.pustaka_ids)) {
      return initial.pustaka_ids.map(String);
    }
    return [];
  }, [initial]);

  const {
    register: registerSec4,
    handleSubmit: handleSubmitSec4,
    control: controlSec4,
    watch: watchSec4,
    setValue: setValueSec4,
    formState: { errors: errorsSec4 },
  } = useForm<Section4FormValues>({
    resolver: zodResolver(section4Schema),
    defaultValues: {
      topik_materi: initial?.topik_materi || initial?.bahan_kajian || '',
      sub_topik_materi: initial?.sub_topik_materi || '',
      pustaka_ids: initialPustakaIds,
    },
  });

  const selectedPustakaIds = watchSec4('pustaka_ids') || [];
  const [showPustakaModal, setShowPustakaModal] = useState(false);

  // Form Section 5: Rubrik & Bobot Penilaian
  const {
    register: registerSec5,
    handleSubmit: handleSubmitSec5,
    control: controlSec5,
    formState: { errors: errorsSec5 },
  } = useForm<Section5FormValues>({
    resolver: zodResolver(section5Schema),
    defaultValues: {
      rubrik_id: initial?.rubrik_id ? String(initial.rubrik_id) : '',
      bobot_penilaian: initial?.bobot_penilaian !== undefined ? Number(initial.bobot_penilaian) : 0,
    },
  });

  // Muat referensi RPS, Rubrik, dan Dokumen RPS Pustaka
  useEffect(() => {
    let active = true;
    const fetchReferences = async () => {
      try {
        const [jenisRes, kompRes, kritRes, btkRes, mtdRes, rubrikRes, rpsDetailRes] = await Promise.all([
          siakadService.getRpsReferensi({ tipe: 'jenis_pembelajaran', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'komponen', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'kriteria', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'bentuk', per_page: 50 }),
          siakadService.getRpsReferensi({ tipe: 'metode', per_page: 50 }),
          siakadService.getObeRubrikList({ per_page: 50 }),
          siakadService.showRps(rpsId),
        ]);
        if (!active) return;
        const jList: any[] = Array.isArray(jenisRes.data) ? jenisRes.data : [];
        const kList: any[] = Array.isArray(kompRes.data) ? kompRes.data : [];
        const rList: any[] = Array.isArray(kritRes.data) ? kritRes.data : [];
        const bList: any[] = Array.isArray(btkRes.data) ? btkRes.data : [];
        const mList: any[] = Array.isArray(mtdRes.data) ? mtdRes.data : [];
        const rbList: any[] = Array.isArray(rubrikRes.data) ? rubrikRes.data : (rubrikRes.data?.items || []);

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
        setRubrikOptions([
          { value: '', label: 'Pilih Rubrik' },
          ...rbList.map((rb: any) => ({
            value: String(rb.id),
            label: `${rb.kode_rubrik ? `[${rb.kode_rubrik}] ` : ''}${rb.nama_rubrik || rb.nama}`,
          })),
        ]);

        // Parse pustaka dari dokumen RPS
        const dRps = rpsDetailRes?.data;
        const parsedPustakas: { value: string; label: string }[] = [];
        if (dRps?.pustaka_utama) {
          String(dRps.pustaka_utama)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((p, idx) => {
              parsedPustakas.push({ value: `utama_${idx + 1}`, label: `[Utama] ${p}` });
            });
        }
        if (dRps?.pustaka_pendukung) {
          String(dRps.pustaka_pendukung)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((p, idx) => {
              parsedPustakas.push({ value: `pendukung_${idx + 1}`, label: `[Pendukung] ${p}` });
            });
        }
        setRpsPustakaOptions(parsedPustakas);
      } catch {
        if (active) {
          setJenisOptions([]);
          setKomponenOptions([]);
          setKriteriaOptions([]);
          setBentukOptions([]);
          setMetodeOptions([]);
          setRubrikOptions([]);
          setRpsPustakaOptions([]);
        }
      }
    };
    fetchReferences();
    return () => {
      active = false;
    };
  }, [rpsId]);

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
    const newId = `luring_${luringList.length + 1}`;
    setValueSec3('luringList', [
      ...luringList,
      { id: newId, bentuk: '', metode: '', waktu_menit: 50 },
    ]);
  };
  const handleRemoveLuring = (idx: number) => {
    setValueSec3(
      'luringList',
      luringList.filter((_, i) => i !== idx)
    );
  };
  const handleUpdateLuring = (idx: number, field: keyof AktivitasItem, val: any) => {
    setValueSec3(
      'luringList',
      luringList.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Handler Daring Items
  const handleAddDaring = () => {
    const newId = `daring_${daringList.length + 1}`;
    setValueSec3('daringList', [
      ...daringList,
      { id: newId, bentuk: '', metode: '', waktu_menit: 50 },
    ]);
  };
  const handleRemoveDaring = (idx: number) => {
    setValueSec3(
      'daringList',
      daringList.filter((_, i) => i !== idx)
    );
  };
  const handleUpdateDaring = (idx: number, field: keyof AktivitasItem, val: any) => {
    setValueSec3(
      'daringList',
      daringList.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Helper parsing daftar sesi minggu
  const parseSessions = (input: string) => {
    return input
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 16);
  };

  // Submit Section 1: Pertemuan & Sub-CPMK
  const onSubmitSec1 = async (values: Section1FormValues) => {
    const rawSessions = parseSessions(values.minggu_ke_input);
    if (rawSessions.length === 0) {
      toast.error('Format pertemuan ke tidak valid. Masukkan angka 1 s.d 16, pisahkan dengan koma.');
      return;
    }

    const selectedSubs = subCpmkList.filter((s: any) => values.sub_cpmk_ids.includes(Number(s.id)));
    const kemampuanAkhirSummary = selectedSubs
      .map((s: any) => `${s.kode_sub_cpmk ? `[${s.kode_sub_cpmk}] ` : ''}${s.deskripsi || ''}`)
      .join('; ');

    try {
      setSavingSec1(true);
      let lastSavedId: number | undefined = currentSesiId;
      for (const m of rawSessions) {
        const res = await siakadService.storeRpsSesi(rpsId, {
          id: rawSessions.length === 1 ? currentSesiId : undefined,
          minggu_ke: m,
          jenis_pertemuan: values.jenis_pertemuan,
          sub_cpmk_id: values.sub_cpmk_ids[0] || undefined,
          sub_cpmk_ids: values.sub_cpmk_ids,
          kemampuan_akhir: kemampuanAkhirSummary || `Sub-CPMK Pertemuan ${m}`,
          bahan_kajian: initial?.bahan_kajian || `Bahan kajian pertemuan ${m}`,
          bobot_penilaian: initial?.bobot_penilaian !== undefined ? Number(initial.bobot_penilaian) : 0,
        });
        if (res?.data?.id) {
          lastSavedId = Number(res.data.id);
        }
      }
      if (lastSavedId) setCurrentSesiId(lastSavedId);
      toast.success(
        rawSessions.length > 1
          ? `Berhasil menyimpan ${rawSessions.length} sesi pertemuan & Sub-CPMK`
          : 'Section Pertemuan & Sub-CPMK berhasil disimpan'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Pertemuan & Sub-CPMK');
    } finally {
      setSavingSec1(false);
    }
  };

  // Submit Section 2: Penilaian
  const onSubmitSec2 = async (values: Section2FormValues) => {
    const sec1Values = getValuesSec1();
    const rawSessions = parseSessions(sec1Values.minggu_ke_input || String(defaultMingguKe));
    const targetMinggu = rawSessions[0] || defaultMingguKe;

    try {
      setSavingSec2(true);
      const res = await siakadService.storeRpsSesi(rpsId, {
        id: currentSesiId,
        minggu_ke: targetMinggu,
        jenis_pertemuan: sec1Values.jenis_pertemuan || undefined,
        komponen_evaluasi_id: values.komponen_evaluasi_id ? Number(values.komponen_evaluasi_id) : undefined,
        kriteria_penilaian_id: values.kriteria_penilaian_id ? Number(values.kriteria_penilaian_id) : undefined,
        indikator_penilaian: values.indikator_penilaian?.trim() || undefined,
        teknik_penilaian: values.teknik_penilaian?.trim() || undefined,
        kriteria_teknik: values.teknik_penilaian?.trim() || undefined,
      });
      if (res?.data?.id) setCurrentSesiId(Number(res.data.id));
      toast.success('Section Penilaian berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data penilaian');
    } finally {
      setSavingSec2(false);
    }
  };

  // Submit Section 3: Bentuk & Metode Pembelajaran
  const onSubmitSec3 = async (values: Section3FormValues) => {
    const sec1Values = getValuesSec1();
    const rawSessions = parseSessions(sec1Values.minggu_ke_input || String(defaultMingguKe));
    const targetMinggu = rawSessions[0] || defaultMingguKe;

    const luringSummary = (values.luringList || [])
      .filter((l) => l.bentuk || l.metode)
      .map((l) => `${l.bentuk ? `Bentuk: ${l.bentuk}` : ''}${l.metode ? `, Metode: ${l.metode}` : ''} (${l.waktu_menit} mnt)`)
      .join('; ');

    const daringSummary = (values.daringList || [])
      .filter((d) => d.bentuk || d.metode)
      .map((d) => `${d.bentuk ? `Bentuk: ${d.bentuk}` : ''}${d.metode ? `, Metode: ${d.metode}` : ''} (${d.waktu_menit} mnt)`)
      .join('; ');

    try {
      setSavingSec3(true);
      const res = await siakadService.storeRpsSesi(rpsId, {
        id: currentSesiId,
        minggu_ke: targetMinggu,
        jenis_pertemuan: sec1Values.jenis_pertemuan || undefined,
        bentuk_luring: luringSummary || undefined,
        bentuk_daring: daringSummary || undefined,
        aktivitas_luring: (values.luringList || []).filter((l) => l.bentuk || l.metode),
        aktivitas_daring: (values.daringList || []).filter((d) => d.bentuk || d.metode),
      });
      if (res?.data?.id) setCurrentSesiId(Number(res.data.id));
      toast.success('Section Bentuk & Metode Pembelajaran berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Bentuk & Metode Pembelajaran');
    } finally {
      setSavingSec3(false);
    }
  };

  // Submit Section 4: Materi Pembelajaran [Pustaka]
  const onSubmitSec4 = async (values: Section4FormValues) => {
    const sec1Values = getValuesSec1();
    const rawSessions = parseSessions(sec1Values.minggu_ke_input || String(defaultMingguKe));
    const targetMinggu = rawSessions[0] || defaultMingguKe;

    try {
      setSavingSec4(true);
      const res = await siakadService.storeRpsSesi(rpsId, {
        id: currentSesiId,
        minggu_ke: targetMinggu,
        jenis_pertemuan: sec1Values.jenis_pertemuan || undefined,
        topik_materi: values.topik_materi.trim(),
        sub_topik_materi: values.sub_topik_materi?.trim() || undefined,
        bahan_kajian: values.topik_materi.trim(),
        pustaka_ids: values.pustaka_ids || [],
      });
      if (res?.data?.id) setCurrentSesiId(Number(res.data.id));
      toast.success('Section Materi Pembelajaran [Pustaka] berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan materi pembelajaran');
    } finally {
      setSavingSec4(false);
    }
  };

  // Submit Section 5: Rubrik & Bobot Penilaian
  const onSubmitSec5 = async (values: Section5FormValues) => {
    const sec1Values = getValuesSec1();
    const rawSessions = parseSessions(sec1Values.minggu_ke_input || String(defaultMingguKe));
    const targetMinggu = rawSessions[0] || defaultMingguKe;

    try {
      setSavingSec5(true);
      const res = await siakadService.storeRpsSesi(rpsId, {
        id: currentSesiId,
        minggu_ke: targetMinggu,
        jenis_pertemuan: sec1Values.jenis_pertemuan || undefined,
        rubrik_id: values.rubrik_id ? Number(values.rubrik_id) : undefined,
        bobot_penilaian: values.bobot_penilaian,
      });
      if (res?.data?.id) setCurrentSesiId(Number(res.data.id));
      toast.success('Section Rubrik & Bobot Penilaian berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan rubrik & bobot penilaian');
    } finally {
      setSavingSec5(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Pertemuan & Sub-CPMK */}
      <Card>
        <form onSubmit={handleSubmitSec1(onSubmitSec1)} noValidate>
          <CardHeader className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Pertemuan &amp; Sub-CPMK</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Pertemuan Ke"
                  placeholder="1 atau 1,2,3,4"
                  error={errorsSec1.minggu_ke_input?.message}
                  hint="jika untuk banyak sesi sekaligus, maka pisahkan dengan koma. cth: 1,2,3,4 yang artinya data ini untuk perkuliahan sesi 1 sampai 4"
                  {...registerSec1('minggu_ke_input')}
                />
              </div>
              <div>
                <Controller
                  name="jenis_pertemuan"
                  control={controlSec1}
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
                      error={errorsSec1.jenis_pertemuan?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Controller
                name="cpmk_filter_id"
                control={controlSec1}
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
                    error={errorsSec1.cpmk_filter_id?.message}
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
                control={controlSec1}
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
              {errorsSec1.sub_cpmk_ids?.message && (
                <p className="text-2xs text-rose-600 font-semibold">{errorsSec1.sub_cpmk_ids.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={savingSec1}>
                Simpan Pertemuan &amp; Sub-CPMK
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {/* SECTION 2: Penilaian */}
      <Card>
        <form onSubmit={handleSubmitSec2(onSubmitSec2)} noValidate>
          <CardHeader className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Penilaian</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Controller
                name="komponen_evaluasi_id"
                control={controlSec2}
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
                    error={errorsSec2.komponen_evaluasi_id?.message}
                  />
                )}
              />
            </div>

            <div>
              <Textarea
                label="Indikator"
                rows={3}
                placeholder="Tuliskan indikator capaian penilaian..."
                error={errorsSec2.indikator_penilaian?.message}
                {...registerSec2('indikator_penilaian')}
              />
            </div>

            <div>
              <Controller
                name="kriteria_penilaian_id"
                control={controlSec2}
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
                    error={errorsSec2.kriteria_penilaian_id?.message}
                  />
                )}
              />
            </div>

            <div>
              <Textarea
                label="Teknik"
                rows={3}
                placeholder="Tuliskan teknik penilaian yang digunakan..."
                error={errorsSec2.teknik_penilaian?.message}
                {...registerSec2('teknik_penilaian')}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={savingSec2}>
                Simpan Penilaian
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {/* SECTION 3: Bentuk Pembelajaran; Metode Pembelajaran; Penugasan Mahasiswa; [Estimasi Waktu] */}
      <Card>
        <form onSubmit={handleSubmitSec3(onSubmitSec3)} noValidate>
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
              <Button type="submit" variant="primary" isLoading={savingSec3}>
                Simpan Bentuk &amp; Metode
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {/* SECTION 4: Materi Pembelajaran[Pustaka] */}
      <Card>
        <form onSubmit={handleSubmitSec4(onSubmitSec4)} noValidate>
          <CardHeader className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Materi Pembelajaran[Pustaka]</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Textarea
                label="Topik"
                rows={3}
                placeholder="Tuliskan topik utama materi pembelajaran..."
                error={errorsSec4.topik_materi?.message}
                {...registerSec4('topik_materi')}
              />
            </div>

            <div>
              <Textarea
                label="Sub Topik"
                rows={3}
                placeholder="Tuliskan sub-topik / rincian materi pembelajaran..."
                error={errorsSec4.sub_topik_materi?.message}
                {...registerSec4('sub_topik_materi')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  icon={<Plus size={14} />}
                  onClick={() => setShowPustakaModal(true)}
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                >
                  Tambah Pustaka
                </Button>
              </div>

              {selectedPustakaIds.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-2xs font-bold text-slate-500 uppercase block">Pustaka Terpilih:</span>
                  {selectedPustakaIds.map((pId) => {
                    const match = rpsPustakaOptions.find((p) => p.value === pId);
                    return (
                      <div
                        key={pId}
                        className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-slate-100"
                      >
                        <span className="text-slate-700 font-medium">{match?.label || pId}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setValueSec4('pustaka_ids', selectedPustakaIds.filter((id) => id !== pId))}
                          className="text-rose-600 hover:text-rose-800 text-2xs font-bold p-1 h-auto"
                        >
                          Lepas
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={savingSec4}>
                Simpan Materi Pembelajaran
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {/* SECTION 5: Rubrik & Bobot Penilaian */}
      <Card>
        <form onSubmit={handleSubmitSec5(onSubmitSec5)} noValidate>
          <CardHeader className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Rubrik &amp; Bobot Penilaian</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Controller
                name="rubrik_id"
                control={controlSec5}
                render={({ field }) => (
                  <Select
                    label="Rubrik (kosongkan jika tidak pakai rubrik)"
                    placeholder="Pilih Rubrik"
                    options={rubrikOptions}
                    value={field.value || ''}
                    onChange={(opt: any) => {
                      const val = typeof opt === 'object' ? opt?.value : opt;
                      field.onChange(val || '');
                    }}
                    error={errorsSec5.rubrik_id?.message}
                  />
                )}
              />
            </div>

            <div>
              <Input
                type="number"
                label="Bobot Penilaian %. Maksimal 100"
                placeholder="0"
                min={0}
                max={100}
                error={errorsSec5.bobot_penilaian?.message}
                {...registerSec5('bobot_penilaian', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/siakad/obe/rps/${rpsId}/edit`)}
              >
                Selesai / Kembali
              </Button>
              <Button type="submit" variant="primary" isLoading={savingSec5}>
                Simpan Rubrik &amp; Bobot
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {/* Modal Dialog Pilih Pustaka dari Dokumen RPS */}
      <Modal
        open={showPustakaModal}
        onClose={() => setShowPustakaModal(false)}
        title="Pilih Pustaka Rujukan RPS"
        size="lg"
        footer={
          <Button type="button" variant="primary" onClick={() => setShowPustakaModal(false)}>
            Tutup
          </Button>
        }
      >
        <div className="max-h-60 overflow-y-auto space-y-2">
          {rpsPustakaOptions.length === 0 ? (
            <p className="text-2xs text-slate-400 italic text-center py-4">
              Belum ada pustaka pada dokumen RPS ini. Tambahkan pustaka terlebih dahulu di halaman Edit RPS.
            </p>
          ) : (
            rpsPustakaOptions.map((p) => {
              const isChecked = selectedPustakaIds.includes(p.value);
              return (
                <div
                  key={p.value}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <Checkbox
                    id={`pustaka-${p.value}`}
                    label={p.label}
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setValueSec4('pustaka_ids', [...selectedPustakaIds, p.value]);
                      } else {
                        setValueSec4(
                          'pustaka_ids',
                          selectedPustakaIds.filter((id) => id !== p.value)
                        );
                      }
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
