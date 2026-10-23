'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { useObeFilterContext } from '@/lib/obe-settings';
import {
  Award,
  Filter,
  Download,
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama_kelas', label: 'Nama Kelas' },
  { value: 'kode_kelas', label: 'Kode Kelas' },
  { value: 'created_at', label: 'Waktu Dibuat' },
  { value: 'id', label: 'ID' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'Menaik (A-Z)' },
  { value: 'desc', label: 'Menurun (Z-A)' },
];

export default function SiakadNilaiPortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    settings: obeSettings,
    loadTahunAkademikOptions,
    getActiveTaLabel,
  } = useObeFilterContext();

  const [kelasItems, setKelasItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTahunAkademikId, setFilterTahunAkademikId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_kelas');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    tahunAkademikId: '',
    sortBy: 'nama_kelas',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  // Sinkronkan default Tahun Akademik dari preferensi OBE jika tersedia
  useEffect(() => {
    if (obeSettings?.tahun_akademik_id && !appliedFilters.tahunAkademikId) {
      const taIdStr = String(obeSettings.tahun_akademik_id);
      setFilterTahunAkademikId(taIdStr);
      setAppliedFilters((prev) => ({
        ...prev,
        tahunAkademikId: taIdStr,
      }));
    }
  }, [obeSettings?.tahun_akademik_id, appliedFilters.tahunAkademikId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        my_teaching_only: 1, // Fokus utama pada kelas ajar dosen
      };

      const activeTaId = appliedFilters.tahunAkademikId || obeSettings?.tahun_akademik_id;
      if (activeTaId) {
        params.tahun_akademik_id = Number(activeTaId);
      }
      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }

      const res = await siakadService.getKelas(params);
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      setKelasItems(list);
      setMeta(res?.meta || (raw?.meta ?? null));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat jadwal kelas mengajar');
      setKelasItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedFilters, obeSettings?.tahun_akademik_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      tahunAkademikId: filterTahunAkademikId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    const defaultTa = obeSettings?.tahun_akademik_id ? String(obeSettings.tahun_akademik_id) : '';
    setFilterTahunAkademikId(defaultTa);
    setFilterSortBy('nama_kelas');
    setFilterSortDir('asc');
    setAppliedFilters({
      search: '',
      tahunAkademikId: defaultTa,
      sortBy: 'nama_kelas',
      sortDir: 'asc',
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleDownloadRekap = async (kelasItem: any) => {
    try {
      setDownloadingId(kelasItem.id);
      const blob = await siakadService.downloadRekapXlsx(kelasItem.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `rekap_nilai_${kelasItem.kode_kelas || kelasItem.id}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rekap nilai kelas berhasil diunduh (XLSX)');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunduh berkas rekap nilai');
    } finally {
      setDownloadingId(null);
    }
  };

  const activeTaDisplay =
    appliedFilters.tahunAkademikId
      ? getActiveTaLabel(appliedFilters.tahunAkademikId) || `Tahun Akademik #${appliedFilters.tahunAkademikId}`
      : (obeSettings?.tahun_akademik_label || 'Semua Periode');

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: 'no',
        label: '#',
        align: 'center',
        render: (_, index) => {
          const from = meta?.from ?? (page - 1) * limit + 1;
          return <span className="text-2xs font-mono font-bold text-slate-500">{from + index}</span>;
        },
      },
      {
        key: 'mata_kuliah',
        label: 'Mata Kuliah & Kelas',
        render: (row) => {
          const mk = row.mata_kuliah;
          const kodeMk = mk?.kode_mk || '-';
          const namaMk = mk?.nama || 'Mata Kuliah';
          const prodiName = row.program_studi?.nama || mk?.kurikulum?.program_studi?.nama || '-';

          return (
            <div className="space-y-0.5 max-w-[280px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black text-slate-900">{kodeMk}</span>
                <span className="text-xs font-bold text-slate-800">• {row.nama_kelas || row.kode_kelas}</span>
                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-2xs font-bold">
                  {mk?.total_sks || 0} SKS
                </span>
              </div>
              <p className="text-2xs font-semibold text-slate-600 truncate" title={namaMk}>
                {namaMk}
              </p>
              <p className="text-2xs text-slate-400 font-medium">Prodi: {prodiName}</p>
            </div>
          );
        },
      },
      {
        key: 'jadwal',
        label: 'Jadwal & Ruang',
        render: (row) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-2xs font-bold text-slate-800">
              <Clock size={12} className="text-[var(--module-primary)] shrink-0" />
              <span>{row.hari || '-'}, {row.jam_mulai || '--:--'} - {row.jam_selesai || '--:--'}</span>
            </div>
            <p className="text-2xs text-slate-500 font-medium">
              Ruang: {row.ruangan?.nama || row.ruangan?.kode || 'Online / Virtual'}
            </p>
          </div>
        ),
      },
      {
        key: 'peserta',
        label: 'Peserta KRS',
        align: 'center',
        render: (row) => {
          const count = row.krs_details_aktif_count ?? row.krs_details_count ?? 0;
          const kapasitas = row.kapasitas || 0;
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
              <Users size={12} className="text-slate-500" />
              <span className="text-xs font-bold font-mono text-slate-800">
                {count} / {kapasitas}
              </span>
            </div>
          );
        },
      },
      {
        key: 'status_penilaian',
        label: 'Status Penilaian',
        align: 'center',
        render: (row) => {
          const mode = row.tahun_akademik?.mode_penilaian || 'semi_obe';
          return (
            <div className="flex flex-col items-center gap-1">
              <Badge variant="purple" className="text-2xs font-black uppercase">
                {mode === 'full_obe' ? 'Pure OBE (CPMK)' : mode === 'semi_obe' ? 'Hybrid OBE' : 'Konvensional'}
              </Badge>
              <span className="text-2xs text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500" />
                Matriks Siap
              </span>
            </div>
          );
        },
      },
      {
        key: 'opsi',
        label: 'Opsi / Penilaian',
        align: 'right',
        render: (row) => {
          const isDownloading = downloadingId === row.id;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu
                items={[
                  {
                    label: 'Input Nilai OBE (Matriks)',
                    icon: <Award size={14} />,
                    onClick: () => router.push(`/siakad/nilai/input/${row.id}`),
                  },
                  {
                    label: isDownloading ? 'Mengunduh...' : 'Unduh Rekap Nilai (XLSX)',
                    icon: <Download size={14} />,
                    disabled: isDownloading,
                    onClick: () => handleDownloadRekap(row),
                  },
                  {
                    label: 'Jadwal & Absensi Kelas',
                    icon: <CalendarCheck size={14} />,
                    onClick: () => router.push(`/siakad/perkuliahan/kelas/${row.id}/absensi`),
                  },
                  {
                    label: 'Dokumen RPS Kelas',
                    icon: <ExternalLink size={14} />,
                    onClick: () => router.push(`/siakad/perkuliahan/kelas/${row.id}/rps`),
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [meta, page, limit, downloadingId, router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penilaian Perkuliahan & Asesmen OBE"
        description="Portal terpadu dosen pengampu untuk input nilai instrumen CPMK, kalkulasi otomatis nilai akhir KHS, dan unduh rekap nilai perkuliahan."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Penilaian Perkuliahan' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="text-xs font-bold"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Banner Konteks Tahun Akademik */}
      <Card className="p-4 bg-white border rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--module-primary-subtle)] text-[var(--module-primary)]">
              <CalendarCheck size={20} />
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wider font-extrabold text-slate-400">Periode Akademik Aktif</p>
              <h3 className="text-sm font-extrabold text-slate-900">{activeTaDisplay}</h3>
              <p className="text-2xs text-slate-500 mt-0.5">
                Menampilkan daftar mata kuliah dan kelas yang Anda ampu pada periode ini.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              icon={<Award size={13} />}
              className="text-2xs font-bold py-1 px-3 h-8"
              onClick={() => router.push('/siakad/khs')}
            >
              Monitoring Pengesahan KHS
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabel Kelas Pengajaran */}
      <Card className="p-0 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen size={15} className="text-[var(--module-primary)]" />
              Daftar Kelas Perkuliahan Anda
            </h4>
            <p className="text-2xs text-slate-500 mt-0.5">
              Pilih kelas untuk menginputkan nilai komponen CPMK secara langsung ke server.
            </p>
          </div>
          {appliedFilters.search && (
            <Badge variant="blue" className="text-2xs">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </Badge>
          )}
        </div>

        <DataTable
          columns={columns}
          data={kelasItems}
          isLoading={loading}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          emptyMessage="Tidak ada jadwal kelas mengajar yang ditemukan pada periode akademik ini."
        />
      </Card>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Kelas Penilaian"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="secondary" onClick={handleResetFilter} className="w-1/2 text-xs font-bold">
              Reset Filter
            </Button>
            <Button variant="primary" onClick={handleApplyFilter} className="w-1/2 text-xs font-bold">
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Cari Nama Kelas / Mata Kuliah"
            placeholder="Ketik kode atau nama..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <AsyncSelect
            label="Tahun Akademik"
            placeholder="Pilih Tahun Akademik..."
            loadOptions={loadTahunAkademikOptions}
            value={filterTahunAkademikId}
            onChange={(val) => setFilterTahunAkademikId(val || '')}
            defaultOptions
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={filterSortBy}
              options={SORT_BY_OPTIONS}
              onChange={(e) => setFilterSortBy(e.target.value)}
            />
            <Select
              label="Arah Urutan"
              value={filterSortDir}
              options={SORT_DIR_OPTIONS}
              onChange={(e) => setFilterSortDir(e.target.value as 'asc' | 'desc')}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
