'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Boxes,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  Save,
  Filter,
  Users,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { formatTahunAkademikLabel } from '@/lib/obe-settings';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

interface CheckedMkState {
  is_wajib: boolean;
  semester_anjuran: number;
}

const copyPaketSchema = z.object({
  target_master_kelas_id: z
    .number({ error: 'Rombel tujuan wajib dipilih' })
    .min(1, 'Rombel target wajib dipilih'),
});

type CopyPaketFormValues = z.infer<typeof copyPaketSchema>;

const paketSchema = z.object({
  program_studi_id: z.number({ error: 'Program studi wajib dipilih' }),
  tahun_akademik_id: z.number({ error: 'Tahun akademik wajib dipilih' }),
  master_kelas_id: z.number({ error: 'Rombel kelas wajib dipilih' }),
  items: z
    .array(
      z.object({
        mata_kuliah_id: z.number(),
        semester_anjuran: z.number(),
        is_wajib: z.boolean(),
      })
    )
    .min(1, 'Pilih minimal 1 mata kuliah untuk disimpan ke dalam paket rombel'),
});

const SEMESTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1 (Ganjil)' },
  { value: '2', label: 'Semester 2 (Genap)' },
  { value: '3', label: 'Semester 3 (Ganjil)' },
  { value: '4', label: 'Semester 4 (Genap)' },
  { value: '5', label: 'Semester 5 (Ganjil)' },
  { value: '6', label: 'Semester 6 (Genap)' },
  { value: '7', label: 'Semester 7 (Ganjil)' },
  { value: '8', label: 'Semester 8 (Genap)' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'semester_anjuran', label: 'Semester Anjuran' },
  { value: 'kode_mk', label: 'Kode Mata Kuliah' },
  { value: 'nama', label: 'Nama Mata Kuliah' },
  { value: 'total_sks', label: 'Bobot SKS' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z (Naik)' },
  { value: 'desc', label: 'Z - A (Turun)' },
];

