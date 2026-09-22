'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Filter,
  Eye,
  UserCheck,
  Building2,
  FileText,
  DollarSign,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  PengajuanPengadaan,
  UpdateStatusPengadaanPayload,
  DetailPengadaan
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function PengadaanPage() {
  const router = useRouter();

  // ------------------------------------------------------------
  // LISTING STATES
  // ------------------------------------------------------------
  const [pengadaanList, setPengadaanList] = useState<PengajuanPengadaan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modal Detail Pengadaan
  const [viewingPengadaan, setViewingPengadaan] = useState<PengajuanPengadaan | null>(null);

  // Modal Update Status / Approval Pengadaan
  const [updatingStatusPengadaan, setUpdatingStatusPengadaan] = useState<PengajuanPengadaan | null>(null);
  const [statusForm, setStatusForm] = useState<UpdateStatusPengadaanPayload>({
    status: 'disetujui',
    catatan: '',
  });

  // Modal Delete
  const [deletingPengadaan, setDeletingPengadaan] = useState<PengajuanPengadaan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ------------------------------------------------------------
  // FETCH DATA FUNCTIONS
  // ------------------------------------------------------------
  const fetchPengadaan = async () => {
    setIsLoading(true);
    try {
      const res: any = await sinapraService.getPengadaanList({
        page,
        search,
        status: statusFilter || undefined,
        sort_by: sortBy || undefined,
        sort_dir: sortDir || undefined,
      });

      let items = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        items = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      }

      setPengadaanList(items);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat usulan pengadaan barang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengadaan();
  }, [page, search, statusFilter, sortBy, sortDir]);

  // ------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingStatusPengadaan) return;

    try {
      await sinapraService.updateStatusPengadaan(updatingStatusPengadaan.id, statusForm);
      toast.success(`Status pengadaan diubah ke '${statusForm.status}'!`);
      fetchPengadaan();
      setUpdatingStatusPengadaan(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status usulan pengadaan.');
    }
  };

  const handleDelete = async () => {
    if (!deletingPengadaan) return;
    setIsDeleting(true);
    try {
      await sinapraService.deletePengadaan(deletingPengadaan.id);
      toast.success(`Usulan pengadaan '${deletingPengadaan.judul}' dihapus.`);
      fetchPengadaan();
      setDeletingPengadaan(null);
    } catch {
      toast.error('Gagal menghapus usulan pengadaan.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS (SIMPEG Standard: Max 12px, 2-Row Format)
  // ------------------------------------------------------------
  const columns: ColumnDef<PengajuanPengadaan>[] = [
    {
      key: 'kode',
      label: 'KODE & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            PGD-{row.id}
          </span>
          <span className="text-2xs text-slate-400 block">
            {formatDate(row.tanggal_pengajuan)}
          </span>
        </div>
      ),
    },
    {
      key: 'judul',
      label: 'JUDUL PENGADAAN & UNIT KERJA',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.judul}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1">
            {row.unit_kerja?.nama || 'Unit kerja kampus'}
          </div>
        </div>
      ),
    },
    {
      key: 'pengaju',
      label: 'PENGAJU',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.pengaju?.name || `User #${row.diajukan_oleh}`}
          </div>
          <div className="text-2xs text-slate-400">
            {row.details?.length || 0} item barang
          </div>
        </div>
      ),
    },
    {
      key: 'estimasi_anggaran',
      label: 'ESTIMASI ANGGARAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
            {formatCurrency(row.estimasi_anggaran)}
          </span>
          <span className="text-2xs text-slate-400 block">
            Total Estimasi
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
          }}
          className="text-2xs capitalize"
        >
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Detail Rincian Barang',
                icon: <Eye size={16} className="text-[var(--module-primary)]" />,
                onClick: () => setViewingPengadaan(row),
              },
              {
                label: 'Verifikasi & Approval',
                icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                onClick: () => {
                  setUpdatingStatusPengadaan(row);
                  setStatusForm({ status: 'disetujui', catatan: '' });
                },
              },
              {
                label: 'Hapus Usulan',
                icon: <Trash2 size={16} className="text-[var(--danger)]" />,
                variant: 'danger',
                onClick: () => setDeletingPengadaan(row),
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
        title="Pengajuan Pengadaan Barang Kampus"
        description="Alur kerja pengusulan pengadaan barang baru per unit kerja, verifikasi rincian barang, & persetujuan anggaran (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
            >
              Filter
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/pengadaan/create')}>
              Buat Usulan Pengadaan
            </Button>
          </div>
        }
      />

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={pengadaanList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingPengadaan}
        onClose={() => setDeletingPengadaan(null)}
        onConfirm={handleDelete}
        title="Hapus Usulan Pengadaan?"
        message={`Apakah Anda yakin ingin menghapus pengusulan pengadaan ${deletingPengadaan?.judul} (PGD-${deletingPengadaan?.id})?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Usulan Pengadaan"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setSortBy('created_at');
                setSortDir('desc');
                setPage(1);
                setShowFilterDrawer(false);
              }}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={() => setShowFilterDrawer(false)}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari judul pengadaan, unit kerja, atau pengaju..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Status Approval"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'diajukan', label: 'Diajukan' },
              { value: 'disetujui', label: 'Disetujui' },
              { value: 'ditolak', label: 'Ditolak' },
              { value: 'proses_beli', label: 'Proses Pembelian' },
              { value: 'selesai', label: 'Selesai' },
            ]}
          />

          <hr className="border-slate-200 dark:border-slate-800" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Pengajuan' },
                { value: 'judul', label: 'Judul Pengadaan' },
                { value: 'estimasi_anggaran', label: 'Estimasi Anggaran' },
                { value: 'status', label: 'Status' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val: any) => setSortDir(val)}
              options={[
                { value: 'desc', label: 'Menurun (Z-A / Baru)' },
                { value: 'asc', label: 'Menaik (A-Z / Lama)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* VIEW DETAIL MODAL */}
      <Modal
        open={!!viewingPengadaan}
        onClose={() => setViewingPengadaan(null)}
        title={`Rincian Usulan Pengadaan — PGD-${viewingPengadaan?.id}`}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setViewingPengadaan(null)}>Tutup</Button>}
      >
        {viewingPengadaan && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-base">{viewingPengadaan.judul}</div>
              <div className="text-xs text-slate-600">
                <strong>Alasan Kebutuhan:</strong> {viewingPengadaan.alasan_kebutuhan}
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-2 border-t">
                <span>Diajukan Oleh: <strong>{viewingPengadaan.pengaju?.name || 'User ' + viewingPengadaan.diajukan_oleh}</strong></span>
                <span>Tanggal: <strong>{formatDate(viewingPengadaan.tanggal_pengajuan)}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800 text-sm">Daftar Item Barang yang Diajukan:</div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Nama Barang / Spesifikasi</th>
                      <th className="p-2.5 text-center">Qty / Satuan</th>
                      <th className="p-2.5 text-right">Harga Satuan</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingPengadaan.details && viewingPengadaan.details.length > 0 ? (
                      viewingPengadaan.details.map((item: DetailPengadaan, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-800">{item.nama_barang}</div>
                            <div className="text-[11px] text-slate-500">{item.spesifikasi || '-'}</div>
                          </td>
                          <td className="p-2.5 text-center font-bold">{item.jumlah} {item.satuan}</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(item.harga_satuan_estimasi)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(item.subtotal_estimasi)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">Tidak ada item rincian barang.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
              }}
              className="flex justify-between items-center p-4 rounded-xl border"
            >
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">TOTAL ESTIMASI ANGGARAN</span>
              <span
                style={{ color: 'var(--module-primary)' }}
                className="font-extrabold text-lg"
              >
                {formatCurrency(viewingPengadaan.estimasi_anggaran)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* APPROVAL / UPDATE STATUS MODAL */}
      <Modal
        open={!!updatingStatusPengadaan}
        onClose={() => setUpdatingStatusPengadaan(null)}
        title="Keputusan & Update Status Pengadaan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpdatingStatusPengadaan(null)}>Batal</Button>
            <Button variant="primary" onClick={handleUpdateStatus}>Simpan Perubahan</Button>
          </>
        }
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border text-sm">
            <div><strong>Judul:</strong> {updatingStatusPengadaan?.judul}</div>
            <div><strong>Total Anggaran:</strong> {formatCurrency(updatingStatusPengadaan?.estimasi_anggaran || 0)}</div>
          </div>

          <Select
            label="Pilih Status Baru"
            value={statusForm.status}
            onChange={(val) => setStatusForm({ ...statusForm, status: val as any })}
            options={[
              { value: 'disetujui', label: 'Setujui Pengadaan' },
              { value: 'ditolak', label: 'Tolak Pengadaan' },
              { value: 'proses_beli', label: 'Proses Pembelian' },
              { value: 'selesai', label: 'Selesai / Barang Diterima' },
            ]}
          />

          <Textarea
            label="Catatan Verifikator / Approver"
            rows={3}
            placeholder="Instruksi pengadaan, catatan harga, atau alasan..."
            value={statusForm.catatan || ''}
            onChange={(e) => setStatusForm({ ...statusForm, catatan: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
