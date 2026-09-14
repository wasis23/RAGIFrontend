'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardCheck,
  Building2,
  CalendarRange,
  SlidersHorizontal,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Save,
  Trash2,
  Edit2,
  Calendar,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { PaginationMeta } from '@/types/api.types';

export default function PresensiPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.presensi.manage');

  const [activeTab, setActiveTab] = useState<'log' | 'office' | 'shift' | 'settings'>('log');

  // -------------------------------------------------------------
  // TAB 1: LOG PRESENSI REALTIME
  // -------------------------------------------------------------
  const [loadingLog, setLoadingLog] = useState(true);
  const [presensiList, setPresensiList] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Detail / Approval Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchLogPresensi = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await simpegService.getPresensiList({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        tanggal: tanggalFilter || undefined,
        page,
        per_page: 15,
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
  }, [search, statusFilter, tanggalFilter, page]);

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

  const handleDeleteOffice = async (office: any) => {
    if (!confirm(`Hapus lokasi kantor "${office.name}"?`)) return;
    try {
      await simpegService.deleteOfficeLocation(office.id);
      toast.success('Lokasi kantor berhasil dihapus');
      fetchOffices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus lokasi kantor');
    }
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
        setShifts(res.data || []);
        if (res.data?.length > 0 && !selectedShift) {
          setSelectedShift(res.data[0]);
        }
      }
    } catch {
      toast.error('Gagal memuat jadwal shift kerja');
    } finally {
      setLoadingShifts(false);
    }
  }, [selectedShift]);

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

  // Effect fetch data saat tab berubah
  useEffect(() => {
    if (activeTab === 'log') fetchLogPresensi();
    else if (activeTab === 'office') fetchOffices();
    else if (activeTab === 'shift') fetchShifts();
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchLogPresensi, fetchOffices, fetchShifts, fetchSettings]);

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
        else if (st === 'izin' || st === 'sakit') badgeVariant = 'info';
        else if (st === 'menunggu_approval') badgeVariant = 'purple';

        return (
          <div className="space-y-1">
            <Badge variant={badgeVariant} className="capitalize font-bold text-2xs">
              {st === 'hadir' ? 'Hadir Tepat Waktu' : st}
            </Badge>
            {row.late_minutes > 0 && (
              <div className="text-[10px] text-rose-600 font-semibold">
                Terlambat {row.late_minutes} mnt
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
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedLog(row);
              setShowDetailModal(true);
            }}
          >
            Rincian
          </Button>
          {isAdmin && (row.status === 'ditolak' || row.status === 'menunggu_approval' || !row.is_approved_by_admin) && (
            <Button
              size="sm"
              variant="primary"
              loading={approvingId === row.id}
              disabled={approvingId === row.id}
              onClick={() => handleApprovePresensi(row.id)}
            >
              Setujui
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Pusat Presensi & Jadwal SIMPEG"
        description="Kelola verifikasi absensi biometrik wajah, lokasi kantor (geofencing), jadwal shift kerja, dan parameter sistem presensi."
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'office' && isAdmin && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateOffice}>
                Tambah Lokasi Kantor
              </Button>
            )}
            {activeTab === 'log' && (
              <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilterDrawer(true)}>
                Filter Presensi
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Navigation Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          type="button"
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
          onClick={() => setActiveTab('office')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'office'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Building2 size={16} className={activeTab === 'office' ? 'text-primary-600' : 'text-slate-500'} />
          2. Lokasi Kantor (Geofencing)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shift')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'shift'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarRange size={16} className={activeTab === 'shift' ? 'text-primary-600' : 'text-slate-500'} />
          3. Shift & Jadwal Jam Kerja
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80 ring-1 ring-primary-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <SlidersHorizontal size={16} className={activeTab === 'settings' ? 'text-primary-600' : 'text-slate-500'} />
          4. Parameter Sistem & Toleransi
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LOG PRESENSI */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <DataTable
            columns={logColumns}
            data={presensiList}
            isLoading={loadingLog}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
          />
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
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Template Shift</h3>
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
                <div className="mt-2 text-2xs text-slate-600 font-semibold">
                  Toleransi Keterlambatan: {s.late_tolerance_minutes} Menit
                </div>
              </div>
            ))}
          </div>

          {/* Pengaturan Detail 7 Hari Kerja */}
          {selectedShift && (
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-5 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Jadwal Harian: {selectedShift.name}</h3>
                  <p className="text-2xs text-slate-500">Atur jam masuk, jam pulang, dan hari libur untuk Senin s/d Minggu</p>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    icon={<Save size={14} />}
                    loading={savingShift}
                    disabled={savingShift}
                    onClick={handleSaveShiftSchedule}
                  >
                    Simpan Jadwal
                  </Button>
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
                          <input
                            type="time"
                            value={day.start_time || ''}
                            disabled={day.is_day_off}
                            onChange={(e) => {
                              const updatedDays = [...selectedShift.days];
                              updatedDays[idx].start_time = e.target.value;
                              setSelectedShift({ ...selectedShift, days: updatedDays });
                            }}
                            className="text-xs font-mono p-1.5 border border-slate-200 rounded-lg disabled:bg-slate-100"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-2xs text-slate-400">Pulang:</span>
                          <input
                            type="time"
                            value={day.end_time || ''}
                            disabled={day.is_day_off}
                            onChange={(e) => {
                              const updatedDays = [...selectedShift.days];
                              updatedDays[idx].end_time = e.target.value;
                              setSelectedShift({ ...selectedShift, days: updatedDays });
                            }}
                            className="text-xs font-mono p-1.5 border border-slate-200 rounded-lg disabled:bg-slate-100"
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
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ambang Batas Skor Kemiripan Wajah (Face Recognition Score) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.1"
                max="1.0"
                value={systemParams.face_score_threshold}
                onChange={(e) => setSystemParams({ ...systemParams, face_score_threshold: parseFloat(e.target.value) || 0.80 })}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rekomendasi model InsightFace / Facenet: <strong>0.80</strong> (Rentang 0.00 s/d 1.00). Nilai lebih tinggi menuntut kecocokan lebih presisi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Batas Toleransi Akurasi GPS (Maksimal Meter) *
              </label>
              <Input
                type="number"
                step="1"
                min="5"
                max="500"
                value={systemParams.gps_accuracy_threshold_meters}
                onChange={(e) => setSystemParams({ ...systemParams, gps_accuracy_threshold_meters: parseFloat(e.target.value) || 50.0 })}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maksimal ketidakpastian GPS HP (default <strong>50.0 meter</strong>). Presensi ditolak jika sinyal satelit GPS lemah &gt; 50 meter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Toleransi Keterlambatan (Menit) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={systemParams.late_tolerance_minutes}
                  onChange={(e) => setSystemParams({ ...systemParams, late_tolerance_minutes: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Presensi masuk dalam toleransi tetap dihitung Tepat Waktu.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Toleransi Pulang Cepat (Menit) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={systemParams.early_leave_tolerance_minutes}
                  onChange={(e) => setSystemParams({ ...systemParams, early_leave_tolerance_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Batas Buka Absen Masuk Lebih Awal (Menit Sebelum Jam Shift) *
              </label>
              <Input
                type="number"
                min="0"
                max="240"
                value={systemParams.max_early_clock_in_minutes}
                onChange={(e) => setSystemParams({ ...systemParams, max_early_clock_in_minutes: parseInt(e.target.value) || 60 })}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Contoh: 60 menit artinya jika shift jam 08:00, pegawai baru bisa absen mulai jam 07:00.
              </p>
            </div>

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
      {/* DRAWER FILTER LOG PRESENSI */}
      {/* ------------------------------------------------------------- */}
      <Drawer open={showFilterDrawer} onClose={() => setShowFilterDrawer(false)} title="Filter Data Presensi">
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
            ]}
          />

          <div className="pt-4 flex gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setPage(1);
                setShowFilterDrawer(false);
                fetchLogPresensi();
              }}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTanggalFilter('');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Drawer>

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

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Radius Geofence Maksimal (Meter) *
            </label>
            <Input
              type="number"
              min="10"
              max="5000"
              required
              value={officeForm.radius_meters}
              onChange={(e) => setOfficeForm({ ...officeForm, radius_meters: parseInt(e.target.value) || 150 })}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Pegawai hanya dapat absen jika jarak perangkat ke titik koordinat berada dalam batas radius ini.
            </p>
          </div>

          <ToggleSwitch
            checked={officeForm.is_active}
            onChange={(checked) => setOfficeForm({ ...officeForm, is_active: checked })}
            label="Status Lokasi Aktif"
            description="Jika dinonaktifkan, pegawai tidak dapat melakukan presensi di lokasi ini."
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
    </div>
  );
}
