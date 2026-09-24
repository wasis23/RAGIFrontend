'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Plus,
  Filter,
  Search,
  CheckCircle,
  Clock,
  FileCheck,
  Calendar,
  MapPin,
  Car,
  Users,
  Eye,
  Check,
  Upload,
  Trash2,
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
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  SuratTugas,
  SuratTugasMasters,
  SuratTugasStatus,
} from '@/types/simpeg.surat-tugas.types';
import type { PaginationMeta } from '@/types/api.types';

export default function SuratTugasListPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole, hasPermission } = useAuth();
  const canApprove = isAdmin || hasPermission('simpeg.surat_tugas.approve');
  const canCreate = isAdmin || hasPermission('simpeg.surat_tugas.create');
  const canDelete = isAdmin || hasPermission('simpeg.surat_tugas.delete');

  const [items, setItems] = useState<SuratTugas[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [masters, setMasters] = useState<SuratTugasMasters | null>(null);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('');
  const [transportasiFilter, setTransportasiFilter] = useState<string>('');
  const [tahunFilter, setTahunFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Approval Modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<SuratTugas | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'disetujui' | 'ditolak'>('disetujui');
  const [nomorSurat, setNomorSurat] = useState('');
  const [catatanApproval, setCatatanApproval] = useState('');
  const [fileSuratTugas, setFileSuratTugas] = useState<File | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // LPJ Modal state
  const [lpjModalOpen, setLpjModalOpen] = useState(false);
  const [selectedForLpj, setSelectedForLpj] = useState<SuratTugas | null>(null);
  const [fileLpj, setFileLpj] = useState<File | null>(null);
  const [laporanKegiatan, setLaporanKegiatan] = useState('');
  const [biayaRealisasi, setBiayaRealisasi] = useState('');
  const [isSubmittingLpj, setIsSubmittingLpj] = useState(false);

  // Delete Confirm Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SuratTugas | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await simpegSuratTugasService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
        }
      } catch (err: any) {
        console.error('Gagal mengambil master surat tugas', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (kategoriFilter) params.kategori_kegiatan_id = kategoriFilter;
      if (transportasiFilter) params.jenis_transportasi_id = transportasiFilter;
      if (tahunFilter) params.tahun = tahunFilter;

      const res = await simpegSuratTugasService.getList(params);
      if (res.status === 'success' && res.data) {
        setItems(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat data surat tugas.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, kategoriFilter, transportasiFilter, tahunFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter reset
  const handleResetFilter = () => {
    setSearch('');
    setStatusFilter('');
    setKategoriFilter('');
    setTransportasiFilter('');
    setTahunFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
    setIsFilterOpen(false);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: SuratTugasStatus) => {
    switch (status) {
      case 'disetujui':
        return <Badge variant="success">Disetujui</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'selesai':
        return <Badge variant="info">Selesai (LPJ Masuk)</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draf</Badge>;
      case 'diajukan':
      default:
        return <Badge variant="warning">Menunggu Persetujuan</Badge>;
    }
  };

  // Submit Approval
  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForApproval) return;
    if (approvalStatus === 'disetujui' && !nomorSurat.trim()) {
      toast.error('Nomor surat tugas resmi wajib diisi.');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      await simpegSuratTugasService.approve(selectedForApproval.id, {
        status: approvalStatus,
        nomor_surat: nomorSurat,
        catatan_approval: catatanApproval,
        file_surat_tugas: fileSuratTugas,
      });

      toast.success(
        approvalStatus === 'disetujui'
          ? 'Surat tugas disetujui! Presensi dinas luar tim telah diaktifkan otomatis.'
          : 'Surat tugas ditolak.'
      );
      setApprovalModalOpen(false);
      setSelectedForApproval(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan surat tugas.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Submit LPJ
  const handleSubmitLpj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForLpj || !fileLpj) {
      toast.error('Berkas laporan LPJ (PDF) wajib diunggah.');
      return;
    }

    setIsSubmittingLpj(true);
    try {
      await simpegSuratTugasService.uploadLpj(selectedForLpj.id, {
        file_lpj: fileLpj,
        laporan_kegiatan: laporanKegiatan,
        biaya_realisasi: biayaRealisasi ? parseFloat(biayaRealisasi) : undefined,
      });

      toast.success('Laporan LPJ dinas berhasil diunggah.');
      setLpjModalOpen(false);
      setSelectedForLpj(null);
      setFileLpj(null);
      setLaporanKegiatan('');
      setBiayaRealisasi('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah laporan LPJ.');
    } finally {
      setIsSubmittingLpj(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await simpegSuratTugasService.delete(itemToDelete.id);
      toast.success('Pengajuan surat tugas berhasil dihapus.');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus surat tugas.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary counts
  const totalCount = meta?.total ?? items.length;
  const pendingCount = items.filter((i) => i.status === 'diajukan').length;
  const approvedCount = items.filter((i) => i.status === 'disetujui').length;
  const completedCount = items.filter((i) => i.status === 'selesai').length;

  // Options for Selects
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'diajukan', label: 'Menunggu Approval' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'selesai', label: 'Selesai (LPJ Masuk)' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'draft', label: 'Draf' },
  ];

  const kategoriOptions = [
    { value: '', label: 'Semua Kategori' },
    ...(masters?.kategori_kegiatan.map((k) => ({ value: k.id.toString(), label: k.nama })) || []),
  ];

  const transportasiOptions = [
    { value: '', label: 'Semua Transportasi' },
    ...(masters?.jenis_transportasi.map((t) => ({ value: t.id.toString(), label: t.nama })) || []),
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Tgl Pembuatan' },
    { value: 'tanggal_berangkat', label: 'Tgl Berangkat' },
    { value: 'nomor_surat', label: 'Nomor Surat' },
    { value: 'status', label: 'Status' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Terbaru (Desc)' },
    { value: 'asc', label: 'Terlama (Asc)' },
  ];

  // Table columns
  const columns: ColumnDef<SuratTugas>[] = [
    {
      key: 'nama_kegiatan',
      label: 'Kegiatan & Nomor Surat',
      render: (row: SuratTugas) => (
        <div className="space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{row.nama_kegiatan}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {row.nomor_surat ? (
              <span
                className="text-2xs font-mono font-semibold px-2 py-0.5 rounded border"
                style={{
                  color: 'var(--module-primary)',
                  backgroundColor: 'var(--module-primary-subtle)',
                  borderColor: 'var(--module-primary)',
                }}
              >
                {row.nomor_surat}
              </span>
            ) : (
              <span className="text-2xs text-slate-400 italic">Belum ada nomor resmi</span>
            )}
            {row.kategori_kegiatan && (
              <span className="text-2xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {row.kategori_kegiatan.nama}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'pegawai_id',
      label: 'Penanggung Jawab / Tim',
      render: (row: SuratTugas) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {row.pegawai?.nama_lengkap || 'Pegawai'}
          </p>
          <p className="text-2xs font-mono text-slate-400">
            {row.pegawai?.nip ? `NIP. ${row.pegawai.nip}` : row.pegawai?.unit_kerja?.nama || '-'}
          </p>
          {row.anggota && row.anggota.length > 0 && (
            <div className="flex items-center gap-1 text-2xs text-sky-700 font-medium pt-0.5">
              <Users size={12} />
              <span>+{row.anggota.length} Anggota Rombongan</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'lokasi_tujuan',
      label: 'Tujuan & Jadwal',
      render: (row: SuratTugas) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
            <MapPin size={13} className="text-rose-500 shrink-0" />
            <span>{row.lokasi_tujuan}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-2xs font-mono">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span>
              {row.tanggal_berangkat} s/d {row.tanggal_kembali}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_transportasi_id',
      label: 'Armada & Transportasi',
      render: (row: SuratTugas) => (
        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Car size={13} className="text-slate-500 shrink-0" />
            <span>{row.jenis_transportasi?.nama || 'Transportasi'}</span>
          </div>
          {row.kendaraan_dinas && (
            <p className="text-2xs text-slate-400">{row.kendaraan_dinas}</p>
          )}
          {row.nama_driver && (
            <p className="text-2xs text-slate-400">Driver: {row.nama_driver}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: SuratTugas) => (
        <div className="space-y-1">
          {renderStatusBadge(row.status)}
          {row.file_lpj ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <FileCheck size={12} />
              <span>LPJ Ada</span>
            </div>
          ) : row.status === 'disetujui' ? (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <Clock size={12} />
              <span>Menunggu LPJ</span>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row: SuratTugas) => {
        const actionItems: DropdownMenuItem[] = [
          {
            label: 'Lihat Rincian & Logistik',
            icon: <Eye size={16} />,
            onClick: () => router.push(`/simpeg/surat-tugas/${row.id}`),
          },
        ];

        if (canApprove && row.status === 'diajukan') {
          actionItems.push({
            label: 'Persetujuan / Approval',
            icon: <Check size={16} />,
            onClick: () => {
              setSelectedForApproval(row);
              setNomorSurat(row.nomor_surat || '');
              setCatatanApproval('');
              setApprovalStatus('disetujui');
              setApprovalModalOpen(true);
            },
          });
        }

        const isKetuaOrAdmin = canApprove || hasRole('superadmin') || hasPermission('simpeg.surat_tugas.update');

        if (isKetuaOrAdmin && ['disetujui', 'selesai'].includes(row.status)) {
          actionItems.push({
            label: row.file_lpj ? 'Perbarui LPJ' : 'Unggah Laporan LPJ',
            icon: <Upload size={16} />,
            onClick: () => {
              setSelectedForLpj(row);
              setLaporanKegiatan(row.laporan_kegiatan || '');
              setBiayaRealisasi(row.biaya_realisasi ? row.biaya_realisasi.toString() : '');
              setLpjModalOpen(true);
            },
          });
        }

        if (canDelete && ['draft', 'diajukan', 'ditolak'].includes(row.status)) {
          actionItems.push({
            label: 'Hapus Pengajuan',
            icon: <Trash2 size={16} />,
            variant: 'danger',
            onClick: () => {
              setItemToDelete(row);
              setDeleteDialogOpen(true);
            },
          });
        }

        return <DropdownMenu items={actionItems} />;
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Surat Tugas & Logistik Dinas"
        description="Pengelolaan perjalanan dinas, penugasan armada kendaraan kampus, rombongan tim dosen, persetujuan pimpinan, serta pertanggungjawaban LPJ."
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
                onClick={() => router.push('/simpeg/surat-tugas/create')}
              >
                Buat Pengajuan
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Penugasan</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Menunggu Approval</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Disetujui / Dinas Aktif</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{approvedCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">LPJ Selesai</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        meta={meta || undefined}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada permohonan surat tugas dinas yang tercatat."
      />

      {/* Filter Drawer */}
      <Drawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Data Surat Tugas"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="outline" size="sm" onClick={handleResetFilter}>
              Reset Filter
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Pencarian</label>
            <Input
              placeholder="Cari kegiatan, nomor surat, tujuan, pegawai..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Status Pengajuan</label>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(val: any) => setStatusFilter(val || '')}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Kategori Kegiatan</label>
            <Select
              options={kategoriOptions}
              value={kategoriFilter}
              onChange={(val: any) => setKategoriFilter(val || '')}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Moda Transportasi</label>
            <Select
              options={transportasiOptions}
              value={transportasiFilter}
              onChange={(val: any) => setTransportasiFilter(val || '')}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tahun Berangkat</label>
            <Input
              type="number"
              placeholder="Contoh: 2026"
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Urutkan Berdasarkan</label>
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(val: any) => setSortBy(val || 'created_at')}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Arah Urutan</label>
              <Select
                options={sortOrderOptions}
                value={sortOrder}
                onChange={(val: any) => setSortOrder(val as 'asc' | 'desc')}
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => {
          if (!isSubmittingApproval) {
            setApprovalModalOpen(false);
            setSelectedForApproval(null);
          }
        }}
        title="Persetujuan Surat Tugas & Penomoran Resmi"
        size="md"
      >
        <form onSubmit={handleSubmitApproval} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-900">{selectedForApproval?.nama_kegiatan}</p>
            <p className="text-slate-600">
              Pemohon / Ketua: {selectedForApproval?.pegawai?.nama_lengkap}
            </p>
            <p className="text-slate-600">
              Tujuan: {selectedForApproval?.lokasi_tujuan} ({selectedForApproval?.tanggal_berangkat} s/d{' '}
              {selectedForApproval?.tanggal_kembali})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Keputusan Approval <span className="text-rose-500">*</span>
              </label>
              <Select
                options={[
                  { value: 'disetujui', label: 'Setujui & Terbitkan Surat' },
                  { value: 'ditolak', label: 'Tolak Permohonan' },
                ]}
                value={approvalStatus}
                onChange={(val: any) => setApprovalStatus(val as 'disetujui' | 'ditolak')}
              />
            </div>

            {approvalStatus === 'disetujui' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nomor Surat Tugas Resmi <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: ST/102/REK/IX/2026"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Pimpinan / Disposisi
            </label>
            <Input
              placeholder="Catatan persetujuan atau alasan penolakan..."
              value={catatanApproval}
              onChange={(e) => setCatatanApproval(e.target.value)}
            />
          </div>

          {approvalStatus === 'disetujui' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Unggah Berkas Surat Tugas Resmi (PDF, Opsional)
              </label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileSuratTugas(e.target.files[0]);
                  }
                }}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Format PDF, maksimal 10MB.
              </p>
            </div>
          )}

          {approvalStatus === 'disetujui' && (
            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-800 flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 text-sky-600 mt-0.5" />
              <span>
                Dengan menyetujui surat tugas ini, sistem akan secara otomatis mencatatkan presensi
                kepegawaian status <strong>DINAS LUAR</strong> untuk ketua dan seluruh anggota pada rentang
                tanggal keberangkatan s/d selesai.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovalModalOpen(false)}
              disabled={isSubmittingApproval}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={approvalStatus === 'disetujui' ? 'primary' : 'danger'}
              size="sm"
              isLoading={isSubmittingApproval}
            >
              {approvalStatus === 'disetujui' ? 'Setujui & Terbitkan' : 'Tolak Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LPJ Modal */}
      <Modal
        isOpen={lpjModalOpen}
        onClose={() => {
          if (!isSubmittingLpj) {
            setLpjModalOpen(false);
            setSelectedForLpj(null);
          }
        }}
        title="Unggah Laporan Pertanggungjawaban (LPJ)"
        size="md"
      >
        <form onSubmit={handleSubmitLpj} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-900">{selectedForLpj?.nama_kegiatan}</p>
            <p className="text-slate-600 font-mono">No. Surat: {selectedForLpj?.nomor_surat || '-'}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Berkas Dokumen LPJ (PDF) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="file"
              accept=".pdf"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileLpj(e.target.files[0]);
                }
              }}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Wajib format PDF, maksimal 10MB.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Total Realisasi Biaya (Rp)
            </label>
            <Input
              type="number"
              placeholder="Contoh: 3500000"
              value={biayaRealisasi}
              onChange={(e) => setBiayaRealisasi(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ringkasan Capaian / Laporan Kegiatan
            </label>
            <Input
              placeholder="Uraian singkat capaian dinas yang telah diselesaikan..."
              value={laporanKegiatan}
              onChange={(e) => setLaporanKegiatan(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLpjModalOpen(false)}
              disabled={isSubmittingLpj}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingLpj}>
              Simpan LPJ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Pengajuan Surat Tugas"
        message={`Apakah Anda yakin ingin menghapus permohonan surat tugas "${itemToDelete?.nama_kegiatan}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
