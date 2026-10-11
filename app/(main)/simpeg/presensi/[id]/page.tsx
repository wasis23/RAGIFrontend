'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Filter, DollarSign, Layers, Calendar, Users, FileText, UserCheck, Copy, Info, Edit3, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

const koreksiPresensiSchema = z.object({
  status_kehadiran: z.enum(['hadir', 'izin', 'sakit', 'dinas', 'alfa'] as const, {
    message: 'Status kehadiran wajib dipilih',
  }),
  jam_masuk: z.string().optional(),
  jam_keluar: z.string().optional(),
  alasan_koreksi: z.string().min(5, 'Alasan koreksi presensi wajib diisi minimal 5 karakter sebagai rekam audit'),
});

type KoreksiPresensiFormValues = z.infer<typeof koreksiPresensiSchema>;

export const STATUS_KEHADIRAN_KOREKSI_OPTIONS = [
  { value: 'hadir', label: 'Hadir (Masuk & Pulang)' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'dinas', label: 'Dinas Luar' },
  { value: 'alfa', label: 'Alfa / Tidak Hadir' },
];

export interface PresensiBundle {
  id: number;
  nama_periode: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  bulan_tahun?: string;
  total_record: number;
  total_pegawai?: number;
  catatan?: string;
  created_at: string;
}

export interface DayInfo {
  index: number;
  date: string;
  day: number;
  month: number;
  day_name: string;
  is_sunday: boolean;
  is_holiday: boolean;
  holiday_name?: string | null;
}

export interface AttendanceDayStatus {
  id?: number | null;
  date: string;
  is_holiday: boolean;
  status_kehadiran: string;
  in_status: 'on_time' | 'late' | 'permission' | 'absent' | 'holiday' | 'upcoming';
  in_time?: string | null;
  in_minutes_late?: number;
  out_status: 'on_time' | 'early' | 'permission' | 'absent' | 'holiday' | 'upcoming';
  out_time?: string | null;
  out_minutes_early?: number;
  catatan?: string | null;
  is_corrected?: boolean;
  source?: string | null;
}

export interface EmployeeMatrixRow {
  pegawai_id: number;
  nip: string;
  nama_lengkap: string;
  matrix: Record<string, AttendanceDayStatus>;
  summary: {
    total_hadir: number;
    total_terlambat: number;
    total_pulang_cepat: number;
    total_izin: number;
    total_alfa: number;
    total_hari_kerja: number;
    persentase: number;
  };
}

