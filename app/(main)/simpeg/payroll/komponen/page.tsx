'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Filter, 
  ToggleLeft, 
  ToggleRight, 
  UserCheck, 
  UserX, 
  Sliders, 
  Users, 
  Clock 
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { 
  MasterKomponenGaji
} from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  SORT_ORDER_OPTIONS, 
  JENIS_PEGAWAI_OPTIONS, 
  JENIS_KOMPONEN_OPTIONS, 
  JENIS_KOMPONEN_FORM_OPTIONS,
  TIPE_NILAI_KOMPONEN_OPTIONS,
  TIPE_NILAI_FILTER_OPTIONS,
  STATUS_VISIBILITAS_KOLOM_OPTIONS,
  SORT_BY_PEGAWAI_OPTIONS,
  SORT_BY_KOMPONEN_OPTIONS,
  STATUS_ABSENSI_OPTIONS 
} from '@/lib/constants';

// ── ZOD SCHEMAS ─────────────────────────────────────────────

const komponenSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').toUpperCase(),
  nama: z.string().min(3, 'Nama komponen minimal 3 karakter'),
  jenis: z.enum(['pendapatan', 'potongan']),
  tipe_nilai: z.enum(['tetap', 'rumus_sks', 'rumus_kehadiran', 'rumus_pph21', 'persentase']),
  nilai_default: z.number().min(0, 'Nilai default tidak boleh negatif'),
  is_taxable: z.boolean(),
  is_active: z.boolean(),
  is_kolom_aktif: z.boolean(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  keterangan: z.string().optional().nullable(),
});
type KomponenFormValues = z.infer<typeof komponenSchema>;

