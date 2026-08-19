'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Filter,
  Search,
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
  }, [page, search, statusFilter]);

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
    try {
      await sinapraService.deletePengadaan(deletingPengadaan.id);
      toast.success(`Usulan pengadaan '${deletingPengadaan.judul}' dihapus.`);
      fetchPengadaan();
    } catch {
      toast.error('Gagal menghapus usulan pengadaan.');
    } finally {
      setDeletingPengadaan(null);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS
  // ------------------------------------------------------------
  const columns: ColumnDef<PengajuanPengadaan>[] = [
    { key: 'id', label: 'No', render: (_, idx) => <span className="font-bold text-slate-400">{meta?.from ? meta.from + idx : idx + 1}</span> },
    { key: 'kode', label: 'Kode Usulan', render: (row) => <span className="badge badge-blue font-mono">PGD-{row.id}</span> },
    { key: 'judul', label: 'Judul Pengadaan / Unit Kerja', render: (row) => (
      <div>
        <div className="font-bold text-slate-900">{row.judul}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Building2 size={12} className="text-slate-400" /> {row.unit_kerja?.nama || 'Unit kerja kampus'}
        </div>
      </div>
    )},
    { key: 'pengaju', label: 'Pengaju', render: (row) => (
      <div>
        <div className="font-semibold text-slate-800">{row.pengaju?.name || 'User ID: ' + row.diajukan_oleh}</div>
        <div className="text-xs text-slate-500">{formatDate(row.tanggal_pengajuan)}</div>
      </div>
    )},
    { key: 'estimasi_anggaran', label: 'Estimasi Anggaran', render: (row) => (
      <span className="font-extrabold text-slate-900">{formatCurrency(row.estimasi_anggaran)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => {
      const color = row.status === 'disetujui' || row.status === 'selesai' ? 'badge-green' : row.status === 'diajukan' || row.status === 'proses_beli' ? 'badge-yellow' : row.status === 'ditolak' ? 'badge-red' : 'badge-blue';
      return <span className={`badge ${color} badge-dot capitalize`}>{row.status.replace('_', ' ')}</span>;
    }},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewingPengadaan(row)} title="Detail Barang" />
        <Button variant="primary" size="sm" icon={<UserCheck size={14} />} onClick={() => {
          setUpdatingStatusPengadaan(row);
          setStatusForm({ status: 'disetujui', catatan: '' });
        }} title="Approval Status" />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingPengadaan(row)} title="Hapus" />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pengajuan Pengadaan Barang Kampus"
        description="Alur kerja pengusulan pengadaan barang baru per unit kerja, verifikasi rincian barang, & persetujuan anggaran (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/pengadaan/create')}>
              Buat Usulan Pengadaan
            </Button>
            <Button
              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }}
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* SEARCH BAR */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
            <Input
              placeholder="Cari judul pengadaan, unit kerja, atau pengaju..."
              prefixIcon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={pengadaanList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE MODAL */}
      <Modal
        open={!!deletingPengadaan}
        onClose={() => setDeletingPengadaan(null)}
        title="Hapus Usulan Pengadaan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingPengadaan(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus pengusulan pengadaan <strong>{deletingPengadaan?.judul}</strong> (PGD-{deletingPengadaan?.id})?
        </p>
      </Modal>

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
                setStatusFilter('');
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
          <Select
            label="Status Status Approval"
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

            <div className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border border-rose-200">
              <span className="font-bold text-rose-900 text-sm">TOTAL ESTIMASI ANGGARAN</span>
              <span className="font-extrabold text-rose-700 text-lg">{formatCurrency(viewingPengadaan.estimasi_anggaran)}</span>
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
