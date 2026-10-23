'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { StatCard } from '@/components/ui/StatCard';
import { lmsService } from '@/services/lms.service';
import { downloadBlobFile } from '@/lib/download';
import { formatDateTime, getApiErrorMessage } from '@/lib/utils';
import { SORT_ORDER_OPTIONS } from '@/lib/constants';
import {
  LMS_EXPORT_FORMAT_OPTIONS,
  LMS_PRESENSI_ABSEN_STATUS_LABEL,
  LMS_PRESENSI_ABSEN_STATUS_OPTIONS,
  LMS_PRESENSI_LOG_STATUS_LABEL,
  LMS_PRESENSI_LOG_STATUS_OPTIONS,
  LMS_PRESENSI_SORT_BY_OPTIONS,
  LMS_PRESENSI_SYNC_STATUS_LABEL,
  LMS_PRESENSI_SYNC_STATUS_OPTIONS,
  LMS_PRESENSI_TRANSPORT_LABEL,
  LmsExportFormat,
  LmsPresensiKelasItem,
  LmsPresensiRekapItem,
  LmsPresensiStatus,
  LmsPresensiSyncLogItem,
} from '@/types/lms.types';
import type { PaginationMeta } from '@/types/api.types';
import {
  Building2,
  Check,
  ClipboardList,
  CloudDownload,
  CloudUpload,
  Download,
  Fingerprint,
  Filter,
  History,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabKey = 'kelas' | 'rekap' | 'log';

const EMPTY_META: PaginationMeta = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
};

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: 'kelas', label: 'Kelas', icon: Building2 },
  { key: 'rekap', label: 'Rekap Kehadiran', icon: ClipboardList },
  { key: 'log', label: 'Log Sinkronisasi', icon: History },
];

/**
 * Panel administrasi integrasi presensi LMS &lt;-&gt; PresensiV2 (LMS-03).
 *
 * Halaman ini hanya untuk admin/superadmin (permission `lms.presensi.read` /
 * `lms.presensi.manage`). Menampilkan status integrasi, rekap kehadiran lintas
 * kelas, jejak sinkronisasi, serta aksi sinkron ulang, tarik riwayat, dan
 * export rekap.
 */
