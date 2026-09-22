'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, BookOpen, CheckCircle, Inbox, Pencil, Lock, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { JurnalUmum } from '@/types/sikeu.types';
import { PaginationMeta } from '@/types/api.types';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const isManualEditable = (j: JurnalUmum) =>
  (j.referensi_id === null || j.referensi_id === undefined) &&
  !String(j.nomor_jurnal || '').startsWith('JRN-TUTUP');

const JENIS_SUMBER_OPTIONS = [
  { value: '', label: '-- Semua Jenis --' },
  { value: 'pembayaran_mahasiswa', label: 'Pembayaran Mahasiswa' },
  { value: 'pemasukan_hibah', label: 'Pemasukan Hibah' },
  { value: 'pencairan_kas', label: 'Pencairan Kas' },
  { value: 'pengeluaran_manual', label: 'Pengeluaran Manual' },
  { value: 'penyesuaian', label: 'Penyesuaian' },
  { value: 'penutupan', label: 'Penutupan (JRN-TUTUP)' },
];

const STATUS_OPTIONS = [
  { value: '', label: '-- Semua Status --' },
  { value: 'posted', label: 'Posted' },
  { value: 'draft', label: 'Draft' },
];

interface JurnalFilters {
  search: string;
  dari: string;
  sampai: string;
  jenis_sumber: string;
  status_posting: string;
}

const EMPTY_FILTERS: JurnalFilters = {
  search: '',
  dari: '',
  sampai: '',
  jenis_sumber: '',
  status_posting: '',
};

