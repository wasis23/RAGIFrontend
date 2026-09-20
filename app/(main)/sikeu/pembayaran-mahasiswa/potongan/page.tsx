'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap,
  Sparkles,
  Receipt,
  Coins,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';

interface PotonganItem {
  id: number;
  mahasiswa_id?: number | null;
  calon_mahasiswa_id?: number | null;
  is_calon_mahasiswa: boolean;
  tipe_referensi: string;
  nim: string;
  nama_mahasiswa: string;
  prodi: string;
  nama_potongan: string;
  tipe_potongan: string;
  nilai_potongan: number;
  total_terpotong_tagihan: number;
  jumlah_tagihan_dipotong: number;
  nomor_sk?: string | null;
  keterangan?: string | null;
  status: string;
  diinput_oleh_nama?: string;
  created_at?: string;
  tagihan_list?: Array<{
    tagihan_id: number;
    nomor_tagihan: string;
    nominal_potongan: number;
    status_tagihan: string;
  }>;
}

export default function PembayaranMahasiswaPotonganPage() {
  const router = useRouter();
  const [data, setData] = useState<PotonganItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTipeRef, setFilterTipeRef] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('id');
  const [filterSortOrder, setFilterSortOrder] = useState<'asc' | 'desc'>('desc');

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    tipe_referensi: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
  });

  // Summary counts
  const [summary, setSummary] = useState({
    total_potongan: 0,
    total_aktif: 0,
    total_nominal_terpotong: 0,
    total_mahasiswa: 0,
  });

  // Delete Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: number | null;
    title: string;
  }>({
    isOpen: false,
    id: null,
    title: '',
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch Data Potongan
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getPembayaranMahasiswaPotonganList({
        page: appliedFilters.page,
        per_page: 15,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== '' ? appliedFilters.status : undefined,
        tipe_referensi: appliedFilters.tipe_referensi !== '' ? appliedFilters.tipe_referensi : undefined,
        sort_by: appliedFilters.sort_by,
        sort_order: appliedFilters.sort_order,
      });

      setData(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch {
      setData([]);
      toast.error('Gagal memuat data potongan mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter Actions
  const handleApplyFilter = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      search: filterSearch,
      status: filterStatus,
      tipe_referensi: filterTipeRef,
      sort_by: filterSortBy,
      sort_order: filterSortOrder,
      page: 1,
    }));
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterTipeRef('');
    setFilterSortBy('id');
    setFilterSortOrder('desc');
    setAppliedFilters({
      search: '',
      status: '',
      tipe_referensi: '',
      sort_by: 'id',
      sort_order: 'desc',
      page: 1,
    });
    setShowFilter(false);
  };

  const hasActiveFilter = useMemo(() => {
    return (
      Boolean(appliedFilters.search) ||
      Boolean(appliedFilters.status) ||
      Boolean(appliedFilters.tipe_referensi)
    );
  }, [appliedFilters]);

  // Hapus Potongan
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await sikeuService.deletePembayaranMahasiswaPotongan(deleteConfirm.id);
      toast.success('Potongan mahasiswa berhasil dihapus dan saldo tagihan telah dikembalikan');
      setDeleteConfirm({ isOpen: false, id: null, title: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus potongan');
    } finally {
      setDeleting(false);
    }
  };

  // Kolom DataTable
  const columns: ColumnDef<PotonganItem>[] = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa / Calon Mhs',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {row.nama_mahasiswa}
            </span>
            {row.is_calon_mahasiswa ? (
              <Badge variant="purple" className="text-[10px] font-bold">
                SPMB
              </Badge>
            ) : (
              <Badge variant="blue" className="text-[10px] font-bold">
                SIAKAD
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-mono font-medium">{row.nim}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 size={12} className="text-slate-400" />
              {row.prodi}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'potongan',
      label: 'Nama Potongan & SK',
      render: (row) => (
        <div className="space-y-0.5">
          <Link
            href={`/sikeu/pembayaran-mahasiswa/potongan/${row.id}`}
            className="font-bold text-xs text-slate-900 hover:text-primary-600 flex items-center gap-1.5 transition-colors group"
          >
            <Sparkles size={13} className="text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="underline decoration-slate-300 underline-offset-2 group-hover:decoration-primary-500">
              {row.nama_potongan}
            </span>
          </Link>
          {row.nomor_sk && (
            <p className="text-[11px] text-slate-600">
              SK: <span className="font-mono font-semibold text-slate-800">{row.nomor_sk}</span>
            </p>
          )}
          {row.keterangan && (
            <p className="text-[11px] text-slate-400 italic line-clamp-1">
              {row.keterangan}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'tagihan',
      label: 'Tagihan Terdampak',
      render: (row) => (
        <div className="space-y-1">
          <Badge variant="gray" className="text-2xs font-semibold flex items-center gap-1 w-fit">
            <Receipt size={12} />
            {row.jumlah_tagihan_dipotong} Tagihan
          </Badge>
          {row.tagihan_list && row.tagihan_list.length > 0 && (
            <div className="text-[10px] text-slate-500 space-y-0.5 max-w-[200px]">
              {row.tagihan_list.slice(0, 2).map((t, idx) => (
                <div key={idx} className="truncate">
                  <span className="font-mono">{t.nomor_tagihan}</span>: {formatRupiah(t.nominal_potongan)}
                </div>
              ))}
              {row.tagihan_list.length > 2 && (
                <span className="text-primary-600 font-medium">+{row.tagihan_list.length - 2} tagihan lainnya</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'Total Terpotong',
      render: (row) => (
        <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600">
          {formatRupiah(row.total_terpotong_tagihan)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        row.status === 'aktif' ? (
          <Badge variant="green" className="text-[10px] font-bold flex items-center gap-1 w-fit">
            <CheckCircle2 size={12} />
            Aktif
          </Badge>
        ) : (
          <Badge variant="red" className="text-[10px] font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} />
            Non-Aktif
          </Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Tanggal Dibuat',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.created_at || '-'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Lihat Detail Potongan',
              icon: <Eye size={14} className="text-primary-600" />,
              onClick: () => router.push(`/sikeu/pembayaran-mahasiswa/potongan/${row.id}`),
            },
            {
              label: 'Hapus / Batalkan Potongan',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () =>
                setDeleteConfirm({
                  isOpen: true,
                  id: row.id,
                  title: `${row.nama_potongan} (${row.nama_mahasiswa})`,
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      {/* PageHeader Sesuai Aturan Reviewer */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/tarif' },
          { label: 'Potongan Mahasiswa' },
        ]}
        title="Potongan & Keringanan Biaya Mahasiswa"
        description="Kelola penetapan potongan biaya pendidikan mahasiswa SIAKAD maupun calon mahasiswa SPMB yang disinkronisasikan langsung ke tagihan belum lunas."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              icon={<Filter size={16} />}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter
              {hasActiveFilter && (
                <span className="w-2 h-2 rounded-full bg-primary-600 ml-1"></span>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/sikeu/pembayaran-mahasiswa/potongan/create')}
              icon={<Plus size={16} />}
              className="font-bold min-h-[38px] text-xs shadow-sm"
            >
              Tambah Potongan
            </Button>
          </div>
        }
      />

      {/* Ringkasan KPI Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Potongan Terbit</p>
          <p className="text-xl font-bold text-slate-900 font-mono">{summary.total_potongan}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Potongan Aktif</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">{summary.total_aktif}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Mahasiswa Menerima</p>
          <p className="text-xl font-bold text-primary-600 font-mono">{summary.total_mahasiswa}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Nominal Terpotong</p>
          <p className="text-base sm:text-lg font-bold text-emerald-600 font-mono truncate">
            {formatRupiah(summary.total_nominal_terpotong)}
          </p>
        </div>
      </div>

      {/* Mandatory DataTable dengan Server-Side Pagination */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(page) => setAppliedFilters((prev) => ({ ...prev, page }))}
        emptyMessage="Belum ada data potongan mahasiswa. Silakan klik tombol 'Tambah Potongan' untuk memberikan keringanan biaya pada tagihan mahasiswa."
      />

      {/* Filter Drawer Slide Kanan-ke-Kiri Sesuai Aturan */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Potongan Mahasiswa"
        width="380px"
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="text-xs font-bold"
            >
              Reset Filter
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="text-xs font-bold shadow-sm"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Cepat"
            placeholder="Cari nama mahasiswa, NIM, nama potongan, SK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Tipe Mahasiswa"
            options={[
              { value: '', label: 'Semua (SIAKAD & SPMB)' },
              { value: 'mahasiswa', label: 'Hanya Mahasiswa Aktif (SIAKAD)' },
              { value: 'calon_mahasiswa', label: 'Hanya Calon Mahasiswa (SPMB)' },
            ]}
            value={filterTipeRef}
            onChange={(val) => setFilterTipeRef(val as string)}
          />

          <Select
            label="Status Potongan"
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Non-Aktif' },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
          />

          {/* Grid 2 Kolom untuk Sort Sesuai Aturan Auditor */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <Select
              label="Urutkan Berdasarkan"
              options={[
                { value: 'id', label: 'ID Terdaftar' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'nilai_potongan', label: 'Nominal Potongan' },
                { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
              ]}
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val as string)}
            />

            <Select
              label="Arah Urutan"
              options={[
                { value: 'desc', label: 'Menurun (Z - A / Baru)' },
                { value: 'asc', label: 'Menaik (A - Z / Lama)' },
              ]}
              value={filterSortOrder}
              onChange={(val) => setFilterSortOrder(val as 'asc' | 'desc')}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Konfirmasi Hapus UI Sesuai Aturan */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
        title="Hapus / Batalkan Potongan Mahasiswa"
        message={`Apakah Anda yakin ingin menghapus potongan "${deleteConfirm.title}"? Saldo potongan pada tagihan yang bersangkutan akan dikembalikan ke saldo semula.`}
        confirmText="Ya, Batalkan Potongan"
        cancelText="Tutup"
        variant="danger"
      />
    </div>
  );
}
