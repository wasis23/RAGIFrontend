'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Building,
  UserCheck
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { arsipService } from '@/services/arsip.service';
import { moduleService } from '@/services/module.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import { 
  type RequestNomorSurat, 
  type StatusRequestNomor,
  STATUS_REQUEST_NOMOR_OPTIONS,
  SORT_DIR_OPTIONS,
} from '@/types/arsip.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

export default function RequestNomorSuratListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('arsip.request.approve');

  const [data, setData] = useState<RequestNomorSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterModule, setFilterModule] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
      };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterModule) params.module_origin = filterModule;
      if (sortBy) params.sort_by = sortBy;
      if (sortDir) params.sort_dir = sortDir;

      const res = await arsipService.getRequestList(params);
      const rawData: any = res.data;
      const items: RequestNomorSurat[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const paginationMeta: PaginationMeta | undefined = res.meta || rawData?.meta;
      setData(items);
      setMeta(paginationMeta);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat permohonan nomor surat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, limit, filterStatus, filterModule]);

  const handleApplyFilter = () => {
    setPage(1);
    setDrawerOpen(false);
    fetchRequests();
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterStatus('');
    setFilterModule('');
    setSortBy('created_at');
    setSortDir('desc');
    setPage(1);
    setDrawerOpen(false);
    setTimeout(fetchRequests, 50);
  };

  const columns: ColumnDef<RequestNomorSurat>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: RequestNomorSurat, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'kode_request',
      label: 'KODE REQUEST',
      render: (row: RequestNomorSurat) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-slate-900">{row.kode_request}</span>
          <span className="text-2xs text-slate-400">
            Diajukan: {new Date(row.created_at).toLocaleDateString('id-ID')}
          </span>
        </div>
      ),
    },
    {
      key: 'module_origin',
      label: 'MODUL ASAL & TANGGAL',
      render: (row: RequestNomorSurat) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Badge variant="blue" className="uppercase text-2xs font-semibold">
              {row.module_origin}
            </Badge>
          </div>
          <span className="text-2xs text-slate-500 mt-0.5">
            Tgl Surat: {row.tanggal_surat}
          </span>
        </div>
      ),
    },
    {
      key: 'pemohon',
      label: 'PEMOHON',
      render: (row: RequestNomorSurat) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-xs font-semibold text-slate-800">{row.user?.name || `User #${row.user_id}`}</span>
          <span className="text-2xs text-slate-400 truncate">{row.user?.email || '-'}</span>
        </div>
      ),
    },
    {
      key: 'perihal',
      label: 'PERIHAL & TUJUAN',
      render: (row: RequestNomorSurat) => (
        <div className="flex flex-col max-w-sm">
          <span className="text-xs font-semibold text-slate-800 line-clamp-1">{row.perihal}</span>
          <span className="text-2xs text-slate-400 truncate">
            Kepada: {row.tujuan || '-'} • Unit: {row.kode_unit}/{row.kode_klasifikasi}
          </span>
        </div>
      ),
    },
    {
      key: 'jumlah',
      label: 'JUMLAH',
      align: 'center',
      render: (row: RequestNomorSurat) => (
        <span className="font-mono font-bold text-xs text-slate-700">
          {row.jumlah_nomor} Nomor
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row: RequestNomorSurat) => {
        let variant: 'warning' | 'success' | 'danger' = 'warning';
        let label = 'Menunggu';
        if (row.status === 'disetujui') {
          variant = 'success';
          label = 'Disetujui';
        } else if (row.status === 'ditolak') {
          variant = 'danger';
          label = 'Ditolak';
        }
        return (
          <Badge variant={variant} className="capitalize text-2xs font-semibold">
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (row: RequestNomorSurat) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              {
                label: row.status === 'menunggu_verifikasi' ? 'Verifikasi Permohonan' : 'Lihat Detail Permohonan',
                icon: <UserCheck size={14} />,
                onClick: () => {
                  router.push(`/arsip/request-nomor/${row.id}`);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Permohonan Nomor Surat Masuk"
        description="Daftar pengajuan nomor surat resmi dari berbagai modul kampus yang memerlukan verifikasi arsip"
        action={
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setDrawerOpen(true)}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
          >
            <Filter size={16} className="mr-1.5" />
            Filter
          </Button>
        }
      />

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada permohonan nomor surat yang masuk."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter Permohonan"
        width="400px"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian Bebas"
            placeholder="Cari kode request, perihal, pemohon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Status Permohonan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={STATUS_REQUEST_NOMOR_OPTIONS}
          />

          <AsyncSelect
            label="Asal Modul"
            placeholder="Pilih modul asal..."
            loadOptions={async (query) => {
              const modules = await moduleService.getAllModules();
              const filtered = (modules || []).filter(
                (m) =>
                  m.name.toLowerCase().includes(query.toLowerCase()) ||
                  m.code.toLowerCase().includes(query.toLowerCase())
              );
              return filtered.map((m) => ({
                value: m.code,
                label: `${m.name} (${m.code})`,
              }));
            }}
            value={filterModule}
            onChange={(opt: any) => setFilterModule(opt?.value || '')}
            isClearable
          />

          {/* Sort By & Sort Direction dalam format grid 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val || 'created_at')}
              options={[
                { value: 'created_at', label: 'Waktu Pengajuan' },
                { value: 'kode_request', label: 'Kode Request' },
                { value: 'tanggal_surat', label: 'Tanggal Surat' },
                { value: 'module_origin', label: 'Asal Modul' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val) => setSortDir(val || 'desc')}
              options={SORT_DIR_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
            <Button variant="outline" size="md" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              className="bg-[var(--module-primary)] hover:opacity-90 text-white"
              onClick={handleApplyFilter}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
