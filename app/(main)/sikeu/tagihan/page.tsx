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
  is_calon_mahasiswa?: boolean;
  no_pendaftaran?: string;
}

export default function TagihanListPage() {
  const router = useRouter();
  const [data, setData] = useState<TagihanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);
  const [angkatanList, setAngkatanList] = useState<{ value: string; label: string }[]>([]);

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
    const loadMasters = async () => {
      try {
        const [resProdi, resAngkatan] = await Promise.all([
          sikeuService.getProgramStudiList(),
          sikeuService.getAngkatanList().catch(() => ({ data: [] })),
        ]);
        if (Array.isArray(resProdi.data)) {
          setProdiList(
            resProdi.data.map((p: any) => {
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
        if (Array.isArray(resAngkatan.data)) {
          setAngkatanList(
            resAngkatan.data.map((a: number) => ({
              value: String(a),
              label: `Angkatan ${a}`,
            }))
          );
        }
      } catch {
        // Fallback
      }
    };
    loadMasters();
  }, []);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getTagihanList({
        page: page,
        per_page: 15,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
        tahun_angkatan: appliedFilters.angkatan !== 'all' ? parseInt(appliedFilters.angkatan) : undefined,
        program_studi_id: appliedFilters.prodi !== 'all' ? parseInt(appliedFilters.prodi) : undefined,
        order_by: appliedFilters.orderBy,
        order_direction: appliedFilters.orderDir,
      });

      const raw = Array.isArray(res.data) ? res.data : [];
      setData(raw);
      if (res.meta) {
        setMeta(res.meta);
      } else {
        setMeta({
          current_page: page,
          from: (page - 1) * 15 + 1,
          to: (page - 1) * 15 + raw.length,
          last_page: 1,
          per_page: 15,
          total: raw.length,
        });
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
  }, [page, appliedFilters]);

  const handleApplyFilter = () => {
    setPage(1);
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
    setPage(1);
    setAppliedFilters({ search: '', angkatan: 'all', prodi: 'all', status: 'all', orderBy: 'nomor', orderDir: 'desc' });
    setShowFilter(false);
  };

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
          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <span>{row.nama}</span>
            {row.is_calon_mahasiswa && (
              <span className="badge badge-amber text-[10px] font-bold py-0 px-1">Calon Mhs</span>
            )}
          </p>
          <p className="font-mono text-xs text-slate-500">
            {row.nim && row.nim !== '-' ? `NIM: ${row.nim}` : (row.no_pendaftaran ? `Reg: ${row.no_pendaftaran}` : '-')}
          </p>
        </div>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN & PRODI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.prodi}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.angkatan || '-'} • {row.jalur || '-'}</p>
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
                label: 'Lihat Rincian Tagihan',
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Daftar Tagihan Mahasiswa"
        description="Kelola seluruh invoice tagihan semester, UKT, dan status pembayaran mahasiswa."
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

      <DataTable data={data} isLoading={loading} columns={columns} meta={meta} onPageChange={(p) => setPage(p)} emptyMessage="Belum ada data tagihan semester aktif." />

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
              ...angkatanList,
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
