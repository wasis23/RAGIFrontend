'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download, Filter, Search, RefreshCw, AlertCircle, CheckCircle2, Clock, ShieldAlert, FileSpreadsheet, UserX, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface PiutangItem {
  id: number;
  nomor_tagihan: string;
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  angkatan: number;
  program_studi: string;
  tahun_akademik_id: number | null;
  tahun_akademik: string;
  total_tagihan: number;
  total_potongan: number;
  total_denda: number;
  total_bayar: number;
  sisa_piutang: number;
  status: string;
  jatuh_tempo: string | null;
  created_at: string | null;
  has_dispensasi: boolean;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function PiutangMahasiswaPage() {
  const [data, setData] = useState<PiutangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Summary Metrics
  const [summary, setSummary] = useState({
    total_tagihan: 0,
    total_potongan: 0,
    total_denda: 0,
    total_bayar: 0,
    total_piutang: 0,
    total_mahasiswa_tunggakan: 0,
    total_record_dispensasi: 0,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('piutang');
  const [filterTahunAkademik, setFilterTahunAkademik] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    angkatan: 'all',
    status: 'piutang',
    tahun_akademik_id: 'all',
  });

  const fetchPiutang = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await sikeuService.getPiutangMahasiswa({
        page,
        per_page: pagination.per_page,
        search: appliedFilters.search,
        angkatan: appliedFilters.angkatan === 'all' ? undefined : appliedFilters.angkatan,
        status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        tahun_akademik_id: appliedFilters.tahun_akademik_id === 'all' ? undefined : appliedFilters.tahun_akademik_id,
      });

      if (res && res.data) {
        setData(res.data);
        if (res.meta) {
          setPagination({
            current_page: res.meta.current_page || 1,
            per_page: res.meta.per_page || 15,
            total: res.meta.total || 0,
            last_page: res.meta.last_page || 1,
          });
        }
        if ((res as any).summary) {
          setSummary((res as any).summary);
        }
      }
    } catch {
      toast.error('Gagal memuat data piutang mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pagination.per_page]);

  useEffect(() => {
    fetchPiutang(1);
  }, [appliedFilters, fetchPiutang]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      angkatan: filterAngkatan,
      status: filterStatus,
      tahun_akademik_id: filterTahunAkademik,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('all');
    setFilterStatus('piutang');
    setFilterTahunAkademik('all');
    setAppliedFilters({
      search: '',
      angkatan: 'all',
      status: 'piutang',
      tahun_akademik_id: 'all',
    });
    setShowFilter(false);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      await sikeuService.downloadPiutangExcel({
        search: appliedFilters.search,
        angkatan: appliedFilters.angkatan === 'all' ? undefined : appliedFilters.angkatan,
        status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        tahun_akademik_id: appliedFilters.tahun_akademik_id === 'all' ? undefined : appliedFilters.tahun_akademik_id,
      });
      toast.success('Laporan Piutang Excel berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh file Excel piutang');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: string, hasDispensasi: boolean) => {
    if (hasDispensasi || status === 'dispensasi') {
      return (
        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
          <Clock size={12} /> Dispensasi
        </span>
      );
    }
    switch (status) {
      case 'lunas':
        return (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Lunas
          </span>
        );
      case 'sebagian':
        return (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> Bayar Sebagian
          </span>
        );
      case 'belum_bayar':
      default:
        return (
          <span className="badge bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1">
            <AlertCircle size={12} /> Belum Bayar
          </span>
        );
    }
  };

  const columns: ColumnDef<PiutangItem>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA & NIM',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama_mahasiswa}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-slate-500 font-semibold">{row.nim}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
              Angkatan {row.angkatan}
            </span>
          </div>
          <span className="text-2xs text-slate-400 block mt-0.5">{row.program_studi}</span>
        </div>
      ),
    },
    {
      key: 'nomor_tagihan',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_tagihan}
          </span>
          <span className="text-2xs block text-slate-400 font-medium mt-1">
            Period: {row.tahun_akademik}
          </span>
        </div>
      ),
    },
    {
      key: 'total_tagihan',
      label: 'TOTAL TAGIHAN (RP)',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-700 tabular-nums text-xs">
            {formatRupiah(row.total_tagihan)}
          </span>
          {row.total_potongan > 0 && (
            <span className="text-2xs text-emerald-600 block">
              Potongan: -{formatRupiah(row.total_potongan)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total_bayar',
      label: 'TERBAYAR (RP)',
      render: (row) => (
        <span className="font-semibold text-emerald-700 tabular-nums text-xs">
          {formatRupiah(row.total_bayar)}
        </span>
      ),
    },
    {
      key: 'sisa_piutang',
      label: 'SISA PIUTANG (RP)',
      render: (row) => (
        <div>
          <span className={`font-extrabold tabular-nums text-sm ${row.sisa_piutang > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
            {formatRupiah(row.sisa_piutang)}
          </span>
          {row.jatuh_tempo && (
            <span className="text-2xs text-slate-400 block">
              Jatuh Tempo: {row.jatuh_tempo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => getStatusBadge(row.status, row.has_dispensasi),
    },
  ];

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.angkatan !== 'all') count++;
    if (appliedFilters.status !== 'piutang') count++;
    if (appliedFilters.tahun_akademik_id !== 'all') count++;
    return count;
  }, [appliedFilters]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        title="Laporan & Rekapitulasi Piutang Mahasiswa"
        description="Pantau daftar tunggakan dan sisa pembayaran tagihan mahasiswa berdasarkan periode dan angkatan."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
              onClick={() => fetchPiutang(pagination.current_page)}
              disabled={loading}
              className="font-bold"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={<FileSpreadsheet size={16} />}
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {downloading ? 'Mengunduh...' : 'Download Excel'}
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-rose-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Total Nominal Piutang</p>
            <p className="text-xl font-extrabold text-rose-700 mt-1 tabular-nums">
              {formatRupiah(summary.total_piutang)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mahasiswa Menunggak</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {summary.total_mahasiswa_tunggakan} <span className="text-xs font-medium text-slate-500">Mhs</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Terbayar</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {formatRupiah(summary.total_bayar)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Dispensasi</p>
            <p className="text-xl font-extrabold text-blue-700 mt-1 tabular-nums">
              {summary.total_record_dispensasi} <span className="text-xs font-medium text-slate-500">Tagihan</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5 space-y-4">
        {/* Search & Filter Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari NIM / Nama Mahasiswa..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilter();
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Quick Angkatan Filter */}
            <select
              value={filterAngkatan}
              onChange={(e) => {
                setFilterAngkatan(e.target.value);
                setAppliedFilters((prev) => ({ ...prev, angkatan: e.target.value }));
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">Semua Angkatan</option>
              <option value="2026">Angkatan 2026</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2023">Angkatan 2023</option>
              <option value="2022">Angkatan 2022</option>
            </select>

            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold relative"
            >
              Filter Advanced
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-2xs bg-primary-600 text-white rounded-full font-extrabold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Badges Display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-2xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-500">Filter Aktif:</span>
            {appliedFilters.search && (
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
                Pencarian: &quot;{appliedFilters.search}&quot;
              </span>
            )}
            {appliedFilters.angkatan !== 'all' && (
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
                Angkatan: {appliedFilters.angkatan}
              </span>
            )}
            {appliedFilters.status !== 'piutang' && (
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
                Status: {appliedFilters.status}
              </span>
            )}
            <button
              onClick={handleResetFilter}
              className="text-xs text-rose-600 font-bold hover:underline ml-auto"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* DataTable */}
        <DataTable
          data={data}
          isLoading={loading}
          columns={columns}
          emptyMessage="Tidak ada data piutang mahasiswa yang ditemukan."
        />
      </div>

      {/* Filter Drawer Slide-Out */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Piutang Mahasiswa">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari NIM / Nama Mahasiswa</label>
            <Input
              placeholder="Masukkan NIM atau Nama..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Filter Tahun Angkatan</label>
            <Select
              value={filterAngkatan}
              onChange={(val: any) => setFilterAngkatan(typeof val === 'object' && val?.target ? val.target.value : (val || 'all'))}
              options={[
                { value: 'all', label: 'Semua Angkatan' },
                { value: '2026', label: 'Angkatan 2026' },
                { value: '2025', label: 'Angkatan 2025' },
                { value: '2024', label: 'Angkatan 2024' },
                { value: '2023', label: 'Angkatan 2023' },
                { value: '2022', label: 'Angkatan 2022' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembayaran</label>
            <Select
              value={filterStatus}
              onChange={(val: any) => setFilterStatus(typeof val === 'object' && val?.target ? val.target.value : (val || 'piutang'))}
              options={[
                { value: 'piutang', label: 'Semua Piutang (Belum Lunas)' },
                { value: 'belum_bayar', label: 'Belum Bayar' },
                { value: 'sebagian', label: 'Bayar Sebagian' },
                { value: 'dispensasi', label: 'Dispensasi' },
                { value: 'lunas', label: 'Lunas' },
                { value: 'all', label: 'Semua Status (Termasuk Lunas)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" className="flex-1 font-bold" onClick={handleApplyFilter}>
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