export default function JurnalListPage() {
  const router = useRouter();
  const [jurnalList, setJurnalList] = useState<JurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter Drawer state (draft) & applied
  const [showFilter, setShowFilter] = useState(false);
  const [draftFilters, setDraftFilters] = useState<JurnalFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<JurnalFilters>(EMPTY_FILTERS);

  const [deletingItem, setDeletingItem] = useState<JurnalUmum | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadJurnal = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await sikeuService.getJurnalList({
        search: appliedFilters.search || undefined,
        dari: appliedFilters.dari || undefined,
        sampai: appliedFilters.sampai || undefined,
        jenis_sumber: appliedFilters.jenis_sumber || undefined,
        status_posting: appliedFilters.status_posting || undefined,
        page,
        per_page: perPage,
      });
      const raw = res?.data;
      if (Array.isArray(raw)) {
        setJurnalList(raw);
      } else if (raw && Array.isArray(raw.data)) {
        setJurnalList(raw.data);
      } else {
        setJurnalList([]);
      }
      const metaRaw = res?.meta ?? raw?.meta;
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
    } catch (err) {
      console.error('Failed to load jurnal', err);
      setJurnalList([]);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, perPage]);

  useEffect(() => {
    loadJurnal();
  }, [loadJurnal]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.dari) count++;
    if (appliedFilters.sampai) count++;
    if (appliedFilters.jenis_sumber) count++;
    if (appliedFilters.status_posting) count++;
    return count;
  }, [appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setShowFilter(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await sikeuService.deleteJurnal(deletingItem.id);
      toast.success(res?.message || 'Jurnal berhasil dihapus.');
      setDeletingItem(null);
      loadJurnal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jurnal.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<JurnalUmum>[] = [
    {
      key: 'nomor_jurnal',
      label: 'NOMOR JURNAL',
      render: (j) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600">{j.nomor_jurnal}</span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">
            Tgl: {formatDate(j.tanggal_jurnal)}
          </span>
        </div>
      ),
    },
    {
      key: 'jenis_sumber',
      label: 'JENIS SUMBER',
      render: (j) => (
        <Badge variant="indigo" className="capitalize">
          {String(j.jenis_sumber || '-').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN',
      render: (j) => (
        <p className="text-xs font-semibold text-slate-700 line-clamp-1 max-w-md">
          {j.keterangan || '-'}
        </p>
      ),
    },
    {
      key: 'total',
      label: 'TOTAL',
      align: 'right',
      render: (j) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          Rp {Number(j.total_debet || 0).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (j) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={j.status_posting === 'posted' ? 'green' : 'amber'}>
            {j.status_posting === 'posted' ? (
              <>
                <CheckCircle size={12} /> Posted
              </>
            ) : (
              'Draft'
            )}
          </Badge>
          {!isManualEditable(j) && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold text-slate-400">
              <Lock size={11} /> Terkunci
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (j) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={[
              {
                label: 'Edit Jurnal',
                icon: <Pencil size={14} />,
                disabled: !isManualEditable(j),
                onClick: () => router.push(`/sikeu/akuntansi/jurnal/create?edit=${j.id}`),
              },
              {
                label: 'Hapus Jurnal',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                disabled: !isManualEditable(j),
                onClick: () => setDeletingItem(j),
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
        title="Jurnal Umum & Auto-Journal Feed"
        description="Rekapitulasi pencatatan jurnal transaksi otomatis & penyesuaian manual"
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Akuntansi', href: '/sikeu/akuntansi/jurnal' },
          { label: 'Jurnal Umum' },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sikeu')}
              className="font-bold min-h-[38px] text-xs"
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              icon={<BookOpen size={16} />}
              onClick={() => router.push('/sikeu/akuntansi/buku-besar')}
              className="font-bold min-h-[38px] text-xs"
            >
              Buku Besar
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                setDraftFilters(appliedFilters);
                setShowFilter(true);
              }}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-2xs bg-primary-600 text-white rounded-full font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/sikeu/akuntansi/jurnal/create')}
              className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
            >
              Entry Jurnal Manual
            </Button>
          </div>
        }
      />

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-2xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-500">Filter Aktif:</span>
          {appliedFilters.search && (
            <span className="badge badge-blue text-xs font-medium">
              Cari: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {(appliedFilters.dari || appliedFilters.sampai) && (
            <span className="badge badge-blue text-xs font-medium">
              Periode: {appliedFilters.dari ? formatDate(appliedFilters.dari) : '...'} s/d{' '}
              {appliedFilters.sampai ? formatDate(appliedFilters.sampai) : '...'}
            </span>
          )}
          {appliedFilters.jenis_sumber && (
            <span className="badge badge-blue text-xs font-medium capitalize">
              {appliedFilters.jenis_sumber.replace(/_/g, ' ')}
            </span>
          )}
          {appliedFilters.status_posting && (
            <span className="badge badge-blue text-xs font-medium capitalize">
              {appliedFilters.status_posting}
            </span>
          )}
          <button
            onClick={handleResetFilter}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer ml-auto"
          >
            Reset Filter
          </button>
        </div>
      )}

      <DataTable
        data={jurnalList}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(limit) => {
          setPerPage(limit);
          setPage(1);
        }}
        renderExpandedRow={(j) =>
          j.details && j.details.length > 0 ? (
            <div className="table-container bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="table bg-white">
                <thead className="bg-white">
                  <tr className="bg-white">
                    <th className="bg-white">Kode & Nama Akun COA</th>
                    <th className="bg-white" style={{ textAlign: 'right' }}>
                      Debet (Rp)
                    </th>
                    <th className="bg-white" style={{ textAlign: 'right' }}>
                      Kredit (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {j.details.map((d) => (
                    <tr key={d.id} className="bg-white">
                      <td className="bg-white font-medium text-slate-900">
                        [{d.akun?.kode_akun || '-'}] {d.akun?.nama_akun || 'Akun'}
                        {d.keterangan && (
                          <span className="block text-2xs text-slate-400 font-normal">{d.keterangan}</span>
                        )}
                      </td>
                      <td className="bg-white font-mono font-semibold text-emerald-700" style={{ textAlign: 'right' }}>
                        {Number(d.debet) > 0 ? `Rp ${Number(d.debet).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="bg-white font-mono font-semibold text-indigo-700" style={{ textAlign: 'right' }}>
                        {Number(d.kredit) > 0 ? `Rp ${Number(d.kredit).toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Tidak ada rincian baris.</p>
          )
        }
        emptyMessage={
          <EmptyState
            icon={<Inbox size={40} />}
            title="Belum ada jurnal"
            description="Belum ada data jurnal pada rentang/filter ini. Ubah filter atau catat transaksi baru."
          />
        }
      />

      <p className="text-2xs text-slate-500 text-center">
        Klik ikon panah di tiap baris untuk melihat rincian debet/kredit per akun. Pengaturan kode nomor
        jurnal tersedia di menu{' '}
        <button
          type="button"
          onClick={() => router.push('/sikeu/akuntansi/pengaturan')}
          className="font-bold text-primary-700 hover:underline cursor-pointer"
        >
          Pengaturan Akuntansi
        </button>
        .
      </p>

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jurnal"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nomor / Keterangan"
            placeholder="Ketik nomor jurnal atau kata kunci..."
            value={draftFilters.search}
            onChange={(e) => setDraftFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Dari Tanggal"
              value={draftFilters.dari}
              onChange={(e) => setDraftFilters((f) => ({ ...f, dari: e.target.value }))}
            />
            <Input
              type="date"
              label="Sampai Tanggal"
              value={draftFilters.sampai}
              onChange={(e) => setDraftFilters((f) => ({ ...f, sampai: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Sumber</label>
            <Select
              value={draftFilters.jenis_sumber}
              onChange={(val: any) => setDraftFilters((f) => ({ ...f, jenis_sumber: val || '' }))}
              options={JENIS_SUMBER_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Posting</label>
            <Select
              value={draftFilters.status_posting}
              onChange={(val: any) => setDraftFilters((f) => ({ ...f, status_posting: val || '' }))}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => !isDeleting && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Jurnal Manual"
        confirmText="Ya, Hapus Jurnal"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        message={
          deletingItem ? (
            <span>
              Jurnal manual <span className="font-mono font-bold">{deletingItem.nomor_jurnal}</span> akan
              dihapus permanen beserta rincian barisnya. Jurnal otomatis & penutup tidak bisa dihapus di
              sini; penghapusan ditolak bila periodenya sudah ditutup.
            </span>
          ) : (
            'Hapus jurnal ini?'
          )
        }
      />
    </div>
  );
}
