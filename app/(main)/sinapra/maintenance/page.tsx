'use client';

import { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  Boxes
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  MaintenanceLog,
  MaintenanceLogFormPayload,
  Aset,
  Ruangan
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function MaintenancePage() {
  // ------------------------------------------------------------
  // LISTING STATES
  // ------------------------------------------------------------
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritasFilter, setPrioritasFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modal Create / Edit Maintenance Form
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<MaintenanceLog | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);

  const [targetType, setTargetType] = useState<'aset' | 'ruangan'>('aset');
  const [selectedAsetObj, setSelectedAsetObj] = useState<{ value: string; label: string } | null>(null);
  const [selectedRuanganObj, setSelectedRuanganObj] = useState<{ value: string; label: string } | null>(null);

  const [formData, setFormData] = useState<MaintenanceLogFormPayload>({
    aset_id: null,
    ruangan_id: null,
    judul: '',
    deskripsi_kerusakan: '',
    prioritas: 'sedang',
    status: 'dilaporkan',
    biaya: 0,
    hasil_perbaikan: '',
  });

  // ------------------------------------------------------------
  // FETCH DATA FUNCTIONS
  // ------------------------------------------------------------
  const fetchMaintenanceLogs = async () => {
    setIsLoading(true);
    try {
      const res: any = await sinapraService.getMaintenanceList({
        page,
        search,
        status: statusFilter || undefined,
        prioritas: prioritasFilter || undefined,
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

      setMaintenanceList(items);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat tiket perawatan & maintenance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceLogs();
  }, [page, search, statusFilter, prioritasFilter, sortBy, sortDir]);

  const loadAsetOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getAsetList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((a: Aset) => ({ value: a.id.toString(), label: `${a.kode_aset} - ${a.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const loadRuanganOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((r: Ruangan) => ({ value: r.id.toString(), label: `${r.kode} - ${r.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // ------------------------------------------------------------
  // FORM HANDLERS
  // ------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setEditingLog(null);
    setTargetType('aset');
    setSelectedAsetObj(null);
    setSelectedRuanganObj(null);
    setFormData({
      aset_id: null,
      ruangan_id: null,
      judul: '',
      deskripsi_kerusakan: '',
      prioritas: 'sedang',
      status: 'dilaporkan',
      biaya: 0,
      hasil_perbaikan: '',
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (log: MaintenanceLog) => {
    setEditingLog(log);
    if (log.aset) {
      setTargetType('aset');
      setSelectedAsetObj({ value: log.aset.id.toString(), label: `${log.aset.kode_aset} - ${log.aset.nama}` });
      setSelectedRuanganObj(null);
    } else if (log.ruangan) {
      setTargetType('ruangan');
      setSelectedRuanganObj({ value: log.ruangan.id.toString(), label: `${log.ruangan.kode} - ${log.ruangan.nama}` });
      setSelectedAsetObj(null);
    }

    setFormData({
      aset_id: log.aset_id || null,
      ruangan_id: log.ruangan_id || null,
      judul: log.judul,
      deskripsi_kerusakan: log.deskripsi_kerusakan,
      prioritas: log.prioritas || 'sedang',
      status: log.status || 'dilaporkan',
      biaya: log.biaya || 0,
      hasil_perbaikan: log.hasil_perbaikan || '',
    });
    setShowFormModal(true);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.deskripsi_kerusakan) {
      toast.error('Judul Laporan dan Deskripsi Kerusakan wajib diisi!');
      return;
    }

    try {
      if (editingLog) {
        await sinapraService.updateMaintenance(editingLog.id, formData);
        toast.success('Tiket maintenance berhasil diperbarui!');
      } else {
        await sinapraService.createMaintenance(formData);
        toast.success('Tiket pelaporan maintenance baru berhasil dibuat!');
      }
      fetchMaintenanceLogs();
      setShowFormModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tiket maintenance.');
    }
  };

  const handleDeleteMaintenance = async () => {
    if (!deletingLog) return;
    setIsDeletingLog(true);
    try {
      await sinapraService.deleteMaintenance(deletingLog.id);
      toast.success(`Tiket maintenance '${deletingLog.judul}' berhasil dihapus.`);
      fetchMaintenanceLogs();
      setDeletingLog(null);
    } catch {
      toast.error('Gagal menghapus tiket maintenance.');
    } finally {
      setIsDeletingLog(false);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS (SIMPEG Standard: Max 12px, 2-Row Format)
  // ------------------------------------------------------------
  const columns: ColumnDef<MaintenanceLog>[] = [
    {
      key: 'tiket',
      label: 'NO TIKET & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            MNT-{row.id}
          </span>
          <span className="text-2xs text-slate-400 block">
            {formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'objek',
      label: 'OBJEK & JUDUL KERUSAKAN',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.aset ? (
              <span>
                {row.aset.nama}{' '}
                <span className="text-2xs font-mono text-slate-400 font-normal">
                  ({row.aset.kode_aset})
                </span>
              </span>
            ) : row.ruangan ? (
              <span>{row.ruangan.nama}</span>
            ) : (
              <span className="text-slate-400 italic font-normal">Umum</span>
            )}
          </div>
          <div className="text-2xs text-slate-500 line-clamp-1 font-medium">
            {row.judul}
          </div>
        </div>
      ),
    },
    {
      key: 'prioritas',
      label: 'PRIORITAS',
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
          }}
          className="text-2xs uppercase"
        >
          {row.prioritas}
        </Badge>
      ),
    },
    {
      key: 'biaya',
      label: 'BIAYA PERBAIKAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">
            {formatCurrency(row.biaya || 0)}
          </span>
          <span className="text-2xs text-slate-400 block">
            {row.hasil_perbaikan ? 'Ada catatan' : 'Belum selesai'}
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
                label: 'Ubah & Update Status',
                icon: <Edit2 size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleOpenEditModal(row),
              },
              {
                label: 'Hapus Tiket',
                icon: <Trash2 size={16} className="text-[var(--danger)]" />,
                variant: 'danger',
                onClick: () => setDeletingLog(row),
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
        title="Maintenance & Perawatan Sarpras Kampus"
        description="Pelaporan tiket kerusakan barang/ruangan, penanganan teknisi, & pencatatan biaya perbaikan (Modul SINAPRA)"
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
            <Button icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
              Buat Tiket Perawatan
            </Button>
          </div>
        }
      />

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={maintenanceList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE MAINTENANCE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        onConfirm={handleDeleteMaintenance}
        title="Hapus Tiket Maintenance?"
        message={`Apakah Anda yakin ingin menghapus tiket perawatan ${deletingLog?.judul} (MNT-${deletingLog?.id})?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeletingLog}
      />

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Maintenance & Perawatan"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPrioritasFilter('');
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
            placeholder="Cari nomor tiket, judul kerusakan, atau objek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Status Perawatan"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'dilaporkan', label: 'Dilaporkan' },
              { value: 'proses', label: 'Proses Pengerjaan' },
              { value: 'selesai', label: 'Selesai' },
              { value: 'batal', label: 'Batal' },
            ]}
          />

          <Select
            label="Tingkat Prioritas"
            value={prioritasFilter}
            onChange={(val) => setPrioritasFilter(val)}
            options={[
              { value: '', label: 'Semua Prioritas' },
              { value: 'rendah', label: 'Rendah' },
              { value: 'sedang', label: 'Sedang' },
              { value: 'tinggi', label: 'Tinggi' },
              { value: 'darurat', label: 'Darurat' },
            ]}
          />

          <hr className="border-slate-200 dark:border-slate-800" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Lapor' },
                { value: 'judul', label: 'Judul Kerusakan' },
                { value: 'biaya', label: 'Biaya Perbaikan' },
                { value: 'prioritas', label: 'Prioritas' },
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

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM TIKET MAINTENANCE (FORM <= 5 INPUT) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingLog ? `Update Tiket Maintenance — MNT-${editingLog.id}` : 'Pelaporan Tiket Perawatan Baru'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveMaintenance}>
              {editingLog ? 'Simpan Update' : 'Kirim Laporan Tiket'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveMaintenance} className="space-y-4">
          {!editingLog && (
            <div className="flex gap-4 border-b pb-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'aset'}
                  onChange={() => {
                    setTargetType('aset');
                    setFormData({ ...formData, ruangan_id: null });
                  }}
                />
                Barang / Aset Inventaris
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'ruangan'}
                  onChange={() => {
                    setTargetType('ruangan');
                    setFormData({ ...formData, aset_id: null });
                  }}
                />
                Ruangan / Fasilitas Kampus
              </label>
            </div>
          )}

          {targetType === 'aset' ? (
            <AsyncSelect
              label="Pilih Barang Aset yang Rusak/Bermasalah"
              placeholder="Cari aset..."
              value={selectedAsetObj}
              onChange={(sel: any) => {
                setSelectedAsetObj(sel);
                setFormData({ ...formData, aset_id: sel ? parseInt(sel.value) : null, ruangan_id: null });
              }}
              loadOptions={loadAsetOptions}
            />
          ) : (
            <AsyncSelect
              label="Pilih Ruangan yang Bermasalah"
              placeholder="Cari ruangan..."
              value={selectedRuanganObj}
              onChange={(sel: any) => {
                setSelectedRuanganObj(sel);
                setFormData({ ...formData, ruangan_id: sel ? parseInt(sel.value) : null, aset_id: null });
              }}
              loadOptions={loadRuanganOptions}
            />
          )}

          <Input
            label="Judul Ringkas Kerusakan"
            required
            placeholder="cth: AC Ruang Lab 2 Bocor & Tidak Dingin"
            value={formData.judul}
            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
          />

          <Textarea
            label="Deskripsi Detail Kerusakan"
            required
            rows={3}
            placeholder="Jelaskan detail masalah fisik / kendala teknis..."
            value={formData.deskripsi_kerusakan}
            onChange={(e) => setFormData({ ...formData, deskripsi_kerusakan: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tingkat Prioritas"
              value={formData.prioritas || 'sedang'}
              onChange={(val) => setFormData({ ...formData, prioritas: val as any })}
              options={[
                { value: 'rendah', label: 'Rendah' },
                { value: 'sedang', label: 'Sedang' },
                { value: 'tinggi', label: 'Tinggi' },
                { value: 'darurat', label: 'Darurat' },
              ]}
            />

            {editingLog && (
              <Select
                label="Status Penanganan"
                value={formData.status || 'dilaporkan'}
                onChange={(val) => setFormData({ ...formData, status: val as any })}
                options={[
                  { value: 'dilaporkan', label: 'Dilaporkan' },
                  { value: 'proses', label: 'Proses Pengerjaan' },
                  { value: 'selesai', label: 'Selesai Ditangani' },
                  { value: 'batal', label: 'Batal' },
                ]}
              />
            )}

            <Input
              label="Biaya Perbaikan (Rp)"
              type="number"
              min={0}
              placeholder="cth: 450000"
              value={formData.biaya || ''}
              onChange={(e) => setFormData({ ...formData, biaya: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {editingLog && (
            <Textarea
              label="Hasil & Catatan Perbaikan Teknisi"
              rows={2}
              placeholder="Jelaskan tindakan teknisi yang telah dilakukan..."
              value={formData.hasil_perbaikan || ''}
              onChange={(e) => setFormData({ ...formData, hasil_perbaikan: e.target.value })}
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
