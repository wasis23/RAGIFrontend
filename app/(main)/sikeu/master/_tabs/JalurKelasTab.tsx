'use client';

import { useState, useEffect, useMemo } from 'react';
import { Filter, Info, CheckCircle2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface JalurKelas {
  id: number;
  kode?: string;
  nama_jalur: string;
  deskripsi?: string;
  is_active?: boolean;
  sumber?: string;
}

export interface JalurKelasTabProps {
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function JalurKelasTab({ setHeaderAction }: JalurKelasTabProps = {}) {
  const [data, setData] = useState<JalurKelas[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_jalur');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    sortBy: 'nama_jalur',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getJalurKelasList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data master jalur kelas dari SPMB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSortBy('nama_jalur');
    setFilterSortDir('asc');
    setAppliedFilters({
      search: '',
      sortBy: 'nama_jalur',
      sortDir: 'asc',
    });
    setShowFilter(false);
  };

  const isFiltered = Boolean(appliedFilters.search);

  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilter(true)}
            icon={<Filter size={16} />}
            className="font-bold min-h-[38px] text-xs"
          >
            Filter
            {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-1"></span>}
          </Button>
        </div>
      );
    }
  }, [setHeaderAction, isFiltered]);

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        return (
          item.nama_jalur?.toLowerCase().includes(q) ||
          item.deskripsi?.toLowerCase().includes(q) ||
          item.kode?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.sortBy as keyof JalurKelas] ?? '';
      let valB: any = b[appliedFilters.sortBy as keyof JalurKelas] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<JalurKelas>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) =>
        row.kode ? (
          <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md uppercase">
            {row.kode}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: 'nama_jalur',
      label: 'NAMA JALUR / KELAS',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_jalur}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'sumber',
      label: 'SUMBER DATA',
      render: () => (
        <span className="badge badge-purple text-xs font-bold inline-flex items-center gap-1">
          <Layers size={12} /> Modul SPMB
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) =>
        row.is_active !== false ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            Non-Aktif
          </span>
        ),
    },
  ];

  return (
    <>
      {!setHeaderAction && (
        <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilter(true)}
            icon={<Filter size={16} />}
            className="font-bold min-h-[38px] text-xs"
          >
            Filter
            {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-1"></span>}
          </Button>
        </div>
      )}

      {/* Info Banner Integrasi SPMB */}
      <div className="p-4 bg-primary-50/60 border border-primary-200/80 rounded-2xl flex items-start gap-3 text-xs text-primary-950">
        <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">Master Jalur Masuk Terpusat dari Modul SPMB</span>
          <span>
            Data master tipe jalur pendaftaran dan kelas dikelola secara terpusat oleh panitia di <strong>Modul SPMB</strong>. Modul Keuangan (SIKEU) secara otomatis mengambil dan menyelaraskan data ini sebagai acuan tarif UKT dan penagihan mahasiswa tanpa perlu konfigurasi ganda.
          </span>
        </div>
      </div>

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data master jalur kelas dari SPMB."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jalur Kelas"
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
            label="Cari Nama atau Kode Jalur"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pengurutan Data</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urutkan Berdasarkan"
                value={filterSortBy}
                onChange={(val) => setFilterSortBy(val as string)}
                options={[
                  { value: 'nama_jalur', label: 'Nama Jalur' },
                  { value: 'kode', label: 'Kode Jalur' },
                  { value: 'id', label: 'ID Jalur' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={filterSortDir}
                onChange={(val) => setFilterSortDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z)' },
                  { value: 'desc', label: 'Menurun (Z-A)' },
                ]}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