export default function LmsPresensiPage() {
  const [tab, setTab] = useState<TabKey>('kelas');

  const [status, setStatus] = useState<LmsPresensiStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [kelasRows, setKelasRows] = useState<LmsPresensiKelasItem[]>([]);
  const [rekapRows, setRekapRows] = useState<LmsPresensiRekapItem[]>([]);
  const [logRows, setLogRows] = useState<LmsPresensiSyncLogItem[]>([]);

  const [metaKelas, setMetaKelas] = useState<PaginationMeta>(EMPTY_META);
  const [metaRekap, setMetaRekap] = useState<PaginationMeta>(EMPTY_META);
  const [metaLog, setMetaLog] = useState<PaginationMeta>(EMPTY_META);

  const [isLoadingKelas, setIsLoadingKelas] = useState(true);
  const [isLoadingRekap, setIsLoadingRekap] = useState(false);
  const [isLoadingLog, setIsLoadingLog] = useState(false);

  // Filter
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKelasId, setFilterKelasId] = useState('');
  const [filterPertemuanKe, setFilterPertemuanKe] = useState('');
  const [filterStatusAbsen, setFilterStatusAbsen] = useState('');
  const [filterSyncStatus, setFilterSyncStatus] = useState('');
  const [filterLogStatus, setFilterLogStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('kode_kelas');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  // Opsi kelas untuk filter (diambil dari endpoint panel, bukan hardcode).
  const [kelasOptions, setKelasOptions] = useState<{ value: string; label: string }[]>([]);

  // Export
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<LmsExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Aksi baris
  const [isSyncing, setIsSyncing] = useState(false);
  const [tarikTarget, setTarikTarget] = useState<LmsPresensiKelasItem | null>(null);
  const [isTarik, setIsTarik] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await lmsService.getStatusPresensi();
      if (res.status === 'success' && res.data) {
        setStatus(res.data);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat status integrasi presensi.'));
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const fetchKelasOptions = useCallback(async () => {
    try {
      const res = await lmsService.indexKelasPresensi({ per_page: 100, sort_order: 'asc' });
      const options = (res.data || []).map((row) => ({
        value: String(row.id),
        label: `${row.kode_kelas} — ${row.mata_kuliah?.nama || row.nama_kelas}`,
      }));
      setKelasOptions(options);
    } catch {
      // Opsi kelas bersifat tambahan — kegagalan tidak boleh memblokir halaman.
      setKelasOptions([]);
    }
  }, []);

  const fetchKelas = useCallback(
    async (page: number, perPage: number) => {
      setIsLoadingKelas(true);
      try {
        const res = await lmsService.indexKelasPresensi({
          page,
          per_page: perPage,
          search: filterSearch || undefined,
          sort_by: filterOrderBy,
          sort_order: filterOrderDir,
        });

        if (res.status === 'success') {
          setKelasRows(res.data || []);
          if (res.meta) setMetaKelas(res.meta);
        } else {
          setKelasRows([]);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat daftar kelas presensi.'));
        setKelasRows([]);
      } finally {
        setIsLoadingKelas(false);
      }
    },
    [filterSearch, filterOrderBy, filterOrderDir]
  );

  const fetchRekap = useCallback(
    async (page: number, perPage: number) => {
      setIsLoadingRekap(true);
      try {
        const res = await lmsService.indexRekapPresensi({
          page,
          per_page: perPage,
          search: filterSearch || undefined,
          kelas_id: filterKelasId ? Number(filterKelasId) : undefined,
          pertemuan_ke: filterPertemuanKe ? Number(filterPertemuanKe) : undefined,
          status: filterStatusAbsen || undefined,
          sync_status: filterSyncStatus || undefined,
        });

        if (res.status === 'success') {
          setRekapRows(res.data || []);
          if (res.meta) setMetaRekap(res.meta);
        } else {
          setRekapRows([]);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat rekap kehadiran.'));
        setRekapRows([]);
      } finally {
        setIsLoadingRekap(false);
      }
    },
    [filterSearch, filterKelasId, filterPertemuanKe, filterStatusAbsen, filterSyncStatus]
  );

  const fetchLog = useCallback(
    async (page: number, perPage: number) => {
      setIsLoadingLog(true);
      try {
        const res = await lmsService.logSinkronisasiPresensi({
          page,
          per_page: perPage,
          status: filterLogStatus || undefined,
          kelas_id: filterKelasId ? Number(filterKelasId) : undefined,
        });

        if (res.status === 'success') {
          setLogRows(res.data || []);
          if (res.meta) setMetaLog(res.meta);
        } else {
          setLogRows([]);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat log sinkronisasi.'));
        setLogRows([]);
      } finally {
        setIsLoadingLog(false);
      }
    },
    [filterLogStatus, filterKelasId]
  );

  useEffect(() => {
    fetchStatus();
    fetchKelasOptions();
  }, [fetchStatus, fetchKelasOptions]);

  useEffect(() => {
    fetchKelas(metaKelas.current_page, metaKelas.per_page);
    // `meta` sengaja tidak menjadi dependensi agar tidak memicu loop render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKelas]);

  useEffect(() => {
    if (tab === 'rekap') fetchRekap(1, metaRekap.per_page);
    if (tab === 'log') fetchLog(1, metaLog.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, fetchRekap, fetchLog]);

  const reloadTab = useCallback(
    (page?: number) => {
      if (tab === 'kelas') fetchKelas(page ?? metaKelas.current_page, metaKelas.per_page);
      if (tab === 'rekap') fetchRekap(page ?? metaRekap.current_page, metaRekap.per_page);
      if (tab === 'log') fetchLog(page ?? metaLog.current_page, metaLog.per_page);
    },
    [tab, fetchKelas, fetchRekap, fetchLog, metaKelas, metaRekap, metaLog]
  );

  const handleApplyFilter = () => {
    setShowFilter(false);
    if (tab === 'kelas') fetchKelas(1, metaKelas.per_page);
    if (tab === 'rekap') fetchRekap(1, metaRekap.per_page);
    if (tab === 'log') fetchLog(1, metaLog.per_page);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKelasId('');
    setFilterPertemuanKe('');
    setFilterStatusAbsen('');
    setFilterSyncStatus('');
    setFilterLogStatus('');
    setFilterOrderBy('kode_kelas');
    setFilterOrderDir('asc');
    setShowFilter(false);
  };

  const handleSync = async (
    scope: { pertemuan_id?: number; kelas_id?: number },
    label: string
  ): Promise<void> => {
    setIsSyncing(true);
    try {
      const res = await lmsService.syncPresensi(scope);
      const message = res.data?.message || res.message || 'Sinkronisasi selesai.';
      if (res.status === 'success' && res.data?.success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      reloadTab();
      fetchStatus();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal menjalankan sinkronisasi presensi.'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTarik = async (): Promise<void> => {
    if (!tarikTarget) return;

    setIsTarik(true);
    try {
      const res = await lmsService.tarikPresensi(tarikTarget.id);
      const message = res.data?.message || res.message || 'Penarikan riwayat selesai.';
      if (res.status === 'success' && res.data?.success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      setTarikTarget(null);
      reloadTab();
      fetchStatus();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal menarik riwayat presensi.'));
    } finally {
      setIsTarik(false);
    }
  };

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    try {
      const file = await lmsService.exportRekapPresensiAdmin({
        format: exportFormat,
        search: filterSearch || undefined,
        kelas_id: filterKelasId ? Number(filterKelasId) : undefined,
        pertemuan_ke: filterPertemuanKe ? Number(filterPertemuanKe) : undefined,
        status: filterStatusAbsen || undefined,
        sync_status: filterSyncStatus || undefined,
      });
      downloadBlobFile(file.blob, file.filename);
      toast.success('Rekap presensi berhasil diunduh.');
      setShowExport(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mengunduh rekap presensi.'));
    } finally {
      setIsExporting(false);
    }
  };

  const lihatRekapKelas = (row: LmsPresensiKelasItem) => {
    setFilterKelasId(String(row.id));
    setTab('rekap');
    setShowFilter(false);
  };

  /* ---------------------------------------------------------------------
   | Kolom tabel
   | --------------------------------------------------------------------- */

  const kelasColumns: ColumnDef<LmsPresensiKelasItem>[] = useMemo(
    () => [
      {
        key: 'kelas',
        label: 'KELAS',
        render: (row) => (
          <div>
            <span className="font-bold text-slate-800 text-xs block">{row.kode_kelas}</span>
            <span className="text-2xs text-slate-500 block">{row.nama_kelas}</span>
          </div>
        ),
      },
      {
        key: 'mata_kuliah',
        label: 'MATA KULIAH',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">
              {row.mata_kuliah?.nama || '-'}
            </span>
            <span className="text-2xs text-slate-500 block">
              {row.program_studi?.nama || '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'sesi',
        label: 'SESI',
        align: 'center',
        render: (row) => <span className="text-xs text-slate-700">{row.jumlah_sesi ?? 0}</span>,
      },
      {
        key: 'kehadiran',
        label: 'KEHADIRAN',
        align: 'center',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">
              {row.jumlah_hadir ?? 0} / {row.jumlah_rekap ?? 0}
            </span>
            <span className="text-2xs text-slate-500 block">hadir / rekap</span>
          </div>
        ),
      },
      {
        key: 'sinkron',
        label: 'SINKRON',
        align: 'center',
        render: (row) => {
          if ((row.jumlah_gagal_sync ?? 0) > 0) {
            return <Badge variant="red">{row.jumlah_gagal_sync} gagal</Badge>;
          }
          if ((row.jumlah_tersinkron ?? 0) > 0) {
            return <Badge variant="green">{row.jumlah_tersinkron} tersinkron</Badge>;
          }
          return <Badge variant="gray">Hanya di LMS</Badge>;
        },
      },
      {
        key: 'aksi',
        label: 'AKSI',
        align: 'right',
        render: (row) => (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Lihat Rekap Kehadiran',
                  icon: <ClipboardList size={16} />,
                  onClick: () => lihatRekapKelas(row),
                },
                {
                  label: 'Sinkron Ulang ke PresensiV2',
                  icon: <CloudUpload size={16} />,
                  disabled: isSyncing,
                  onClick: () => handleSync({ kelas_id: row.id }, row.kode_kelas),
                },
                {
                  label: 'Tarik Riwayat dari PresensiV2',
                  icon: <CloudDownload size={16} />,
                  onClick: () => setTarikTarget(row),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSyncing]
  );

  const rekapColumns: ColumnDef<LmsPresensiRekapItem>[] = useMemo(
    () => [
      {
        key: 'mahasiswa',
        label: 'MAHASISWA',
        render: (row) => (
          <div>
            <span className="font-bold text-slate-800 text-xs block">{row.nim}</span>
            <span className="text-2xs text-slate-500 block">{row.nama_lengkap}</span>
          </div>
        ),
      },
      {
        key: 'kelas',
        label: 'KELAS',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">{row.kode_kelas}</span>
            <span className="text-2xs text-slate-500 block">{row.nama_mk || row.nama_kelas}</span>
          </div>
        ),
      },
      {
        key: 'pertemuan',
        label: 'PERTEMUAN',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">Pertemuan ke-{row.pertemuan_ke}</span>
            <span className="text-2xs text-slate-500 block">
              {row.tanggal ? formatDateTime(row.tanggal) : '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        align: 'center',
        render: (row) => {
          const label = LMS_PRESENSI_ABSEN_STATUS_LABEL[row.status] ?? row.status;
          const variant =
            row.status === 'hadir'
              ? 'green'
              : row.status === 'alfa'
                ? 'red'
                : row.status === 'izin'
                  ? 'blue'
                  : 'amber';
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        key: 'sync_status',
        label: 'SINKRON',
        align: 'center',
        render: (row) => {
          const label = LMS_PRESENSI_SYNC_STATUS_LABEL[row.sync_status] ?? row.sync_status;
          const variant =
            row.sync_status === 'synced'
              ? 'green'
              : row.sync_status === 'failed'
                ? 'red'
                : row.sync_status === 'pending'
                  ? 'amber'
                  : 'gray';
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        key: 'aksi',
        label: 'AKSI',
        align: 'right',
        render: (row) => (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Sinkron Ulang Pertemuan ini',
                  icon: <CloudUpload size={16} />,
                  disabled: isSyncing,
                  onClick: () => handleSync({ pertemuan_id: row.pertemuan_id }, row.kode_kelas),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSyncing]
  );

  const logColumns: ColumnDef<LmsPresensiSyncLogItem>[] = useMemo(
    () => [
      {
        key: 'waktu',
        label: 'WAKTU',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">{formatDateTime(row.created_at)}</span>
            <span className="text-2xs text-slate-500 block">{row.user?.name || 'Sistem'}</span>
          </div>
        ),
      },
      {
        key: 'aksi',
        label: 'AKSI',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">{row.aksi}</span>
            <span className="text-2xs text-slate-500 block">
              {row.entitas} #{row.entitas_id}
            </span>
          </div>
        ),
      },
      {
        key: 'kelas',
        label: 'KELAS',
        render: (row) => (
          <div>
            <span className="text-xs text-slate-700 block">
              {row.kelas_id ? `Kelas #${row.kelas_id}` : '-'}
            </span>
            <span className="text-2xs text-slate-500 block">
              {row.pertemuan_ke ? `Pertemuan ke-${row.pertemuan_ke}` : '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        align: 'center',
        render: (row) => {
          const label = LMS_PRESENSI_LOG_STATUS_LABEL[row.status] ?? row.status;
          const variant =
            row.status === 'success'
              ? 'green'
              : row.status === 'failed'
                ? 'red'
                : row.status === 'partial'
                  ? 'amber'
                  : 'gray';
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        key: 'via',
        label: 'TRANSPORT',
        align: 'center',
        render: (row) => (
          <span className="text-2xs text-slate-600">
            {LMS_PRESENSI_TRANSPORT_LABEL[row.via] ?? row.via}
          </span>
        ),
      },
      {
        key: 'pesan',
        label: 'PESAN',
        render: (row) => (
          <span className="text-2xs text-slate-600 block truncate max-w-[280px]">
            {row.message || '-'}
          </span>
        ),
      },
    ],
    []
  );

  /* ---------------------------------------------------------------------
   | Render
   | --------------------------------------------------------------------- */

  const integrasiAktif = status?.configured === true;
  const badgeIntegrasi = integrasiAktif ? 'green' : 'amber';

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title="Presensi & Integrasi"
        description="Monitoring rekap kehadiran, jejak sinkronisasi, dan pertukaran data dengan aplikasi PresensiV2."
        breadcrumbs={[
          { label: 'LMS', href: '/lms' },
          { label: 'Presensi & Integrasi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={() => setShowExport(true)}
            >
              Export Rekap
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Status Integrasi"
          value={
            isLoadingStatus ? '...' : integrasiAktif ? 'Aktif' : 'Belum Aktif'
          }
          icon={<Fingerprint size={18} />}
          iconVariant={integrasiAktif ? 'green' : 'amber'}
          footer={
            <span className="text-2xs">
              {status
                ? `${LMS_PRESENSI_TRANSPORT_LABEL[status.via] ?? status.via} · ${status.message}`
                : 'Memuat konfigurasi integrasi...'}
            </span>
          }
        />
        <StatCard
          label="Total Pertemuan"
          value={status?.total_pertemuan ?? 0}
          icon={<ClipboardList size={18} />}
          iconVariant="blue"
          footer={
            <span className="text-2xs">
              {status?.fitur_presensi_aktif === false
                ? 'Fitur presensi sedang dimatikan'
                : 'Seluruh sesi presensi LMS'}
            </span>
          }
        />
        <StatCard
          label="Tersinkron"
          value={status?.total_tersinkron ?? 0}
          icon={<CloudUpload size={18} />}
          iconVariant="green"
          footer={<span className="text-2xs">Pertemuan sudah tercatat di PresensiV2</span>}
        />
        <StatCard
          label="Gagal Sinkron"
          value={status?.total_gagal_sync ?? 0}
          icon={<CloudDownload size={18} />}
          iconVariant={status?.total_gagal_sync ? 'red' : 'gray'}
          footer={<span className="text-2xs">Dapat dicoba ulang dari daftar kelas</span>}
        />
      </div>

      {!integrasiAktif ? (
        <div className="card">
          <div className="card-body flex items-start gap-3">
            <Badge variant={badgeIntegrasi}>Belum Terintegrasi</Badge>
            <div>
              <p className="text-xs font-semibold text-slate-800">Integrasi PresensiV2 belum aktif</p>
              <p className="text-2xs text-slate-500 mt-1">
                Isi environment <code>PRESENSI_API_URL</code> (atau konfigurasi koneksi database
                <code> PRESENSI_DB_HOST</code> + <code>PRESENSI_DB_DATABASE</code>) untuk mengaktifkan
                sinkronisasi. Seluruh alur presensi LMS tetap berjalan normal tanpa integrasi ini.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header flex items-center gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)] rounded-t-lg border-b-2'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="card-body">
          {tab === 'kelas' ? (
            <DataTable
              columns={kelasColumns}
              data={kelasRows}
              isLoading={isLoadingKelas}
              meta={metaKelas}
              onPageChange={(p) => fetchKelas(p, metaKelas.per_page)}
              onLimitChange={(lim) => fetchKelas(1, lim)}
              emptyMessage="Belum ada kelas yang memiliki sesi presensi."
            />
          ) : null}

          {tab === 'rekap' ? (
            <DataTable
              columns={rekapColumns}
              data={rekapRows}
              isLoading={isLoadingRekap}
              meta={metaRekap}
              onPageChange={(p) => fetchRekap(p, metaRekap.per_page)}
              onLimitChange={(lim) => fetchRekap(1, lim)}
              emptyMessage="Belum ada data kehadiran pada kelas yang dipilih."
            />
          ) : null}

          {tab === 'log' ? (
            <DataTable
              columns={logColumns}
              data={logRows}
              isLoading={isLoadingLog}
              meta={metaLog}
              onPageChange={(p) => fetchLog(p, metaLog.per_page)}
              onLimitChange={(lim) => fetchLog(1, lim)}
              emptyMessage="Belum ada percobaan sinkronisasi ke PresensiV2."
            />
          ) : null}
        </div>
      </div>

      {/* Filter Drawer — konteks mengikuti tab aktif */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={`Filter ${TABS.find((item) => item.key === tab)?.label ?? ''}`}
        footer={
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
            <Button icon={<Check size={16} />} onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari NIM, nama mahasiswa, materi, atau kode kelas..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          {tab !== 'kelas' ? (
            <Select
              label="Kelas"
              placeholder="Semua kelas..."
              value={filterKelasId}
              onChange={(val) => setFilterKelasId(val ? String(val) : '')}
              options={kelasOptions}
              isClearable
            />
          ) : null}

          {tab === 'rekap' ? (
            <>
              <Input
                label="Pertemuan Ke"
                type="number"
                placeholder="Contoh: 1"
                value={filterPertemuanKe}
                onChange={(e) => setFilterPertemuanKe(e.target.value)}
              />
              <Select
                label="Status Kehadiran"
                placeholder="Semua status..."
                value={filterStatusAbsen}
                onChange={(val) => setFilterStatusAbsen(val ? String(val) : '')}
                options={LMS_PRESENSI_ABSEN_STATUS_OPTIONS}
                isClearable
              />
              <Select
                label="Status Sinkron"
                placeholder="Semua status..."
                value={filterSyncStatus}
                onChange={(val) => setFilterSyncStatus(val ? String(val) : '')}
                options={LMS_PRESENSI_SYNC_STATUS_OPTIONS}
                isClearable
              />
            </>
          ) : null}

          {tab === 'log' ? (
            <Select
              label="Status Sinkronisasi"
              placeholder="Semua status..."
              value={filterLogStatus}
              onChange={(val) => setFilterLogStatus(val ? String(val) : '')}
              options={LMS_PRESENSI_LOG_STATUS_OPTIONS}
              isClearable
            />
          ) : null}

          {tab === 'kelas' ? (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urut Berdasarkan"
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val)}
                options={LMS_PRESENSI_SORT_BY_OPTIONS}
              />
              <Select
                label="Arah"
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir(val)}
                options={SORT_ORDER_OPTIONS}
              />
            </div>
          ) : null}
        </div>
      </Drawer>

      {/* Modal export rekap */}
      <Modal
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Export Rekap Kehadiran"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExport(false)} disabled={isExporting}>
              Batal
            </Button>
            <Button
              size="sm"
              icon={<Download size={16} />}
              loading={isExporting}
              disabled={isExporting}
              onClick={handleExport}
            >
              Unduh
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Format Berkas"
            options={LMS_EXPORT_FORMAT_OPTIONS}
            value={exportFormat}
            onChange={(val: LmsExportFormat) => setExportFormat(val)}
            hint="CSV memakai BOM UTF-8 agar karakter Indonesia tampil benar di Excel. Filter aktif pada tab Rekap Kehadiran ikut dipakai."
          />
        </div>
      </Modal>

      {/* Konfirmasi tarik riwayat dari PresensiV2 */}
      <ConfirmDialog
        isOpen={tarikTarget !== null}
        onClose={() => setTarikTarget(null)}
        onConfirm={handleTarik}
        title="Tarik Riwayat dari PresensiV2"
        message={
          tarikTarget
            ? `Riwayat jurnal dan rekap kehadiran kelas "${tarikTarget.kode_kelas}" akan ditarik dari PresensiV2 dan dapat menimpa data absensi lokal. Lanjutkan?`
            : ''
        }
        confirmText="Ya, Tarik Riwayat"
        cancelText="Batal"
        variant="warning"
        isLoading={isTarik}
      />
    </div>
  );
}
