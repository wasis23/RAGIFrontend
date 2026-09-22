'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Filter, CheckCircle2, XCircle, Eye, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PaginationMeta } from '@/types/api.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

type TabKey = 'pending' | 'riwayat';

const STATUS_STYLE: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  pending: { label: 'Menunggu Validasi', variant: 'warning' },
  success: { label: 'Disetujui', variant: 'success' },
  rejected: { label: 'Ditolak', variant: 'danger' },
  failed: { label: 'Gagal', variant: 'danger' },
  reversed: { label: 'Dikoreksi', variant: 'secondary' },
};

export default function ValidasiManualPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('pending');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  const [showFilter, setShowFilter] = useState(false);
  const [draft, setDraft] = useState({ search: '', dari: '', sampai: '', hasil: '' });
  const [applied, setApplied] = useState({ search: '', dari: '', sampai: '', hasil: '' });

  const [acting, setActing] = useState<any | null>(null);
  const [aksi, setAksi] = useState<'approve' | 'reject'>('approve');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        channel: 'MANUAL_TRANSFER',
        page,
        per_page: perPage,
      };
      if (tab === 'pending') {
        params.status = 'pending';
      } else if (applied.hasil) {
        params.status = applied.hasil;
      }
      if (applied.search) params.search = applied.search;
      if (applied.dari) params.tgl_mulai = applied.dari;
      if (applied.sampai) params.tgl_selesai = applied.sampai;
      const res: any = await sikeuService.getPembayaranList(params);
      const raw = res?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.data)) list = raw.data;
      if (tab === 'riwayat' && !applied.hasil) {
        list = list.filter((p) => ['success', 'rejected'].includes(p.status));
      }
      setData(list);
      const metaRaw = res?.meta;
      setMeta(
        metaRaw
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
      toast.error('Gagal memuat bukti transfer manual');
    } finally {
      setLoading(false);
    }
  }, [tab, page, perPage, applied]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const switchTab = (t: TabKey) => {
    setTab(t);
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (applied.search) n++;
    if (applied.dari) n++;
    if (applied.sampai) n++;
    if (applied.hasil) n++;
    return n;
  }, [applied]);

  const openAksi = (row: any, a: 'approve' | 'reject') => {
    setActing(row);
    setAksi(a);
    setCatatan('');
  };

  const submitAksi = async () => {
    if (!acting) return;
    if (aksi === 'reject' && catatan.trim().length < 5) {
      toast.error('Alasan penolakan wajib diisi (min. 5 karakter).');
      return;
    }
    setSubmitting(true);
    try {
      if (aksi === 'approve') {
        const res = await sikeuService.approveManual(acting.id, catatan);
        toast.success(res?.message || 'Bukti disetujui, tagihan terbayar.');
      } else {
        const res = await sikeuService.rejectManual(acting.id, catatan.trim());
        toast.success(res?.message || 'Bukti ditolak.');
      }
      setActing(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memproses.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_transaksi',
      label: 'KODE & MAHASISWA',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.kode_transaksi}
          </span>
          <p className="font-bold text-slate-900 text-xs mt-1">{row.nama_mahasiswa}</p>
          <p className="text-2xs text-slate-500">
            {row.nim} • {row.program_studi}
          </p>
        </div>
      ),
    },
    {
      key: 'tagihan',
      label: 'TAGIHAN & JUMLAH',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-semibold text-indigo-700">{row.tagihan?.nomor_tagihan}</p>
          <p className="font-bold text-slate-900 tabular-nums text-sm">{formatRupiah(Number(row.jumlah_bayar) || 0)}</p>
          {row.kode_unik != null && (
            <p className="text-2xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded px-1.5 py-0.5 inline-block mt-1">
              Kode unik +{String(row.kode_unik).padStart(3, '0')} → transfer {formatRupiah(Number(row.nominal_transfer ?? row.jumlah_bayar) || 0)}
            </p>
          )}
          <p className="text-2xs text-slate-400">Transfer: {row.waktu_bayar ? formatDate(row.waktu_bayar) : '-'}</p>
        </div>
      ),
    },
    {
      key: 'unit_kas',
      label: 'REKENING TUJUAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{row.unit_kas?.nama_kas || '-'}</p>
          {row.unit_kas?.kanal && (
            <span className="badge badge-cyan text-2xs font-bold uppercase">{String(row.unit_kas.kanal).replace('_', ' ')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'bukti',
      label: 'BUKTI',
      render: (row) =>
        row.bukti_bayar_url ? (
          <Button
            variant="outline"
            size="sm"
            icon={<FileText size={13} />}
            onClick={() => window.open(row.bukti_bayar_url, '_blank')}
            className="font-bold text-xs"
          >
            Lihat
          </Button>
        ) : (
          <span className="text-2xs text-slate-400">-</span>
        ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const s = STATUS_STYLE[row.status] || { label: row.status, variant: 'secondary' as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={
              tab === 'pending'
                ? [
                    {
                      label: 'Setujui (Terbayar)',
                      icon: <CheckCircle2 size={14} className="text-emerald-600" />,
                      onClick: () => openAksi(row, 'approve'),
                    },
                    {
                      label: 'Tolak Bukti',
                      icon: <XCircle size={14} className="text-rose-600" />,
                      variant: 'danger',
                      onClick: () => openAksi(row, 'reject'),
                    },
                  ]
                : [
                    {
                      label: 'Lihat Bukti',
                      icon: <Eye size={14} />,
                      onClick: () => row.bukti_bayar_url && window.open(row.bukti_bayar_url, '_blank'),
                    },
                  ]
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Validasi Bukti Transfer Manual"
        description="Verifikasi bukti transfer mahasiswa ke rekening manual (BNI/BSN) — setujui agar tagihan terbayar & saldo bertambah."
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/tagihan' },
          { label: 'Validasi Manual' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sikeu/pembayaran-mahasiswa/tagihan')}
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
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-2xs bg-primary-600 text-white rounded-full font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => switchTab('pending')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            tab === 'pending' ? 'border-primary-600 bg-primary-50/60 font-bold text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={16} /> Belum Divalidasi
        </button>
        <button
          onClick={() => switchTab('riwayat')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            tab === 'riwayat' ? 'border-primary-600 bg-primary-50/60 font-bold text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 size={16} /> Sudah Divalidasi
        </button>
      </div>

      <DataTable
        data={data}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(limit) => {
          setPerPage(limit);
          setPage(1);
        }}
        renderExpandedRow={(row) => (
          <div className="space-y-2 text-xs">
            <p className="text-slate-600">
              <b>Rincian:</b> {row.rincian_pembayaran || '-'}
            </p>
            {row.catatan && (
              <p className="text-slate-600">
                <b>Catatan:</b> {row.catatan}
              </p>
            )}
            {row.bukti_bayar_url && (
              <button
                type="button"
                onClick={() => window.open(row.bukti_bayar_url, '_blank')}
                className="font-bold text-primary-700 hover:underline cursor-pointer"
              >
                Buka bukti transfer di tab baru
              </button>
            )}
          </div>
        )}
        emptyMessage={
          tab === 'pending'
            ? 'Tidak ada bukti transfer menunggu validasi.'
            : 'Belum ada riwayat validasi pada filter ini.'
        }
      />

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Bukti Transfer"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft({ search: '', dari: '', sampai: '', hasil: '' });
                setApplied({ search: '', dari: '', sampai: '', hasil: '' });
                setPage(1);
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
                setApplied({ ...draft });
                setPage(1);
                setShowFilter(false);
              }}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Kode / NIM / Nama"
            placeholder="Ketik kata kunci..."
            value={draft.search}
            onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Dari Tanggal"
              value={draft.dari}
              onChange={(e) => setDraft((f) => ({ ...f, dari: e.target.value }))}
            />
            <Input
              type="date"
              label="Sampai Tanggal"
              value={draft.sampai}
              onChange={(e) => setDraft((f) => ({ ...f, sampai: e.target.value }))}
            />
          </div>
          {tab === 'riwayat' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hasil Validasi</label>
              <Select
                value={draft.hasil}
                onChange={(val: any) => setDraft((f) => ({ ...f, hasil: val || '' }))}
                options={[
                  { value: '', label: '-- Disetujui & Ditolak --' },
                  { value: 'success', label: 'Disetujui' },
                  { value: 'rejected', label: 'Ditolak' },
                ]}
              />
            </div>
          )}
        </div>
      </Drawer>

      {/* Modal Keputusan */}
      <Modal
        isOpen={!!acting}
        onClose={() => !submitting && setActing(null)}
        title={aksi === 'approve' ? 'Setujui Bukti Transfer' : 'Tolak Bukti Transfer'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <p className="font-bold text-slate-900">
              {acting?.kode_transaksi} — {acting?.nama_mahasiswa} ({acting?.nim})
            </p>
            <p>
              Tagihan {acting?.tagihan?.nomor_tagihan} • <b>{formatRupiah(Number(acting?.jumlah_bayar) || 0)}</b> →{' '}
              {acting?.unit_kas?.nama_kas}
            </p>
            {aksi === 'approve' && (
              <p className="text-emerald-700 font-semibold">
                Disetujui = tagihan terbayar, saldo rekening bertambah, jurnal Dr Kas / Cr Piutang terbit.
              </p>
            )}
          </div>
          <Textarea
            label={aksi === 'approve' ? 'Catatan (opsional)' : 'Alasan penolakan *'}
            placeholder={aksi === 'approve' ? 'Catatan verifikasi...' : 'Contoh: dana tidak ditemukan di mutasi rekening...'}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActing(null)} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={submitAksi}
              disabled={submitting}
              className="font-bold"
            >
              {submitting ? 'Memproses...' : aksi === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