export default function PresensiBundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bundleId = resolvedParams.id;
  const router = useRouter();
  const { hasPermission, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin') || hasRole('admin_simpeg') || hasPermission('simpeg.presensi.manage');

  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<PresensiBundle | null>(null);
  const [days, setDays] = useState<DayInfo[]>([]);
  const [matrixData, setMatrixData] = useState<EmployeeMatrixRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama_lengkap');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [filterLimit, setFilterLimit] = useState(15);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // Modal Payroll Process State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);

  // Modal Koreksi Presensi State
  const [koreksiModal, setKoreksiModal] = useState<{
    open: boolean;
    loading: boolean;
    pegawaiId: number;
    pegawaiNama: string;
    pegawaiNip: string;
    tanggal: string;
    dayName: string;
    isHoliday: boolean;
    holidayName?: string | null;
    dataAwal: {
      status: string;
      jamMasuk: string | null;
      jamKeluar: string | null;
      catatan: string | null;
      isCorrected?: boolean;
    };
  }>({
    open: false,
    loading: false,
    pegawaiId: 0,
    pegawaiNama: '',
    pegawaiNip: '',
    tanggal: '',
    dayName: '',
    isHoliday: false,
    holidayName: null,
    dataAwal: {
      status: 'alfa',
      jamMasuk: null,
      jamKeluar: null,
      catatan: null,
    },
  });

  const {
    register: registerKoreksi,
    handleSubmit: handleKoreksiSubmitHook,
    setValue: setKoreksiValue,
    watch: watchKoreksi,
    reset: resetKoreksi,
    control: koreksiControl,
    formState: { errors: koreksiErrors },
  } = useForm<KoreksiPresensiFormValues>({
    resolver: zodResolver(koreksiPresensiSchema),
    defaultValues: {
      status_kehadiran: 'hadir',
      jam_masuk: '08:00:00',
      jam_keluar: '16:00:00',
      alasan_koreksi: '',
    },
  });

  const watchStatusKehadiran = watchKoreksi('status_kehadiran');

  const fetchBundleMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await simpegService.getPresensiBundleDetail(bundleId, {
        view: 'matrix',
        search: searchKeyword.trim() || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
        page,
        per_page: filterLimit,
        limit: filterLimit,
      });

      if (res.status === 'success') {
        const payload = res.data;
        if (payload && payload.periode) {
          setBundle(payload.periode || null);
          setDays(Array.isArray(payload.days) ? payload.days : []);
          setMatrixData(Array.isArray(payload.matrix) ? payload.matrix : []);
        } else {
          setBundle(res.bundle || null);
          setDays(Array.isArray(res.days) ? res.days : []);
          setMatrixData(Array.isArray(res.data) ? res.data : []);
        }
        setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat matriks Bundle Presensi');
    } finally {
      setLoading(false);
    }
  }, [bundleId, searchKeyword, filterOrderBy, filterOrderDir, page, filterLimit]);

  useEffect(() => {
    fetchBundleMatrix();
  }, [fetchBundleMatrix]);

  const handleProcessPayroll = async () => {
    setProcessingPayroll(true);
    try {
      const res = await simpegService.processBundlePayroll(bundleId);
      if (res.status === 'success') {
        toast.success(res.message || `Payroll untuk bundle ${bundle?.nama_periode} berhasil diproses!`);
        setShowPayrollModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses payroll untuk bundle ini.');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const getIndicatorClass = (status?: string, isCorrected?: boolean) => {
    const baseShadow = 'shadow-xs transition-all duration-150';
    switch (status) {
      case 'on_time':
        // Hijau: Emerald modern, elegan, bersih
        return `bg-emerald-500 hover:bg-emerald-600 ring-1 ring-emerald-600/40 ${baseShadow}`;
      case 'permission':
        // Kuning: Amber hangat, bersahabat
        return `bg-amber-400 hover:bg-amber-500 ring-1 ring-amber-500/40 ${baseShadow}`;
      case 'late':
      case 'early':
        // Merah: Rose tegas modern
        return `bg-rose-500 hover:bg-rose-600 ring-1 ring-rose-600/40 ${baseShadow}`;
      case 'absent':
        // Hitam: Slate-900 pekat
        return `bg-slate-900 hover:bg-black ring-1 ring-slate-950/70 ${baseShadow}`;
      case 'holiday':
        // Abu-abu netral: hari libur / Minggu
        return `bg-slate-200 border border-slate-300 text-slate-400 ${baseShadow}`;
      case 'upcoming':
      default:
        // Tanggal masa depan yang belum tiba
        return 'bg-slate-100 border border-dashed border-slate-300 opacity-60';
    }
  };

  const handleOpenKoreksi = (row: EmployeeMatrixRow, dayObj: DayInfo) => {
    if (!isAdmin) return;
    const m = row.matrix?.[dayObj.date];
    const initialStatus = (m?.status_kehadiran && ['hadir', 'izin', 'sakit', 'dinas', 'alfa'].includes(m.status_kehadiran))
      ? (m.status_kehadiran as 'hadir' | 'izin' | 'sakit' | 'dinas' | 'alfa')
      : (m?.in_status === 'absent' || m?.out_status === 'absent' ? 'alfa' : 'hadir');

    resetKoreksi({
      status_kehadiran: initialStatus,
      jam_masuk: m?.in_time || (initialStatus === 'hadir' ? '08:00:00' : ''),
      jam_keluar: m?.out_time || (initialStatus === 'hadir' ? '16:00:00' : ''),
      alasan_koreksi: '',
    });

    setKoreksiModal({
      open: true,
      loading: false,
      pegawaiId: row.pegawai_id,
      pegawaiNama: row.nama_lengkap,
      pegawaiNip: row.nip || '-',
      tanggal: dayObj.date,
      dayName: dayObj.day_name,
      isHoliday: dayObj.is_holiday,
      holidayName: dayObj.holiday_name,
      dataAwal: {
        status: m?.status_kehadiran || (dayObj.is_holiday ? 'libur' : 'alfa'),
        jamMasuk: m?.in_time || null,
        jamKeluar: m?.out_time || null,
        catatan: m?.catatan || null,
        isCorrected: m?.is_corrected,
      },
    });
  };

  const onKoreksiSubmit = async (values: KoreksiPresensiFormValues) => {
    setKoreksiModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await simpegService.koreksiPresensiBundle({
        presensi_periode_id: Number(bundleId),
        pegawai_id: koreksiModal.pegawaiId,
        tanggal: koreksiModal.tanggal,
        status_kehadiran: values.status_kehadiran,
        jam_masuk: values.status_kehadiran === 'hadir' && values.jam_masuk?.trim() ? values.jam_masuk.trim() : null,
        jam_keluar: values.status_kehadiran === 'hadir' && values.jam_keluar?.trim() ? values.jam_keluar.trim() : null,
        alasan_koreksi: values.alasan_koreksi.trim(),
      });

      if (res.status === 'success') {
        toast.success(res.message || 'Presensi berhasil dikoreksi dengan audit data asal.');
        setKoreksiModal((prev) => ({ ...prev, open: false }));
        fetchBundleMatrix();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal melakukan koreksi presensi.');
    } finally {
      setKoreksiModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = useMemo<ColumnDef<EmployeeMatrixRow>[]>(() => {
    const cols: ColumnDef<EmployeeMatrixRow>[] = [
      {
        key: 'no',
        label: 'No',
        align: 'center',
        render: (_, index) => (
          <span className="text-2xs font-mono text-slate-500">
            {(meta?.from || 1) + index}
          </span>
        ),
      },
      {
        key: 'nip',
        label: 'NIP',
        render: (row) => (
          <span className="text-xs font-mono font-medium text-slate-700 whitespace-nowrap">
            {row.nip || '-'}
          </span>
        ),
      },
      {
        key: 'nama_lengkap',
        label: 'Nama Pegawai',
        render: (row) => (
          <div className="space-y-0.5 min-w-[170px] max-w-[220px]">
            <div className="font-semibold text-slate-900 text-xs truncate" title={row.nama_lengkap}>
              {row.nama_lengkap}
            </div>
            <div className="text-2xs text-slate-400 font-mono">
              ID #{row.pegawai_id}
            </div>
          </div>
        ),
      },
    ];

    // Kolom-kolom Tanggal Dinamis (26 s/d 25)
    days.forEach((dayObj) => {
      cols.push({
        key: `day_${dayObj.date}`,
        label: dayObj.day,
        align: 'center',
        headerRender: () => (
          <div
            className={`flex flex-col items-center justify-center py-1 px-1 min-w-[34px] rounded transition-colors ${
              dayObj.is_holiday ? 'bg-rose-100/80 text-rose-800 border border-rose-200' : 'text-slate-700'
            }`}
            title={
              dayObj.holiday_name
                ? `${dayObj.date}: ${dayObj.holiday_name}`
                : dayObj.is_sunday
                ? `${dayObj.date}: Hari Minggu (Libur)`
                : dayObj.date
            }
          >
            <span className="text-xs font-extrabold leading-none">{dayObj.day}</span>
            <span className={`text-[9px] font-semibold tracking-tighter ${dayObj.is_holiday ? 'text-rose-700' : 'text-slate-500'}`}>
              {dayObj.day_name}
            </span>
          </div>
        ),
        render: (row) => {
          const m = row.matrix?.[dayObj.date];
          const inStatus = m?.in_status || 'upcoming';
          const outStatus = m?.out_status || 'upcoming';

          // Bangun tooltip detail hover
          const dateTitle = `${dayObj.day_name}, ${dayObj.date}`;
          let inDesc = 'Masuk: -';
          if (inStatus === 'on_time') inDesc = `Masuk: ${m?.in_time || '-'} (Tepat Waktu)`;
          else if (inStatus === 'late') inDesc = `Masuk: ${m?.in_time || '-'} (Terlambat ${m?.in_minutes_late || 0} mnt)`;
          else if (inStatus === 'permission') inDesc = `Masuk: Dispensasi (${m?.status_kehadiran})`;
          else if (inStatus === 'absent') inDesc = 'Masuk: Tidak Absen (Alpa)';
          else if (inStatus === 'holiday') inDesc = 'Masuk: Libur';

          let outDesc = 'Pulang: -';
          if (outStatus === 'on_time') outDesc = `Pulang: ${m?.out_time || '-'} (Tepat Waktu)`;
          else if (outStatus === 'early') outDesc = `Pulang: ${m?.out_time || '-'} (Pulang Cepat ${m?.out_minutes_early || 0} mnt)`;
          else if (outStatus === 'permission') outDesc = `Pulang: Dispensasi (${m?.status_kehadiran})`;
          else if (outStatus === 'absent') outDesc = 'Pulang: Tidak Absen (Alpa)';
          else if (outStatus === 'holiday') outDesc = 'Pulang: Libur';

          const isCorrected = Boolean(m?.is_corrected);
          const fullTooltip = `${dateTitle}\n• ${inDesc}\n• ${outDesc}${isCorrected ? '\n★ [Telah Dikoreksi Admin]' : ''}${m?.catatan ? `\nCatatan: ${m.catatan}` : ''}${isAdmin ? '\n(Klik sel untuk koreksi presensi)' : ''}`;

          return (
            <div
              onClick={() => handleOpenKoreksi(row, dayObj)}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 px-1 min-w-[34px] rounded hover:bg-slate-100/90 transition-all cursor-pointer group ${
                dayObj.is_holiday ? 'bg-rose-50/40' : ''
              } ${isCorrected ? 'ring-1 ring-sky-400/80 bg-sky-50/40' : ''}`}
              title={fullTooltip}
            >
              {/* Pin/Dot Penanda Koreksi Admin */}
              {isCorrected && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white shadow-xs"
                  title="Data telah dikoreksi oleh Admin"
                />
              )}

              {/* Kotak 1: Masuk (Atas) */}
              <div
                className={`w-3.5 h-3.5 rounded-[3px] transition-transform group-hover:scale-110 ${getIndicatorClass(inStatus, isCorrected)}`}
                aria-label={`Masuk: ${inStatus}`}
              />
              {/* Kotak 2: Pulang (Bawah) */}
              <div
                className={`w-3.5 h-3.5 rounded-[3px] transition-transform group-hover:scale-110 ${getIndicatorClass(outStatus, isCorrected)}`}
                aria-label={`Pulang: ${outStatus}`}
              />
            </div>
          );
        },
      });
    });

    // Kolom Persentase Kehadiran (%)
    cols.push({
      key: 'persentase',
      label: 'Presentase %',
      align: 'center',
      render: (row) => {
        const pct = row.summary?.persentase ?? 0;
        let badgeVariant: 'success' | 'warning' | 'danger' = 'success';
        if (pct < 75) badgeVariant = 'danger';
        else if (pct < 90) badgeVariant = 'warning';

        return (
          <div className="flex flex-col items-center justify-center gap-0.5 min-w-[80px]">
            <Badge variant={badgeVariant} className="font-mono font-bold text-xs px-2 py-0.5">
              {pct}%
            </Badge>
            <span className="text-[10px] text-slate-500 font-medium">
              {row.summary?.total_hadir ?? 0}/{row.summary?.total_hari_kerja ?? 0} Hari
            </span>
          </div>
        );
      },
    });

    // Kolom Aksi Menu Titik 3
    cols.push({
      key: 'actions',
      label: 'Aksi',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Salin NIP',
              icon: <Copy size={14} />,
              onClick: () => {
                if (row.nip && row.nip !== '-') {
                  navigator.clipboard.writeText(row.nip);
                  toast.success(`NIP ${row.nip} disalin ke clipboard`);
                } else {
                  toast.error('NIP pegawai tidak tersedia');
                }
              },
            },
            {
              label: 'Filter Pegawai Ini',
              icon: <UserCheck size={14} />,
              onClick: () => {
                setSearchKeyword(row.nip && row.nip !== '-' ? row.nip : row.nama_lengkap);
                setPage(1);
                toast.success(`Memfilter presensi untuk ${row.nama_lengkap}`);
              },
            },
          ]}
        />
      ),
    });

    return cols;
  }, [days, meta?.from]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={bundle ? bundle.nama_periode : 'Rincian Bundle Presensi'}
        description={`Detail matriks presensi pegawai siklus periode ${bundle?.tanggal_awal ? formatDate(bundle.tanggal_awal) : ''} s/d ${bundle?.tanggal_akhir ? formatDate(bundle.tanggal_akhir) : ''}`}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIMPEG', href: '/simpeg' },
          { label: 'Presensi & Jadwal', href: '/simpeg/presensi' },
          { label: bundle ? bundle.nama_periode : 'Rincian Bundle' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/presensi')}
              className="text-[var(--module-primary)] border-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Kembali
            </Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            {isAdmin && (
              <Button icon={<DollarSign size={16} />} onClick={() => setShowPayrollModal(true)}>
                Proses Payroll
              </Button>
            )}
          </div>
        }
      />

      {/* Bundle Metadata Header Card */}
      {bundle && (
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Nama Bundle</div>
              <div className="text-sm font-bold text-slate-800">{bundle.nama_periode}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Rentang Siklus</div>
              <div className="text-sm font-bold text-slate-800">
                {formatDate(bundle.tanggal_awal)} s/d {formatDate(bundle.tanggal_akhir)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Pegawai Terdaftar</div>
              <div className="text-sm font-bold text-emerald-700">
                {bundle.total_pegawai !== undefined ? bundle.total_pegawai.toLocaleString('id-ID') : 0} Pegawai
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Waktu Buat Bundle</div>
              <div className="text-xs font-semibold text-slate-700">
                {new Date(bundle.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Format Indikator Presensi Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-primary-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Format Sel Tanggal: Kotak Atas = Scan Masuk | Kotak Bawah = Scan Pulang
            </span>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            *Arahkan kursor (hover) ke setiap kotak untuk melihat jam aktual dan status kehadiran.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-700 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 hover:bg-emerald-600 ring-1 ring-emerald-600/40 shadow-xs" />
            <span>Tepat Waktu (In ≤ 08:15 / Out ≥ 16:00)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-amber-400 hover:bg-amber-500 ring-1 ring-amber-500/40 shadow-xs" />
            <span>Izin / Sakit / Dinas</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-rose-500 hover:bg-rose-600 ring-1 ring-rose-600/40 shadow-xs" />
            <span>Terlambat / Pulang Cepat</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-slate-900 hover:bg-black ring-1 ring-slate-950/70 shadow-xs" />
            <span>Tidak Absen (Alpa)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-slate-200 border border-slate-300 shadow-xs" />
            <span>Hari Libur / Minggu</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="relative w-3.5 h-3.5 rounded-[3px] bg-sky-100 ring-1 ring-sky-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            </div>
            <span className="text-sky-700 font-semibold">Dikoreksi Admin (Audit Trail)</span>
          </div>
        </div>
      </div>

      {/* Matriks DataTable */}
      <DataTable
        columns={columns}
        data={matrixData}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setFilterLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="Tidak ada data pegawai yang sesuai pada bundle presensi ini."
      />

      {/* Drawer Filter */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Pegawai Bundle">
        <div className="space-y-4">
          <Input
            label="Cari Pegawai (Nama / NIP)"
            placeholder="Ketik nama atau NIP..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'nama_lengkap', label: 'Nama Pegawai' },
                { value: 'nip', label: 'NIP Pegawai' },
                { value: 'pegawai_id', label: 'ID Pegawai' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Asc)' },
                { value: 'desc', label: 'Z - A (Desc)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setPage(1);
                setShowFilter(false);
                fetchBundleMatrix();
              }}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchKeyword('');
                setFilterOrderBy('nama_lengkap');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Confirm Process Payroll for Bundle */}
      <Modal
        open={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        title="Proses Payroll Gaji dari Bundle Presensi"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPayrollModal(false)} disabled={processingPayroll}>
              Batal
            </Button>
            <Button loading={processingPayroll} disabled={processingPayroll} onClick={handleProcessPayroll}>
              Proses & Kirim Payroll ke SIKEU
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-primary-50 text-primary-900 rounded-xl border border-primary-100">
            <DollarSign size={22} className="mt-0.5 shrink-0 text-primary-600" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-primary-900">Proses Perhitungan Gaji Payroll</p>
              <p className="text-primary-700 text-xs">
                Perhitungan komponen gaji (gaji pokok, tunjangan kehadiran, dan potongan keterlambatan) akan dikalkulasi berdasarkan rekap kehadiran {bundle?.total_pegawai} pegawai dalam bundle <strong>{bundle?.nama_periode}</strong> (Periode: {formatDate(bundle?.tanggal_awal)} s/d {formatDate(bundle?.tanggal_akhir)}).
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Hasil kalkulasi payroll ini akan diteruskan ke modul SIKEU untuk verifikasi pembayaran gaji pegawai.
          </p>
        </div>
      </Modal>

      {/* Modal Koreksi Presensi Pegawai dengan Audit Data Asal */}
      <Modal
        open={koreksiModal.open}
        onClose={() => setKoreksiModal((prev) => ({ ...prev, open: false }))}
        title="Koreksi Presensi Pegawai (Audit Trail)"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setKoreksiModal((prev) => ({ ...prev, open: false }))}
              disabled={koreksiModal.loading}
            >
              Batal
            </Button>
            <Button
              loading={koreksiModal.loading}
              disabled={koreksiModal.loading}
              onClick={handleKoreksiSubmitHook(onKoreksiSubmit)}
            >
              Simpan Koreksi & Rekam Audit
            </Button>
          </>
        }
      >
        <form onSubmit={handleKoreksiSubmitHook(onKoreksiSubmit)} className="space-y-4">
          {/* Header Ringkasan Pegawai & Tanggal */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">{koreksiModal.pegawaiNama}</span>
              <span className="font-mono text-slate-500">NIP: {koreksiModal.pegawaiNip}</span>
            </div>
            <div className="flex items-center gap-2 text-2xs text-slate-600 font-medium">
              <Calendar size={13} className="text-[var(--module-primary)]" />
              <span>
                {koreksiModal.dayName}, {formatDate(koreksiModal.tanggal)}
                {koreksiModal.isHoliday && (
                  <span className="ml-1 text-rose-600 font-bold">
                    ({koreksiModal.holidayName || 'Hari Libur / Minggu'})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Card Data Awal / Asal (Audit Record) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <ShieldAlert size={15} className="text-amber-600 shrink-0" />
              <span>Data Asal Sebelum Dikoreksi:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
              <div>
                <span className="text-amber-700 font-medium">Status Awal: </span>
                <span className="font-bold uppercase tracking-wider text-amber-950">
                  {koreksiModal.dataAwal.status || 'Tidak Absen (Alpa)'}
                </span>
              </div>
              <div>
                <span className="text-amber-700 font-medium">Jam Masuk / Keluar: </span>
                <span className="font-mono font-semibold">
                  {koreksiModal.dataAwal.jamMasuk ? koreksiModal.dataAwal.jamMasuk.slice(0, 5) : '-'} / {koreksiModal.dataAwal.jamKeluar ? koreksiModal.dataAwal.jamKeluar.slice(0, 5) : '-'}
                </span>
              </div>
            </div>
            {koreksiModal.dataAwal.catatan && (
              <div className="text-2xs text-amber-800/90 pt-1 border-t border-amber-200/60 truncate">
                <span className="font-medium">Catatan Lama: </span>{koreksiModal.dataAwal.catatan}
              </div>
            )}
          </div>

          {/* Form Input Koreksi: Maksimal 2 Kolom per UI Standard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="status_kehadiran"
              control={koreksiControl}
              render={({ field }) => (
                <Select
                  label="Status Kehadiran Baru *"
                  value={field.value}
                  onChange={(val) => {
                    const newStatus = val as 'hadir' | 'izin' | 'sakit' | 'dinas' | 'alfa';
                    field.onChange(newStatus);
                    if (newStatus === 'hadir') {
                      setKoreksiValue('jam_masuk', '08:00:00');
                      setKoreksiValue('jam_keluar', '16:00:00');
                    } else {
                      setKoreksiValue('jam_masuk', '');
                      setKoreksiValue('jam_keluar', '');
                    }
                  }}
                  error={koreksiErrors.status_kehadiran?.message}
                  options={STATUS_KEHADIRAN_KOREKSI_OPTIONS}
                />
              )}
            />

            {watchStatusKehadiran === 'hadir' ? (
              <Input
                label="Jam Masuk (WIB) *"
                placeholder="08:00:00"
                {...registerKoreksi('jam_masuk')}
                error={koreksiErrors.jam_masuk?.message}
              />
            ) : (
              <div className="flex items-center text-xs text-slate-500 italic p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                Jam masuk & pulang otomatis ditiadakan untuk dispensasi/alfa.
              </div>
            )}

            {watchStatusKehadiran === 'hadir' && (
              <Input
                label="Jam Pulang (WIB) *"
                placeholder="16:00:00"
                {...registerKoreksi('jam_keluar')}
                error={koreksiErrors.jam_keluar?.message}
              />
            )}

            <div className={watchStatusKehadiran === 'hadir' ? 'md:col-span-1' : 'md:col-span-2'}>
              <Input
                label="Alasan Koreksi Admin (Wajib Audit) *"
                placeholder="Contoh: Pegawai hadir dinas luar / lupa tap mesin"
                {...registerKoreksi('alasan_koreksi')}
                error={koreksiErrors.alasan_koreksi?.message}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

