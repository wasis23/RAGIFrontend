'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan, DetailJurnalUmum } from '@/types/sikeu.types';
import { PaginationMeta } from '@/types/api.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah } from '@/lib/utils';

export default function BukuBesarPage() {
  const router = useRouter();
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedAkunId, setSelectedAkunId] = useState<number | undefined>(undefined);
  const [glItems, setGlItems] = useState<DetailJurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter Drawer state
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAkunId, setFilterAkunId] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<'tanggal' | 'kode_akun' | 'debet' | 'kredit'>('tanggal');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    akunId: '',
    orderBy: 'tanggal' as 'tanggal' | 'kode_akun' | 'debet' | 'kredit',
    orderDir: 'desc' as 'asc' | 'desc',
  });

  // Load COA list once
  useEffect(() => {
    const loadCoa = async () => {
      try {
        const res = await sikeuService.getCoaList();
        if (res.data) setCoaList(res.data);
      } catch (err) {
        console.error('Failed to load COA', err);
      }
    };
    loadCoa();
  }, []);

  // Fetch Buku Besar items
  const loadGl = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const akunToQuery = appliedFilters.akunId ? Number(appliedFilters.akunId) : selectedAkunId;
      const res = await sikeuService.getBukuBesar(akunToQuery, targetPage, 20);

      const rawData = res.data;
      let dataList: DetailJurnalUmum[] = [];
      let metaData: PaginationMeta | undefined = undefined;

      if (Array.isArray(rawData)) {
        dataList = rawData;
      } else if (rawData && typeof rawData === 'object') {
        dataList = Array.isArray((rawData as any).data) ? (rawData as any).data : [];
        if ((rawData as any).current_page) {
          metaData = {
            current_page: (rawData as any).current_page,
            last_page: (rawData as any).last_page,
            per_page: (rawData as any).per_page,
            total: (rawData as any).total,
            from: (rawData as any).from,
            to: (rawData as any).to,
          };
        }
      }

      setGlItems(dataList);
      setMeta(metaData);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load Buku Besar', err);
      setGlItems([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters.akunId, selectedAkunId]);

  useEffect(() => {
    loadGl(page);
  }, [loadGl, page]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      akunId: filterAkunId,
      orderBy: filterOrderBy,
      orderDir: filterOrderDir,
    });
    setSelectedAkunId(filterAkunId ? Number(filterAkunId) : undefined);
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAkunId('');
    setFilterOrderBy('tanggal');
    setFilterOrderDir('desc');
    setAppliedFilters({
      search: '',
      akunId: '',
      orderBy: 'tanggal',
      orderDir: 'desc',
    });
    setSelectedAkunId(undefined);
    setPage(1);
    setShowFilter(false);
  };

  // Client-side filtering & sorting for smooth UX
  const processedData = useMemo(() => {
    let result = [...glItems];

    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      result = result.filter((item) => {
        const noJurnal = item.jurnal?.nomor_jurnal?.toLowerCase() || '';
        const kodeAkun = item.akun?.kode_akun?.toLowerCase() || '';
        const namaAkun = item.akun?.nama_akun?.toLowerCase() || '';
        const ket = (item.keterangan || item.jurnal?.keterangan || '').toLowerCase();
        return noJurnal.includes(q) || kodeAkun.includes(q) || namaAkun.includes(q) || ket.includes(q);
      });
    }

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (appliedFilters.orderBy) {
        case 'tanggal':
          valA = a.jurnal?.tanggal_jurnal || '';
          valB = b.jurnal?.tanggal_jurnal || '';
          break;
        case 'kode_akun':
          valA = a.akun?.kode_akun || '';
          valB = b.akun?.kode_akun || '';
          break;
        case 'debet':
          valA = Number(a.debet || 0);
          valB = Number(b.debet || 0);
          break;
        case 'kredit':
          valA = Number(a.kredit || 0);
          valB = Number(b.kredit || 0);
          break;
      }

      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [glItems, appliedFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.akunId) count++;
    if (appliedFilters.orderBy !== 'tanggal' || appliedFilters.orderDir !== 'desc') count++;
    return count;
  }, [appliedFilters]);

  const stats = useMemo(() => {
    let totalDebet = 0;
    let totalKredit = 0;
    glItems.forEach((item) => {
      totalDebet += Number(item.debet || 0);
      totalKredit += Number(item.kredit || 0);
    });
    return {
      totalDebet,
      totalKredit,
      selisih: Math.abs(totalDebet - totalKredit),
      count: meta?.total ?? glItems.length,
    };
  }, [glItems, meta]);

  const columns: ColumnDef<DetailJurnalUmum>[] = [
    {
      key: 'nomor_jurnal',
      label: 'NOMOR JURNAL',
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {item.jurnal?.nomor_jurnal || 'JRN-GL'}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">
            Tanggal: {item.jurnal?.tanggal_jurnal || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'akun',
      label: 'AKUN REKENING (COA)',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{item.akun?.nama_akun || 'Akun Keuangan'}</p>
          <p className="font-mono text-xs text-slate-500">Kode: {item.akun?.kode_akun || '-'}</p>
        </div>
      ),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN MUTASI',
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-slate-700 line-clamp-1">
            {item.keterangan || item.jurnal?.keterangan || 'Tidak ada keterangan'}
          </p>
          <p className="text-2xs text-slate-400">
            Kelompok: {item.akun?.kelompok ? item.akun.kelompok.toUpperCase() : 'MUTASI UMUM'}
          </p>
        </div>
      ),
    },
    {
      key: 'debet',
      label: 'DEBET',
      align: 'right',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {Number(item.debet) > 0 ? formatRupiah(Number(item.debet)) : '-'}
          </span>
          {Number(item.debet) > 0 && (
            <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">Arus Masuk</span>
          )}
        </div>
      ),
    },
    {
      key: 'kredit',
      label: 'KREDIT',
      align: 'right',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {Number(item.kredit) > 0 ? formatRupiah(Number(item.kredit)) : '-'}
          </span>
          {Number(item.kredit) > 0 && (
            <span className="text-2xs block text-indigo-600 font-semibold mt-0.5">Arus Keluar</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item) => {
        const isPosted = item.jurnal?.status_posting === 'posted';
        return isPosted ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Posted
          </span>
        ) : (
          <span className="badge badge-yellow text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> {item.jurnal?.status_posting || 'Draft'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={[
              {
                label: 'Lihat di Jurnal Umum',
                icon: <ExternalLink size={14} />,
                onClick: () => router.push('/sikeu/akuntansi/jurnal'),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Buku Besar & Mutasi Akun (General Ledger)"
        description="Rincian histori mutasi debet/kredit dan saldo berjalan per akun COA"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/sikeu/akuntansi/jurnal"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs min-h-[40px]"
            >
              <ArrowLeft size={15} className="text-slate-500" />
              Kembali ke Jurnal
            </Link>
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
              onClick={() => loadGl(page)}
              className="font-bold min-h-[40px]"
              title="Muat Ulang Data"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Quick Accounting Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-semibold">Total Mutasi Debet</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">
            {formatRupiah(stats.totalDebet)}
          </p>
          <span className="text-2xs text-emerald-600 font-medium block">Total penerimaan/penambahan</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-semibold">Total Mutasi Kredit</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">
            {formatRupiah(stats.totalKredit)}
          </p>
          <span className="text-2xs text-indigo-600 font-medium block">Total pengeluaran/pengurangan</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-semibold">Selisih Mutasi Periode</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Scale size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">
            {formatRupiah(stats.selisih)}
          </p>
          <span className="text-2xs text-amber-600 font-medium block">Netto mutasi buku besar</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-semibold">Total Transaksi Mutasi</span>
            <span className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <BookOpen size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {stats.count} Transaksi
          </p>
          <span className="text-2xs text-primary-600 font-medium block">Tercatat di buku besar</span>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-2xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-500">Filter Aktif:</span>
          {appliedFilters.search && (
            <span className="badge badge-blue text-xs font-medium">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {appliedFilters.akunId && (
            <span className="badge badge-blue text-xs font-medium">
              Akun: {coaList.find((c) => String(c.id) === appliedFilters.akunId)?.nama_akun || appliedFilters.akunId}
            </span>
          )}
          {(appliedFilters.orderBy !== 'tanggal' || appliedFilters.orderDir !== 'desc') && (
            <span className="badge badge-blue text-xs font-medium">
              Urutan: {appliedFilters.orderBy} ({appliedFilters.orderDir.toUpperCase()})
            </span>
          )}
          <button
            onClick={handleResetFilter}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer ml-auto"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Main DataTable */}
      <DataTable
        data={processedData}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Tidak ada mutasi buku besar untuk akun yang dipilih."
      />

      {/* Filter Drawer Slide-Out */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Buku Besar"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
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
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari Keterangan / Jurnal</label>
            <Input
              placeholder="Ketik kata kunci..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Filter Akun COA</label>
            <Select
              value={filterAkunId}
              onChange={(val: any) => setFilterAkunId(typeof val === 'object' && val?.target ? val.target.value : (val || ''))}
              options={[
                { value: '', label: '-- Semua Akun COA --' },
                ...coaList.map((a) => ({
                  value: String(a.id),
                  label: `[${a.kode_akun}] ${a.nama_akun} (${a.kelompok.toUpperCase()})`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urutkan Berdasarkan</label>
              <Select
                value={filterOrderBy}
                onChange={(val: any) => setFilterOrderBy(val || 'tanggal')}
                options={[
                  { value: 'tanggal', label: 'Tanggal' },
                  { value: 'kode_akun', label: 'Kode Akun' },
                  { value: 'debet', label: 'Nominal Debet' },
                  { value: 'kredit', label: 'Nominal Kredit' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arah Urutan</label>
              <Select
                value={filterOrderDir}
                onChange={(val: any) => setFilterOrderDir(val || 'desc')}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z / 0-9)' },
                  { value: 'desc', label: 'Menurun (Z-A / 9-0)' },
                ]}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

