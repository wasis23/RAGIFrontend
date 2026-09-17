'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Filter,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Calendar,
  RefreshCw,
  Eye,
  Check,
  UserX,
  Clock,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { PaginationMeta } from '@/types/api.types';
import type { CutoffReport } from '@/types/simpeg.types';

// Skema validasi Zod untuk form keterangan ketidakhadiran
const keteranganFormSchema = z.object({
  pegawai_id: z.coerce.number().int('Pegawai wajib dipilih').min(1, 'Pegawai wajib dipilih'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi').regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  status_kehadiran: z.enum(['izin', 'sakit', 'dinas', 'alfa'], { message: 'Keterangan wajib dipilih' }),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional().or(z.literal('')),
});

type KeteranganFormValues = z.output<typeof keteranganFormSchema>;
type KeteranganFormInput = z.input<typeof keteranganFormSchema>;

const KETERANGAN_OPTIONS = [
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'dinas', label: 'Dinas Luar' },
  { value: 'alfa', label: 'Alpa (Tanpa Keterangan)' },
];

export default function PresensiPage() {
  const router = useRouter();
  const { hasPermission, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin') || hasRole('admin_simpeg') || hasPermission('simpeg.presensi.manage');

  // Modal Konfirmasi Hapus UI
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: 'Konfirmasi Hapus',
    message: '',
    onConfirm: async () => {},
    isLoading: false,
  });

  // -------------------------------------------------------------
  // LOG PRESENSI REALTIME & BUNDLE REKAP
  // -------------------------------------------------------------
  const [logViewMode, setLogViewMode] = useState<'realtime' | 'bundle'>('realtime');
  const [loadingLog, setLoadingLog] = useState(true);
  const [presensiList, setPresensiList] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Detail / Approval Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Bundle Presensi State
  const [bundleList, setBundleList] = useState<any[]>([]);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleMeta, setBundleMeta] = useState<PaginationMeta | undefined>();
  const [bundleSearch, setBundleSearch] = useState('');
  const [bundlePage, setBundlePage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingRekap, setUploadingRekap] = useState(false);
  const [rekapForm, setRekapForm] = useState({
    nama_periode: '',
    tanggal_awal: '',
    tanggal_akhir: '',
    file_rekap: null as File | null,
    catatan: '',
  });

  const fetchLogPresensi = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await simpegService.getPresensiList({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        tanggal: tanggalFilter || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        per_page: 10,
      });

      if (res.status === 'success' && res.data) {
        setPresensiList(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar log presensi.');
    } finally {
      setLoadingLog(false);
    }
  }, [search, statusFilter, tanggalFilter, sortBy, sortDir, page]);

  const fetchBundleList = useCallback(async () => {
    setLoadingBundle(true);
    try {
      const res: any = await simpegService.getPresensiList({
        type: 'bundle',
        search: bundleSearch.trim() || undefined,
        page: bundlePage,
        per_page: 10,
      });
      if (res.status === 'success' && res.data) {
        setBundleList(res.data);
        if (res.meta) setBundleMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar bundle presensi.');
    } finally {
      setLoadingBundle(false);
    }
  }, [bundleSearch, bundlePage]);

  const handleDeleteBundle = (bundle: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Rekap Periode Presensi',
      message: `Apakah Anda yakin ingin menghapus bundle "${bundle.nama_periode}" beserta seluruh log presensi di dalamnya? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deletePresensiBundle(bundle.id);
          toast.success('Bundle presensi berhasil dihapus.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchBundleList();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus bundle presensi.');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleProcessBundlePayroll = async (bundleId: number) => {
    try {
      const res = await simpegService.processBundlePayroll(bundleId);
      toast.success(res.message || 'Payroll berhasil diproses dan dikirim ke SIKEU.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses payroll.');
    }
  };

  const handleUploadRekap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rekapForm.nama_periode || !rekapForm.tanggal_awal || !rekapForm.tanggal_akhir || !rekapForm.file_rekap) {
      toast.error('Harap lengkapi semua field wajib dan unggah berkas rekap.');
      return;
    }

    const formData = new FormData();
    formData.append('nama_periode', rekapForm.nama_periode);
    formData.append('tanggal_awal', rekapForm.tanggal_awal);
    formData.append('tanggal_akhir', rekapForm.tanggal_akhir);
    formData.append('file_rekap', rekapForm.file_rekap);
    if (rekapForm.catatan) {
      formData.append('catatan', rekapForm.catatan);
    }

    setUploadingRekap(true);
    try {
      const res = await simpegService.uploadPresensiRekap(formData);
      toast.success(res.message || 'Berkas rekap presensi berhasil diunggah dan diproses.');
      setShowUploadModal(false);
      setRekapForm({ nama_periode: '', tanggal_awal: '', tanggal_akhir: '', file_rekap: null, catatan: '' });
      fetchBundleList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah berkas rekap presensi.');
    } finally {
      setUploadingRekap(false);
    }
  };

  // -------------------------------------------------------------
  // OTOMASI CUT-OFF PRESENSI HARIAN (AUTO-ALFA)
  // -------------------------------------------------------------
  const [showCutoffModal, setShowCutoffModal] = useState(false);
  const [runningCutoff, setRunningCutoff] = useState(false);
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().substring(0, 10));
  const [cutoffUnitKerjaId, setCutoffUnitKerjaId] = useState<number>(0);
  const [cutoffReport, setCutoffReport] = useState<CutoffReport | null>(null);
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<{ value: number; label: string }[]>([]);

  const handleOpenCutoffModal = async () => {
    setCutoffReport(null);
    setCutoffDate(new Date().toISOString().substring(0, 10));
    setCutoffUnitKerjaId(0);
    setShowCutoffModal(true);

    if (unitKerjaOptions.length === 0) {
      try {
        const res = await simpegService.getUnitKerjaList();
        const responseData = (res as any).data ?? res;
        const items = Array.isArray(responseData) ? responseData : (responseData?.items || responseData?.data || []);
        setUnitKerjaOptions(items.map((u: any) => ({ value: u.id, label: `${u.nama} (${u.tipe || 'Unit'})` })));
      } catch {
        // ignore
      }
    }
  };

  const handleRunCutoff = async () => {
    setRunningCutoff(true);
    try {
      const res = await simpegService.runDailyCutoff({
        date: cutoffDate,
        unit_kerja_id: cutoffUnitKerjaId ? Number(cutoffUnitKerjaId) : undefined,
      });
      if (res.status === 'success' && res.data) {
        setCutoffReport(res.data);
        toast.success(res.message || 'Cut-off presensi selesai diproses');
        fetchLogPresensi();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengeksekusi cut-off harian');
    } finally {
      setRunningCutoff(false);
    }
  };

  // -------------------------------------------------------------
  // KETERANGAN KETIDAKHADIRAN (admin menetapkan izin/sakit/dinas/alfa)
  // -------------------------------------------------------------
  const [showKeteranganModal, setShowKeteranganModal] = useState(false);
  const [savingKeterangan, setSavingKeterangan] = useState(false);

  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getPegawaiList({
        search: inputValue.trim() || undefined,
        per_page: 25,
      });
      const responseData = (res as any).data ?? res;
      const items: any[] = Array.isArray(responseData)
        ? responseData
        : responseData?.items || responseData?.data || [];
      return items.map((p: any) => ({
        value: p.id,
        label: `${p.nama_lengkap} — ${p.nip || '-'}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const {
    control: controlKeterangan,
    handleSubmit: handleSubmitKeterangan,
    formState: { errors: keteranganErrors },
    reset: resetKeterangan,
  } = useForm<KeteranganFormInput, unknown, KeteranganFormValues>({
    resolver: zodResolver(keteranganFormSchema),
    defaultValues: { pegawai_id: 0, tanggal: '', status_kehadiran: 'izin', catatan: '' },
  });

  const handleOpenKeteranganModal = () => {
    resetKeterangan({ pegawai_id: 0, tanggal: '', status_kehadiran: 'izin', catatan: '' });
    setShowKeteranganModal(true);
  };

  const onSubmitKeterangan = async (values: KeteranganFormValues) => {
    setSavingKeterangan(true);
    try {
      const res = await simpegService.setKeteranganPresensi({
        pegawai_id: values.pegawai_id,
        tanggal: values.tanggal,
        status_kehadiran: values.status_kehadiran,
        catatan: values.catatan || undefined,
      });
      toast.success(res.message || 'Keterangan ketidakhadiran berhasil disimpan');
      setShowKeteranganModal(false);
      setPage(1);
      fetchLogPresensi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan keterangan ketidakhadiran');
    } finally {
      setSavingKeterangan(false);
    }
  };

  const handleApprovePresensi = async (id: number) => {
    setApprovingId(id);
    try {
      const res = await simpegService.approvePresensi(id);
      if (res.status === 'success') {
        toast.success('Presensi berhasil disetujui secara manual');
        fetchLogPresensi();
        if (selectedLog && selectedLog.id === id) {
          setShowDetailModal(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui presensi');
    } finally {
      setApprovingId(null);
    }
  };

  // Effect fetch data saat tab/view berubah
  useEffect(() => {
    if (logViewMode === 'realtime') {
      fetchLogPresensi();
    } else {
      fetchBundleList();
    }
  }, [logViewMode, fetchLogPresensi, fetchBundleList]);

  // -------------------------------------------------------------
  // COLUMNS: Log Presensi Realtime
  // -------------------------------------------------------------
  const logColumns: ColumnDef<any>[] = [
    {
      key: 'tanggal',
      label: 'Tanggal & Waktu',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800 text-xs">
            {new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-2xs text-slate-500 font-mono">
            Masuk: {row.clock_in ? row.clock_in.substring(11, 16) : (row.jam_masuk || '--:--')} | Pulang: {row.clock_out ? row.clock_out.substring(11, 16) : (row.jam_keluar || '--:--')}
          </div>
        </div>
      ),
    },
    {
      key: 'employee',
      label: 'Pegawai',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 text-xs">{row.employee?.nama_lengkap || `Pegawai #${row.pegawai_id}`}</div>
          <div className="text-2xs text-slate-500 font-mono">NIP: {row.employee?.nip || '-'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Kehadiran',
      render: (row) => {
        const st = (row.status || row.status_kehadiran || '').toLowerCase();
        let badgeVariant: 'success' | 'warning' | 'danger' | 'info' | 'purple' = 'success';
        if (st === 'terlambat') badgeVariant = 'warning';
        else if (st === 'ditolak' || st === 'alfa') badgeVariant = 'danger';
        else if (st === 'izin' || st === 'sakit' || st === 'dinas') badgeVariant = 'info';
        else if (st === 'menunggu_approval') badgeVariant = 'purple';

        const statusLabels: Record<string, string> = {
          hadir: 'Hadir Tepat Waktu',
          dinas: 'Dinas Luar',
          menunggu_approval: 'Menunggu Approval',
          alfa: 'Alpa',
        };

        return (
          <div className="space-y-1">
            <Badge variant={badgeVariant} className="capitalize font-bold text-2xs">
              {statusLabels[st] || st}
            </Badge>
            {row.late_minutes > 0 && (
              <div className="text-[10px] text-rose-600 font-semibold">
                Terlambat {row.late_minutes} mnt
              </div>
            )}
            {row.early_leave_minutes > 0 && (
              <div className="text-[10px] text-amber-600 font-semibold">
                Pulang Cepat {row.early_leave_minutes} mnt
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'source',
      label: 'Sumber Presensi',
      render: (row) => {
        const src = (row.source || 'mobile_gps').toLowerCase();
        let label = 'GPS Mobile';
        let variant: 'info' | 'success' | 'danger' | 'warning' | 'secondary' = 'info';
        if (src === 'fingerprint') {
          label = 'Fingerprint';
          variant = 'success';
        } else if (src === 'system_cutoff') {
          label = 'Auto-Alfa';
          variant = 'danger';
        } else if (src === 'manual_admin') {
          label = 'Manual HR';
          variant = 'warning';
        } else if (src === 'import_sql') {
          label = 'Import';
          variant = 'secondary';
        }

        return (
          <div className="space-y-0.5">
            <Badge variant={variant} className="text-2xs font-semibold">
              {label}
            </Badge>
            {row.device_id && (
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                {row.device_id}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'audit',
      label: 'Audit Geofence & AI',
      render: (row) => (
        <div className="space-y-0.5 text-2xs text-slate-600">
          <div className="flex items-center gap-1">
            <MapPin size={11} className={row.clock_in_distance_meters > 150 ? 'text-amber-500' : 'text-emerald-600'} />
            <span>Jarak: {row.clock_in_distance_meters !== null && row.clock_in_distance_meters !== undefined ? `${Number(row.clock_in_distance_meters).toFixed(0)} m` : '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-primary-600" />
            <span>Skor Wajah: {row.clock_in_face_score !== null && row.clock_in_face_score !== undefined ? `${(Number(row.clock_in_face_score) * 100).toFixed(0)}%` : '-'}</span>
          </div>
          {row.clock_in_is_mock_location ? (
            <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold text-[10px]">
              <AlertTriangle size={10} /> Terdeteksi Mock GPS
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const canApprove =
          isAdmin && (row.status === 'ditolak' || row.status === 'menunggu_approval' || !row.is_approved_by_admin);
        const items: DropdownMenuItem[] = [
          {
            label: 'Lihat Rincian',
            icon: <Eye size={14} />,
            onClick: () => {
              setSelectedLog(row);
              setShowDetailModal(true);
            },
          },
        ];
        if (canApprove) {
          items.push({
            label: approvingId === row.id ? 'Menyetujui...' : 'Setujui Manual',
            icon: <Check size={14} />,
            disabled: approvingId === row.id,
            onClick: () => handleApprovePresensi(row.id),
          });
        }
        return <DropdownMenu items={items} />;
      },
    },
  ];

  // -------------------------------------------------------------
  // COLUMNS: Rekap Bundle Periode
  // -------------------------------------------------------------
  const bundleColumns: ColumnDef<any>[] = [
    {
      key: 'nama_periode',
      label: 'Nama Periode Rekap',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.nama_periode}</div>
          {row.catatan && <div className="text-[11px] text-slate-500 mt-0.5">{row.catatan}</div>}
        </div>
      ),
    },
    {
      key: 'rentang_tanggal',
      label: 'Rentang Periode',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Calendar size={13} className="text-primary-600 shrink-0" />
          <span>{row.tanggal_awal} s/d {row.tanggal_akhir}</span>
        </div>
      ),
    },
    {
      key: 'total_record',
      label: 'Total Log',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {Number(row.total_record || 0).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'total_pegawai',
      label: 'Pegawai',
      render: (row) => (
        <span className="text-xs font-medium text-slate-600">
          {row.total_pegawai !== undefined ? `${row.total_pegawai} Orang` : '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Dibuat Pada',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const items: DropdownMenuItem[] = [
          {
            label: 'Buka Rincian Log',
            icon: <Eye size={14} />,
            onClick: () => router.push(`/simpeg/presensi/${row.id}`),
          },
        ];
        if (isAdmin) {
          items.push({
            label: 'Kalkulasi Payroll SIKEU',
            icon: <CheckCircle2 size={14} />,
            onClick: () => handleProcessBundlePayroll(row.id),
          });
          items.push({
            label: 'Hapus Bundle',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleDeleteBundle(row),
          });
        }
        return <DropdownMenu items={items} />;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-6">
      {/* Page Header */}
      <PageHeader
        title="Presensi & Absensi Pegawai"
        description="Monitoring log kehadiran biometrik realtime, pengelolaan rekap presensi bulanan, verifikasi persetujuan, dan otomasi cut-off presensi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIMPEG', href: '/simpeg' },
          { label: 'Presensi & Absensi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {logViewMode === 'realtime' ? (
              <>
                <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilterDrawer(true)}>
                  Filter Presensi
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="outline" icon={<Clock size={16} />} onClick={handleOpenCutoffModal}>
                      Jalankan Cut-off Harian
                    </Button>
                    <Button variant="outline" icon={<UserX size={16} />} onClick={handleOpenKeteranganModal}>
                      Tandai Tidak Hadir
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => fetchBundleList()} disabled={loadingBundle}>
                  Muat Ulang
                </Button>
                {isAdmin && (
                  <Button icon={<Upload size={16} />} onClick={() => setShowUploadModal(true)}>
                    Upload Rekap Presensi
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Sub-view Switcher: Realtime vs Rekap Bundle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setLogViewMode('realtime')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              logViewMode === 'realtime'
                ? 'bg-white text-primary-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className={logViewMode === 'realtime' ? 'text-primary-600' : 'text-slate-400'} />
            Log Realtime Biometrik
          </button>
          <button
            type="button"
            onClick={() => setLogViewMode('bundle')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              logViewMode === 'bundle'
                ? 'bg-white text-primary-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className={logViewMode === 'bundle' ? 'text-primary-600' : 'text-slate-400'} />
            Rekap Bundle Periode
          </button>
        </div>

        <div className="text-2xs text-slate-500 font-medium">
          {logViewMode === 'realtime' ? (
            <span>Menampilkan data clock-in & clock-out dari GPS Mobile dan mesin sidik jari</span>
          ) : (
            <span>Menampilkan kumpulan berkas rekap bulanan untuk integrasi payroll SIKEU</span>
          )}
        </div>
      </div>

      {/* Tabel View 1: Realtime Log */}
      {logViewMode === 'realtime' && (
        <DataTable
          columns={logColumns}
          data={presensiList}
          isLoading={loadingLog}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          emptyMessage="Tidak ada data presensi yang ditemukan."
        />
      )}

      {/* Tabel View 2: Bundle Rekap Presensi */}
      {logViewMode === 'bundle' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <div className="w-full max-w-xs">
              <Input
                placeholder="Cari nama periode..."
                value={bundleSearch}
                onChange={(e) => {
                  setBundleSearch(e.target.value);
                  setBundlePage(1);
                }}
              />
            </div>
          </div>
          <DataTable
            columns={bundleColumns}
            data={bundleList}
            isLoading={loadingBundle}
            meta={bundleMeta}
            onPageChange={(newPage) => setBundlePage(newPage)}
            emptyMessage="Belum ada berkas bundle rekap presensi yang diunggah."
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER FILTER LOG PRESENSI */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Data Presensi"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTanggalFilter('');
                setSortBy('tanggal');
                setSortDir('desc');
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                setPage(1);
                setShowFilterDrawer(false);
                fetchLogPresensi();
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Nama / NIP Pegawai"
            placeholder="Ketik nama atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Input
            label="Tanggal Tertentu"
            type="date"
            value={tanggalFilter}
            onChange={(e) => setTanggalFilter(e.target.value)}
          />

          <Select
            label="Status Kehadiran"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'hadir', label: 'Hadir (Tepat Waktu)' },
              { value: 'terlambat', label: 'Terlambat' },
              { value: 'menunggu_approval', label: 'Menunggu Approval' },
              { value: 'ditolak', label: 'Ditolak' },
              { value: 'izin', label: 'Izin' },
              { value: 'sakit', label: 'Sakit' },
              { value: 'dinas', label: 'Dinas Luar' },
              { value: 'alfa', label: 'Alpa' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'tanggal', label: 'Tanggal' },
                { value: 'clock_in', label: 'Jam Masuk' },
                { value: 'clock_out', label: 'Jam Pulang' },
                { value: 'status_kehadiran', label: 'Status' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={sortDir}
              onChange={(val) => setSortDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Turun)' },
                { value: 'asc', label: 'A - Z (Naik)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DETAIL LOG PRESENSI */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Log Presensi Pegawai"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Tutup
            </Button>
            {isAdmin && selectedLog && (selectedLog.status === 'ditolak' || selectedLog.status === 'menunggu_approval' || !selectedLog.is_approved_by_admin) && (
              <Button
                loading={approvingId === selectedLog.id}
                disabled={approvingId === selectedLog.id}
                onClick={() => handleApprovePresensi(selectedLog.id)}
              >
                Setujui Manual
              </Button>
            )}
          </>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pegawai:</span>
                <span className="font-bold text-slate-900">{selectedLog.employee?.nama_lengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIP:</span>
                <span className="font-mono text-slate-800">{selectedLog.employee?.nip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-semibold text-slate-800">{selectedLog.tanggal?.substring(0, 10)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">Scan Masuk (In)</div>
                <div className="text-slate-600">Jam: {selectedLog.clock_in ? selectedLog.clock_in.substring(11, 19) : (selectedLog.jam_masuk || '-')}</div>
                <div className="text-slate-600">Jarak: {selectedLog.clock_in_distance_meters || 0} meter</div>
                <div className="text-slate-600">Skor Wajah: {selectedLog.clock_in_face_score ? `${(Number(selectedLog.clock_in_face_score) * 100).toFixed(1)}%` : '-'}</div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">Scan Pulang (Out)</div>
                <div className="text-slate-600">Jam: {selectedLog.clock_out ? selectedLog.clock_out.substring(11, 19) : (selectedLog.jam_keluar || '-')}</div>
                <div className="text-slate-600">Jarak: {selectedLog.clock_out_distance_meters || 0} meter</div>
                <div className="text-slate-600">Skor Wajah: {selectedLog.clock_out_face_score ? `${(Number(selectedLog.clock_out_face_score) * 100).toFixed(1)}%` : '-'}</div>
              </div>
            </div>

            {selectedLog.rejection_reason && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 space-y-1">
                <span className="font-bold">Alasan Penolakan Sistem:</span>
                <p>{selectedLog.rejection_reason}</p>
              </div>
            )}

            {selectedLog.notes && (
              <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold">Catatan:</span>
                <p>{selectedLog.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL KETERANGAN KETIDAKHADIRAN */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showKeteranganModal}
        onClose={() => setShowKeteranganModal(false)}
        title="Tandai Tidak Hadir"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowKeteranganModal(false)} disabled={savingKeterangan}>
              Batal
            </Button>
            <Button type="submit" loading={savingKeterangan} disabled={savingKeterangan} form="keterangan-form">
              Simpan Keterangan
            </Button>
          </>
        }
      >
        <form id="keterangan-form" onSubmit={handleSubmitKeterangan(onSubmitKeterangan)} noValidate className="space-y-4">
          <p className="text-[11px] text-slate-500">
            Untuk pegawai yang terjadwal masuk (referensi shift) tetapi tidak memiliki log presensi. Data hasil scan
            tidak dapat ditimpa lewat form ini.
          </p>
          <Controller
            control={controlKeterangan}
            name="pegawai_id"
            render={({ field }) => (
              <AsyncSelect
                label="Pilih Pegawai *"
                placeholder="Ketik nama atau NIP pegawai..."
                loadOptions={loadPegawaiOptions}
                value={field.value ? { value: field.value, label: `Pegawai ID: ${field.value}` } : null}
                onChange={(opt: any) => field.onChange(opt ? opt.value : 0)}
                error={keteranganErrors.pegawai_id?.message}
                isClearable
              />
            )}
          />
          <Controller
            control={controlKeterangan}
            name="tanggal"
            render={({ field }) => (
              <Input
                label="Tanggal *"
                type="date"
                required
                error={keteranganErrors.tanggal?.message}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={controlKeterangan}
            name="status_kehadiran"
            render={({ field }) => (
              <Select
                label="Keterangan *"
                required
                value={field.value}
                onChange={field.onChange}
                options={KETERANGAN_OPTIONS}
                error={keteranganErrors.status_kehadiran?.message}
              />
            )}
          />
          <Controller
            control={controlKeterangan}
            name="catatan"
            render={({ field }) => (
              <Input
                label="Catatan (opsional)"
                placeholder="Alasan izin / nomor surat dinas..."
                error={keteranganErrors.catatan?.message}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL JALANKAN CUT-OFF PRESENSI HARIAN (AUTO-ALFA) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showCutoffModal}
        onClose={() => setShowCutoffModal(false)}
        title="Otomasi Presensi: Cut-off Harian (Auto-Alfa)"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCutoffModal(false)} disabled={runningCutoff}>
              Tutup
            </Button>
            <Button onClick={handleRunCutoff} loading={runningCutoff} disabled={runningCutoff} variant="danger">
              Eksekusi Cut-off Harian
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
            <p className="text-2xs">
              Sistem akan memindai seluruh pegawai aktif yang terjadwal masuk pada tanggal yang dipilih. Pegawai yang tidak melakukan presensi scan dan tidak memiliki keterangan resmi (izin/sakit/dinas) otomatis diberi status <strong>Alfa</strong>.
            </p>
          </div>

          <Input
            label="Pilih Tanggal Cut-off *"
            type="date"
            required
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
          />

          <Select
            label="Batasi ke Unit Kerja Tertentu (Opsional)"
            value={cutoffUnitKerjaId ? String(cutoffUnitKerjaId) : ''}
            onChange={(val) => setCutoffUnitKerjaId(val ? Number(val) : 0)}
            options={[
              { value: '', label: '-- Seluruh Unit Kerja --' },
              ...unitKerjaOptions.map((u) => ({ value: String(u.value), label: u.label })),
            ]}
          />

          {cutoffReport && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-slate-800">Laporan Hasil Cut-off:</span>
                <Badge variant={cutoffReport.total_marked_alfa > 0 ? 'danger' : 'success'}>
                  {cutoffReport.total_marked_alfa} Pegawai Alfa
                </Badge>
              </div>

              <div className="text-2xs text-slate-600 space-y-1">
                <div>Tanggal Evaluasi: <strong>{cutoffReport.date}</strong></div>
                <div>Total Pegawai Terjadwal Dievaluasi: <strong>{cutoffReport.total_evaluated}</strong></div>
                <div>Status Hari Libur: <strong>{cutoffReport.is_national_holiday ? 'Hari Libur Nasional' : 'Hari Kerja Efektif'}</strong></div>
              </div>

              {cutoffReport.marked_alfa_employees?.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Daftar Pegawai Ditandai Alfa:</span>
                  {cutoffReport.marked_alfa_employees.map((emp, i) => (
                    <div key={i} className="text-2xs p-1.5 bg-white border border-slate-100 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900">{emp.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.nip}</div>
                      </div>
                      <Badge variant="danger" className="text-[9px]">Alfa</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL UPLOAD REKAP PRESENSI PERIODE */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Berkas Rekap Presensi Periode"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={uploadingRekap}>
              Batal
            </Button>
            <Button onClick={handleUploadRekap} loading={uploadingRekap} disabled={uploadingRekap}>
              Unggah & Proses
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadRekap} className="space-y-4">
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-900 flex items-start gap-2">
            <FileSpreadsheet className="text-primary-600 mt-0.5 shrink-0" size={16} />
            <p className="text-2xs">
              Unggah file rekap presensi bulanan/periode (format: Excel, CSV, TXT, SQL). Sistem akan memproses dan mengelompokkan data presensi ke dalam bundle periode terkait.
            </p>
          </div>

          <Input
            label="Nama Periode Presensi *"
            placeholder="Contoh: Rekap Presensi September 2026"
            value={rekapForm.nama_periode}
            onChange={(e) => setRekapForm({ ...rekapForm, nama_periode: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Awal Periode *"
              type="date"
              value={rekapForm.tanggal_awal}
              onChange={(e) => setRekapForm({ ...rekapForm, tanggal_awal: e.target.value })}
              required
            />
            <Input
              label="Tanggal Akhir Periode *"
              type="date"
              value={rekapForm.tanggal_akhir}
              onChange={(e) => setRekapForm({ ...rekapForm, tanggal_akhir: e.target.value })}
              required
            />
          </div>

          <Input
            label="Berkas Rekap Presensi *"
            type="file"
            accept=".xlsx,.xls,.csv,.txt,.sql"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setRekapForm({ ...rekapForm, file_rekap: file });
            }}
            required
            hint="Format berkas: .xlsx, .xls, .csv, .txt, .sql"
          />

          <Input
            label="Catatan (Opsional)"
            placeholder="Catatan tambahan untuk periode ini..."
            value={rekapForm.catatan}
            onChange={(e) => setRekapForm({ ...rekapForm, catatan: e.target.value })}
          />
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
}