export default function MasterKomponenGajiPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('simpeg.payroll.manage');

  // Active Tab: 'matriks' (Tab 1) | 'kolom' (Tab 2) | 'absensi' (Tab 3)
  const [activeTab, setActiveTab] = useState<'matriks' | 'kolom' | 'absensi'>('matriks');

  // ── TAB 1: MATRIKS NOMINAL PEGAWAI STATE ──
  const [loadingMatriks, setLoadingMatriks] = useState(true);
  const [pegawaiMatriksList, setPegawaiMatriksList] = useState<any[]>([]);
  const [activeColumns, setActiveColumns] = useState<MasterKomponenGaji[]>([]);
  const [matriksMeta, setMatriksMeta] = useState<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  const [searchMatriks, setSearchMatriks] = useState('');
  const [tempSearchMatriks, setTempSearchMatriks] = useState('');
  const [filterUnitKerja, setFilterUnitKerja] = useState('');
  const [tempFilterUnitKerja, setTempFilterUnitKerja] = useState('');
  const [filterJenisPegawai, setFilterJenisPegawai] = useState('');
  const [tempFilterJenisPegawai, setTempFilterJenisPegawai] = useState('');
  const [sortByMatriks, setSortByMatriks] = useState('nama_lengkap');
  const [tempSortByMatriks, setTempSortByMatriks] = useState('nama_lengkap');
  const [sortDirMatriks, setSortDirMatriks] = useState<'asc' | 'desc'>('asc');
  const [tempSortDirMatriks, setTempSortDirMatriks] = useState<'asc' | 'desc'>('asc');
  const [showFilterMatriks, setShowFilterMatriks] = useState(false);

  // ── TAB 2: MANAJEMEN KOLOM KOMPONEN STATE ──
  const [loadingKomponen, setLoadingKomponen] = useState(true);
  const [komponenList, setKomponenList] = useState<MasterKomponenGaji[]>([]);
  const [komponenMeta, setKomponenMeta] = useState<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  const [searchKomponen, setSearchKomponen] = useState('');
  const [tempSearchKomponen, setTempSearchKomponen] = useState('');
  const [filterJenisKomponen, setFilterJenisKomponen] = useState('');
  const [tempFilterJenisKomponen, setTempFilterJenisKomponen] = useState('');
  const [filterTipeNilaiKomponen, setFilterTipeNilaiKomponen] = useState('');
  const [tempFilterTipeNilaiKomponen, setTempFilterTipeNilaiKomponen] = useState('');
  const [filterKolomAktif, setFilterKolomAktif] = useState('');
  const [tempFilterKolomAktif, setTempFilterKolomAktif] = useState('');
  const [sortByKomponen, setSortByKomponen] = useState('urutan');
  const [tempSortByKomponen, setTempSortByKomponen] = useState('urutan');
  const [sortDirKomponen, setSortDirKomponen] = useState<'asc' | 'desc'>('asc');
  const [tempSortDirKomponen, setTempSortDirKomponen] = useState<'asc' | 'desc'>('asc');
  const [showFilterKomponen, setShowFilterKomponen] = useState(false);
  const [modalKomponenOpen, setModalKomponenOpen] = useState(false);
  const [editingKomponen, setEditingKomponen] = useState<MasterKomponenGaji | null>(null);
  const [deleteModalKomponen, setDeleteModalKomponen] = useState<{
    isOpen: boolean;
    item: MasterKomponenGaji | null;
    isLoading: boolean;
  }>({ isOpen: false, item: null, isLoading: false });

  // ── TAB 3: PLOTING TERDAMPAK ABSENSI STATE ──
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);
  const [pegawaiAbsensiList, setPegawaiAbsensiList] = useState<any[]>([]);
  const [absensiMeta, setAbsensiMeta] = useState<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  const [searchAbsensi, setSearchAbsensi] = useState('');
  const [tempSearchAbsensi, setTempSearchAbsensi] = useState('');
  const [filterStatusAbsensi, setFilterStatusAbsensi] = useState('');
  const [tempFilterStatusAbsensi, setTempFilterStatusAbsensi] = useState('');
  const [sortByAbsensi, setSortByAbsensi] = useState('nama_lengkap');
  const [tempSortByAbsensi, setTempSortByAbsensi] = useState('nama_lengkap');
  const [sortDirAbsensi, setSortDirAbsensi] = useState<'asc' | 'desc'>('asc');
  const [tempSortDirAbsensi, setTempSortDirAbsensi] = useState<'asc' | 'desc'>('asc');
  const [showFilterAbsensi, setShowFilterAbsensi] = useState(false);
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

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
      is_kolom_aktif: true,
      urutan: 1,
      keterangan: '',
    },
  });

  // ── FETCH HANDLERS ──

  // 1. Fetch Matriks Pegawai (Tab 1)
  const loadMatriks = useCallback(async (page = 1) => {
    try {
      setLoadingMatriks(true);
      const params: Record<string, any> = {
        page,
        per_page: matriksMeta.per_page,
        sort_by: sortByMatriks,
        sort_order: sortDirMatriks,
      };
      if (searchMatriks) params.search = searchMatriks;
      if (filterUnitKerja) params.unit_kerja_id = filterUnitKerja;
      if (filterJenisPegawai) params.jenis_pegawai = filterJenisPegawai;

      const res: any = await simpegService.getPegawaiMatriksGaji(params);
      const data = res?.data || {};
      setPegawaiMatriksList(data?.pegawai || []);
      setActiveColumns(data?.active_columns || []);

      if (res?.meta) {
        setMatriksMeta({
          current_page: res.meta.current_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          last_page: res.meta.last_page,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat matriks komponen pegawai');
    } finally {
      setLoadingMatriks(false);
    }
  }, [searchMatriks, filterUnitKerja, filterJenisPegawai, sortByMatriks, sortDirMatriks, matriksMeta.per_page]);

  // 2. Fetch Komponen Kolom (Tab 2)
  const loadKomponen = useCallback(async (page = 1) => {
    try {
      setLoadingKomponen(true);
      const params: Record<string, any> = {
        page,
        per_page: komponenMeta.per_page,
        sort_by: sortByKomponen,
        sort_order: sortDirKomponen,
      };
      if (searchKomponen) params.search = searchKomponen;
      if (filterJenisKomponen) params.jenis = filterJenisKomponen;
      if (filterTipeNilaiKomponen) params.tipe_nilai = filterTipeNilaiKomponen;
      if (filterKolomAktif !== '') params.is_kolom_aktif = filterKolomAktif;

      const res: any = await simpegService.getKomponenGajiList(params);
      setKomponenList(res?.data || []);
      if (res?.meta) {
        setKomponenMeta({
          current_page: res.meta.current_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          last_page: res.meta.last_page,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master komponen gaji');
    } finally {
      setLoadingKomponen(false);
    }
  }, [searchKomponen, filterJenisKomponen, filterTipeNilaiKomponen, filterKolomAktif, sortByKomponen, sortDirKomponen, komponenMeta.per_page]);

  // 3. Fetch Pegawai untuk Ploting Absensi (Tab 3)
  const loadPegawaiAbsensi = useCallback(async (page = 1) => {
    try {
      setLoadingAbsensi(true);
      const params: Record<string, any> = {
        page,
        per_page: absensiMeta.per_page,
        sort_by: sortByAbsensi,
        sort_order: sortDirAbsensi,
      };
      if (searchAbsensi) params.search = searchAbsensi;
      if (filterStatusAbsensi !== '') {
        params.terdampak_absensi = filterStatusAbsensi;
      }

      const res: any = await simpegService.getPegawaiMatriksGaji(params);
      const data = res?.data || {};
      setPegawaiAbsensiList(data?.pegawai || []);

      if (res?.meta) {
        setAbsensiMeta({
          current_page: res.meta.current_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          last_page: res.meta.last_page,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat daftar ploting absensi pegawai');
    } finally {
      setLoadingAbsensi(false);
    }
  }, [searchAbsensi, filterStatusAbsensi, sortByAbsensi, sortDirAbsensi, absensiMeta.per_page]);

  useEffect(() => {
    if (activeTab === 'matriks') {
      loadMatriks(1);
    } else if (activeTab === 'kolom') {
      loadKomponen();
    } else if (activeTab === 'absensi') {
      loadPegawaiAbsensi(1);
    }
  }, [activeTab, loadMatriks, loadKomponen, loadPegawaiAbsensi]);

  // Load options unit kerja untuk AsyncSelect
  const loadUnitKerjaOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getUnitKerjaList({ search: inputValue, per_page: 50 });
      const items = res?.data || [];
      return items.map((u: any) => ({
        value: String(u.id),
        label: u.nama,
      }));
    } catch {
      return [];
    }
  }, []);

  // ── TAB 1 ACTIONS ──
  const handleApplyFilterMatriks = () => {
    setSearchMatriks(tempSearchMatriks);
    setFilterUnitKerja(tempFilterUnitKerja);
    setFilterJenisPegawai(tempFilterJenisPegawai);
    setSortByMatriks(tempSortByMatriks);
    setSortDirMatriks(tempSortDirMatriks);
    setShowFilterMatriks(false);
  };

  const handleResetFilterMatriks = () => {
    setTempSearchMatriks('');
    setTempFilterUnitKerja('');
    setTempFilterJenisPegawai('');
    setTempSortByMatriks('nama_lengkap');
    setTempSortDirMatriks('asc');
    setSearchMatriks('');
    setFilterUnitKerja('');
    setFilterJenisPegawai('');
    setSortByMatriks('nama_lengkap');
    setSortDirMatriks('asc');
    setShowFilterMatriks(false);
  };

  // ── TAB 2 ACTIONS (KOMPONEN / KOLOM) ──
  const handleApplyFilterKomponen = () => {
    setSearchKomponen(tempSearchKomponen);
    setFilterJenisKomponen(tempFilterJenisKomponen);
    setFilterTipeNilaiKomponen(tempFilterTipeNilaiKomponen);
    setFilterKolomAktif(tempFilterKolomAktif);
    setSortByKomponen(tempSortByKomponen);
    setSortDirKomponen(tempSortDirKomponen);
    setShowFilterKomponen(false);
  };

  const handleResetFilterKomponen = () => {
    setTempSearchKomponen('');
    setTempFilterJenisKomponen('');
    setTempFilterTipeNilaiKomponen('');
    setTempFilterKolomAktif('');
    setTempSortByKomponen('urutan');
    setTempSortDirKomponen('asc');
    setSearchKomponen('');
    setFilterJenisKomponen('');
    setFilterTipeNilaiKomponen('');
    setFilterKolomAktif('');
    setSortByKomponen('urutan');
    setSortDirKomponen('asc');
    setShowFilterKomponen(false);
  };

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
      is_kolom_aktif: true,
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
      nilai_default: Number(item.nilai_default),
      is_taxable: Boolean(item.is_taxable),
      is_active: Boolean(item.is_active),
      is_kolom_aktif: Boolean(item.is_kolom_aktif ?? true),
      urutan: Number(item.urutan),
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

  const handleToggleKolom = async (item: MasterKomponenGaji) => {
    try {
      await simpegService.toggleKomponenKolom(item.id);
      toast.success(`Visibilitas kolom '${item.nama}' berhasil diubah`);
      loadKomponen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah visibilitas kolom');
    }
  };

  const handleDeleteKomponen = async () => {
    if (!deleteModalKomponen.item) return;
    try {
      setDeleteModalKomponen(prev => ({ ...prev, isLoading: true }));
      await simpegService.deleteKomponenGaji(deleteModalKomponen.item.id);
      toast.success(`Komponen '${deleteModalKomponen.item.nama}' berhasil dihapus`);
      setDeleteModalKomponen({ isOpen: false, item: null, isLoading: false });
      loadKomponen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus komponen');
      setDeleteModalKomponen(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ── TAB 3 ACTIONS (PLOTING ABSENSI) ──
  const handleApplyFilterAbsensi = () => {
    setSearchAbsensi(tempSearchAbsensi);
    setFilterStatusAbsensi(tempFilterStatusAbsensi);
    setSortByAbsensi(tempSortByAbsensi);
    setSortDirAbsensi(tempSortDirAbsensi);
    setShowFilterAbsensi(false);
  };

  const handleResetFilterAbsensi = () => {
    setTempSearchAbsensi('');
    setTempFilterStatusAbsensi('');
    setTempSortByAbsensi('nama_lengkap');
    setTempSortDirAbsensi('asc');
    setSearchAbsensi('');
    setFilterStatusAbsensi('');
    setSortByAbsensi('nama_lengkap');
    setSortDirAbsensi('asc');
    setShowFilterAbsensi(false);
  };

  const handleTogglePegawaiAbsensi = async (peg: any) => {
    try {
      const nextStatus = !peg.terdampak_absensi;
      await simpegService.updatePegawaiTerdampakAbsensi(peg.id, nextStatus);
      toast.success(`Status absensi ${peg.nama_lengkap} diubah menjadi ${nextStatus ? 'Terdampak' : 'Bebas Absensi'}`);
      setPegawaiAbsensiList(prev => prev.map(p => p.id === peg.id ? { ...p, terdampak_absensi: nextStatus } : p));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status absensi pegawai');
    }
  };

  const handleBatchToggleAbsensi = async (terdampak: boolean) => {
    if (selectedPegawaiIds.length === 0) {
      toast.error('Pilih minimal satu pegawai untuk pembaruan massal');
      return;
    }
    try {
      setBatchLoading(true);
      await simpegService.bulkUpdatePegawaiTerdampakAbsensi(selectedPegawaiIds, terdampak);
      toast.success(`Berhasil memperbarui ${selectedPegawaiIds.length} pegawai menjadi ${terdampak ? 'Terdampak' : 'Bebas Absensi'}`);
      setSelectedPegawaiIds([]);
      loadPegawaiAbsensi(absensiMeta.current_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui status absensi pegawai secara massal');
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelectPegawai = (id: number) => {
    setSelectedPegawaiIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPegawai = () => {
    if (selectedPegawaiIds.length === pegawaiAbsensiList.length) {
      setSelectedPegawaiIds([]);
    } else {
      setSelectedPegawaiIds(pegawaiAbsensiList.map(p => p.id));
    }
  };

  // ── COLUMNS TAB 1: MATRIKS PEGAWAI & NOMINAL ──
  const columnsMatriks: ColumnDef<any>[] = [
    {
      key: 'nama_lengkap',
      label: 'Pegawai',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama_lengkap}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            NIP: {row.nip || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'unit_kerja',
      label: 'Unit Kerja / Status',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {row.unit_kerja || '-'}
          </span>
          <span className="text-2xs text-slate-500 capitalize">
            {row.jenis_pegawai || '-'} • {(row.status_kepegawaian || '-').replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'terdampak_absensi',
      label: 'Absensi',
      render: (row: any) => (
        <Badge variant={row.terdampak_absensi ? 'success' : 'warning'}>
          {row.terdampak_absensi ? 'Terdampak' : 'Bebas Absensi'}
        </Badge>
      ),
    },
    // Dynamic Columns per Active Komponen
    ...activeColumns.map((col) => ({
      key: `komponen_${col.kode}`,
      label: `${col.nama} (${col.kode})`,
      render: (row: any) => {
        const valObj = row.komponen_values?.[col.kode];
        if (!valObj) return <span className="text-slate-400 text-2xs">-</span>;
        
        return (
          <div className="flex flex-col gap-0.5">
            {col.jenis === 'potongan' ? (
              <Badge variant="danger">
                {formatRupiah(valObj.nominal)}
              </Badge>
            ) : (
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {formatRupiah(valObj.nominal)}
              </span>
            )}
            {valObj.is_custom && (
              <div className="mt-0.5">
                <Badge variant="success">
                  Kustom
                </Badge>
              </div>
            )}
          </div>
        );
      },
    })),
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row: any) => {
        if (!canManage) return null;
        return (
          <DropdownMenu
            items={[
              {
                label: 'Ubah Nominal Komponen',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/simpeg/payroll/komponen/pegawai/${row.id}`),
              },
            ]}
          />
        );
      },
    },
  ];

  // ── COLUMNS TAB 2: MANAJEMEN KOLOM KOMPONEN ──
  const columnsKomponen: ColumnDef<MasterKomponenGaji>[] = [
    {
      key: 'kode',
      label: 'Kode & Urutan',
      render: (row: MasterKomponenGaji) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
            {row.kode}
          </span>
          <span className="text-2xs text-slate-400">#{row.urutan}</span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'Nama Komponen',
      render: (row: MasterKomponenGaji) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama}
          </span>
          {row.keterangan && (
            <span className="text-2xs text-slate-500 line-clamp-1">{row.keterangan}</span>
          )}
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis & Tipe Nilai',
      render: (row: MasterKomponenGaji) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Badge variant={row.jenis === 'pendapatan' ? 'success' : 'danger'}>
              {row.jenis}
            </Badge>
            {row.is_taxable && (
              <Badge variant="warning">Taxable</Badge>
            )}
          </div>
          <span className="text-2xs text-slate-500 font-medium">
            {row.tipe_nilai.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'nilai_default',
      label: 'Nilai Default Master',
      render: (row: MasterKomponenGaji) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {formatRupiah(row.nilai_default)}
        </span>
      ),
    },
    {
      key: 'is_kolom_aktif',
      label: 'Status Visibilitas Kolom',
      render: (row: MasterKomponenGaji) => (
        <Badge variant={row.is_kolom_aktif ?? true ? 'success' : 'gray'}>
          {row.is_kolom_aktif ?? true ? 'Aktif di Kolom' : 'Disembunyikan'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row: MasterKomponenGaji) => {
        if (!canManage) return null;
        return (
          <DropdownMenu
            items={[
              {
                label: row.is_kolom_aktif ?? true ? 'Sembunyikan dari Kolom' : 'Tampilkan di Kolom',
                icon: row.is_kolom_aktif ?? true ? <ToggleLeft size={14} /> : <ToggleRight size={14} />,
                onClick: () => handleToggleKolom(row),
              },
              {
                label: 'Ubah Komponen',
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
        );
      },
    },
  ];

  // ── COLUMNS TAB 3: PLOTING ABSENSI ──
  const columnsAbsensi: ColumnDef<any>[] = [
    {
      key: 'select',
      label: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={pegawaiAbsensiList.length > 0 && selectedPegawaiIds.length === pegawaiAbsensiList.length}
            onChange={toggleSelectAllPegawai}
          />
        </div>
      ),
      render: (row: any) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedPegawaiIds.includes(row.id)}
            onChange={() => toggleSelectPegawai(row.id)}
          />
        </div>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'Pegawai',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama_lengkap}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            NIP: {row.nip || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'unit_kerja',
      label: 'Unit Kerja & Jabatan',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {row.unit_kerja || '-'}
          </span>
          <span className="text-2xs text-slate-500 capitalize">
            {row.jenis_pegawai || '-'} • {(row.status_kepegawaian || '-').replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'terdampak_absensi',
      label: 'Dampak Terhadap Penggajian',
      render: (row: any) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={row.terdampak_absensi ? 'success' : 'warning'}>
            {row.terdampak_absensi ? 'Terdampak Presensi Penuh' : 'Bebas Absensi (0 Potongan/Insentif)'}
          </Badge>
          <span className="text-2xs text-slate-400">
            {row.terdampak_absensi 
              ? 'Dikenakan insentif transport & potongan telat/alpha'
              : 'Tidak dipengaruhi jam masuk atau absensi (misal anak magang)'}
          </span>
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row: any) => {
        if (!canManage) return null;
        return (
          <DropdownMenu
            items={[
              {
                label: row.terdampak_absensi ? 'Set Bebas Absensi' : 'Set Terdampak Presensi',
                icon: row.terdampak_absensi ? <UserX size={14} /> : <UserCheck size={14} />,
                onClick: () => handleTogglePegawaiAbsensi(row),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Komponen & Variabel Penggajian"
        description="Atur matriks pendapatan pegawai, manajemen kolom komponen penggajian, dan ploting dampak kehadiran/absensi"
        backUrl="/simpeg/payroll"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                if (activeTab === 'matriks') setShowFilterMatriks(true);
                else if (activeTab === 'kolom') setShowFilterKomponen(true);
                else if (activeTab === 'absensi') setShowFilterAbsensi(true);
              }}
            >
              Filter
            </Button>
            {canManage && activeTab === 'kolom' && (
              <Button
                icon={<Plus size={16} />}
                onClick={handleOpenCreateKomponen}
              >
                Tambah Komponen
              </Button>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs Sesuai Rancangan Baru */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matriks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'matriks'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} /> Matriks Nominal Komponen Pegawai
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kolom')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'kolom'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders size={16} /> Manajemen Kolom Komponen Gaji
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('absensi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'absensi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Clock size={16} /> Ploting Terdampak Absensi Pegawai
        </button>
      </div>

      {/* ── TAB 1 CONTENT: MATRIKS NOMINAL PEGAWAI ── */}
      {activeTab === 'matriks' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Kolom Aktif:</span>
              <div className="flex flex-wrap gap-1">
                {activeColumns.map((c) => (
                  <Badge key={c.id} variant="gray">
                    {c.nama} ({c.kode})
                  </Badge>
                ))}
                {activeColumns.length === 0 && (
                  <span className="text-slate-400 italic">Belum ada kolom aktif dari Tab 2</span>
                )}
              </div>
            </div>
            <span className="text-2xs text-slate-500 shrink-0">
              *Untuk mengaktifkan/menyembunyikan kolom, atur switch di <strong>Tab 2 (Manajemen Kolom)</strong>.
            </span>
          </div>

          <DataTable
            columns={columnsMatriks}
            data={pegawaiMatriksList}
            isLoading={loadingMatriks}
            meta={matriksMeta}
            onPageChange={(p) => loadMatriks(p)}
          />
        </div>
      )}

      {/* ── TAB 2 CONTENT: MANAJEMEN KOLOM KOMPONEN ── */}
      {activeTab === 'kolom' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsKomponen}
            data={komponenList}
            isLoading={loadingKomponen}
            meta={komponenMeta}
            onPageChange={(p) => loadKomponen(p)}
          />
        </div>
      )}

      {/* ── TAB 3 CONTENT: PLOTING TERDAMPAK ABSENSI ── */}
      {activeTab === 'absensi' && (
        <div className="space-y-4">
          {/* Action bar batch update */}
          {canManage && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Terpilih: {selectedPegawaiIds.length} Pegawai
                </span>
                {selectedPegawaiIds.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setSelectedPegawaiIds([])}
                  >
                    Batalkan Pilihan
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<UserX size={14} />}
                  disabled={selectedPegawaiIds.length === 0 || batchLoading}
                  onClick={() => handleBatchToggleAbsensi(false)}
                >
                  Set Terpilih Bebas Absensi
                </Button>
                <Button
                  size="sm"
                  icon={<UserCheck size={14} />}
                  disabled={selectedPegawaiIds.length === 0 || batchLoading}
                  onClick={() => handleBatchToggleAbsensi(true)}
                >
                  Set Terpilih Terdampak Absensi
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={columnsAbsensi}
            data={pegawaiAbsensiList}
            isLoading={loadingAbsensi}
            meta={absensiMeta}
            onPageChange={(p) => loadPegawaiAbsensi(p)}
          />
        </div>
      )}

      {/* ── FILTER DRAWER TAB 1 (MATRIKS) ── */}
      <Drawer
        isOpen={showFilterMatriks}
        onClose={() => setShowFilterMatriks(false)}
        title="Filter Matriks Pegawai"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleResetFilterMatriks}>
              Reset
            </Button>
            <Button className="flex-1" onClick={handleApplyFilterMatriks}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Pegawai (Nama / NIP)"
            placeholder="Ketik kata kunci..."
            value={tempSearchMatriks}
            onChange={(e) => setTempSearchMatriks(e.target.value)}
          />
          <AsyncSelect
            label="Unit Kerja"
            placeholder="Pilih atau cari unit kerja..."
            value={tempFilterUnitKerja}
            onChange={(val) => setTempFilterUnitKerja(val ? String(val) : '')}
            loadOptions={loadUnitKerjaOptions}
            isClearable
          />
          <Select
            label="Jenis Pegawai"
            value={tempFilterJenisPegawai}
            onChange={(e) => setTempFilterJenisPegawai(e.target.value)}
            options={JENIS_PEGAWAI_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={tempSortByMatriks}
              onChange={(e) => setTempSortByMatriks(e.target.value)}
              options={SORT_BY_PEGAWAI_OPTIONS}
            />
            <Select
              label="Arah Urutan"
              value={tempSortDirMatriks}
              onChange={(e) => setTempSortDirMatriks(e.target.value as 'asc' | 'desc')}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      {/* ── FILTER DRAWER TAB 2 (KOMPONEN) ── */}
      <Drawer
        isOpen={showFilterKomponen}
        onClose={() => setShowFilterKomponen(false)}
        title="Filter Komponen Gaji"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleResetFilterKomponen}>
              Reset
            </Button>
            <Button className="flex-1" onClick={handleApplyFilterKomponen}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Komponen (Nama / Kode)"
            placeholder="Ketik nama atau kode..."
            value={tempSearchKomponen}
            onChange={(e) => setTempSearchKomponen(e.target.value)}
          />
          <Select
            label="Jenis Komponen"
            value={tempFilterJenisKomponen}
            onChange={(e) => setTempFilterJenisKomponen(e.target.value)}
            options={JENIS_KOMPONEN_OPTIONS}
          />
          <Select
            label="Tipe Nilai Perhitungan"
            value={tempFilterTipeNilaiKomponen}
            onChange={(e) => setTempFilterTipeNilaiKomponen(e.target.value)}
            options={TIPE_NILAI_FILTER_OPTIONS}
          />
          <Select
            label="Status Visibilitas Kolom"
            value={tempFilterKolomAktif}
            onChange={(e) => setTempFilterKolomAktif(e.target.value)}
            options={STATUS_VISIBILITAS_KOLOM_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={tempSortByKomponen}
              onChange={(e) => setTempSortByKomponen(e.target.value)}
              options={SORT_BY_KOMPONEN_OPTIONS}
            />
            <Select
              label="Arah Urutan"
              value={tempSortDirKomponen}
              onChange={(e) => setTempSortDirKomponen(e.target.value as 'asc' | 'desc')}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      {/* ── FILTER DRAWER TAB 3 (ABSENSI) ── */}
      <Drawer
        isOpen={showFilterAbsensi}
        onClose={() => setShowFilterAbsensi(false)}
        title="Filter Ploting Absensi"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleResetFilterAbsensi}>
              Reset
            </Button>
            <Button className="flex-1" onClick={handleApplyFilterAbsensi}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Pegawai (Nama / NIP)"
            placeholder="Ketik kata kunci..."
            value={tempSearchAbsensi}
            onChange={(e) => setTempSearchAbsensi(e.target.value)}
          />
          <Select
            label="Status Dampak Absensi"
            value={tempFilterStatusAbsensi}
            onChange={(e) => setTempFilterStatusAbsensi(e.target.value)}
            options={STATUS_ABSENSI_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={tempSortByAbsensi}
              onChange={(e) => setTempSortByAbsensi(e.target.value)}
              options={SORT_BY_PEGAWAI_OPTIONS}
            />
            <Select
              label="Arah Urutan"
              value={tempSortDirAbsensi}
              onChange={(e) => setTempSortDirAbsensi(e.target.value as 'asc' | 'desc')}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      {/* ── MODAL CREATE / EDIT KOMPONEN (TAB 2) ── */}
      <Modal
        isOpen={modalKomponenOpen}
        onClose={() => setModalKomponenOpen(false)}
        title={editingKomponen ? `Ubah Komponen: ${editingKomponen.nama}` : 'Tambah Master Komponen Gaji Baru'}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" type="button" onClick={() => setModalKomponenOpen(false)}>
              Batal
            </Button>
            <Button onClick={formKomponen.handleSubmit(onSubmitKomponen)}>
              {editingKomponen ? 'Simpan Perubahan' : 'Tambahkan Komponen'}
            </Button>
          </div>
        }
      >
        <form onSubmit={formKomponen.handleSubmit(onSubmitKomponen)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Komponen"
              placeholder="Contoh: TUNJ_MAKAN"
              disabled={Boolean(editingKomponen)}
              {...formKomponen.register('kode')}
              error={formKomponen.formState.errors.kode?.message}
            />
            <Input
              label="Nama Komponen"
              placeholder="Contoh: Tunjangan Makan Siang"
              {...formKomponen.register('nama')}
              error={formKomponen.formState.errors.nama?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={formKomponen.control}
              name="jenis"
              render={({ field, fieldState }) => (
                <Select
                  label="Jenis Komponen"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  options={JENIS_KOMPONEN_FORM_OPTIONS}
                />
              )}
            />
            <Controller
              control={formKomponen.control}
              name="tipe_nilai"
              render={({ field, fieldState }) => (
                <Select
                  label="Tipe Nilai Perhitungan"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  options={TIPE_NILAI_KOMPONEN_OPTIONS}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nilai Default Master (Rp)"
              type="number"
              placeholder="0"
              {...formKomponen.register('nilai_default', { valueAsNumber: true })}
              error={formKomponen.formState.errors.nilai_default?.message}
            />
            <Input
              label="Urutan Tampilan Kolom"
              type="number"
              placeholder="1"
              {...formKomponen.register('urutan', { valueAsNumber: true })}
              error={formKomponen.formState.errors.urutan?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <Controller
              control={formKomponen.control}
              name="is_taxable"
              render={({ field }) => (
                <Checkbox
                  label="Kena Pajak PPh 21 (Taxable)"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <Controller
              control={formKomponen.control}
              name="is_active"
              render={({ field }) => (
                <Checkbox
                  label="Komponen Aktif Sistem"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <Controller
              control={formKomponen.control}
              name="is_kolom_aktif"
              render={({ field }) => (
                <Checkbox
                  label="Tampil di Kolom Tab 1"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>

          <Input
            label="Keterangan Komponen"
            placeholder="Catatan regulasi atau formula..."
            {...formKomponen.register('keterangan')}
            error={formKomponen.formState.errors.keterangan?.message}
          />
        </form>
      </Modal>

      {/* ── MODAL KONFIRMASI HAPUS KOMPONEN ── */}
      <ConfirmDialog
        isOpen={deleteModalKomponen.isOpen}
        onClose={() => setDeleteModalKomponen({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleDeleteKomponen}
        title="Hapus Master Komponen Gaji"
        message={`Apakah Anda yakin ingin menghapus komponen '${deleteModalKomponen.item?.nama}'? Data riwayat penggajian lama tetap aman namun komponen ini tidak akan lagi digunakan dalam perhitungan baru.`}
        confirmText="Hapus Komponen"
        variant="danger"
        isLoading={deleteModalKomponen.isLoading}
      />
    </div>
  );
}
