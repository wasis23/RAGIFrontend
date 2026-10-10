'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Loader2, FileText, BookOpen, Layers, Users, Plus, Award, Trash2, Library, CalendarDays, Pencil } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import {
  DOSEN_BISA_EDIT_OPTIONS,
  JENIS_PEMBELAJARAN_OPTIONS,
  JENIS_PUSTAKA_OPTIONS,
  RpsMkBanner,
  RpsCplCpmkTabs,
  type CplRow,
  type CpmkRow,
} from '@/components/siakad/RpsFormShared';
import toast from 'react-hot-toast';

const rpsEditSchema = z.object({
  kode_rps: z.string().trim().min(1, 'Kode RPS wajib diisi').max(100, 'Kode RPS maksimal 100 karakter'),
  tanggal_penyusunan: z.string().min(1, 'Tanggal Penyusunan wajib diisi'),
  semester_rps: z.number({ error: 'Semester RPS wajib diisi' }).min(1, 'Semester minimal 1').max(14, 'Semester maksimal 14'),
  dosen_bisa_edit: z.boolean(),
  deskripsi_singkat: z.string().trim().optional(),
  bahan_kajian_mk: z.string().trim().optional(),
  mata_kuliah_syarat: z.string().trim().optional(),
  jenis_pembelajaran: z.string().optional(),
  dosen_anggota_ids: z.array(z.number()).optional(),
  koordinator_rmk_id: z.number().nullable().optional(),
  kaprodi_id: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof rpsEditSchema>;

const subCpmkSchema = z.object({
  cpmk_id: z.number({ error: 'CPMK Induk wajib dipilih' }).min(1, 'CPMK Induk wajib dipilih'),
  deskripsi: z.string().trim().min(3, 'Rumusan Sub-CPMK minimal 3 karakter'),
});

type SubCpmkFormValues = z.infer<typeof subCpmkSchema>;

const pustakaSchema = z.object({
  jenis: z.enum(['utama', 'pendukung'], { error: 'Jenis pustaka wajib dipilih' }),
  isi: z.string().trim().min(3, 'Keterangan/judul pustaka minimal 3 karakter'),
});

type PustakaFormValues = z.infer<typeof pustakaSchema>;



const dosenDisplayLabel = (d: any) =>
  `${d?.nama_lengkap || d?.nama || d?.name || '-'}${d?.nidn ? ` (${d.nidn})` : ''}`;

export default function EditRpsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rpsId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedMk, setSelectedMk] = useState<any | null>(null);
  const [rps, setRps] = useState<any | null>(null);

  // Pustaka (Daftar Referensi Utama & Pendukung)
  type PustakaItem = { id: string; jenis: 'utama' | 'pendukung'; isi: string };
  const [pustakaList, setPustakaList] = useState<PustakaItem[]>([]);
  const [showAddPustaka, setShowAddPustaka] = useState(false);
  const [savingPustaka, setSavingPustaka] = useState(false);
  const [deletingPustakaId, setDeletingPustakaId] = useState<string | null>(null);
  const [deletingPustaka, setDeletingPustaka] = useState(false);

  const {
    register: registerPustaka,
    handleSubmit: handleSubmitPustaka,
    control: controlPustaka,
    reset: resetPustaka,
    formState: { errors: errorsPustaka },
  } = useForm<PustakaFormValues>({
    resolver: zodResolver(pustakaSchema),
    defaultValues: {
      jenis: 'utama',
      isi: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(rpsEditSchema),
    defaultValues: {
      kode_rps: '',
      tanggal_penyusunan: '',
      semester_rps: 1,
      dosen_bisa_edit: true,
      deskripsi_singkat: '',
      bahan_kajian_mk: '',
      mata_kuliah_syarat: '-',
      jenis_pembelajaran: 'Kuliah / Responsi',
      dosen_anggota_ids: [],
      koordinator_rmk_id: null,
      kaprodi_id: null,
    },
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!rpsId || Number.isNaN(rpsId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const res = await siakadService.showRps(rpsId);
        const d = res?.data;
        if (!active || !d) {
          if (active) setNotFound(true);
          return;
        }

        setRps(d);
        setSelectedMk(d.mata_kuliah || d.mataKuliah || null);

        const tanggal = d.tanggal_penyusunan ? String(d.tanggal_penyusunan).split('T')[0] : '';

        setValue('kode_rps', d.kode_rps || '');
        setValue('tanggal_penyusunan', tanggal);
        setValue('semester_rps', Number(d.semester) || 1);
        setValue('dosen_bisa_edit', d.dosen_bisa_edit ?? true);
        setValue('deskripsi_singkat', d.deskripsi_singkat || '');
        setValue('bahan_kajian_mk', d.bahan_kajian_mk || '');
        setValue('mata_kuliah_syarat', d.mata_kuliah_syarat || '-');
        setValue('jenis_pembelajaran', d.jenis_pembelajaran || 'Kuliah / Responsi');
        setValue('dosen_anggota_ids', (d.dosen_anggota_ids || []).map(Number).filter(Boolean));
        setValue('koordinator_rmk_id', d.koordinator_rmk_id ? Number(d.koordinator_rmk_id) : null);
        setValue('kaprodi_id', d.kaprodi_id ? Number(d.kaprodi_id) : null);

        // Parse pustaka_utama dan pustaka_pendukung ke pustakaList
        const parsedPustaka: PustakaItem[] = [];
        if (d.pustaka_utama) {
          const lines = String(d.pustaka_utama).split('\n').map((s) => s.trim()).filter(Boolean);
          lines.forEach((l, idx) => parsedPustaka.push({ id: `u_${idx}_${Date.now()}`, jenis: 'utama', isi: l }));
        }
        if (d.pustaka_pendukung) {
          const lines = String(d.pustaka_pendukung).split('\n').map((s) => s.trim()).filter(Boolean);
          lines.forEach((l, idx) => parsedPustaka.push({ id: `p_${idx}_${Date.now()}`, jenis: 'pendukung', isi: l }));
        }
        setPustakaList(parsedPustaka);
      } catch (err: any) {
        if (active) {
          setNotFound(true);
          toast.error(err?.response?.data?.message || 'Gagal memuat dokumen RPS');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [rpsId, setValue]);

  const loadDosenOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((d: any) => ({
        value: d.id,
        label: `${d.nama_lengkap || d.nama || d.name || '-'}${d.nidn ? ` (${d.nidn})` : ''}`,
        raw: d,
      }));
    } catch {
      return [];
    }
  }, []);

  // Opsi awal agar AsyncSelect menampilkan label, bukan angka ID.
  const anggotaOptions = useMemo(() => {
    const list: any[] = rps?.dosen_anggotas || [];
    return list.map((d: any) => ({
      value: Number(d.id),
      label: `${d.nama_lengkap || d.nama || d.name || '-'}${d.nidn ? ` (${d.nidn})` : ''}`,
      raw: d,
    }));
  }, [rps]);

  const koordinatorOption = useMemo(() => {
    const k = rps?.koordinatorRmk || rps?.koordinator_rmk;
    return k
      ? {
          value: Number(k.id),
          label: `${k.nama_lengkap || k.nama || k.name || '-'}${k.nidn ? ` (${k.nidn})` : ''}`,
          raw: k,
        }
      : null;
  }, [rps]);

  const kaprodiOption = useMemo(() => {
    const k = rps?.kaprodi;
    return k
      ? {
          value: Number(k.id),
          label: `${k.nama_lengkap || k.nama || k.name || '-'}${k.nidn ? ` (${k.nidn})` : ''}`,
          raw: k,
        }
      : null;
  }, [rps]);

  // CPL-PRODI dibebankan pada MK: pivot siakad_mata_kuliah_cpl (read-only).
  const cplRows = useMemo<CplRow[]>(() => {
    const mk = rps?.mataKuliah || rps?.mata_kuliah;
    const cpls = mk?.cpls || [];
    return cpls.map((c: any) => ({
      id: Number(c.id),
      kode_cpl: c.kode_cpl || '-',
      deskripsi: c.deskripsi || '-',
    }));
  }, [rps]);

  // CPMK: rumusan CPMK Program Studi (CPMK-PS) yang dibebankan ke MK ini
  // melalui pivot siakad_cpmk_prodi_mata_kuliah.
  // Catatan: Eloquent men-serialize nama relasi menjadi snake_case (`cpmk_prodis`).
  const cpmkRows = useMemo<CpmkRow[]>(() => {
    const mk = rps?.mataKuliah || rps?.mata_kuliah;
    const cpmks = mk?.cpmk_prodis || mk?.cpmkProdis || [];
    return cpmks.map((c: any) => ({
      id: Number(c.id),
      kode_cpmk: c.kode_cpmk || '-',
      deskripsi: c.deskripsi || '-',
    }));
  }, [rps]);

  // CPMK list untuk dropdown & Sub-CPMK grouping: ambil dari cpmkProdis (rumusan CPMK yang dipetakan ke MK ini) atau cpmks
  const availableCpmks = useMemo<any[]>(() => {
    const mk = rps?.mataKuliah || rps?.mata_kuliah;
    const fromProdis = mk?.cpmk_prodis || mk?.cpmkProdis || [];
    if (fromProdis.length > 0) return fromProdis;
    return mk?.cpmks || [];
  }, [rps]);

  // Sub-CPMK State & Management
  const [subCpmkList, setSubCpmkList] = useState<any[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState<number | null>(null);
  const [deletingSub, setDeletingSub] = useState(false);

  const {
    register: registerSub,
    handleSubmit: handleSubmitSub,
    control: controlSub,
    reset: resetSub,
    setValue: setValueSub,
    formState: { errors: errorsSub },
  } = useForm<SubCpmkFormValues>({
    resolver: zodResolver(subCpmkSchema),
    defaultValues: {
      cpmk_id: 0,
      deskripsi: '',
    },
  });

  useEffect(() => {
    if (availableCpmks.length > 0) {
      setValueSub('cpmk_id', Number(availableCpmks[0].id));
    }
  }, [availableCpmks, setValueSub]);

  useEffect(() => {
    let active = true;
    const fetchSub = async () => {
      if (availableCpmks.length === 0) return;
      try {
        setLoadingSub(true);
        const res = await siakadService.getSubCpmk();
        if (!active) return;
        const allSubs: any[] = Array.isArray(res.data) ? res.data : [];
        const mkCpmkIds = new Set(availableCpmks.map((c: any) => Number(c.id)));
        const filtered = allSubs.filter((s: any) => mkCpmkIds.has(Number(s.cpmk_id)));
        setSubCpmkList(filtered);
      } catch {
        if (active) setSubCpmkList([]);
      } finally {
        if (active) setLoadingSub(false);
      }
    };

    fetchSub();
    return () => {
      active = false;
    };
  }, [availableCpmks]);

  const refreshSubCpmkList = async () => {
    try {
      setLoadingSub(true);
      const res = await siakadService.getSubCpmk();
      const allSubs: any[] = Array.isArray(res.data) ? res.data : [];
      const mkCpmkIds = new Set(availableCpmks.map((c: any) => Number(c.id)));
      const filtered = allSubs.filter((s: any) => mkCpmkIds.has(Number(s.cpmk_id)));
      setSubCpmkList(filtered);
    } catch {
      setSubCpmkList([]);
    } finally {
      setLoadingSub(false);
    }
  };

  const onPustakaSubmit = async (values: PustakaFormValues) => {
    if (!selectedMk?.id) return;
    const newId = `pustaka_${values.jenis}_${pustakaList.length + 1}`;
    const nextList: PustakaItem[] = [
      ...pustakaList,
      { id: newId, jenis: values.jenis, isi: values.isi.trim() },
    ];

    const utama = nextList
      .filter((p) => p.jenis === 'utama' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');
    const pendukung = nextList
      .filter((p) => p.jenis === 'pendukung' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');

    try {
      setSavingPustaka(true);
      await siakadService.storeRps({
        id: rpsId,
        mata_kuliah_id: Number(selectedMk.id),
        pustaka_utama: utama || undefined,
        pustaka_pendukung: pendukung || undefined,
      });
      setPustakaList(nextList);
      toast.success('Pustaka berhasil ditambahkan');
      resetPustaka({ jenis: 'utama', isi: '' });
      setShowAddPustaka(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pustaka');
    } finally {
      setSavingPustaka(false);
    }
  };

  const handleConfirmDeletePustaka = async () => {
    if (!deletingPustakaId || !selectedMk?.id) return;
    const nextList = pustakaList.filter((p) => p.id !== deletingPustakaId);
    const utama = nextList
      .filter((p) => p.jenis === 'utama' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');
    const pendukung = nextList
      .filter((p) => p.jenis === 'pendukung' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');

    try {
      setDeletingPustaka(true);
      await siakadService.storeRps({
        id: rpsId,
        mata_kuliah_id: Number(selectedMk.id),
        pustaka_utama: utama || undefined,
        pustaka_pendukung: pendukung || undefined,
      });
      setPustakaList(nextList);
      toast.success('Pustaka berhasil dihapus');
      setDeletingPustakaId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pustaka');
    } finally {
      setDeletingPustaka(false);
    }
  };

  const pustakaColumns: ColumnDef<PustakaItem>[] = [
    {
      key: 'jenis',
      label: 'Kategori',
      align: 'center',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
            row.jenis === 'utama'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {row.jenis}
        </span>
      ),
    },
    {
      key: 'isi',
      label: 'Referensi / Judul Pustaka',
      render: (row) => <span className="text-xs text-slate-800 leading-relaxed font-medium">{row.isi}</span>,
    },
    {
      key: 'actions',
      label: 'Opsi',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Hapus Pustaka',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeletingPustakaId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const onSubCpmkSubmit = async (values: SubCpmkFormValues) => {
    if (!values.cpmk_id || !selectedMk?.id) {
      toast.error('Pilih CPMK terlebih dahulu');
      return;
    }

    const cpmkObj = availableCpmks.find((c: any) => Number(c.id) === Number(values.cpmk_id));
    const cpmkCode = cpmkObj?.kode_cpmk || `CPMK${values.cpmk_id}`;
    const existingForCpmk = subCpmkList.filter((s: any) => Number(s.cpmk_id) === Number(values.cpmk_id));
    const nextIndex = existingForCpmk.length + 1;
    const kodeSub = `sub.cpmk.${selectedMk?.kode_mk || 'MK'}.${cpmkCode}.${nextIndex}`;

    try {
      setSavingSub(true);
      await siakadService.storeSubCpmk({
        cpmk_prodi_id: Number(values.cpmk_id),
        mata_kuliah_id: Number(selectedMk.id),
        kode_sub_cpmk: kodeSub,
        deskripsi: values.deskripsi.trim(),
      });
      toast.success('Sub-CPMK berhasil disimpan');
      resetSub({
        cpmk_id: availableCpmks.length > 0 ? Number(availableCpmks[0].id) : 0,
        deskripsi: '',
      });
      setShowAddSub(false);
      refreshSubCpmkList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Sub-CPMK');
    } finally {
      setSavingSub(false);
    }
  };

  const subCpmkColumns: ColumnDef<any>[] = [
    {
      key: 'kode_sub_cpmk',
      label: 'Kode',
      render: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.kode_sub_cpmk}</span>,
    },
    {
      key: 'deskripsi',
      label: 'Rumusan',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.deskripsi}</span>,
    },
    {
      key: 'actions',
      label: 'Opsi',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Hapus Sub-CPMK',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeletingSubId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const handleConfirmDeleteSub = async () => {
    if (!deletingSubId) return;
    try {
      setDeletingSub(true);
      await siakadService.deleteSubCpmk(deletingSubId);
      toast.success('Sub-CPMK berhasil dihapus');
      setDeletingSubId(null);
      refreshSubCpmkList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus Sub-CPMK');
    } finally {
      setDeletingSub(false);
    }
  };

  // Sesi Pertemuan (Rencana Mingguan RPS) — daftar + hapus di halaman ini,
  // tambah/ubah di halaman form terpisah (form > 5 input wajib separate page).
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [sesiMeta, setSesiMeta] = useState<any>(null);
  const [loadingSesi, setLoadingSesi] = useState(false);
  const [sesiPage, setSesiPage] = useState(1);
  const [sesiLimit, setSesiLimit] = useState(16);
  const [deletingSesiId, setDeletingSesiId] = useState<number | null>(null);
  const [deletingSesi, setDeletingSesi] = useState(false);

  const refreshSesiList = useCallback(async () => {
    if (!rpsId || Number.isNaN(rpsId)) return;
    try {
      setLoadingSesi(true);
      const res = await siakadService.listRpsSesi(rpsId, { page: sesiPage, per_page: sesiLimit });
      const list: any[] = Array.isArray(res.data) ? res.data : [];
      setSesiList(list);
      setSesiMeta(res.meta || null);
    } catch {
      setSesiList([]);
      setSesiMeta(null);
    } finally {
      setLoadingSesi(false);
    }
  }, [rpsId, sesiPage, sesiLimit]);

  useEffect(() => {
    refreshSesiList();
  }, [refreshSesiList]);

  const totalBobotSesi = useMemo(() => {
    if (sesiMeta && sesiMeta.total_bobot !== undefined && sesiMeta.total_bobot !== null) {
      return Number(sesiMeta.total_bobot) || 0;
    }
    return sesiList.reduce((sum, s) => sum + (Number(s.bobot_penilaian) || 0), 0);
  }, [sesiList, sesiMeta]);

  const handleConfirmDeleteSesi = async () => {
    if (!deletingSesiId) return;
    try {
      setDeletingSesi(true);
      await siakadService.deleteRpsSesi(deletingSesiId);
      toast.success('Sesi pertemuan berhasil dihapus');
      setDeletingSesiId(null);
      refreshSesiList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus sesi pertemuan');
    } finally {
      setDeletingSesi(false);
    }
  };

  const sesiColumns: ColumnDef<any>[] = [
    {
      key: 'minggu_ke',
      label: 'Pertemuan Ke',
      align: 'center',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-900">{row.minggu_ke}</span>,
    },
    {
      key: 'kemampuan_akhir',
      label: 'Kemampuan Akhir (Sub-CPMK)',
      render: (row) => (
        <div className="space-y-1">
          {row.sub_cpmk?.kode_sub_cpmk || row.subCpmk?.kode_sub_cpmk ? (
            <span className="font-mono text-2xs font-bold text-slate-600 block">
              {row.sub_cpmk?.kode_sub_cpmk || row.subCpmk?.kode_sub_cpmk}
            </span>
          ) : null}
          <span className="text-xs text-slate-700 leading-relaxed block">{row.kemampuan_akhir || '-'}</span>
        </div>
      ),
    },
    {
      key: 'indikator_penilaian',
      label: 'Indikator',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.indikator_penilaian || '-'}</span>,
    },
    {
      key: 'kriteria_teknik',
      label: 'Kriteria & Teknik',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.kriteria_teknik || '-'}</span>,
    },
    {
      key: 'bentuk_luring',
      label: 'Luring',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.bentuk_luring || '-'}</span>,
    },
    {
      key: 'bentuk_daring',
      label: 'Daring',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.bentuk_daring || '-'}</span>,
    },
    {
      key: 'bahan_kajian',
      label: 'Materi Pembelajaran',
      render: (row) => <span className="text-xs text-slate-700 leading-relaxed">{row.bahan_kajian || '-'}</span>,
    },
    {
      key: 'bobot_penilaian',
      label: 'Bobot Penilaian',
      align: 'center',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-900">{Number(row.bobot_penilaian) || 0}</span>,
    },
    {
      key: 'actions',
      label: 'Opsi',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Ubah Sesi',
              icon: <Pencil size={14} />,
              onClick: () => router.push(`/siakad/obe/rps/${rpsId}/sesi/${row.id}/edit`),
            },
            {
              label: 'Hapus Sesi',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeletingSesiId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const onSubmit = async (values: FormValues) => {
    if (!selectedMk) return;
    const utama = pustakaList
      .filter((p) => p.jenis === 'utama' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');
    const pendukung = pustakaList
      .filter((p) => p.jenis === 'pendukung' && p.isi.trim())
      .map((p) => p.isi.trim())
      .join('\n');

    try {
      setSaving(true);
      await siakadService.storeRps({
        id: rpsId,
        mata_kuliah_id: Number(selectedMk.id),
        kode_rps: values.kode_rps,
        tanggal_penyusunan: values.tanggal_penyusunan,
        semester: values.semester_rps,
        tahun_ajaran: rps?.tahun_ajaran || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        dosen_bisa_edit: values.dosen_bisa_edit,
        deskripsi_singkat: values.deskripsi_singkat?.trim() || undefined,
        bahan_kajian_mk: values.bahan_kajian_mk?.trim() || undefined,
        mata_kuliah_syarat: values.mata_kuliah_syarat?.trim() || '-',
        jenis_pembelajaran: values.jenis_pembelajaran || 'Kuliah / Responsi',
        pustaka_utama: utama || undefined,
        pustaka_pendukung: pendukung || undefined,
        dosen_pengembang_id: rps?.dosen_pengembang_id ?? undefined,
        dosen_anggota_ids: values.dosen_anggota_ids || [],
        koordinator_rmk_id: values.koordinator_rmk_id || undefined,
        kaprodi_id: values.kaprodi_id || undefined,
      });
      toast.success('Dokumen RPS berhasil diperbarui');
      router.push('/siakad/obe/rps/kelola');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui dokumen RPS');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Dokumen RPS"
          description="Memuat data dokumen RPS..."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: '/siakad/obe/rps/kelola' },
            { label: 'Edit RPS' },
          ]}
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <span className="text-xs text-slate-500">Memuat dokumen RPS...</span>
        </div>
      </div>
    );
  }

  if (notFound || !rps) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Dokumen RPS"
          description="Dokumen RPS tidak ditemukan atau tidak dapat diakses."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: '/siakad/obe/rps/kelola' },
            { label: 'Edit RPS' },
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-sm text-slate-500">
            Dokumen RPS dengan ID <span className="font-mono font-bold">{rpsId || '-'}</span> tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Edit Dokumen RPS"
        description="Perubahan header, deskripsi, bahan kajian, dan pengesahan Rencana Pembelajaran Semester (RPS) mata kuliah."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS', href: '/siakad/obe/rps/kelola' },
          { label: 'Edit RPS' },
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
        {/* Kolom Kiri: 3/4 (lg:col-span-8) - Form Input Utama & Sub-CPMK Terpisah */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: Form Dokumen RPS (Header, Prasyarat, Deskripsi, Pengesahan) */}
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardBody className="space-y-6">
                {/* Section 1: Identitas Dokumen RPS */}
                <div className="space-y-4">
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

                {/* Section 2: Prasyarat & Metode Pembelajaran */}
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

                {/* Section 3: Deskripsi & Bahan Kajian */}
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

                {/* Section 4: Pengesahan Tim Pengajar & Pimpinan */}
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
                          defaultOptions={anggotaOptions}
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
                          defaultOptions={koordinatorOption ? [koordinatorOption] : []}
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
                          defaultOptions={kaprodiOption ? [kaprodiOption] : []}
                          value={field.value || null}
                          onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                          isClearable
                          error={errors.kaprodi_id?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Footer Tombol Simpan Dokumen RPS selalu di kanan */}
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

          {/* CARD 2: Pustaka (Referensi Utama & Pendukung) */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Library size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Pustaka</h3>
                    <p className="text-2xs text-slate-500">
                      Daftar buku, artikel ilmiah, modul, dan referensi pendukung mata kuliah.
                    </p>
                  </div>
                </div>

                {!showAddPustaka && (
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Plus size={14} />}
                    onClick={() => setShowAddPustaka(true)}
                    style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  >
                    Tambah Pustaka
                  </Button>
                )}
              </div>

              {/* Tabel Daftar Pustaka */}
              <DataTable
                columns={pustakaColumns}
                data={pustakaList}
                isLoading={false}
                emptyMessage="Belum ada pustaka yang ditambahkan untuk mata kuliah ini."
              />
            </CardBody>
          </Card>

          {/* CARD 3: Sub-CPMK (Mandiri / Terpisah di Luar Form Dokumen RPS) */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Sub-CPMK</h3>
                    <p className="text-2xs text-slate-500">
                      Kemampuan akhir tiap tahapan belajar (Sub-CPMK) <span className="text-slate-400">maksimal 14</span>
                    </p>
                  </div>
                </div>

                {!showAddSub && (
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      if (availableCpmks.length > 0) {
                        setValueSub('cpmk_id', Number(availableCpmks[0].id));
                      }
                      setShowAddSub(true);
                    }}
                    style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  >
                    Tambah Sub-CPMK
                  </Button>
                )}
              </div>

              {/* Tabel Daftar Sub-CPMK */}
              <DataTable
                columns={subCpmkColumns}
                data={subCpmkList}
                isLoading={loadingSub}
                emptyMessage="Belum ada Sub-CPMK yang ditambahkan untuk mata kuliah ini."
              />
            </CardBody>
          </Card>

          {/* CARD 4: Sesi Pertemuan (Rencana Mingguan RPS) */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Sesi Pertemuan</h3>
                    <p className="text-2xs text-slate-500">
                      Rencana pembelajaran tiap pertemuan: Sub-CPMK, penilaian, luring/daring, materi, dan bobot.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  icon={<Plus size={14} />}
                  onClick={() => router.push(`/siakad/obe/rps/${rpsId}/sesi/create`)}
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                >
                  Tambah Sesi
                </Button>
              </div>

              <p className="text-2xs text-slate-400">
                Kelompok penilaian: <span className="font-bold text-slate-500">Indikator</span> |{' '}
                <span className="font-bold text-slate-500">Kriteria &amp; Teknik</span> — Kelompok bentuk, metode,
                dan penugasan: <span className="font-bold text-slate-500">Luring</span> |{' '}
                <span className="font-bold text-slate-500">Daring</span>
              </p>

              {/* Tabel Daftar Sesi Pertemuan */}
              <DataTable
                columns={sesiColumns}
                data={sesiList}
                isLoading={loadingSesi}
                meta={sesiMeta}
                onPageChange={setSesiPage}
                onLimitChange={(l) => {
                  setSesiLimit(l);
                  setSesiPage(1);
                }}
                emptyMessage="Belum ada sesi pertemuan yang ditambahkan untuk dokumen RPS ini."
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <span className="text-2xs font-bold text-slate-500 uppercase">Total Bobot Sesi</span>
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    Math.abs(totalBobotSesi - 100) < 0.01
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {Math.round(totalBobotSesi * 100) / 100}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Kolom Kanan: 1/4 (lg:col-span-4) - Informasi Read-Only Sticky */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900">Identitas Mata Kuliah</h3>
                <span className="text-2xs text-slate-400 font-medium">Read-Only</span>
              </div>
              <RpsMkBanner mk={selectedMk} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900">Pemetaan CPL & CPMK</h3>
                <span className="text-2xs text-slate-400 font-medium">Kurikulum OBE</span>
              </div>
              <RpsCplCpmkTabs cplRows={cplRows} cpmkRows={cpmkRows} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal Popup Tambah Pustaka */}
      <Modal
        open={showAddPustaka}
        onClose={() => {
          setShowAddPustaka(false);
          resetPustaka();
        }}
        title="Tambah Pustaka"
      >
        <form onSubmit={handleSubmitPustaka(onPustakaSubmit)} noValidate className="space-y-4">
          <Controller
            name="jenis"
            control={controlPustaka}
            render={({ field }) => (
              <Select
                label="Jenis Pustaka *"
                placeholder="Pilih Jenis Pustaka"
                options={JENIS_PUSTAKA_OPTIONS}
                value={field.value}
                onChange={(opt: any) => {
                  const val = typeof opt === 'object' ? opt?.value : opt;
                  field.onChange(val || 'utama');
                }}
                error={errorsPustaka.jenis?.message}
              />
            )}
          />

          <Textarea
            label="Referensi / Judul Pustaka *"
            rows={3}
            placeholder="Tuliskan nama pengarang, tahun, judul buku/jurnal, penerbit, kota..."
            error={errorsPustaka.isi?.message}
            {...registerPustaka('isi')}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddPustaka(false);
                resetPustaka();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingPustaka}
            >
              Simpan Pustaka
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Popup Tambah Sub-CPMK */}
      <Modal
        open={showAddSub}
        onClose={() => {
          setShowAddSub(false);
          resetSub();
        }}
        title="Tambah Sub-CPMK"
      >
        <form onSubmit={handleSubmitSub(onSubCpmkSubmit)} noValidate className="space-y-4">
          <Controller
            name="cpmk_id"
            control={controlSub}
            render={({ field }) => (
              <Select
                label="Pilih CPMK Induk *"
                placeholder="Pilih CPMK"
                options={availableCpmks.map((c: any) => ({
                  value: c.id,
                  label: `${c.kode_cpmk || `CPMK #${c.id}`} - ${(c.deskripsi || '').substring(0, 50)}...`,
                }))}
                value={field.value ? String(field.value) : ''}
                onChange={(opt: any) => {
                  const val = typeof opt === 'object' ? opt?.value : opt;
                  field.onChange(val ? Number(val) : 0);
                }}
                error={errorsSub.cpmk_id?.message}
              />
            )}
          />

          <Textarea
            label="Rumusan Kemampuan Akhir (Sub-CPMK) *"
            rows={3}
            placeholder="Tuliskan rumusan kemampuan akhir tahapan belajar..."
            error={errorsSub.deskripsi?.message}
            {...registerSub('deskripsi')}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddSub(false);
                resetSub();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingSub}
            >
              Simpan Sub-CPMK
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingSesiId)}
        onClose={() => setDeletingSesiId(null)}
        onConfirm={handleConfirmDeleteSesi}
        title="Hapus Sesi Pertemuan?"
        message="Apakah Anda yakin ingin menghapus sesi pertemuan ini dari dokumen RPS?"
        isLoading={deletingSesi}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPustakaId)}
        onClose={() => setDeletingPustakaId(null)}
        onConfirm={handleConfirmDeletePustaka}
        title="Hapus Pustaka?"
        message="Apakah Anda yakin ingin menghapus referensi pustaka ini dari dokumen RPS?"
        isLoading={deletingPustaka}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSubId)}
        onClose={() => setDeletingSubId(null)}
        onConfirm={handleConfirmDeleteSub}
        title="Hapus Sub-CPMK?"
        message="Apakah Anda yakin ingin menghapus Sub-CPMK ini? Pastikan Sub-CPMK ini belum digunakan pada komponen penilaian."
        isLoading={deletingSub}
      />
    </div>
  );
}
