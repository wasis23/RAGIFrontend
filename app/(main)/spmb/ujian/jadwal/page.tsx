'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Filter, Calendar, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import Link from 'next/link';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JadwalUjianPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [gelombangOptions, setGelombangOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filterGelombang, setFilterGelombang] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  useEffect(() => {
    fetchData();
    fetchGelombang();
  }, []);

  const fetchGelombang = async () => {
    try {
      const res = await api.get('/spmb/gelombang');
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      const options = Array.isArray(list)
        ? list.map((g: any) => ({
            value: String(g.id),
            label: g.nama,
          }))
        : [];
      setGelombangOptions(options);
    } catch {
      // Ignore fallback
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setIsForbidden(false);
    try {
      const res = await api.get('/spmb/ujian/jadwal', {
        params: {
          gelombang_id: filterGelombang || undefined,
          order_by: filterOrderBy,
          order_dir: filterOrderDir,
        },
      });
      const rawData = res.data?.data?.data || res.data?.data || res.data || [];
      setData(rawData);
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.response?.status === 404 || error?.status === 403) {
        setIsForbidden(true);
      } else {
        toast.error('Gagal mengambil data jadwal.');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    fetchData();
  };

  const resetFilters = () => {
    setFilterGelombang('');
    setFilterOrderBy('tanggal');
    setFilterOrderDir('desc');
    setIsFilterOpen(false);
    fetchData();
  };

  const columns = [
    { key: 'nama_sesi', label: 'NAMA SESI' },
    {
      key: 'gelombang_penerimaan',
      label: 'GELOMBANG',
      render: (row: any) => row.gelombang_penerimaan?.nama || `Gelombang #${row.gelombang_id}`,
    },
    {
      key: 'tipe_ujian',
      label: 'TIPE UJIAN',
      render: (row: any) => (
        <span className="badge badge-indigo capitalize text-xs font-bold">
          {row.tipe_ujian === 'tulis' ? 'Ujian Tulis (CBT)' : row.tipe_ujian}
        </span>
      ),
    },
    { key: 'tanggal', label: 'TANGGAL UJIAN' },
    {
      key: 'waktu',
      label: 'WAKTU',
      render: (row: any) => (
        <span className="font-mono text-xs text-slate-700">
          {row.jam_mulai} - {row.jam_selesai}
        </span>
      ),
    },
    {
      key: 'kapasitas',
      label: 'KAPASITAS',
      render: (row: any) => (
        <span className="font-bold text-slate-900">{row.kapasitas} Peserta</span>
      ),
    },
  ];

  if (isForbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-2xs">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-1">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm max-w-md mb-6">
          Halaman ini tidak tersedia atau Anda tidak memiliki hak akses yang dikonfigurasikan untuk role Anda.
        </p>
        <Button variant="primary" onClick={() => router.push('/spmb/dashboard')}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Jadwal Ujian / CBT"
        description="Kelola jadwal ujian dan kapasitas ruangan untuk ujian seleksi masuk"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
              icon={<Filter size={16} />}
              className="font-bold min-h-[40px]"
            >
              Filter &amp; Urutkan
            </Button>
            <Link
              href="/spmb/ujian/jadwal/create"
              className="btn btn-primary inline-flex items-center gap-2 font-bold min-h-[40px] px-4 shadow-sm"
            >
              <Plus size={16} />
              <span>Buat Jadwal Ujian</span>
            </Link>
          </div>
        }
      />

      <DataTable data={data} isLoading={loading} columns={columns} />

      {/* ── Filter Drawer (Sesuai admin_filter_standard & Spacious Layout) ── */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter & Urutkan Jadwal"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset Filter
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={applyFilters}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Section 1: Filter Parameter */}
          <div className="space-y-4">
            <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              Parameter Filter
            </h4>
            <Select
              label="Gelombang Penerimaan"
              value={filterGelombang}
              onChange={(val) => setFilterGelombang(val as string)}
              options={[
                { value: '', label: 'Semua Gelombang Penerimaan' },
                ...gelombangOptions,
              ]}
            />
          </div>

          <hr className="border-t border-slate-200" />

          {/* Section 2: Sorting Parameter (Spacious Select Controls) */}
          <div className="space-y-4">
            <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              Pengurutan Data
            </h4>
            <div className="space-y-4">
              <Select
                label="Urut Berdasarkan"
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val as string)}
                options={[
                  { value: 'tanggal', label: 'Tanggal Pelaksanaan Ujian' },
                  { value: 'id', label: 'ID Jadwal Ujian' },
                  { value: 'nama_sesi', label: 'Nama Sesi Ujian' },
                  { value: 'kapasitas', label: 'Kapasitas Ruangan' },
                ]}
              />

              <Select
                label="Arah Urutan Data"
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir(val as string)}
                options={[
                  { value: 'desc', label: 'Terbaru ke Terlama (Z - A)' },
                  { value: 'asc', label: 'Terlama ke Terbaru (A - Z)' },
                ]}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
