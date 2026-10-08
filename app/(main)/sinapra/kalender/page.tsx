'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Eye, 
  Layers, 
  Info,
  CalendarDays
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { sinapraService } from '@/services/sinapra.service';
import type { 
  Ruangan,
  Gedung,
  KalenderRuanganItem, 
  KalenderRuanganFilterParams,
  ApplyPeminjamanRuanganPayload
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

// Helper format tanggal Indonesia
const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMA (FORM <= 5 INPUTS)
// ─────────────────────────────────────────────────────────────
const quickBookingSchema = z.object({
  ruangan_id: z.number().min(1, 'Ruangan wajib dipilih'),
  tanggal: z.string().min(1, 'Tanggal pemakaian wajib diisi'),
  jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
  jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
  keperluan: z.string().min(3, 'Keperluan peminjaman minimal 3 karakter'),
});

type QuickBookingFormData = z.infer<typeof quickBookingSchema>;

export default function KalenderRuanganPage() {
  const router = useRouter();

  // Active View Tab: 'kalender' | 'agenda'
  const [activeTab, setActiveTab] = useState<'kalender' | 'agenda'>('kalender');

  // State Bulan Acuan Kalender Bulanan (Default bulan saat ini)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterRuangan, setFilterRuangan] = useState<{ value: number; label: string } | null>(null);
  const [filterGedung, setFilterGedung] = useState<{ value: number; label: string } | null>(null);
  const [filterSource, setFilterSource] = useState<'semua' | 'sinapra' | 'siakad'>('semua');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Applied Filter
  const [appliedFilters, setAppliedFilters] = useState<KalenderRuanganFilterParams>({
    source: 'semua',
  });

  // Data & Loading State
  const [events, setEvents] = useState<KalenderRuanganItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination untuk Tampilan Agenda (DataTable)
  const [agendaPage, setAgendaPage] = useState(1);
  const [agendaLimit, setAgendaLimit] = useState(10);

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<KalenderRuanganItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Quick Booking Modal State (<= 5 inputs)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRuanganOption, setSelectedRuanganOption] = useState<{ value: number; label: string } | null>(null);

  const {
    register: registerBooking,
    handleSubmit: handleSubmitBooking,
    reset: resetBooking,
    setValue: setBookingValue,
    formState: { errors: bookingErrors, isSubmitting: isBookingSubmitting },
  } = useForm<QuickBookingFormData>({
    resolver: zodResolver(quickBookingSchema),
    defaultValues: {
      ruangan_id: 0,
      tanggal: toISODate(new Date()),
      jam_mulai: '08:00',
      jam_selesai: '10:00',
      keperluan: '',
    },
  });

  const handleOpenQuickBooking = (tanggal: string, defaultHour?: number) => {
    const startHourStr = defaultHour !== undefined ? String(defaultHour).padStart(2, '0') + ':00' : '08:00';
    const endHourStr = defaultHour !== undefined ? String(Math.min(defaultHour + 2, 23)).padStart(2, '0') + ':00' : '10:00';

    if (filterRuangan) {
      setSelectedRuanganOption(filterRuangan);
      setBookingValue('ruangan_id', filterRuangan.value);
    } else {
      setSelectedRuanganOption(null);
      setBookingValue('ruangan_id', 0);
    }

    setBookingValue('tanggal', tanggal);
    setBookingValue('jam_mulai', startHourStr);
    setBookingValue('jam_selesai', endHourStr);
    setBookingValue('keperluan', '');
    setIsBookingModalOpen(true);
  };

  const onSubmitQuickBooking = async (data: QuickBookingFormData) => {
    try {
      const payload: ApplyPeminjamanRuanganPayload = {
        ruangan_id: data.ruangan_id,
        tanggal: data.tanggal,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        keperluan: data.keperluan,
      };
      await sinapraService.applyPeminjamanRuangan(payload);
      toast.success('Permohonan peminjaman ruangan berhasil dikirim!');
      setIsBookingModalOpen(false);
      resetBooking();
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim permohonan peminjaman ruangan.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // KALENDER BULANAN (GRID 7 KOLOM: SUN - SAT)
  // ─────────────────────────────────────────────────────────────
  const monthCalendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth(); // 0-indexed

    // Hari pertama dalam bulan ini
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // Tanggal grid pertama (bisa dari bulan sebelumnya)
    const startDate = new Date(year, month, 1 - startDayOfWeek);

    // Hitung total 5 atau 6 minggu (35 atau 42 kotak)
    const totalCells = startDayOfWeek + new Date(year, month + 1, 0).getDate() > 35 ? 42 : 35;

    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const isCurrentMonth = cellDate.getMonth() === month;
      const dateStr = toISODate(cellDate);
      days.push({
        date: cellDate,
        dateStr,
        dayNumber: cellDate.getDate(),
        isCurrentMonth,
        isFirstDayOfMonth: cellDate.getDate() === 1,
        monthLabel: cellDate.toLocaleDateString('en-US', { month: 'short' }),
      });
    }

    return {
      days,
      rangeStart: toISODate(days[0].date),
      rangeEnd: toISODate(days[days.length - 1].date),
    };
  }, [currentMonthDate]);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: KalenderRuanganFilterParams = {
        ...appliedFilters,
        start_date: appliedFilters.start_date || (activeTab === 'kalender' ? monthCalendarData.rangeStart : undefined),
        end_date: appliedFilters.end_date || (activeTab === 'kalender' ? monthCalendarData.rangeEnd : undefined),
      };

      const res = await sinapraService.getKalenderRuangan(params);
      if (res && res.data) {
        setEvents(res.data);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, activeTab, monthCalendarData.rangeStart, monthCalendarData.rangeEnd]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // AsyncSelect loaders
  const loadRuanganOptions = async (keyword: string) => {
    try {
      const res = await sinapraService.getRuanganList({ search: keyword, limit: 20 });
      const raw = res.data;
      const list: Ruangan[] = Array.isArray(raw) ? raw : (raw?.items || []);
      return list.map((r: Ruangan) => ({
        value: r.id,
        label: `${r.kode} - ${r.nama}`,
      }));
    } catch {
      return [];
    }
  };

  const loadGedungOptions = async (keyword: string) => {
    try {
      const res = await sinapraService.getGedungList({ search: keyword, limit: 20 });
      const raw = res.data;
      const list: Gedung[] = Array.isArray(raw) ? raw : (raw?.items || []);
      return list.map((g: Gedung) => ({
        value: g.id,
        label: `${g.kode} - ${g.nama}`,
      }));
    } catch {
      return [];
    }
  };

  // Filter Handlers
  const handleApplyFilter = () => {
    const newFilters: KalenderRuanganFilterParams = {
      ruangan_id: filterRuangan ? filterRuangan.value : undefined,
      gedung_id: filterGedung ? filterGedung.value : undefined,
      source: filterSource,
      start_date: customStartDate || undefined,
      end_date: customEndDate || undefined,
    };
    setAppliedFilters(newFilters);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterRuangan(null);
    setFilterGedung(null);
    setFilterSource('semua');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('tanggal');
    setSortDir('asc');
    setAppliedFilters({ source: 'semua' });
    setShowFilter(false);
  };

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, KalenderRuanganItem[]> = {};
    events.forEach((evt) => {
      if (!map[evt.tanggal]) {
        map[evt.tanggal] = [];
      }
      map[evt.tanggal].push(evt);
    });
    return map;
  }, [events]);

  // Sorting dan Pagination untuk Tampilan Agenda
  const sortedAgendaEvents = useMemo(() => {
    const list = [...events];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortBy) {
        case 'tanggal':
          valA = a.tanggal;
          valB = b.tanggal;
          break;
        case 'jam_mulai':
          valA = a.jam_mulai;
          valB = b.jam_mulai;
          break;
        case 'ruangan_nama':
          valA = a.ruangan_nama.toLowerCase();
          valB = b.ruangan_nama.toLowerCase();
          break;
        case 'gedung_nama':
          valA = a.gedung_nama.toLowerCase();
          valB = b.gedung_nama.toLowerCase();
          break;
        case 'source':
          valA = a.source;
          valB = b.source;
          break;
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        default:
          valA = a.tanggal;
          valB = b.tanggal;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [events, sortBy, sortDir]);

  const pagedAgendaEvents = useMemo(() => {
    const startIndex = (agendaPage - 1) * agendaLimit;
    return sortedAgendaEvents.slice(startIndex, startIndex + agendaLimit);
  }, [sortedAgendaEvents, agendaPage, agendaLimit]);

  const agendaMeta: PaginationMeta = useMemo(() => {
    const total = sortedAgendaEvents.length;
    return {
      current_page: agendaPage,
      per_page: agendaLimit,
      total,
      last_page: Math.ceil(total / agendaLimit) || 1,
      from: total > 0 ? (agendaPage - 1) * agendaLimit + 1 : 0,
      to: Math.min(agendaPage * agendaLimit, total),
    };
  }, [sortedAgendaEvents.length, agendaPage, agendaLimit]);

  // Kolom DataTable Agenda
  const agendaColumns: ColumnDef<KalenderRuanganItem>[] = [
    {
      key: 'waktu',
      label: 'WAKTU',
      render: (item: KalenderRuanganItem) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-xs">
            {formatTanggalIndo(item.tanggal)}
          </span>
          <span className="text-2xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Clock size={11} className="text-slate-400" />
            {item.jam_mulai} - {item.jam_selesai} WIB
          </span>
        </div>
      ),
    },
    {
      key: 'lokasi',
      label: 'RUANGAN & GEDUNG',
      render: (item: KalenderRuanganItem) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
            <MapPin size={11} className="text-slate-400" />
            {item.ruangan_nama}
          </span>
          <span className="text-2xs text-slate-500 mt-0.5">
            {item.gedung_nama}
          </span>
        </div>
      ),
    },
    {
      key: 'agenda',
      label: 'KEPERLUAN / MATA KULIAH',
      render: (item: KalenderRuanganItem) => (
        <div className="flex flex-col max-w-xs md:max-w-md">
          <span className="font-bold text-slate-800 text-xs truncate">
            {item.title}
          </span>
          <span className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
            <UserIcon size={11} className="text-slate-400" />
            {item.penanggung_jawab}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'SUMBER',
      render: (item: KalenderRuanganItem) => (
        item.source === 'sinapra' ? (
          <Badge variant="sinapra">SINAPRA</Badge>
        ) : (
          <Badge variant="siakad">SIAKAD</Badge>
        )
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item: KalenderRuanganItem) => {
        let variant: 'success' | 'warning' | 'info' | 'secondary' = 'secondary';
        if (item.status === 'disetujui' || item.status === 'terjadwal') variant = 'success';
        else if (item.status === 'berlangsung') variant = 'warning';
        else if (item.status === 'pending') variant = 'info';

        return (
          <Badge variant={variant}>
            {item.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (item: KalenderRuanganItem) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Detail',
                icon: <Eye size={14} />,
                onClick: () => {
                  setSelectedEvent(item);
                  setIsDetailOpen(true);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const headerDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="space-y-4 w-full">
      {/* ── PageHeader ── */}
      <PageHeader
        title="Kalender & Timeline Ketersediaan Ruangan"
        description="Visualisasi terpadu jadwal peminjaman ruangan SINAPRA dan perkuliahan aktif SIAKAD"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{
                borderColor: 'var(--module-primary)',
                color: 'var(--module-primary)',
              }}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/sinapra/peminjaman')}
            >
              Pinjam Ruangan
            </Button>
          </div>
        }
      />

      {/* ── Tab Navigasi Tampilan (Standard Rounded-Top Underline) ── */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('kalender')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'kalender'
              ? 'border-b-2 rounded-t-lg'
              : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
          }`}
          style={
            activeTab === 'kalender'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'var(--module-primary-subtle)',
                }
              : undefined
          }
        >
          <CalendarDays size={14} />
          Kalender Bulanan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'agenda'
              ? 'border-b-2 rounded-t-lg'
              : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
          }`}
          style={
            activeTab === 'agenda'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'var(--module-primary-subtle)',
                }
              : undefined
          }
        >
          <Layers size={14} />
          Daftar Agenda ({events.length})
        </button>
      </div>

      {/* ── TAB 1: KALENDER BULANAN (GOOGLE CALENDAR STYLE) ── */}
      {activeTab === 'kalender' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
          {/* Header Navigasi Bulan */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                onClick={handlePrevMonth}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Hari Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={16} />}
                onClick={handleNextMonth}
              >
                Selanjutnya
              </Button>
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={14} className="text-slate-400" />
              <span>
                {currentMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Grid Kalender Bulanan (Table-like grid layout) */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-200">
            {/* Header 7 Nama Hari (SUN - SAT) */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center">
              {headerDayNames.map((name, idx) => (
                <div
                  key={name}
                  className={`py-2 text-2xs font-bold tracking-wider ${
                    idx === 0 ? 'text-rose-600' : 'text-slate-600'
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Kotak-Kotak Tanggal Bulanan (Minimalist Google Calendar Style) */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {monthCalendarData.days.map((dayItem) => {
                const dayEvents = eventsByDate[dayItem.dateStr] || [];
                const isToday = toISODate(new Date()) === dayItem.dateStr;

                return (
                  <div
                    key={dayItem.dateStr}
                    onClick={(e) => {
                      // Jika klik area kosong di tanggal, buka dialog quick booking
                      if ((e.target as HTMLElement).closest('.event-pill')) return;
                      handleOpenQuickBooking(dayItem.dateStr);
                    }}
                    className={`bg-white min-h-24 md:min-h-28 p-1.5 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-slate-50/80 ${
                      !dayItem.isCurrentMonth ? 'bg-slate-50/50 opacity-60' : ''
                    } ${isToday ? 'bg-[var(--module-primary-subtle)]/30' : ''}`}
                  >
                    {/* Baris Atas: Tanggal & Label Bulan jika tanggal 1 */}
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-[var(--module-primary)] text-white font-bold'
                            : dayItem.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayItem.isFirstDayOfMonth ? `${dayItem.monthLabel} ` : ''}
                        {dayItem.dayNumber}
                      </span>
                    </div>

                    {/* Area Agenda Minimalis (Pill style seperti Google Calendar) */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-20">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const isSinapra = evt.source === 'sinapra';
                        return (
                          <div
                            key={evt.id}
                            title={`${evt.jam_mulai}-${evt.jam_selesai} • ${evt.title} (${evt.ruangan_nama})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                              setIsDetailOpen(true);
                            }}
                            className="event-pill flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-medium leading-tight truncate cursor-pointer transition-all hover:opacity-90 hover:shadow-xs"
                            style={
                              isSinapra
                                ? { backgroundColor: 'var(--module-primary)', color: '#ffffff' }
                                : { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', border: '1px solid color-mix(in srgb, var(--module-primary) 30%, transparent)' }
                            }
                          >
                            <span className="font-mono text-2xs opacity-90 shrink-0">
                              {evt.jam_mulai.substring(0, 5)}
                            </span>
                            <span className="truncate">
                              {evt.title}
                            </span>
                          </div>
                        );
                      })}

                      {/* Indikator Jika Ada Lebih dari 3 Agenda */}
                      {dayEvents.length > 3 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(dayEvents[0]);
                            setIsDetailOpen(true);
                          }}
                          className="text-2xs font-bold text-slate-500 hover:text-[var(--module-primary)] px-1 cursor-pointer transition-colors"
                        >
                          +{dayEvents.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DAFTAR AGENDA (DATA TABLE VIEW) ── */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <DataTable
            columns={agendaColumns}
            data={pagedAgendaEvents}
            isLoading={isLoading}
            meta={agendaMeta}
            onPageChange={(p) => setAgendaPage(p)}
            onLimitChange={(l) => {
              setAgendaLimit(l);
              setAgendaPage(1);
            }}
          />
        </div>
      )}

      {/* ── DRAWER FILTER (Standard SSO/IAM Slide Kanan-ke-Kiri) ── */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jadwal Ruangan"
      >
        <div className="space-y-4">
          <AsyncSelect
            label="Pilih Ruangan"
            loadOptions={loadRuanganOptions}
            value={filterRuangan}
            onChange={(val) => setFilterRuangan(val)}
            placeholder="Ketik untuk mencari ruangan..."
            isClearable
          />

          <AsyncSelect
            label="Pilih Gedung"
            loadOptions={loadGedungOptions}
            value={filterGedung}
            onChange={(val) => setFilterGedung(val)}
            placeholder="Ketik untuk mencari gedung..."
            isClearable
          />

          <Select
            label="Sumber Data"
            value={filterSource}
            onChange={(val) => setFilterSource(val as 'semua' | 'sinapra' | 'siakad')}
            options={[
              { value: 'semua', label: 'Semua Sumber (SINAPRA + SIAKAD)' },
              { value: 'sinapra', label: 'Peminjaman Ruangan SINAPRA' },
              { value: 'siakad', label: 'Perkuliahan Semester SIAKAD' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Tanggal Selesai"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>

          <hr className="border-t border-slate-200 my-2" />

          {/* Grid 2 Kolom Sorting Wajib */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'tanggal', label: 'Tanggal Agenda' },
                { value: 'jam_mulai', label: 'Jam Mulai' },
                { value: 'ruangan_nama', label: 'Nama Ruangan' },
                { value: 'gedung_nama', label: 'Nama Gedung' },
                { value: 'source', label: 'Sumber Data' },
                { value: 'title', label: 'Judul / Keperluan' },
              ]}
            />
            <Select
              label="Arah"
              value={sortDir}
              onChange={(val) => setSortDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleResetFilter}
            >
              Reset Filter
            </Button>
            <Button
              className="flex-1"
              onClick={handleApplyFilter}
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── MODAL PRATINJAU RINGKAS AGENDA (QUICK VIEW MODAL) ── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Ringkasan Jadwal Pemakaian Ruangan"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {/* Header Event */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {selectedEvent.source === 'sinapra' ? (
                  <Badge variant="sinapra">Peminjaman SINAPRA</Badge>
                ) : (
                  <Badge variant="siakad">Perkuliahan SIAKAD</Badge>
                )}
                <Badge variant="secondary">
                  {selectedEvent.status.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                {selectedEvent.title}
              </h3>
            </div>

            {/* Grid Informasi Rinci */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-2xs text-slate-500 font-semibold uppercase">Waktu & Tanggal</span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <CalendarIcon size={13} className="text-slate-400" />
                  {formatTanggalIndo(selectedEvent.tanggal)}
                </p>
                <p className="font-mono text-2xs text-slate-600 flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  {selectedEvent.jam_mulai} - {selectedEvent.jam_selesai} WIB
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-2xs text-slate-500 font-semibold uppercase">Lokasi Ruangan</span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  {selectedEvent.ruangan_nama}
                </p>
                <p className="text-2xs text-slate-600">
                  {selectedEvent.gedung_nama}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <span className="text-2xs text-slate-500 font-semibold uppercase">Penanggung Jawab / Pengampu</span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <UserIcon size={13} className="text-slate-400" />
                  {selectedEvent.penanggung_jawab}
                </p>
              </div>

              {selectedEvent.catatan && (
                <div className="space-y-1 md:col-span-2">
                  <span className="text-2xs text-slate-500 font-semibold uppercase">Catatan / Keterangan</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-2xs flex items-start gap-1.5">
                    <Info size={13} className="shrink-0 text-slate-400 mt-0.5" />
                    <span>{selectedEvent.catatan}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
                Tutup
              </Button>
              {selectedEvent.source === 'sinapra' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    router.push(`/sinapra/peminjaman/ruangan/${selectedEvent.id}`);
                  }}
                >
                  Buka Rincian Lengkap
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL QUICK BOOKING RUANGAN (FORM <= 5 INPUTS) ── */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Booking Cepat Ruangan Kampus"
        size="md"
      >
        <form onSubmit={handleSubmitBooking(onSubmitQuickBooking)} className="space-y-4">
          <p className="text-xs text-slate-500">
            Pilih ruangan dan tentukan durasi peminjaman untuk reservasi langsung pada kalender.
          </p>

          <div>
            <AsyncSelect
              label="Pilih Ruangan Kampus"
              placeholder="Ketik untuk mencari ruangan..."
              loadOptions={loadRuanganOptions}
              value={selectedRuanganOption}
              onChange={(val: any) => {
                setSelectedRuanganOption(val);
                setBookingValue('ruangan_id', val ? Number(val.value) : 0, { shouldValidate: true });
              }}
            />
            {bookingErrors.ruangan_id && (
              <p className="text-2xs text-[var(--module-primary)]">{bookingErrors.ruangan_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Tanggal Pemakaian"
                type="date"
                {...registerBooking('tanggal')}
              />
              {bookingErrors.tanggal && (
                <p className="text-2xs text-[var(--module-primary)]">{bookingErrors.tanggal.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  label="Jam Mulai"
                  type="time"
                  {...registerBooking('jam_mulai')}
                />
                {bookingErrors.jam_mulai && (
                  <p className="text-2xs text-[var(--module-primary)]">{bookingErrors.jam_mulai.message}</p>
                )}
              </div>
              <div>
                <Input
                  label="Jam Selesai"
                  type="time"
                  {...registerBooking('jam_selesai')}
                />
                {bookingErrors.jam_selesai && (
                  <p className="text-2xs text-[var(--module-primary)]">{bookingErrors.jam_selesai.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Textarea
              label="Keperluan Peminjaman Ruangan"
              placeholder="cth: Rapat Koordinasi Panitia Seminar, Bimbingan Skripsi, Praktikum Tambahan..."
              rows={3}
              {...registerBooking('keperluan')}
            />
            {bookingErrors.keperluan && (
              <p className="text-2xs text-[var(--module-primary)]">{bookingErrors.keperluan.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isBookingSubmitting}
              disabled={isBookingSubmitting}
            >
              Kirim Permohonan Pinjam
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
