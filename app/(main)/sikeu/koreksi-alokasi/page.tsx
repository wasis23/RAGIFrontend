'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Eye, CheckCircle2, XCircle, Play, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import type { KoreksiAlokasi } from '@/types/sikeu.types';
import { KOREKSI_ALOKASI_STATUS_OPTIONS } from '@/types/sikeu.types';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'badge badge-yellow',
    approved: 'badge badge-blue',
    applied: 'badge badge-green',
    rejected: 'badge badge-red',
    cancelled: 'badge badge-gray',
  };
  const label: Record<string, string> = {
    pending: 'Pending',
    approved: 'Disetujui',
    applied: 'Diterapkan',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
  };
  return <span className={`${map[status] ?? 'badge badge-gray'} text-2xs font-bold`}>{label[status] ?? status}</span>;
}

export default function KoreksiAlokasiPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('sikeu.tagihan.create');
  const canApprove = hasPermission('sikeu.approval.approve');
  const canReject = hasPermission('sikeu.approval.reject');
  const [data, setData] = useState<KoreksiAlokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSortBy, setFilterSortBy] = useState('id');
  const [filterSortOrder, setFilterSortOrder] = useState('desc');
  const [applied, setApplied] = useState({ search: '', status: 'all', sort_by: 'id', sort_order: 'desc' });

  const [confirm, setConfirm] = useState<{ action: 'approve' | 'apply' | 'reject' | 'cancel'; id: number | null }>({
    action: 'approve',
    id: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await sikeuService.getKoreksiAlokasiList({
          page,
          per_page: pagination.per_page,
          search: applied.search || undefined,
          status: applied.status,
          sort_by: applied.sort_by,
          sort_order: applied.sort_order,
        });
        if (res?.data) {
          setData(res.data as KoreksiAlokasi[]);
          if (res.meta) {
            setPagination({
              current_page: res.meta.current_page ?? 1,
              per_page: res.meta.per_page ?? 15,
              total: res.meta.total ?? 0,
              last_page: res.meta.last_page ?? 1,
            });
          }
        }
      } catch {
        toast.error('Gagal memuat daftar koreksi alokasi');
      } finally {
        setLoading(false);
      }
    },
    [applied, pagination.per_page]
  );

  useEffect(() => {
    fetchData(1);
  }, [applied, fetchData]);

  const handleConfirm = async () => {
    if (!confirm.id) return;
    setConfirmLoading(true);
    try {
      if (confirm.action === 'approve') await sikeuService.approveKoreksiAlokasi(confirm.id);
      if (confirm.action === 'apply') await sikeuService.applyKoreksiAlokasi(confirm.id);
      if (confirm.action === 'reject') await sikeuService.rejectKoreksiAlokasi(confirm.id);
      if (confirm.action === 'cancel') await sikeuService.cancelKoreksiAlokasi(confirm.id);
      toast.success('Aksi koreksi berhasil diproses');
      setConfirm({ action: 'approve', id: null });
      fetchData(pagination.current_page);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses aksi koreksi');
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: ColumnDef<KoreksiAlokasi>[] = [
    {
      key: 'nomor_koreksi',
      label: 'NOMOR KOREKSI',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-900 font-mono">{row.nomor_koreksi}</p>
          <p className="text-2xs text-slate-500 mt-0.5">{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      ),
    },
    {
      key: 'alasan',
      label: 'ALASAN & REFERENSI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">{row.alasan}</p>
          <p className="text-2xs text-slate-500 mt-0.5">{row.referensi || '-'}</p>
        </div>
      ),
    },
    {
      key: 'total_nominal_dialihkan',
      label: 'NOMINAL DIALIHKAN',
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 tabular-nums">{formatRupiah(Number(row.total_nominal_dialihkan))}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              { label: 'Detail', icon: <Eye size={14} />, onClick: () => router.push(`/sikeu/koreksi-alokasi/${row.id}`) },
              ...(row.status === 'pending' && canApprove
                ? [{ label: 'Setujui', icon: <CheckCircle2 size={14} />, onClick: () => setConfirm({ action: 'approve', id: row.id }) }]
                : []),
              ...(row.status === 'approved' && canApprove
                ? [{ label: 'Terapkan', icon: <Play size={14} />, onClick: () => setConfirm({ action: 'apply', id: row.id }) }]
                : []),
              ...(row.status === 'pending' || row.status === 'approved'
                ? [
                    ...(canReject
                      ? [
                          { label: 'Tolak', icon: <XCircle size={14} />, onClick: () => setConfirm({ action: 'reject', id: row.id }) },
                          { label: 'Batalkan', icon: <Ban size={14} />, onClick: () => setConfirm({ action: 'cancel', id: row.id }) },
                        ]
                      : []),
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Koreksi Alokasi Pembayaran"
        description="Pindahkan alokasi pembayaran antar tagihan mahasiswa yang sama. Kekurangan otomatis diusulkan sebagai tagihan koreksi."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)} className="font-bold min-h-[40px]">
              Filter
            </Button>
            {canCreate && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/sikeu/koreksi-alokasi/create')} className="font-bold min-h-[40px]">
                Buat Koreksi
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        data={data}
        isLoading={loading}
        columns={columns}
        meta={pagination}
        onPageChange={(p) => fetchData(p)}
        emptyMessage="Belum ada koreksi alokasi. Buat koreksi baru untuk memindahkan alokasi pembayaran."
      />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Koreksi Alokasi">
        <div className="space-y-4">
          <Input label="Pencarian" placeholder="Nomor koreksi / alasan..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select
            label="Status"
            value={filterStatus}
            onChange={(val: any) => setFilterStatus(typeof val === 'object' && val?.target ? val.target.value : val || 'all')}
            options={KOREKSI_ALOKASI_STATUS_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan"
              value={filterSortBy}
              onChange={(val: any) => setFilterSortBy(typeof val === 'object' && val?.target ? val.target.value : val || 'id')}
              options={[
                { value: 'id', label: 'Terbaru' },
                { value: 'nomor_koreksi', label: 'Nomor Koreksi' },
                { value: 'status', label: 'Status' },
                { value: 'total_nominal_dialihkan', label: 'Nominal' },
              ]}
            />
            <Select
              label="Arah"
              value={filterSortOrder}
              onChange={(val: any) => setFilterSortOrder(typeof val === 'object' && val?.target ? val.target.value : val || 'desc')}
              options={[
                { value: 'asc', label: 'Menaik' },
                { value: 'desc', label: 'Menurun' },
              ]}
            />
          </div>
          <div className="pt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-bold"
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('all');
                setFilterSortBy('id');
                setFilterSortOrder('desc');
                setApplied({ search: '', status: 'all', sort_by: 'id', sort_order: 'desc' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="flex-1 font-bold"
              onClick={() => {
                setApplied({ search: filterSearch, status: filterStatus, sort_by: filterSortBy, sort_order: filterSortOrder });
                setShowFilter(false);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={confirm.id !== null}
        onClose={() => setConfirm({ action: 'approve', id: null })}
        onConfirm={handleConfirm}
        title={
          confirm.action === 'approve'
            ? 'Setujui Koreksi?'
            : confirm.action === 'apply'
              ? 'Terapkan Koreksi?'
              : confirm.action === 'reject'
                ? 'Tolak Koreksi?'
                : 'Batalkan Koreksi?'
        }
        message={
          confirm.action === 'apply'
            ? 'Alokasi akan dipindahkan secara permanen dan tagihan kekurangan otomatis diterbitkan bila target masih bersisa.'
            : 'Pastikan keputusan ini sudah sesuai hasil verifikasi keuangan.'
        }
        confirmText={confirm.action === 'apply' ? 'Ya, Terapkan' : confirm.action === 'approve' ? 'Ya, Setujui' : 'Ya, Lanjutkan'}
        variant={confirm.action === 'reject' || confirm.action === 'cancel' ? 'danger' : 'primary'}
        isLoading={confirmLoading}
      />
    </div>
  );
}
