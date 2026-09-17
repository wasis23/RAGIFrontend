'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Layers, 
  CheckCircle2,
  TrendingUp,
  Award,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { 
  MasterKomponenGaji, 
  MasterSkalaGajiPokok, 
  JabatanFungsionalAkademik, 
  MasterBracketPph21 
} from '@/types/simpeg.types';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// ── ZOD SCHEMAS ─────────────────────────────────────────────

const komponenSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').toUpperCase(),
  nama: z.string().min(3, 'Nama komponen minimal 3 karakter'),
  jenis: z.enum(['pendapatan', 'potongan']),
  tipe_nilai: z.enum(['tetap', 'rumus_sks', 'rumus_kehadiran', 'rumus_pph21', 'persentase']),
  nilai_default: z.number().min(0, 'Nilai default tidak boleh negatif'),
  is_taxable: z.boolean(),
  is_active: z.boolean(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  keterangan: z.string().optional().nullable(),
});
type KomponenFormValues = z.infer<typeof komponenSchema>;

const skalaGajiSchema = z.object({
  nama_skala: z.string().min(3, 'Nama skala minimal 3 karakter'),
  golongan: z.string().optional().nullable(),
  masa_kerja_min_tahun: z.number().min(0, 'Minimal 0 tahun'),
  masa_kerja_max_tahun: z.number().min(0, 'Maksimal minimal 0 tahun'),
  nominal_gaji: z.number().min(0, 'Nominal gaji tidak boleh negatif'),
  keterangan: z.string().optional().nullable(),
  is_active: z.boolean(),
});
type SkalaGajiFormValues = z.infer<typeof skalaGajiSchema>;

const jafungTunjanganSchema = z.object({
  tunjangan_nominal: z.number().min(0, 'Nominal tidak boleh negatif'),
});
type JafungTunjanganFormValues = z.infer<typeof jafungTunjanganSchema>;

const bracketPph21Schema = z.object({
  penghasilan_bruto_min: z.number().min(0, 'Bruto min tidak boleh negatif'),
  penghasilan_bruto_max: z.number().nullable().optional(),
  tarif_persen: z.number().min(0, 'Tarif persen tidak boleh negatif').max(1, 'Maksimal 1 (100%)'),
  keterangan: z.string().optional().nullable(),
});
type BracketPph21FormValues = z.infer<typeof bracketPph21Schema>;

