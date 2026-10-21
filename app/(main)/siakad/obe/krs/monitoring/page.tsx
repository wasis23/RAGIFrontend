'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Filter,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { Select, type SelectOption } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { formatTahunAkademikLabel } from '@/lib/obe-settings';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

interface MonitoringProdiRow {
  prodi_id: number;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
  fakultas: string;
  total_mahasiswa_aktif: number;
  sudah_krs: number;
  draft: number;
  diajukan: number;
  disetujui: number;
  belum_krs: number;
  terkunci_keuangan: number;
  persentase_krs: number;
  persentase_disetujui: number;
}

const STATUS_KRS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status Pengisian' },
  { value: 'lengkap', label: '100% Sudah Mengisi' },
  { value: 'ada_belum', label: 'Terdapat Belum Mengisi' },
];

const STATUS_KEUANGAN_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status Keuangan' },
  { value: 'ada_terkunci', label: 'Terdapat Terkunci Keuangan' },
  { value: 'lunas', label: 'Bebas Tunggakan Keuangan' },
];

const PROGRES_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Kategori Progres' },
  { value: 'tinggi', label: 'Tinggi (≥ 80%)' },
  { value: 'sedang', label: 'Sedang (50% - 79%)' },
  { value: 'rendah', label: 'Rendah (< 50%)' },
];

