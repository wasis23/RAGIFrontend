'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Clock, Edit2, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

interface FilterState {
  search: string;
  status: string;
  mode_penilaian: string;
  sortBy: string;
  sortDir: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'semua',
  mode_penilaian: 'semua',
  sortBy: 'kode',
  sortDir: 'desc',
};

const STATUS_PERIODE_OPTIONS: SelectOption[] = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'aktif', label: 'Periode Aktif' },
  { value: 'arsip', label: 'Arsip / Non-aktif' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'kode', label: 'Kode Periode' },
  { value: 'nama', label: 'Nama Periode' },
  { value: 'tahun_mulai', label: 'Tahun Mulai' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'desc', label: 'Menurun (Z-A / Baru)' },
  { value: 'asc', label: 'Menaik (A-Z / Lama)' },
];

export default function TahunAkademikPage() {
  const router = useRouter();
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Limit State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterForm, setFilterForm] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Active Period Confirm Dialog State
  const [activeTarget, setActiveTarget] = useState<any | null>(null);
  const [settingActive, setSettingActive] = useState(false);

  const modeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.MODE_PENILAIAN);
  const modeLabel = (v: string) => modeOptions.find((o) => o.value === v)?.label || v || '-';

  const filterModeOptions: SelectOption[] = useMemo(
    () => [{ value: 'semua', label: 'Semua Mode Penilaian' }, ...modeOptions],
    [modeOptions]
  );

  const fetchTahunAkademiks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        per_page: limit,
      };

      if (appliedFilters.search.trim()) {
        params.search = appliedFilters.search.trim();
      }
      if (appliedFilters.status !== 'semua') {
        params.status = appliedFilters.status;
      }
      if (appliedFilters.mode_penilaian !== 'semua') {
        params.mode_penilaian = appliedFilters.mode_penilaian;
      }
      if (appliedFilters.sortBy) {
        params.sort_by = appliedFilters.sortBy;
      }
      if (appliedFilters.sortDir) {
        params.sort_order = appliedFilters.sortDir;
      }

      const res = await siakadService.getTahunAkademiks(params);
      if (res.data) {
        const raw = res.data;
        setTahunAkademiks(Array.isArray(raw) ? raw : (raw.items || []));
        if (res.meta) {
          setMeta(res.meta);
        } else if (Array.isArray(raw)) {
          setMeta({
            current_page: 1,
            per_page: raw.length,
            total: raw.length,
            last_page: 1,
            from: raw.length > 0 ? 1 : 0,
            to: raw.length,
          });
        }
      }
    } catch {
      toast.error('Gagal memuat daftar tahun akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahunAkademiks();
  }, [appliedFilters, page, limit]);

  const executeSetActive = async () => {
    if (!activeTarget) return;
    try {
      setSettingActive(true);
      await siakadService.setActiveTahunAkademik(activeTarget.id);
      toast.success(`Periode ${activeTarget.nama} berhasil ditetapkan sebagai periode aktif`);
      setActiveTarget(null);
      fetchTahunAkademiks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengubah periode aktif');
    } finally {
      setSettingActive(false);
    }
  };

  const handleResetFilter = () => {
    setFilterForm(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setShowFilter(false);
  };

  const isFiltered = useMemo(() => {
    return (
      appliedFilters.search !== '' ||
      appliedFilters.status !== 'semua' ||
      appliedFilters.mode_penilaian !== 'semua' ||
      appliedFilters.sortBy !== 'kode' ||
      appliedFilters.sortDir !== 'desc'
    );
  }, [appliedFilters]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row, idx) => (
        <span className="font-bold text-slate-400 text-xs">{(meta?.from ?? 1) + idx}</span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE PERIODE',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PERIODE TAHUN AKADEMIK',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.nama}</span>
          <span className="text-2xs text-slate-500">
            Tahun Ajaran: {row.tahun_mulai || '-'} / {row.tahun_selesai || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS PERIODE',
      align: 'center',
      render: (row) =>
        row.is_active ? (
          <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-2">
            <Star size={12} />
            Periode Aktif
          </Badge>
        ) : (
          <Badge variant="gray" className="text-2xs">
            Arsip / Non-aktif
          </Badge>
        ),
    },
    {
      key: 'mode_penilaian',
      label: 'MODE PENILAIAN',
      align: 'center',
      render: (row) => (
        <Badge variant="purple" className="text-2xs font-semibold">
          {modeLabel(row.mode_penilaian)}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              ...(!row.is_active
                ? [
                  {
                    label: 'Set Sebagai Aktif',
                    icon: <Star size={14} className="text-amber-500" />,
                    onClick: () => setActiveTarget(row),
                  },
                ]
                : []),
              {
                label: 'Edit Periode',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/siakad/master/tahun-akademik/${row.id}/edit`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tahun & Periode Akademik"
        description="Kelola master semester aktif, aktivasi kalender akademik, dan kontrol mode penilaian perkuliahan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Master Data', href: '/siakad/master/fakultas' },
          { label: 'Tahun Akademik' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                setFilterForm(appliedFilters);
                setShowFilter(true);
              }}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/siakad/master/tahun-akademik/create')}
            >
              Buka Periode Baru
            </Button>
          </div>
        }
      />

      <div
        className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ background: 'var(--module-primary-subtle)', borderColor: 'var(--module-primary)' }}
      >
        <Clock size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--module-primary)' }} />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">Informasi Penetapan Periode Aktif</p>
          <p className="text-slate-600 leading-relaxed">
            Menetapkan periode aktif akan secara otomatis mensinkronkan sesi pengisian KRS mahasiswa, jadwal perkuliahan, penawaran jadwal kuliah baru, serta penagihan SPP/UKT pada modul SIKEU untuk semester bersangkutan.
          </p>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">Filter Aktif:</span>
            {appliedFilters.search && (
              <Badge variant="blue" className="text-2xs">
                Kata kunci: "{appliedFilters.search}"
              </Badge>
            )}
            {appliedFilters.status !== 'semua' && (
              <Badge variant="blue" className="text-2xs">
                Status: {appliedFilters.status === 'aktif' ? 'Periode Aktif' : 'Arsip'}
              </Badge>
            )}
            {appliedFilters.mode_penilaian !== 'semua' && (
              <Badge variant="purple" className="text-2xs">
                Mode: {modeLabel(appliedFilters.mode_penilaian)}
              </Badge>
            )}
            <span className="text-slate-400">({meta?.total ?? tahunAkademiks.length} data ditemukan)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilter}
            className="text-2xs text-rose-600 hover:text-rose-700 h-6 px-2 font-medium"
          >
            Hapus Filter
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tahunAkademiks}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada periode tahun akademik."
      />

      {/* Drawer Filter */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tahun Akademik"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAppliedFilters(filterForm);
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Kata Kunci"
            placeholder="Cari kode atau nama periode..."
            value={filterForm.search}
            onChange={(e) => setFilterForm({ ...filterForm, search: e.target.value })}
          />

          <Select
            label="Status Periode"
            options={STATUS_PERIODE_OPTIONS}
            value={filterForm.status}
            onChange={(val: any) => setFilterForm({ ...filterForm, status: String(val) })}
          />

          <Select
            label="Mode Penilaian"
            options={filterModeOptions}
            value={filterForm.mode_penilaian}
            onChange={(val: any) => setFilterForm({ ...filterForm, mode_penilaian: String(val) })}
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <Select
              label="Urutkan"
              options={SORT_BY_OPTIONS}
              value={filterForm.sortBy}
              onChange={(val: any) => setFilterForm({ ...filterForm, sortBy: String(val) })}
            />
            <Select
              label="Arah"
              options={SORT_DIR_OPTIONS}
              value={filterForm.sortDir}
              onChange={(val: any) => setFilterForm({ ...filterForm, sortDir: String(val) })}
            />
          </div>
        </div>
      </Drawer>

      {/* Konfirmasi Aktivasi Periode */}
      <ConfirmDialog
        isOpen={!!activeTarget}
        onClose={() => setActiveTarget(null)}
        onConfirm={executeSetActive}
        title="Aktivasi Periode Tahun Akademik"
        message={
          <div>
            <p>
              Apakah Anda yakin ingin menetapkan periode{' '}
              <strong className="text-slate-900 font-bold">
                {activeTarget?.nama} ({activeTarget?.kode})
              </strong>{' '}
              sebagai periode aktif?
            </p>
            <p className="text-2xs text-slate-500 mt-2">
              Perhatian: Sesi pengisian KRS mahasiswa, pembukaan jadwal perkuliahan, dan tagihan SPP/UKT semester pada SIKEU akan otomatis beralih ke periode ini.
            </p>
          </div>
        }
        confirmText={settingActive ? 'Mengaktifkan...' : 'Ya, Tetapkan Periode Aktif'}
        cancelText="Batal"
        variant="primary"
        isLoading={settingActive}
      />
    </div>
  );
}
