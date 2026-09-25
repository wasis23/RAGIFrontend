'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import { referensiService } from '@/services/referensi.service';
import type { MasterVendor } from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function MasterVendorPage() {
  const router = useRouter();
  const [dataList, setDataList] = useState<MasterVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States (Paritas 1:1 Kolom Informasi Tabel)
  const [kodeFilter, setKodeFilter] = useState('');
  const [namaFilter, setNamaFilter] = useState('');
  const [jenisRekananFilter, setJenisRekananFilter] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [teleponFilter, setTeleponFilter] = useState('');
  const [urutanFilter, setUrutanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('urutan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [deletingItem, setDeletingItem] = useState<MasterVendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jenisRekananOptions, setJenisRekananOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Semua Jenis Rekanan' },
  ]);

  useEffect(() => {
    const loadJenisRekanan = async () => {
      try {
        const res = await referensiService.getAll({ modul: 'sinapra', tipe: 'jenis_rekanan' });
        if (Array.isArray(res) && res.length > 0) {
          setJenisRekananOptions([
            { value: '', label: 'Semua Jenis Rekanan' },
            ...res.map((item) => ({
              value: item.kode || String(item.id),
              label: item.nama,
            })),
          ]);
        }
      } catch {
        // Fallback silently
      }
    };
    loadJenisRekanan();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSearch = kodeFilter || namaFilter || picFilter || teleponFilter || urutanFilter || undefined;
      const res: any = await sinapraService.getMasterVendorList({
        page,
        per_page: limit,
        search: activeSearch,
        jenis_rekanan: jenisRekananFilter || undefined,
        is_active: activeFilter || undefined,
        sort_by: sortBy,
        sort_order: sortDir,
      });

      setDataList(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal mengambil daftar master vendor / rekanan');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, kodeFilter, namaFilter, jenisRekananFilter, picFilter, teleponFilter, urutanFilter, activeFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await sinapraService.deleteMasterVendor(deletingItem.id);
      toast.success('Vendor berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setKodeFilter('');
    setNamaFilter('');
    setJenisRekananFilter('');
    setPicFilter('');
    setTeleponFilter('');
    setUrutanFilter('');
    setActiveFilter('');
    setSortBy('urutan');
    setSortDir('asc');
    setPage(1);
  };

  const getJenisRekananBadge = (jenis: string) => {
    switch (jenis) {
      case 'laboratorium_kalibrasi':
        return <Badge variant="info">Lab Kalibrasi</Badge>;
      case 'penyedia_barang':
        return <Badge variant="success">Penyedia Barang</Badge>;
      case 'jasa_maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      case 'kontraktor':
        return <Badge variant="secondary">Kontraktor</Badge>;
      default:
        return <Badge variant="secondary">Umum</Badge>;
    }
  };

  const columns: ColumnDef<MasterVendor>[] = [
    {
      key: 'no',
      label: 'NO',
      render: (_item: MasterVendor, index?: number) => (
        <span className="text-xs text-slate-500">{((page - 1) * limit) + (index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE',
      render: (item: MasterVendor) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {item.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA VENDOR',
      render: (item: MasterVendor) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
          {item.alamat && (
            <p className="text-2xs text-slate-500 line-clamp-1">{item.alamat}</p>
          )}
        </div>
      ),
    },
    {
      key: 'jenis_rekanan',
      label: 'JENIS REKANAN',
      render: (item: MasterVendor) => getJenisRekananBadge(item.jenis_rekanan),
    },
    {
      key: 'pic',
      label: 'PIC / KONTAK',
      render: (item: MasterVendor) => (
        <div>
          <p className="text-xs font-medium text-slate-800">{item.pic_nama || '-'}</p>
          {item.pic_kontak && (
            <p className="text-2xs text-slate-500">{item.pic_kontak}</p>
          )}
        </div>
      ),
    },
    {
      key: 'telepon',
      label: 'TELEPON & EMAIL',
      render: (item: MasterVendor) => (
        <div>
          <p className="text-xs text-slate-700">{item.telepon || '-'}</p>
          {item.email && (
            <p className="text-2xs text-slate-500">{item.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'urutan',
      label: 'URUTAN',
      render: (item: MasterVendor) => (
        <span className="text-xs font-medium text-slate-700">
          {item.urutan}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (item: MasterVendor) => (
        <Badge variant={item.is_active ? 'success' : 'secondary'}>
          {item.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (item: MasterVendor) => (
        <DropdownMenu
          items={[
            {
              label: 'Lihat Detail',
              icon: <Eye size={16} />,
              onClick: () => router.push(`/sinapra/master/vendor/${item.id}`),
            },
            {
              label: 'Edit Vendor',
              icon: <Edit2 size={16} />,
              onClick: () => router.push(`/sinapra/master/vendor/${item.id}/edit`),
            },
            {
              label: 'Hapus',
              icon: <Trash2 size={16} className="text-rose-500" />,
              variant: 'danger',
              onClick: () => setDeletingItem(item),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Master Vendor / Rekanan"
        description="Pengelolaan mitra rekanan vendor pengadaan sarana, jasa pemeliharaan, dan laboratorium kalibrasi"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterOpen(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/sinapra/master/vendor/create')}
              style={{ background: 'var(--module-primary)' }}
            >
              Tambah Data
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <DataTable
          columns={columns}
          data={dataList}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="Belum ada data master vendor / rekanan"
        />
      </div>

      {/* FILTER DRAWER — Paritas 1:1 Seluruh Kolom Informasi Tabel */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Vendor / Rekanan"
        position="right"
      >
        <div className="space-y-4 p-4">
          <Input
            label="Kode Vendor"
            placeholder="Cari kode vendor..."
            value={kodeFilter}
            onChange={(e) => setKodeFilter(e.target.value)}
          />

          <Input
            label="Nama Vendor"
            placeholder="Cari nama vendor..."
            value={namaFilter}
            onChange={(e) => setNamaFilter(e.target.value)}
          />

          <Select
            label="Jenis Rekanan"
            value={jenisRekananFilter}
            onChange={(val) => setJenisRekananFilter(String(val))}
            options={jenisRekananOptions}
          />

          <Input
            label="PIC / Kontak"
            placeholder="Cari nama PIC..."
            value={picFilter}
            onChange={(e) => setPicFilter(e.target.value)}
          />

          <Input
            label="Telepon & Email"
            placeholder="Cari telepon atau email..."
            value={teleponFilter}
            onChange={(e) => setTeleponFilter(e.target.value)}
          />

          <Input
            label="Urutan"
            type="number"
            placeholder="Nomor urutan..."
            value={urutanFilter}
            onChange={(e) => setUrutanFilter(e.target.value)}
          />

          <Select
            label="Status"
            value={activeFilter}
            onChange={(val) => setActiveFilter(String(val))}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
            ]}
          />

          <hr className="my-4 border-slate-200" />

          {/* Grid 2 Kolom Sorting Komprehensif Seluruh Kolom */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(String(val))}
              options={[
                { value: 'urutan', label: 'Urutan' },
                { value: 'kode', label: 'Kode' },
                { value: 'nama', label: 'Nama Vendor' },
                { value: 'jenis_rekanan', label: 'Jenis Rekanan' },
                { value: 'pic', label: 'Nama PIC' },
                { value: 'telepon', label: 'Telepon' },
                { value: 'status', label: 'Status' },
              ]}
            />

            <Select
              label="Arah"
              value={sortDir}
              onChange={(val) => setSortDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              icon={<RotateCcw size={16} />}
              onClick={handleResetFilter}
            >
              Reset
            </Button>
            <Button
              className="flex-1"
              icon={<Filter size={16} />}
              style={{ background: 'var(--module-primary)' }}
              onClick={() => {
                setPage(1);
                fetchData();
                setIsFilterOpen(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* CONFIRM DIALOG HAPUS */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Hapus Vendor / Rekanan"
        message={`Apakah Anda yakin ingin menghapus data rekanan "${deletingItem?.nama}"? Tindakan ini menggunakan mekanisme soft-delete.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
