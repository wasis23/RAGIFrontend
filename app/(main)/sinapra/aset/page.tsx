'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Calculator,
  Search,
  Tag,
  MapPin,
  TrendingDown,
  Layers,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  Aset,
  KategoriAset,
  KategoriAsetFormPayload,
  PenyusutanAsetResult
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function AsetPage() {
  const router = useRouter();

  // ------------------------------------------------------------
  // ASET LISTING STATES
  // ------------------------------------------------------------
  const [asetList, setAsetList] = useState<Aset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kategoriFilterObj, setKategoriFilterObj] = useState<{ value: string; label: string } | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modal Deleting Aset
  const [deletingAset, setDeletingAset] = useState<Aset | null>(null);

  // Modal Kalkulator Penyusutan
  const [showPenyusutanModal, setShowPenyusutanModal] = useState(false);
  const [penyusutanData, setPenyusutanData] = useState<PenyusutanAsetResult | null>(null);
  const [isPenyusutanLoading, setIsPenyusutanLoading] = useState(false);

  // ------------------------------------------------------------
  // KATEGORI ASET STATES (MODAL 5 INPUT)
  // ------------------------------------------------------------
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriAset[]>([]);
  const [isKategoriLoading, setIsKategoriLoading] = useState(false);
  const [editingKategori, setEditingKategori] = useState<KategoriAset | null>(null);
  const [deletingKategori, setDeletingKategori] = useState<KategoriAset | null>(null);
  const [selectedParentKategoriObj, setSelectedParentKategoriObj] = useState<{ value: string; label: string } | null>(null);

  const [kategoriForm, setKategoriForm] = useState<KategoriAsetFormPayload>({
    parent_id: null,
    kode: '',
    nama: '',
    deskripsi: '',
    masa_manfaat_tahun: 5,
    tarif_penyusutan_persen: 20,
  });

  // ------------------------------------------------------------
  // FETCH DATA FUNCTIONS
  // ------------------------------------------------------------
  const fetchAset = async () => {
    setIsLoading(true);
    try {
      const res: any = await sinapraService.getAsetList({
        page,
        search,
        kondisi: kondisiFilter || undefined,
        status: statusFilter || undefined,
        kategori_id: kategoriFilterObj ? parseInt(kategoriFilterObj.value) : undefined,
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

      setAsetList(items);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data inventaris aset.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKategori = async () => {
    setIsKategoriLoading(true);
    try {
      const res: any = await sinapraService.getKategoriList();
      let items = res?.data?.items || res?.data || res || [];
      if (Array.isArray(items)) setKategoriList(items);
    } catch {
      toast.error('Gagal memuat kategori aset.');
    } finally {
      setIsKategoriLoading(false);
    }
  };

  useEffect(() => {
    fetchAset();
  }, [page, search, kondisiFilter, statusFilter, kategoriFilterObj]);

  const loadKategoriOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getKategoriList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((k: KategoriAset) => ({ value: k.id.toString(), label: `${k.kode} - ${k.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // ------------------------------------------------------------
  // HANDLERS ASET
  // ------------------------------------------------------------
  const handleDeleteAset = async () => {
    if (!deletingAset) return;
    try {
      await sinapraService.deleteAset(deletingAset.id);
      toast.success(`Aset ${deletingAset.nama} berhasil dihapus.`);
      fetchAset();
    } catch {
      toast.error('Gagal menghapus aset.');
    } finally {
      setDeletingAset(null);
    }
  };

  const handleHitungPenyusutan = async (aset: Aset) => {
    setIsPenyusutanLoading(true);
    setShowPenyusutanModal(true);
    try {
      const res = await sinapraService.hitungPenyusutanAset(aset.id);
      setPenyusutanData(res.data || null);
    } catch {
      toast.error('Gagal menghitung estimasi penyusutan aset.');
      setShowPenyusutanModal(false);
    } finally {
      setIsPenyusutanLoading(false);
    }
  };

  // ------------------------------------------------------------
  // HANDLERS KATEGORI
  // ------------------------------------------------------------
  const handleOpenKategoriManager = () => {
    fetchKategori();
    setShowKategoriModal(true);
  };

  const handleOpenCreateKategori = () => {
    setEditingKategori(null);
    setSelectedParentKategoriObj(null);
    setKategoriForm({
      parent_id: null,
      kode: '',
      nama: '',
      deskripsi: '',
      masa_manfaat_tahun: 5,
      tarif_penyusutan_persen: 20,
    });
  };

  const handleOpenEditKategori = (k: KategoriAset) => {
    setEditingKategori(k);
    if (k.parent) {
      setSelectedParentKategoriObj({ value: k.parent.id.toString(), label: `${k.parent.kode} - ${k.parent.nama}` });
    } else {
      setSelectedParentKategoriObj(null);
    }
    setKategoriForm({
      parent_id: k.parent_id || null,
      kode: k.kode,
      nama: k.nama,
      deskripsi: k.deskripsi || '',
      masa_manfaat_tahun: k.masa_manfaat_tahun || 5,
      tarif_penyusutan_persen: k.tarif_penyusutan_persen || 20,
    });
  };

  const handleSaveKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategoriForm.kode || !kategoriForm.nama) {
      toast.error('Kode dan Nama Kategori wajib diisi!');
      return;
    }

    try {
      if (editingKategori) {
        await sinapraService.updateKategori(editingKategori.id, kategoriForm);
        toast.success('Kategori aset diperbarui!');
      } else {
        await sinapraService.createKategori(kategoriForm);
        toast.success('Kategori aset baru ditambahkan!');
      }
      fetchKategori();
      handleOpenCreateKategori();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori.');
    }
  };

  const handleDeleteKategori = async () => {
    if (!deletingKategori) return;
    try {
      await sinapraService.deleteKategori(deletingKategori.id);
      toast.success(`Kategori ${deletingKategori.nama} dihapus.`);
      fetchKategori();
    } catch {
      toast.error('Gagal menghapus kategori aset.');
    } finally {
      setDeletingKategori(null);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS
  // ------------------------------------------------------------
  const columns: ColumnDef<Aset>[] = [
    { key: 'id', label: 'No', render: (_, idx) => <span className="font-bold text-slate-400">{meta?.from ? meta.from + idx : idx + 1}</span> },
    { key: 'kode_aset', label: 'Kode Aset', render: (row) => <span className="badge badge-blue font-mono">{row.kode_aset}</span> },
    { key: 'nama', label: 'Nama Barang / Spesi', render: (row) => (
      <div>
        <div className="font-bold text-slate-900">{row.nama}</div>
        <div className="text-xs text-slate-500">{row.merk ? `Merk: ${row.merk}` : 'Spesifikasi standar'} {row.nomor_seri ? `(SN: ${row.nomor_seri})` : ''}</div>
      </div>
    )},
    { key: 'kategori', label: 'Kategori', render: (row) => (
      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
        {row.kategori?.nama || 'Kategori ID: ' + row.kategori_id}
      </span>
    )},
    { key: 'lokasi', label: 'Lokasi Ruangan', render: (row) => (
      <span className="text-xs text-slate-600 flex items-center gap-1">
        <MapPin size={12} className="text-rose-500" /> {row.ruangan?.nama || 'Gudang Utama'}
      </span>
    )},
    { key: 'harga_perolehan', label: 'Harga Perolehan', render: (row) => (
      <span className="font-semibold text-slate-900">{formatCurrency(row.harga_perolehan)}</span>
    )},
    { key: 'kondisi', label: 'Kondisi', render: (row) => {
      const color = row.kondisi === 'baik' ? 'badge-green' : row.kondisi === 'rusak_ringan' ? 'badge-yellow' : 'badge-red';
      const label = row.kondisi === 'baik' ? 'Baik' : row.kondisi === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat';
      return <span className={`badge ${color} badge-dot`}>{label}</span>;
    }},
    { key: 'status', label: 'Status', render: (row) => {
      const color = row.status === 'tersedia' ? 'badge-green' : row.status === 'dipinjam' ? 'badge-yellow' : row.status === 'maintenance' ? 'badge-blue' : 'badge-red';
      return <span className={`badge ${color} capitalize`}>{row.status}</span>;
    }},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" size="sm" icon={<Calculator size={14} className="text-indigo-600" />} onClick={() => handleHitungPenyusutan(row)} title="Penyusutan" />
        <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => router.push(`/sinapra/aset/${row.id}/edit`)} title="Edit" />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingAset(row)} title="Hapus" />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Inventaris Aset & Sarana Kampus"
        description="Pencatatan barang inventaris, lokasi ruangan, kategori, & estimasi penyusutan nilai buku (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Layers size={16} />} onClick={handleOpenKategoriManager}>
              Kelola Kategori
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/aset/create')}>
              Tambah Aset Baru
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
              placeholder="Cari kode aset, nama barang, merk, atau nomor seri..."
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
        data={asetList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE ASET MODAL */}
      <Modal
        open={!!deletingAset}
        onClose={() => setDeletingAset(null)}
        title="Hapus Barang Aset?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingAset(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteAset}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus aset <strong>{deletingAset?.nama}</strong> ({deletingAset?.kode_aset})?
        </p>
      </Modal>

      {/* KALKULATOR PENYUSUTAN MODAL */}
      <Modal
        open={showPenyusutanModal}
        onClose={() => setShowPenyusutanModal(false)}
        title="Estimasi Penyusutan Nilai Buku Aset"
        footer={<Button variant="secondary" onClick={() => setShowPenyusutanModal(false)}>Tutup</Button>}
      >
        {isPenyusutanLoading ? (
          <div className="p-8 text-center text-slate-500">Kalkulasi nilai buku aset...</div>
        ) : penyusutanData ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Kode Aset:</span>
                <span className="font-mono font-bold text-slate-800">{penyusutanData.kode_aset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nama Barang:</span>
                <span className="font-bold text-slate-800">{penyusutanData.nama}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                <div className="text-xs text-blue-600 font-bold uppercase mb-1">Harga Perolehan Awal</div>
                <div className="text-lg font-extrabold text-blue-900">{formatCurrency(penyusutanData.harga_perolehan)}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Nilai Buku Saat Ini</div>
                <div className="text-lg font-extrabold text-emerald-900">{formatCurrency(penyusutanData.nilai_buku_saat_ini)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500">Data penyusutan tidak ditemukan.</div>
        )}
      </Modal>

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Inventaris Aset"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setKondisiFilter('');
                setStatusFilter('');
                setKategoriFilterObj(null);
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
          <AsyncSelect
            label="Kategori Aset"
            placeholder="Pilih kategori..."
            value={kategoriFilterObj}
            onChange={(sel: any) => setKategoriFilterObj(sel)}
            loadOptions={loadKategoriOptions}
          />

          <Select
            label="Kondisi Fisik"
            value={kondisiFilter}
            onChange={(val) => setKondisiFilter(val)}
            options={[
              { value: '', label: 'Semua Kondisi' },
              { value: 'baik', label: 'Baik' },
              { value: 'rusak_ringan', label: 'Rusak Ringan' },
              { value: 'rusak_berat', label: 'Rusak Berat' },
            ]}
          />

          <Select
            label="Status Ketersediaan"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'tersedia', label: 'Tersedia' },
              { value: 'dipinjam', label: 'Dipinjam' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'disetujui_diapkir', label: 'Diapkir' },
            ]}
          />
        </div>
      </Drawer>

      {/* ------------------------------------------------------------ */}
      {/* MODAL KELOLA KATEGORI ASET (FORM MODAL <= 5 INPUT + LIST) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showKategoriModal}
        onClose={() => setShowKategoriModal(false)}
        title="Manajemen Kategori Aset"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setShowKategoriModal(false)}>Tutup</Button>}
      >
        <div className="space-y-6">
          <form onSubmit={handleSaveKategori} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="font-bold text-slate-800 text-sm border-b pb-2">
              {editingKategori ? 'Edit Kategori Aset' : 'Tambah Kategori Aset Baru'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kode Kategori"
                required
                placeholder="cth: IT-PC"
                value={kategoriForm.kode}
                onChange={(e) => setKategoriForm({ ...kategoriForm, kode: e.target.value })}
              />

              <Input
                label="Nama Kategori"
                required
                placeholder="cth: Komputer & Server"
                value={kategoriForm.nama}
                onChange={(e) => setKategoriForm({ ...kategoriForm, nama: e.target.value })}
              />

              <Input
                label="Masa Manfaat (Tahun)"
                type="number"
                min={1}
                value={kategoriForm.masa_manfaat_tahun}
                onChange={(e) => setKategoriForm({ ...kategoriForm, masa_manfaat_tahun: parseInt(e.target.value) || 1 })}
              />

              <Input
                label="Tarif Penyusutan (% Per Tahun)"
                type="number"
                min={0}
                max={100}
                value={kategoriForm.tarif_penyusutan_persen}
                onChange={(e) => setKategoriForm({ ...kategoriForm, tarif_penyusutan_persen: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingKategori && (
                <Button variant="ghost" size="sm" type="button" onClick={handleOpenCreateKategori}>Batal Edit</Button>
              )}
              <Button variant="primary" size="sm" type="submit">
                {editingKategori ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </Button>
            </div>
          </form>

          {/* LIST KATEGORI */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 text-sm">Daftar Kategori Terdaftar:</div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {kategoriList.map((kat) => (
                <div key={kat.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono font-bold text-rose-600 mr-2">[{kat.kode}]</span>
                    <span className="font-bold text-slate-800">{kat.nama}</span>
                    <span className="text-xs text-slate-500 ml-2">({kat.masa_manfaat_tahun} Thn, {kat.tarif_penyusutan_persen}%)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEditKategori(kat)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingKategori(kat)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* DELETE KATEGORI MODAL */}
      <Modal
        open={!!deletingKategori}
        onClose={() => setDeletingKategori(null)}
        title="Hapus Kategori Aset?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingKategori(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteKategori}>Hapus</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Apakah Anda yakin ingin menghapus kategori <strong>{deletingKategori?.nama}</strong>?
        </p>
      </Modal>
    </div>
  );
}