export default function PaketKrsPage() {
  const router = useRouter();
  const { user, isSuperAdmin, is_loading: isAuthLoading } = useAuth();

  const userAdminProdis = useMemo(() => {
    return (
      ((user as any)?.siakad_admin_prodis || (user as any)?.siakadAdminProdis || []).filter(
        (p: any) => p.is_active !== false
      )
    );
  }, [user]);

  const isAdminObe = isSuperAdmin || userAdminProdis.length > 0;

  // Context Selection States
  const [selectedProdiId, setSelectedProdiId] = useState<number | null>(null);
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);
  const [selectedMasterKelasId, setSelectedMasterKelasId] = useState<number | null>(null);

  // Cached Master Entity Lists for Display & Modals
  const [masterKelases, setMasterKelases] = useState<any[]>([]);

  // Server-side Catalog & Package States
  const [mataKuliahs, setMataKuliahs] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingPaket, setLoadingPaket] = useState(false);
  const [savingPaket, setSavingPaket] = useState(false);
  const [togglingAkses, setTogglingAkses] = useState(false);

  // Checked MK Map: { [mata_kuliah_id]: { is_wajib, semester_anjuran } }
  const [checkedMks, setCheckedMks] = useState<Record<number, CheckedMkState>>({});
  const [savedMkIds, setSavedMkIds] = useState<number[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  // Hak Akses Rombel State
  const [isAksesDibuka, setIsAksesDibuka] = useState<boolean>(true);

  // Filter Drawer States (Server-side parameters)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('semester_anjuran');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSemester, setAppliedSemester] = useState('all');
  const [appliedOrderBy, setAppliedOrderBy] = useState('semester_anjuran');
  const [appliedOrderDir, setAppliedOrderDir] = useState<'asc' | 'desc'>('asc');

  // Confirmation Dialog States
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isConfirmAksesOpen, setIsConfirmAksesOpen] = useState(false);

  // Copy Modal State & React Hook Form
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  const {
    control: copyControl,
    handleSubmit: handleCopySubmit,
    reset: resetCopyForm,
    formState: { errors: copyErrors },
  } = useForm<CopyPaketFormValues>({
    resolver: zodResolver(copyPaketSchema),
  });

  // 1. Initial Load of Permitted Prodis & Active Tahun Akademik
  useEffect(() => {
    if (isAuthLoading || !user || !isAdminObe) return;

    const loadInitialContext = async () => {
      try {
        const [prodiRes, taRes] = await Promise.all([
          siakadService.getProdi(),
          siakadService.getTahunAkademiks({ per_page: 50 }),
        ]);

        if (prodiRes?.data) {
          const prodiList: any[] = Array.isArray(prodiRes.data)
            ? prodiRes.data
            : prodiRes.data.items || [];
          const permitted = isSuperAdmin
            ? prodiList
            : prodiList.filter((p) =>
                userAdminProdis.some((uap: any) => Number(uap.program_studi_id) === Number(p.id))
              );

          if (permitted.length > 0 && selectedProdiId === null) {
            setSelectedProdiId(Number(permitted[0].id));
          }
        }

        if (taRes?.data) {
          const taList: any[] = Array.isArray(taRes.data) ? taRes.data : taRes.data.items || [];
          const activeTa = taList.find((t) => t.is_active) || taList[0];
          if (activeTa && selectedTaId === null) {
            setSelectedTaId(Number(activeTa.id));
          }
        }
      } catch (err) {
        console.error('Gagal memuat opsi dasar:', err);
        toast.error('Gagal memuat daftar program studi dan tahun akademik');
      }
    };

    loadInitialContext();
  }, [isAuthLoading, user, isAdminObe, isSuperAdmin, userAdminProdis, selectedProdiId, selectedTaId]);

  // AsyncSelect loaders
  const loadProdiOptions = useCallback(
    async (keyword: string) => {
      try {
        const res = await siakadService.getProdi({ search: keyword || undefined });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const permitted = isSuperAdmin
          ? list
          : list.filter((p) =>
              userAdminProdis.some((uap: any) => Number(uap.program_studi_id) === Number(p.id))
            );
        return permitted.map((p) => ({
          value: Number(p.id),
          label: `${p.nama} (${p.jenjang || 'S1'})`,
        }));
      } catch {
        return [];
      }
    },
    [isSuperAdmin, userAdminProdis]
  );

  const loadTahunAkademikOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getTahunAkademiks({
        search: keyword || undefined,
        per_page: 50,
      });
      const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return list.map((ta) => ({
        value: Number(ta.id),
        label: `${formatTahunAkademikLabel(ta)} ${ta.is_active ? '• (Aktif)' : ''}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadMasterKelasOptions = useCallback(
    async (keyword: string) => {
      if (!selectedProdiId) return [];
      try {
        const res = await siakadService.getMasterKelasList({
          program_studi_id: selectedProdiId,
          search: keyword || undefined,
          is_active: true,
          per_page: 100,
        });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return list.map((k) => ({
          value: Number(k.id),
          label: `Kelas ${k.nama_kelas} (${k.tahun_angkatan || '-'}) • ${k.mahasiswas_count || 0} Mhs`,
        }));
      } catch {
        return [];
      }
    },
    [selectedProdiId]
  );

  const loadCopyMasterKelasOptions = useCallback(
    async (keyword: string) => {
      if (!selectedProdiId) return [];
      try {
        const res = await siakadService.getMasterKelasList({
          program_studi_id: selectedProdiId,
          search: keyword || undefined,
          is_active: true,
          per_page: 100,
        });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return list
          .filter((k) => k.id !== selectedMasterKelasId)
          .map((k) => ({
            value: Number(k.id),
            label: `Kelas ${k.nama_kelas} (${k.tahun_angkatan || '-'}) • ${k.mahasiswas_count || 0} Mhs`,
          }));
      } catch {
        return [];
      }
    },
    [selectedProdiId, selectedMasterKelasId]
  );

  // 2. Load Master Kelases whenever Prodi changes
  useEffect(() => {
    if (!selectedProdiId) {
      setMasterKelases([]);
      setSelectedMasterKelasId(null);
      return;
    }

    const fetchKelases = async () => {
      try {
        const res = await siakadService.getMasterKelasList({
          program_studi_id: selectedProdiId,
          is_active: true,
          per_page: 100,
        });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setMasterKelases(list);

        if (list.length > 0) {
          const stillValid = list.some((k) => k.id === selectedMasterKelasId);
          if (!stillValid) {
            setSelectedMasterKelasId(Number(list[0].id));
          }
        } else {
          setSelectedMasterKelasId(null);
        }
      } catch {
        toast.error('Gagal memuat rombel kelas program studi');
      }
    };

    fetchKelases();
  }, [selectedProdiId, selectedMasterKelasId]);

  // 3. Load Mata Kuliah Katalog with Server-side Pagination & Filters
  const fetchCatalog = useCallback(async () => {
    if (!selectedProdiId) {
      setMataKuliahs([]);
      setMeta(undefined);
      return;
    }

    try {
      setLoadingCatalog(true);
      const res = await siakadService.getMataKuliahs({
        program_studi_id: selectedProdiId,
        search: appliedSearch || undefined,
        semester_anjuran: appliedSemester === 'all' ? undefined : appliedSemester,
        sort_by: appliedOrderBy,
        sort_order: appliedOrderDir,
        page,
        per_page: limit,
      });

      const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setMataKuliahs(list);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat katalog mata kuliah');
    } finally {
      setLoadingCatalog(false);
    }
  }, [selectedProdiId, appliedSearch, appliedSemester, appliedOrderBy, appliedOrderDir, page, limit]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // 4. Load Saved Paket MK for Selected Rombel & TA
  const fetchPaketRombel = useCallback(async () => {
    if (!selectedMasterKelasId) {
      setCheckedMks({});
      setSavedMkIds([]);
      setSavedItems([]);
      return;
    }
    try {
      setLoadingPaket(true);
      const res = await siakadService.getPaketMkList({
        master_kelas_id: selectedMasterKelasId,
        tahun_akademik_id: selectedTaId || undefined,
        per_page: 100,
      });

      const items: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
      const newMap: Record<number, CheckedMkState> = {};
      const savedIds: number[] = [];

      items.forEach((item: any) => {
        const mkId = Number(item.mata_kuliah_id);
        savedIds.push(mkId);
        newMap[mkId] = {
          is_wajib: item.is_wajib ?? true,
          semester_anjuran: item.semester_anjuran || item.mata_kuliah?.semester_anjuran || 1,
        };
      });

      setCheckedMks(newMap);
      setSavedMkIds(savedIds);
      setSavedItems(items);
    } catch {
      toast.error('Gagal memuat paket mata kuliah untuk rombel ini');
    } finally {
      setLoadingPaket(false);
    }
  }, [selectedMasterKelasId, selectedTaId]);

  useEffect(() => {
    fetchPaketRombel();
  }, [fetchPaketRombel]);

  // Current selected rombel entity
  const currentRombel = useMemo(() => {
    return masterKelases.find((k) => k.id === selectedMasterKelasId) || null;
  }, [masterKelases, selectedMasterKelasId]);

  // Live Statistics
  const stats = useMemo(() => {
    const selectedIds = Object.keys(checkedMks).map(Number);
    let totalSks = 0;
    let wajibCount = 0;
    let pilihanCount = 0;

    selectedIds.forEach((id) => {
      const catalogMk = mataKuliahs.find((m) => m.id === id);
      const savedMk = savedItems.find((s) => Number(s.mata_kuliah_id) === id)?.mata_kuliah;
      const mk = catalogMk || savedMk;
      const sks = Number(mk?.total_sks || mk?.sks || 0);
      totalSks += sks;
      if (checkedMks[id]?.is_wajib) {
        wajibCount++;
      } else {
        pilihanCount++;
      }
    });

    return {
      totalMk: selectedIds.length,
      totalSks,
      wajibCount,
      pilihanCount,
      isDirty:
        selectedIds.length !== savedMkIds.length ||
        selectedIds.some((id) => !savedMkIds.includes(id)),
    };
  }, [checkedMks, mataKuliahs, savedItems, savedMkIds]);

  // Toggle selection
  const handleToggleMk = (mk: any) => {
    setCheckedMks((prev) => {
      const updated = { ...prev };
      if (updated[mk.id]) {
        delete updated[mk.id];
      } else {
        updated[mk.id] = {
          is_wajib: true,
          semester_anjuran: mk.semester_anjuran || 1,
        };
      }
      return updated;
    });
  };

  const handleToggleWajib = (mkId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedMks((prev) => {
      if (!prev[mkId]) return prev;
      return {
        ...prev,
        [mkId]: {
          ...prev[mkId],
          is_wajib: !prev[mkId].is_wajib,
        },
      };
    });
  };

  const handleSelectAllCurrentSemester = () => {
    if (mataKuliahs.length === 0) return;
    setCheckedMks((prev) => {
      const updated = { ...prev };
      mataKuliahs.forEach((mk) => {
        updated[mk.id] = {
          is_wajib: true,
          semester_anjuran: mk.semester_anjuran || 1,
        };
      });
      return updated;
    });
    toast.success(`${mataKuliahs.length} mata kuliah ditambahkan ke paket`);
  };

  // Save Paket (Bulk Sync) with Zod validation
  const handleSavePaket = async () => {
    const items = Object.entries(checkedMks).map(([mkId, val]) => ({
      mata_kuliah_id: Number(mkId),
      semester_anjuran: val.semester_anjuran,
      is_wajib: val.is_wajib,
    }));

    const validation = paketSchema.safeParse({
      program_studi_id: selectedProdiId,
      tahun_akademik_id: selectedTaId,
      master_kelas_id: selectedMasterKelasId,
      items,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Data paket tidak valid';
      toast.error(firstError);
      return;
    }

    try {
      setSavingPaket(true);
      const res = await siakadService.bulkSyncPaketMk({
        master_kelas_id: selectedMasterKelasId!,
        tahun_akademik_id: selectedTaId || undefined,
        items,
      });

      toast.success(res.message || 'Paket mata kuliah rombel berhasil disimpan');
      await fetchPaketRombel();
    } catch (err: any) {
      console.error('Gagal menyimpan paket:', err);
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan paket mata kuliah');
    } finally {
      setSavingPaket(false);
    }
  };

  // Toggle Hak Akses Execution
  const executeToggleHakAksesRombel = async () => {
    if (!selectedMasterKelasId || !selectedTaId) {
      toast.error('Pilih rombel dan tahun akademik terlebih dahulu');
      return;
    }

    const nextState = !isAksesDibuka;

    try {
      setTogglingAkses(true);
      const res = await siakadService.setHakaksesRombel({
        master_kelas_id: selectedMasterKelasId,
        tahun_akademik_id: selectedTaId,
        is_dibuka: nextState,
      });

      setIsAksesDibuka(nextState);
      setIsConfirmAksesOpen(false);
      toast.success(res.message || `Akses KRS rombel berhasil ${nextState ? 'dibuka' : 'dikunci'}`);
    } catch (err: any) {
      console.error('Gagal mengubah hak akses:', err);
      toast.error(err.response?.data?.message || err.message || 'Gagal mengubah hak akses KRS rombel');
    } finally {
      setTogglingAkses(false);
    }
  };

  // Copy to Parallel Rombel Execution with React Hook Form
  const onValidCopy = async (data: CopyPaketFormValues) => {
    const items = Object.entries(checkedMks).map(([mkId, val]) => ({
      mata_kuliah_id: Number(mkId),
      semester_anjuran: val.semester_anjuran,
      is_wajib: val.is_wajib,
    }));

    if (items.length === 0) {
      toast.error('Paket saat ini masih kosong, tidak ada yang dapat disalin');
      return;
    }

    try {
      setCopying(true);
      const res = await siakadService.bulkSyncPaketMk({
        master_kelas_id: data.target_master_kelas_id,
        tahun_akademik_id: selectedTaId || undefined,
        items,
      });

      const targetObj = masterKelases.find((k) => k.id === data.target_master_kelas_id);
      toast.success(
        res.message ||
          `Paket (${items.length} MK) berhasil diduplikasi ke rombel ${targetObj?.nama_kelas || ''}`
      );
      setIsCopyModalOpen(false);
      resetCopyForm();
    } catch (err: any) {
      console.error('Gagal menyalin paket:', err);
      toast.error(err.response?.data?.message || err.message || 'Gagal menduplikasi paket ke rombel tujuan');
    } finally {
      setCopying(false);
    }
  };

  // Filter drawer handlers
  const handleApplyFilter = () => {
    setAppliedSearch(filterSearch);
    setAppliedSemester(filterSemester);
    setAppliedOrderBy(filterOrderBy);
    setAppliedOrderDir(filterOrderDir);
    setPage(1);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSemester('all');
    setFilterOrderBy('semester_anjuran');
    setFilterOrderDir('asc');
    setAppliedSearch('');
    setAppliedSemester('all');
    setAppliedOrderBy('semester_anjuran');
    setAppliedOrderDir('asc');
    setPage(1);
    setIsFilterDrawerOpen(false);
  };

  // DataTable Column Definitions
  const columns: ColumnDef<any>[] = [
    {
      key: 'pilih',
      label: 'PILIH',
      align: 'center',
      render: (mk) => {
        const isChecked = Boolean(checkedMks[mk.id]);
        return (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onChange={() => handleToggleMk(mk)} />
          </div>
        );
      },
    },
    {
      key: 'kode_mk',
      label: 'KODE MK',
      render: (mk) => <span className="font-mono font-bold text-xs text-slate-900">{mk.kode_mk}</span>,
    },
    {
      key: 'nama',
      label: 'NAMA MATA KULIAH',
      render: (mk) => (
        <div>
          <span className="font-bold text-xs text-slate-900 block">{mk.nama}</span>
          <span className="text-2xs text-slate-400 block">
            Kurikulum: {mk.kurikulum?.nama || mk.kurikulum?.kode || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SEMESTER',
      align: 'center',
      render: (mk) => (
        <Badge variant="gray" className="text-2xs font-mono font-bold">
          Smt {mk.semester_anjuran || 1}
        </Badge>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (mk) => (
        <span className="font-bold text-xs tabular-nums text-slate-900">
          {mk.total_sks || mk.sks || 0} SKS
        </span>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI',
      render: (mk) => (
        <span className="capitalize font-semibold text-2xs text-slate-600">
          {mk.jenis || mk.kategori || 'Wajib'}
        </span>
      ),
    },
    {
      key: 'sifat',
      label: 'SIFAT PAKET',
      align: 'center',
      render: (mk) => {
        const isChecked = Boolean(checkedMks[mk.id]);
        const mkState = checkedMks[mk.id];
        if (!isChecked) {
          return <span className="text-2xs text-slate-300 font-medium">—</span>;
        }
        return (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => handleToggleWajib(mk.id, e)}
              className={`text-2xs px-2.5 py-1 rounded-full font-bold border transition inline-flex items-center gap-1 ${
                mkState?.is_wajib
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
              title="Klik untuk mengubah sifat mata kuliah dalam paket rombel"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mkState?.is_wajib ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {mkState?.is_wajib ? 'Wajib Paket' : 'Pilihan Paket'}
            </button>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'right',
      render: (mk) => {
        const isChecked = Boolean(checkedMks[mk.id]);
        const isSaved = savedMkIds.includes(mk.id);
        if (isChecked && isSaved) {
          return (
            <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={10} /> Terikat
            </Badge>
          );
        }
        if (isChecked && !isSaved) {
          return (
            <Badge variant="purple" className="text-2xs font-bold">
              Draf Baru
            </Badge>
          );
        }
        if (isSaved) {
          return (
            <Badge variant="red" className="text-2xs font-bold">
              Akan Dilepas
            </Badge>
          );
        }
        return <span className="text-2xs text-slate-400">Tidak Terikat</span>;
      },
    },
  ];

  // RBAC Loading Screen (Fail-Closed)
  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paket KRS"
          description="Kelola dan tetapkan paket mata kuliah kurikulum per rombongan belajar (Master Kelas)."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Paket KRS' },
          ]}
        />
        <Card className="border border-slate-200">
          <CardBody className="py-6 text-center text-slate-400">
            <p className="text-xs">Memverifikasi hak akses pengguna...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // RBAC Access Denied Screen (Fail-Closed)
  if (!user || !isAdminObe) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Paket KRS"
          description="Kelola dan tetapkan paket mata kuliah kurikulum per rombongan belajar (Master Kelas)."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Paket KRS' },
          ]}
        />
        <Card className="border border-slate-200">
          <CardBody className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900">
                Akses Ditolak: Akun Belum Ditugaskan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Halaman pengelolaan Paket KRS OBE hanya dapat diakses oleh personel yang memiliki
                penugasan sebagai <strong>Admin OBE</strong> pada Program Studi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/siakad')}>
                Kembali ke Dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Paket KRS"
        description="Kelola dan tetapkan paket mata kuliah kurikulum per rombongan belajar (Master Kelas) untuk auto-enroll rencana studi 1-klik."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE', href: '/siakad/obe' },
          { label: 'KRS', href: '/siakad/obe/krs/paket' },
          { label: 'Paket KRS' },
        ]}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<Filter size={16} />}
            onClick={() => setIsFilterDrawerOpen(true)}
            className="text-xs font-bold"
          >
            Filter
          </Button>
        }
      />

      {/* 2. Context Filter Bar (Prodi, Tahun Akademik, Rombel) */}
      <Card className="border border-slate-200 shadow-2xs bg-white">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Program Studi */}
            <div>
              <AsyncSelect
                label="Program Studi"
                placeholder="Pilih Program Studi..."
                loadOptions={loadProdiOptions}
                value={selectedProdiId}
                onChange={(opt: any) => {
                  setSelectedProdiId(opt?.value ? Number(opt.value) : null);
                  setPage(1);
                }}
                defaultOptions={true}
              />
            </div>

            {/* Tahun Akademik */}
            <div>
              <AsyncSelect
                label="Tahun Akademik"
                placeholder="Pilih Tahun Akademik..."
                loadOptions={loadTahunAkademikOptions}
                value={selectedTaId}
                onChange={(opt: any) => setSelectedTaId(opt?.value ? Number(opt.value) : null)}
                defaultOptions={true}
              />
            </div>

            {/* Rombel (Master Kelas) */}
            <div>
              <AsyncSelect
                key={`rombel-select-${selectedProdiId || 'none'}`}
                label="Rombongan Belajar (Rombel)"
                placeholder={selectedProdiId ? 'Pilih Rombongan Belajar...' : 'Pilih prodi dahulu'}
                loadOptions={loadMasterKelasOptions}
                value={selectedMasterKelasId}
                onChange={(opt: any) =>
                  setSelectedMasterKelasId(opt?.value ? Number(opt.value) : null)
                }
                isDisabled={!selectedProdiId}
                defaultOptions={true}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Panel Informasi Rombel & Bilah Aksi Utama */}
      {currentRombel ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Info Rombel */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 font-black text-sm">
                <Boxes size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Paket Rombel: Kelas {currentRombel.nama_kelas}
                  </h2>
                  <Badge variant="blue" className="text-2xs font-bold">
                    Angkatan {currentRombel.tahun_angkatan}
                  </Badge>
                  <Badge
                    variant={isAksesDibuka ? 'green' : 'amber'}
                    className="text-2xs font-bold"
                  >
                    {isAksesDibuka ? 'Akses KRS Terbuka' : 'Akses KRS Terkunci'}
                  </Badge>
                  {stats.isDirty && (
                    <Badge variant="purple" className="text-2xs font-extrabold animate-pulse">
                      Ada Perubahan Belum Disimpan
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={13} className="text-slate-400" />
                    DPA: <strong>{currentRombel.dosen_pa?.nama_lengkap || 'Belum diplot'}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-slate-400" />
                    Mahasiswa Rombel: <strong>{currentRombel.mahasiswas_count || 0} orang</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-4 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200 shrink-0">
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">
                  Total Mata Kuliah
                </span>
                <span className="text-base font-black text-slate-800 font-mono">
                  {stats.totalMk} <span className="text-2xs font-normal text-slate-500">MK</span>
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">
                  Beban Studi
                </span>
                <span className="text-base font-black text-primary-600 font-mono">
                  {stats.totalSks} <span className="text-2xs font-normal text-slate-500">SKS</span>
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">Komposisi</span>
                <span className="text-xs font-bold text-slate-700">
                  {stats.wajibCount} Wajib / {stats.pilihanCount} Pilihan
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                icon={<Sparkles size={14} className="text-amber-500" />}
                onClick={handleSelectAllCurrentSemester}
                disabled={mataKuliahs.length === 0}
                className="text-xs font-bold"
              >
                Pilih Semua MK Halaman Ini
              </Button>

              {stats.totalMk > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Kosongkan Pilihan
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Tombol Kunci / Buka Akses */}
              <Button
                variant="outline"
                size="sm"
                icon={isAksesDibuka ? <Lock size={14} /> : <Unlock size={14} />}
                onClick={() => setIsConfirmAksesOpen(true)}
                disabled={togglingAkses}
                className={`text-xs font-bold ${
                  isAksesDibuka
                    ? 'border-amber-300 text-amber-800 hover:bg-amber-50'
                    : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {isAksesDibuka ? 'Kunci Akses KRS Rombel' : 'Buka Akses KRS Rombel'}
              </Button>

              {/* Tombol Salin ke Rombel Paralel */}
              <Button
                variant="outline"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => {
                  resetCopyForm();
                  setIsCopyModalOpen(true);
                }}
                disabled={stats.totalMk === 0 || masterKelases.length <= 1}
                className="text-xs font-bold"
              >
                Salin ke Rombel Lain
              </Button>

              {/* Tombol Simpan Paket */}
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={14} />}
                onClick={handleSavePaket}
                disabled={savingPaket || stats.totalMk === 0}
                className="text-xs font-bold px-4 shadow-xs"
              >
                {savingPaket ? 'Menyimpan...' : 'Simpan Paket Rombel'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border border-dashed border-slate-300 bg-slate-50/60 text-center py-6">
          <CardBody className="max-w-md mx-auto space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
              <Boxes size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Pilih Rombongan Belajar (Rombel)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silakan pilih program studi dan rombel kelas di bilah atas untuk menyusun atau mengelola
              paket mata kuliah.
            </p>
          </CardBody>
        </Card>
      )}

      {/* 4. Tabel Katalog Mata Kuliah & Checklist Paket */}
      {currentRombel && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Katalog Mata Kuliah Kurikulum
              </h3>
              <p className="text-2xs text-slate-500">
                Centang mata kuliah yang ingin diikatkan ke dalam paket rombel{' '}
                <strong className="text-slate-800">{currentRombel.nama_kelas}</strong>.
              </p>
            </div>
            {(appliedSearch || appliedSemester !== 'all') && (
              <Badge variant="blue" className="text-2xs font-semibold">
                Filter Aktif: {appliedSearch ? `"${appliedSearch}"` : ''}{' '}
                {appliedSemester !== 'all' ? `Semester ${appliedSemester}` : ''}
              </Badge>
            )}
          </div>

          <DataTable
            columns={columns}
            data={mataKuliahs}
            isLoading={loadingCatalog || loadingPaket}
            meta={meta}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            emptyMessage="Tidak ada mata kuliah yang cocok dengan filter atau pencarian."
          />
        </div>
      )}

      {/* 5. Drawer Filter Katalog */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Katalog Mata Kuliah"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetFilter}
              className="text-xs"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyFilter}
              className="text-xs font-bold"
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Pencarian Kata Kunci
            </label>
            <Input
              placeholder="Cari kode atau nama MK..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Semester Kurikulum
            </label>
            <Select
              value={filterSemester}
              onChange={(val) => setFilterSemester(val || 'all')}
              options={SEMESTER_OPTIONS}
              className="text-xs"
            />
          </div>

          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Urut Berdasarkan
              </label>
              <Select
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val || 'semester_anjuran')}
                options={SORT_BY_OPTIONS}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Arah
              </label>
              <Select
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir((val as 'asc' | 'desc') || 'asc')}
                options={SORT_DIR_OPTIONS}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* 6. Modal Salin Paket ke Rombel Lain */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Salin Paket ke Rombel Paralel"
      >
        <form onSubmit={handleCopySubmit(onValidCopy)} className="space-y-4 text-xs">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-900 leading-relaxed">
            Paket mata kuliah sebanyak{' '}
            <strong>
              {stats.totalMk} MK ({stats.totalSks} SKS)
            </strong>{' '}
            dari <strong>Kelas {currentRombel?.nama_kelas}</strong> akan diduplikasi secara utuh ke
            rombel target yang Anda pilih di bawah ini.
          </div>

          <div>
            <Controller
              name="target_master_kelas_id"
              control={copyControl}
              render={({ field }) => (
                <AsyncSelect
                  key={`target-rombel-select-${selectedMasterKelasId}`}
                  label="Pilih Rombel Target *"
                  placeholder="Pilih Rombel Tujuan..."
                  loadOptions={loadCopyMasterKelasOptions}
                  value={field.value}
                  onChange={(opt: any) =>
                    field.onChange(opt?.value ? Number(opt.value) : undefined)
                  }
                  error={copyErrors.target_master_kelas_id?.message}
                  defaultOptions={true}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCopyModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Copy size={14} />}
              disabled={copying}
              className="text-xs font-bold"
            >
              {copying ? 'Menduplikasi...' : 'Salin Paket Sekarang'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Dialog Konfirmasi Kosongkan Paket */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={() => {
          setCheckedMks({});
          setIsConfirmClearOpen(false);
        }}
        title="Kosongkan Pilihan Paket?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh mata kuliah dari rancangan paket rombel ${currentRombel?.nama_kelas}? Perubahan belum permanen hingga Anda menekan tombol Simpan Paket.`}
        confirmText="Kosongkan"
        variant="danger"
      />

      {/* 8. Dialog Konfirmasi Kunci / Buka Hak Akses KRS */}
      <ConfirmDialog
        isOpen={isConfirmAksesOpen}
        onClose={() => setIsConfirmAksesOpen(false)}
        onConfirm={executeToggleHakAksesRombel}
        title={isAksesDibuka ? 'Kunci Hak Akses KRS Rombel?' : 'Buka Hak Akses KRS Rombel?'}
        message={
          isAksesDibuka
            ? `Kunci hak akses pengisian KRS untuk rombel ${currentRombel?.nama_kelas}? Mahasiswa pada rombel ini tidak dapat mengisi atau mengubah kartu rencana studi mereka.`
            : `Buka hak akses pengisian KRS untuk seluruh mahasiswa pada rombel ${currentRombel?.nama_kelas}? Mahasiswa dapat mengisi rencana studi secara mandiri.`
        }
        confirmText={isAksesDibuka ? 'Kunci Akses' : 'Buka Akses'}
        variant={isAksesDibuka ? 'warning' : 'primary'}
        isLoading={togglingAkses}
      />
    </div>
  );
}
