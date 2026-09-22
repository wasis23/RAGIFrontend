'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Plus, Filter, Building, Handshake, Gift, Search, Eye, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/lib/utils';
import { sikeuService } from '@/services/sikeu.service';
import { PemasukanKampus } from '@/types/sikeu.types';
import { PaginationMeta } from '@/types/api.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { CurrencyText } from '@/components/sikeu/akuntansi/atoms/CurrencyText';
import { DateText } from '@/components/sikeu/akuntansi/atoms/DateText';

export default function PemasukanListPage() {
  const [data, setData] = useState<PemasukanKampus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSumber, setFilterSumber] = useState('all');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal_terima');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', sumber: 'all', orderBy: 'tanggal_terima', orderDir: 'desc' as 'asc' | 'desc' });

  const fetchPemasukan = async () => {
    try {
      setLoading(true);
      const res: any = await sikeuService.getPemasukanList({
        sumber: appliedFilters.sumber !== 'all' ? appliedFilters.sumber : undefined,
        page,
        per_page: perPage,
      });
      const raw = res?.data;
      // Backend mengembalikan items + meta; toleransi bentuk lama (array / paginator).
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setData(list);
      const metaRaw = res?.meta ?? (raw && !Array.isArray(raw) ? raw : undefined);
      setMeta(
        metaRaw && typeof metaRaw.total === 'number'
          ? {
              current_page: metaRaw.current_page ?? page,
              last_page: metaRaw.last_page ?? 1,
              per_page: metaRaw.per_page ?? perPage,
              total: metaRaw.total ?? 0,
              from: metaRaw.from ?? 0,
              to: metaRaw.to ?? 0,
            }
          : undefined
      );
    } catch {
      setData([]);
      setMeta(undefined);
      toast.error('Gagal memuat data pemasukan kampu non-akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemasukan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, sumber: filterSumber, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSumber('all');
    setFilterOrderBy('tanggal_terima');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', sumber: 'all', orderBy: 'tanggal_terima', orderDir: 'desc' });
    setPage(1);
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
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

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof PemasukanKampus] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof PemasukanKampus] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
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
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Rincian Transaksi',
                icon: <Eye size={14} />,
                onClick: () => {
                  toast.success(`Transaksi ${row.nomor_transaksi}: ${formatRupiah(row.nominal)} (${row.nama_donor_instansi})`);
                },
              },
              ...(row.file_bukti_transfer ? [{
                label: 'Unduh Bukti Transfer',
                icon: <Download size={14} />,
                onClick: () => window.open(row.file_bukti_transfer, '_blank'),
              }] : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
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



      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(limit) => {
          setPerPage(limit);
          setPage(1);
        }}
        renderExpandedRow={(row) => {
          const akun = (row as PemasukanKampus & { akun_pendapatan?: { kode_akun?: string; nama_akun?: string } }).akun_pendapatan;
          return (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <p className="text-2xs font-bold text-slate-500 uppercase">Akun Pendapatan (Dikredit)</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    [{akun?.kode_akun || '-'}] {akun?.nama_akun || 'Akun Pendapatan'}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <p className="text-2xs font-bold text-slate-500 uppercase">Kas/Bank Tujuan (Didebet)</p>
                  <p className="font-bold text-slate-900 mt-0.5">{row.unit_kas?.nama_kas || 'Kas Utama'}</p>
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <p className="font-semibold text-slate-900">{row.nama_donor_instansi}</p>
                {row.nomor_kontrak_ref && (
                  <p className="font-mono text-2xs text-slate-500">Ref kontrak: {row.nomor_kontrak_ref}</p>
                )}
                {row.keterangan && <p className="text-slate-600">{row.keterangan}</p>}
                {row.file_bukti_transfer && (
                  <button
                    type="button"
                    onClick={() => window.open(row.file_bukti_transfer, '_blank')}
                    className="text-xs font-bold text-primary-700 hover:underline cursor-pointer"
                  >
                    Lihat Bukti Transfer
                  </button>
                )}
              </div>
            </div>
          );
        }}
        emptyMessage="Belum ada data pencatatan pemasukan non-akademik."
      />

      <p className="text-2xs text-slate-500 text-center">
        Klik ikon panah di tiap baris untuk melihat rincian akun pendapatan, kas tujuan & bukti transfer.
      </p>

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

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'tanggal_terima', label: 'Tanggal Terima' },
                { value: 'nomor_transaksi', label: 'Nomor Transaksi' },
                { value: 'nama_donor_instansi', label: 'Nama Donor/Instansi' },
                { value: 'nominal', label: 'Nominal' },
                { value: 'sumber_pemasukan', label: 'Sumber' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
