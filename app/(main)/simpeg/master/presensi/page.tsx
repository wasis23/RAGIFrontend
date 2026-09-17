'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  CalendarRange,
  SlidersHorizontal,
  Fingerprint,
  Calendar,
  Clock,
  Plus,
  Save,
  Trash2,
  Edit2,
  RefreshCw,
  Copy,
  Users,
  Wifi,
  WifiOff,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { FingerprintDevice } from '@/types/simpeg.types';

// ── ZOD SCHEMAS ─────────────────────────────────────────────

const shiftFormSchema = z.object({
  name: z.string().min(3, 'Nama tipe shift minimal 3 karakter').max(255, 'Nama tipe shift maksimal 255 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().nullable(),
  late_tolerance_minutes: z.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  early_leave_tolerance_minutes: z.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  max_early_clock_in_minutes: z.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(240, 'Maksimal 240 menit'),
  applies_national_holidays: z.boolean(),
  is_active: z.boolean(),
});
type ShiftFormValues = z.infer<typeof shiftFormSchema>;

const deviceFormSchema = z.object({
  device_name: z.string().min(3, 'Nama mesin minimal 3 karakter'),
  device_code: z.string().min(2, 'Kode mesin minimal 2 karakter'),
  ip_address: z.string().min(7, 'Alamat IP wajib diisi'),
  port: z.number().int('Port harus angka').min(1, 'Port minimal 1').max(65535, 'Port maksimal 65535'),
  device_model: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  office_location_id: z.number().optional().nullable(),
  is_active: z.boolean(),
});
type DeviceFormValues = z.infer<typeof deviceFormSchema>;

const officeFormSchema = z.object({
  name: z.string().min(3, 'Nama lokasi kantor minimal 3 karakter'),
  address: z.string().optional().nullable(),
  latitude: z.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
  longitude: z.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
  radius_meters: z.number().int().min(10, 'Radius minimal 10 meter').max(5000, 'Radius maksimal 5000 meter'),
  is_active: z.boolean(),
});
type OfficeFormValues = z.infer<typeof officeFormSchema>;

const holidayFormSchema = z.object({
  holiday_date: z.string().min(10, 'Tanggal libur wajib diisi'),
  name: z.string().min(3, 'Nama hari libur minimal 3 karakter'),
  is_mass_leave: z.boolean(),
  description: z.string().optional().nullable(),
});
type HolidayFormValues = z.infer<typeof holidayFormSchema>;

const bulkShiftSchema = z.object({
  shift_template_id: z.number().min(1, 'Pilih template shift target'),
  unit_kerja_id: z.number().optional().nullable(),
  jenis_pegawai: z.string().optional().nullable(),
});
type BulkShiftFormValues = z.infer<typeof bulkShiftSchema>;

const syncLogSchema = z.object({
  device_code: z.string().min(1, 'Pilih mesin fingerprint'),
  nip: z.string().min(1, 'NIP / PIN pegawai wajib diisi'),
  timestamp: z.string().min(1, 'Waktu punch wajib diisi'),
  in_out_mode: z.number(),
});
type SyncLogFormValues = z.infer<typeof syncLogSchema>;

const systemSettingsSchema = z.object({
  face_score_threshold: z.number().min(0.1, 'Minimal 0.1').max(1.0, 'Maksimal 1.0'),
  gps_accuracy_threshold_meters: z.number().min(5, 'Minimal 5 meter').max(500, 'Maksimal 500 meter'),
  late_tolerance_minutes: z.number().min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  early_leave_tolerance_minutes: z.number().min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  max_early_clock_in_minutes: z.number().min(0, 'Minimal 0 menit').max(240, 'Maksimal 240 menit'),
  applies_national_holidays: z.boolean(),
});
type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

export default function MasterPresensiPage() {
  const router = useRouter();
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('simpeg.presensi.manage') || hasPermission('simpeg.master.manage');

  // Active Tab: 'shift' | 'devices' | 'office' | 'holiday' | 'settings'
  const [activeTab, setActiveTab] = useState<'shift' | 'devices' | 'office' | 'holiday' | 'settings'>('shift');

  // Dialog Konfirmasi Hapus
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: async () => {},
  });

  // ── TAB 1: SHIFT & JADWAL KERJA STATE ─────────────────────
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [searchShift, setSearchShift] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  // Modal Atur Jadwal Harian (Senin - Minggu)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedShiftForSchedule, setSelectedShiftForSchedule] = useState<any | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Modal Penugasan Shift Massal
  const [showBulkShiftModal, setShowBulkShiftModal] = useState(false);
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<{ value: number; label: string }[]>([]);

  // ── TAB 2: MESIN PRESENSI STATE ───────────────────────────
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devices, setDevices] = useState<FingerprintDevice[]>([]);
  const [searchDevice, setSearchDevice] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FingerprintDevice | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<number | null>(null);

  // Modal Simulasi Log Sync
  const [showSyncModal, setShowSyncModal] = useState(false);

  // ── TAB 3: LOKASI KANTOR (GEOFENCING) STATE ───────────────
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [searchOffice, setSearchOffice] = useState('');
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any | null>(null);

  // ── TAB 4: KALENDER LIBUR STATE ───────────────────────────
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [syncingHolidays, setSyncingHolidays] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [searchHoliday, setSearchHoliday] = useState('');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);

  // ── TAB 5: PARAMETER SISTEM STATE ─────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── FORMS (ALL ZOD VALIDATED) ─────────────────────────────
  const formShift = useForm<ShiftFormValues>({
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

  const formDevice = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      device_name: '',
      device_code: '',
      ip_address: '192.168.1.201',
      port: 4370,
      location: '',
      device_model: 'ZKTeco ProCapture-X',
      office_location_id: undefined,
      is_active: true,
    },
  });

  const formOffice = useForm<OfficeFormValues>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {
      name: '',
      address: '',
      latitude: -7.5675,
      longitude: 110.8036,
      radius_meters: 150,
      is_active: true,
    },
  });

  const formHoliday = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      holiday_date: '',
      name: '',
      is_mass_leave: false,
      description: '',
    },
  });

  const formBulkShift = useForm<BulkShiftFormValues>({
    resolver: zodResolver(bulkShiftSchema),
    defaultValues: {
      shift_template_id: 0,
      unit_kerja_id: 0,
      jenis_pegawai: '',
    },
  });

  const formSyncLog = useForm<SyncLogFormValues>({
    resolver: zodResolver(syncLogSchema),
    defaultValues: {
      device_code: '',
      nip: '',
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ') + ':00',
      in_out_mode: 0,
    },
  });

  const formSettings = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      face_score_threshold: 0.80,
      gps_accuracy_threshold_meters: 50.0,
      late_tolerance_minutes: 15,
      early_leave_tolerance_minutes: 15,
      max_early_clock_in_minutes: 60,
      applies_national_holidays: true,
    },
  });

  // ── FETCH HANDLERS ─────────────────────────────────────────

  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await simpegService.getShiftTemplates();
      if (res.status === 'success') {
        setShifts(res.data || []);
      }
    } catch {
      toast.error('Gagal memuat jadwal shift kerja');
    } finally {
      setLoadingShifts(false);
    }
  }, []);

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

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await simpegService.getPresensiSettings();
      if (res.status === 'success' && res.data) {
        formSettings.reset({
          face_score_threshold: res.data.face_score_threshold ?? 0.80,
          gps_accuracy_threshold_meters: res.data.gps_accuracy_threshold_meters ?? 50.0,
          late_tolerance_minutes: res.data.late_tolerance_minutes ?? 15,
          early_leave_tolerance_minutes: res.data.early_leave_tolerance_minutes ?? 15,
          max_early_clock_in_minutes: res.data.max_early_clock_in_minutes ?? 60,
          applies_national_holidays: !!res.data.applies_national_holidays,
        });
      }
    } catch {
      toast.error('Gagal memuat parameter sistem presensi');
    } finally {
      setLoadingSettings(false);
    }
  }, [formSettings]);

  useEffect(() => {
    if (activeTab === 'shift') fetchShifts();
    else if (activeTab === 'devices') {
      fetchDevices();
      if (offices.length === 0) fetchOffices();
    } else if (activeTab === 'office') fetchOffices();
    else if (activeTab === 'holiday') fetchHolidays(holidayYear);
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchShifts, fetchDevices, fetchOffices, fetchHolidays, holidayYear, fetchSettings, offices.length]);

  // ── ACTION HANDLERS: TAB 1 (SHIFT) ─────────────────────────

  const handleOpenCreateShift = () => {
    setEditingShift(null);
    formShift.reset({
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
    formShift.reset({
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
        await simpegService.createShiftTemplate(values);
        toast.success('Tipe shift baru berhasil ditambahkan');
      }
      setShowShiftModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tipe shift');
    }
  };

  const handleDeleteShift = (s: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Tipe Shift',
      message: `Apakah Anda yakin ingin menghapus tipe shift "${s.name}"? Seluruh jadwal 7 hari di dalamnya ikut terhapus.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteShiftTemplate(s.id);
          toast.success('Tipe shift berhasil dihapus');
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
      await simpegService.createShiftTemplate({
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
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menduplikat tipe shift');
    }
  };

  const handleOpenScheduleModal = (s: any) => {
    setSelectedShiftForSchedule(JSON.parse(JSON.stringify(s)));
    setShowScheduleModal(true);
  };

  const handleSaveShiftSchedule = async () => {
    if (!selectedShiftForSchedule) return;
    setSavingSchedule(true);
    try {
      await simpegService.updateShiftTemplate(selectedShiftForSchedule.id, {
        name: selectedShiftForSchedule.name,
        description: selectedShiftForSchedule.description,
        late_tolerance_minutes: selectedShiftForSchedule.late_tolerance_minutes,
        early_leave_tolerance_minutes: selectedShiftForSchedule.early_leave_tolerance_minutes,
        max_early_clock_in_minutes: selectedShiftForSchedule.max_early_clock_in_minutes,
        applies_national_holidays: selectedShiftForSchedule.applies_national_holidays ?? true,
        is_active: selectedShiftForSchedule.is_active,
        days: selectedShiftForSchedule.days,
      });
      toast.success('Jadwal 7 hari berhasil disimpan');
      setShowScheduleModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan jadwal shift');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenBulkModal = async () => {
    if (shifts.length === 0) await fetchShifts();
    formBulkShift.reset({
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

  const onSubmitBulkShift = async (values: BulkShiftFormValues) => {
    try {
      const res = await simpegService.assignShiftBulk({
        shift_template_id: Number(values.shift_template_id),
        unit_kerja_id: values.unit_kerja_id ? Number(values.unit_kerja_id) : undefined,
        jenis_pegawai: (values.jenis_pegawai as 'dosen' | 'tendik') || undefined,
      });
      toast.success(res.message || 'Penugasan shift massal berhasil');
      setShowBulkShiftModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menugaskan shift massal');
    }
  };

  // ── ACTION HANDLERS: TAB 2 (DEVICES) ───────────────────────

  const handleOpenCreateDevice = () => {
    setEditingDevice(null);
    formDevice.reset({
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
    formDevice.reset({
      device_name: dev.device_name,
      device_code: dev.device_code,
      ip_address: dev.ip_address,
      port: dev.port,
      location: dev.location || '',
      device_model: dev.device_model || 'ZKTeco ProCapture-X',
      office_location_id: dev.office_location_id,
      is_active: dev.is_active,
    });
    setShowDeviceModal(true);
  };

  const onSubmitDevice = async (values: DeviceFormValues) => {
    try {
      if (editingDevice) {
        await simpegService.updateFingerprintDevice(editingDevice.id, values);
        toast.success('Data mesin presensi berhasil diperbarui');
      } else {
        await simpegService.createFingerprintDevice(values);
        toast.success('Mesin presensi baru berhasil didaftarkan');
      }
      setShowDeviceModal(false);
      fetchDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data mesin presensi');
    }
  };

  const handleDeleteDevice = (dev: FingerprintDevice) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Mesin Presensi',
      message: `Apakah Anda yakin ingin menghapus mesin "${dev.device_name}" (${dev.device_code})?`,
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

  const handleOpenSyncModal = (dev?: FingerprintDevice) => {
    formSyncLog.reset({
      device_code: dev?.device_code || devices[0]?.device_code || '',
      nip: '',
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ') + ':00',
      in_out_mode: 0,
    });
    setShowSyncModal(true);
  };

  const onSubmitSyncLog = async (values: SyncLogFormValues) => {
    try {
      const res = await simpegService.syncFingerprintLogs({
        device_code: values.device_code,
        logs: [
          {
            pin: values.nip,
            timestamp: values.timestamp,
            in_out_mode: Number(values.in_out_mode),
            verify_mode: 1,
          },
        ],
      });
      toast.success(res.message || 'Log mesin presensi berhasil disinkronisasi');
      setShowSyncModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi log mesin');
    }
  };

  // ── ACTION HANDLERS: TAB 3 (OFFICES) ───────────────────────

  const handleOpenCreateOffice = () => {
    setEditingOffice(null);
    formOffice.reset({
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
    formOffice.reset({
      name: office.name,
      address: office.address || '',
      latitude: office.latitude,
      longitude: office.longitude,
      radius_meters: office.radius_meters,
      is_active: office.is_active,
    });
    setShowOfficeModal(true);
  };

  const onSubmitOffice = async (values: OfficeFormValues) => {
    try {
      if (editingOffice) {
        await simpegService.updateOfficeLocation(editingOffice.id, values);
        toast.success('Lokasi kantor berhasil diperbarui');
      } else {
        await simpegService.createOfficeLocation(values);
        toast.success('Lokasi kantor baru berhasil ditambahkan');
      }
      setShowOfficeModal(false);
      fetchOffices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan lokasi kantor');
    }
  };

  const handleDeleteOffice = (office: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Lokasi Kantor',
      message: `Apakah Anda yakin ingin menghapus lokasi kantor "${office.name}"?`,
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

  // ── ACTION HANDLERS: TAB 4 (HOLIDAYS) ──────────────────────

  const handleOpenCreateHoliday = () => {
    setEditingHoliday(null);
    formHoliday.reset({
      holiday_date: `${holidayYear}-01-01`,
      name: '',
      is_mass_leave: false,
      description: '',
    });
    setShowHolidayModal(true);
  };

  const handleOpenEditHoliday = (h: any) => {
    setEditingHoliday(h);
    formHoliday.reset({
      holiday_date: (h.holiday_date || '').substring(0, 10),
      name: h.name || '',
      is_mass_leave: !!h.is_mass_leave,
      description: h.description || '',
    });
    setShowHolidayModal(true);
  };

  const onSubmitHoliday = async (values: HolidayFormValues) => {
    try {
      if (editingHoliday) {
        await simpegService.updateNationalHoliday(editingHoliday.id, values);
        toast.success('Tanggal libur berhasil diperbarui');
      } else {
        await simpegService.createNationalHoliday(values);
        toast.success('Tanggal libur berhasil ditambahkan');
      }
      setShowHolidayModal(false);
      fetchHolidays(holidayYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tanggal libur');
    }
  };

  const handleDeleteHoliday = (h: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Tanggal Libur',
      message: `Apakah Anda yakin ingin menghapus hari libur "${h.name}" (${h.holiday_date})?`,
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

  const handleSyncHolidays = async () => {
    setSyncingHolidays(true);
    try {
      const res = await simpegService.syncNationalHolidays(holidayYear);
      if (res.status === 'success') {
        toast.success(res.message || `Sinkronisasi libur nasional tahun ${holidayYear} berhasil`);
        fetchHolidays(holidayYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi libur nasional');
    } finally {
      setSyncingHolidays(false);
    }
  };

  // ── ACTION HANDLERS: TAB 5 (SETTINGS) ──────────────────────

  const onSubmitSettings = async (values: SystemSettingsValues) => {
    setSavingSettings(true);
    try {
      await simpegService.updatePresensiSettings(values);
      toast.success('Parameter presensi sistem berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan parameter');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── FILTERED DATA LISTS ────────────────────────────────────

  const filteredShifts = useMemo(() => {
    if (!searchShift) return shifts;
    const q = searchShift.toLowerCase();
    return shifts.filter((s: any) =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [shifts, searchShift]);

  const filteredDevices = useMemo(() => {
    if (!searchDevice) return devices;
    const q = searchDevice.toLowerCase();
    return devices.filter((d) =>
      d.device_name?.toLowerCase().includes(q) ||
      d.device_code?.toLowerCase().includes(q) ||
      d.ip_address?.toLowerCase().includes(q) ||
      d.location?.toLowerCase().includes(q)
    );
  }, [devices, searchDevice]);

  const filteredOffices = useMemo(() => {
    if (!searchOffice) return offices;
    const q = searchOffice.toLowerCase();
    return offices.filter((o: any) =>
      o.name?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q)
    );
  }, [offices, searchOffice]);

  const filteredHolidays = useMemo(() => {
    if (!searchHoliday) return holidays;
    const q = searchHoliday.toLowerCase();
    return holidays.filter((h: any) =>
      h.name?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q) ||
      h.holiday_date?.includes(q)
    );
  }, [holidays, searchHoliday]);

  // ── TABLE COLUMNS: SHIFT ───────────────────────────────────

  const columnsShift: ColumnDef<any>[] = [
    {
      key: 'name',
      label: 'Nama Shift & Deskripsi',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-sm">{row.name}</span>
          <span className="text-xs text-slate-500">{row.description || 'Pola jam kerja standar'}</span>
        </div>
      ),
    },
    {
      key: 'toleransi',
      label: 'Toleransi & Batas Waktu',
      render: (row) => (
        <div className="text-xs text-slate-700 space-y-0.5 font-medium">
          <div>Terlambat: <span className="font-bold text-slate-900">{row.late_tolerance_minutes ?? 0} mnt</span></div>
          <div>Pulang cepat: <span className="font-bold text-slate-900">{row.early_leave_tolerance_minutes ?? 0} mnt</span></div>
          <div>Buka absen: <span className="font-bold text-slate-900">{row.max_early_clock_in_minutes ?? 0} mnt</span></div>
        </div>
      ),
    },
    {
      key: 'applies_national_holidays',
      label: 'Libur Nasional',
      render: (row) => (
        <Badge variant={row.applies_national_holidays ? 'blue' : 'gray'}>
          {row.applies_national_holidays ? 'Terapkan Libur' : 'Wajib Masuk'}
        </Badge>
      ),
    },
    {
      key: 'employees_count',
      label: 'Pegawai',
      render: (row) => (
        <span className="font-medium text-slate-700 text-sm">
          {row.employees_count ?? 0} Pegawai
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Atur Jadwal Harian',
                  icon: <CalendarRange size={14} />,
                  onClick: () => handleOpenScheduleModal(row),
                },
                {
                  label: 'Ubah Info Shift',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditShift(row),
                },
                {
                  label: 'Duplikat Shift',
                  icon: <Copy size={14} />,
                  onClick: () => handleDuplicateShift(row),
                },
                {
                  label: 'Hapus Shift',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => handleDeleteShift(row),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: DEVICES ─────────────────────────────────

  const columnsDevice: ColumnDef<FingerprintDevice>[] = [
    {
      key: 'device_code',
      label: 'Kode Mesin',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {row.device_code}
        </span>
      ),
    },
    {
      key: 'device_name',
      label: 'Nama & Model Perangkat',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-sm">{row.device_name}</span>
          <span className="text-xs text-slate-500">Model: {row.device_model || '-'}</span>
        </div>
      ),
    },
    {
      key: 'ip_port',
      label: 'IP & Port LAN',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-700 text-sm">
          {row.ip_address}:{row.port}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Lokasi Terminal',
      render: (row) => (
        <span className="text-sm text-slate-700">{row.location || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status Jaringan',
      render: (row) => (
        <Badge variant={row.last_status === 'online' || row.last_status === 'synced' ? 'green' : 'red'}>
          {row.last_status === 'online' || row.last_status === 'synced' ? (
            <span className="flex items-center gap-1">
              <Wifi size={12} /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <WifiOff size={12} /> Offline
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'last_sync',
      label: 'Terakhir Sinkron',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.last_sync_at ? new Date(row.last_sync_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Belum pernah'}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: testingDeviceId === row.id ? 'Memeriksa Koneksi...' : 'Uji Koneksi Ping',
                  icon: <Wifi size={14} />,
                  disabled: testingDeviceId === row.id,
                  onClick: () => handleTestDevice(row.id),
                },
                {
                  label: 'Simulasi Push Log',
                  icon: <RefreshCw size={14} />,
                  onClick: () => handleOpenSyncModal(row),
                },
                {
                  label: 'Ubah Mesin',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditDevice(row),
                },
                {
                  label: 'Hapus Mesin',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => handleDeleteDevice(row),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: OFFICES ─────────────────────────────────

  const columnsOffice: ColumnDef<any>[] = [
    {
      key: 'name',
      label: 'Nama Kantor / Lokasi',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-sm">{row.name}</span>
          <span className="text-xs text-slate-500">{row.address || 'Alamat belum disetel'}</span>
        </div>
      ),
    },
    {
      key: 'coordinates',
      label: 'Titik Koordinat GPS',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.latitude}, {row.longitude}
        </span>
      ),
    },
    {
      key: 'radius_meters',
      label: 'Radius Geofence',
      render: (row) => (
        <span className="font-semibold text-xs text-slate-800 bg-[var(--module-primary-subtle)] text-[var(--module-primary)] px-2 py-0.5 rounded border border-[var(--module-primary)]/20">
          {row.radius_meters} meter
        </span>
      ),
    },
    {
      key: 'employees_count',
      label: 'Pegawai Terdaftar',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">{row.employees_count || 0} Pegawai</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Ubah Lokasi',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditOffice(row),
                },
                {
                  label: 'Hapus Lokasi',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => handleDeleteOffice(row),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: HOLIDAYS ────────────────────────────────

  const columnsHoliday: ColumnDef<any>[] = [
    {
      key: 'holiday_date',
      label: 'Tanggal Libur',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-center min-w-[50px]">
            <span className="text-sm font-bold text-slate-900 block">{(row.holiday_date || '').substring(8, 10)}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(row.holiday_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">
            {new Date(row.holiday_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nama Hari Libur / Perayaan',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">{row.name}</span>
      ),
    },
    {
      key: 'is_mass_leave',
      label: 'Kategori',
      render: (row) => (
        <Badge variant={row.is_mass_leave ? 'amber' : 'red'}>
          {row.is_mass_leave ? 'Cuti Bersama' : 'Libur Nasional'}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Keterangan',
      render: (row) => (
        <span className="text-xs text-slate-500">{row.description || '-'}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Ubah Hari Libur',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEditHoliday(row),
                },
                {
                  label: 'Hapus Hari Libur',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => handleDeleteHoliday(row),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Pengaturan Presensi"
        description="Konfigurasi template shift kerja, integrasi mesin biometrik LAN, geofencing lokasi kantor, kalender libur, dan toleransi kehadiran"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/presensi')}
            >
              Kembali ke Presensi
            </Button>
            {canManage && activeTab === 'shift' && (
              <>
                <Button
                  variant="outline"
                  icon={<Users size={16} />}
                  onClick={handleOpenBulkModal}
                >
                  Terapkan Shift Massal
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={handleOpenCreateShift}
                >
                  Tambah Tipe Shift
                </Button>
              </>
            )}
            {canManage && activeTab === 'devices' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateDevice}
              >
                Tambah Mesin Presensi
              </Button>
            )}
            {canManage && activeTab === 'office' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateOffice}
              >
                Tambah Lokasi Kantor
              </Button>
            )}
            {canManage && activeTab === 'holiday' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateHoliday}
              >
                Tambah Hari Libur
              </Button>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('shift')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'shift'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Clock size={16} /> Template Shift & Jadwal Kerja
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Fingerprint size={16} /> Mesin Presensi & Biometrik
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('office')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'office'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Building2 size={16} /> Lokasi Kantor (Geofencing)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('holiday')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'holiday'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} /> Kalender Libur & Tanggal Merah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal size={16} /> Parameter Sistem & Toleransi
        </button>
      </div>

      {/* ── TAB 1: TEMPLATE SHIFT & JADWAL KERJA ── */}
      {activeTab === 'shift' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari nama template shift atau deskripsi..."
              value={searchShift}
              onChange={(e) => setSearchShift(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsShift}
            data={filteredShifts}
            isLoading={loadingShifts}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Clock size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada master template shift kerja yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 2: MESIN PRESENSI & BIOMETRIK ── */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari kode mesin, nama perangkat, alamat IP, atau lokasi..."
              value={searchDevice}
              onChange={(e) => setSearchDevice(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsDevice}
            data={filteredDevices}
            isLoading={loadingDevices}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Fingerprint size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada terminal mesin fingerprint yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 3: LOKASI KANTOR (GEOFENCING) ── */}
      {activeTab === 'office' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <Input
              placeholder="Cari nama kantor, gedung, atau alamat..."
              value={searchOffice}
              onChange={(e) => setSearchOffice(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnsOffice}
            data={filteredOffices}
            isLoading={loadingOffices}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Building2 size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada lokasi kantor atau geofence yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 4: KALENDER LIBUR & TANGGAL MERAH ── */}
      {activeTab === 'holiday' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <Input
                  placeholder="Cari nama hari libur atau perayaan..."
                  value={searchHoliday}
                  onChange={(e) => setSearchHoliday(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  type="number"
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button
                  variant="outline"
                  icon={<RefreshCw size={14} />}
                  loading={syncingHolidays}
                  disabled={syncingHolidays}
                  onClick={handleSyncHolidays}
                >
                  Sync API Nasional
                </Button>
              </div>
            </div>
          </div>

          <DataTable
            columns={columnsHoliday}
            data={filteredHolidays}
            isLoading={loadingHolidays}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada tanggal libur untuk tahun {holidayYear}.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 5: PARAMETER SISTEM & TOLERANSI ── */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card p-4 border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={24} className="text-[var(--module-primary)]" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Konfigurasi Validasi & Toleransi Absensi</p>
                <p className="text-xs text-slate-500">Nilai parameter ini menjadi acuan server saat memproses presensi mobile dan mesin biometrik.</p>
              </div>
            </div>
          </div>

          <form onSubmit={formSettings.handleSubmit(onSubmitSettings)} className="card p-6 border border-slate-200 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom 1: Validasi Biometrik Wajah & GPS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Validasi Biometrik Wajah & GPS
                </h4>

                <Input
                  label="Ambang Batas Skor Kemiripan Wajah (Face Recognition)"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  hint="Rekomendasi model InsightFace: 0.80 (rentang 0.00 s/d 1.00)."
                  error={formSettings.formState.errors.face_score_threshold?.message}
                  {...formSettings.register('face_score_threshold', { valueAsNumber: true })}
                />

                <Input
                  label="Batas Toleransi Akurasi GPS (Maksimal Meter)"
                  type="number"
                  step="1"
                  min="5"
                  max="500"
                  hint="Maksimal ketidakpastian sinyal GPS HP pegawai (default 50.0 meter)."
                  error={formSettings.formState.errors.gps_accuracy_threshold_meters?.message}
                  {...formSettings.register('gps_accuracy_threshold_meters', { valueAsNumber: true })}
                />
              </div>

              {/* Kolom 2: Toleransi Waktu & Kalender Libur */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Toleransi Waktu & Kebijakan Libur
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Toleransi Terlambat (Menit)"
                    type="number"
                    min="0"
                    max="120"
                    hint="Dalam toleransi dihitung tepat waktu."
                    error={formSettings.formState.errors.late_tolerance_minutes?.message}
                    {...formSettings.register('late_tolerance_minutes', { valueAsNumber: true })}
                  />

                  <Input
                    label="Toleransi Pulang Cepat (Menit)"
                    type="number"
                    min="0"
                    max="120"
                    hint="Batas toleransi clock-out."
                    error={formSettings.formState.errors.early_leave_tolerance_minutes?.message}
                    {...formSettings.register('early_leave_tolerance_minutes', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Batas Buka Absen Lebih Awal (Menit Sebelum Shift)"
                  type="number"
                  min="0"
                  max="240"
                  hint="Contoh: 60 menit berarti shift jam 08:00 sudah bisa absen sejak 07:00."
                  error={formSettings.formState.errors.max_early_clock_in_minutes?.message}
                  {...formSettings.register('max_early_clock_in_minutes', { valueAsNumber: true })}
                />

                <div className="pt-2">
                  <Controller
                    control={formSettings.control}
                    name="applies_national_holidays"
                    render={({ field }) => (
                      <ToggleSwitch
                        checked={!!field.value}
                        onChange={field.onChange}
                        label="Otomatis Terapkan Libur Nasional"
                        description="Menonaktifkan kewajiban presensi pada tanggal merah dan cuti bersama resmi pemerintah."
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {canManage && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" icon={<Save size={16} />} loading={savingSettings} disabled={savingSettings || loadingSettings}>
                  Simpan Perubahan Parameter
                </Button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── MODAL: TAMBAH / UBAH TIPE SHIFT ── */}
      <Modal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={editingShift ? 'Ubah Tipe Shift' : 'Tambah Tipe Shift Baru'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowShiftModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formShift.formState.isSubmitting} disabled={formShift.formState.isSubmitting} form="shift-form">
              Simpan Tipe Shift
            </Button>
          </>
        }
      >
        <form id="shift-form" onSubmit={formShift.handleSubmit(onSubmitShiftForm)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Tipe Shift"
                placeholder="Contoh: Shift Pagi Satpam / Shift Reguler Tendik"
                required
                error={formShift.formState.errors.name?.message}
                {...formShift.register('name')}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Deskripsi"
                placeholder="Contoh: Pola jam kerja 08:00 s/d 16:00 (Senin - Jumat)"
                error={formShift.formState.errors.description?.message}
                {...formShift.register('description')}
              />
            </div>
            <Input
              label="Toleransi Terlambat (menit)"
              type="number"
              min={0}
              max={120}
              required
              error={formShift.formState.errors.late_tolerance_minutes?.message}
              {...formShift.register('late_tolerance_minutes', { valueAsNumber: true })}
            />
            <Input
              label="Toleransi Pulang Cepat (menit)"
              type="number"
              min={0}
              max={120}
              required
              error={formShift.formState.errors.early_leave_tolerance_minutes?.message}
              {...formShift.register('early_leave_tolerance_minutes', { valueAsNumber: true })}
            />
            <div className="md:col-span-2">
              <Input
                label="Batas Buka Absen Lebih Awal (menit)"
                type="number"
                min={0}
                max={240}
                required
                hint="Contoh: 60 berarti shift jam 08:00 sudah bisa absen sejak 07:00."
                error={formShift.formState.errors.max_early_clock_in_minutes?.message}
                {...formShift.register('max_early_clock_in_minutes', { valueAsNumber: true })}
              />
            </div>
          </div>
          <Controller
            control={formShift.control}
            name="applies_national_holidays"
            render={({ field }) => (
              <ToggleSwitch
                checked={!!field.value}
                onChange={field.onChange}
                label="Berlaku Libur Nasional"
                description="Nonaktifkan untuk shift khusus yang tetap wajib masuk saat tanggal merah."
              />
            )}
          />
          <Controller
            control={formShift.control}
            name="is_active"
            render={({ field }) => (
              <ToggleSwitch
                checked={!!field.value}
                onChange={field.onChange}
                label="Status Shift Aktif"
                description="Jika dinonaktifkan, tipe shift tidak bisa dipilih untuk penugasan baru."
              />
            )}
          />
        </form>
      </Modal>

      {/* ── MODAL: ATUR JADWAL HARIAN (7 HARI) ── */}
      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={`Atur Jadwal Harian: ${selectedShiftForSchedule?.name || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)} disabled={savingSchedule}>
              Batal
            </Button>
            <Button onClick={handleSaveShiftSchedule} loading={savingSchedule} disabled={savingSchedule}>
              Simpan Jadwal Harian
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Atur jam masuk, jam pulang, dan status hari kerja/libur untuk masing-masing hari dari Senin sampai Minggu.
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {selectedShiftForSchedule?.days?.map((day: any, idx: number) => {
              const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              const name = dayNames[day.day_of_week] || `Hari ${day.day_of_week}`;

              return (
                <div key={day.id || idx} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="w-28">
                    <span className="font-bold text-xs text-slate-800">{name}</span>
                    {day.is_day_off && <span className="block text-[10px] text-rose-500 font-bold">Hari Libur</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-xs text-slate-400">Masuk:</span>
                      <Input
                        type="time"
                        aria-label={`Jam masuk ${name}`}
                        value={day.start_time ? String(day.start_time).substring(0, 5) : ''}
                        disabled={day.is_day_off}
                        onChange={(e) => {
                          const updatedDays = [...selectedShiftForSchedule.days];
                          updatedDays[idx].start_time = e.target.value;
                          setSelectedShiftForSchedule({ ...selectedShiftForSchedule, days: updatedDays });
                        }}
                        className="w-28 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-xs text-slate-400">Pulang:</span>
                      <Input
                        type="time"
                        aria-label={`Jam pulang ${name}`}
                        value={day.end_time ? String(day.end_time).substring(0, 5) : ''}
                        disabled={day.is_day_off}
                        onChange={(e) => {
                          const updatedDays = [...selectedShiftForSchedule.days];
                          updatedDays[idx].end_time = e.target.value;
                          setSelectedShiftForSchedule({ ...selectedShiftForSchedule, days: updatedDays });
                        }}
                        className="w-28 font-mono"
                      />
                    </div>

                    <ToggleSwitch
                      checked={!day.is_day_off}
                      onChange={(checked) => {
                        const updatedDays = [...selectedShiftForSchedule.days];
                        updatedDays[idx].is_day_off = !checked;
                        setSelectedShiftForSchedule({ ...selectedShiftForSchedule, days: updatedDays });
                      }}
                      label=""
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ── MODAL: PENUGASAN SHIFT MASSAL ── */}
      <Modal
        open={showBulkShiftModal}
        onClose={() => setShowBulkShiftModal(false)}
        title="Penugasan Shift Kerja Secara Massal"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowBulkShiftModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formBulkShift.formState.isSubmitting} disabled={formBulkShift.formState.isSubmitting} form="bulk-shift-form">
              Tugaskan Sekarang
            </Button>
          </>
        }
      >
        <form id="bulk-shift-form" onSubmit={formBulkShift.handleSubmit(onSubmitBulkShift)} className="space-y-4">
          <div className="p-3 bg-[var(--module-primary-subtle)] border border-[var(--module-primary)]/20 rounded-xl text-xs text-slate-800 flex items-start gap-2">
            <Users className="text-[var(--module-primary)] mt-0.5 shrink-0" size={16} />
            <p className="text-xs">
              Terapkan template shift ke seluruh pegawai dalam satu unit kerja atau kategori sekaligus secara otomatis.
            </p>
          </div>

          <Controller
            control={formBulkShift.control}
            name="shift_template_id"
            render={({ field }) => (
              <Select
                label="Template Shift Target *"
                value={field.value ? String(field.value) : ''}
                onChange={(val) => field.onChange(Number(val))}
                error={formBulkShift.formState.errors.shift_template_id?.message}
                options={[
                  { value: '', label: '-- Pilih Tipe Shift --' },
                  ...shifts.map((s) => ({ value: String(s.id), label: `${s.name} (Toleransi: ${s.late_tolerance_minutes}m)` })),
                ]}
              />
            )}
          />

          <Controller
            control={formBulkShift.control}
            name="unit_kerja_id"
            render={({ field }) => (
              <Select
                label="Filter Unit Kerja (Opsional)"
                value={field.value ? String(field.value) : ''}
                onChange={(val) => field.onChange(val ? Number(val) : 0)}
                options={[
                  { value: '', label: '-- Seluruh Unit Kerja Kampus --' },
                  ...unitKerjaOptions.map((u) => ({ value: String(u.value), label: u.label })),
                ]}
              />
            )}
          />

          <Controller
            control={formBulkShift.control}
            name="jenis_pegawai"
            render={({ field }) => (
              <Select
                label="Filter Kategori Pegawai (Opsional)"
                value={field.value || ''}
                onChange={(val) => field.onChange(val)}
                options={[
                  { value: '', label: '-- Semua Pegawai (Dosen & Tendik) --' },
                  { value: 'dosen', label: 'Khusus Dosen' },
                  { value: 'tendik', label: 'Khusus Tenaga Kependidikan (Tendik)' },
                ]}
              />
            )}
          />
        </form>
      </Modal>

      {/* ── MODAL: TAMBAH / UBAH MESIN PRESENSI ── */}
      <Modal
        open={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title={editingDevice ? 'Ubah Data Mesin Presensi' : 'Tambah Mesin Presensi Baru'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeviceModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formDevice.formState.isSubmitting} disabled={formDevice.formState.isSubmitting} form="device-form">
              Simpan Perangkat
            </Button>
          </>
        }
      >
        <form id="device-form" onSubmit={formDevice.handleSubmit(onSubmitDevice)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Mesin Presensi *"
                placeholder="Contoh: Terminal Fingerprint Rektorat Lt. 1"
                required
                error={formDevice.formState.errors.device_name?.message}
                {...formDevice.register('device_name')}
              />
            </div>

            <Input
              label="Kode Perangkat Mesin *"
              placeholder="Contoh: FP-UTAMA-REKTORAT"
              required
              error={formDevice.formState.errors.device_code?.message}
              {...formDevice.register('device_code')}
            />

            <Input
              label="Alamat IP (LAN) *"
              placeholder="Contoh: 192.168.1.201"
              required
              error={formDevice.formState.errors.ip_address?.message}
              {...formDevice.register('ip_address')}
            />

            <Input
              label="Port TCP *"
              type="number"
              required
              error={formDevice.formState.errors.port?.message}
              {...formDevice.register('port', { valueAsNumber: true })}
            />

            <Input
              label="Model / Merk Mesin"
              placeholder="Contoh: ZKTeco ProCapture-X"
              error={formDevice.formState.errors.device_model?.message}
              {...formDevice.register('device_model')}
            />

            <div className="md:col-span-2">
              <Input
                label="Lokasi Pemasangan"
                placeholder="Contoh: Lobi Gedung Rektorat Sayap Timur"
                error={formDevice.formState.errors.location?.message}
                {...formDevice.register('location')}
              />
            </div>

            {offices.length > 0 && (
              <div className="md:col-span-2">
                <Controller
                  control={formDevice.control}
                  name="office_location_id"
                  render={({ field }) => (
                    <Select
                      label="Asosiasi Lokasi Kantor (Geofence)"
                      value={field.value ? String(field.value) : ''}
                      onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      options={[
                        { value: '', label: '-- Pilih Lokasi Kantor --' },
                        ...offices.map((o) => ({ value: String(o.id), label: o.name })),
                      ]}
                    />
                  )}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Controller
                control={formDevice.control}
                name="is_active"
                render={({ field }) => (
                  <ToggleSwitch
                    checked={!!field.value}
                    onChange={field.onChange}
                    label="Status Aktif Mesin"
                    description="Perangkat aktif akan dipindai secara berkala oleh daemon sinkronisasi"
                  />
                )}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: SIMULASI / PUSH PUNCH LOG ── */}
      <Modal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Simulasi / Push Log Mesin Fingerprint"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSyncModal(false)}>
              Tutup
            </Button>
            <Button type="submit" loading={formSyncLog.formState.isSubmitting} disabled={formSyncLog.formState.isSubmitting} form="sync-log-form">
              Sinkronkan Sekarang
            </Button>
          </>
        }
      >
        <form id="sync-log-form" onSubmit={formSyncLog.handleSubmit(onSubmitSyncLog)} className="space-y-4">
          <div className="p-3 bg-[var(--module-primary-subtle)] border border-[var(--module-primary)]/20 rounded-xl text-xs text-slate-800 flex items-start gap-2">
            <Fingerprint className="text-[var(--module-primary)] mt-0.5 shrink-0" size={16} />
            <p className="text-xs">
              Uji coba sinkronisasi data punch log mesin terminal. Sistem akan otomatis mencocokkan NIP, toleransi, dan mendeteksi jam masuk/pulang.
            </p>
          </div>

          <Controller
            control={formSyncLog.control}
            name="device_code"
            render={({ field }) => (
              <Select
                label="Pilih Mesin Fingerprint *"
                value={field.value}
                onChange={field.onChange}
                error={formSyncLog.formState.errors.device_code?.message}
                options={[
                  { value: '', label: '-- Pilih Mesin --' },
                  ...devices.map((d) => ({ value: d.device_code, label: `${d.device_name} (${d.device_code})` })),
                ]}
              />
            )}
          />

          <Input
            label="NIP / PIN Pegawai *"
            placeholder="Contoh: 198501152010121001 atau TENDIK-001"
            required
            error={formSyncLog.formState.errors.nip?.message}
            {...formSyncLog.register('nip')}
          />

          <Input
            label="Waktu Punch (Tanggal & Jam) *"
            placeholder="YYYY-MM-DD HH:mm:ss"
            required
            error={formSyncLog.formState.errors.timestamp?.message}
            {...formSyncLog.register('timestamp')}
          />

          <Controller
            control={formSyncLog.control}
            name="in_out_mode"
            render={({ field }) => (
              <Select
                label="Mode Absensi (In/Out)"
                value={String(field.value)}
                onChange={(val) => field.onChange(Number(val))}
                options={[
                  { value: '0', label: 'Clock In (Masuk)' },
                  { value: '1', label: 'Clock Out (Pulang)' },
                ]}
              />
            )}
          />
        </form>
      </Modal>

      {/* ── MODAL: TAMBAH / UBAH LOKASI KANTOR ── */}
      <Modal
        open={showOfficeModal}
        onClose={() => setShowOfficeModal(false)}
        title={editingOffice ? 'Ubah Lokasi Kantor' : 'Tambah Lokasi Kantor Baru'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowOfficeModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formOffice.formState.isSubmitting} disabled={formOffice.formState.isSubmitting} form="office-form">
              Simpan Lokasi
            </Button>
          </>
        }
      >
        <form id="office-form" onSubmit={formOffice.handleSubmit(onSubmitOffice)} className="space-y-4">
          <Input
            label="Nama Kantor / Gedung *"
            placeholder="Contoh: Kampus Utama Politeknik Indonusa Surakarta"
            required
            error={formOffice.formState.errors.name?.message}
            {...formOffice.register('name')}
          />

          <Input
            label="Alamat Lengkap"
            placeholder="Contoh: Jl. KH Samanhudi No.84, Surakarta"
            error={formOffice.formState.errors.address?.message}
            {...formOffice.register('address')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude *"
              type="number"
              step="0.0000001"
              required
              error={formOffice.formState.errors.latitude?.message}
              {...formOffice.register('latitude', { valueAsNumber: true })}
            />
            <Input
              label="Longitude *"
              type="number"
              step="0.0000001"
              required
              error={formOffice.formState.errors.longitude?.message}
              {...formOffice.register('longitude', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Radius Geofence Maksimal (Meter) *"
            type="number"
            min="10"
            max="5000"
            required
            hint="Pegawai hanya dapat absen jika posisi berada dalam batas radius ini."
            error={formOffice.formState.errors.radius_meters?.message}
            {...formOffice.register('radius_meters', { valueAsNumber: true })}
          />

          <Controller
            control={formOffice.control}
            name="is_active"
            render={({ field }) => (
              <ToggleSwitch
                checked={!!field.value}
                onChange={field.onChange}
                label="Status Lokasi Aktif"
                description="Jika dinonaktifkan, pegawai tidak dapat melakukan presensi di lokasi ini."
              />
            )}
          />
        </form>
      </Modal>

      {/* ── MODAL: TAMBAH / UBAH TANGGAL LIBUR ── */}
      <Modal
        open={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title={editingHoliday ? 'Ubah Tanggal Libur' : 'Tambah Tanggal Libur'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formHoliday.formState.isSubmitting} disabled={formHoliday.formState.isSubmitting} form="holiday-form">
              Simpan Libur
            </Button>
          </>
        }
      >
        <form id="holiday-form" onSubmit={formHoliday.handleSubmit(onSubmitHoliday)} className="space-y-4">
          <Input
            label="Tanggal Libur *"
            type="date"
            required
            error={formHoliday.formState.errors.holiday_date?.message}
            {...formHoliday.register('holiday_date')}
          />
          <Input
            label="Nama Libur *"
            placeholder="Contoh: Hari Kemerdekaan RI / Cuti Bersama Idul Fitri"
            required
            error={formHoliday.formState.errors.name?.message}
            {...formHoliday.register('name')}
          />
          <Controller
            control={formHoliday.control}
            name="is_mass_leave"
            render={({ field }) => (
              <ToggleSwitch
                checked={!!field.value}
                onChange={field.onChange}
                label="Cuti Bersama?"
                description="Aktifkan bila ini cuti bersama, matikan bila libur nasional / tanggal merah."
              />
            )}
          />
          <Input
            label="Keterangan (opsional)"
            placeholder="Contoh: SKB 3 Menteri"
            error={formHoliday.formState.errors.description?.message}
            {...formHoliday.register('description')}
          />
        </form>
      </Modal>

      {/* ── CONFIRM DIALOG ── */}
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
