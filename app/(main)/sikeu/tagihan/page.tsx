'use client';

import { formatRupiah } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Filter, CheckCircle2, AlertCircle, XCircle, Clock, Search, Edit, Eye
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
interface TagihanItem {
  id: number;
  nomor: string;
  nim: string;
  nama: string;
  angkatan: number;
  jalur: string;
  kelompok_ukt: string;
  prodi: string;
  program_studi_id?: number;
  total: number;
  total_potongan?: number;
  total_bayar?: number;
  sisa?: number;
  status: 'lunas' | 'belum_bayar' | 'pending_approval' | 'sebagian' | 'dispensasi' | string;
  jatuhTempo: string;
  source: string;
}

export default function TagihanListPage() {
  const router = useRouter();
  const [data, setData] = useState<TagihanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterProdi, setFilterProdi] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrderBy, setFilterOrderBy] = useState('nomor');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: 'all', prodi: 'all', status: 'all', orderBy: 'nomor', orderDir: 'desc' as 'asc' | 'desc' });

  useEffect(() => {
    const loadProdi = async () => {
      try {
        const res = await sikeuService.getProgramStudiList();
        if (Array.isArray(res.data)) {
          setProdiList(
            res.data.map((p: any) => {
              const rawName = p.nama || p.nama_prodi || 'Program Studi';
              const jenjang = p.jenjang || '';
              const label = jenjang && !rawName.startsWith(jenjang) ? `${jenjang} - ${rawName}` : rawName;
              return {
                value: String(p.id),
                label: label,
              };
            })
          );
        }
      } catch {
        // Fallback
      }
    };
    loadProdi();
  }, []);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getTagihanList({
        page: 1,
        per_page: 100,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
        tahun_angkatan: appliedFilters.angkatan !== 'all' ? parseInt(appliedFilters.angkatan) : undefined,
        program_studi_id: appliedFilters.prodi !== 'all' ? parseInt(appliedFilters.prodi) : undefined,
      });

      const raw = Array.isArray(res.data) ? res.data : [];
      if (raw.length > 0) {
        setData(raw);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
      toast.error('Gagal memuat data tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, [appliedFilters]);


  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, angkatan: filterAngkatan, prodi: filterProdi, status: filterStatus, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('all');
    setFilterProdi('all');
    setFilterStatus('all');
    setFilterOrderBy('nomor');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', angkatan: 'all', prodi: 'all', status: 'all', orderBy: 'nomor', orderDir: 'desc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.nim?.toLowerCase().includes(q) && !item.nomor?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.angkatan !== 'all' && String(item.angkatan) !== appliedFilters.angkatan) return false;
      if (appliedFilters.prodi !== 'all') {
        if (item.program_studi_id && String(item.program_studi_id) !== appliedFilters.prodi) return false;
      }
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof TagihanItem] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof TagihanItem] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<TagihanItem>[] = [
    {
      key: 'nomor',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">Sumber: {row.source}</span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN & PRODI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.prodi}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.angkatan} • {row.jalur}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'TOTAL TAGIHAN',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.total)}
        </span>
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
        if (row.status === 'dispensasi') {
          return (
            <span className="badge badge-orange text-xs font-bold inline-flex items-center gap-1">
              <AlertCircle size={12} /> Dispensasi
            </span>
          );
        }
        if (row.status === 'pending_approval') {
          return (
            <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Menunggu Verifikasi
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

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Set Tagihan & Invoice Semester Aktif"
        description="Aktivasi tagihan masal per Angkatan/Prodi & Layanan Pembayaran Loket / VA Mahasiswa."
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
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => router.push('/sikeu/tagihan/aktivasi-masal')}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Aktifkan Tagihan Masal
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data tagihan semester aktif." />

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tagihan Mahasiswa" width="420px"
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
          <Input label="Cari Nomor Invoice / Nama / NIM" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: 'all', label: 'Semua Program Studi' },
              ...prodiList,
            ]} />

          <Select label="Tahun Angkatan"
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
            options={[
              { value: 'all', label: 'Semua Angkatan' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
            ]} />

          <Select label="Status Pembayaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'lunas', label: 'Lunas' },
              { value: 'belum_bayar', label: 'Belum Bayar' },
              { value: 'sebagian', label: 'Bayar Sebagian' },
              { value: 'dispensasi', label: 'Dispensasi' },
              { value: 'pending_approval', label: 'Menunggu Verifikasi' },
            ]} />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'nomor', label: 'Nomor Tagihan' },
                { value: 'nama', label: 'Nama Mahasiswa' },
                { value: 'total', label: 'Total Tagihan' },
                { value: 'angkatan', label: 'Tahun Angkatan' },
                { value: 'status', label: 'Status' },
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