export default function MasterKomponenGajiPage() {
  const router = useRouter();
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('simpeg.payroll.manage');

  // Active Tab: 'komponen' | 'skala' | 'jafung' | 'pph21'
  const [activeTab, setActiveTab] = useState<'komponen' | 'skala' | 'jafung' | 'pph21'>('komponen');

  // ── TAB 1: MASTER KOMPONEN GAJI STATE ──
  const [loadingKomponen, setLoadingKomponen] = useState(true);
  const [komponenList, setKomponenList] = useState<MasterKomponenGaji[]>([]);
  const [searchKomponen, setSearchKomponen] = useState('');
  const [modalKomponenOpen, setModalKomponenOpen] = useState(false);
  const [editingKomponen, setEditingKomponen] = useState<MasterKomponenGaji | null>(null);
  const [deleteModalKomponen, setDeleteModalKomponen] = useState<{
    isOpen: boolean;
    item: MasterKomponenGaji | null;
    isLoading: boolean;
  }>({ isOpen: false, item: null, isLoading: false });

  // ── TAB 2: SKALA GAJI POKOK STATE ──
  const [loadingSkala, setLoadingSkala] = useState(false);
  const [skalaList, setSkalaList] = useState<MasterSkalaGajiPokok[]>([]);
  const [searchSkala, setSearchSkala] = useState('');
  const [modalSkalaOpen, setModalSkalaOpen] = useState(false);
  const [editingSkala, setEditingSkala] = useState<MasterSkalaGajiPokok | null>(null);
  const [deleteModalSkala, setDeleteModalSkala] = useState<{
    isOpen: boolean;
    item: MasterSkalaGajiPokok | null;
    isLoading: boolean;
  }>({ isOpen: false, item: null, isLoading: false });

  // ── TAB 3: TUNJANGAN JAFUNG STATE ──
  const [loadingJafung, setLoadingJafung] = useState(false);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [searchJafung, setSearchJafung] = useState('');
  const [modalJafungOpen, setModalJafungOpen] = useState(false);
  const [editingJafung, setEditingJafung] = useState<JabatanFungsionalAkademik | null>(null);

  // ── TAB 4: BRACKET PPH 21 STATE ──
  const [loadingPph21, setLoadingPph21] = useState(false);
  const [pph21List, setPph21List] = useState<MasterBracketPph21[]>([]);
  const [modalPph21Open, setModalPph21Open] = useState(false);
  const [editingPph21, setEditingPph21] = useState<MasterBracketPph21 | null>(null);

  // ── FORMS ──
  const formKomponen = useForm<KomponenFormValues>({
    resolver: zodResolver(komponenSchema),
    defaultValues: {
      kode: '',
      nama: '',
      jenis: 'pendapatan',
      tipe_nilai: 'tetap',
      nilai_default: 0,
      is_taxable: true,
      is_active: true,
      urutan: 1,
      keterangan: '',
    },
  });

  const formSkala = useForm<SkalaGajiFormValues>({
    resolver: zodResolver(skalaGajiSchema),
    defaultValues: {
      nama_skala: '',
      golongan: '',
      masa_kerja_min_tahun: 0,
      masa_kerja_max_tahun: 5,
      nominal_gaji: 4000000,
      keterangan: '',
      is_active: true,
    },
  });

  const formJafung = useForm<JafungTunjanganFormValues>({
    resolver: zodResolver(jafungTunjanganSchema),
    defaultValues: {
      tunjangan_nominal: 0,
    },
  });

  const formPph21 = useForm<BracketPph21FormValues>({
    resolver: zodResolver(bracketPph21Schema),
    defaultValues: {
      penghasilan_bruto_min: 0,
      penghasilan_bruto_max: null,
      tarif_persen: 0.005,
      keterangan: '',
    },
  });

  // ── FETCH HANDLERS ──

  const loadKomponen = useCallback(async () => {
    try {
      setLoadingKomponen(true);
      const res: any = await simpegService.getKomponenGajiList({ search: searchKomponen });
      setKomponenList(res?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master komponen gaji');
    } finally {
      setLoadingKomponen(false);
    }
  }, [searchKomponen]);

  const loadSkala = useCallback(async () => {
    try {
      setLoadingSkala(true);
      const res: any = await simpegService.getSkalaGajiList({ search: searchSkala });
      setSkalaList(res?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat skala gaji pokok');
    } finally {
      setLoadingSkala(false);
    }
  }, [searchSkala]);

  const loadJafung = useCallback(async () => {
    try {
      setLoadingJafung(true);
      const res: any = await simpegService.getJafungTunjanganList({ search: searchJafung });
      setJafungList(res?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat tunjangan fungsional');
    } finally {
      setLoadingJafung(false);
    }
  }, [searchJafung]);

  const loadPph21 = useCallback(async () => {
    try {
      setLoadingPph21(true);
      const res: any = await simpegService.getBracketPph21List();
      setPph21List(res?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat tarif PPh 21');
    } finally {
      setLoadingPph21(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'komponen') loadKomponen();
    else if (activeTab === 'skala') loadSkala();
    else if (activeTab === 'jafung') loadJafung();
    else if (activeTab === 'pph21') loadPph21();
  }, [activeTab, loadKomponen, loadSkala, loadJafung, loadPph21]);

  // ── ACTION HANDLERS: KOMPONEN ──

  const handleOpenCreateKomponen = () => {
    setEditingKomponen(null);
    formKomponen.reset({
      kode: '',
      nama: '',
      jenis: 'pendapatan',
      tipe_nilai: 'tetap',
      nilai_default: 0,
      is_taxable: true,
      is_active: true,
      urutan: (komponenList.length || 0) + 1,
      keterangan: '',
    });
    setModalKomponenOpen(true);
  };

  const handleOpenEditKomponen = (item: MasterKomponenGaji) => {
    setEditingKomponen(item);
    formKomponen.reset({
      kode: item.kode,
      nama: item.nama,
      jenis: item.jenis,
      tipe_nilai: item.tipe_nilai,
      nilai_default: item.nilai_default,
      is_taxable: item.is_taxable,
      is_active: item.is_active,
      urutan: item.urutan,
      keterangan: item.keterangan || '',
    });
    setModalKomponenOpen(true);
  };

  const onSubmitKomponen = async (values: KomponenFormValues) => {
    try {
      if (editingKomponen) {
        await simpegService.updateKomponenGaji(editingKomponen.id, values);
        toast.success(`Komponen '${values.nama}' berhasil diperbarui`);
      } else {
        await simpegService.createKomponenGaji(values);
        toast.success(`Komponen '${values.nama}' berhasil ditambahkan`);
      }
      setModalKomponenOpen(false);
      loadKomponen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan komponen gaji');
    }
  };

  const handleConfirmDeleteKomponen = async () => {
    if (!deleteModalKomponen.item) return;
    try {
      setDeleteModalKomponen((prev) => ({ ...prev, isLoading: true }));
      await simpegService.deleteKomponenGaji(deleteModalKomponen.item.id);
      toast.success(`Komponen '${deleteModalKomponen.item.nama}' berhasil dihapus`);
      setDeleteModalKomponen({ isOpen: false, item: null, isLoading: false });
      loadKomponen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus komponen gaji');
      setDeleteModalKomponen((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ── ACTION HANDLERS: SKALA GAJI ──

  const handleOpenCreateSkala = () => {
    setEditingSkala(null);
    formSkala.reset({
      nama_skala: '',
      golongan: '',
      masa_kerja_min_tahun: 0,
      masa_kerja_max_tahun: 5,
      nominal_gaji: 4000000,
      keterangan: '',
      is_active: true,
    });
    setModalSkalaOpen(true);
  };

  const handleOpenEditSkala = (item: MasterSkalaGajiPokok) => {
    setEditingSkala(item);
    formSkala.reset({
      nama_skala: item.nama_skala,
      golongan: item.golongan || '',
      masa_kerja_min_tahun: item.masa_kerja_min_tahun,
      masa_kerja_max_tahun: item.masa_kerja_max_tahun,
      nominal_gaji: item.nominal_gaji,
      keterangan: item.keterangan || '',
      is_active: item.is_active,
    });
    setModalSkalaOpen(true);
  };

  const onSubmitSkala = async (values: SkalaGajiFormValues) => {
    try {
      const payload = {
        ...values,
        golongan: values.golongan ? values.golongan : null,
      };
      if (editingSkala) {
        await simpegService.updateSkalaGaji(editingSkala.id, payload);
        toast.success(`Skala gaji '${values.nama_skala}' berhasil diperbarui`);
      } else {
        await simpegService.createSkalaGaji(payload);
        toast.success(`Skala gaji '${values.nama_skala}' berhasil ditambahkan`);
      }
      setModalSkalaOpen(false);
      loadSkala();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan skala gaji');
    }
  };

  const handleConfirmDeleteSkala = async () => {
    if (!deleteModalSkala.item) return;
    try {
      setDeleteModalSkala((prev) => ({ ...prev, isLoading: true }));
      await simpegService.deleteSkalaGaji(deleteModalSkala.item.id);
      toast.success(`Skala gaji '${deleteModalSkala.item.nama_skala}' berhasil dihapus`);
      setDeleteModalSkala({ isOpen: false, item: null, isLoading: false });
      loadSkala();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus skala gaji');
      setDeleteModalSkala((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ── ACTION HANDLERS: JAFUNG ──

  const handleOpenEditJafung = (item: JabatanFungsionalAkademik) => {
    setEditingJafung(item);
    formJafung.reset({
      tunjangan_nominal: item.tunjangan_nominal || 0,
    });
    setModalJafungOpen(true);
  };

  const onSubmitJafung = async (values: JafungTunjanganFormValues) => {
    if (!editingJafung) return;
    try {
      await simpegService.updateJafungTunjangan(editingJafung.id, values.tunjangan_nominal);
      toast.success(`Tunjangan untuk '${editingJafung.nama}' berhasil diperbarui`);
      setModalJafungOpen(false);
      loadJafung();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui tunjangan jafung');
    }
  };

  // ── ACTION HANDLERS: PPH 21 ──

  const handleOpenEditPph21 = (item: MasterBracketPph21) => {
    setEditingPph21(item);
    formPph21.reset({
      penghasilan_bruto_min: item.penghasilan_bruto_min,
      penghasilan_bruto_max: item.penghasilan_bruto_max,
      tarif_persen: item.tarif_persen,
      keterangan: item.keterangan || '',
    });
    setModalPph21Open(true);
  };

  const onSubmitPph21 = async (values: BracketPph21FormValues) => {
    if (!editingPph21) return;
    try {
      await simpegService.updateBracketPph21(editingPph21.id, values);
      toast.success('Tarif PPh 21 berhasil diperbarui');
      setModalPph21Open(false);
      loadPph21();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui tarif PPh 21');
    }
  };

  // ── TABLE COLUMNS: KOMPONEN ──

  const columnsKomponen: ColumnDef<MasterKomponenGaji>[] = [
    {
      key: 'urutan',
      label: 'No',
      render: (row) => <span className="font-bold font-mono text-slate-500">#{row.urutan}</span>,
    },
    {
      key: 'nama',
      label: 'Nama Komponen & Kode',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.nama}</span>
          <span className="text-[11px] font-mono text-slate-500">Kode: {row.kode}</span>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => (
        <Badge variant={row.jenis === 'pendapatan' ? 'green' : 'red'} className="uppercase font-bold text-xs">
          {row.jenis}
        </Badge>
      ),
    },
    {
      key: 'tipe_nilai',
      label: 'Metode / Rumus',
      render: (row) => {
        const labels: Record<string, string> = {
          tetap: 'Nominal Tetap Bulanan',
          rumus_sks: 'Formula SKS Perkuliahan (SIAKAD)',
          rumus_kehadiran: 'Log Presensi Hadir/Terlambat (SIMPEG)',
          rumus_pph21: 'Formula PPh 21 TER Dinamis',
          persentase: 'Persentase Gaji',
        };
        return (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
            {labels[row.tipe_nilai] || row.tipe_nilai}
          </span>
        );
      },
    },
    {
      key: 'nilai_default',
      label: 'Tarif Default',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800">
          {row.tipe_nilai === 'rumus_sks'
            ? `${formatRupiah(row.nilai_default)} / SKS`
            : row.tipe_nilai === 'rumus_kehadiran'
            ? `${formatRupiah(row.nilai_default)} / Hari / Kejadian`
            : row.tipe_nilai === 'rumus_pph21'
            ? 'Dinamis (Bracket TER)'
            : formatRupiah(row.nilai_default)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Ubah Konfigurasi',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditKomponen(row),
                },
                {
                  label: 'Hapus Komponen',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => setDeleteModalKomponen({ isOpen: true, item: row, isLoading: false }),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: SKALA GAJI ──

  const columnsSkala: ColumnDef<MasterSkalaGajiPokok>[] = [
    {
      key: 'nama_skala',
      label: 'Nama Skala Jenjang',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.nama_skala}</span>
          {row.keterangan && <span className="text-xs text-slate-500">{row.keterangan}</span>}
        </div>
      ),
    },
    {
      key: 'golongan',
      label: 'Golongan / Pangkat',
      render: (row) => (
        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {row.golongan ? row.golongan.toUpperCase() : 'UMUM / TENDIK'}
        </span>
      ),
    },
    {
      key: 'masa_kerja',
      label: 'Rentang Masa Kerja',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.masa_kerja_min_tahun} s.d {row.masa_kerja_max_tahun >= 90 ? 'ke atas' : `${row.masa_kerja_max_tahun} Tahun`}
        </span>
      ),
    },
    {
      key: 'nominal_gaji',
      label: 'Gaji Pokok',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-sm">
          {formatRupiah(row.nominal_gaji)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Ubah Skala Gaji',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditSkala(row),
                },
                {
                  label: 'Hapus Skala',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => setDeleteModalSkala({ isOpen: true, item: row, isLoading: false }),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: JAFUNG ──

  const columnsJafung: ColumnDef<JabatanFungsionalAkademik>[] = [
    {
      key: 'nama',
      label: 'Jabatan Fungsional Akademik',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.nama}</span>
          <span className="text-xs text-slate-500 font-mono">Golongan: {row.golongan}</span>
        </div>
      ),
    },
    {
      key: 'angka_kredit',
      label: 'Syarat Angka Kredit (KUM)',
      render: (row) => (
        <span className="text-sm text-slate-600 font-mono">
          {row.angka_kredit_min ?? 0} - {row.angka_kredit_max ?? 'Tak Terbatas'}
        </span>
      ),
    },
    {
      key: 'tunjangan_nominal',
      label: 'Nominal Tunjangan Fungsional',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-base">
          {formatRupiah(row.tunjangan_nominal || 0)} / Bulan
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 size={14} />}
              onClick={() => handleOpenEditJafung(row)}
            >
              Ubah Tunjangan
            </Button>
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: PPH 21 ──

  const columnsPph21: ColumnDef<MasterBracketPph21>[] = [
    {
      key: 'kategori',
      label: 'Kategori / Golongan',
      render: (row) => <Badge variant="blue">{row.kategori}</Badge>,
    },
    {
      key: 'rentang_bruto',
      label: 'Rentang Penghasilan Bruto Sebulan',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-slate-800">
          {formatRupiah(row.penghasilan_bruto_min)} s.d {row.penghasilan_bruto_max ? formatRupiah(row.penghasilan_bruto_max) : 'ke atas'}
        </span>
      ),
    },
    {
      key: 'tarif_persen',
      label: 'Tarif Pajak (TER)',
      render: (row) => (
        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-sm font-mono">
          {(row.tarif_persen * 100).toFixed(2)} %
        </span>
      ),
    },
    {
      key: 'keterangan',
      label: 'Keterangan',
      render: (row) => <span className="text-xs text-slate-500">{row.keterangan || '-'}</span>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 size={14} />}
              onClick={() => handleOpenEditPph21(row)}
            >
              Ubah Tarif
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Komponen & Variabel Penggajian"
        description="Pengaturan dinamis gaji pokok masa kerja, tunjangan jafung dosen, honor SKS, insentif presensi, dan bracket PPh 21"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/payroll')}
            >
              Kembali ke Payroll
            </Button>
            {canManage && activeTab === 'komponen' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateKomponen}
              >
                Tambah Komponen
              </Button>
            )}
            {canManage && activeTab === 'skala' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateSkala}
              >
                Tambah Skala Gaji
              </Button>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('komponen')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'komponen'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} /> Komponen & Tarif Variabel
        </button>
        <button
          onClick={() => setActiveTab('skala')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'skala'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} /> Skala Gaji Pokok (Masa Kerja)
        </button>
        <button
          onClick={() => setActiveTab('jafung')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'jafung'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Award size={16} /> Tunjangan Fungsional Dosen
        </button>
        <button
          onClick={() => setActiveTab('pph21')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'pph21'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Percent size={16} /> Bracket Pajak PPh 21 (TER)
        </button>
      </div>

      {/* ── TAB 1: KOMPONEN GAJI ── */}
      {activeTab === 'komponen' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari nama komponen atau kode (misal: SKS, TRANSPORT, TERLAMBAT, BPJS)..."
              value={searchKomponen}
              onChange={(e) => setSearchKomponen(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsKomponen}
            data={komponenList}
            isLoading={loadingKomponen}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Layers size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada master komponen gaji yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 2: SKALA GAJI POKOK (MASA KERJA) ── */}
      {activeTab === 'skala' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari nama skala jenjang atau golongan..."
              value={searchSkala}
              onChange={(e) => setSearchSkala(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsSkala}
            data={skalaList}
            isLoading={loadingSkala}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada matriks skala gaji pokok yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 3: TUNJANGAN JAFUNG ── */}
      {activeTab === 'jafung' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari jabatan fungsional (misal: Guru Besar, Lektor Kepala, Asisten Ahli)..."
              value={searchJafung}
              onChange={(e) => setSearchJafung(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsJafung}
            data={jafungList}
            isLoading={loadingJafung}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Award size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada jabatan fungsional akademik yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 4: BRACKET PPH 21 ── */}
      {activeTab === 'pph21' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Percent size={24} className="text-amber-600" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Tarif Efektif Rata-Rata (TER) Pajak PPh 21 Bulanan</p>
                <p className="text-xs text-slate-500">Tarif dipotong otomatis dari total bruto gaji per bulan sesuai PP No. 58/2023.</p>
              </div>
            </div>
          </div>

          <DataTable
            columns={columnsPph21}
            data={pph21List}
            isLoading={loadingPph21}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Percent size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada tier tarif PPh 21 yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── MODAL FORM: KOMPONEN GAJI ── */}
      <Modal
        open={modalKomponenOpen}
        onClose={() => setModalKomponenOpen(false)}
        title={editingKomponen ? `Ubah Komponen: ${editingKomponen.nama}` : 'Tambah Master Komponen Gaji Baru'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalKomponenOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={formKomponen.formState.isSubmitting}
              disabled={formKomponen.formState.isSubmitting}
              onClick={formKomponen.handleSubmit(onSubmitKomponen)}
            >
              <CheckCircle2 size={16} /> Simpan Komponen
            </Button>
          </div>
        }
      >
        <form onSubmit={formKomponen.handleSubmit(onSubmitKomponen)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Komponen (Unik)"
              placeholder="Contoh: HONOR_SKS"
              {...formKomponen.register('kode')}
              error={formKomponen.formState.errors.kode?.message}
              required
            />
            <Input
              label="Nama Komponen"
              placeholder="Contoh: Honor Mengajar SKS"
              {...formKomponen.register('nama')}
              error={formKomponen.formState.errors.nama?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Jenis Komponen"
              value={formKomponen.watch('jenis')}
              onChange={(val) => formKomponen.setValue('jenis', val as 'pendapatan' | 'potongan')}
              options={[
                { value: 'pendapatan', label: 'Pendapatan / Tunjangan (+)' },
                { value: 'potongan', label: 'Potongan Pajak / Iuran / Denda (-)' },
              ]}
            />
            <Select
              label="Metode / Rumus Nilai"
              value={formKomponen.watch('tipe_nilai')}
              onChange={(val) => formKomponen.setValue('tipe_nilai', val as any)}
              options={[
                { value: 'tetap', label: 'Nominal Tetap Bulanan' },
                { value: 'rumus_sks', label: 'Formula Total SKS Mengajar (SIAKAD)' },
                { value: 'rumus_kehadiran', label: 'Formula Log Presensi (SIMPEG)' },
                { value: 'rumus_pph21', label: 'Formula Pajak PPh 21 (TER)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tarif / Nilai Default (Rp)"
              type="number"
              placeholder="0"
              {...formKomponen.register('nilai_default', { valueAsNumber: true })}
              error={formKomponen.formState.errors.nilai_default?.message}
              required
            />
            <Input
              label="Urutan Tampil"
              type="number"
              placeholder="1"
              {...formKomponen.register('urutan', { valueAsNumber: true })}
              error={formKomponen.formState.errors.urutan?.message}
              required
            />
          </div>

          <Input
            label="Keterangan Tambahan (Opsional)"
            placeholder="Penjelasan dasar komponen atau peraturan kampus..."
            {...formKomponen.register('keterangan')}
          />
        </form>
      </Modal>

      {/* ── MODAL FORM: SKALA GAJI POKOK ── */}
      <Modal
        open={modalSkalaOpen}
        onClose={() => setModalSkalaOpen(false)}
        title={editingSkala ? `Ubah Skala Gaji: ${editingSkala.nama_skala}` : 'Tambah Skala Gaji Pokok Baru'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalSkalaOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={formSkala.formState.isSubmitting}
              disabled={formSkala.formState.isSubmitting}
              onClick={formSkala.handleSubmit(onSubmitSkala)}
            >
              <CheckCircle2 size={16} /> Simpan Skala Gaji
            </Button>
          </div>
        }
      >
        <form onSubmit={formSkala.handleSubmit(onSubmitSkala)} className="space-y-4">
          <Input
            label="Nama Skala Jenjang"
            placeholder="Contoh: Lektor (Masa Kerja 0-3 Thn)"
            {...formSkala.register('nama_skala')}
            error={formSkala.formState.errors.nama_skala?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Golongan (Opsional)"
              placeholder="Contoh: lektor, asisten_ahli, atau kosongkan"
              {...formSkala.register('golongan')}
            />
            <Input
              label="Nominal Gaji Pokok (Rp)"
              type="number"
              placeholder="0"
              {...formSkala.register('nominal_gaji', { valueAsNumber: true })}
              error={formSkala.formState.errors.nominal_gaji?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Batas Bawah Masa Kerja (Tahun)"
              type="number"
              placeholder="0"
              {...formSkala.register('masa_kerja_min_tahun', { valueAsNumber: true })}
              error={formSkala.formState.errors.masa_kerja_min_tahun?.message}
              required
            />
            <Input
              label="Batas Atas Masa Kerja (Tahun)"
              type="number"
              placeholder="5"
              {...formSkala.register('masa_kerja_max_tahun', { valueAsNumber: true })}
              error={formSkala.formState.errors.masa_kerja_max_tahun?.message}
              required
            />
          </div>

          <Input
            label="Keterangan (Opsional)"
            placeholder="Keterangan atau dasar SK penetapan gaji pokok..."
            {...formSkala.register('keterangan')}
          />
        </form>
      </Modal>

      {/* ── MODAL FORM: TUNJANGAN JAFUNG ── */}
      <Modal
        open={modalJafungOpen}
        onClose={() => setModalJafungOpen(false)}
        title={editingJafung ? `Ubah Tunjangan: ${editingJafung.nama}` : 'Ubah Tunjangan Jafung'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalJafungOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={formJafung.formState.isSubmitting}
              disabled={formJafung.formState.isSubmitting}
              onClick={formJafung.handleSubmit(onSubmitJafung)}
            >
              <CheckCircle2 size={16} /> Simpan Tunjangan
            </Button>
          </div>
        }
      >
        <form onSubmit={formJafung.handleSubmit(onSubmitJafung)} className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">{editingJafung?.nama}</p>
            <p className="text-xs text-slate-500 mb-4 font-mono">Golongan: {editingJafung?.golongan}</p>
          </div>

          <Input
            label="Nominal Tunjangan Fungsional per Bulan (Rp)"
            type="number"
            placeholder="0"
            {...formJafung.register('tunjangan_nominal', { valueAsNumber: true })}
            error={formJafung.formState.errors.tunjangan_nominal?.message}
            required
          />
        </form>
      </Modal>

      {/* ── MODAL FORM: BRACKET PPH 21 ── */}
      <Modal
        open={modalPph21Open}
        onClose={() => setModalPph21Open(false)}
        title="Ubah Tarif Bracket PPh 21"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalPph21Open(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={formPph21.formState.isSubmitting}
              disabled={formPph21.formState.isSubmitting}
              onClick={formPph21.handleSubmit(onSubmitPph21)}
            >
              <CheckCircle2 size={16} /> Simpan Tarif
            </Button>
          </div>
        }
      >
        <form onSubmit={formPph21.handleSubmit(onSubmitPph21)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bruto Minimum (Rp)"
              type="number"
              {...formPph21.register('penghasilan_bruto_min', { valueAsNumber: true })}
              error={formPph21.formState.errors.penghasilan_bruto_min?.message}
              required
            />
            <Input
              label="Bruto Maksimum (Rp, kosongkan jika tak terbatas)"
              type="number"
              {...formPph21.register('penghasilan_bruto_max', { 
                setValueAs: (v) => (v === '' || v === null || isNaN(v) ? null : Number(v))
              })}
            />
          </div>

          <Input
            label="Tarif Pajak Desimal (Contoh: 0.0150 untuk 1.5%)"
            type="number"
            step="0.0001"
            {...formPph21.register('tarif_persen', { valueAsNumber: true })}
            error={formPph21.formState.errors.tarif_persen?.message}
            required
          />

          <Input
            label="Keterangan"
            placeholder="Deskripsi tier pajak..."
            {...formPph21.register('keterangan')}
          />
        </form>
      </Modal>

      {/* ── CONFIRM DIALOG: DELETE KOMPONEN ── */}
      <ConfirmDialog
        isOpen={deleteModalKomponen.isOpen}
        onClose={() => setDeleteModalKomponen({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDeleteKomponen}
        isLoading={deleteModalKomponen.isLoading}
        title="Hapus Komponen Gaji"
        message={
          <span>
            Apakah Anda yakin ingin menghapus komponen <strong>{deleteModalKomponen.item?.nama}</strong>? Seluruh formula yang menggunakannya akan terpengaruh.
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* ── CONFIRM DIALOG: DELETE SKALA GAJI ── */}
      <ConfirmDialog
        isOpen={deleteModalSkala.isOpen}
        onClose={() => setDeleteModalSkala({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDeleteSkala}
        isLoading={deleteModalSkala.isLoading}
        title="Hapus Skala Gaji Pokok"
        message={
          <span>
            Apakah Anda yakin ingin menghapus skala gaji <strong>{deleteModalSkala.item?.nama_skala}</strong>?
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
