'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Award, 
  GraduationCap, 
  BookOpen, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import { 
  JENIS_PEGAWAI_OPTIONS, 
  SERDOS_OPTIONS, 
  SORT_BY_ANALITIK_OPTIONS, 
  SORT_ORDER_OPTIONS 
} from '@/lib/constants';
import type { 
  AnalitikPegawaiItem, 
  AnalitikRingkasanData, 
  AnalitikFilterParams,
  JabatanFungsionalAkademik,
  UnitKerja
} from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

export default function AnalitikPegawaiPage() {
  // State Data & Loading
  const [data, setData] = useState<AnalitikPegawaiItem[]>([]);
  const [ringkasan, setRingkasan] = useState<AnalitikRingkasanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });

  // State Master Dropdown Dinamis
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);

  // Opsi Dropdown Dinamis Ter-memoize
  const jafungOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '-- Semua Jabatan Akademik --' },
    ...jafungList.map((jf) => ({
      value: String(jf.id),
      label: `${jf.nama} (KUM: ${(jf as any).angka_kredit || (jf as any).angka_kredit_min || 0})`,
    })),
  ], [jafungList]);

  const unitKerjaOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '-- Semua Unit Kerja & Prodi --' },
    ...unitKerjaList.map((u) => ({
      value: String(u.id),
      label: `${u.nama} (${u.kode})`,
    })),
  ], [unitKerjaList]);

  // State Drawer Filter
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<AnalitikFilterParams>({
    search: '',
    tmt_start: '',
    tmt_end: '',
    jabatan_fungsional_id: '',
    unit_kerja_id: '',
    status_kepegawaian: '',
    jenis_pegawai: '',
    is_serdos: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 15,
  });

  // Load Master Referensi Dropdown
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [jfRes, ukRes] = await Promise.all([
          simpegService.getJabatanFungsionalList(),
          simpegService.getUnitKerjaList(),
        ]);
        setJafungList((jfRes as any).data || []);
        setUnitKerjaList((ukRes as any).data || []);
      } catch (err) {
        console.error('Gagal memuat master referensi analitik', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch Data Pegawai & Ringkasan Metrik
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams: Record<string, unknown> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          cleanParams[key] = val;
        }
      });

      const [resPegawai, resRingkasan] = await Promise.all([
        simpegService.getAnalitikPegawai(cleanParams),
        simpegService.getAnalitikRingkasan(cleanParams),
      ]);

      setData((resPegawai as any).data || []);
      setRingkasan((resRingkasan as any).data || null);

      if ((resPegawai as any).meta) {
        setMeta({
          current_page: (resPegawai as any).meta.current_page || 1,
          per_page: (resPegawai as any).meta.per_page || 15,
          total: (resPegawai as any).meta.total || 0,
          last_page: (resPegawai as any).meta.last_page || 1,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data analitik pegawai.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, per_page: newLimit, page: 1 }));
  };

  // Handler Export Excel Dinamis
  const handleExportExcel = async () => {
    setExporting(true);
    const toastId = toast.loading('Sedang menyiapkan berkas Excel analitik...');
    try {
      const cleanParams: Record<string, unknown> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined && key !== 'page' && key !== 'per_page') {
          cleanParams[key] = val;
        }
      });

      const blob = await simpegService.exportAnalitikExcel(cleanParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const tmtPeriod = filters.tmt_start ? `_${filters.tmt_start}_sd_${filters.tmt_end || 'sekarang'}` : '';
      a.download = `Analitik_Pegawai${tmtPeriod}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Berkas Excel berhasil diunduh.', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal mengekspor data ke Excel.', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Reset Filter
  const handleResetFilter = () => {
    setFilters({
      search: '',
      tmt_start: '',
      tmt_end: '',
      jabatan_fungsional_id: '',
      unit_kerja_id: '',
      status_kepegawaian: '',
      jenis_pegawai: '',
      is_serdos: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      page: 1,
      per_page: 15,
    });
    setIsDrawerOpen(false);
  };

  // Definisi Kolom DataTable Sesuai Standar SIMPEG
  const columns: ColumnDef<AnalitikPegawaiItem>[] = [
    {
      label: 'NO',
      key: 'id',
      align: 'center',
      render: (_item: AnalitikPegawaiItem, index: number) => (
        <span className="text-xs text-slate-500 font-medium">
          {(meta.current_page - 1) * meta.per_page + index + 1}
        </span>
      ),
    },
    {
      label: 'IDENTITAS PEGAWAI',
      key: 'nama_lengkap',
      render: (item: AnalitikPegawaiItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 leading-tight">
            {item.nama_gelar || item.nama_lengkap}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xs text-slate-500">
              NIP: {item.nip || '-'}
            </span>
            {item.nidn && (
              <>
                <span className="text-2xs text-slate-300">•</span>
                <span className="text-2xs text-[var(--module-primary,#4f46e5)] font-medium">
                  NIDN: {item.nidn}
                </span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'UNIT KERJA / PRODI',
      key: 'unit_kerja',
      render: (item: AnalitikPegawaiItem) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800">
            {item.unit_kerja?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-400 uppercase mt-0.5">
            {item.unit_kerja?.tipe ? `Unit: ${item.unit_kerja.tipe}` : ''}
          </span>
        </div>
      ),
    },
    {
      label: 'JABATAN AKADEMIK (JAD)',
      key: 'jabatan_fungsional',
      render: (item: AnalitikPegawaiItem) => {
        const jafung = item.jabatan_fungsional;
        if (!jafung) {
          return (
            <Badge variant="secondary" className="text-2xs">
              Belum Ada JAD
            </Badge>
          );
        }

        const nama = jafung.nama;
        const isLektorKepala = nama.toLowerCase().includes('lektor kepala');
        const isGuruBesar = nama.toLowerCase().includes('guru besar') || nama.toLowerCase().includes('profesor');

        let variant: BadgeVariant = 'simpeg';
        if (isGuruBesar) variant = 'success';
        else if (isLektorKepala) variant = 'purple';

        return (
          <div className="flex flex-col items-start gap-1">
            <Badge 
              variant={variant} 
              className="text-2xs font-semibold"
            >
              {nama}
            </Badge>
            {jafung.angka_kredit && (
              <span className="text-2xs text-slate-500">
                KUM: <strong className="text-slate-700">{jafung.angka_kredit}</strong>
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'SK & TMT JAD',
      key: 'jad_aktif',
      render: (item: AnalitikPegawaiItem) => {
        const tmt = item.jad_aktif?.tmt;
        const sk = item.jad_aktif?.sk_nomor;
        if (!tmt && !sk) {
          return <span className="text-2xs text-slate-400 italic">Belum tercatat</span>;
        }

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[var(--module-primary,#4f46e5)] shrink-0" />
              <span className="text-xs font-semibold text-slate-900">
                TMT: {tmt || '-'}
              </span>
            </div>
            {sk && (
              <span className="text-2xs text-slate-500 mt-1 truncate max-w-[200px]" title={sk}>
                SK: {sk}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'STATUS & SERTIFIKASI',
      key: 'is_serdos',
      render: (item: AnalitikPegawaiItem) => (
        <div className="flex flex-col gap-1">
          <div>
            <Badge 
              variant={item.is_serdos ? 'success' : 'secondary'} 
              className="text-2xs"
            >
              {item.is_serdos ? 'Serdos Aktif' : 'Belum Serdos'}
            </Badge>
          </div>
          <span className="text-2xs text-slate-500 capitalize">
            {item.status_kepegawaian || item.jenis_pegawai}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Halaman */}
      <PageHeader
        title="Analitik Kepegawaian & Jabatan Akademik"
        description="Pusat intelijen data pegawai, monitoring distribusi TMT Jabatan Akademik Dosen (JAD), dan ekspor rekapitulasi data ke Excel."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="border-[var(--module-primary,#4f46e5)] text-[var(--module-primary,#4f46e5)] hover:bg-[var(--module-primary-subtle,#eef2ff)]"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="bg-[var(--module-primary,#4f46e5)] hover:opacity-90 text-white shadow-xs"
              onClick={handleExportExcel}
              disabled={exporting || loading}
            >
              <FileSpreadsheet size={16} className="mr-1.5" />
              {exporting ? 'Mengekspor...' : 'Export Excel'}
            </Button>
          </div>
        }
      />

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Pegawai Terfilter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pegawai</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--module-primary-subtle,#eef2ff)] text-[var(--module-primary,#4f46e5)] flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : ringkasan?.total_pegawai ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Dosen: <strong className="text-slate-800">{ringkasan?.total_dosen ?? 0}</strong> • Tendik: <strong className="text-slate-800">{ringkasan?.total_tendik ?? 0}</strong>
            </p>
          </div>
        </div>

        {/* Lektor Kepala */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lektor Kepala</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--module-primary-subtle,#eef2ff)] text-[var(--module-primary,#4f46e5)] flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : ringkasan?.kategori_jad?.lektor_kepala ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1 font-medium">
              Jenjang JAD 400, 550, 700
            </p>
          </div>
        </div>

        {/* Lektor */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lektor</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : ringkasan?.kategori_jad?.lektor ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Jenjang JAD 200, 300
            </p>
          </div>
        </div>

        {/* Asisten Ahli */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asisten Ahli</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : ringkasan?.kategori_jad?.asisten_ahli ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Jenjang JAD 100, 150
            </p>
          </div>
        </div>

        {/* Guru Besar & Serdos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profesor & Serdos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : ringkasan?.kategori_jad?.guru_besar ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Serdos: <strong className="text-slate-800">{ringkasan?.serdos?.sudah_serdos ?? 0} Dosen</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Indikator Filter Aktif (Jika Ada) */}
      {(filters.tmt_start || filters.tmt_end || filters.jabatan_fungsional_id || filters.unit_kerja_id || filters.search) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--module-primary-subtle,#f8fafc)] border border-slate-200 rounded-lg text-xs">
          <span className="font-semibold text-slate-800">Filter Aktif:</span>
          {filters.tmt_start && (
            <Badge variant="simpeg" className="text-2xs">
              TMT Mulai: {filters.tmt_start}
            </Badge>
          )}
          {filters.tmt_end && (
            <Badge variant="simpeg" className="text-2xs">
              TMT Selesai: {filters.tmt_end}
            </Badge>
          )}
          {filters.jabatan_fungsional_id && (
            <Badge variant="simpeg" className="text-2xs">
              JAD: {jafungList.find((j) => String(j.id) === String(filters.jabatan_fungsional_id))?.nama || filters.jabatan_fungsional_id}
            </Badge>
          )}
          {filters.unit_kerja_id && (
            <Badge variant="simpeg" className="text-2xs">
              Unit: {unitKerjaList.find((u) => String(u.id) === String(filters.unit_kerja_id))?.nama || filters.unit_kerja_id}
            </Badge>
          )}
          {filters.search && (
            <Badge variant="simpeg" className="text-2xs">
              Pencarian: &quot;{filters.search}&quot;
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilter}
            className="ml-auto text-xs text-[var(--module-primary,#4f46e5)] hover:underline font-semibold p-0 h-auto"
          >
            Reset Semua
          </Button>
        </div>
      )}

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        emptyMessage="Tidak ditemukan data pegawai yang sesuai dengan parameter filter yang dipilih."
      />

      {/* Filter Drawer Sesuai Standar SSO/IAM */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Filter Analitik Pegawai"
        width="420px"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-[var(--module-primary,#4f46e5)] text-white"
              onClick={() => {
                setIsDrawerOpen(false);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Pencarian Teks */}
          <Input
            label="Pencarian Bebas"
            placeholder="Cari nama dosen, NIP, NIDN, atau nomor SK..."
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />

          {/* Rentang Tanggal TMT */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Rentang Tanggal TMT Jabatan Akademik (JAD)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Tanggal Awal"
                type="date"
                value={filters.tmt_start || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, tmt_start: e.target.value }))}
              />
              <Input
                label="Tanggal Akhir"
                type="date"
                value={filters.tmt_end || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, tmt_end: e.target.value }))}
              />
            </div>
            <p className="text-2xs text-slate-500">
              Memilah pegawai yang TMT penetapan jabatan akademiknya berada pada rentang ini.
            </p>
          </div>

          {/* Jabatan Fungsional Akademik (JAD) */}
          <Select
            label="Jabatan Akademik (JAD)"
            value={String(filters.jabatan_fungsional_id || '')}
            onChange={(e) => setFilters((prev) => ({ ...prev, jabatan_fungsional_id: e.target.value }))}
            options={jafungOptions}
          />

          {/* Unit Kerja / Program Studi */}
          <Select
            label="Program Studi / Unit Kerja"
            value={String(filters.unit_kerja_id || '')}
            onChange={(e) => setFilters((prev) => ({ ...prev, unit_kerja_id: e.target.value }))}
            options={unitKerjaOptions}
          />

          {/* Jenis Pegawai */}
          <Select
            label="Jenis Pegawai"
            value={String(filters.jenis_pegawai || '')}
            onChange={(e) => setFilters((prev) => ({ ...prev, jenis_pegawai: e.target.value }))}
            options={JENIS_PEGAWAI_OPTIONS}
          />

          {/* Status Sertifikasi Dosen (Serdos) */}
          <Select
            label="Status Sertifikasi Dosen (Serdos)"
            value={String(filters.is_serdos || '')}
            onChange={(e) => setFilters((prev) => ({ ...prev, is_serdos: e.target.value }))}
            options={SERDOS_OPTIONS}
          />

          {/* Sorting */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Select
              label="Urutkan Berdasarkan"
              value={String(filters.sort_by || 'created_at')}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort_by: e.target.value }))}
              options={SORT_BY_ANALITIK_OPTIONS}
            />
            <Select
              label="Arah Urutan"
              value={String(filters.sort_order || 'desc')}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort_order: e.target.value }))}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
