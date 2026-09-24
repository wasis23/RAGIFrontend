'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  Check,
  Trash2,
  ShieldCheck,
  FileBadge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { simpegSkPegawaiService } from '@/services/simpeg.izin-sk.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  SkPegawai,
  SkPegawaiMasters,
  SkVerifikasiStatus,
} from '@/types/simpeg.izin-sk.types';
import type { PaginationMeta } from '@/types/api.types';

export default function SkPegawaiListPage() {
  const router = useRouter();
  const { user, isAdmin, hasPermission } = useAuth();
  const canVerify = isAdmin || hasPermission('simpeg.sk_pegawai.verify');
  const canCreate = isAdmin || hasPermission('simpeg.sk_pegawai.create');
  const canDelete = isAdmin || hasPermission('simpeg.sk_pegawai.delete');

  const [items, setItems] = useState<SkPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [masters, setMasters] = useState<SkPegawaiMasters | null>(null);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('');
  const [tahunFilter, setTahunFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('tanggal_sk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Verification Modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedForVerify, setSelectedForVerify] = useState<SkPegawai | null>(null);
  const [verifikasiStatus, setVerifikasiStatus] = useState<'terverifikasi' | 'ditolak'>('terverifikasi');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Delete Confirm Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SkPegawai | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await simpegSkPegawaiService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
        }
      } catch (err: any) {
        console.error('Gagal memuat master kategori SK', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch data list
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 15,
        sort_by: sortBy,
        sort_dir: sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter) params.status_verifikasi = statusFilter;
      if (kategoriFilter) params.kategori_sk_id = kategoriFilter;
      if (tahunFilter) params.tahun = tahunFilter;

      const res = await simpegSkPegawaiService.getList(params);
      if (res.status === 'success' && res.data) {
        setItems(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat arsip SK pegawai.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, kategoriFilter, tahunFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter reset
  const handleResetFilter = () => {
    setSearch('');
    setStatusFilter('');
    setKategoriFilter('');
    setTahunFilter('');
    setSortBy('tanggal_sk');
    setSortOrder('desc');
    setPage(1);
    setIsFilterOpen(false);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: SkVerifikasiStatus) => {
    switch (status) {
      case 'terverifikasi':
        return <Badge variant="success">Terverifikasi</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">Menunggu Verifikasi</Badge>;
    }
  };

  // Submit Verification
  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForVerify) return;

    setIsSubmittingVerify(true);
    try {
      await simpegSkPegawaiService.verify(selectedForVerify.id, {
        status_verifikasi: verifikasiStatus,
        catatan_verifikasi: catatanVerifikasi,
      });

      toast.success(
        verifikasiStatus === 'terverifikasi'
          ? 'Berkas SK berhasil diverifikasi oleh Tim SDM.'
          : 'Laporan SK ditolak.'
      );
      setVerifyModalOpen(false);
      setSelectedForVerify(null);
      setCatatanVerifikasi('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses verifikasi SK.');
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await simpegSkPegawaiService.delete(itemToDelete.id);
      toast.success('Laporan SK pegawai berhasil dihapus.');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus SK pegawai.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Select Options
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu Verifikasi' },
    { value: 'terverifikasi', label: 'Terverifikasi' },
    { value: 'ditolak', label: 'Ditolak' },
  ];

  const kategoriOptions = [
    { value: '', label: 'Semua Kategori' },
    ...(masters?.kategori_sk.map((k) => ({ value: k.id.toString(), label: k.nama })) || []),
  ];

  const sortOptions = [
    { value: 'tanggal_sk', label: 'Tanggal SK' },
    { value: 'tmt_sk', label: 'TMT SK' },
    { value: 'created_at', label: 'Waktu Lapor' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Terbaru / Descending' },
    { value: 'asc', label: 'Terlama / Ascending' },
  ];

  const verifyDecisionOptions = [
    { value: 'terverifikasi', label: 'Verifikasi Sah (Terverifikasi)' },
    { value: 'ditolak', label: 'Tolak Dokumen SK' },
  ];

  // KPI Metrics
  const totalCount = meta?.total ?? items.length;
  const pendingCount = items.filter((i) => i.status_verifikasi === 'pending').length;
  const terverifikasiCount = items.filter((i) => i.status_verifikasi === 'terverifikasi').length;
  const ditolakCount = items.filter((i) => i.status_verifikasi === 'ditolak').length;

  const currentPegawaiId = (user as any)?.pegawai?.id;

  // Dropdown action items per row
  const getRowActions = (row: SkPegawai): DropdownMenuItem[] => {
    const actions: DropdownMenuItem[] = [
      {
        label: 'Lihat Detail',
        icon: <Eye size={16} />,
        onClick: () => router.push(`/simpeg/sk-pegawai/${row.id}`),
      },
    ];

    if (canVerify && row.status_verifikasi === 'pending') {
      actions.push({
        label: 'Verifikasi Berkas',
        icon: <Check size={16} className="text-emerald-600" />,
        onClick: () => {
          setSelectedForVerify(row);
          setVerifikasiStatus('terverifikasi');
          setCatatanVerifikasi('');
          setVerifyModalOpen(true);
        },
      });
    }

    if (
      (row.status_verifikasi === 'pending' || row.status_verifikasi === 'ditolak') &&
      (canDelete || row.pegawai_id === currentPegawaiId)
    ) {
      actions.push({
        label: 'Hapus SK',
        icon: <Trash2 size={16} className="text-rose-600" />,
        variant: 'danger',
        onClick: () => {
          setItemToDelete(row);
          setDeleteDialogOpen(true);
        },
      });
    }

    return actions;
  };

  // Columns definition
  const columns: ColumnDef<SkPegawai>[] = [
    {
      key: 'nomor_sk',
      label: 'Nomor & Judul SK',
      render: (row: SkPegawai) => (
        <div>
          <div className="font-mono font-bold text-xs text-[var(--module-primary)]">
            {row.nomor_sk}
          </div>
          <div className="text-2xs text-slate-500 line-clamp-1">
            {row.judul_sk}
          </div>
          <div className="text-2xs text-slate-400">
            Penetap: {row.pejabat_penetap}
          </div>
        </div>
      ),
    },
    {
      key: 'pegawai',
      label: 'Pegawai Pemilik',
      render: (row: SkPegawai) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.pegawai?.nama_lengkap || '-'}
          </div>
          <div className="text-2xs font-mono text-slate-400">
            {row.pegawai?.nip ? `NIP. ${row.pegawai.nip}` : row.pegawai?.nidn ? `NIDN. ${row.pegawai.nidn}` : ''}
            {row.pegawai?.unit_kerja?.nama ? ` • ${row.pegawai.unit_kerja.nama}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'kategori_sk',
      label: 'Kategori SK',
      render: (row: SkPegawai) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.kategori_sk?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'tmt_sk',
      label: 'TMT Berlaku',
      render: (row: SkPegawai) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            TMT: {new Date(row.tmt_sk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-2xs text-slate-400">
            {row.tmt_selesai
              ? `s/d ${new Date(row.tmt_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Berlaku Seterusnya'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: SkPegawai) => renderStatusBadge(row.status_verifikasi),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (row: SkPegawai) => (
        <div className="flex justify-end">
          <DropdownMenu items={getRowActions(row)} />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        title="Repositori & Arsip SK Pegawai"
        description="Pusat arsip Surat Keputusan penugasan, jafung, pengangkatan, dan beban kerja dosen/tendik."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterOpen(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button
                icon={<Plus size={16} />}
                onClick={() => router.push('/simpeg/sk-pegawai/create')}
              >
                Laporkan SK
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
            <FileBadge size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Arsip SK</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Menunggu Verifikasi</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Terverifikasi</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{terverifikasiCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ditolak</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{ditolakCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={items}
        meta={meta || undefined}
        isLoading={isLoading}
        onPageChange={setPage}
      />

      {/* Filter Drawer */}
      <Drawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Arsip SK Pegawai"
      >
        <div className="space-y-4 p-4">
          <Input
            label="Pencarian"
            type="text"
            placeholder="Cari nomor SK, judul, pejabat, pegawai..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Kategori SK"
            options={kategoriOptions}
            value={kategoriFilter}
            onChange={(val: any) => setKategoriFilter(val || '')}
          />

          <Select
            label="Status Verifikasi"
            options={statusOptions}
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(val || '')}
          />

          <Input
            label="Tahun Penetapan SK"
            type="number"
            placeholder="Contoh: 2026"
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
          />

          <hr className="my-4 border-slate-200 dark:border-slate-700" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              options={sortOptions}
              value={sortBy}
              onChange={(val: any) => setSortBy(val || 'tanggal_sk')}
            />
            <Select
              label="Arah Urutan"
              options={sortOrderOptions}
              value={sortOrder}
              onChange={(val: any) => setSortOrder(val || 'desc')}
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleResetFilter}
              className="w-1/2"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPage(1);
                setIsFilterOpen(false);
              }}
              className="w-1/2"
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Verifikasi Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verifikasi Dokumen SK Pegawai"
      >
        <form onSubmit={handleSubmitVerify} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-white">
              {selectedForVerify?.nomor_sk}
            </p>
            <p className="mt-0.5">{selectedForVerify?.judul_sk}</p>
            <p className="mt-1 text-slate-500">
              Pegawai: {selectedForVerify?.pegawai?.nama_lengkap} • Kategori: {selectedForVerify?.kategori_sk?.nama}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Hasil Verifikasi Keabsahan Dokumen <span className="text-rose-500">*</span>
            </label>
            <Select
              options={verifyDecisionOptions}
              value={verifikasiStatus}
              onChange={(val: any) => setVerifikasiStatus(val)}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Verifikator SDM
            </label>
            <Input
              type="text"
              placeholder="Berikan alasan atau catatan verifikasi berkas..."
              value={catatanVerifikasi}
              onChange={(e) => setCatatanVerifikasi(e.target.value)}
              className="mt-1 w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerifyModalOpen(false)}
              disabled={isSubmittingVerify}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingVerify}
            >
              {isSubmittingVerify ? 'Menyimpan...' : 'Simpan Verifikasi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Arsip SK Pegawai"
        message={`Apakah Anda yakin ingin menghapus arsip SK Nomor ${itemToDelete?.nomor_sk}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus SK"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
