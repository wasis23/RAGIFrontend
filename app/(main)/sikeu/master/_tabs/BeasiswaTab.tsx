'use client';

import { useState, useEffect, useMemo } from 'react';
import { Filter, Info, CheckCircle2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatRupiah } from '@/lib/utils';

interface Beasiswa {
  id: number;
  kode: string;
  nama: string;
  sumber: string;
  tipe_potongan: string;
  nilai_potongan: number;
  jenis_biaya_ids: number[];
  jenis_biaya?: { id: number; nama: string; kode: string }[];
  berlaku_angkatan_mulai?: number;
  berlaku_angkatan_sampai?: number;
  deskripsi?: string;
  is_active?: boolean;
}

export interface BeasiswaTabProps {
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function BeasiswaTab({ setHeaderAction }: BeasiswaTabProps = {}) {
  const [data, setData] = useState<Beasiswa[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    sumber: '',
    orderBy: 'nama',
    orderDir: 'asc' as 'asc' | 'desc',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getBeasiswaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data program beasiswa dari SIAKAD');
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
      sumber: filterSumber,
      orderBy: filterOrderBy,
      orderDir: filterOrderDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSumber('');
    setFilterOrderBy('nama');
    setFilterOrderDir('asc');
    setAppliedFilters({ search: '', sumber: '', orderBy: 'nama', orderDir: 'asc' });
    setShowFilter(false);
  };

  const isFiltered = Boolean(appliedFilters.search || appliedFilters.sumber);

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
        if (
          !item.nama?.toLowerCase().includes(q) &&
          !item.kode?.toLowerCase().includes(q) &&
          !item.deskripsi?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (appliedFilters.sumber && item.sumber !== appliedFilters.sumber) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof Beasiswa] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof Beasiswa] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const getCakupanBiayaText = (item: Beasiswa) => {
    if (!item.jenis_biaya_ids || item.jenis_biaya_ids.length === 0) return 'Semua Komponen Biaya';
    const names = (item.jenis_biaya || []).map((j) => j.nama);
    if (names.length === 0) return `${item.jenis_biaya_ids.length} komponen biaya`;
    return names.join(', ');
  };

  const columns: ColumnDef<Beasiswa>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md uppercase">
            {row.kode}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PROGRAM BEASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          {row.deskripsi && <p className="text-2xs text-slate-500 font-medium mt-1 line-clamp-1">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'sumber',
      label: 'SUMBER DANA',
      render: (row) => (
        <span className="badge badge-blue text-xs font-bold uppercase">{row.sumber || 'Internal'}</span>
      ),
    },
    {
      key: 'cakupan_biaya',
      label: 'CAKUPAN KOMPONEN',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{getCakupanBiayaText(row)}</p>
          <p className="text-2xs text-slate-500">
            {row.berlaku_angkatan_mulai && row.berlaku_angkatan_sampai
              ? `Angkatan ${row.berlaku_angkatan_mulai} - ${row.berlaku_angkatan_sampai}`
              : 'Semua Angkatan'}
          </p>
        </div>
      ),
    },
    {
      key: 'nilai_potongan',
      label: 'BESARAN POTONGAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {row.tipe_potongan === 'persen' ? `${row.nilai_potongan}%` : formatRupiah(row.nilai_potongan)}
          </span>
          <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">
            {row.tipe_potongan === 'persen' ? 'Potongan Persentase' : 'Potongan Nominal Tetap'}
          </span>
        </div>
      ),
    },
    {
      key: 'pengelola',
      label: 'PENGELOLA',
      render: () => (
        <span className="badge badge-purple text-xs font-bold inline-flex items-center gap-1">
          <GraduationCap size={12} /> BAAK / SIAKAD
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.is_active !== false ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold">Non-Aktif</span>
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

      {/* Info Banner Integrasi SIAKAD */}
      <div className="p-4 bg-primary-50/60 border border-primary-200/80 rounded-2xl flex items-start gap-3 text-xs text-primary-950">
        <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">Master Beasiswa Terpusat dari Modul SIAKAD</span>
          <span>
            Program beasiswa dan penetapan mahasiswa penerima dikelola secara terpusat oleh Biro Administrasi Akademik &amp; Kemahasiswaan (BAAK) pada <strong>Modul SIAKAD</strong>. Modul Keuangan (SIKEU) secara otomatis membaca dan menerapkan data beasiswa ini untuk kalkulasi diskon tagihan mahasiswa.
          </span>
        </div>
      </div>

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data program beasiswa dari SIAKAD."
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Master Beasiswa"
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
            label="Cari Nama / Kode Beasiswa"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Sumber Dana"
            value={filterSumber}
            onChange={(val) => setFilterSumber(val as string)}
            options={[
              { value: '', label: 'Semua Sumber Dana' },
              { value: 'internal', label: 'Internal Yayasan' },
              { value: 'pemerintah', label: 'Pemerintah' },
              { value: 'mitra', label: 'Mitra / CSR' },
              { value: 'alumni', label: 'Alumni' },
            ]}
          />

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Urutan Tampilan</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urutkan Berdasarkan"
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val as string)}
                options={[
                  { value: 'nama', label: 'Nama Beasiswa' },
                  { value: 'kode', label: 'Kode Beasiswa' },
                  { value: 'sumber', label: 'Sumber Dana' },
                  { value: 'nilai_potongan', label: 'Besaran Potongan' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
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