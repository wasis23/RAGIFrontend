'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  CalendarRange,
  SlidersHorizontal,
  Fingerprint,
  Calendar,
  AlertTriangle,
  Plus,
  Save,
  Trash2,
  Edit2,
  RefreshCw,
  Copy,
  Users,
  Wifi,
  WifiOff,
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
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { FingerprintDevice } from '@/types/simpeg.types';

// Skema validasi Zod untuk form tipe shift
const shiftFormSchema = z.object({
  name: z.string().min(3, 'Nama tipe shift minimal 3 karakter').max(255, 'Nama tipe shift maksimal 255 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  late_tolerance_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  early_leave_tolerance_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(120, 'Maksimal 120 menit'),
  max_early_clock_in_minutes: z.coerce.number().int('Harus bilangan bulat').min(0, 'Minimal 0 menit').max(240, 'Maksimal 240 menit'),
  applies_national_holidays: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

type ShiftFormInput = z.input<typeof shiftFormSchema>;
type ShiftFormValues = z.output<typeof shiftFormSchema>;

export default function MasterPresensiPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'shift' | 'devices' | 'office' | 'settings' | 'holiday'>('shift');

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

  // -------------------------------------------------------------
  // TAB 1: SHIFT & JADWAL KERJA
  // -------------------------------------------------------------
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [savingShift, setSavingShift] = useState(false);
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

  // Bulk Shift Modal State
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
  // TAB 2: MESIN FINGERPRINT & BIOMETRIK
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi log mesin');
    } finally {
      setSavingSync(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: LOKASI KANTOR (GEOFENCING)
  // -------------------------------------------------------------
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any | null>(null);
  const [savingOffice, setSavingOffice] = useState(false);
  const [officeForm, setOfficeForm] = useState({
    name: '',
    address: '',
    latitude: -7.5675,
    longitude: 110.8036,
    radius_meters: 150,
    is_active: true,
  });

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
  // TAB 4: PARAMETER SISTEM
  // -------------------------------------------------------------
  const [, setLoadingSettings] = useState(false);
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
  // TAB 5: KALENDER LIBUR & TANGGAL MERAH
  // -------------------------------------------------------------
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [syncingHolidays, setSyncingHolidays] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: '',
    name: '',
    is_mass_leave: false,
    description: '',
  });

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

  const handleSyncHolidays = async () => {
    setSyncingHolidays(true);
    try {
      const res = await simpegService.syncNationalHolidays(holidayYear);
      toast.success(res.message || 'Sinkronisasi hari libur nasional berhasil');
      fetchHolidays(holidayYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi hari libur');
    } finally {
      setSyncingHolidays(false);
    }
  };

  // Effect Fetch Data sesuai Tab Aktif
  useEffect(() => {
    if (activeTab === 'shift') fetchShifts();
    else if (activeTab === 'devices') {
      fetchDevices();
      if (offices.length === 0) fetchOffices();
    }
    else if (activeTab === 'office') fetchOffices();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'holiday') fetchHolidays(holidayYear);
  }, [activeTab, fetchShifts, fetchDevices, fetchOffices, fetchSettings, fetchHolidays, holidayYear, offices.length]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-6">
      {/* Page Header */}
      <PageHeader
        title="Master Pengaturan Presensi"
        description="Konfigurasi pola shift kerja, mesin terminal fingerprint & biometrik, lokasi kantor geofencing, parameter sistem, serta kalender hari libur."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIMPEG', href: '/simpeg' },
          { label: 'Master Data SDM', href: '/simpeg/master/presensi' },
          { label: 'Pengaturan Presensi' },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'shift' && isAdmin && (
              <>
                <Button variant="outline" icon={<Users size={16} />} onClick={handleOpenBulkModal}>
                  Penugasan Massal
                </Button>
                <Button icon={<Plus size={16} />} onClick={handleOpenCreateShift}>
                  Tambah Tipe Shift
                </Button>
              </>
            )}

            {activeTab === 'devices' && isAdmin && (
              <>
                <Button variant="outline" icon={<Fingerprint size={16} />} onClick={() => setShowSyncModal(true)}>
                  Push Punch Log
                </Button>
                <Button icon={<Plus size={16} />} onClick={handleOpenCreateDevice}>
                  Tambah Mesin
                </Button>
              </>
            )}

            {activeTab === 'office' && isAdmin && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateOffice}>
                Tambah Lokasi
              </Button>
            )}

            {activeTab === 'holiday' && isAdmin && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateHoliday}>
                Tambah Libur
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Menu Bar */}
      <div
        role="tablist"
        aria-label="Menu Pengaturan Presensi"
        className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shift'}
          onClick={() => setActiveTab('shift')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'shift'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarRange size={16} className={activeTab === 'shift' ? 'text-primary-600' : 'text-slate-500'} />
          1. Shift & Jadwal Jam Kerja
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'devices'}
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Fingerprint size={16} className={activeTab === 'devices' ? 'text-primary-600' : 'text-slate-500'} />
          2. Mesin Fingerprint & Biometrik
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'office'}
          onClick={() => setActiveTab('office')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'office'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} className={activeTab === 'office' ? 'text-primary-600' : 'text-slate-500'} />
          3. Lokasi Kantor (Geofencing)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal size={16} className={activeTab === 'settings' ? 'text-primary-600' : 'text-slate-500'} />
          4. Parameter Sistem & Toleransi
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'holiday'}
          onClick={() => setActiveTab('holiday')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'holiday'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={16} className={activeTab === 'holiday' ? 'text-primary-600' : 'text-slate-500'} />
          5. Kalender Libur & Tanggal Merah
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KONTEN TAB 1: SHIFT KERJA & JADWAL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  Klik tombol <strong>Tambah Tipe Shift</strong> untuk membuat master jam kerja baru.
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
      {/* KONTEN TAB 2: MESIN FINGERPRINT & BIOMETRIK */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary-900 text-white p-6 rounded-3xl shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Fingerprint className="text-primary-300" size={24} />
                <h3 className="text-base font-bold">Terminal Mesin Fingerprint & Biometrik Kampus</h3>
              </div>
              <p className="text-xs text-primary-100/90 max-w-2xl">
                Kelola integrasi perangkat mesin sidik jari dan face terminal yang terhubung di jaringan LAN kampus. Punch log mesin otomatis disinkronkan ke SIMPEG dengan kalkulasi toleransi shift.
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
      {/* KONTEN TAB 3: LOKASI KANTOR (GEOFENCING) */}
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
      {/* KONTEN TAB 4: PARAMETER SISTEM */}
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
              hint="Rekomendasi model InsightFace: 0.80 (rentang 0.00 s/d 1.00). Nilai lebih tinggi menuntut kecocokan lebih presisi."
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
      {/* KONTEN TAB 5: KALENDER LIBUR & TANGGAL MERAH */}
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
                checked={!!field.value}
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
                checked={!!field.value}
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
      {/* MODAL TAMBAH/EDIT MESIN PRESENSI FINGERPRINT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title={editingDevice ? 'Ubah Data Mesin Presensi' : 'Tambah Mesin Presensi Baru'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeviceModal(false)} disabled={savingDevice}>
              Batal
            </Button>
            <Button type="submit" loading={savingDevice} disabled={savingDevice} form="device-form">
              Simpan Perangkat
            </Button>
          </>
        }
      >
        <form id="device-form" onSubmit={handleSaveDevice} className="space-y-4">
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
              placeholder="Contoh: ZKTeco ProCapture-X"
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
      {/* MODAL SIMULASI / PUSH PUNCH LOG */}
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
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-900 flex items-start gap-2">
            <Fingerprint className="text-primary-600 mt-0.5 shrink-0" size={16} />
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
