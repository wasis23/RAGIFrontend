'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClipboardCheck,
  Building2,
  CalendarRange,
  SlidersHorizontal,
  Filter,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Save,
  Trash2,
  Edit2,
  Calendar,
  RefreshCw,
  Eye,
  Check,
  Copy,
  UserX,
  Fingerprint,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
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
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { PaginationMeta } from '@/types/api.types';
import type { FingerprintDevice, CutoffReport } from '@/types/simpeg.types';

// Skema validasi Zod untuk form tipe shift (pesan Bahasa Indonesia)
const shiftFormSchema = z.object({
  name: z.string().min(3, 'Nama tipe shift minimal 3 karakter').max(255, 'Nama tipe shift maksimal 255 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  late_tolerance_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  early_leave_tolerance_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  max_early_clock_in_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(240, 'Maksimal 240 menit'),
  applies_national_holidays: z.boolean(),
  is_active: z.boolean(),
});

type ShiftFormValues = z.output<typeof shiftFormSchema>;
type ShiftFormInput = z.input<typeof shiftFormSchema>;

// Skema validasi Zod untuk form keterangan ketidakhadiran (pesan Bahasa Indonesia)
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

  const [activeTab, setActiveTab] = useState<'log' | 'office' | 'shift' | 'settings' | 'holiday' | 'devices'>('log');

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
  // TAB 1: LOG PRESENSI REALTIME & BUNDLE REKAP
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
      title: 'Hapus Bundle Presensi',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus bundle <strong>{bundle.nama_periode}</strong> ({bundle.total_record} log absensi)? Seluruh data rekap di dalamnya akan dihapus permanen.
        </span>
      ),
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          const res = await simpegService.deletePresensiBundle(bundle.id);
          toast.success(res.message || 'Bundle presensi berhasil dihapus.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchBundleList();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus bundle presensi.');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false,
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
  // TAB 2: LOKASI KANTOR (OFFICE LOCATIONS)
  // -------------------------------------------------------------
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any | null>(null);
  const [officeForm, setOfficeForm] = useState({
    name: '',
    address: '',
    latitude: -7.5675,
    longitude: 110.8036,
    radius_meters: 150,
    is_active: true,
  });
  const [savingOffice, setSavingOffice] = useState(false);

  const fetchOffices = useCallback(async () => {
    setLoadingOffices(true);
    try {
      const res = await simpegService.getOfficeLocations();
      if (res.status === 'success') {
        setOffices(res.data || []);
      }
    } catch {
      toast.error('Gagal memuat master lokasi kantor');
    } finally {
      setLoadingOffices(false);
    }
  }, []);

  const handleOpenCreateOffice = () => {
    setEditingOffice(null);
    setOfficeForm({
      name: '',
      address: '',
      latitude: -7.5675,
      longitude: 110.8036,
      radius_meters: 150,
      is_active: true,
    });
    setShowOfficeModal(true);
  };

  const handleOpenEditOffice = (office: any) => {
    setEditingOffice(office);
    setOfficeForm({
      name: office.name,
      address: office.address || '',
      latitude: office.latitude,
      longitude: office.longitude,
      radius_meters: office.radius_meters,
      is_active: office.is_active,
    });
    setShowOfficeModal(true);
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOffice(true);
    try {
      if (editingOffice) {
        await simpegService.updateOfficeLocation(editingOffice.id, officeForm);
        toast.success('Lokasi kantor berhasil diperbarui');
      } else {
        await simpegService.createOfficeLocation(officeForm);
        toast.success('Lokasi kantor berhasil ditambahkan');
      }
      setShowOfficeModal(false);
      fetchOffices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan lokasi kantor');
    } finally {
      setSavingOffice(false);
    }
  };

  const handleDeleteOffice = (office: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Lokasi Kantor',
      message: `Apakah Anda yakin ingin menghapus lokasi kantor "${office.name}"? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteOfficeLocation(office.id);
          toast.success('Lokasi kantor berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchOffices();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus lokasi kantor');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // -------------------------------------------------------------
  // TAB 3: SHIFT KERJA & JADWAL
  // -------------------------------------------------------------
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [savingShift, setSavingShift] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await simpegService.getShiftTemplates();
      if (res.status === 'success') {
        const list = res.data || [];
        setShifts(list);
        setSelectedShift((prev: any) => {
          if (!prev && list.length > 0) return list[0];
          if (prev) {
            const fresh = list.find((s: any) => s.id === prev.id);
            return fresh || prev;
          }
          return prev;
        });
      }
    } catch {
      toast.error('Gagal memuat jadwal shift kerja');
    } finally {
      setLoadingShifts(false);
    }
  }, []);

  // -------------------------------------------------------------
  // TAB 3b: KALENDER LIBUR / TANGGAL MERAH
  // -------------------------------------------------------------
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [syncingHolidays, setSyncingHolidays] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: '',
    name: '',
    is_mass_leave: false,
    description: '',
  });
  const [savingHoliday, setSavingHoliday] = useState(false);

  const fetchHolidays = useCallback(async (year: number) => {
    setLoadingHolidays(true);
    try {
      const res = await simpegService.getNationalHolidays(year);
      if (res.status === 'success') {
        setHolidays(res.data || []);
      }
    } catch {
      toast.error('Gagal memuat daftar tanggal libur');
    } finally {
      setLoadingHolidays(false);
    }
  }, []);

  const handleOpenCreateHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({ holiday_date: `${holidayYear}-01-01`, name: '', is_mass_leave: false, description: '' });
    setShowHolidayModal(true);
  };

  const handleOpenEditHoliday = (h: any) => {
    setEditingHoliday(h);
    setHolidayForm({
      holiday_date: (h.holiday_date || '').substring(0, 10),
      name: h.name || '',
      is_mass_leave: !!h.is_mass_leave,
      description: h.description || '',
    });
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHoliday(true);
    try {
      if (editingHoliday) {
        await simpegService.updateNationalHoliday(editingHoliday.id, holidayForm);
        toast.success('Tanggal libur berhasil diperbarui');
      } else {
        await simpegService.createNationalHoliday(holidayForm);
        toast.success('Tanggal libur berhasil ditambahkan');
      }
      setShowHolidayModal(false);
      fetchHolidays(holidayYear);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.holiday_date?.[0] || 'Gagal menyimpan tanggal libur';
      toast.error(msg);
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = (h: any) => {
    const label = `${h.name} (${(h.holiday_date || '').substring(0, 10)})`;
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Tanggal Libur',
      message: `Apakah Anda yakin ingin menghapus tanggal libur "${label}"? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteNationalHoliday(h.id);
          toast.success('Tanggal libur berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchHolidays(holidayYear);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus tanggal libur');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleSaveShiftSchedule = async () => {
    if (!selectedShift) return;
    setSavingShift(true);
    try {
      await simpegService.updateShiftTemplate(selectedShift.id, {
        name: selectedShift.name,
        description: selectedShift.description,
        late_tolerance_minutes: selectedShift.late_tolerance_minutes,
        early_leave_tolerance_minutes: selectedShift.early_leave_tolerance_minutes,
        max_early_clock_in_minutes: selectedShift.max_early_clock_in_minutes,
        applies_national_holidays: selectedShift.applies_national_holidays ?? true,
        is_active: selectedShift.is_active,
        days: selectedShift.days,
      });
      toast.success('Jadwal shift kerja berhasil disimpan');
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan jadwal shift');
    } finally {
      setSavingShift(false);
    }
  };

  // Form tambah / ubah tipe shift (bisa banyak tipe, jam beda-beda)
  // Validasi ketat Zod + React Hook Form, pesan Bahasa Indonesia
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  const {
    register: registerShift,
    control: controlShift,
    handleSubmit: handleSubmitShift,
    reset: resetShift,
    formState: { errors: shiftErrors, isSubmitting: savingShiftForm },
  } = useForm<ShiftFormInput, unknown, ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: '',
      description: '',
      late_tolerance_minutes: 15,
      early_leave_tolerance_minutes: 15,
      max_early_clock_in_minutes: 60,
      applies_national_holidays: true,
      is_active: true,
    },
  });

  const handleOpenCreateShift = () => {
    setEditingShift(null);
    resetShift({
      name: '',
      description: '',
      late_tolerance_minutes: 15,
      early_leave_tolerance_minutes: 15,
      max_early_clock_in_minutes: 60,
      applies_national_holidays: true,
      is_active: true,
    });
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (s: any) => {
    setEditingShift(s);
    resetShift({
      name: s.name || '',
      description: s.description || '',
      late_tolerance_minutes: s.late_tolerance_minutes ?? 15,
      early_leave_tolerance_minutes: s.early_leave_tolerance_minutes ?? 15,
      max_early_clock_in_minutes: s.max_early_clock_in_minutes ?? 60,
      applies_national_holidays: s.applies_national_holidays ?? true,
      is_active: !!s.is_active,
    });
    setShowShiftModal(true);
  };

  const onSubmitShiftForm = async (values: ShiftFormValues) => {
    try {
      if (editingShift) {
        await simpegService.updateShiftTemplate(editingShift.id, {
          ...values,
          days: editingShift.days,
        });
        toast.success('Tipe shift berhasil diperbarui');
      } else {
        const res = await simpegService.createShiftTemplate(values);
        toast.success('Tipe shift baru berhasil ditambahkan — silakan atur jam per harinya');
        if (res.status === 'success' && res.data) {
          setSelectedShift(res.data);
        }
      }
      setShowShiftModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Gagal menyimpan tipe shift');
    }
  };

  const handleDeleteShift = (s: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Tipe Shift',
      message: `Apakah Anda yakin ingin menghapus tipe shift "${s.name}"? Jadwal 7 hari di dalamnya ikut terhapus. Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteShiftTemplate(s.id);
          toast.success('Tipe shift berhasil dihapus');
          if (selectedShift?.id === s.id) setSelectedShift(null);
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchShifts();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus tipe shift');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleDuplicateShift = async (s: any) => {
    const copyName = `${s.name} (Copy)`;
    try {
      const res = await simpegService.createShiftTemplate({
        name: copyName,
        description: s.description,
        late_tolerance_minutes: s.late_tolerance_minutes,
        early_leave_tolerance_minutes: s.early_leave_tolerance_minutes,
        max_early_clock_in_minutes: s.max_early_clock_in_minutes,
        applies_national_holidays: s.applies_national_holidays ?? true,
        is_active: true,
        days: (s.days || []).map((d: any) => ({
          day_of_week: d.day_of_week,
          start_time: d.start_time ? String(d.start_time).substring(0, 5) : null,
          end_time: d.end_time ? String(d.end_time).substring(0, 5) : null,
          is_day_off: !!d.is_day_off,
        })),
      });
      toast.success(`Tipe shift diduplikat menjadi "${copyName}"`);
      if (res.status === 'success' && res.data) setSelectedShift(res.data);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menduplikat tipe shift');
    }
  };

  // -------------------------------------------------------------
  // TAB 4: PARAMETER SISTEM
  // -------------------------------------------------------------
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [systemParams, setSystemParams] = useState({
    face_score_threshold: 0.80,
    gps_accuracy_threshold_meters: 50.0,
    late_tolerance_minutes: 15,
    max_early_clock_in_minutes: 60,
    early_leave_tolerance_minutes: 15,
    applies_national_holidays: true,
  });

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await simpegService.getPresensiSettings();
      if (res.status === 'success' && res.data) {
        setSystemParams(res.data);
      }
    } catch {
      toast.error('Gagal memuat parameter sistem presensi');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await simpegService.updatePresensiSettings(systemParams);
      toast.success('Parameter presensi sistem berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan parameter');
    } finally {
      setSavingSettings(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3c: MESIN PRESENSI FINGERPRINT / BIOMETRIK
  // -------------------------------------------------------------
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devices, setDevices] = useState<FingerprintDevice[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FingerprintDevice | null>(null);
  const [savingDevice, setSavingDevice] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<number | null>(null);
  const [deviceForm, setDeviceForm] = useState({
    device_name: '',
    device_code: '',
    ip_address: '',
    port: 4370,
    location: '',
    device_model: 'ZKTeco ProCapture-X',
    office_location_id: undefined as number | undefined,
    is_active: true,
  });

  // Modal Simulasi / Sync Punch Logs Mesin
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [savingSync, setSavingSync] = useState(false);
  const [syncForm, setSyncForm] = useState({
    device_code: '',
    nip: '',
    timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ') + ':00',
    in_out_mode: 0,
  });

  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const res = await simpegService.getFingerprintDevices();
      if (res.status === 'success' && res.data) {
        setDevices(res.data);
      }
    } catch {
      toast.error('Gagal memuat daftar mesin presensi');
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const handleOpenCreateDevice = () => {
    setEditingDevice(null);
    setDeviceForm({
      device_name: '',
      device_code: `FP-TERM-${Date.now().toString().slice(-4)}`,
      ip_address: '192.168.1.201',
      port: 4370,
      location: '',
      device_model: 'ZKTeco ProCapture-X',
      office_location_id: offices[0]?.id,
      is_active: true,
    });
    setShowDeviceModal(true);
  };

  const handleOpenEditDevice = (dev: FingerprintDevice) => {
    setEditingDevice(dev);
    setDeviceForm({
      device_name: dev.device_name,
      device_code: dev.device_code,
      ip_address: dev.ip_address,
      port: dev.port,
      location: dev.location || '',
      device_model: dev.device_model || '',
      office_location_id: dev.office_location_id || undefined,
      is_active: dev.is_active,
    });
    setShowDeviceModal(true);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDevice(true);
    try {
      if (editingDevice) {
        await simpegService.updateFingerprintDevice(editingDevice.id, deviceForm);
        toast.success('Mesin presensi berhasil diperbarui');
      } else {
        await simpegService.createFingerprintDevice(deviceForm);
        toast.success('Mesin presensi berhasil ditambahkan');
      }
      setShowDeviceModal(false);
      fetchDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data mesin');
    } finally {
      setSavingDevice(false);
    }
  };

  const handleDeleteDevice = (dev: FingerprintDevice) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Mesin Presensi',
      message: `Apakah Anda yakin ingin menghapus mesin presensi "${dev.device_name}" (${dev.device_code})? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteFingerprintDevice(dev.id);
          toast.success('Mesin presensi berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchDevices();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus mesin presensi');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleTestDevice = async (id: number) => {
    setTestingDeviceId(id);
    try {
      const res = await simpegService.testFingerprintDevice(id);
      if (res.status === 'success') {
        toast.success(res.message || 'Koneksi ke mesin presensi berhasil');
        fetchDevices();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal terhubung ke mesin presensi');
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handlePushSyncLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncForm.nip || !syncForm.timestamp) {
      toast.error('NIP dan Timestamp wajib diisi');
      return;
    }
    setSavingSync(true);
    try {
      const res = await simpegService.syncFingerprintLogs({
        device_code: syncForm.device_code || (devices[0]?.device_code ?? 'FP-MANUAL'),
        logs: [
          {
            pin: syncForm.nip,
            timestamp: syncForm.timestamp,
            in_out_mode: Number(syncForm.in_out_mode),
            verify_mode: 1,
          },
        ],
      });
      toast.success(res.message || 'Log mesin berhasil disinkronisasi');
      setShowSyncModal(false);
      fetchLogPresensi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi log mesin');
    } finally {
      setSavingSync(false);
    }
  };

  // -------------------------------------------------------------
  // PENUGASAN SHIFT MASSAL (BULK ASSIGN)
  // -------------------------------------------------------------
  const [showBulkShiftModal, setShowBulkShiftModal] = useState(false);
  const [savingBulkShift, setSavingBulkShift] = useState(false);
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<{ value: number; label: string }[]>([]);
  const [bulkShiftForm, setBulkShiftForm] = useState({
    shift_template_id: 0,
    unit_kerja_id: 0,
    jenis_pegawai: '' as '' | 'dosen' | 'tendik',
  });

  const handleOpenBulkModal = async () => {
    if (shifts.length === 0) await fetchShifts();
    setBulkShiftForm({
      shift_template_id: shifts[0]?.id ?? 0,
      unit_kerja_id: 0,
      jenis_pegawai: '',
    });
    setShowBulkShiftModal(true);

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

  const handleSaveBulkShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkShiftForm.shift_template_id) {
      toast.error('Pilih tipe shift terlebih dahulu');
      return;
    }
    setSavingBulkShift(true);
    try {
      const res = await simpegService.assignShiftBulk({
        shift_template_id: Number(bulkShiftForm.shift_template_id),
        unit_kerja_id: bulkShiftForm.unit_kerja_id ? Number(bulkShiftForm.unit_kerja_id) : undefined,
        jenis_pegawai: bulkShiftForm.jenis_pegawai || undefined,
      });
      toast.success(res.message || 'Penugasan shift massal berhasil');
      setShowBulkShiftModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menugaskan shift massal');
    } finally {
      setSavingBulkShift(false);
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

  // Effect fetch data saat tab berubah
  useEffect(() => {
    if (activeTab === 'log') {
      if (logViewMode === 'realtime') {
        fetchLogPresensi();
      } else {
        fetchBundleList();
      }
    }
    else if (activeTab === 'office') fetchOffices();
    else if (activeTab === 'shift') fetchShifts();
    else if (activeTab === 'holiday') fetchHolidays(holidayYear);
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'devices') fetchDevices();
  }, [activeTab, logViewMode, fetchLogPresensi, fetchBundleList, fetchOffices, fetchShifts, fetchHolidays, fetchSettings, fetchDevices, holidayYear]);

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

  const handleSyncHolidays = async () => {
    setSyncingHolidays(true);
    try {
      const res = await simpegService.syncNationalHolidays(holidayYear);
      toast.success(res.message || `Sinkronisasi libur nasional ${holidayYear} berhasil`);
      fetchHolidays(holidayYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Sinkronisasi libur nasional ${holidayYear} gagal — periksa koneksi ke API publik`);
    } finally {
      setSyncingHolidays(false);
    }
  };

  // -------------------------------------------------------------
  // KETERANGAN KETIDAKHADIRAN (admin menetapkan izin/sakit/dinas/alfa
  // untuk pegawai terjadwal masuk yang tidak memiliki log presensi)
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
    register: registerKeterangan,
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

  // -------------------------------------------------------------
  // COLUMNS: Log Presensi
  // -------------------------------------------------------------
  const logColumns: ColumnDef<any>[] = [
    {
      key: 'tanggal',
      label: 'Tanggal & Waktu',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800 text-xs">
            {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
          </div>
          <div className="flex items-center gap-1.5 text-2xs text-slate-500 font-mono">
            <span>In: {row.clock_in ? row.clock_in.substring(11, 16) : (row.jam_masuk ? row.jam_masuk.substring(0, 5) : '-')}</span>
            <span>•</span>
            <span>Out: {row.clock_out ? row.clock_out.substring(11, 16) : (row.jam_keluar ? row.jam_keluar.substring(0, 5) : '-')}</span>
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
            <ShieldCheck size={11} className="text-indigo-600" />
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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Pusat Presensi & Jadwal SIMPEG"
        description="Kelola verifikasi absensi biometrik wajah, lokasi kantor (geofencing), jadwal shift kerja, kalender libur, dan parameter sistem presensi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIMPEG', href: '/simpeg' },
          { label: 'Presensi & Jadwal' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'log' && (
              <>
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
              </>
            )}
            {activeTab === 'shift' && isAdmin && (
              <>
                <Button variant="outline" icon={<Users size={16} />} onClick={handleOpenBulkModal}>
                  Penugasan Massal Shift
                </Button>
                <Button icon={<Plus size={16} />} onClick={handleOpenCreateShift}>
                  Tambah Tipe Shift
                </Button>
              </>
            )}
            {activeTab === 'devices' && isAdmin && (
              <>
                <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => setShowSyncModal(true)}>
                  Sinkronisasi Log Mesin
                </Button>
                <Button icon={<Plus size={16} />} onClick={handleOpenCreateDevice}>
                  Tambah Mesin Presensi
                </Button>
              </>
            )}
            {activeTab === 'office' && isAdmin && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateOffice}>
                Tambah Lokasi Kantor
              </Button>
            )}
            {activeTab === 'holiday' && isAdmin && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateHoliday}>
                Tambah Tanggal Libur
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Navigation Bar */}
      <div className="card flex items-center gap-1.5 overflow-x-auto p-1.5" role="tablist" aria-label="Navigasi menu presensi">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'log'}
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'log'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ClipboardCheck size={16} className={activeTab === 'log' ? 'text-primary-600' : 'text-slate-500'} />
          1. Log & Verifikasi Presensi
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shift'}
          onClick={() => setActiveTab('shift')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'shift'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarRange size={16} className={activeTab === 'shift' ? 'text-primary-600' : 'text-slate-500'} />
          2. Shift & Jadwal Jam Kerja
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'devices'}
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'devices'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Fingerprint size={16} className={activeTab === 'devices' ? 'text-primary-600' : 'text-slate-500'} />
          3. Mesin Fingerprint & Biometrik
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'office'}
          onClick={() => setActiveTab('office')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'office'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Building2 size={16} className={activeTab === 'office' ? 'text-primary-600' : 'text-slate-500'} />
          4. Lokasi Kantor (Geofencing)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <SlidersHorizontal size={16} className={activeTab === 'settings' ? 'text-primary-600' : 'text-slate-500'} />
          5. Parameter Sistem & Toleransi
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'holiday'}
          onClick={() => setActiveTab('holiday')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'holiday'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calendar size={16} className={activeTab === 'holiday' ? 'text-primary-600' : 'text-slate-500'} />
          6. Kalender Libur & Tanggal Merah
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LOG PRESENSI REALTIME & BUNDLE REKAP */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Sub-view Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLogViewMode('realtime')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logViewMode === 'realtime'
                    ? 'bg-white text-primary-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={14} className={logViewMode === 'realtime' ? 'text-primary-600' : 'text-slate-400'} />
                <span>Log Realtime Biometrik</span>
              </button>
              <button
                type="button"
                onClick={() => setLogViewMode('bundle')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logViewMode === 'bundle'
                    ? 'bg-white text-primary-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={14} className={logViewMode === 'bundle' ? 'text-primary-600' : 'text-slate-400'} />
                <span>Rekap Bundle Periode</span>
              </button>
            </div>

            {logViewMode === 'bundle' && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Cari nama periode bundle..."
                  value={bundleSearch}
                  onChange={(e) => setBundleSearch(e.target.value)}
                  className="w-full sm:w-64"
                />
                {isAdmin && (
                  <Button
                    size="sm"
                    icon={<Upload size={14} />}
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload Rekap
                  </Button>
                )}
              </div>
            )}
          </div>

          {logViewMode === 'realtime' ? (
            <DataTable
              columns={logColumns}
              data={presensiList}
              isLoading={loadingLog}
              meta={meta}
              onPageChange={(newPage) => setPage(newPage)}
              emptyMessage="Belum ada log presensi yang sesuai filter."
            />
          ) : (
            <DataTable
              columns={bundleColumns}
              data={bundleList}
              isLoading={loadingBundle}
              meta={bundleMeta}
              onPageChange={(newPage) => setBundlePage(newPage)}
              emptyMessage="Belum ada berkas bundle rekap presensi. Klik Upload Rekap untuk mengimpor data."
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: LOKASI KANTOR (GEOFENCING) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'office' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((office) => (
            <div
              key={office.id}
              className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-primary-50 rounded-xl text-primary-700">
                    <Building2 size={22} />
                  </div>
                  <Badge variant={office.is_active ? 'success' : 'secondary'}>
                    {office.is_active ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{office.name}</h3>
                  <p className="text-2xs text-slate-500 mt-0.5 line-clamp-2">{office.address || 'Alamat belum disetel'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-2xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Koordinat GPS:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {office.latitude}, {office.longitude}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radius Geofence:</span>
                  <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    {office.radius_meters} meter
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pegawai Terdaftar:</span>
                  <span className="font-semibold text-slate-700">{office.employees_count || 0} Pegawai</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    icon={<Edit2 size={13} />}
                    onClick={() => handleOpenEditOffice(office)}
                  >
                    Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="px-2.5"
                    icon={<Trash2 size={13} />}
                    onClick={() => handleDeleteOffice(office)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SHIFT KERJA & JADWAL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daftar Template Shift */}
          <div className="space-y-3 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Template Shift ({shifts.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={13} />}
                onClick={fetchShifts}
                disabled={loadingShifts}
              >
                Muat Ulang
              </Button>
            </div>
            {loadingShifts && shifts.length === 0 && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">Memuat template shift...</div>
            )}
            {!loadingShifts && shifts.length === 0 && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle size={14} /> Template shift masih kosong
                </div>
                <p className="text-2xs text-amber-700">
                  Penyebab umum: seeder <span className="font-mono font-bold">SimpegPresensiSettingSeeder</span> belum dijalankan
                  (<span className="font-mono">php artisan db:seed --class=&quot;Database\\Seeders\\Simpeg\\SimpegPresensiSettingSeeder&quot;</span>).
                  Backend sekarang otomatis membuat template default saat endpoint dibuka — klik Muat Ulang.
                </p>
              </div>
            )}
            {shifts.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedShift(s)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedShift?.id === s.id
                    ? 'bg-primary-50/70 border-primary-300 ring-2 ring-primary-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                  <Badge variant={s.is_active ? 'success' : 'secondary'} className="text-[10px]">
                    {s.is_active ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>
                <p className="text-2xs text-slate-500 mt-1">{s.description || 'Pola jam kerja standar'}</p>
                <div className="mt-2 flex items-center justify-between text-2xs text-slate-600 font-semibold">
                  <span>Toleransi: {s.late_tolerance_minutes} mnt</span>
                  <span>{s.employees_count ?? 0} pegawai</span>
                </div>
                {isAdmin && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" icon={<Edit2 size={12} />} onClick={() => handleOpenEditShift(s)}>
                      Ubah
                    </Button>
                    <Button size="sm" variant="outline" icon={<Copy size={12} />} onClick={() => handleDuplicateShift(s)}>
                      Duplikat
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => handleDeleteShift(s)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pengaturan Detail 7 Hari Kerja */}
          {selectedShift && (
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-5 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Jadwal Harian: {selectedShift.name}</h3>
                  <p className="text-2xs text-slate-500">Atur jam masuk, jam pulang, dan hari libur untuk Senin s/d Minggu</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" icon={<Edit2 size={13} />} onClick={() => handleOpenEditShift(selectedShift)}>
                      Ubah Info Shift
                    </Button>
                    <Button
                      size="sm"
                      icon={<Save size={14} />}
                      loading={savingShift}
                      disabled={savingShift}
                      onClick={handleSaveShiftSchedule}
                    >
                      Simpan Jadwal
                    </Button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {selectedShift.days?.map((day: any, idx: number) => {
                  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const name = dayNames[day.day_of_week] || `Hari ${day.day_of_week}`;

                  return (
                    <div key={day.id || idx} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="w-28">
                        <span className="font-bold text-xs text-slate-800">{name}</span>
                        {day.is_day_off && <span className="block text-[10px] text-rose-500 font-bold">Hari Libur</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-2xs text-slate-400">Masuk:</span>
                          <Input
                            type="time"
                            aria-label={`Jam masuk ${name}`}
                            value={day.start_time ? String(day.start_time).substring(0, 5) : ''}
                            disabled={day.is_day_off}
                            onChange={(e) => {
                              const updatedDays = [...selectedShift.days];
                              updatedDays[idx].start_time = e.target.value;
                              setSelectedShift({ ...selectedShift, days: updatedDays });
                            }}
                            className="w-28 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-2xs text-slate-400">Pulang:</span>
                          <Input
                            type="time"
                            aria-label={`Jam pulang ${name}`}
                            value={day.end_time ? String(day.end_time).substring(0, 5) : ''}
                            disabled={day.is_day_off}
                            onChange={(e) => {
                              const updatedDays = [...selectedShift.days];
                              updatedDays[idx].end_time = e.target.value;
                              setSelectedShift({ ...selectedShift, days: updatedDays });
                            }}
                            className="w-28 font-mono"
                          />
                        </div>

                        <ToggleSwitch
                          checked={!day.is_day_off}
                          onChange={(checked) => {
                            const updatedDays = [...selectedShift.days];
                            updatedDays[idx].is_day_off = !checked;
                            setSelectedShift({ ...selectedShift, days: updatedDays });
                          }}
                          label=""
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: MESIN FINGERPRINT & BIOMETRIK */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-900 to-indigo-900 text-white p-6 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Fingerprint className="text-primary-300" size={24} />
                <h3 className="text-base font-bold">Terminal Mesin Fingerprint & Biometrik Kampus</h3>
              </div>
              <p className="text-xs text-primary-100/90 max-w-2xl">
                Kelola integrasi perangkat mesin sidik jari dan face terminal (ZKTeco, Solution, dll.) yang terhubung di jaringan LAN kampus. Punch log mesin otomatis disinkronkan ke SIMPEG dengan kalkulasi toleransi shift.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                icon={<RefreshCw size={14} />}
                onClick={fetchDevices}
                disabled={loadingDevices}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loadingDevices && devices.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              Memuat data mesin biometrik...
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <Fingerprint className="mx-auto text-slate-300" size={40} />
              <div className="font-bold text-slate-700 text-sm">Belum Ada Perangkat Mesin Terdaftar</div>
              <p className="text-2xs text-slate-500 max-w-md mx-auto">
                Daftarkan alamat IP dan port terminal mesin presensi di lobi/lab untuk memulai integrasi log kehadiran otomatis.
              </p>
              <Button icon={<Plus size={14} />} onClick={handleOpenCreateDevice}>
                Tambah Mesin Presensi
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white border border-slate-200/90 hover:border-primary-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {dev.device_code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">{dev.device_name}</h4>
                      </div>
                      <Badge
                        variant={dev.last_status === 'online' || dev.last_status === 'synced' ? 'success' : 'danger'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {dev.last_status === 'online' || dev.last_status === 'synced' ? (
                          <span className="flex items-center gap-1">
                            <Wifi size={10} /> Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <WifiOff size={10} /> Offline
                          </span>
                        )}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-2xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IP & Port:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {dev.ip_address}:{dev.port}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Model:</span>
                        <span className="font-semibold text-slate-700">{dev.device_model || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lokasi:</span>
                        <span className="text-slate-700 font-medium truncate max-w-[150px]">{dev.location || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Terakhir Sync:</span>
                        <span className="font-mono text-slate-500">
                          {dev.last_sync_at ? new Date(dev.last_sync_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Belum pernah'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Wifi size={12} />}
                      onClick={() => handleTestDevice(dev.id)}
                      disabled={testingDeviceId === dev.id}
                      className="text-xs"
                    >
                      {testingDeviceId === dev.id ? 'Memeriksa...' : 'Uji Koneksi'}
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Edit2 size={12} />}
                        onClick={() => handleOpenEditDevice(dev)}
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 size={12} />}
                        onClick={() => handleDeleteDevice(dev)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: PARAMETER SISTEM */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-6 max-w-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-700">
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Konfigurasi Validasi & Toleransi Absensi</h3>
              <p className="text-2xs text-slate-500">Nilai parameter ini menjadi acuan server saat memproses presensi dari HP</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Ambang Batas Skor Kemiripan Wajah (Face Recognition Score) *"
              type="number"
              step="0.01"
              min="0.1"
              max="1.0"
              hint="Rekomendasi model InsightFace / Facenet: 0.80 (rentang 0.00 s/d 1.00). Nilai lebih tinggi menuntut kecocokan lebih presisi."
              value={systemParams.face_score_threshold}
              onChange={(e) => setSystemParams({ ...systemParams, face_score_threshold: parseFloat(e.target.value) || 0.80 })}
            />

            <Input
              label="Batas Toleransi Akurasi GPS (Maksimal Meter) *"
              type="number"
              step="1"
              min="5"
              max="500"
              hint="Maksimal ketidakpastian GPS HP (default 50.0 meter). Presensi ditolak jika sinyal GPS lemah melebihi batas ini."
              value={systemParams.gps_accuracy_threshold_meters}
              onChange={(e) => setSystemParams({ ...systemParams, gps_accuracy_threshold_meters: parseFloat(e.target.value) || 50.0 })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Toleransi Keterlambatan (Menit) *"
                type="number"
                min="0"
                max="120"
                hint="Presensi masuk dalam toleransi tetap dihitung Tepat Waktu."
                value={systemParams.late_tolerance_minutes}
                onChange={(e) => setSystemParams({ ...systemParams, late_tolerance_minutes: parseInt(e.target.value) || 0 })}
              />

              <Input
                label="Toleransi Pulang Cepat (Menit) *"
                type="number"
                min="0"
                max="120"
                value={systemParams.early_leave_tolerance_minutes}
                onChange={(e) => setSystemParams({ ...systemParams, early_leave_tolerance_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>

            <Input
              label="Batas Buka Absen Masuk Lebih Awal (Menit Sebelum Jam Shift) *"
              type="number"
              min="0"
              max="240"
              hint="Contoh: 60 menit artinya jika shift jam 08:00, pegawai baru bisa absen mulai jam 07:00."
              value={systemParams.max_early_clock_in_minutes}
              onChange={(e) => setSystemParams({ ...systemParams, max_early_clock_in_minutes: parseInt(e.target.value) || 60 })}
            />

            <div className="pt-2">
              <ToggleSwitch
                checked={systemParams.applies_national_holidays}
                onChange={(checked) => setSystemParams({ ...systemParams, applies_national_holidays: checked })}
                label="Otomatis Terapkan Libur Nasional"
                description="Menonaktifkan kewajiban presensi pada tanggal merah dan cuti bersama resmi pemerintah."
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" icon={<Save size={16} />} loading={savingSettings} disabled={savingSettings}>
                Simpan Perubahan Parameter
              </Button>
            </div>
          )}
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: KALENDER LIBUR & TANGGAL MERAH */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'holiday' && (
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-700">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Kalender Libur & Tanggal Merah</h3>
                <p className="text-2xs text-slate-500">
                  Daftar libur nasional, cuti bersama, dan libur khusus kampus. Tambah manual atau tarik otomatis via Sync API Nasional.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                aria-label="Filter tahun kalender libur"
                value={holidayYear}
                onChange={(e) => setHolidayYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-28"
              />
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={13} />}
                onClick={() => fetchHolidays(holidayYear)}
                disabled={loadingHolidays}
              >
                Muat Ulang
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RefreshCw size={13} />}
                  loading={syncingHolidays}
                  disabled={syncingHolidays}
                  onClick={handleSyncHolidays}
                  title="Tarik daftar libur nasional & cuti bersama dari API publik Indonesia"
                >
                  Sync API Nasional
                </Button>
              )}
            </div>
          </div>

          {loadingHolidays ? (
            <div className="text-xs text-slate-500 py-4 text-center">Memuat tanggal libur {holidayYear}...</div>
          ) : holidays.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              Belum ada tanggal libur untuk tahun {holidayYear}. Klik Tambah Libur untuk menambahkan tanggal merah / cuti bersama.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {holidays.map((h: any) => (
                <div key={h.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[64px]">
                      <div className="text-sm font-extrabold text-slate-900">{(h.holiday_date || '').substring(8, 10)}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {new Date(h.holiday_date).toLocaleDateString('id-ID', { month: 'short' })}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{h.name}</div>
                      <div className="text-2xs text-slate-500 font-mono">
                        {new Date(h.holiday_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={h.is_mass_leave ? 'warning' : 'danger'} className="text-[10px]">
                      {h.is_mass_leave ? 'Cuti Bersama' : 'Libur Nasional'}
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="outline" icon={<Edit2 size={13} />} onClick={() => handleOpenEditHoliday(h)}>
                          Ubah
                        </Button>
                        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => handleDeleteHoliday(h)} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {/* MODAL TAMBAH/UBAH TIPE SHIFT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={editingShift ? 'Ubah Tipe Shift' : 'Tambah Tipe Shift Baru'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowShiftModal(false)} disabled={savingShiftForm}>
              Batal
            </Button>
            <Button type="submit" loading={savingShiftForm} disabled={savingShiftForm} form="shift-form">
              Simpan Tipe Shift
            </Button>
          </>
        }
      >
        <form id="shift-form" onSubmit={handleSubmitShift(onSubmitShiftForm)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Tipe Shift"
                placeholder="Contoh: Shift Pagi Satpam / Shift Malam Operasional"
                required
                error={shiftErrors.name?.message}
                {...registerShift('name')}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Deskripsi"
                placeholder="Contoh: Jam kerja 06:00 s/d 14:00 (Senin - Sabtu)"
                hint="Opsional — penjelasan pola jam kerja tipe ini."
                error={shiftErrors.description?.message}
                {...registerShift('description')}
              />
            </div>
            <Input
              label="Toleransi Terlambat (menit)"
              type="number"
              min={0}
              max={120}
              required
              error={shiftErrors.late_tolerance_minutes?.message}
              {...registerShift('late_tolerance_minutes')}
            />
            <Input
              label="Toleransi Pulang Cepat (menit)"
              type="number"
              min={0}
              max={120}
              required
              error={shiftErrors.early_leave_tolerance_minutes?.message}
              {...registerShift('early_leave_tolerance_minutes')}
            />
            <div className="md:col-span-2">
              <Input
                label="Batas Buka Absen Lebih Awal (menit)"
                type="number"
                min={0}
                max={240}
                required
                hint="Contoh: 60 berarti shift jam 08:00 sudah bisa absen sejak 07:00."
                error={shiftErrors.max_early_clock_in_minutes?.message}
                {...registerShift('max_early_clock_in_minutes')}
              />
            </div>
          </div>
          <Controller
            control={controlShift}
            name="applies_national_holidays"
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={field.onChange}
                label="Berlaku Libur Nasional"
                description="Nonaktifkan untuk shift khusus (satpam/operasional) yang tetap wajib masuk saat tanggal merah."
              />
            )}
          />
          <Controller
            control={controlShift}
            name="is_active"
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={field.onChange}
                label="Status Shift Aktif"
                description="Jika dinonaktifkan, tipe shift tidak bisa dipilih untuk pegawai baru."
              />
            )}
          />
          {!editingShift && (
            <p className="text-[11px] text-slate-500">
              Setelah disimpan, atur jam masuk/pulang per hari (Senin s/d Minggu) pada panel Jadwal Harian.
            </p>
          )}
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL TAMBAH/EDIT LOKASI KANTOR */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showOfficeModal}
        onClose={() => setShowOfficeModal(false)}
        title={editingOffice ? 'Ubah Lokasi Kantor' : 'Tambah Lokasi Kantor Baru'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowOfficeModal(false)} disabled={savingOffice}>
              Batal
            </Button>
            <Button type="submit" loading={savingOffice} disabled={savingOffice} form="office-form">
              Simpan Lokasi
            </Button>
          </>
        }
      >
        <form id="office-form" onSubmit={handleSaveOffice} className="space-y-4">
          <Input
            label="Nama Kantor / Gedung *"
            placeholder="Contoh: Politeknik Indonusa Surakarta"
            required
            value={officeForm.name}
            onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
          />

          <Input
            label="Alamat Lengkap"
            placeholder="Contoh: Jl. KH Samanhudi No.84, Surakarta"
            value={officeForm.address}
            onChange={(e) => setOfficeForm({ ...officeForm, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude *"
              type="number"
              step="0.0000001"
              required
              value={officeForm.latitude}
              onChange={(e) => setOfficeForm({ ...officeForm, latitude: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Longitude *"
              type="number"
              step="0.0000001"
              required
              value={officeForm.longitude}
              onChange={(e) => setOfficeForm({ ...officeForm, longitude: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="Radius Geofence Maksimal (Meter) *"
            type="number"
            min="10"
            max="5000"
            required
            hint="Pegawai hanya dapat absen jika jarak perangkat ke titik koordinat berada dalam batas radius ini."
            value={officeForm.radius_meters}
            onChange={(e) => setOfficeForm({ ...officeForm, radius_meters: parseInt(e.target.value) || 150 })}
          />

          <ToggleSwitch
            checked={officeForm.is_active}
            onChange={(checked) => setOfficeForm({ ...officeForm, is_active: checked })}
            label="Status Lokasi Aktif"
            description="Jika dinonaktifkan, pegawai tidak dapat melakukan presensi di lokasi ini."
          />
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL TAMBAH/EDIT TANGGAL LIBUR */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title={editingHoliday ? 'Ubah Tanggal Libur' : 'Tambah Tanggal Libur'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowHolidayModal(false)} disabled={savingHoliday}>
              Batal
            </Button>
            <Button type="submit" loading={savingHoliday} disabled={savingHoliday} form="holiday-form">
              Simpan Libur
            </Button>
          </>
        }
      >
        <form id="holiday-form" onSubmit={handleSaveHoliday} className="space-y-4">
          <Input
            label="Tanggal Libur *"
            type="date"
            required
            value={holidayForm.holiday_date}
            onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
          />
          <Input
            label="Nama Libur *"
            placeholder="Contoh: Hari Kemerdekaan RI / Cuti Bersama Lebaran"
            required
            value={holidayForm.name}
            onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
          />
          <ToggleSwitch
            checked={holidayForm.is_mass_leave}
            onChange={(checked) => setHolidayForm({ ...holidayForm, is_mass_leave: checked })}
            label="Cuti Bersama?"
            description="Aktifkan bila ini cuti bersama, matikan bila libur nasional / tanggal merah."
          />
          <Input
            label="Keterangan (opsional)"
            placeholder="Contoh: SKB 3 Menteri"
            value={holidayForm.description}
            onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
          />
        </form>
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
                label="Pegawai *"
                placeholder="Ketik nama atau NIP pegawai..."
                loadOptions={loadPegawaiOptions}
                value={field.value ? Number(field.value) : undefined}
                onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : 0)}
                error={keteranganErrors.pegawai_id?.message}
                defaultOptions
              />
            )}
          />
          <Input
            label="Tanggal *"
            type="date"
            required
            max={new Date().toISOString().substring(0, 10)}
            error={keteranganErrors.tanggal?.message}
            {...registerKeterangan('tanggal')}
          />
          <Controller
            control={controlKeterangan}
            name="status_kehadiran"
            render={({ field }) => (
              <Select
                label="Keterangan *"
                options={KETERANGAN_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={keteranganErrors.status_kehadiran?.message}
              />
            )}
          />
          <Input
            label="Catatan (opsional)"
            placeholder="Contoh: Surat dokter / Surat tugas dinas"
            error={keteranganErrors.catatan?.message}
            {...registerKeterangan('catatan')}
          />
        </form>
      </Modal>

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
                variant="primary"
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
      {/* MODAL TAMBAH/UBAH MESIN PRESENSI */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title={editingDevice ? 'Ubah Data Mesin Presensi' : 'Tambah Mesin Presensi Baru'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeviceModal(false)} disabled={savingDevice}>
              Batal
            </Button>
            <Button onClick={handleSaveDevice} loading={savingDevice} disabled={savingDevice}>
              {editingDevice ? 'Simpan Perubahan' : 'Tambah Mesin'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveDevice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Mesin Presensi *"
                placeholder="Contoh: Terminal Fingerprint Rektorat Lt. 1"
                required
                value={deviceForm.device_name}
                onChange={(e) => setDeviceForm({ ...deviceForm, device_name: e.target.value })}
              />
            </div>

            <Input
              label="Kode Perangkat Mesin *"
              placeholder="Contoh: FP-UTAMA-REKTORAT"
              required
              value={deviceForm.device_code}
              onChange={(e) => setDeviceForm({ ...deviceForm, device_code: e.target.value })}
            />

            <Input
              label="Alamat IP (LAN) *"
              placeholder="Contoh: 192.168.1.201"
              required
              value={deviceForm.ip_address}
              onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
            />

            <Input
              label="Port TCP *"
              type="number"
              required
              value={deviceForm.port}
              onChange={(e) => setDeviceForm({ ...deviceForm, port: parseInt(e.target.value) || 4370 })}
            />

            <Input
              label="Model / Merk Mesin"
              placeholder="Contoh: ZKTeco ProCapture-X / Solution X105"
              value={deviceForm.device_model}
              onChange={(e) => setDeviceForm({ ...deviceForm, device_model: e.target.value })}
            />

            <div className="md:col-span-2">
              <Input
                label="Lokasi Pemasangan"
                placeholder="Contoh: Lobi Gedung Rektorat Sayap Timur"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
              />
            </div>

            {offices.length > 0 && (
              <div className="md:col-span-2">
                <Select
                  label="Asosiasi Lokasi Kantor (Geofence)"
                  value={deviceForm.office_location_id ? String(deviceForm.office_location_id) : ''}
                  onChange={(val) => setDeviceForm({ ...deviceForm, office_location_id: val ? Number(val) : undefined })}
                  options={[
                    { value: '', label: '-- Pilih Lokasi Kantor --' },
                    ...offices.map((o) => ({ value: String(o.id), label: o.name })),
                  ]}
                />
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-800">Status Aktif Mesin</span>
                <p className="text-2xs text-slate-500">Perangkat aktif akan dipindai secara berkala</p>
              </div>
              <ToggleSwitch
                checked={deviceForm.is_active}
                onChange={(checked) => setDeviceForm({ ...deviceForm, is_active: checked })}
                label=""
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL SINKRONISASI LOG MESIN MANUAL / PUSH PUNCH LOG */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Simulasi / Push Log Mesin Fingerprint"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSyncModal(false)} disabled={savingSync}>
              Tutup
            </Button>
            <Button onClick={handlePushSyncLogs} loading={savingSync} disabled={savingSync}>
              Sinkronkan Sekarang
            </Button>
          </>
        }
      >
        <form onSubmit={handlePushSyncLogs} className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2">
            <Fingerprint className="text-sky-600 mt-0.5 shrink-0" size={16} />
            <p className="text-2xs">
              Uji coba sinkronisasi data punch log dari mesin terminal biometrik. Sistem akan otomatis mencocokkan NIP, jadwal shift, dan mendeteksi keterlambatan.
            </p>
          </div>

          <Select
            label="Pilih Mesin Fingerprint"
            value={syncForm.device_code}
            onChange={(val) => setSyncForm({ ...syncForm, device_code: val })}
            options={[
              { value: '', label: '-- Pilih Mesin --' },
              ...devices.map((d) => ({ value: d.device_code, label: `${d.device_name} (${d.device_code})` })),
            ]}
          />

          <Input
            label="NIP / PIN Pegawai *"
            placeholder="Contoh: 198501152010121001 atau TENDIK-001"
            required
            value={syncForm.nip}
            onChange={(e) => setSyncForm({ ...syncForm, nip: e.target.value })}
          />

          <Input
            label="Waktu Punch (Tanggal & Jam) *"
            placeholder="YYYY-MM-DD HH:mm:ss"
            required
            value={syncForm.timestamp}
            onChange={(e) => setSyncForm({ ...syncForm, timestamp: e.target.value })}
          />

          <Select
            label="Mode Absensi (In/Out)"
            value={String(syncForm.in_out_mode)}
            onChange={(val) => setSyncForm({ ...syncForm, in_out_mode: Number(val) })}
            options={[
              { value: '0', label: 'Clock In (Masuk)' },
              { value: '1', label: 'Clock Out (Pulang)' },
            ]}
          />
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL PENUGASAN SHIFT MASSAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showBulkShiftModal}
        onClose={() => setShowBulkShiftModal(false)}
        title="Penugasan Shift Kerja Secara Massal"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowBulkShiftModal(false)} disabled={savingBulkShift}>
              Batal
            </Button>
            <Button onClick={handleSaveBulkShift} loading={savingBulkShift} disabled={savingBulkShift}>
              Tugaskan Sekarang
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBulkShift} className="space-y-4">
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-900 flex items-start gap-2">
            <Users className="text-primary-600 mt-0.5 shrink-0" size={16} />
            <p className="text-2xs">
              Terapkan template shift ke seluruh pegawai dalam satu unit kerja atau kategori sekaligus tanpa perlu mengedit profil satu per satu.
            </p>
          </div>

          <Select
            label="Template Shift Target *"
            value={bulkShiftForm.shift_template_id ? String(bulkShiftForm.shift_template_id) : ''}
            onChange={(val) => setBulkShiftForm({ ...bulkShiftForm, shift_template_id: Number(val) })}
            options={[
              { value: '', label: '-- Pilih Tipe Shift --' },
              ...shifts.map((s) => ({ value: String(s.id), label: `${s.name} (Toleransi: ${s.late_tolerance_minutes}m)` })),
            ]}
          />

          <Select
            label="Filter Unit Kerja (Opsional)"
            value={bulkShiftForm.unit_kerja_id ? String(bulkShiftForm.unit_kerja_id) : ''}
            onChange={(val) => setBulkShiftForm({ ...bulkShiftForm, unit_kerja_id: val ? Number(val) : 0 })}
            options={[
              { value: '', label: '-- Seluruh Unit Kerja Kampus --' },
              ...unitKerjaOptions.map((u) => ({ value: String(u.value), label: u.label })),
            ]}
          />

          <Select
            label="Filter Kategori Pegawai (Opsional)"
            value={bulkShiftForm.jenis_pegawai}
            onChange={(val) => setBulkShiftForm({ ...bulkShiftForm, jenis_pegawai: val as any })}
            options={[
              { value: '', label: '-- Semua Pegawai (Dosen & Tendik) --' },
              { value: 'dosen', label: 'Khusus Dosen' },
              { value: 'tendik', label: 'Khusus Tenaga Kependidikan (Tendik)' },
            ]}
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