export default function MonitoringKrsPage() {
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

  const permittedProdiIds = useMemo(
    () => userAdminProdis.map((p: any) => Number(p.program_studi_id)),
    [userAdminProdis]
  );

  // Context & Applied Filter States
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);
  const [filterProdiId, setFilterProdiId] = useState<number | null>(null);
  const [filterStatusKrs, setFilterStatusKrs] = useState<string>('');
  const [filterStatusKeuangan, setFilterStatusKeuangan] = useState<string>('');
  const [filterProgresKrs, setFilterProgresKrs] = useState<string>('');

  // Drawer Staged Filter States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [drawerTaId, setDrawerTaId] = useState<number | null>(null);
  const [drawerProdiId, setDrawerProdiId] = useState<number | null>(null);
  const [drawerStatusKrs, setDrawerStatusKrs] = useState<string>('');
  const [drawerStatusKeuangan, setDrawerStatusKeuangan] = useState<string>('');
  const [drawerProgresKrs, setDrawerProgresKrs] = useState<string>('');

  // Server-side Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Data & Summary States from Server
  const [summary, setSummary] = useState<any | null>(null);
  const [rows, setRows] = useState<MonitoringProdiRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load Initial Options (Tahun Akademik & Scoped Prodi)
  useEffect(() => {
    if (isAuthLoading || !user || !isAdminObe) return;

    const loadInitialContext = async () => {
      try {
        const res = await siakadService.getTahunAkademiks({ per_page: 50 });
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const activeTa = list.find((t) => t.is_active) || list[0];
        if (activeTa && selectedTaId === null) {
          setSelectedTaId(Number(activeTa.id));
          setDrawerTaId(Number(activeTa.id));
        }

        if (!isSuperAdmin && permittedProdiIds.length > 0 && filterProdiId === null) {
          setFilterProdiId(permittedProdiIds[0]);
          setDrawerProdiId(permittedProdiIds[0]);
        }
      } catch {
        toast.error('Gagal memuat tahun akademik');
      }
    };

    loadInitialContext();
  }, [isAuthLoading, user, isAdminObe, isSuperAdmin, permittedProdiIds, selectedTaId, filterProdiId]);

  // Load Monitoring Data from API with Full Server-side Filtering & Pagination
  const fetchMonitoringData = useCallback(async () => {
    if (!user || !isAdminObe) return;
    if (!isSuperAdmin && permittedProdiIds.length === 0) return;

    const targetProdiId = isSuperAdmin
      ? (filterProdiId || undefined)
      : (filterProdiId && permittedProdiIds.includes(filterProdiId)
          ? filterProdiId
          : permittedProdiIds[0]);

    try {
      setIsLoading(true);
      const res = await siakadService.getKrsMonitoring({
        tahun_akademik_id: selectedTaId || undefined,
        program_studi_id: targetProdiId,
        status_krs: filterStatusKrs || undefined,
        status_keuangan: filterStatusKeuangan || undefined,
        progres_krs: filterProgresKrs || undefined,
        page,
        limit,
      });

      if (res?.data) {
        const payload = res.data;
        const prodiList: MonitoringProdiRow[] = Array.isArray(payload.prodi) ? payload.prodi : [];
        setRows(prodiList);
        setSummary(payload.summary || null);
        setMeta(payload.meta || res.meta);
      }
    } catch {
      toast.error('Gagal memuat data monitoring KRS');
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    isAdminObe,
    isSuperAdmin,
    permittedProdiIds,
    filterProdiId,
    selectedTaId,
    filterStatusKrs,
    filterStatusKeuangan,
    filterProgresKrs,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // AsyncSelect Option Loaders
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

  // Drawer handlers
  const handleApplyFilter = () => {
    setSelectedTaId(drawerTaId);
    setFilterProdiId(drawerProdiId);
    setFilterStatusKrs(drawerStatusKrs);
    setFilterStatusKeuangan(drawerStatusKeuangan);
    setFilterProgresKrs(drawerProgresKrs);
    setPage(1);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilter = () => {
    const defaultProdi = isSuperAdmin ? null : (permittedProdiIds[0] || null);
    setDrawerProdiId(defaultProdi);
    setDrawerStatusKrs('');
    setDrawerStatusKeuangan('');
    setDrawerProgresKrs('');
    setFilterProdiId(defaultProdi);
    setFilterStatusKrs('');
    setFilterStatusKeuangan('');
    setFilterProgresKrs('');
    setPage(1);
    setIsFilterDrawerOpen(false);
  };

  // Columns definition for DataTable
  const columns: ColumnDef<MonitoringProdiRow>[] = [
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.nama_prodi} {row.jenjang ? `(${row.jenjang})` : ''}
          </span>
          <span className="text-2xs text-slate-400 block">
            Fakultas: {row.fakultas} • Kode: {row.kode_prodi || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'total_mhs',
      label: 'MHS AKTIF',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          {row.total_mahasiswa_aktif}
        </span>
      ),
    },
    {
      key: 'sudah_krs',
      label: 'SUDAH KRS',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-600 text-xs">
          {row.sudah_krs}
        </span>
      ),
    },
    {
      key: 'disetujui',
      label: 'DISETUJUI DPA',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-primary-600 text-xs">
          {row.disetujui}
        </span>
      ),
    },
    {
      key: 'belum_krs',
      label: 'BELUM KRS',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-rose-600 text-xs">
          {row.belum_krs}
        </span>
      ),
    },
    {
      key: 'terkunci_keuangan',
      label: 'TERKUNCI KEUANGAN',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-amber-600 text-xs">
          {row.terkunci_keuangan}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'PROGRES KRS',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant={row.persentase_krs >= 80 ? 'green' : row.persentase_krs >= 50 ? 'blue' : 'amber'}
            className="text-2xs font-mono font-bold"
          >
            {row.persentase_krs}% Terisi
          </Badge>
          <span className="text-2xs text-slate-400">
            {row.persentase_disetujui}% Disetujui
          </span>
        </div>
      ),
    },
  ];

  // RBAC Loading Screen (Fail-Closed)
  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Monitoring KRS Mahasiswa"
          description="Pemantauan progres dan rekapitulasi pengisian kartu rencana studi mahasiswa per program studi."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Monitoring KRS Mahasiswa' },
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
          title="Monitoring KRS Mahasiswa"
          description="Pemantauan progres dan rekapitulasi pengisian kartu rencana studi mahasiswa per program studi."
          breadcrumbs={[
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE', href: '/siakad/obe' },
            { label: 'KRS', href: '/siakad/obe/krs/paket' },
            { label: 'Monitoring KRS Mahasiswa' },
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
                Halaman monitoring KRS OBE hanya dapat diakses oleh personel yang memiliki
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
      <PageHeader
        title="Monitoring KRS Mahasiswa"
        description="Pemantauan progres dan rekapitulasi pengisian kartu rencana studi mahasiswa per program studi."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE', href: '/siakad/obe' },
          { label: 'KRS', href: '/siakad/obe/krs/paket' },
          { label: 'Monitoring KRS Mahasiswa' },
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-slate-200 shadow-2xs">
            <CardBody className="p-4">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Mahasiswa Aktif
              </span>
              <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                {summary.total_mahasiswa_aktif}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5 block">Cakupan Terfilter</span>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-2xs">
            <CardBody className="p-4">
              <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">
                Sudah Mengisi KRS
              </span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">
                {summary.total_sudah_krs}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5 block">Draf & Diajukan</span>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-2xs">
            <CardBody className="p-4">
              <span className="text-2xs font-bold text-primary-700 uppercase tracking-wider block">
                Disetujui Dosen PA
              </span>
              <span className="text-lg font-black text-primary-600 font-mono mt-1 block">
                {summary.total_disetujui}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5 block">Rencana Studi Valid</span>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-2xs">
            <CardBody className="p-4">
              <span className="text-2xs font-bold text-rose-700 uppercase tracking-wider block">
                Belum Mengisi KRS
              </span>
              <span className="text-lg font-black text-rose-600 font-mono mt-1 block">
                {summary.total_belum_krs}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5 block">Perlu Dihubungi</span>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-2xs">
            <CardBody className="p-4">
              <span className="text-2xs font-bold text-amber-700 uppercase tracking-wider block">
                Terkunci Keuangan
              </span>
              <span className="text-lg font-black text-amber-600 font-mono mt-1 block">
                {summary.total_terkunci_keuangan}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5 block">Tunggakan SPP / SIKEU</span>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tabel Rekapitulasi Per Program Studi with Server-side Pagination Meta */}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Tidak ada data monitoring program studi yang sesuai filter."
      />

      {/* Drawer Filter (1:1 Parity dengan Kolom Tabel) */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Monitoring KRS"
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
            <AsyncSelect
              label="Tahun Akademik"
              placeholder="Pilih Tahun Akademik..."
              loadOptions={loadTahunAkademikOptions}
              value={drawerTaId}
              onChange={(opt: any) => setDrawerTaId(opt?.value ? Number(opt.value) : null)}
              defaultOptions={true}
            />
          </div>

          <div>
            <AsyncSelect
              label="Program Studi"
              placeholder="Semua Program Studi..."
              loadOptions={loadProdiOptions}
              value={drawerProdiId}
              onChange={(opt: any) => setDrawerProdiId(opt?.value ? Number(opt.value) : null)}
              isClearable={isSuperAdmin}
              defaultOptions={true}
            />
          </div>

          <div>
            <Select
              label="Status Pengisian KRS"
              options={STATUS_KRS_OPTIONS}
              value={drawerStatusKrs}
              onChange={(val) => setDrawerStatusKrs(String(val || ''))}
            />
          </div>

          <div>
            <Select
              label="Status Keuangan (SIKEU)"
              options={STATUS_KEUANGAN_OPTIONS}
              value={drawerStatusKeuangan}
              onChange={(val) => setDrawerStatusKeuangan(String(val || ''))}
            />
          </div>

          <div>
            <Select
              label="Kategori Progres KRS"
              options={PROGRES_OPTIONS}
              value={drawerProgresKrs}
              onChange={(val) => setDrawerProgresKrs(String(val || ''))}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
