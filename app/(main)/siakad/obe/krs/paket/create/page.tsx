'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  CheckCircle2,
  Save,
  Users,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Sparkles,
  History,
  Search,
  Trash2,
  Info,
  FileText,
  FileWarning,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { arsipService } from '@/services/arsip.service';
import type { CheckSkResult } from '@/types/arsip.types';
import { useAuth } from '@/hooks/useAuth';
import { formatTahunAkademikLabel } from '@/lib/obe-settings';
import toast from 'react-hot-toast';
import { z } from 'zod';

const createPaketSchema = z.object({
  master_kelas_id: z.number({
    error: 'Rombel kelas wajib dipilih',
  }),
  tahun_akademik_id: z.number().optional().nullable(),
  nomor_sk: z.string().trim().min(1, 'Nomor SK wajib diisi dan dilampirkan'),
  items: z
    .array(
      z.object({
        mata_kuliah_id: z.number(),
        semester_anjuran: z.number(),
        is_wajib: z.boolean(),
      })
    )
    .min(1, 'Pilih minimal 1 mata kuliah untuk disimpan ke dalam paket'),
});

interface CheckedMkState {
  is_wajib: boolean;
  semester_anjuran: number;
}

export default function CreatePaketKrsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramProdiId = searchParams.get('program_studi_id');
  const paramTaId = searchParams.get('tahun_akademik_id');
  const paramKelasId = searchParams.get('master_kelas_id');

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
  const [selectedProdiId, setSelectedProdiId] = useState<number | null>(
    paramProdiId ? Number(paramProdiId) : null
  );
  const [selectedTaId, setSelectedTaId] = useState<number | null>(
    paramTaId ? Number(paramTaId) : null
  );
  const [selectedMasterKelasId, setSelectedMasterKelasId] = useState<number | null>(
    paramKelasId ? Number(paramKelasId) : null
  );

  // Cached Master Entity Lists
  const [masterKelases, setMasterKelases] = useState<any[]>([]);

  // 2 Lists Data: Belum Diambil & Sudah Diambil
  const [belumDiambilList, setBelumDiambilList] = useState<any[]>([]);
  const [sudahDiambilList, setSudahDiambilList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [savingPaket, setSavingPaket] = useState(false);

  // Active Tab: 'belum' | 'sudah'
  const [activeTab, setActiveTab] = useState<'belum' | 'sudah'>('belum');

  // Checked MK Map for adding to package: { [mata_kuliah_id]: { is_wajib, semester_anjuran } }
  const [checkedMks, setCheckedMks] = useState<Record<number, CheckedMkState>>({});

  // Confirm delete/detach single item
  const [detachingMk, setDetachingMk] = useState<any | null>(null);
  const [detaching, setDetaching] = useState(false);

  // Nomor SK States & Arsip Module Verification
  const [nomorSk, setNomorSk] = useState('');
  const [skCheckResult, setSkCheckResult] = useState<CheckSkResult | null>(null);
  const [isCheckingSk, setIsCheckingSk] = useState(false);

  // Handler to verify Nomor SK with Arsip Module
  const handleCheckSk = useCallback(async (skToTest?: string) => {
    const target = (skToTest ?? nomorSk).trim();
    if (!target) {
      toast.error('Masukkan nomor SK terlebih dahulu untuk diperiksa');
      setSkCheckResult(null);
      return null;
    }

    try {
      setIsCheckingSk(true);
      const res = await arsipService.checkNomorSk(target);
      const data = res?.data;
      if (data) {
        setSkCheckResult(data);
        if (!data.is_found) {
          toast.error(`Nomor SK '${target}' tidak terdaftar di modul Arsip.`);
        } else if (data.status === 'dibatalkan') {
          toast.error(`Nomor SK '${target}' berstatus DIBATALKAN di modul Arsip.`);
        } else if (!data.has_document) {
          toast.error(`Nomor SK '${target}' terdaftar di Arsip, namun belum memiliki berkas fisik dokumen scan.`);
        } else {
          toast.success(`Nomor SK '${target}' sah & berkas fisik terverifikasi.`);
        }
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('Gagal mengecek nomor SK:', err);
      const fallbackFail: CheckSkResult = {
        nomor_surat: target,
        is_found: false,
        is_valid: false,
        has_document: false,
      };
      setSkCheckResult(fallbackFail);
      toast.error(err?.response?.data?.message || 'Gagal memeriksa keabsahan nomor SK di modul Arsip');
      return fallbackFail;
    } finally {
      setIsCheckingSk(false);
    }
  }, [nomorSk]);

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
          raw: k,
        }));
      } catch {
        return [];
      }
    },
    [selectedProdiId]
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

        if (paramKelasId) {
          const found = list.find((k) => Number(k.id) === Number(paramKelasId));
          if (found) {
            setSelectedMasterKelasId(Number(found.id));
          }
        }
      } catch {
        toast.error('Gagal memuat rombel kelas program studi');
      }
    };

    fetchKelases();
  }, [selectedProdiId, paramKelasId]);

  // 3. Load 2 Lists (Sudah Diambil & Belum Diambil) for Selected Rombel
  const fetchRombelCoursesHistory = useCallback(async () => {
    if (!selectedMasterKelasId) {
      setBelumDiambilList([]);
      setSudahDiambilList([]);
      setCheckedMks({});
      setNomorSk('');
      setSkCheckResult(null);
      return;
    }

    try {
      setLoadingLists(true);
      const res = await siakadService.getMataKuliahByRombelHistory({
        master_kelas_id: selectedMasterKelasId,
        tahun_akademik_id: selectedTaId || undefined,
      });

      const data = res?.data || {};
      const belum = Array.isArray(data.belum_diambil) ? data.belum_diambil : [];
      const sudah = Array.isArray(data.sudah_diambil) ? data.sudah_diambil : [];

      setBelumDiambilList(belum);
      setSudahDiambilList(sudah);

      // Sinkronkan Nomor SK aktif rombel dari database
      if (data.nomor_sk) {
        setNomorSk(data.nomor_sk);
        if (data.sk_info) {
          setSkCheckResult({
            id: data.sk_info.id,
            nomor_surat: data.sk_info.nomor_surat,
            is_found: true,
            is_valid: data.sk_info.is_valid,
            has_document: data.sk_info.has_document,
            status: data.sk_info.status,
            perihal: data.sk_info.perihal,
            tujuan: data.sk_info.tujuan,
            kode_unit: data.sk_info.kode_unit,
            tanggal_surat: data.sk_info.tanggal_surat,
            dokumen_url: data.sk_info.dokumen_url,
          });
        }
      }

      // Pre-select current semester package items if any
      const initialChecked: Record<number, CheckedMkState> = {};
      sudah.forEach((item: any) => {
        if (item.is_current_paket) {
          initialChecked[item.id] = {
            is_wajib: item.is_wajib ?? true,
            semester_anjuran: item.semester_anjuran || 1,
          };
        }
      });
      setCheckedMks(initialChecked);
    } catch (err) {
      console.error('Gagal memuat riwayat mata kuliah rombel:', err);
      toast.error('Gagal memuat daftar mata kuliah rombel');
    } finally {
      setLoadingLists(false);
    }
  }, [selectedMasterKelasId, selectedTaId]);

  useEffect(() => {
    fetchRombelCoursesHistory();
  }, [fetchRombelCoursesHistory]);

  // Selected Master Kelas Entity
  const selectedRombel = useMemo(() => {
    return masterKelases.find((k) => Number(k.id) === Number(selectedMasterKelasId)) || null;
  }, [masterKelases, selectedMasterKelasId]);

  // Selected Count & SKS from Belum Diambil
  const newlySelectedStats = useMemo(() => {
    let count = 0;
    let sks = 0;
    Object.keys(checkedMks).forEach((mkIdStr) => {
      const id = Number(mkIdStr);
      const mk = belumDiambilList.find((m) => m.id === id);
      if (mk) {
        count++;
        sks += mk.total_sks || mk.sks_teori || 0;
      }
    });
    return { count, sks };
  }, [checkedMks, belumDiambilList]);

  // Checkbox & Toggle Handlers for Belum Diambil
  const handleToggleCheck = (mk: any) => {
    setCheckedMks((prev) => {
      const next = { ...prev };
      if (next[mk.id]) {
        delete next[mk.id];
      } else {
        next[mk.id] = {
          is_wajib: true,
          semester_anjuran: mk.semester_anjuran || 1,
        };
      }
      return next;
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

  // Save selected courses into package
  const handleSavePaket = async () => {
    if (!selectedMasterKelasId) {
      toast.error('Pilih rombel kelas terlebih dahulu');
      return;
    }

    // Gabungkan: yang sudah di paket periode ini + yang baru dipilih dari belum diambil
    const currentPackageItems = sudahDiambilList
      .filter((s) => s.is_current_paket)
      .map((s) => ({
        mata_kuliah_id: s.id,
        semester_anjuran: s.semester_anjuran || 1,
        is_wajib: s.is_wajib ?? true,
      }));

    const newlyCheckedItems = Object.entries(checkedMks)
      .filter(([mkId]) => belumDiambilList.some((b) => b.id === Number(mkId)))
      .map(([mkId, state]) => ({
        mata_kuliah_id: Number(mkId),
        semester_anjuran: state.semester_anjuran,
        is_wajib: state.is_wajib,
      }));

    const allToSave = [...currentPackageItems, ...newlyCheckedItems];
    const cleanSk = nomorSk.trim();

    const validation = createPaketSchema.safeParse({
      master_kelas_id: selectedMasterKelasId,
      tahun_akademik_id: selectedTaId,
      nomor_sk: cleanSk,
      items: allToSave,
    });

    if (!validation.success) {
      const firstErr = validation.error.issues[0]?.message || 'Data formulir penetapan paket tidak valid';
      toast.error(firstErr);
      return;
    }

    // Periksa keabsahan dan ketersediaan berkas fisik SK ke modul Arsip
    let verifiedSk = skCheckResult;
    if (!verifiedSk || verifiedSk.nomor_surat !== cleanSk) {
      try {
        setIsCheckingSk(true);
        const res = await arsipService.checkNomorSk(cleanSk);
        verifiedSk = res?.data || null;
        setSkCheckResult(verifiedSk);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Gagal memverifikasi Nomor SK di modul Arsip');
        return;
      } finally {
        setIsCheckingSk(false);
      }
    }

    if (!verifiedSk || !verifiedSk.is_found) {
      toast.error(`Nomor SK '${cleanSk}' tidak terdaftar di modul Arsip. Simpan paket rombel gagal.`);
      return;
    }

    if (verifiedSk.status === 'dibatalkan') {
      toast.error(`Nomor SK '${cleanSk}' berstatus DIBATALKAN di modul Arsip. Simpan paket rombel gagal.`);
      return;
    }

    if (!verifiedSk.has_document) {
      toast.error(
        `Nomor SK '${cleanSk}' terdaftar di Arsip, tetapi belum memiliki berkas fisik dokumen scan. Simpan paket rombel gagal.`
      );
      return;
    }

    try {
      setSavingPaket(true);
      await siakadService.bulkSyncPaketMk({
        master_kelas_id: selectedMasterKelasId,
        tahun_akademik_id: selectedTaId || undefined,
        nomor_sk: cleanSk,
        items: allToSave,
      });

      toast.success(
        `Berhasil menyimpan ${allToSave.length} mata kuliah ke paket Kelas ${selectedRombel?.nama_kelas || ''} dengan SK '${cleanSk}'`
      );
      fetchRombelCoursesHistory();
      setActiveTab('sudah');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan paket mata kuliah');
    } finally {
      setSavingPaket(false);
    }
  };

  // Detach single course from current package
  const handleConfirmDetach = async () => {
    if (!detachingMk || !selectedMasterKelasId) return;

    // Remaining items excluding the detached one
    const remainingItems = sudahDiambilList
      .filter((s) => s.is_current_paket && s.id !== detachingMk.id)
      .map((s) => ({
        mata_kuliah_id: s.id,
        semester_anjuran: s.semester_anjuran || 1,
        is_wajib: s.is_wajib ?? true,
      }));

    try {
      setDetaching(true);
      if (remainingItems.length > 0) {
        await siakadService.bulkSyncPaketMk({
          master_kelas_id: selectedMasterKelasId,
          tahun_akademik_id: selectedTaId || undefined,
          nomor_sk: nomorSk.trim() || detachingMk.nomor_sk,
          items: remainingItems,
        });
      } else if (detachingMk.paket_id) {
        await siakadService.deletePaketMk(detachingMk.paket_id);
      }

      toast.success(`Mata kuliah ${detachingMk.nama} dilepas dari paket`);
      setIsConfirmClearOpen(false);
      setDetachingMk(null);
      fetchRombelCoursesHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal melepas mata kuliah dari paket');
    } finally {
      setDetaching(false);
    }
  };

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Column definitions for "Mata Kuliah Belum Diambil"
  const belumDiambilColumns: ColumnDef<any>[] = [
    {
      key: 'select',
      label: 'PILIH',
      align: 'center',
      render: (mk) => {
        const isChecked = Boolean(checkedMks[mk.id]);
        return (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isChecked}
              onChange={() => handleToggleCheck(mk)}
              title={isChecked ? 'Batal pilih mata kuliah' : 'Pilih mata kuliah untuk paket'}
            />
          </div>
        );
      },
    },
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row, idx) => (
        <span className="text-2xs font-mono font-bold text-slate-500">{idx + 1}</span>
      ),
    },
    {
      key: 'kode_mk',
      label: 'KODE & MATA KULIAH',
      render: (mk) => (
        <div>
          <span className="font-extrabold text-xs text-slate-900 block">{mk.nama}</span>
          <span className="text-2xs text-slate-400 font-mono">
            {mk.kode_mk} • {mk.kurikulum?.nama || 'Kurikulum OBE'}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SMT ANJURAN',
      align: 'center',
      render: (mk) => (
        <Badge variant="blue" className="text-2xs font-bold font-mono">
          Semester {mk.semester_anjuran || 1}
        </Badge>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (mk) => (
        <span className="font-bold text-xs tabular-nums text-slate-900">
          {mk.total_sks || mk.sks_teori || 0} SKS
        </span>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI',
      render: (mk) => (
        <span className="capitalize font-semibold text-2xs text-slate-600">
          {mk.kategori || 'Wajib'}
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
              title="Klik untuk mengubah sifat paket (Wajib / Pilihan)"
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
  ];

  // Column definitions for "Mata Kuliah Sudah Pernah Diambil"
  const sudahDiambilColumns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row, idx) => (
        <span className="text-2xs font-mono font-bold text-slate-500">{idx + 1}</span>
      ),
    },
    {
      key: 'kode_mk',
      label: 'KODE & MATA KULIAH',
      render: (mk) => (
        <div>
          <span className="font-extrabold text-xs text-slate-900 block">{mk.nama}</span>
          <span className="text-2xs text-slate-400 font-mono">
            {mk.kode_mk} • {mk.kurikulum?.nama || 'Kurikulum OBE'}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SMT ANJURAN',
      align: 'center',
      render: (mk) => (
        <Badge variant="blue" className="text-2xs font-bold font-mono">
          Semester {mk.semester_anjuran || 1}
        </Badge>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (mk) => (
        <span className="font-bold text-xs tabular-nums text-slate-900">
          {mk.total_sks || mk.sks_teori || 0} SKS
        </span>
      ),
    },
    {
      key: 'sifat',
      label: 'SIFAT PAKET',
      align: 'center',
      render: (mk) => (
        <Badge variant={mk.is_wajib ? 'green' : 'amber'} className="text-2xs font-bold">
          {mk.is_wajib ? 'Wajib' : 'Pilihan'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS PAKET',
      render: (mk) => {
        if (mk.is_current_paket) {
          return (
            <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={11} /> Paket Periode Ini
            </Badge>
          );
        }
        return (
          <Badge variant="gray" className="text-2xs font-bold">
            {mk.tahun_akademik?.nama || 'Riwayat Sebelumnya'}
          </Badge>
        );
      },
    },
    {
      key: 'nomor_sk',
      label: 'NOMOR SK',
      render: (mk) => {
        if (mk.nomor_sk) {
          return (
            <span className="font-mono text-2xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
              {mk.nomor_sk}
            </span>
          );
        }
        return <span className="text-2xs text-slate-400 font-medium">—</span>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (mk) => {
        if (!mk.is_current_paket) {
          return <span className="text-2xs text-slate-400 font-medium">Tersimpan</span>;
        }
        return (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              items={[
                {
                  label: 'Lepas dari Paket',
                  icon: <Trash2 size={13} className="text-rose-500" />,
                  variant: 'danger',
                  onClick: () => {
                    setDetachingMk(mk);
                    setIsConfirmClearOpen(true);
                  },
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // RBAC Loading Screen (Fail-Closed)
  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tambah Paket KRS"
          description="Tetapkan paket mata kuliah kurikulum per rombongan belajar (Master Kelas)."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'Paket KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Tambah Paket' },
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
          title="Tambah Paket KRS"
          description="Tetapkan paket mata kuliah kurikulum per rombongan belajar (Master Kelas)."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'Paket KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Tambah Paket' },
          ]}
        />
        <Card className="border border-slate-200">
          <CardBody className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Boxes size={24} />
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
              <Button variant="outline" size="sm" onClick={() => router.push('/siakad/obe/krs/paket')}>
                Kembali ke Daftar Paket
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Halaman (Hanya tombol Kembali ke Daftar, tanpa tombol Filter) */}
      <PageHeader
        title="Tambah Paket KRS"
        description="Pilih rombongan belajar (Master Kelas) untuk menampilkan dan menetapkan paket mata kuliah rencana studi mahasiswa."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE', href: '/siakad/obe' },
          { label: 'Paket KRS', href: '/siakad/obe/krs/paket' },
          { label: 'Tambah Paket' },
        ]}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/obe/krs/paket')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            className="text-xs font-bold"
          >
            Kembali ke Daftar
          </Button>
        }
      />

      {/* 2. Context Selection Card (Prodi, Tahun Akademik, Rombel Kelas) */}
      <Card className="border border-slate-200 shadow-2xs bg-white">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <AsyncSelect
                label="Program Studi *"
                placeholder="Pilih Program Studi..."
                loadOptions={loadProdiOptions}
                value={selectedProdiId}
                onChange={(opt: any) => {
                  setSelectedProdiId(opt?.value ? Number(opt.value) : null);
                  setSelectedMasterKelasId(null);
                }}
                defaultOptions={true}
              />
            </div>

            <div>
              <AsyncSelect
                label="Tahun Akademik *"
                placeholder="Pilih Tahun Akademik..."
                loadOptions={loadTahunAkademikOptions}
                value={selectedTaId}
                onChange={(opt: any) => setSelectedTaId(opt?.value ? Number(opt.value) : null)}
                defaultOptions={true}
              />
            </div>

            <div>
              <AsyncSelect
                key={`rombel-select-${selectedProdiId}`}
                label="Rombongan Belajar (Kelas) *"
                placeholder="Pilih Rombongan Belajar..."
                loadOptions={loadMasterKelasOptions}
                value={selectedMasterKelasId}
                onChange={(opt: any) => setSelectedMasterKelasId(opt?.value ? Number(opt.value) : null)}
                defaultOptions={true}
                isDisabled={!selectedProdiId}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Tampilan Kondisional: Muncul HANYA Jika Kelas Sudah Dipilih */}
      {!selectedMasterKelasId ? (
        /* Empty / Placeholder State */
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardBody className="py-14 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--module-primary-subtle)] text-[var(--module-primary)] flex items-center justify-center mx-auto border border-[var(--module-primary)]/20 shadow-2xs">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Pilih Rombongan Belajar (Kelas)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Silakan pilih <strong>Rombel Kelas</strong> pada formulir di atas untuk memuat daftar
                mata kuliah yang sudah pernah dan belum pernah diambil oleh kelas tersebut.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* Content Active: Rombel terpilih -> Tampilkan 2 List */
        <div className="space-y-4 animate-fade-in">
          {/* Banner Informasi Rombel Terpilih */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--module-primary-subtle)] text-[var(--module-primary)] flex items-center justify-center font-bold text-sm border border-[var(--module-primary)]/20">
                {selectedRombel?.nama_kelas || 'MK'}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  Kelas {selectedRombel?.nama_kelas || '-'}
                  <Badge variant="blue" className="text-2xs font-mono">
                    Angkatan {selectedRombel?.tahun_angkatan || '-'}
                  </Badge>
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Dosen PA: <strong>{selectedRombel?.dosenPa?.nama_lengkap || 'Belum Diatur'}</strong> •{' '}
                  {selectedRombel?.mahasiswas_count || 0} Mahasiswa Aktif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-2xs text-slate-700">
                <span className="font-semibold text-slate-500 block uppercase">Belum Diambil</span>
                <strong className="text-slate-900 text-xs">{belumDiambilList.length} MK</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-2xs text-emerald-800">
                <span className="font-semibold text-emerald-600 block uppercase">Sudah Diambil</span>
                <strong className="text-emerald-900 text-xs">{sudahDiambilList.length} MK</strong>
              </div>
            </div>
          </div>

          {/* Card Lampiran SK Penetapan Paket Rombel (Verifikasi Modul Arsip) */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardBody className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText size={15} className="text-[var(--module-primary)]" />
                    Lampiran Surat Keputusan (SK) Penetapan Paket
                    <span className="text-rose-500 font-bold">*</span>
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Nomor SK wajib terdaftar di <strong>Modul Arsip</strong> dan memiliki <strong>berkas fisik dokumen scan</strong> yang telah diunggah.
                  </p>
                </div>

                {skCheckResult && (
                  <div>
                    {skCheckResult.is_valid && skCheckResult.has_document ? (
                      <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-1 py-1 px-2.5">
                        <CheckCircle2 size={12} /> SK Sah & Dokumen Fisik Terlampir
                      </Badge>
                    ) : skCheckResult.status === 'dibatalkan' ? (
                      <Badge variant="rose" className="text-2xs font-bold inline-flex items-center gap-1 py-1 px-2.5">
                        <AlertTriangle size={12} /> SK Dibatalkan
                      </Badge>
                    ) : !skCheckResult.has_document && skCheckResult.is_found ? (
                      <Badge variant="amber" className="text-2xs font-bold inline-flex items-center gap-1 py-1 px-2.5">
                        <FileWarning size={12} /> Berkas Fisik Belum Diunggah
                      </Badge>
                    ) : (
                      <Badge variant="rose" className="text-2xs font-bold inline-flex items-center gap-1 py-1 px-2.5">
                        <AlertCircle size={12} /> SK Tidak Ditemukan
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Masukkan Nomor SK resmi (contoh: 12/SK/TI/X/2026)..."
                    value={nomorSk}
                    onChange={(e) => {
                      setNomorSk(e.target.value);
                      if (skCheckResult && skCheckResult.nomor_surat !== e.target.value.trim()) {
                        setSkCheckResult(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckSk();
                      }
                    }}
                    className="font-mono text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckSk()}
                  disabled={isCheckingSk || !nomorSk.trim()}
                  icon={isCheckingSk ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  className="text-xs font-bold whitespace-nowrap h-10 mb-0.5"
                >
                  {isCheckingSk ? 'Memeriksa...' : 'Cek SK di Arsip'}
                </Button>
              </div>

              {/* Rincian Status Verifikasi Arsip */}
              {skCheckResult && (
                <div className="pt-1">
                  {!skCheckResult.is_found ? (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-2xs text-rose-800 flex items-start gap-2">
                      <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold block">Nomor SK Tidak Ditemukan di Modul Arsip</strong>
                        Nomor SK &apos;{skCheckResult.nomor_surat}&apos; belum diterbitkan atau tidak terdaftar pada penomoran surat resmi kampus. Pastikan nomor SK diterbitkan terlebih dahulu melalui modul Arsip.
                      </div>
                    </div>
                  ) : skCheckResult.status === 'dibatalkan' ? (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-2xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold block">Nomor SK Berstatus DIBATALKAN</strong>
                        Nomor surat ini telah dibatalkan di modul Arsip sehingga tidak sah untuk digunakan sebagai landasan paket rombel.
                      </div>
                    </div>
                  ) : !skCheckResult.has_document ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-2xs text-amber-800 flex items-start gap-2">
                      <FileWarning size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold block">Dokumen / Berkas Fisik SK Belum Diunggah</strong>
                        Nomor SK &apos;{skCheckResult.nomor_surat}&apos; ditemukan di modul Arsip, namun belum memiliki scan berkas fisik (dokumen masih kosong). Penyimpanan paket rombel mensyaratkan berkas fisik SK telah diunggah di modul Arsip.
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-2xs text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-emerald-900">
                            {skCheckResult.perihal || 'SK Penetapan Paket Rombel'}
                          </strong>
                          <span className="text-emerald-700">
                            Unit: {skCheckResult.kode_unit || '-'} • Tanggal:{' '}
                            {skCheckResult.tanggal_surat || '-'} • Berkas fisik terverifikasi
                          </span>
                        </div>
                      </div>
                      {skCheckResult.dokumen_url && (
                        <a
                          href={skCheckResult.dokumen_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 hover:text-emerald-950 underline px-2 py-1 rounded bg-emerald-100/60 hover:bg-emerald-100 transition shrink-0"
                        >
                          <ExternalLink size={12} /> Lihat Berkas Fisik SK
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Navigasi Tab Baku 2 List Sesuai Standar UI */}
          <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('belum')}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 rounded-t-xl ${
                activeTab === 'belum'
                  ? 'border-b-2 border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'belum' ? 'text-[var(--module-primary)]' : 'text-slate-400'} />
              <span>Mata Kuliah Belum Pernah Diambil</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-2xs font-mono ${
                  activeTab === 'belum' ? 'bg-[var(--module-primary)] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {belumDiambilList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sudah')}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 rounded-t-xl ${
                activeTab === 'sudah'
                  ? 'border-b-2 border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <History size={14} className={activeTab === 'sudah' ? 'text-[var(--module-primary)]' : 'text-slate-400'} />
              <span>Mata Kuliah Sudah Pernah Diambil</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-2xs font-mono ${
                  activeTab === 'sudah' ? 'bg-[var(--module-primary)] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {sudahDiambilList.length}
              </span>
            </button>
          </div>

          {/* Aksi Khusus Tab Belum Diambil */}
          {activeTab === 'belum' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-2xs text-slate-500 font-medium">
                Pilih mata kuliah kurikulum di bawah ini untuk ditetapkan ke dalam paket rombel kelas.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                {newlySelectedStats.count > 0 && (
                  <span className="text-2xs font-semibold text-slate-600">
                    <strong className="text-[var(--module-primary)]">{newlySelectedStats.count} MK</strong> terpilih (
                    {newlySelectedStats.sks} SKS)
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={handleSavePaket}
                  disabled={savingPaket || newlySelectedStats.count === 0}
                  className="text-xs font-bold shadow-xs whitespace-nowrap"
                >
                  {savingPaket ? 'Menyimpan...' : 'Simpan ke Paket Rombel'}
                </Button>
              </div>
            </div>
          )}

          {/* Konten Tab 1: Mata Kuliah Belum Pernah Diambil */}
          {activeTab === 'belum' && (
            <div className="space-y-2">
              <DataTable
                columns={belumDiambilColumns}
                data={belumDiambilList}
                isLoading={loadingLists}
                emptyMessage="Semua mata kuliah dari kurikulum telah diambil oleh kelas ini."
              />
            </div>
          )}

          {/* Konten Tab 2: Mata Kuliah Sudah Pernah Diambil */}
          {activeTab === 'sudah' && (
            <div className="space-y-2">
              <DataTable
                columns={sudahDiambilColumns}
                data={sudahDiambilList}
                isLoading={loadingLists}
                emptyMessage="Kelas ini belum pernah mengambil mata kuliah apa pun."
              />
            </div>
          )}
        </div>
      )}

      {/* Dialog Konfirmasi Lepas Mata Kuliah dari Paket */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={() => {
          setIsConfirmClearOpen(false);
          setDetachingMk(null);
        }}
        onConfirm={handleConfirmDetach}
        title="Lepas Mata Kuliah dari Paket?"
        message={`Apakah Anda yakin ingin melepas mata kuliah ${detachingMk?.nama || ''} (${
          detachingMk?.kode_mk || ''
        }) dari paket rombel Kelas ${
          selectedRombel?.nama_kelas || ''
        }? Mata kuliah ini akan kembali tersedia di daftar 'Mata Kuliah Belum Diambil'.`}
        confirmText={detaching ? 'Melepas...' : 'Ya, Lepas dari Paket'}
        variant="danger"
      />
    </div>
  );
}
