'use client';

import { formatRupiah } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Filter, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, ShieldAlert, FileSpreadsheet, UserX, FileText, Eye
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
import { DropdownMenu } from '@/components/ui/DropdownMenu';

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



export default function PiutangMahasiswaPage() {
  const router = useRouter();
  const [data, setData] = useState<PiutangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);

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
  const [filterProdi, setFilterProdi] = useState('all');
  const [filterCutoffDate, setFilterCutoffDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('piutang');
  const [filterTahunAkademik, setFilterTahunAkademik] = useState('all');
  const [filterSortBy, setFilterSortBy] = useState('sisa_piutang');
  const [filterSortOrder, setFilterSortOrder] = useState('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    angkatan: 'all',
    prodi: 'all',
    cutoff_date: '',
    status: 'piutang',
    tahun_akademik_id: 'all',
    sort_by: 'sisa_piutang',
    sort_order: 'desc',
  });

  useEffect(() => {
    const loadProdi = async () => {
      try {
        const res = await sikeuService.getProgramStudiList();
        if (Array.isArray(res.data)) {
          setProdiList(
            res.data.map((p: any) => ({
              value: String(p.id),
              label: p.jenjang ? `${p.jenjang} - ${p.nama || p.nama_prodi}` : (p.nama || p.nama_prodi),
            }))
          );
        }
      } catch {
        // Fallback
      }
    };
    loadProdi();
  }, []);

  const fetchPiutang = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await sikeuService.getPiutangMahasiswa({
        page,
        per_page: pagination.per_page,
        search: appliedFilters.search,
        angkatan: appliedFilters.angkatan === 'all' ? undefined : appliedFilters.angkatan,
        program_studi_id: appliedFilters.prodi === 'all' ? undefined : appliedFilters.prodi,
        cutoff_date: appliedFilters.cutoff_date || undefined,
        status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        tahun_akademik_id: appliedFilters.tahun_akademik_id === 'all' ? undefined : appliedFilters.tahun_akademik_id,
        sort_by: appliedFilters.sort_by,
        sort_order: appliedFilters.sort_order,
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
      prodi: filterProdi,
      cutoff_date: filterCutoffDate,
      status: filterStatus,
      tahun_akademik_id: filterTahunAkademik,
      sort_by: filterSortBy,
      sort_order: filterSortOrder,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('all');
    setFilterProdi('all');
    setFilterCutoffDate('');
    setFilterStatus('piutang');
    setFilterTahunAkademik('all');
    setFilterSortBy('sisa_piutang');
    setFilterSortOrder('desc');
    setAppliedFilters({
      search: '',
      angkatan: 'all',
      prodi: 'all',
      cutoff_date: '',
      status: 'piutang',
      tahun_akademik_id: 'all',
      sort_by: 'sisa_piutang',
      sort_order: 'desc',
    });
    setShowFilter(false);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      await sikeuService.downloadPiutangExcel({
        search: appliedFilters.search,
        angkatan: appliedFilters.angkatan === 'all' ? undefined : appliedFilters.angkatan,
        program_studi_id: appliedFilters.prodi === 'all' ? undefined : appliedFilters.prodi,
        cutoff_date: appliedFilters.cutoff_date || undefined,
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
      key: 'nomor_tagihan',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_tagihan}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">Periode: {row.tahun_akademik || '-'}</span>
        </div>
      ),
    },
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN & PRODI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.program_studi}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'total_tagihan',
      label: 'TOTAL TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {formatRupiah(row.total_tagihan)}
          </span>
          {row.total_potongan > 0 && (
            <span className="text-2xs text-emerald-600 block mt-0.5 font-medium">
              Potongan: -{formatRupiah(row.total_potongan)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total_bayar',
      label: 'TERBAYAR',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums text-sm">
          {formatRupiah(row.total_bayar)}
        </span>
      ),
    },
    {
      key: 'sisa_piutang',
      label: 'SISA PIUTANG',
      render: (row) => (
        <div>
          <span className={`font-bold tabular-nums text-sm ${row.sisa_piutang > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
            {formatRupiah(row.sisa_piutang)}
          </span>
          {row.jatuh_tempo && (
            <span className="text-2xs text-slate-400 block mt-0.5">
              Jatuh Tempo: {row.jatuh_tempo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'lunas') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Lunas
            </span>
          );
        }
        if (row.status === 'sebagian') {
          return (
            <span className="badge badge-yellow text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Bayar Sebagian
            </span>
          );
        }
        if (row.has_dispensasi || row.status === 'dispensasi') {
          return (
            <span className="badge badge-orange text-xs font-bold inline-flex items-center gap-1">
              <AlertCircle size={12} /> Dispensasi
            </span>
          );
        }
        return (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Belum Bayar
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Detail Tagihan',
                icon: <Eye size={14} />,
                onClick: () => router.push(`/sikeu/tagihan/${row.id}`),
              },
            ]}
          />
        </div>
      ),
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
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Laporan & Rekapitulasi Piutang Mahasiswa"
        description="Pantau daftar tunggakan dan sisa pembayaran tagihan mahasiswa berdasarkan periode dan angkatan."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-2xs bg-primary-600 text-white rounded-full font-extrabold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
              onClick={() => fetchPiutang(pagination.current_page)}
              disabled={loading}
              className="font-bold min-h-[40px]"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={<FileSpreadsheet size={16} />}
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="font-bold min-h-[40px] px-4 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {downloading ? 'Mengunduh...' : 'Download Excel'}
            </Button>
          </div>
        }
      />



      {/* Cutoff Date Active Banner */}
      {appliedFilters.cutoff_date && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <span>
              Menampilkan Posisi Piutang per Tanggal Cutoff: <strong>{appliedFilters.cutoff_date}</strong>. Transaksi pembayaran setelah tanggal ini diabaikan dalam kalkulasi saldo sisa.
            </span>
          </div>
          <button
            onClick={() => {
              setFilterCutoffDate('');
              setAppliedFilters((prev) => ({ ...prev, cutoff_date: '' }));
            }}
            className="text-xs text-amber-900 font-bold underline hover:text-amber-950 shrink-0 ml-4"
          >
            Hapus Cutoff
          </button>
        </div>
      )}

      {/* Filter Badges Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-2xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-500">Filter Aktif:</span>
          {appliedFilters.search && (
            <span className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {appliedFilters.prodi !== 'all' && (
            <span className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
              Prodi: {prodiList.find((p) => p.value === appliedFilters.prodi)?.label || appliedFilters.prodi}
            </span>
          )}
          {appliedFilters.cutoff_date && (
            <span className="px-2 py-1 bg-amber-100 border border-amber-300 rounded-md font-bold text-amber-900">
              Cutoff: {appliedFilters.cutoff_date}
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
        meta={pagination}
        onPageChange={(p) => fetchPiutang(p)}
        emptyMessage="Tidak ada data piutang mahasiswa yang ditemukan."
      />

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
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
            <Select
              value={filterProdi}
              onChange={(val: any) => setFilterProdi(typeof val === 'object' && val?.target ? val.target.value : (val || 'all'))}
              options={[
                { value: 'all', label: 'Semua Program Studi' },
                ...prodiList,
              ]}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Cutoff Tanggal (Posisi Piutang)</label>
              <button
                type="button"
                onClick={() => setFilterCutoffDate(new Date().toISOString().split('T')[0])}
                className="text-2xs text-primary-600 font-bold hover:underline"
              >
                Set Hari Ini
              </button>
            </div>
            <Input
              type="date"
              value={filterCutoffDate}
              onChange={(e) => setFilterCutoffDate(e.target.value)}
            />
            <p className="text-2xs text-slate-400 mt-1">Hitung saldo piutang dan tagihan hanya sampai tanggal batas ini.</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urutkan Berdasarkan</label>
              <Select
                value={filterSortBy}
                onChange={(val: any) => setFilterSortBy(typeof val === 'object' && val?.target ? val.target.value : (val || 'sisa_piutang'))}
                options={[
                  { value: 'sisa_piutang', label: 'Sisa Piutang' },
                  { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                  { value: 'nim', label: 'NIM' },
                  { value: 'total_tagihan', label: 'Total Tagihan' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arah Urutan</label>
              <Select
                value={filterSortOrder}
                onChange={(val: any) => setFilterSortOrder(typeof val === 'object' && val?.target ? val.target.value : (val || 'desc'))}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z / Kecil-Besar)' },
                  { value: 'desc', label: 'Menurun (Z-A / Besar-Kecil)' },
                ]}
              />
            </div>
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
