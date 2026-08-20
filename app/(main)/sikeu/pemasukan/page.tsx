'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Plus, Filter, CheckCircle2, Building, Handshake, Gift, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PemasukanKampus } from '@/types/sikeu.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyText } from '@/components/sikeu/akuntansi/atoms/CurrencyText';
import { DateText } from '@/components/sikeu/akuntansi/atoms/DateText';

export default function PemasukanListPage() {
  const [data, setData] = useState<PemasukanKampus[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSumber, setFilterSumber] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', sumber: 'all' });

  const fetchPemasukan = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPemasukanList();
      const list = Array.isArray(res.data) ? res.data : [];
      setData(list);
    } catch {
      setData([]);
      toast.error('Gagal memuat data pemasukan kampu non-akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemasukan();
  }, []);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, sumber: filterSumber });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSumber('all');
    setAppliedFilters({ search: '', sumber: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (
          !item.nomor_transaksi?.toLowerCase().includes(q) &&
          !item.nama_donor_instansi?.toLowerCase().includes(q) &&
          !item.keterangan?.toLowerCase().includes(q)
        )
          return false;
      }
      if (appliedFilters.sumber !== 'all' && item.sumber_pemasukan !== appliedFilters.sumber)
        return false;
      return true;
    });
  }, [data, appliedFilters]);

  // Summaries
  const totalHibah = useMemo(
    () =>
      filteredData
        .filter((i) => i.sumber_pemasukan === 'hibah_sippm')
        .reduce((sum, i) => sum + (Number(i.nominal) || 0), 0),
    [filteredData]
  );

  const totalDonasi = useMemo(
    () =>
      filteredData
        .filter((i) => i.sumber_pemasukan !== 'hibah_sippm')
        .reduce((sum, i) => sum + (Number(i.nominal) || 0), 0),
    [filteredData]
  );

  const totalKeseluruhan = totalHibah + totalDonasi;

  const columns: ColumnDef<PemasukanKampus>[] = [
    {
      key: 'nomor_transaksi',
      label: 'NO TRANSAKSI & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_transaksi}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">
            <DateText dateString={row.tanggal_terima} format="short" />
          </span>
        </div>
      ),
    },
    {
      key: 'sumber_pemasukan',
      label: 'SUMBER PEMASUKAN',
      render: (row) => (
        <span className="badge badge-purple text-xs font-bold uppercase">
          {row.sumber_pemasukan?.replace('_', ' ') || 'Lainnya'}
        </span>
      ),
    },
    {
      key: 'nama_donor_instansi',
      label: 'DONOR / INSTANSI MITRA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_donor_instansi}</p>
          {row.nomor_kontrak_ref && (
            <p className="font-mono text-2xs text-slate-400">Ref: {row.nomor_kontrak_ref}</p>
          )}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL DITERIMA (RP)',
      render: (row) => (
        <CurrencyText value={row.nominal} prefix="+" variant="positive" size="sm" />
      ),
    },
    {
      key: 'status',
      label: 'STATUS JURNAL',
      render: () => (
        <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Auto-Posted
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Pemasukan Non-Akademik & Dana Hibah"
        description="Pencatatan penerimaan hibah riset (SIPPM), donasi mitra, kerjasama instansi, dan pendapatan non-mahasiswa."
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
            <Link href="/sikeu/pemasukan/create">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                className="font-bold min-h-[40px] px-4 shadow-sm"
              >
                Catat Pemasukan Baru
              </Button>
            </Link>
          </div>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Hibah Riset (SIPPM)</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              <CurrencyText value={totalHibah} prefix="+" variant="positive" size="lg" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Gift size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Donasi & Kerjasama Mitra</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              <CurrencyText value={totalDonasi} prefix="+" variant="positive" size="lg" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Handshake size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pemasukan Non-Akademik</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
              <CurrencyText value={totalKeseluruhan} prefix="none" variant="neutral" size="lg" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data pencatatan pemasukan non-akademik."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pemasukan Non-Akademik"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Cari No Transaksi / Donor / Instansi"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Sumber Pemasukan"
            value={filterSumber}
            onChange={(val) => setFilterSumber(val as string)}
            options={[
              { value: 'all', label: 'Semua Sumber Pemasukan' },
              { value: 'hibah_sippm', label: 'Hibah Riset / PkM (SIPPM)' },
              { value: 'donatur', label: 'Donatur & Beasiswa Mitra' },
              { value: 'kerjasama', label: 'Kerjasama Industri / Instansi' },
              { value: 'pendapatan_lainnya', label: 'Pendapatan Non-Akademik Lainnya' },
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
}
