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
  Eye,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { AsetLabelPrintModal } from '@/components/sinapra/AsetLabelPrintModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  Aset,
  KategoriAset,
  KategoriAsetFormPayload,
  PenyusutanAsetResult,
  AsetLabelData,
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
  const [sortBy, setSortBy] = useState('nama');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modal Deleting Aset
  const [deletingAset, setDeletingAset] = useState<Aset | null>(null);
  const [isDeletingAset, setIsDeletingAset] = useState(false);

  // Modal Kalkulator Penyusutan
  const [showPenyusutanModal, setShowPenyusutanModal] = useState(false);
  const [penyusutanData, setPenyusutanData] = useState<PenyusutanAsetResult | null>(null);
  const [isPenyusutanLoading, setIsPenyusutanLoading] = useState(false);

  // Modal Cetak Label Barcode & QR Code
  const [printLabels, setPrintLabels] = useState<AsetLabelData[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  const handlePrintSingleLabel = async (item: Aset) => {
    setIsLoadingLabels(true);
    setIsPrintModalOpen(true);
    try {
      const res = await sinapraService.getAsetLabel(item.id);
      if (res?.data) {
        setPrintLabels([res.data]);
      } else {
        setPrintLabels([{
          id: item.id,
          kode_aset: item.kode_aset,
          nama: item.nama,
          merk: item.merk,
          kategori: item.kategori?.nama,
          lokasi_ruangan: item.ruangan?.nama,
          tanggal_perolehan: item.tanggal_perolehan,
          kondisi: item.kondisi,
          status: item.status,
        }]);
      }
    } catch {
      toast.error('Gagal mengambil data label barcode aset');
      setPrintLabels([{
        id: item.id,
        kode_aset: item.kode_aset,
        nama: item.nama,
        merk: item.merk,
        kategori: item.kategori?.nama,
        lokasi_ruangan: item.ruangan?.nama,
        tanggal_perolehan: item.tanggal_perolehan,
        kondisi: item.kondisi,
        status: item.status,
      }]);
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handlePrintBatchLabels = async () => {
    if (asetList.length === 0) {
      toast.error('Tidak ada data aset untuk dicetak.');
      return;
    }
    setIsLoadingLabels(true);
    setIsPrintModalOpen(true);
    try {
      const ids = asetList.map((a) => a.id);
      const res = await sinapraService.getBatchAsetLabels(ids);
      if (Array.isArray(res?.data) && res.data.length > 0) {
        setPrintLabels(res.data);
      } else {
        setPrintLabels(
          asetList.map((item) => ({
            id: item.id,
            kode_aset: item.kode_aset,
            nama: item.nama,
            merk: item.merk,
            kategori: item.kategori?.nama,
            lokasi_ruangan: item.ruangan?.nama,
            tanggal_perolehan: item.tanggal_perolehan,
            kondisi: item.kondisi,
            status: item.status,
          }))
        );
      }
    } catch {
      toast.error('Gagal mengambil data label batch aset');
      setPrintLabels(
        asetList.map((item) => ({
          id: item.id,
          kode_aset: item.kode_aset,
          nama: item.nama,
          merk: item.merk,
          kategori: item.kategori?.nama,
          lokasi_ruangan: item.ruangan?.nama,
          tanggal_perolehan: item.tanggal_perolehan,
          kondisi: item.kondisi,
          status: item.status,
        }))
      );
    } finally {
      setIsLoadingLabels(false);
    }
  };

  // ------------------------------------------------------------
  // KATEGORI ASET STATES (MODAL 5 INPUT)
  // ------------------------------------------------------------
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriAset[]>([]);
  const [isKategoriLoading, setIsKategoriLoading] = useState(false);
  const [editingKategori, setEditingKategori] = useState<KategoriAset | null>(null);
  const [deletingKategori, setDeletingKategori] = useState<KategoriAset | null>(null);
  const [isDeletingKategori, setIsDeletingKategori] = useState(false);
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
  }, [page, search, kondisiFilter, statusFilter, kategoriFilterObj, sortBy, sortDir]);

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
    setIsDeletingAset(true);
    try {
      await sinapraService.deleteAset(deletingAset.id);
      toast.success(`Aset ${deletingAset.nama} berhasil dihapus.`);
      fetchAset();
      setDeletingAset(null);
    } catch {
      toast.error('Gagal menghapus aset.');
    } finally {
      setIsDeletingAset(false);
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
    setIsDeletingKategori(true);
    try {
      await sinapraService.deleteKategori(deletingKategori.id);
      toast.success(`Kategori ${deletingKategori.nama} dihapus.`);
      fetchKategori();
      setDeletingKategori(null);
    } catch {
      toast.error('Gagal menghapus kategori aset.');
    } finally {
      setIsDeletingKategori(false);
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS (SIMPEG Standard: Max 12px, 2-Row Format)
  // ------------------------------------------------------------
  const columns: ColumnDef<Aset>[] = [
    {
      key: 'kode_aset',
      label: 'KODE & IDENTITAS',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            {row.kode_aset}
          </span>
          <span className="text-2xs text-slate-400 font-mono block">
            ID #{row.id}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA BARANG & SPESIFIKASI',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1">
            {row.merk ? `Merk: ${row.merk}` : 'Spesifikasi standar'} {row.nomor_seri ? `• SN: ${row.nomor_seri}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI ASET',
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 15%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
          }}
          className="text-2xs font-semibold"
        >
          {row.kategori?.nama || `Kategori #${row.kategori_id}`}
        </Badge>
      ),
    },
    {
      key: 'lokasi',
      label: 'LOKASI RUANGAN',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
            {row.ruangan?.nama || 'Gudang Utama'}
          </span>
          <span className="text-2xs text-slate-400 block">
            {row.ruangan?.gedung?.nama || 'Sentral Kampus'}
          </span>
        </div>
      ),
    },
    {
      key: 'harga_perolehan',
      label: 'HARGA PEROLEHAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
            {formatCurrency(row.harga_perolehan)}
          </span>
          <span className="text-2xs text-slate-400 block">
            {row.tanggal_perolehan ? formatDate(row.tanggal_perolehan) : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'kondisi',
      label: 'KONDISI',
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
          }}
          className="text-2xs capitalize"
        >
          {row.kondisi?.replace('_', ' ')}
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
                label: 'Lihat Detail Aset',
                icon: <Eye size={16} className="text-[var(--module-primary)]" />,
                onClick: () => router.push(`/sinapra/aset/${row.id}`),
              },
              {
                label: 'Cetak Label Barcode / QR',
                icon: <Printer size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handlePrintSingleLabel(row),
              },
              {
                label: 'Hitung Penyusutan',
                icon: <Calculator size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleHitungPenyusutan(row),
              },
              {
                label: 'Ubah Data Aset',
                icon: <Edit2 size={16} className="text-[var(--module-primary)]" />,
                onClick: () => router.push(`/sinapra/aset/${row.id}/edit`),
              },
              {
                label: 'Hapus Aset',
                icon: <Trash2 size={16} className="text-[var(--danger)]" />,
                variant: 'danger',
                onClick: () => setDeletingAset(row),
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
        title="Inventaris Aset & Sarana Kampus"
        description="Pencatatan barang inventaris, lokasi ruangan, kategori, & estimasi penyusutan nilai buku (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={handlePrintBatchLabels}
            >
              Cetak Label
            </Button>
            <Button variant="secondary" icon={<Layers size={16} />} onClick={handleOpenKategoriManager}>
              Kelola Kategori
            </Button>
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
            >
              Filter
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/aset/create')}>
              Tambah Aset Baru
            </Button>
          </div>
        }
      />

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={asetList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
      />

      {/* DELETE ASET CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingAset}
        onClose={() => setDeletingAset(null)}
        onConfirm={handleDeleteAset}
        title="Hapus Barang Aset?"
        message={`Apakah Anda yakin ingin menghapus aset ${deletingAset?.nama} (${deletingAset?.kode_aset})?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeletingAset}
      />

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
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 8%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                }}
                className="border p-4 rounded-xl text-center"
              >
                <div style={{ color: 'var(--module-primary)' }} className="text-xs font-bold uppercase mb-1">Harga Perolehan Awal</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(penyusutanData.harga_perolehan)}</div>
              </div>
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--module-primary) 30%, transparent)',
                }}
                className="border p-4 rounded-xl text-center"
              >
                <div style={{ color: 'var(--module-primary)' }} className="text-xs font-bold uppercase mb-1">Nilai Buku Saat Ini</div>
                <div style={{ color: 'var(--module-primary)' }} className="text-lg font-extrabold">{formatCurrency(penyusutanData.nilai_buku_saat_ini)}</div>
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
                setSearch('');
                setKondisiFilter('');
                setStatusFilter('');
                setKategoriFilterObj(null);
                setSortBy('nama');
                setSortDir('asc');
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
            placeholder="Cari kode aset, nama, merk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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

          <hr className="border-slate-200 dark:border-slate-800" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'nama', label: 'Nama Aset' },
                { value: 'kode_aset', label: 'Kode Aset' },
                { value: 'harga_perolehan', label: 'Harga Perolehan' },
                { value: 'created_at', label: 'Tanggal Input' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val: any) => setSortDir(val)}
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
            />
          </div>
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
                    <span className="font-mono font-bold text-[var(--module-primary)] mr-2">[{kat.kode}]</span>
                    <span className="font-bold text-slate-800">{kat.nama}</span>
                    <span className="text-xs text-slate-500 ml-2">({kat.masa_manfaat_tahun} Thn, {kat.tarif_penyusutan_persen}%)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => handleOpenEditKategori(kat)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 size={16} className="text-[var(--danger)]" />} onClick={() => setDeletingKategori(kat)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* DELETE KATEGORI CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingKategori}
        onClose={() => setDeletingKategori(null)}
        onConfirm={handleDeleteKategori}
        title="Hapus Kategori Aset?"
        message={`Apakah Anda yakin ingin menghapus kategori ${deletingKategori?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={isDeletingKategori}
      />

      {/* MODAL CETAK LABEL BARCODE & QR CODE */}
      <AsetLabelPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        labels={printLabels}
        isLoading={isLoadingLabels}
      />
    </div>
  );
}
