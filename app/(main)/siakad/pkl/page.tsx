'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Filter,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import {
  JENIS_PKL_OPTIONS,
  STATUS_PKL_OPTIONS,
  PKL_SORT_BY_OPTIONS,
  SORT_DIRECTION_OPTIONS,
} from '@/lib/constants/siakad.constant';
import toast from 'react-hot-toast';

export default function PklPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pklList, setPklList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any | null>(null);

  // Filter Drawer State (Search terpusat di Drawer)
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSortBy, setFilterSortBy] = useState('instansi_nama');
  const [filterSortOrder, setFilterSortOrder] = useState('asc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const loadPklList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siakadService.getPklList({
        page,
        per_page: limit,
      });
      const rawData = res?.data;
      if (Array.isArray(rawData)) {
        setPklList(rawData);
      } else if (rawData?.items || rawData?.data) {
        setPklList(rawData.items || rawData.data);
      } else {
        setPklList([]);
      }
      setMeta(res?.meta || rawData?.meta || {
        page,
        limit,
        total: Array.isArray(rawData) ? rawData.length : 0,
        total_pages: Math.ceil((Array.isArray(rawData) ? rawData.length : 1) / limit),
      });
    } catch {
      toast.error('Gagal memuat data PKL');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadPklList();
  }, [loadPklList]);

  const filteredPkl = useMemo(() => {
    let list = [...pklList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.instansi_nama?.toLowerCase().includes(q) ||
          p.mahasiswa?.nama_lengkap?.toLowerCase().includes(q) ||
          p.mahasiswa?.nim?.toLowerCase().includes(q) ||
          p.judul_laporan?.toLowerCase().includes(q)
      );
    }
    if (filterJenis !== 'ALL') {
      list = list.filter((p) => p.jenis === filterJenis);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter((p) => p.status === filterStatus);
    }

    list.sort((a, b) => {
      const nameA = String(a.instansi_nama || '');
      const nameB = String(b.instansi_nama || '');
      if (filterSortBy === 'tanggal') {
        return filterSortOrder === 'asc'
          ? String(a.tanggal_mulai).localeCompare(String(b.tanggal_mulai))
          : String(b.tanggal_mulai).localeCompare(String(a.tanggal_mulai));
      }
      return filterSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return list;
  }, [pklList, search, filterJenis, filterStatus, filterSortBy, filterSortOrder]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA & PRODI',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.mahasiswa?.nama_lengkap || row.nama_mahasiswa || 'Mahasiswa'}
          </span>
          <span className="font-mono text-2xs text-slate-500">
            {row.mahasiswa?.nim || '-'} • {row.program_studi?.nama || 'Prodi'}
          </span>
        </div>
      ),
    },
    {
      key: 'instansi',
      label: 'INSTANSI & PERIODE',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">
            {row.instansi_nama} ({row.instansi_kota || '-'})
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.tanggal_mulai} s.d {row.tanggal_selesai}
          </span>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'JENIS PKL',
      align: 'center',
      render: (row) => (
        <Badge variant="blue" className="text-2xs capitalize">
          {String(row.jenis || 'pkl_reguler').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        const s = row.status || 'draft';
        const variant =
          s === 'dinilai' || s === 'disetujui'
            ? 'green'
            : s === 'ditolak'
            ? 'red'
            : s === 'sedang_berjalan'
            ? 'cyan'
            : 'amber';
        return (
          <Badge variant={variant} className="text-2xs uppercase font-semibold">
            {s.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'nilai',
      label: 'NILAI AKHIR',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-xs">
          {row.penilaian?.nilai_angka_akhir ?? row.nilai_angka_akhir ?? '-'}
          {row.penilaian?.nilai_huruf_akhir ? ` (${row.penilaian.nilai_huruf_akhir})` : ''}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Detail & Logbook PKL',
              icon: <FileText size={14} />,
              onClick: () => router.push(`/siakad/pkl/${row.id}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Praktek Kerja Lapangan (PKL) & Magang"
        description="Portal monitoring pelaksanaan PKL/MBKM: pengajuan usulan, logbook harian, dan penilaian komprehensif dosen & pembimbing lapangan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Praktek Lapangan' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
              className="text-xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => router.push('/siakad/pkl/create')}
              className="text-xs font-bold"
            >
              Ajukan PKL Baru
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="p-4 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Daftar Pelaksanaan PKL & Magang
            </h3>
            <p className="text-2xs text-slate-500">
              Total {filteredPkl.length} data mahasiswa aktif magang dan PKL.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={filteredPkl}
            meta={meta}
            onPageChange={(p) => setPage(p)}
            isLoading={loading}
            emptyMessage="Belum ada pendaftaran PKL atau magang yang tercatat."
          />
        </CardBody>
      </Card>

      {/* Filter Drawer */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter & Pencarian PKL"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pencarian Instansi / Mahasiswa"
            placeholder="Cari instansi/mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Jenis PKL"
            options={JENIS_PKL_OPTIONS}
            value={filterJenis}
            onChange={(v) => setFilterJenis(String(v || 'ALL'))}
          />

          <Select
            label="Status Pelaksanaan"
            options={STATUS_PKL_OPTIONS}
            value={filterStatus}
            onChange={(v) => setFilterStatus(String(v || 'ALL'))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan"
              options={PKL_SORT_BY_OPTIONS}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'instansi_nama'))}
            />
            <Select
              label="Arah"
              options={SORT_DIRECTION_OPTIONS}
              value={filterSortOrder}
              onChange={(v) => setFilterSortOrder(String(v || 'asc'))}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setShowFilterDrawer(false)}
            className="mt-2"
          >
            Terapkan Filter
          </Button>
        </div>
      </Drawer>
    </div>
  );
}