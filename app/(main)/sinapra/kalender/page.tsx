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
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  KalenderRuanganFilterParams 
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

const getStartOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Senin sebagai hari pertama
  return new Date(date.setDate(diff));
};

const addDays = (d: Date, days: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function KalenderRuanganPage() {
  const router = useRouter();

  // Active View Tab: 'kalender' | 'agenda'
  const [activeTab, setActiveTab] = useState<'kalender' | 'agenda'>('kalender');

  // State Tanggal Acuan Kalender Mingguan
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));

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

  // Rentang Tanggal Kalender Mingguan
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekStartDateStr = useMemo(() => toISODate(weekDays[0]), [weekDays]);
  const weekEndDateStr = useMemo(() => toISODate(weekDays[6]), [weekDays]);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: KalenderRuanganFilterParams = {
        ...appliedFilters,
        start_date: appliedFilters.start_date || (activeTab === 'kalender' ? weekStartDateStr : undefined),
        end_date: appliedFilters.end_date || (activeTab === 'kalender' ? weekEndDateStr : undefined),
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
  }, [appliedFilters, activeTab, weekStartDateStr, weekEndDateStr]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigasi Minggu
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
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

  // Handler Apply & Reset Filter
  const handleApplyFilter = () => {
    setAppliedFilters({
      ruangan_id: filterRuangan ? filterRuangan.value : undefined,
      gedung_id: filterGedung ? filterGedung.value : undefined,
      source: filterSource,
      start_date: customStartDate || undefined,
      end_date: customEndDate || undefined,
    });
    setAgendaPage(1);
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
    setAgendaPage(1);
    setShowFilter(false);
  };

  // Processed Events for Agenda View (Sorting + Pagination)
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
          Kalender Mingguan
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

      {/* ── TAB 1: KALENDER MINGGUAN (TIMELINE VIEW) ── */}
      {activeTab === 'kalender' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
          {/* Header Navigasi Kalender */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                onClick={handlePrevWeek}
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
                onClick={handleNextWeek}
              >
                Selanjutnya
              </Button>
            </div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-slate-400" />
              <span>
                {formatTanggalIndo(weekStartDateStr)} &mdash; {formatTanggalIndo(weekEndDateStr)}
              </span>
            </div>
          </div>

          {/* Grid 7 Hari Mingguan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((dayDate) => {
              const dayStr = toISODate(dayDate);
              const isToday = toISODate(new Date()) === dayStr;
              const dayEvents = events.filter((e) => e.tanggal === dayStr);

              return (
                <div
                  key={dayStr}
                  className={`rounded-lg border p-2.5 flex flex-col min-h-[300px] transition-colors ${
                    isToday
                      ? 'border-indigo-300 bg-indigo-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  {/* Header Hari */}
                  <div className="text-center pb-2 mb-2 border-b border-slate-200">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      {dayDate.toLocaleDateString('id-ID', { weekday: 'short' })}
                    </p>
                    <p
                      className={`text-xs font-bold inline-block px-2 py-0.5 rounded-full mt-0.5 ${
                        isToday
                          ? 'bg-[var(--module-primary)] text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayDate.getDate()} {dayDate.toLocaleDateString('id-ID', { month: 'short' })}
                    </p>
                  </div>

                  {/* List Event Hari Tersebut */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-0.5">
                    {dayEvents.length === 0 ? (
                      <p className="text-2xs text-slate-400 text-center py-6 italic">
                        Tidak ada agenda
                      </p>
                    ) : (
                      dayEvents.map((evt) => {
                        const isSinapra = evt.source === 'sinapra';
                        return (
                          <div
                            key={evt.id}
                            onClick={() => {
                              setSelectedEvent(evt);
                              setIsDetailOpen(true);
                            }}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:shadow-sm ${
                              isSinapra
                                ? 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-400 text-indigo-950'
                                : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 text-emerald-950'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-2xs font-bold font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                                {evt.jam_mulai} - {evt.jam_selesai}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase px-1 rounded ${
                                  isSinapra
                                    ? 'bg-indigo-200/60 text-indigo-700'
                                    : 'bg-emerald-200/60 text-emerald-700'
                                }`}
                              >
                                {isSinapra ? 'SINAPRA' : 'KULIAH'}
                              </span>
                            </div>
                            <p className="text-xs font-bold line-clamp-2 leading-tight">
                              {evt.title}
                            </p>
                            <p className="text-2xs text-slate-600 truncate mt-1 flex items-center gap-0.5">
                              <MapPin size={10} className="shrink-0 text-slate-400" />
                              {evt.ruangan_nama}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* ── MODAL DETAIL JADWAL / AGENDA ── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Jadwal Pemakaian Ruangan"
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
              <h3 className="text-sm font-bold text-slate-800">
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

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
