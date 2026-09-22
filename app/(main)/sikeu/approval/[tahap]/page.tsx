'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Filter, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService, type PengajuanOperasional } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

interface TahapConfig {
  status: string;
  title: string;
  description: string;
  approveLabel: string;
}

const TAHAP_CONFIG: Record<string, TahapConfig> = {
  sarpras: {
    status: 'pending_sarpras',
    title: 'Approval Sarpras',
    description: 'Antrean pengajuan barang menunggu verifikasi sarana & prasarana.',
    approveLabel: 'Setujui & Teruskan ke Keuangan',
  },
  keuangan: {
    status: 'pending_keuangan',
    title: 'Approval Keuangan',
    description: 'Antrean pengajuan menunggu verifikasi bagian keuangan.',
    approveLabel: 'Setujui & Teruskan ke Pimpinan',
  },
  direktur: {
    status: 'pending_direktur',
    title: 'Approval Pimpinan',
    description: 'Antrean pengajuan menunggu keputusan pimpinan (direktur).',
    approveLabel: 'Setujui Pengajuan',
  },
};

export default function ApprovalTahapPage() {
  const params = useParams();
  const router = useRouter();
  const tahap = params.tahap as string;
  const config = TAHAP_CONFIG[tahap];

  const [data, setData] = useState<PengajuanOperasional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [fSearch, setFSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [activeItem, setActiveItem] = useState<PengajuanOperasional | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!config) return;
    try {
      setLoading(true);
      const res = await pengajuanOperasionalService.list({
        search: appliedSearch || undefined,
        status: config.status,
        per_page: 50,
      });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat antrean approval');
    } finally {
      setLoading(false);
    }
  }, [config, appliedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAction = (item: PengajuanOperasional, aksi: 'approve' | 'reject') => {
    setActiveItem(item);
    setActionType(aksi);
    setCatatan('');
  };

  const submitDecision = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await pengajuanOperasionalService.approve(activeItem.id, actionType, catatan);
      toast.success(actionType === 'approve' ? 'Pengajuan disetujui tahap ini.' : 'Pengajuan ditolak.');
      setActiveItem(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses keputusan.');
    } finally {
      setSubmitting(false);
    }
  };

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
      key: 'nominal_diajukan',
      label: 'NOMINAL',
      render: (row) => (
        <span className="font-bold tabular-nums text-sm">{formatRupiah(Number(row.nominal_diajukan) || 0)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'TANGGAL',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.created_at ? formatDate(row.created_at) : '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Lihat Detail & Proses',
              icon: <Eye size={14} />,
              onClick: () => router.push(`/sikeu/pengajuan/${row.id}`),
            },
            {
              label: 'Setujui Tahap Ini',
              icon: <CheckCircle2 size={14} className="text-emerald-600" />,
              onClick: () => openAction(row, 'approve'),
            },
            {
              label: 'Tolak Pengajuan',
              icon: <XCircle size={14} className="text-rose-600" />,
              variant: 'danger',
              onClick: () => openAction(row, 'reject'),
            },
          ]}
        />
      ),
    },
  ];

  if (!config) {
    return (
      <div className="p-8 text-sm space-y-3">
        <p>Tahap approval &quot;{tahap}&quot; tidak dikenal.</p>
        <Link href="/sikeu/approval" className="underline font-bold">
          Kembali ke Portal Approval
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Approval Pimpinan', href: '/sikeu/approval' },
          { label: config.title },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sikeu/approval')}
              className="font-bold min-h-[38px] text-xs"
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        isLoading={loading}
        columns={columns}
        emptyMessage="Tidak ada pengajuan menunggu tahap ini."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={`Filter ${config.title}`}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFSearch('');
                setAppliedSearch('');
                setShowFilter(false);
              }}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setAppliedSearch(fSearch);
                setShowFilter(false);
              }}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <Input
          label="Pencarian Nomor / Judul"
          placeholder="Ketik kata kunci..."
          value={fSearch}
          onChange={(e) => setFSearch(e.target.value)}
        />
      </Drawer>

      {/* Modal Keputusan */}
      <Modal
        isOpen={!!activeItem}
        onClose={() => !submitting && setActiveItem(null)}
        title={actionType === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <p className="text-xs font-bold text-slate-900">
              {activeItem?.nomor_pengajuan} — {activeItem?.judul_pengajuan}
            </p>
            <p className="text-sm font-extrabold text-emerald-700">
              {formatRupiah(Number(activeItem?.nominal_diajukan) || 0)}
            </p>
          </div>
          <Textarea
            label="Catatan (opsional)"
            placeholder="Tuliskan alasan atau instruksi tambahan..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActiveItem(null)} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={submitDecision}
              disabled={submitting}
              icon={submitting ? <Loader2 size={14} className="animate-spin" /> : undefined}
              className="font-bold"
            >
              {submitting ? 'Memproses...' : actionType === 'approve' ? config.approveLabel : 'Tolak Pengajuan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
