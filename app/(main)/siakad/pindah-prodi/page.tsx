'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

// Nilai status persis enum DB siakad_mahasiswa_pindah_prodi:
// pending | approved | rejected | applied | cancelled
const STATUS_META: Record<string, { label: string; variant: 'amber' | 'green' | 'red' | 'blue' | 'gray' }> = {
  pending: { label: 'Diajukan', variant: 'amber' },
  approved: { label: 'Disetujui', variant: 'green' },
  rejected: { label: 'Ditolak', variant: 'red' },
  applied: { label: 'Diterapkan', variant: 'blue' },
  cancelled: { label: 'Dibatalkan', variant: 'gray' },
};

const PINDAH_STATUS_OPTIONS = [
  { value: 'pending', label: 'Diajukan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'applied', label: 'Diterapkan' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function PindahProdiPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [applied, setApplied] = useState({ search: '', status: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getPindahProdiList({
        search: applied.search || undefined,
        status: applied.status || undefined,
        page,
        per_page: 15,
      });
      setData(res.data || []);
      setMeta((res as any).meta);
    } catch {
      toast.error('Gagal memuat pengajuan pindah prodi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, applied]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & NAMA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mahasiswa?.nama_lengkap || '-'}</span>
          <span className="font-mono text-2xs text-slate-500">{row.mahasiswa?.nim || '-'}</span>
        </div>
      ),
    },
    {
      key: 'mutasi',
      label: 'MUTASI PRODI',
      render: (row) => (
        <span className="text-xs">
          {row.prodi_lama?.nama || row.mahasiswa?.program_studi?.nama || '-'}
          <span className="mx-1 font-bold">→</span>
          <strong>{row.prodi_baru?.nama || '-'}</strong>
        </span>
      ),
    },
    {
      key: 'keuangan',
      label: 'KEUANGAN',
      align: 'center',
      render: (row) => (
        row.hasil_cek_keuangan
          ? <Badge variant={row.hasil_cek_keuangan === 'layak' ? 'green' : 'amber'} className="text-2xs font-bold">{row.hasil_cek_keuangan === 'layak' ? 'Layak' : 'Ada Tunggakan'}</Badge>
          : <span className="text-2xs text-slate-400 italic">Belum dicek</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        const m = STATUS_META[row.status] || { label: row.status, variant: 'gray' as const };
        return <Badge variant={m.variant} className="text-2xs font-bold">{m.label}</Badge>;
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Buka Detail & Proses',
              icon: <Eye size={14} />,
              onClick: () => router.push(`/siakad/pindah-prodi/${row.id}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pindah Program Studi"
        description="Pengajuan mutasi prodi: pratinjau tunggakan SIKEU, sign-off keuangan, persetujuan akademik, dan penerapan mutasi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pindah Prodi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Link href="/siakad/pindah-prodi/create">
              <Button variant="primary" icon={<Plus size={15} />} className="font-bold text-xs min-h-[38px]">
                Ajukan Pindah
              </Button>
            </Link>
          </div>
        }
      />

      <DataTable columns={columns} data={data} meta={meta} isLoading={loading} emptyMessage="Belum ada pengajuan pindah prodi." />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Pindah Prodi">
        <div className="flex flex-col gap-5">
          <Input label="Pencarian" placeholder="Cari NIM / nama / alasan..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            label="Status"
            placeholder="Semua Status"
            options={PINDAH_STATUS_OPTIONS}
            value={filterStatus || ''}
            onChange={(v: any) => setFilterStatus(String(v || ''))}
            isClearable
          />
          <Button
            variant="primary"
            onClick={() => {
              setApplied({ search, status: filterStatus });
              setPage(1);
              setShowFilter(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
