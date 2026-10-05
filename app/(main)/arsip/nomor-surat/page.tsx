'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Filter, 
  Eye, 
  XCircle, 
  Calendar,
  Building
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { arsipService } from '@/services/arsip.service';
import { moduleService } from '@/services/module.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import { 
  type NomorSurat, 
  STATUS_NOMOR_SURAT_OPTIONS,
  SORT_DIR_OPTIONS,
} from '@/types/arsip.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

function DaftarNomorSuratContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('arsip.nomor_surat.create');
  const canCancel = hasPermission('arsip.nomor_surat.update');

  const [data, setData] = useState<NomorSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterModule, setFilterModule] = useState('');
  const [sortBy, setSortBy] = useState('nomor_surat');
  const [sortDir, setSortDir] = useState('desc');

  // Cancel Dialog State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedNomor, setSelectedNomor] = useState<NomorSurat | null>(null);
  const [alasanBatal, setAlasanBatal] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Check query param action=generate
  useEffect(() => {
    if (searchParams.get('action') === 'generate') {
      router.push('/arsip/nomor-surat/create');
    }
  }, [searchParams, router]);

  const fetchNomorSurat = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
      };
      if (search) params.search = search;
      if (filterUnit) params.kode_unit = filterUnit;
      if (filterKlasifikasi) params.kode_klasifikasi = filterKlasifikasi;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;
      if (filterModule) params.module_origin = filterModule;
      if (sortBy) params.sort_by = sortBy;
      if (sortDir) params.sort_dir = sortDir;

      const res = await arsipService.getNomorSuratList(params);
      const rawData: any = res.data;
      const items: NomorSurat[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const paginationMeta: PaginationMeta | undefined = res.meta || rawData?.meta;
      setData(items);
      setMeta(paginationMeta);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat daftar nomor surat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNomorSurat();
  }, [page, limit, filterTahun, filterStatus, filterModule]);

  const handleApplyFilter = () => {
    setPage(1);
    setDrawerOpen(false);
    fetchNomorSurat();
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterUnit('');
    setFilterKlasifikasi('');
    setFilterTahun('');
    setFilterStatus('');
    setFilterModule('');
    setSortBy('nomor_surat');
    setSortDir('desc');
    setPage(1);
    setDrawerOpen(false);
    setTimeout(() => {
      fetchNomorSurat();
    }, 50);
  };

  const handleOpenCancelDialog = (row: NomorSurat) => {
    setSelectedNomor(row);
    setAlasanBatal('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedNomor) return;
    if (!alasanBatal.trim()) {
      toast.error('Alasan pembatalan nomor surat wajib diisi.');
      return;
    }

    try {
      setSubmittingCancel(true);
      await arsipService.batalkanNomorSurat(selectedNomor.id, alasanBatal);
      toast.success(`Nomor surat ${selectedNomor.nomor_surat} berhasil dibatalkan.`);
      setCancelDialogOpen(false);
      fetchNomorSurat();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal membatalkan nomor surat.'));
    } finally {
      setSubmittingCancel(false);
    }
  };


  // Columns definition (Max 12px, soft contrast, 2-line format)
  const columns: ColumnDef<NomorSurat>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: NomorSurat, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'nomor_surat',
      label: 'NOMOR SURAT RESMI',
      render: (row: NomorSurat) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-slate-900">{row.nomor_surat}</span>
          <span className="text-2xs text-slate-400 font-mono">
            Urut: #{row.nomor_urut} • Tgl: {row.tanggal_surat}
          </span>
        </div>
      ),
    },
    {
      key: 'perihal',
      label: 'PERIHAL & TUJUAN',
      render: (row: NomorSurat) => (
        <div className="flex flex-col max-w-sm">
          <span className="text-xs font-semibold text-slate-800 line-clamp-1">{row.perihal}</span>
          <span className="text-2xs text-slate-400 truncate">
            Kepada: {row.tujuan || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'klasifikasi',
      label: 'UNIT / KLASIFIKASI',
      render: (row: NomorSurat) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-700">Unit: {row.kode_unit}</span>
          <span className="text-2xs text-slate-400">Klasifikasi: {row.kode_klasifikasi}</span>
        </div>
      ),
    },
    {
      key: 'modul',
      label: 'ASAL MODUL',
      align: 'center',
      render: (row: NomorSurat) => (
        <Badge variant="blue" className="uppercase text-2xs font-semibold">
          {row.module_origin}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row: NomorSurat) => {
        const variant = row.status === 'terpakai' ? 'success' : row.status === 'direservasi' ? 'warning' : 'danger';
        return (
          <Badge variant={variant} className="capitalize text-2xs font-semibold">
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (row: NomorSurat) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Detail Nomor',
                icon: <Eye size={14} />,
                onClick: () => {
                  router.push(`/arsip/nomor-surat/${row.id}`);
                },
              },
              ...(row.status !== 'dibatalkan' && canCancel
                ? [
                    {
                      label: 'Batalkan Nomor Surat',
                      icon: <XCircle size={14} className="text-red-500" />,
                      variant: 'danger' as const,
                      onClick: () => handleOpenCancelDialog(row),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header: strictly text 'Filter' on the LEFT of Tambah */}
      <PageHeader
        title="Daftar Nomor Surat Resmi"
        description="Arsip dan repositori seluruh nomor surat resmi kampus yang telah diterbitkan"
        action={
          <div className="flex items-center gap-2">
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
            {canCreate && (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="bg-[var(--module-primary)] hover:opacity-90 text-white shadow-sm"
                onClick={() => router.push('/arsip/nomor-surat/create')}
              >
                <Plus size={16} className="mr-1.5" />
                Terbitkan Nomor Surat
              </Button>
            )}
          </div>
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
        emptyMessage="Belum ada nomor surat resmi yang terdaftar."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter Nomor Surat"
        width="400px"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian Bebas"
            placeholder="Cari nomor, perihal, tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <AsyncSelect
            label="Kode Unit Pengolah"
            placeholder="Pilih unit pengolah..."
            loadOptions={async (query) => {
              const units = await arsipService.getAllKlasifikasi('unit');
              const filtered = (units || []).filter(
                (u) =>
                  u.nama.toLowerCase().includes(query.toLowerCase()) ||
                  u.kode.toLowerCase().includes(query.toLowerCase())
              );
              return filtered.map((u) => ({
                value: u.kode,
                label: `${u.kode} - ${u.nama}`,
              }));
            }}
            value={filterUnit}
            onChange={(opt: any) => setFilterUnit(opt?.value || '')}
            isClearable
          />

          <AsyncSelect
            label="Kode Klasifikasi Surat"
            placeholder="Pilih klasifikasi surat..."
            loadOptions={async (query) => {
              const klasifikasis = await arsipService.getAllKlasifikasi('klasifikasi');
              const filtered = (klasifikasis || []).filter(
                (k) =>
                  k.nama.toLowerCase().includes(query.toLowerCase()) ||
                  k.kode.toLowerCase().includes(query.toLowerCase())
              );
              return filtered.map((k) => ({
                value: k.kode,
                label: `${k.kode} - ${k.nama}`,
              }));
            }}
            value={filterKlasifikasi}
            onChange={(opt: any) => setFilterKlasifikasi(opt?.value || '')}
            isClearable
          />

          <Input
            label="Tahun Surat"
            type="number"
            placeholder="Misal: 2025"
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
          />

          <Select
            label="Status Nomor Surat"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={STATUS_NOMOR_SURAT_OPTIONS}
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
              onChange={(val) => setSortBy(val || 'nomor_surat')}
              options={[
                { value: 'nomor_surat', label: 'Nomor Surat' },
                { value: 'created_at', label: 'Waktu Terbit' },
                { value: 'tanggal_surat', label: 'Tanggal Surat' },
                { value: 'perihal', label: 'Perihal Surat' },
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

      {/* Confirm Dialog: Pembatalan Nomor Surat */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Batalkan Nomor Surat"
        message={
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin membatalkan nomor surat{' '}
              <strong className="text-slate-900 font-mono">{selectedNomor?.nomor_surat}</strong>?
              Nomor surat yang dibatalkan tidak dapat digunakan kembali.
            </p>
            <div>
              <Textarea
                label="Alasan Pembatalan *"
                rows={3}
                placeholder="Tuliskan alasan resmi pembatalan nomor surat ini..."
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
              />
            </div>
          </div>
        }
        confirmText="Ya, Batalkan Nomor"
        cancelText="Tutup"
        variant="danger"
        isLoading={submittingCancel}
      />

    </div>
  );
}

export default function DaftarNomorSuratPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Memuat data nomor surat...</div>}>
      <DaftarNomorSuratContent />
    </Suspense>
  );
}
