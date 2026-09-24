'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Edit, Trash2, Filter, Tag, Copy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { spmbService } from '@/services/spmb.service';
import { formatRupiah, formatGelombangLabel } from '@/lib/utils';
import type { MasterBiayaSpmb, GelombangPenerimaan } from '@/types/spmb.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

export default function MasterBiayaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Data State
  const [data, setData] = useState<MasterBiayaSpmb[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);

  // References
  const [gelombangList, setGelombangList] = useState<GelombangPenerimaan[]>([]);

  // Search and Filter Params from URL
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQ = searchParams.get('search') || '';
  const orderByQ = searchParams.get('sort_by') || 'created_at';
  const orderDirQ = searchParams.get('sort_dir') || 'desc';
  const gelombangQ = searchParams.get('gelombang_id') || '';
  const statusQ = searchParams.get('is_active') || '';
  const jumlahQ = searchParams.get('jumlah_komponen') || '';
  const bebanPendaftaranQ = searchParams.get('beban_pendaftaran') || '';
  const bebanDaftarUlangQ = searchParams.get('beban_daftar_ulang') || '';
  const totalBiayaQ = searchParams.get('total_biaya') || '';

  // Local Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterGelombangId, setFilterGelombangId] = useState(gelombangQ);
  const [filterStatus, setFilterStatus] = useState(statusQ);
  const [filterJumlahKomponen, setFilterJumlahKomponen] = useState(jumlahQ);
  const [filterBebanPendaftaran, setFilterBebanPendaftaran] = useState(bebanPendaftaranQ);
  const [filterBebanDaftarUlang, setFilterBebanDaftarUlang] = useState(bebanDaftarUlangQ);
  const [filterTotalBiaya, setFilterTotalBiaya] = useState(totalBiayaQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  // Copy Gelombang Modal State
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyFromGelombangId, setCopyFromGelombangId] = useState('');
  const [copyToGelombangId, setCopyToGelombangId] = useState('');
  const [copying, setCopying] = useState(false);

  // Delete Confirm Dialog State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MasterBiayaSpmb | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // Load initial dropdown references
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const gelRes = await spmbService.getGelombang({ per_page: 100 });
        const gelsRaw = gelRes?.data;
        setGelombangList(Array.isArray(gelsRaw) ? gelsRaw : gelsRaw?.items || []);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);      const res = await spmbService.getMasterBiayaList({
        page,
        limit,
        search: searchQ,
        gelombang_id: gelombangQ || undefined,
        is_active: statusQ || undefined,
        jumlah_komponen: jumlahQ || undefined,
        beban_pendaftaran: bebanPendaftaranQ || undefined,
        beban_daftar_ulang: bebanDaftarUlangQ || undefined,
        total_biaya: totalBiayaQ || undefined,
        sort_by: orderByQ,
        sort_dir: orderDirQ,
      });
      setData(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat data master biaya');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, gelombangQ, statusQ, jumlahQ, bebanPendaftaranQ, bebanDaftarUlangQ, totalBiayaQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Synchronize URL query parameters
  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach((key) => {
      if (newParams[key]) {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Filter Drawer Actions
  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      search: filterSearch,
      gelombang_id: filterGelombangId,
      is_active: filterStatus,
      jumlah_komponen: filterJumlahKomponen,
      beban_pendaftaran: filterBebanPendaftaran,
      beban_daftar_ulang: filterBebanDaftarUlang,
      total_biaya: filterTotalBiaya,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterGelombangId('');
    setFilterStatus('');
    setFilterJumlahKomponen('');
    setFilterBebanPendaftaran('');
    setFilterBebanDaftarUlang('');
    setFilterTotalBiaya('');
    setFilterOrderBy('created_at');
    setFilterOrderDir('desc');
    updateURLParams({
      page: 1,
      search: '',
      gelombang_id: '',
      is_active: '',
      jumlah_komponen: '',
      beban_pendaftaran: '',
      beban_daftar_ulang: '',
      total_biaya: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    setShowFilter(false);
  };

  // Delete Action Handlers
  const handleOpenDelete = (item: MasterBiayaSpmb) => {
    setDeleteModal({ isOpen: true, item, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      await spmbService.deleteMasterBiaya(deleteModal.item.id);
      toast.success('Konfigurasi biaya berhasil dihapus');
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus biaya');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Copy Gelombang Action Handler
  const handleConfirmCopy = async () => {
    if (!copyFromGelombangId || !copyToGelombangId) {
      toast.error('Silakan tentukan Gelombang Sumber dan Tujuan');
      return;
    }
    if (copyFromGelombangId === copyToGelombangId) {
      toast.error('Gelombang Tujuan harus berbeda dari Sumber');
      return;
    }

    try {
      setCopying(true);
      await spmbService.copyBiayaFromGelombang({
        from_gelombang_id: Number(copyFromGelombangId),
        to_gelombang_id: Number(copyToGelombangId),
      });
      toast.success('Konfigurasi biaya berhasil disalin');
      setCopyModalOpen(false);
      setFilterGelombangId(copyToGelombangId);
      updateURLParams({ page: 1, gelombang_id: copyToGelombangId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyalin konfigurasi biaya');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header standardized to match tipe-jalur */}
      <PageHeader
        title="Master Tarif Biaya"
        description="Kelola konfigurasi biaya pendaftaran dan perkuliahan per Program Studi dan Gelombang"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              icon={<Tag size={16} />}
              onClick={() => router.push('/spmb/master/komponen-biaya')}
            >
              Komponen Biaya
            </Button>
            <Button
              variant="outline"
              icon={<Copy size={16} />}
              onClick={() => {
                setCopyFromGelombangId(gelombangQ);
                setCopyToGelombangId('');
                setCopyModalOpen(true);
              }}
            >
              Salin Gelombang
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/spmb/master/biaya/create')}
            >
              Tambah Biaya
            </Button>
          </div>
        }
      />

      {/* Main DataTable Area */}
      <DataTable
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(newPage) => updateURLParams({ page: newPage })}
        onLimitChange={(newLimit) => updateURLParams({ page: 1, limit: newLimit })}
        columns={[
          {
            key: 'program_studi',
            label: 'Program Studi',
            sortable: false,
            render: (row) => (
              <div>
                <div className="font-semibold text-gray-900">
                  {row.program_studi?.jenjang} {row.program_studi?.nama}
                </div>
                {row.program_studi?.kode_prodi && (
                  <span className="font-mono text-xs" style={{ color: 'var(--module-primary)' }}>
                    {row.program_studi.kode_prodi}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'gelombang',
            label: 'Gelombang',
            render: (row) => (
              <div>
                <div className="font-semibold text-gray-900">
                  {row.gelombang?.nama || '-'}
                </div>
                {row.gelombang?.jalur_masuk?.nama && (
                  <span className="text-xs text-slate-500">
                    {row.gelombang?.jalur_masuk?.nama}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'items',
            label: 'Rincian Komponen',
            align: 'center',
            render: (row) => {
              const count = (row.items || []).filter((i) => Number(i.nominal) > 0).length;
              return (
                <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-700 border border-slate-200">
                  {count} Komponen
                </Badge>
              );
            },
          },
          {
            key: 'beban_pendaftaran',
            label: 'Beban Registrasi',
            align: 'right',
            render: (row) => {
              const beban = (row.items || []).filter((i) => i.dibebankan_saat_pendaftaran && Number(i.nominal) > 0);
              const total = beban.reduce((acc, i) => acc + Number(i.nominal || 0), 0);
              return (
                <div>
                  <div className="font-mono font-bold text-xs" style={{ color: 'var(--module-primary)' }}>
                    {formatRupiah(total)}
                  </div>
                  <div className="text-2xs text-slate-400">{beban.length} komponen</div>
                </div>
              );
            },
          },
          {
            key: 'beban_daftar_ulang',
            label: 'Beban Daftar Ulang',
            align: 'right',
            render: (row) => {
              const beban = (row.items || []).filter((i) => !i.dibebankan_saat_pendaftaran && Number(i.nominal) > 0);
              const total = beban.reduce((acc, i) => acc + Number(i.nominal || 0), 0);
              return (
                <div>
                  <div className="font-mono font-bold text-xs text-slate-700">
                    {formatRupiah(total)}
                  </div>
                  <div className="text-2xs text-slate-400">{beban.length} komponen</div>
                </div>
              );
            },
          },
          {
            key: 'total_biaya',
            label: 'Total Biaya',
            align: 'right',
            sortable: true,
            render: (row) => (
              <span className="font-mono font-bold text-xs" style={{ color: 'var(--module-primary)' }}>
                {formatRupiah(row.total_biaya)}
              </span>
            ),
          },
          {
            key: 'is_active',
            label: 'Status',
            align: 'center',
            render: (row) =>
              row.is_active ? (
                <Badge variant="success">Aktif</Badge>
              ) : (
                <Badge variant="danger">Nonaktif</Badge>
              ),
          },
          {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (row) => (
              <DropdownMenu
                items={[
                  {
                    label: 'Edit Detail',
                    icon: <Edit size={16} />,
                    onClick: () => router.push(`/spmb/master/biaya/${row.id}/edit`),
                  },
                  {
                    label: 'Hapus',
                    icon: <Trash2 size={16} className="text-red-500" />,
                    onClick: () => handleOpenDelete(row),
                    variant: 'danger',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Biaya"
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
            label="Pencarian Program Studi"
            placeholder="Kode atau nama prodi..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Gelombang Penerimaan"
            value={filterGelombangId}
            onChange={(val) => setFilterGelombangId(val)}
            options={[
              { value: '', label: 'Semua Gelombang' },
              ...gelombangList.map((g) => ({
                value: String(g.id),
                label: formatGelombangLabel(g),
              })),
            ]}
          />

          <Select
            label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
            ]}
          />

          <Input
            label="Rincian Komponen (jumlah)"
            placeholder="Contoh: 3"
            value={filterJumlahKomponen}
            onChange={(e) => setFilterJumlahKomponen(e.target.value)}
          />

          <Input
            label="Beban Registrasi (Rp)"
            placeholder="0"
            value={filterBebanPendaftaran}
            onChange={(e) => setFilterBebanPendaftaran(e.target.value)}
          />

          <Input
            label="Beban Daftar Ulang (Rp)"
            placeholder="0"
            value={filterBebanDaftarUlang}
            onChange={(e) => setFilterBebanDaftarUlang(e.target.value)}
          />

          <Input
            label="Total Biaya (Rp)"
            placeholder="0"
            value={filterTotalBiaya}
            onChange={(e) => setFilterTotalBiaya(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'program_studi', label: 'Program Studi' },
                { value: 'gelombang', label: 'Gelombang' },
                { value: 'items', label: 'Rincian Komponen' },
                { value: 'beban_pendaftaran', label: 'Beban Registrasi' },
                { value: 'beban_daftar_ulang', label: 'Beban Daftar Ulang' },
                { value: 'total_biaya', label: 'Total Biaya' },
                { value: 'is_active', label: 'Status' },
                { value: 'id', label: 'ID' },
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

      {/* Salin dari Gelombang Modal */}
      <Modal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Salin Biaya Dari Gelombang Lain"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Salin seluruh konfigurasi komponen biaya per prodi dari gelombang sebelumnya ke gelombang baru tanpa perlu menginput ulang dari awal.
          </p>

          <Select
            label="Gelombang Sumber (Dari)"
            value={copyFromGelombangId}
            onChange={setCopyFromGelombangId}
            options={[
              { value: '', label: '-- Pilih Gelombang Sumber --' },
              ...gelombangList.map((g) => ({
                value: String(g.id),
                label: formatGelombangLabel(g),
              })),
            ]}
          />

          <Select
            label="Gelombang Target (Ke)"
            value={copyToGelombangId}
            onChange={setCopyToGelombangId}
            options={[
              { value: '', label: '-- Pilih Gelombang Target --' },
              ...gelombangList.map((g) => ({
                value: String(g.id),
                label: formatGelombangLabel(g),
              })),
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCopyModalOpen(false)}
              disabled={copying}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmCopy}
              loading={copying}
            >
              Salin Sekarang
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteModal.isLoading}
        title="Hapus Tarif Biaya"
        message={
          <span>
            Apakah Anda yakin ingin menghapus konfigurasi tarif biaya untuk{' '}
            <strong>
              {deleteModal.item?.program_studi?.nama || 'Program Studi ini'}
            </strong>{' '}
            pada Gelombang{' '}
            <strong>{deleteModal.item?.gelombang?.nama || ''}</strong>? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
