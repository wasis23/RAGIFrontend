'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Edit, Trash2, Filter, Gift } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { spmbService } from '@/services/spmb.service';
import type { MasterKomponenBiaya } from '@/types/spmb.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function MasterKomponenBiayaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<MasterKomponenBiaya[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MasterKomponenBiaya | null;
  }>({ isOpen: false, item: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQ = searchParams.get('search') || '';
  const kategoriQ = searchParams.get('kategori') || '';
  const statusQ = searchParams.get('status') || '';
  const orderByQ = searchParams.get('sort_by') || 'urutan';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterKategori, setFilterKategori] = useState(kategoriQ);
  const [filterStatus, setFilterStatus] = useState(statusQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] !== undefined && newParams[key] !== '') {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getKomponenBiayaList({
        page,
        limit,
        search: searchQ || undefined,
        kategori: kategoriQ || undefined,
        is_active: statusQ || undefined,
        sort_by: orderByQ,
        sort_order: orderDirQ,
      });
      setData(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Gagal memuat komponen biaya');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, kategoriQ, statusQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      search: filterSearch,
      kategori: filterKategori,
      status: filterStatus,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKategori('');
    setFilterStatus('');
    setFilterOrderBy('urutan');
    setFilterOrderDir('asc');
    router.push(pathname);
    setShowFilter(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item?.id) return;
    try {
      setDeleteLoading(true);
      await spmbService.deleteKomponenBiaya(deleteModal.item.id);
      toast.success(`Komponen biaya "${deleteModal.item.nama}" berhasil dihapus`);
      setDeleteModal({ isOpen: false, item: null });
      fetchData();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Gagal menghapus komponen biaya');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<MasterKomponenBiaya>[] = [
    {
      key: 'kode',
      label: 'Kode',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.kode || '-'}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'Nama Komponen Biaya',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-xs text-slate-900">{row.nama}</div>
          {row.keterangan && (
            <div className="text-2xs text-slate-500 mt-2">{row.keterangan}</div>
          )}
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'Kategori Tahap',
      render: (row) => (
        <Badge variant="secondary">{row.kategori || 'Umum'}</Badge>
      ),
    },
    {
      key: 'tipe_potongan',
      label: 'Jenis',
      render: (row) =>
        row.tipe_potongan ? (
          <Badge variant="danger">Potongan / Diskon</Badge>
        ) : (
          <Badge variant="info">Biaya / Tagihan</Badge>
        ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="danger">Tidak Aktif</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Data',
                icon: <Edit size={16} />,
                onClick: () => router.push(`/spmb/master/komponen-biaya/${row.id}/edit`),
              },
              {
                label: 'Reward Referral',
                icon: <Gift size={16} />,
                onClick: () => router.push(`/spmb/master/komponen-biaya/${row.id}/edit`),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={16} className="text-red-500" />,
                variant: 'danger',
                onClick: () => setDeleteModal({ isOpen: true, item: row }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Komponen Biaya"
        description="Kelola komponen biaya pendaftaran dan daftar ulang secara dinamis (DPI, UKT, Seragam, Atribut, dll)."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/spmb/master/komponen-biaya/create')}
            >
              Tambah Komponen
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(newPage) => updateURLParams({ page: newPage })}
        onLimitChange={(newLimit) => updateURLParams({ page: 1, limit: newLimit })}
        columns={columns}
        emptyMessage="Belum ada komponen biaya. Silakan tambahkan komponen biaya baru seperti Pendaftaran, DPI, Seragam, UKT, dll."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Komponen Biaya"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pencarian"
            placeholder="Kode atau nama komponen..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Kategori"
            value={filterKategori}
            onChange={(val) => setFilterKategori(val)}
            options={[
              { value: '', label: 'Semua Kategori' },
              { value: 'Pendaftaran', label: 'Pendaftaran' },
              { value: 'Daftar Ulang', label: 'Daftar Ulang' },
              { value: 'UKT', label: 'UKT' },
              { value: 'Seragam', label: 'Seragam' },
              { value: 'Lainnya', label: 'Lainnya' },
            ]}
          />

          <Select
            label="Status Aktif"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Tidak Aktif' },
            ]}
          />

          <hr className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'urutan', label: 'Urutan Tampil' },
                { value: 'nama', label: 'Nama Komponen' },
                { value: 'kode', label: 'Kode Komponen' },
                { value: 'id', label: 'ID' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />

            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Hapus Komponen Biaya"
        message={
          <span>
            Apakah Anda yakin ingin menghapus komponen biaya <strong>&quot;{deleteModal.item?.nama}&quot;</strong>?
            Komponen yang sudah digunakan pada master biaya tidak disarankan untuk dihapus.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
