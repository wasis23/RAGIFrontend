'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService, type PengajuanOperasional } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

const STATUS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  diajukan: { label: 'Diajukan', variant: 'info' },
  pending_sarpras: { label: 'Menunggu Sarpras', variant: 'warning' },
  pending_keuangan: { label: 'Menunggu Keuangan', variant: 'warning' },
  pending_direktur: { label: 'Menunggu Direktur', variant: 'warning' },
  disetujui: { label: 'Disetujui', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
  dicairkan: { label: 'Dicairkan', variant: 'success' },
  lpj_pending: { label: 'LPJ Diverifikasi', variant: 'warning' },
  selesai: { label: 'Selesai', variant: 'success' },
};

export default function PengajuanOperasionalPage() {
  const router = useRouter();
  const [data, setData] = useState<PengajuanOperasional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [fSearch, setFSearch] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fKategori, setFKategori] = useState('all');
  const [applied, setApplied] = useState({ search: '', status: 'all', kategori: 'all' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await pengajuanOperasionalService.list({
        search: applied.search || undefined,
        status: applied.status !== 'all' ? applied.status : undefined,
        kategori: applied.kategori !== 'all' ? applied.kategori : undefined,
        per_page: 50,
      });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Gagal memuat pengajuan operasional');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const filtered = useMemo(() => data, [data]);

  const columns: ColumnDef<PengajuanOperasional>[] = [
    {
      key: 'judul_pengajuan',
      label: 'PENGAJUAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nomor_pengajuan}</p>
          <p className="text-xs text-slate-700 line-clamp-1">{row.judul_pengajuan}</p>
          <p className="text-2xs text-slate-500 line-clamp-1">{row.deskripsi}</p>
        </div>
      ),
    },
    {
      key: 'kategori_pengajuan',
      label: 'KATEGORI',
      render: (row) => (
        <Badge variant={row.kategori_pengajuan === 'pengadaan_barang' ? 'info' : 'secondary'}>
          {row.kategori_pengajuan === 'pengadaan_barang' ? 'BARANG' : 'NON-BARANG'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const s = STATUS_LABEL[row.status] || { label: row.status, variant: 'secondary' as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'nominal_diajukan',
      label: 'NOMINAL',
      render: (row) => <span className="font-bold tabular-nums text-sm">{formatRupiah(Number(row.nominal_diajukan) || 0)}</span>,
    },
    {
      key: 'created_at',
      label: 'TANGGAL',
      render: (row) => <span className="text-xs text-slate-600">{row.created_at ? formatDate(row.created_at) : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[{ label: 'Lihat Detail & Proses', icon: <Eye size={14} />, onClick: () => router.push(`/sikeu/pengajuan/${row.id}`) }]}
        />
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Pengajuan Operasional"
        description="Pengajuan anggaran barang & non-barang: sarpras → keuangan → direktur → pencairan → LPJ."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/sikeu/pengajuan/create')} className="font-bold min-h-[40px]">
              Buat Pengajuan
            </Button>
          </div>
        }
      />

      <DataTable data={filtered} isLoading={loading} columns={columns} emptyMessage="Belum ada pengajuan operasional." />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengajuan"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => { setFSearch(''); setFStatus('all'); setFKategori('all'); setApplied({ search: '', status: 'all', kategori: 'all' }); setShowFilter(false); }} className="font-bold min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={() => { setApplied({ search: fSearch, status: fStatus, kategori: fKategori }); setShowFilter(false); }} className="font-bold min-h-[42px] px-5">
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input label="Cari Nomor / Judul / Alasan" placeholder="Ketik kata kunci..." value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
          <Select label="Status" value={fStatus} onChange={(v) => setFStatus(v as string)} options={[{ value: 'all', label: 'Semua Status' }, ...Object.entries(STATUS_LABEL).map(([v, s]) => ({ value: v, label: s.label }))]} />
          <Select label="Kategori" value={fKategori} onChange={(v) => setFKategori(v as string)} options={[{ value: 'all', label: 'Semua Kategori' }, { value: 'pengadaan_barang', label: 'Pengadaan Barang' }, { value: 'non_barang', label: 'Non-Barang' }]} />
        </div>
      </Drawer>
    </div>
  );
}
