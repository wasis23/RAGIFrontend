'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  Check,
  Trash2,
  UserCheck,
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
import { simpegIzinKerjaService } from '@/services/simpeg.izin-sk.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  IzinJamKerja,
  IzinJamKerjaMasters,
  IzinJamKerjaStatus,
} from '@/types/simpeg.izin-sk.types';
import type { PaginationMeta } from '@/types/api.types';

export default function IzinKerjaListPage() {
  const router = useRouter();
  const { user, isAdmin, hasPermission } = useAuth();
  const canApprove = isAdmin || hasPermission('simpeg.izin_kerja.approve');
  const canCreate = isAdmin || hasPermission('simpeg.izin_kerja.create');
  const canDelete = isAdmin || hasPermission('simpeg.izin_kerja.delete');

  const [items, setItems] = useState<IzinJamKerja[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [masters, setMasters] = useState<IzinJamKerjaMasters | null>(null);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [jenisIzinFilter, setJenisIzinFilter] = useState<string>('');
  const [tanggalMulaiFilter, setTanggalMulaiFilter] = useState<string>('');
  const [tanggalSelesaiFilter, setTanggalSelesaiFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Approval Modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<IzinJamKerja | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'disetujui' | 'ditolak'>('disetujui');
  const [catatanApproval, setCatatanApproval] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Delete Confirm Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IzinJamKerja | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await simpegIzinKerjaService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
        }
      } catch (err: any) {
        console.error('Gagal mengambil master jenis izin', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch list data
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
      if (statusFilter) params.status = statusFilter;
      if (jenisIzinFilter) params.master_jenis_izin_id = jenisIzinFilter;
      if (tanggalMulaiFilter) params.tanggal_mulai = tanggalMulaiFilter;
      if (tanggalSelesaiFilter) params.tanggal_selesai = tanggalSelesaiFilter;

      const res = await simpegIzinKerjaService.getList(params);
      if (res.status === 'success' && res.data) {
        setItems(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat data izin jam kerja.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, jenisIzinFilter, tanggalMulaiFilter, tanggalSelesaiFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter reset
  const handleResetFilter = () => {
    setSearch('');
    setStatusFilter('');
    setJenisIzinFilter('');
    setTanggalMulaiFilter('');
    setTanggalSelesaiFilter('');
    setSortBy('tanggal');
    setSortOrder('desc');
    setPage(1);
    setIsFilterOpen(false);
  };

  // Status badge
  const renderStatusBadge = (status: IzinJamKerjaStatus) => {
    switch (status) {
      case 'disetujui':
        return <Badge variant="success">Disetujui</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'menunggu':
      default:
        return <Badge variant="warning">Menunggu Approval</Badge>;
    }
  };

  // Submit Approval
  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForApproval) return;

    setIsSubmittingApproval(true);
    try {
      await simpegIzinKerjaService.approve(selectedForApproval.id, {
        status: approvalStatus,
        catatan_approval: catatanApproval,
      });

      toast.success(
        approvalStatus === 'disetujui'
          ? 'Izin jam kerja disetujui! Status presensi telah disinkronisasikan otomatis.'
          : 'Izin jam kerja ditolak.'
      );
      setApprovalModalOpen(false);
      setSelectedForApproval(null);
      setCatatanApproval('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval izin.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await simpegIzinKerjaService.delete(itemToDelete.id);
      toast.success('Pengajuan izin jam kerja berhasil dihapus.');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengajuan izin.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Options for Select
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'menunggu', label: 'Menunggu Approval' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
  ];

  const jenisIzinOptions = [
    { value: '', label: 'Semua Jenis Izin' },
    ...(masters?.jenis_izin.map((item) => ({ value: item.id.toString(), label: item.nama })) || []),
  ];

  const sortOptions = [
    { value: 'tanggal', label: 'Tanggal Izin' },
    { value: 'created_at', label: 'Tanggal Pengajuan' },
    { value: 'status', label: 'Status' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Terbaru / Descending' },
    { value: 'asc', label: 'Terlama / Ascending' },
  ];

  const approvalDecisionOptions = [
    { value: 'disetujui', label: 'Setujui Izin' },
    { value: 'ditolak', label: 'Tolak Izin' },
  ];

  // KPI Metrics Calculation
  const totalCount = meta?.total ?? items.length;
  const menungguCount = items.filter((i) => i.status === 'menunggu').length;
  const disetujuiCount = items.filter((i) => i.status === 'disetujui').length;
  const ditolakCount = items.filter((i) => i.status === 'ditolak').length;

  const currentPegawaiId = (user as any)?.pegawai?.id;

  // Dropdown action items per row
  const getRowActions = (row: IzinJamKerja): DropdownMenuItem[] => {
    const actions: DropdownMenuItem[] = [
      {
        label: 'Lihat Detail',
        icon: <Eye size={16} />,
        onClick: () => router.push(`/simpeg/izin-kerja/${row.id}`),
      },
    ];

    if (canApprove && row.status === 'menunggu') {
      actions.push({
        label: 'Proses Approval',
        icon: <Check size={16} className="text-emerald-600" />,
        onClick: () => {
          setSelectedForApproval(row);
          setApprovalStatus('disetujui');
          setCatatanApproval('');
          setApprovalModalOpen(true);
        },
      });
    }

    if (row.status === 'menunggu' && (canDelete || row.pegawai_id === currentPegawaiId)) {
      actions.push({
        label: 'Hapus Izin',
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
  const columns: ColumnDef<IzinJamKerja>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai Pemohon',
      render: (row: IzinJamKerja) => (
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
      key: 'jenis_izin',
      label: 'Jenis Izin',
      render: (row: IzinJamKerja) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.jenis_izin?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal & Jam',
      render: (row: IzinJamKerja) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {new Date(row.tanggal).toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-2xs text-slate-400 font-mono">
            {row.jam_mulai.substring(0, 5)} - {row.jam_selesai.substring(0, 5)} WIB
          </div>
        </div>
      ),
    },
    {
      key: 'alasan',
      label: 'Alasan Izin',
      render: (row: IzinJamKerja) => (
        <p className="line-clamp-2 max-w-xs text-xs text-slate-600 dark:text-slate-300">
          {row.alasan}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: IzinJamKerja) => renderStatusBadge(row.status),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (row: IzinJamKerja) => (
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
        title="Izin Parsial Jam Kerja"
        description="Kelola perizinan keluar kampus sementara, datang terlambat, dan pulang lebih awal yang terintegrasi presensi harian."
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
                onClick={() => router.push('/simpeg/izin-kerja/create')}
              >
                Ajukan Izin
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pengajuan</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Menunggu Approval</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{menungguCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Disetujui</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{disetujuiCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <UserCheck size={24} />
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
        title="Filter Izin Jam Kerja"
      >
        <div className="space-y-4 p-4">
          <Input
            label="Pencarian"
            type="text"
            placeholder="Cari alasan izin, nama pegawai, NIP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Jenis Izin Jam Kerja"
            options={jenisIzinOptions}
            value={jenisIzinFilter}
            onChange={(val: any) => setJenisIzinFilter(val || '')}
          />

          <Select
            label="Status Approval"
            options={statusOptions}
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(val || '')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={tanggalMulaiFilter}
              onChange={(e) => setTanggalMulaiFilter(e.target.value)}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={tanggalSelesaiFilter}
              onChange={(e) => setTanggalSelesaiFilter(e.target.value)}
            />
          </div>

          <hr className="my-4 border-slate-200 dark:border-slate-700" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              options={sortOptions}
              value={sortBy}
              onChange={(val: any) => setSortBy(val || 'tanggal')}
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

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Proses Approval Izin Jam Kerja"
      >
        <form onSubmit={handleSubmitApproval} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-white">
              {selectedForApproval?.pegawai?.nama_lengkap}
            </p>
            <p className="mt-1">
              {selectedForApproval?.jenis_izin?.nama} • {selectedForApproval?.tanggal} (
              {selectedForApproval?.jam_mulai} - {selectedForApproval?.jam_selesai})
            </p>
            <p className="mt-1 italic">&ldquo;{selectedForApproval?.alasan}&rdquo;</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Keputusan Approval <span className="text-rose-500">*</span>
            </label>
            <Select
              options={approvalDecisionOptions}
              value={approvalStatus}
              onChange={(val: any) => setApprovalStatus(val)}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Approval
            </label>
            <Input
              type="text"
              placeholder="Tambahkan catatan pertimbangan jika diperlukan..."
              value={catatanApproval}
              onChange={(e) => setCatatanApproval(e.target.value)}
              className="mt-1 w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovalModalOpen(false)}
              disabled={isSubmittingApproval}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingApproval}
            >
              {isSubmittingApproval ? 'Memproses...' : 'Simpan Keputusan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pengajuan Izin Jam Kerja"
        message={`Apakah Anda yakin ingin menghapus pengajuan izin pada tanggal ${itemToDelete?.tanggal}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pengajuan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
