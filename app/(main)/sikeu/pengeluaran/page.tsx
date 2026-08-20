'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Filter, TrendingDown, RefreshCw, Eye, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface PengeluaranItem {
  id: number;
  kode: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  kas_asal: string;
  nominal_gross: number;
  nominal_pajak: number;
  nominal_net: number;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function PengeluaranListPage() {
  const [data, setData] = useState<PengeluaranItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', kategori: 'all' });

  const fetchPengeluaran = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPengeluaranList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(list);
    } catch {
      setData([]);
      toast.error('Gagal memuat data pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengeluaran();
  }, []);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, kategori: filterKategori });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKategori('all');
    setAppliedFilters({ search: '', kategori: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.kode?.toLowerCase().includes(q) && !item.keterangan?.toLowerCase().includes(q) && !item.kategori?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.kategori !== 'all' && item.kategori !== appliedFilters.kategori) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const totalGross = useMemo(() => filteredData.reduce((acc, i) => acc + (i.nominal_gross || 0), 0), [filteredData]);
  const totalNet = useMemo(() => filteredData.reduce((acc, i) => acc + (i.nominal_net || 0), 0), [filteredData]);

  const columns: ColumnDef<PengeluaranItem>[] = [
    {
      key: 'kode',
      label: 'KODE & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.kode || `EXP-${row.id}`}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">{row.tanggal || '-'}</span>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI & KETERANGAN',
      render: (row) => (
        <div>
          <span className="badge badge-purple text-xs font-bold uppercase">{row.kategori || 'Operasional'}</span>
          <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-1">{row.keterangan}</p>
        </div>
      ),
    },
    {
      key: 'kas_asal',
      label: 'KAS / REKENING ASAL',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.kas_asal || 'Kas Utama Rektorat'}</span>
      ),
    },
    {
      key: 'nominal_gross',
      label: 'GROSS (RP)',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_gross || 0)}
        </span>
      ),
    },
    {
      key: 'nominal_net',
      label: 'NET BIAYA (RP)',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums text-sm">
          {formatRupiah(row.nominal_net || 0)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Daftar Pengeluaran & Beban Kampus"
        description="Pencatatan transaksi pengeluaran operasional, vendor, honorarium & potongan pajak PPh/PPN."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Link href="/sikeu/pengeluaran/create">
              <Button variant="primary" icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
                Input Pengeluaran Baru
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Gross Pengeluaran</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalGross)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Net (Sesudah Pajak)</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalNet)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data pengeluaran." />

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Pengeluaran Kampus" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Kode Transaksi / Keterangan" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Kategori Pengeluaran"
            value={filterKategori}
            onChange={(val) => setFilterKategori(val as string)}
            options={[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'operasional', label: 'Operasional Kantor' },
              { value: 'gaji', label: 'Payroll / Gaji Staf' },
              { value: 'pembelian', label: 'Pembelian Aset / Alat' },
              { value: 'praktikum', label: 'Bahan Praktikum' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
