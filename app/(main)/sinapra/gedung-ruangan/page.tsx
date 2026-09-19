'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Building2,
  Home,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Tv,
  Wifi,
  Wind,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // ------------------------------------------------------------
  // TAB 1: GEDUNG STATES
  // ------------------------------------------------------------
  const [gedungList, setGedungList] = useState<Gedung[]>([]);
  const [isGedungLoading, setIsGedungLoading] = useState(true);
  const [gedungPage, setGedungPage] = useState(1);
  const [gedungMeta, setGedungMeta] = useState<PaginationMeta | undefined>(undefined);
  const [gedungSearch, setGedungSearch] = useState('');
  const [gedungStatusFilter, setGedungStatusFilter] = useState('');
  const [gedungSortBy, setGedungSortBy] = useState('nama');
  const [gedungSortDir, setGedungSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal Gedung State
  const [showGedungModal, setShowGedungModal] = useState(false);
  const [editingGedung, setEditingGedung] = useState<Gedung | null>(null);
  const [deletingGedung, setDeletingGedung] = useState<Gedung | null>(null);
  const [isDeletingGedung, setIsDeletingGedung] = useState(false);

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
  const [ruanganSortBy, setRuanganSortBy] = useState('nama');
  const [ruanganSortDir, setRuanganSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal Ruangan State
  const [showRuanganModal, setShowRuanganModal] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null);
  const [deletingRuangan, setDeletingRuangan] = useState<Ruangan | null>(null);
  const [isDeletingRuangan, setIsDeletingRuangan] = useState(false);
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
        sort_by: gedungSortBy || undefined,
        sort_dir: gedungSortDir || undefined,
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
        tipe: ruanganTipeFilter || undefined,
        status: ruanganStatusFilter || undefined,
        gedung_id: ruanganGedungFilterObj ? parseInt(ruanganGedungFilterObj.value) : undefined,
        sort_by: ruanganSortBy || undefined,
        sort_dir: ruanganSortDir || undefined,
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
  }, [activeTab, gedungPage, gedungSearch, gedungStatusFilter, gedungSortBy, gedungSortDir]);

  useEffect(() => {
    if (activeTab === 'ruangan') fetchRuangan();
  }, [activeTab, ruanganPage, ruanganSearch, ruanganStatusFilter, ruanganTipeFilter, ruanganGedungFilterObj, ruanganSortBy, ruanganSortDir]);

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
    setIsDeletingGedung(true);
    try {
      await sinapraService.deleteGedung(deletingGedung.id);
      toast.success(`Gedung ${deletingGedung.nama} berhasil dihapus.`);
      fetchGedung();
      setDeletingGedung(null);
    } catch {
      toast.error('Gagal menghapus gedung.');
    } finally {
      setIsDeletingGedung(false);
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
    setIsDeletingRuangan(true);
    try {
      await sinapraService.deleteRuangan(deletingRuangan.id);
      toast.success(`Ruangan ${deletingRuangan.nama} berhasil dihapus.`);
      fetchRuangan();
      setDeletingRuangan(null);
    } catch {
      toast.error('Gagal menghapus ruangan.');
    } finally {
      setIsDeletingRuangan(false);
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
  // COLUMNS DEFINITIONS (SIMPEG Standard: Max 12px, 2-Row Format)
  // ------------------------------------------------------------
  const gedungColumns: ColumnDef<Gedung>[] = [
    {
      key: 'kode',
      label: 'KODE & IDENTITAS',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            {row.kode}
          </span>
          <span className="text-2xs text-slate-400 font-mono block">
            ID #{row.id}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA GEDUNG & ALAMAT',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1">
            {row.alamat || 'Alamat belum diisi'} {row.tahun_bangun ? `• Thn ${row.tahun_bangun}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'lantai',
      label: 'SPESIFIKASI',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">
            {row.jumlah_lantai} Lantai
          </span>
          <span className="text-2xs text-slate-400 block">
            {row.luas_m2 ? `${row.luas_m2} m²` : 'Luas -'}
          </span>
        </div>
      ),
    },
    {
      key: 'ruangan_count',
      label: 'TOTAL RUANGAN',
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 15%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
          }}
          className="text-2xs font-semibold"
        >
          {row.ruangan_count ?? row.ruangan?.length ?? 0} Ruangan
        </Badge>
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
                label: 'Ubah Data Gedung',
                icon: <Edit2 size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleOpenEditGedung(row),
              },
              {
                label: 'Hapus Gedung',
                icon: <Trash2 size={16} className="text-[var(--danger)]" />,
                variant: 'danger',
                onClick: () => setDeletingGedung(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const ruanganColumns: ColumnDef<Ruangan>[] = [
    {
      key: 'kode',
      label: 'KODE & IDENTITAS',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            {row.kode}
          </span>
          <span className="text-2xs text-slate-400 font-mono block">
            ID #{row.id}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA RUANGAN & GEDUNG',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1">
            {row.gedung?.nama || `Gedung #${row.gedung_id}`} • Lantai {row.lantai}
          </div>
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'TIPE & KAPASITAS',
      render: (row) => (
        <div>
          <span className="capitalize text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            {row.tipe}
          </span>
          <span className="text-2xs text-slate-400 block">
            Kapasitas {row.kapasitas} Orang
          </span>
        </div>
      ),
    },
    {
      key: 'fasilitas',
      label: 'FASILITAS',
      render: (row) => (
        <div className="flex gap-2">
          {row.ada_ac && (
            <Badge
              style={{
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 15%, transparent)',
                color: 'var(--module-primary)',
                borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
              }}
              className="text-2xs"
              title="AC"
            >
              AC
            </Badge>
          )}
          {row.ada_proyektor && (
            <Badge
              style={{
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 15%, transparent)',
                color: 'var(--module-primary)',
                borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
              }}
              className="text-2xs"
              title="Proyektor"
            >
              LCD
            </Badge>
          )}
          {row.ada_wifi && (
            <Badge
              style={{
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 15%, transparent)',
                color: 'var(--module-primary)',
                borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
              }}
              className="text-2xs"
              title="WiFi"
            >
              WiFi
            </Badge>
          )}
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
                label: 'Cek Ketersediaan Jam',
                icon: <Clock size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleOpenCheckModal(row),
              },
              {
                label: 'Ubah Data Ruangan',
                icon: <Edit2 size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleOpenEditRuangan(row),
              },
              {
                label: 'Hapus Ruangan',
                icon: <Trash2 size={16} className="text-[var(--danger)]" />,
                variant: 'danger',
                onClick: () => setDeletingRuangan(row),
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
        title="Gedung & Ruangan Kampus"
        description="Kelola sarana infrastruktur gedung, denah ruangan, ketersediaan jadwal, & fasilitas fisik (Modul SINAPRA)"
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
            {activeTab === 'gedung' ? (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateGedung}>
                Tambah Gedung
              </Button>
            ) : (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateRuangan}>
                Tambah Ruangan
              </Button>
            )}
          </div>
        }
      />

      {/* TAB NAVIGATION (Rounded-top underline standard) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('gedung')}
          style={
            activeTab === 'gedung'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 10%, transparent)',
                }
              : undefined
          }
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
            activeTab === 'gedung'
              ? ''
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Building2 size={18} /> Gedung Kampus
        </button>
        <button
          onClick={() => setActiveTab('ruangan')}
          style={
            activeTab === 'ruangan'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 10%, transparent)',
                }
              : undefined
          }
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
            activeTab === 'ruangan'
              ? ''
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Home size={18} /> Ruangan Kampus
        </button>
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

      {/* DELETE GEDUNG CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingGedung}
        onClose={() => setDeletingGedung(null)}
        onConfirm={handleDeleteGedung}
        title="Hapus Gedung Kampus?"
        message={`Apakah Anda yakin ingin menghapus gedung ${deletingGedung?.nama}? Seluruh ruangan di dalamnya juga akan terhapus.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeletingGedung}
      />

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
            <Checkbox
              label="Air Conditioner (AC)"
              checked={ruanganForm.ada_ac}
              onChange={(e) => setRuanganForm({ ...ruanganForm, ada_ac: e.target.checked })}
            />
            <Checkbox
              label="Proyektor LCD"
              checked={ruanganForm.ada_proyektor}
              onChange={(e) => setRuanganForm({ ...ruanganForm, ada_proyektor: e.target.checked })}
            />
            <Checkbox
              label="Koneksi WiFi High-Speed"
              checked={ruanganForm.ada_wifi}
              onChange={(e) => setRuanganForm({ ...ruanganForm, ada_wifi: e.target.checked })}
            />
          </div>
        </form>
      </Modal>

      {/* DELETE RUANGAN CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingRuangan}
        onClose={() => setDeletingRuangan(null)}
        onConfirm={handleDeleteRuangan}
        title="Hapus Ruangan Kampus?"
        message={`Apakah Anda yakin ingin menghapus ruangan ${deletingRuangan?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeletingRuangan}
      />

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

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title={activeTab === 'gedung' ? 'Filter Gedung Kampus' : 'Filter Ruangan Kampus'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (activeTab === 'gedung') {
                  setGedungSearch('');
                  setGedungStatusFilter('');
                  setGedungSortBy('nama');
                  setGedungSortDir('asc');
                  setGedungPage(1);
                } else {
                  setRuanganSearch('');
                  setRuanganTipeFilter('');
                  setRuanganStatusFilter('');
                  setRuanganGedungFilterObj(null);
                  setRuanganSortBy('nama');
                  setRuanganSortDir('asc');
                  setRuanganPage(1);
                }
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
        {activeTab === 'gedung' ? (
          <div className="space-y-4">
            <Input
              label="Pencarian Gedung"
              placeholder="Cari kode atau nama gedung..."
              value={gedungSearch}
              onChange={(e) => setGedungSearch(e.target.value)}
            />

            <Select
              label="Status Gedung"
              value={gedungStatusFilter}
              onChange={(val) => setGedungStatusFilter(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'renovasi', label: 'Renovasi' },
                { value: 'nonaktif', label: 'Non-aktif' },
              ]}
            />

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urutkan Berdasarkan"
                value={gedungSortBy}
                onChange={(val) => setGedungSortBy(val)}
                options={[
                  { value: 'nama', label: 'Nama Gedung' },
                  { value: 'kode', label: 'Kode Gedung' },
                  { value: 'jumlah_lantai', label: 'Jumlah Lantai' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={gedungSortDir}
                onChange={(val: any) => setGedungSortDir(val)}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z)' },
                  { value: 'desc', label: 'Menurun (Z-A)' },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Pencarian Ruangan"
              placeholder="Cari kode atau nama ruangan..."
              value={ruanganSearch}
              onChange={(e) => setRuanganSearch(e.target.value)}
            />

            <AsyncSelect
              label="Gedung Kampus"
              placeholder="Pilih gedung..."
              value={ruanganGedungFilterObj}
              onChange={(sel: any) => setRuanganGedungFilterObj(sel)}
              loadOptions={loadGedungOptions}
            />

            <Input
              label="Tipe Ruangan"
              placeholder="Cth: kelas, laboratorium, kantor..."
              value={ruanganTipeFilter}
              onChange={(e) => setRuanganTipeFilter(e.target.value)}
            />

            <Select
              label="Status Ruangan"
              value={ruanganStatusFilter}
              onChange={(val) => setRuanganStatusFilter(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'aktif', label: 'Aktif & Siap Pakai' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'nonaktif', label: 'Non-aktif' },
              ]}
            />

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urutkan Berdasarkan"
                value={ruanganSortBy}
                onChange={(val) => setRuanganSortBy(val)}
                options={[
                  { value: 'nama', label: 'Nama Ruangan' },
                  { value: 'kode', label: 'Kode Ruangan' },
                  { value: 'kapasitas', label: 'Kapasitas' },
                  { value: 'lantai', label: 'Lantai' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={ruanganSortDir}
                onChange={(val: any) => setRuanganSortDir(val)}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z)' },
                  { value: 'desc', label: 'Menurun (Z-A)' },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
