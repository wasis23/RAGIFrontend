'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Check,
  Tv,
  Wifi,
  Wind
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import type {
  Gedung,
  GedungFormPayload,
  Ruangan,
  RuanganFormPayload,
  CheckKetersediaanPayload
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function GedungRuanganPage() {
  const [activeTab, setActiveTab] = useState<'gedung' | 'ruangan'>('gedung');

  // ------------------------------------------------------------
  // TAB 1: GEDUNG STATES
  // ------------------------------------------------------------
  const [gedungList, setGedungList] = useState<Gedung[]>([]);
  const [isGedungLoading, setIsGedungLoading] = useState(true);
  const [gedungPage, setGedungPage] = useState(1);
  const [gedungMeta, setGedungMeta] = useState<PaginationMeta | undefined>(undefined);
  const [gedungSearch, setGedungSearch] = useState('');
  const [gedungStatusFilter, setGedungStatusFilter] = useState('');

  // Modal Gedung State
  const [showGedungModal, setShowGedungModal] = useState(false);
  const [editingGedung, setEditingGedung] = useState<Gedung | null>(null);
  const [deletingGedung, setDeletingGedung] = useState<Gedung | null>(null);

  const [gedungForm, setGedungForm] = useState<GedungFormPayload>({
    kode: '',
    nama: '',
    jumlah_lantai: 1,
    alamat: '',
    tahun_bangun: new Date().getFullYear(),
    luas_m2: undefined,
    status: 'aktif',
  });

  // ------------------------------------------------------------
  // TAB 2: RUANGAN STATES
  // ------------------------------------------------------------
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [isRuanganLoading, setIsRuanganLoading] = useState(true);
  const [ruanganPage, setRuanganPage] = useState(1);
  const [ruanganMeta, setRuanganMeta] = useState<PaginationMeta | undefined>(undefined);
  const [ruanganSearch, setRuanganSearch] = useState('');
  const [ruanganTipeFilter, setRuanganTipeFilter] = useState('');
  const [ruanganStatusFilter, setRuanganStatusFilter] = useState('');
  const [ruanganGedungFilterObj, setRuanganGedungFilterObj] = useState<{ value: string; label: string } | null>(null);

  // Modal Ruangan State
  const [showRuanganModal, setShowRuanganModal] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null);
  const [deletingRuangan, setDeletingRuangan] = useState<Ruangan | null>(null);
  const [selectedGedungObj, setSelectedGedungObj] = useState<{ value: string; label: string } | null>(null);

  const [ruanganForm, setRuanganForm] = useState<RuanganFormPayload>({
    gedung_id: 0,
    kode: '',
    nama: '',
    lantai: 1,
    tipe: 'kelas',
    kapasitas: 40,
    luas_m2: undefined,
    ada_ac: true,
    ada_proyektor: true,
    ada_wifi: true,
    keterangan: '',
    status: 'aktif',
  });

  // Modal Check Ketersediaan State
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedRuanganForCheck, setSelectedRuanganForCheck] = useState<Ruangan | null>(null);
  const [checkForm, setCheckForm] = useState<CheckKetersediaanPayload>({
    ruangan_id: 0,
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '08:00',
    jam_selesai: '10:00',
  });
  const [checkResult, setCheckResult] = useState<{ is_available?: boolean; checked?: boolean }>({});
  const [isChecking, setIsChecking] = useState(false);

  // ------------------------------------------------------------
  // FETCH DATA FUNCTIONS
  // ------------------------------------------------------------
  const fetchGedung = async () => {
    setIsGedungLoading(true);
    try {
      const res: any = await sinapraService.getGedungList({
        page: gedungPage,
        search: gedungSearch,
        status: gedungStatusFilter || undefined,
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

      setGedungList(items);
      setGedungMeta(metaData);
    } catch {
      toast.error('Gagal memuat data gedung kampus.');
    } finally {
      setIsGedungLoading(false);
    }
  };

  const fetchRuangan = async () => {
    setIsRuanganLoading(true);
    try {
      const res: any = await sinapraService.getRuanganList({
        page: ruanganPage,
        search: ruanganSearch,
        status: ruanganStatusFilter || undefined,
        gedung_id: ruanganGedungFilterObj ? parseInt(ruanganGedungFilterObj.value) : undefined,
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

      setRuanganList(items);
      setRuanganMeta(metaData);
    } catch {
      toast.error('Gagal memuat data ruangan kampus.');
    } finally {
      setIsRuanganLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gedung') fetchGedung();
  }, [activeTab, gedungPage, gedungSearch, gedungStatusFilter]);

  useEffect(() => {
    if (activeTab === 'ruangan') fetchRuangan();
  }, [activeTab, ruanganPage, ruanganSearch, ruanganStatusFilter, ruanganGedungFilterObj]);

  const loadGedungOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getGedungList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((g: Gedung) => ({ value: g.id.toString(), label: `${g.kode} - ${g.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // ------------------------------------------------------------
  // HANDLERS GEDUNG
  // ------------------------------------------------------------
  const handleOpenCreateGedung = () => {
    setEditingGedung(null);
    setGedungForm({
      kode: '',
      nama: '',
      jumlah_lantai: 1,
      alamat: '',
      tahun_bangun: new Date().getFullYear(),
      luas_m2: undefined,
      status: 'aktif',
    });
    setShowGedungModal(true);
  };

  const handleOpenEditGedung = (g: Gedung) => {
    setEditingGedung(g);
    setGedungForm({
      kode: g.kode,
      nama: g.nama,
      jumlah_lantai: g.jumlah_lantai,
      alamat: g.alamat || '',
      tahun_bangun: g.tahun_bangun || new Date().getFullYear(),
      luas_m2: g.luas_m2,
      status: g.status,
    });
    setShowGedungModal(true);
  };

  const handleSaveGedung = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gedungForm.kode || !gedungForm.nama) {
      toast.error('Kode dan Nama Gedung wajib diisi!');
      return;
    }

    try {
      if (editingGedung) {
        await sinapraService.updateGedung(editingGedung.id, gedungForm);
        toast.success('Data gedung berhasil diperbarui!');
      } else {
        await sinapraService.createGedung(gedungForm);
        toast.success('Gedung baru berhasil ditambahkan!');
      }
      fetchGedung();
      setShowGedungModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data gedung.');
    }
  };

  const handleDeleteGedung = async () => {
    if (!deletingGedung) return;
    try {
      await sinapraService.deleteGedung(deletingGedung.id);
      toast.success(`Gedung ${deletingGedung.nama} berhasil dihapus.`);
      fetchGedung();
    } catch {
      toast.error('Gagal menghapus gedung.');
    } finally {
      setDeletingGedung(null);
    }
  };

  // ------------------------------------------------------------
  // HANDLERS RUANGAN
  // ------------------------------------------------------------
  const handleOpenCreateRuangan = () => {
    setEditingRuangan(null);
    setSelectedGedungObj(null);
    setRuanganForm({
      gedung_id: 0,
      kode: '',
      nama: '',
      lantai: 1,
      tipe: 'kelas',
      kapasitas: 40,
      luas_m2: undefined,
      ada_ac: true,
      ada_proyektor: true,
      ada_wifi: true,
      keterangan: '',
      status: 'aktif',
    });
    setShowRuanganModal(true);
  };

  const handleOpenEditRuangan = (r: Ruangan) => {
    setEditingRuangan(r);
    if (r.gedung) {
      setSelectedGedungObj({ value: r.gedung.id.toString(), label: `${r.gedung.kode} - ${r.gedung.nama}` });
    }
    setRuanganForm({
      gedung_id: r.gedung_id,
      kode: r.kode,
      nama: r.nama,
      lantai: r.lantai,
      tipe: r.tipe,
      kapasitas: r.kapasitas,
      luas_m2: r.luas_m2,
      ada_ac: Boolean(r.ada_ac),
      ada_proyektor: Boolean(r.ada_proyektor),
      ada_wifi: Boolean(r.ada_wifi),
      keterangan: r.keterangan || '',
      status: r.status,
    });
    setShowRuanganModal(true);
  };

  const handleSaveRuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruanganForm.gedung_id || !ruanganForm.kode || !ruanganForm.nama) {
      toast.error('Gedung, Kode, dan Nama Ruangan wajib diisi!');
      return;
    }

    try {
      if (editingRuangan) {
        await sinapraService.updateRuangan(editingRuangan.id, ruanganForm);
        toast.success('Data ruangan berhasil diperbarui!');
      } else {
        await sinapraService.createRuangan(ruanganForm);
        toast.success('Ruangan baru berhasil ditambahkan!');
      }
      fetchRuangan();
      setShowRuanganModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data ruangan.');
    }
  };

  const handleDeleteRuangan = async () => {
    if (!deletingRuangan) return;
    try {
      await sinapraService.deleteRuangan(deletingRuangan.id);
      toast.success(`Ruangan ${deletingRuangan.nama} berhasil dihapus.`);
      fetchRuangan();
    } catch {
      toast.error('Gagal menghapus ruangan.');
    } finally {
      setDeletingRuangan(null);
    }
  };

  // ------------------------------------------------------------
  // HANDLERS CEK KETERSEDIAAN
  // ------------------------------------------------------------
  const handleOpenCheckModal = (r: Ruangan) => {
    setSelectedRuanganForCheck(r);
    setCheckForm({
      ruangan_id: r.id,
      tanggal: new Date().toISOString().split('T')[0],
      jam_mulai: '08:00',
      jam_selesai: '10:00',
    });
    setCheckResult({});
    setShowCheckModal(true);
  };

  const handleCheckKetersediaan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    try {
      const res = await sinapraService.checkKetersediaanRuangan(checkForm);
      setCheckResult({ is_available: res.data?.is_available, checked: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengecek ketersediaan.');
    } finally {
      setIsChecking(false);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS
  // ------------------------------------------------------------
  const gedungColumns: ColumnDef<Gedung>[] = [
    { key: 'id', label: 'No', render: (_, idx) => <span className="font-bold text-slate-400">{gedungMeta?.from ? gedungMeta.from + idx : idx + 1}</span> },
    { key: 'kode', label: 'Kode', render: (row) => <span className="badge badge-blue font-mono">{row.kode}</span> },
    { key: 'nama', label: 'Nama Gedung', render: (row) => (
      <div>
        <div className="font-bold text-slate-900">{row.nama}</div>
        <div className="text-xs text-slate-500">{row.alamat || 'Alamat belum diisi'}</div>
      </div>
    )},
    { key: 'lantai', label: 'Jml Lantai', render: (row) => <span>{row.jumlah_lantai} Lantai</span> },
    { key: 'ruangan_count', label: 'Total Ruangan', render: (row) => <span className="font-semibold text-slate-700">{row.ruangan_count ?? row.ruangan?.length ?? 0} Ruangan</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const color = row.status === 'aktif' ? 'badge-green' : row.status === 'renovasi' ? 'badge-yellow' : 'badge-red';
      return <span className={`badge ${color} badge-dot capitalize`}>{row.status}</span>;
    }},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEditGedung(row)} />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingGedung(row)} />
      </div>
    )},
  ];

  const ruanganColumns: ColumnDef<Ruangan>[] = [
    { key: 'id', label: 'No', render: (_, idx) => <span className="font-bold text-slate-400">{ruanganMeta?.from ? ruanganMeta.from + idx : idx + 1}</span> },
    { key: 'kode', label: 'Kode', render: (row) => <span className="badge badge-blue font-mono">{row.kode}</span> },
    { key: 'nama', label: 'Nama Ruangan', render: (row) => (
      <div>
        <div className="font-bold text-slate-900">{row.nama}</div>
        <div className="text-xs text-slate-500">{row.gedung?.nama || 'Gedung ID: ' + row.gedung_id} (Lantai {row.lantai})</div>
      </div>
    )},
    { key: 'tipe', label: 'Tipe', render: (row) => <span className="capitalize text-xs font-semibold text-slate-700">{row.tipe}</span> },
    { key: 'kapasitas', label: 'Kapasitas', render: (row) => <span>{row.kapasitas} Orang</span> },
    { key: 'fasilitas', label: 'Fasilitas', render: (row) => (
      <div className="flex gap-1.5">
        {row.ada_ac && <span className="badge badge-gray text-xs" title="AC"><Wind size={12} className="mr-1 text-blue-500" /> AC</span>}
        {row.ada_proyektor && <span className="badge badge-gray text-xs" title="Proyektor"><Tv size={12} className="mr-1 text-purple-500" /> Proyektor</span>}
        {row.ada_wifi && <span className="badge badge-gray text-xs" title="WiFi"><Wifi size={12} className="mr-1 text-emerald-500" /> WiFi</span>}
      </div>
    )},
    { key: 'status', label: 'Status', render: (row) => {
      const color = row.status === 'aktif' ? 'badge-green' : row.status === 'maintenance' ? 'badge-yellow' : 'badge-red';
      return <span className={`badge ${color} badge-dot capitalize`}>{row.status}</span>;
    }},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" icon={<Clock size={14} />} onClick={() => handleOpenCheckModal(row)}>
          Cek Jam
        </Button>
        <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEditRuangan(row)} />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingRuangan(row)} />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Gedung & Ruangan Kampus"
        description="Kelola sarana infrastruktur gedung, denah ruangan, ketersediaan jadwal, & fasilitas fisik (Modul SINAPRA)"
        action={
          activeTab === 'gedung' ? (
            <Button icon={<Plus size={16} />} onClick={handleOpenCreateGedung}>
              Tambah Gedung
            </Button>
          ) : (
            <Button icon={<Plus size={16} />} onClick={handleOpenCreateRuangan}>
              Tambah Ruangan
            </Button>
          )
        }
      />

      {/* TAB SWITCHER & FILTER HEADER */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* TAB BUTTONS */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('gedung')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'gedung' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={18} /> Gedung Kampus
            </button>
            <button
              onClick={() => setActiveTab('ruangan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'ruangan' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home size={18} /> Ruangan Kampus
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="w-full md:w-72">
            <Input
              placeholder={activeTab === 'gedung' ? 'Cari gedung...' : 'Cari ruangan...'}
              prefixIcon={<Search size={16} />}
              value={activeTab === 'gedung' ? gedungSearch : ruanganSearch}
              onChange={(e) => {
                if (activeTab === 'gedung') {
                  setGedungSearch(e.target.value);
                  setGedungPage(1);
                } else {
                  setRuanganSearch(e.target.value);
                  setRuanganPage(1);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'gedung' ? (
        <DataTable
          columns={gedungColumns}
          data={gedungList}
          isLoading={isGedungLoading}
          meta={gedungMeta}
          onPageChange={(p) => setGedungPage(p)}
        />
      ) : (
        <DataTable
          columns={ruanganColumns}
          data={ruanganList}
          isLoading={isRuanganLoading}
          meta={ruanganMeta}
          onPageChange={(p) => setRuanganPage(p)}
        />
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM GEDUNG (5 INPUT - POPUP MODAL) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showGedungModal}
        onClose={() => setShowGedungModal(false)}
        title={editingGedung ? 'Edit Gedung Kampus' : 'Tambah Gedung Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowGedungModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveGedung}>
              {editingGedung ? 'Simpan Perubahan' : 'Tambah Gedung'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveGedung} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Kode Gedung"
            required
            placeholder="cth: GDG-A"
            value={gedungForm.kode}
            onChange={(e) => setGedungForm({ ...gedungForm, kode: e.target.value })}
          />

          <Input
            label="Nama Gedung"
            required
            placeholder="cth: Gedung Rektorat Utama"
            value={gedungForm.nama}
            onChange={(e) => setGedungForm({ ...gedungForm, nama: e.target.value })}
          />

          <Input
            label="Jumlah Lantai"
            type="number"
            required
            min={1}
            value={gedungForm.jumlah_lantai}
            onChange={(e) => setGedungForm({ ...gedungForm, jumlah_lantai: parseInt(e.target.value) || 1 })}
          />

          <Select
            label="Status Gedung"
            value={gedungForm.status || 'aktif'}
            onChange={(val) => setGedungForm({ ...gedungForm, status: val as any })}
            options={[
              { value: 'aktif', label: 'Aktif' },
              { value: 'renovasi', label: 'Renovasi' },
              { value: 'nonaktif', label: 'Non-aktif' },
            ]}
          />

          <div className="col-span-full">
            <Input
              label="Alamat / Lokasi Kampus"
              placeholder="cth: Jl. Utama Kampus 1 Block A"
              value={gedungForm.alamat || ''}
              onChange={(e) => setGedungForm({ ...gedungForm, alamat: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* DELETE GEDUNG MODAL */}
      <Modal
        open={!!deletingGedung}
        onClose={() => setDeletingGedung(null)}
        title="Hapus Gedung?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingGedung(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteGedung}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus gedung <strong>{deletingGedung?.nama}</strong>? Seluruh ruangan di dalam gedung ini juga akan terhapus.
        </p>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM RUANGAN (GRID 2 KOLOM MODAL) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showRuanganModal}
        onClose={() => setShowRuanganModal(false)}
        title={editingRuangan ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRuanganModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveRuangan}>
              {editingRuangan ? 'Simpan Perubahan' : 'Tambah Ruangan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveRuangan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AsyncSelect
            label="Gedung Kampus"
            required
            placeholder="Cari gedung..."
            value={selectedGedungObj}
            onChange={(selected: any) => {
              setSelectedGedungObj(selected);
              setRuanganForm({ ...ruanganForm, gedung_id: selected ? parseInt(selected.value) : 0 });
            }}
            loadOptions={loadGedungOptions}
          />

          <Input
            label="Kode Ruangan"
            required
            placeholder="cth: R-101"
            value={ruanganForm.kode}
            onChange={(e) => setRuanganForm({ ...ruanganForm, kode: e.target.value })}
          />

          <Input
            label="Nama Ruangan"
            required
            placeholder="cth: Lab Komputer Lanjut"
            value={ruanganForm.nama}
            onChange={(e) => setRuanganForm({ ...ruanganForm, nama: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Posisi Lantai"
              type="number"
              required
              min={1}
              value={ruanganForm.lantai}
              onChange={(e) => setRuanganForm({ ...ruanganForm, lantai: parseInt(e.target.value) || 1 })}
            />
            <Input
              label="Kapasitas (Orang)"
              type="number"
              required
              min={1}
              value={ruanganForm.kapasitas}
              onChange={(e) => setRuanganForm({ ...ruanganForm, kapasitas: parseInt(e.target.value) || 1 })}
            />
          </div>

          <Select
            label="Tipe Ruangan"
            value={ruanganForm.tipe}
            onChange={(val) => setRuanganForm({ ...ruanganForm, tipe: val as any })}
            options={[
              { value: 'kelas', label: 'Ruang Kelas Teori' },
              { value: 'laboratorium', label: 'Laboratorium Praktikum' },
              { value: 'kantor', label: 'Ruang Kantor / Dosen' },
              { value: 'aula', label: 'Aula / Auditorium' },
              { value: 'gudang', label: 'Gudang Sarpras' },
              { value: 'lainnya', label: 'Fasilitas Lainnya' },
            ]}
          />

          <Select
            label="Status Ruangan"
            value={ruanganForm.status || 'aktif'}
            onChange={(val) => setRuanganForm({ ...ruanganForm, status: val as any })}
            options={[
              { value: 'aktif', label: 'Aktif & Siap Pakai' },
              { value: 'maintenance', label: 'Maintenance / Perawatan' },
              { value: 'nonaktif', label: 'Non-aktif' },
            ]}
          />

          {/* FASILITAS CHECKBOXES */}
          <div className="col-span-full bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-6 items-center">
            <span className="text-sm font-bold text-slate-700">Fasilitas Tersedia:</span>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={ruanganForm.ada_ac}
                onChange={(e) => setRuanganForm({ ...ruanganForm, ada_ac: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded"
              />
              Air Conditioner (AC)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={ruanganForm.ada_proyektor}
                onChange={(e) => setRuanganForm({ ...ruanganForm, ada_proyektor: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded"
              />
              Proyektor LCD
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={ruanganForm.ada_wifi}
                onChange={(e) => setRuanganForm({ ...ruanganForm, ada_wifi: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded"
              />
              Koneksi WiFi High-Speed
            </label>
          </div>
        </form>
      </Modal>

      {/* DELETE RUANGAN MODAL */}
      <Modal
        open={!!deletingRuangan}
        onClose={() => setDeletingRuangan(null)}
        title="Hapus Ruangan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingRuangan(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteRuangan}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus ruangan <strong>{deletingRuangan?.nama}</strong>?
        </p>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* MODAL CEK KETERSEDIAAN JAM RUANGAN */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        title={`Cek Ketersediaan — ${selectedRuanganForCheck?.nama}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCheckModal(false)}>Tutup</Button>
            <Button variant="primary" onClick={handleCheckKetersediaan} loading={isChecking}>
              Periksa Waktu
            </Button>
          </>
        }
      >
        <form onSubmit={handleCheckKetersediaan} className="space-y-4">
          <Input
            label="Tanggal Pemakaian"
            type="date"
            required
            value={checkForm.tanggal}
            onChange={(e) => setCheckForm({ ...checkForm, tanggal: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Mulai"
              type="time"
              required
              value={checkForm.jam_mulai}
              onChange={(e) => setCheckForm({ ...checkForm, jam_mulai: e.target.value })}
            />
            <Input
              label="Jam Selesai"
              type="time"
              required
              value={checkForm.jam_selesai}
              onChange={(e) => setCheckForm({ ...checkForm, jam_selesai: e.target.value })}
            />
          </div>

          {checkResult.checked && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
                checkResult.is_available
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {checkResult.is_available ? (
                <>
                  <CheckCircle className="text-emerald-600" size={24} />
                  <div>
                    <div className="font-bold">Ruangan Tersedia!</div>
                    <div className="text-xs">Tidak ada peminjaman lain pada rentang jam tersebut.</div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="text-rose-600" size={24} />
                  <div>
                    <div className="font-bold">Ruangan Bentrok / Terpakai!</div>
                    <div className="text-xs">Telah terdapat permohonan/peminjaman lain yang disetujui.</div>
                  </div>
                </>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
