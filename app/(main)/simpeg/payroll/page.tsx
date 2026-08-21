'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Printer, Plus, Filter, ShieldAlert, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { GajiPegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export default function PayrollPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.payroll.read') || hasPermission('simpeg.payroll.view') || hasPermission('simpeg.payroll.manage');
  const canCreate = hasPermission('simpeg.payroll.create') || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [payrollList, setPayrollList] = useState<GajiPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('periode_bulan_tahun');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  const loadPayroll = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getPayrollList({
        page,
        limit,
        search: search || undefined,
        periode: filterPeriode || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setPayrollList(res.data || []);
        setMeta(res.meta);
      } else {
        let items: GajiPegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (g) =>
              g.periode_bulan_tahun.toLowerCase().includes(q) ||
              g.pegawai?.nama_lengkap?.toLowerCase().includes(q)
          );
        }
        if (filterPeriode) {
          items = items.filter((g) => g.periode_bulan_tahun === filterPeriode);
        }

        items.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = items.slice(startIndex, startIndex + limit);

        setPayrollList(paginated);
        setMeta({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Slip Gaji');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterPeriode, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const columns: ColumnDef<GajiPegawai>[] = [
    {
      key: 'periode_bulan_tahun',
      label: 'Periode',
      render: (row) => <span className="font-bold font-mono">{row.periode_bulan_tahun}</span>,
    },
    {
      key: 'pegawai',
      label: 'Nama Pegawai',
      render: (row) => <span className="font-bold">{row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`}</span>,
    },
    {
      key: 'gaji_pokok',
      label: 'Gaji Pokok',
      render: (row) => formatRupiah(row.gaji_pokok),
    },
    {
      key: 'total_tunjangan',
      label: 'Tunjangan',
      render: (row) => `+${formatRupiah(row.total_tunjangan)}`,
    },
    {
      key: 'total_potongan',
      label: 'Potongan',
      render: (row) => `-${formatRupiah(row.total_potongan)}`,
    },
    {
      key: 'gaji_bersih',
      label: 'Take Home Pay',
      render: (row) => <span className="font-bold">{formatRupiah(row.gaji_bersih)}</span>,
    },
    {
      key: 'status_transfer',
      label: 'Status SIKEU',
      render: (row) => (
        <Badge variant="success" className="uppercase">
          {row.status_transfer} (Posted)
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: () => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Cetak Slip Gaji PDF',
            icon: <Printer size={14} />,
            onClick: () => toast.success('Mengunduh Slip Gaji PDF...'),
          },
        ];

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Payroll & Slip Gaji Pegawai"
          description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat Slip Gaji & Payroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Payroll & Slip Gaji Pegawai"
        description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ExternalLink size={16} />}
              onClick={() => window.open('/sikeu/akuntansi/jurnal', '_blank')}
            >
              Jurnal SIKEU
            </Button>
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={() => router.push('/simpeg/payroll/create')}>
                Terbitkan Payroll Baru
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={payrollList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center opacity-70">
            <DollarSign size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data slip gaji penerbitan yang sesuai filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Payroll Slip Gaji"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / Periode"
            placeholder="Cari nama pegawai, 2026-07..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Input
            label="Filter Periode (YYYY-MM)"
            placeholder="Contoh: 2026-07"
            value={filterPeriode}
            onChange={(e) => {
              setFilterPeriode(e.target.value);
              setPage(1);
            }}
          />

          <hr className="my-2" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'periode_bulan_tahun', label: 'Periode' },
                { value: 'gaji_bersih', label: 'Take Home Pay' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterPeriode('');
                setFilterOrderBy('periode_bulan_tahun');
                setFilterOrderDir('desc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
