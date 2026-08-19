'use client';

import { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Search,
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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modal Create / Edit Maintenance Form
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<MaintenanceLog | null>(null);

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
  }, [page, search, statusFilter, prioritasFilter]);

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
    try {
      await sinapraService.deleteMaintenance(deletingLog.id);
      toast.success(`Tiket maintenance '${deletingLog.judul}' berhasil dihapus.`);
      fetchMaintenanceLogs();
    } catch {
      toast.error('Gagal menghapus tiket maintenance.');
    } finally {
      setDeletingLog(null);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS
  // ------------------------------------------------------------
  const columns: ColumnDef<MaintenanceLog>[] = [
    { key: 'id', label: 'No', render: (_, idx) => <span className="font-bold text-slate-400">{meta?.from ? meta.from + idx : idx + 1}</span> },
    { key: 'tiket', label: 'No Tiket', render: (row) => <span className="badge badge-blue font-mono">MNT-{row.id}</span> },
    { key: 'objek', label: 'Objek / Sarpras', render: (row) => (
      <div>
        {row.aset ? (
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <Boxes size={14} className="text-rose-500" /> {row.aset.nama}
            <span className="text-xs font-mono text-slate-400">({row.aset.kode_aset})</span>
          </div>
        ) : row.ruangan ? (
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <MapPin size={14} className="text-indigo-500" /> {row.ruangan.nama}
          </div>
        ) : (
          <span className="text-slate-400 italic">Umum</span>
        )}
        <div className="text-xs text-slate-500 font-semibold">{row.judul}</div>
      </div>
    )},
    { key: 'prioritas', label: 'Prioritas', render: (row) => {
      const color = row.prioritas === 'darurat' || row.prioritas === 'tinggi' ? 'badge-red' : row.prioritas === 'sedang' ? 'badge-yellow' : 'badge-green';
      return <span className={`badge ${color} uppercase text-[10px]`}>{row.prioritas}</span>;
    }},
    { key: 'biaya', label: 'Biaya Perbaikan', render: (row) => (
      <span className="font-semibold text-slate-800">{formatCurrency(row.biaya || 0)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => {
      const color = row.status === 'selesai' ? 'badge-green' : row.status === 'proses' ? 'badge-blue' : row.status === 'batal' ? 'badge-red' : 'badge-yellow';
      return <span className={`badge ${color} badge-dot capitalize`}>{row.status}</span>;
    }},
    { key: 'tgl', label: 'Tgl Lapor', render: (row) => (
      <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEditModal(row)} title="Edit & Update Status" />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingLog(row)} title="Hapus" />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Maintenance & Perawatan Sarpras Kampus"
        description="Pelaporan tiket kerusakan barang/ruangan, penanganan teknisi, & pencatatan biaya perbaikan (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
              Buat Tiket Perawatan
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
              placeholder="Cari nomor tiket, judul kerusakan, atau objek sarpras..."
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
        data={maintenanceList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE MAINTENANCE MODAL */}
      <Modal
        open={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        title="Hapus Tiket Maintenance?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingLog(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteMaintenance}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus tiket perawatan <strong>{deletingLog?.judul}</strong> (MNT-{deletingLog?.id})?
        </p>
      </Modal>

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
                setStatusFilter('');
                setPrioritasFilter('');
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
