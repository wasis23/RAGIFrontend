'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
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
import { DropdownMenu } from '@/components/ui/DropdownMenu';

interface PengeluaranItem {
  id: number;
  nomor_transaksi?: string;
  kode?: string;
  tanggal_transaksi?: string;
  tanggal?: string;
  kategori: string;
  keterangan: string;
  nama_vendor?: string;
  npwp_vendor?: string;
  jenis_pajak?: string;
  tarif_pajak_persen?: number;
  status_pembayaran?: string;
  kas_asal?: string;
  unit_kas?: { nama_kas?: string };
  akun_beban?: { kode_akun?: string; nama_akun?: string };
  akun_kas?: { kode_akun?: string; nama_akun?: string };
  nominal?: number;
  nominal_gross?: number;
  nominal_pajak?: number;
  net_dibayarkan?: number;
  nominal_net?: number;
}



export default function PengeluaranListPage() {
  const [data, setData] = useState<PengeluaranItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal_transaksi');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', kategori: 'all', orderBy: 'tanggal_transaksi', orderDir: 'desc' as 'asc' | 'desc' });

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
    setAppliedFilters({ search: filterSearch, kategori: filterKategori, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKategori('all');
    setFilterOrderBy('tanggal_transaksi');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', kategori: 'all', orderBy: 'tanggal_transaksi', orderDir: 'desc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchKode = (item.nomor_transaksi || item.kode || '')?.toLowerCase().includes(q);
        const matchKet = item.keterangan?.toLowerCase().includes(q);
        const matchKat = item.kategori?.toLowerCase().includes(q);
        const matchVendor = item.nama_vendor?.toLowerCase().includes(q);
        if (!matchKode && !matchKet && !matchKat && !matchVendor) return false;
      }
      if (appliedFilters.kategori !== 'all' && item.kategori !== appliedFilters.kategori) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof PengeluaranItem] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof PengeluaranItem] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const totalGross = useMemo(
    () => filteredData.reduce((acc, i) => acc + (Number(i.nominal ?? i.nominal_gross) || 0), 0),
    [filteredData]
  );
  const totalNet = useMemo(
    () => filteredData.reduce((acc, i) => acc + (Number(i.net_dibayarkan ?? i.nominal_net) || 0), 0),
    [filteredData]
  );

  const columns: ColumnDef<PengeluaranItem>[] = [
    {
      key: 'kode',
      label: 'KODE & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_transaksi || row.kode || `EXP-${row.id}`}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">
            {formatDate(row.tanggal_transaksi || row.tanggal)}
          </span>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI & KETERANGAN',
      render: (row) => (
        <div>
          <span className="badge badge-purple text-xs font-bold uppercase">{row.kategori || 'Operasional'}</span>
          <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-1">
            {row.keterangan || (row.nama_vendor ? `Pengeluaran kepada ${row.nama_vendor}` : '-')}
          </p>
        </div>
      ),
    },
    {
      key: 'kas_asal',
      label: 'KAS / REKENING ASAL',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">
          {row.unit_kas?.nama_kas || row.kas_asal || 'Kas Utama Rektorat'}
        </span>
      ),
    },
    {
      key: 'nominal_gross',
      label: 'GROSS (RP)',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal ?? row.nominal_gross ?? 0)}
        </span>
      ),
    },
    {
      key: 'nominal_net',
      label: 'NET BIAYA (RP)',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums text-sm">
          {formatRupiah(row.net_dibayarkan ?? row.nominal_net ?? 0)}
        </span>
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
                label: 'Rincian Pengeluaran',
                icon: <Eye size={14} />,
                onClick: () => {
                  toast.success(`Transaksi ${row.nomor_transaksi || row.kode || row.id}: Net ${formatRupiah(row.net_dibayarkan ?? row.nominal_net ?? 0)}`);
                },
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



      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        renderExpandedRow={(row) => (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-2xs font-bold text-slate-500 uppercase">Akun Beban (Didebet)</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  [{row.akun_beban?.kode_akun || '-'}] {row.akun_beban?.nama_akun || 'Akun Beban'}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-2xs font-bold text-slate-500 uppercase">Akun Kas (Dikredit)</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  [{row.akun_kas?.kode_akun || '-'}] {row.akun_kas?.nama_akun || row.unit_kas?.nama_kas || 'Kas'}
                </p>
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <div className="grid grid-cols-3 gap-2 tabular-nums">
                <div>
                  <p className="text-2xs text-slate-500">Gross</p>
                  <p className="font-bold text-slate-900">{formatRupiah(row.nominal ?? row.nominal_gross ?? 0)}</p>
                </div>
                <div>
                  <p className="text-2xs text-slate-500">
                    Pajak ({row.jenis_pajak?.replace('_', ' ').toUpperCase() || '-'}{row.tarif_pajak_persen ? ` ${row.tarif_pajak_persen}%` : ''})
                  </p>
                  <p className="font-bold text-rose-600">{formatRupiah(row.nominal_pajak ?? 0)}</p>
                </div>
                <div>
                  <p className="text-2xs text-slate-500">Net Dibayarkan</p>
                  <p className="font-bold text-emerald-700">{formatRupiah(row.net_dibayarkan ?? row.nominal_net ?? 0)}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <p className="font-semibold text-slate-900">{row.nama_vendor || '-'}</p>
              {row.npwp_vendor && <p className="font-mono text-2xs text-slate-500">NPWP: {row.npwp_vendor}</p>}
              {row.keterangan && <p className="text-slate-600">{row.keterangan}</p>}
              {row.status_pembayaran && (
                <span className="badge badge-green text-2xs font-bold uppercase">{row.status_pembayaran}</span>
              )}
            </div>
          </div>
        )}
        emptyMessage="Belum ada data pengeluaran."
      />

      <p className="text-2xs text-slate-500 text-center">
        Klik ikon panah di tiap baris untuk melihat rincian akun beban, kas, pajak & vendor.
      </p>

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
              { value: 'pemeliharaan', label: 'Pemeliharaan Sarana & Prasarana' },
              { value: 'laboratorium', label: 'Laboratorium & Praktikum' },
              { value: 'kegiatan', label: 'Kegiatan & Acara' },
              { value: 'honorarium', label: 'Honorarium / Gaji' },
              { value: 'lainnya', label: 'Lainnya' },
            ]} />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'tanggal_transaksi', label: 'Tanggal Transaksi' },
                { value: 'kode', label: 'Kode Transaksi' },
                { value: 'nominal_gross', label: 'Nominal Gross' },
                { value: 'nominal_net', label: 'Nominal Net' },
                { value: 'kategori', label: 'Kategori' },
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
