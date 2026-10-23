'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Boxes,
  Plus,
  Filter,
  Users,
  Copy,
  Edit3,
  ShieldAlert,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { formatTahunAkademikLabel } from '@/lib/obe-settings';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

const copyPaketSchema = z.object({
  target_master_kelas_id: z
    .number({ error: 'Rombel tujuan wajib dipilih' })
    .min(1, 'Rombel target wajib dipilih'),
});

type CopyPaketFormValues = z.infer<typeof copyPaketSchema>;

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama_kelas', label: 'Nama Kelas' },
  { value: 'tahun_angkatan', label: 'Tahun Angkatan' },
  { value: 'created_at', label: 'Waktu Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z (Naik)' },
  { value: 'desc', label: 'Z - A (Turun)' },
];

export default function PaketKrsListPage() {
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

  // Context Selection States (Defaults & Applied)
  const [defaultProdiId, setDefaultProdiId] = useState<number | null>(null);
  const [defaultTaId, setDefaultTaId] = useState<number | null>(null);

  const [appliedProdiId, setAppliedProdiId] = useState<number | null>(null);
  const [appliedTaId, setAppliedTaId] = useState<number | null>(null);
  const [appliedProdiName, setAppliedProdiName] = useState('');
  const [appliedTaName, setAppliedTaName] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedAngkatan, setAppliedAngkatan] = useState('');
  const [appliedSortBy, setAppliedSortBy] = useState('nama_kelas');
  const [appliedSortDir, setAppliedSortDir] = useState<'asc' | 'desc'>('asc');

  // List & Pagination States
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filter Drawer Staged States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [drawerProdiId, setDrawerProdiId] = useState<number | null>(null);
  const [drawerTaId, setDrawerTaId] = useState<number | null>(null);
  const [drawerProdiName, setDrawerProdiName] = useState('');
  const [drawerTaName, setDrawerTaName] = useState('');
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerAngkatan, setDrawerAngkatan] = useState('');
  const [drawerSortBy, setDrawerSortBy] = useState('nama_kelas');
  const [drawerSortDir, setDrawerSortDir] = useState<'asc' | 'desc'>('asc');

  // Copy Modal States
  const [copySourceRombel, setCopySourceRombel] = useState<any | null>(null);
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

          if (permitted.length > 0 && appliedProdiId === null) {
            const firstProdi = permitted[0];
            const pId = Number(firstProdi.id);
            const pName = `${firstProdi.nama} (${firstProdi.jenjang || 'S1'})`;
            setDefaultProdiId(pId);
            setAppliedProdiId(pId);
            setAppliedProdiName(pName);
            setDrawerProdiId(pId);
            setDrawerProdiName(pName);
          }
        }

        if (taRes?.data) {
          const taList: any[] = Array.isArray(taRes.data) ? taRes.data : taRes.data.items || [];
          const activeTa = taList.find((t) => t.is_active) || taList[0];
          if (activeTa && appliedTaId === null) {
            const tId = Number(activeTa.id);
            const tName = `${formatTahunAkademikLabel(activeTa)} ${activeTa.is_active ? '• (Aktif)' : ''}`;
            setDefaultTaId(tId);
            setAppliedTaId(tId);
            setAppliedTaName(tName);
            setDrawerTaId(tId);
            setDrawerTaName(tName);
          }
        }
      } catch (err) {
        console.error('Gagal memuat opsi dasar:', err);
        toast.error('Gagal memuat daftar program studi dan tahun akademik');
      }
    };

    loadInitialContext();
  }, [isAuthLoading, user, isAdminObe, isSuperAdmin, userAdminProdis, appliedProdiId, appliedTaId]);

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

  const loadTargetKelasOptions = useCallback(
    async (keyword: string) => {
      if (!appliedProdiId) return [];
      try {
        const res = await siakadService.getMasterKelasList({
          program_studi_id: appliedProdiId,
          search: keyword || undefined,
          is_active: true,
          per_page: 100,
        });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return list
          .filter((k) => k.id !== copySourceRombel?.id)
          .map((k) => ({
            value: Number(k.id),
            label: `Kelas ${k.nama_kelas} (${k.tahun_angkatan || '-'}) • ${k.mahasiswas_count || 0} Mhs`,
          }));
      } catch {
        return [];
      }
    },
    [appliedProdiId, copySourceRombel]
  );

  // 2. Fetch Master Kelas Data List
  const fetchData = useCallback(async () => {
    if (!appliedProdiId) {
      setItems([]);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await siakadService.getMasterKelasList({
        program_studi_id: appliedProdiId,
        tahun_akademik_id: appliedTaId || undefined,
        tahun_angkatan: appliedAngkatan || undefined,
        search: appliedSearch || undefined,
        sort_by: appliedSortBy,
        sort_order: appliedSortDir,
        page,
        per_page: limit,
      });

      const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(list);
      setMeta(res.meta);
    } catch (err) {
      console.error('Gagal memuat daftar rombel paket:', err);
      toast.error('Gagal memuat daftar rombel kelas paket KRS');
    } finally {
      setLoading(false);
    }
  }, [
    appliedProdiId,
    appliedTaId,
    appliedAngkatan,
    appliedSearch,
    appliedSortBy,
    appliedSortDir,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter Drawer Handlers
  const handleOpenDrawer = () => {
    setDrawerProdiId(appliedProdiId);
    setDrawerTaId(appliedTaId);
    setDrawerProdiName(appliedProdiName);
    setDrawerTaName(appliedTaName);
    setDrawerSearch(appliedSearch);
    setDrawerAngkatan(appliedAngkatan);
    setDrawerSortBy(appliedSortBy);
    setDrawerSortDir(appliedSortDir);
    setIsFilterDrawerOpen(true);
  };

  const handleApplyFilter = () => {
    setAppliedProdiId(drawerProdiId);
    setAppliedTaId(drawerTaId);
    setAppliedProdiName(drawerProdiName);
    setAppliedTaName(drawerTaName);
    setAppliedSearch(drawerSearch);
    setAppliedAngkatan(drawerAngkatan);
    setAppliedSortBy(drawerSortBy);
    setAppliedSortDir(drawerSortDir);
    setPage(1);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilter = () => {
    setDrawerProdiId(defaultProdiId);
    setDrawerTaId(defaultTaId);
    setDrawerSearch('');
    setDrawerAngkatan('');
    setDrawerSortBy('nama_kelas');
    setDrawerSortDir('asc');

    setAppliedProdiId(defaultProdiId);
    setAppliedTaId(defaultTaId);
    setAppliedSearch('');
    setAppliedAngkatan('');
    setAppliedSortBy('nama_kelas');
    setAppliedSortDir('asc');
    setPage(1);
    setIsFilterDrawerOpen(false);
  };



  // Open Copy Package Modal
  const handleOpenCopy = (row: any) => {
    setCopySourceRombel(row);
    resetCopyForm();
    setIsCopyModalOpen(true);
  };

  const onCopySubmit = async (values: CopyPaketFormValues) => {
    if (!copySourceRombel) return;
    const pMks = copySourceRombel.paket_mks || [];
    if (pMks.length === 0) {
      toast.error('Rombel ini belum memiliki paket mata kuliah untuk disalin');
      return;
    }

    const sourceSk = pMks.find((p: any) => p.nomor_sk)?.nomor_sk;
    if (!sourceSk) {
      toast.error('Rombel sumber belum memiliki Nomor SK. Silakan atur paket dan lampirkan Nomor SK melalui formulir Tambah Paket.');
      return;
    }

    const itemsPayload = pMks.map((p: any) => ({
      mata_kuliah_id: Number(p.mata_kuliah_id),
      semester_anjuran: p.semester_anjuran || p.mata_kuliah?.semester_anjuran || 1,
      is_wajib: p.is_wajib ?? true,
    }));

    try {
      setCopying(true);
      await siakadService.bulkSyncPaketMk({
        master_kelas_id: values.target_master_kelas_id,
        tahun_akademik_id: appliedTaId || undefined,
        nomor_sk: sourceSk,
        items: itemsPayload,
      });

      toast.success('Paket mata kuliah berhasil diduplikasi ke rombel tujuan');
      setIsCopyModalOpen(false);
      resetCopyForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menduplikasi paket rombel');
    } finally {
      setCopying(false);
    }
  };

  // Table Columns Definition
  const columns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row, idx) => (
        <span className="text-2xs font-mono font-bold text-slate-500">
          {meta?.from ? meta.from + idx : idx + 1}
        </span>
      ),
    },
    {
      key: 'nama_kelas',
      label: 'ROMBONGAN BELAJAR (KELAS)',
      render: (row) => (
        <div>
          <span className="font-extrabold text-xs text-slate-900 block">
            Kelas {row.nama_kelas}
          </span>
          <span className="text-2xs text-slate-500 block">
            Angkatan {row.tahun_angkatan || '-'} • DPA:{' '}
            <strong className="text-slate-700">
              {row.dosenPa?.nama_lengkap || row.dosen_pa?.nama_lengkap || 'Belum Diatur'}
            </strong>
          </span>
        </div>
      ),
    },
    {
      key: 'prodi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-800 block">
            {row.programStudi?.nama || row.program_studi?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-400 font-mono">
            {row.programStudi?.jenjang || row.program_studi?.jenjang || 'S1'} •{' '}
            {row.programStudi?.kode_prodi || row.program_studi?.kode_prodi || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'mahasiswas_count',
      label: 'MAHASISWA',
      align: 'center',
      render: (row) => (
        <span className="font-bold text-xs tabular-nums text-slate-800">
          {row.mahasiswas_count || 0}{' '}
          <span className="text-2xs font-medium text-slate-500">Mhs</span>
        </span>
      ),
    },
    {
      key: 'paket_mks',
      label: 'PAKET MATA KULIAH',
      render: (row) => {
        const pMks: any[] = row.paket_mks || [];
        if (pMks.length === 0) {
          return (
            <div>
              <Badge variant="gray" className="text-2xs font-bold">
                Belum Ditetapkan
              </Badge>
              <span className="text-2xs text-slate-400 block mt-0.5">0 MK (0 SKS)</span>
            </div>
          );
        }

        const totalSks = pMks.reduce(
          (acc, p) => acc + (p.mata_kuliah?.total_sks || p.mata_kuliah?.sks || 0),
          0
        );
        const wajibCount = pMks.filter((p) => p.is_wajib).length;
        const pilihanCount = pMks.length - wajibCount;

        return (
          <div>
            <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={11} /> {pMks.length} Mata Kuliah Terikat
            </Badge>
            <span className="text-2xs text-slate-600 font-medium block mt-0.5">
              <strong className="text-[var(--module-primary)]">{totalSks} SKS</strong> • {wajibCount} Wajib
              {pilihanCount > 0 ? `, ${pilihanCount} Pilihan` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const pMks: any[] = row.paket_mks || [];
        const hasPaket = pMks.length > 0;

        return (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              items={[
                {
                  label: hasPaket ? 'Ubah Paket Mata Kuliah' : 'Atur Paket Mata Kuliah',
                  icon: <Edit3 size={14} />,
                  onClick: () =>
                    router.push(
                      `/siakad/obe/krs/paket/create?master_kelas_id=${row.id}&program_studi_id=${
                        row.program_studi_id
                      }${appliedTaId ? `&tahun_akademik_id=${appliedTaId}` : ''}`
                    ),
                },
                {
                  label: 'Salin Paket ke Rombel Lain',
                  icon: <Copy size={14} />,
                  disabled: !hasPaket,
                  onClick: () => handleOpenCopy(row),
                },
                {
                  label: 'Kelola Mahasiswa Rombel',
                  icon: <Users size={14} />,
                  onClick: () => router.push('/siakad/obe/pemetaan-mahasiswa-kelas'),
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
          title="Paket KRS"
          description="Daftar rombongan belajar (Master Kelas) dan penetapan paket mata kuliah rencana studi mahasiswa."
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
          description="Daftar rombongan belajar (Master Kelas) dan penetapan paket mata kuliah rencana studi mahasiswa."
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
        description="Daftar rombongan belajar (Master Kelas) dan penetapan paket mata kuliah rencana studi mahasiswa untuk auto-enroll 1-klik."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE', href: '/siakad/obe' },
          { label: 'KRS', href: '/siakad/obe/krs/paket' },
          { label: 'Paket KRS' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Filter size={16} />}
              onClick={handleOpenDrawer}
              className="text-xs font-bold"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() =>
                router.push(
                  `/siakad/obe/krs/paket/create${
                    appliedProdiId ? `?program_studi_id=${appliedProdiId}` : ''
                  }${appliedTaId ? `&tahun_akademik_id=${appliedTaId}` : ''}`
                )
              }
              className="text-xs font-bold shadow-xs"
            >
              Tambah Data
            </Button>
          </div>
        }
      />

      {/* 2. Active Filter Bar (Konteks Ringkas) */}
      {(appliedProdiName || appliedTaName || appliedSearch || appliedAngkatan) && (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">Filter Aktif:</span>
            {appliedProdiName && (
              <Badge variant="blue" className="text-2xs font-semibold">
                Prodi: {appliedProdiName}
              </Badge>
            )}
            {appliedTaName && (
              <Badge variant="green" className="text-2xs font-semibold">
                Tahun Akademik: {appliedTaName}
              </Badge>
            )}
            {appliedSearch && (
              <Badge variant="purple" className="text-2xs font-semibold">
                Pencarian: "{appliedSearch}"
              </Badge>
            )}
            {appliedAngkatan && (
              <Badge variant="amber" className="text-2xs font-semibold">
                Angkatan: {appliedAngkatan}
              </Badge>
            )}
          </div>
          {(appliedSearch ||
            appliedAngkatan ||
            appliedSortBy !== 'nama_kelas' ||
            appliedSortDir !== 'asc' ||
            (defaultProdiId && appliedProdiId !== defaultProdiId) ||
            (defaultTaId && appliedTaId !== defaultTaId)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="text-2xs text-slate-500 hover:text-slate-800 h-auto py-1 px-2"
            >
              Reset Filter
            </Button>
          )}
        </div>
      )}

      {/* 3. Main DataTable */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          appliedProdiId
            ? 'Tidak ada rombongan belajar (Master Kelas) pada program studi ini.'
            : 'Silakan buka panel Filter untuk memilih Program Studi.'
        }
      />

      {/* 4. Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Rombongan Belajar"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="outline" size="sm" onClick={handleResetFilter} className="text-xs">
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyFilter} className="text-xs font-bold">
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <AsyncSelect
              label="Program Studi"
              placeholder="Pilih Program Studi..."
              loadOptions={loadProdiOptions}
              value={drawerProdiId}
              onChange={(opt: any) => {
                setDrawerProdiId(opt?.value ? Number(opt.value) : null);
                setDrawerProdiName(opt?.label || '');
              }}
              defaultOptions={true}
            />
          </div>

          <div>
            <AsyncSelect
              label="Tahun Akademik"
              placeholder="Pilih Tahun Akademik..."
              loadOptions={loadTahunAkademikOptions}
              value={drawerTaId}
              onChange={(opt: any) => {
                setDrawerTaId(opt?.value ? Number(opt.value) : null);
                setDrawerTaName(opt?.label || '');
              }}
              defaultOptions={true}
            />
          </div>

          <div>
            <Input
              label="Pencarian Kelas / DPA"
              placeholder="Ketik nama kelas atau nama DPA..."
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Tahun Angkatan"
              placeholder="Contoh: 2024"
              type="number"
              value={drawerAngkatan}
              onChange={(e) => setDrawerAngkatan(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              options={SORT_BY_OPTIONS}
              value={drawerSortBy}
              onChange={(val) => setDrawerSortBy(val)}
            />
            <Select
              label="Arah Urutan"
              options={SORT_DIR_OPTIONS}
              value={drawerSortDir}
              onChange={(val) => setDrawerSortDir(val as 'asc' | 'desc')}
            />
          </div>
        </div>
      </Drawer>

      {/* 6. Modal Salin Paket ke Rombel Lain */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          resetCopyForm();
        }}
        title="Duplikasi Paket Mata Kuliah ke Rombel Lain"
      >
        <form onSubmit={handleCopySubmit(onCopySubmit)} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-2xs font-bold text-slate-500 uppercase block">Rombel Sumber:</span>
            <p className="text-xs font-bold text-slate-800">
              Kelas {copySourceRombel?.nama_kelas || '-'} ({copySourceRombel?.tahun_angkatan || '-'})
            </p>
            <p className="text-2xs text-slate-500">
              Akan menyalin <strong>{copySourceRombel?.paket_mks?.length || 0} mata kuliah</strong> ke rombel target yang dipilih.
            </p>
          </div>

          <Controller
            name="target_master_kelas_id"
            control={copyControl}
            render={({ field }) => (
              <AsyncSelect
                label="Pilih Rombel Tujuan (Master Kelas) *"
                placeholder="Cari rombel target..."
                loadOptions={loadTargetKelasOptions}
                value={field.value || null}
                onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : null)}
                error={copyErrors.target_master_kelas_id?.message}
                defaultOptions={true}
              />
            )}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCopyModalOpen(false);
                resetCopyForm();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={copying}
              icon={<Copy size={14} />}
            >
              {copying ? 'Menduplikasi...' : 'Salin Paket Sekarang'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
