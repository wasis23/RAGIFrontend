'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Tags,
  Layers,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge, ModuleBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import {
  referensiService,
  tipeReferensiService,
  type MasterReferensiItem,
  type MasterTipeReferensi,
  type ReferensiCategoriesResponse,
} from '@/services/referensi.service';

interface MasterReferensiViewProps {
  initialModule?: string;
  initialTab?: 'data' | 'tipe';
  pageTitle?: string;
  pageDescription?: string;
}

const MODULE_OPTIONS = [
  { value: 'all', label: 'Semua Modul' },
  { value: 'global', label: 'Global (Semua Modul)' },
  { value: 'spmb', label: 'SPMB (Penerimaan Mahasiswa)' },
  { value: 'siakad', label: 'SIAKAD (Akademik)' },
  { value: 'simpeg', label: 'SIMPEG (Kepegawaian / SDM)' },
  { value: 'sikeu', label: 'SIKEU (Keuangan)' },
];

export function MasterReferensiView({
  initialModule = 'all',
  initialTab = 'data',
  pageTitle = 'Master Data Referensi',
  pageDescription = 'Pengelolaan data master opsi dan referensi standar sistem kampus (Agama, Status Sipil, Kewarganegaraan, dll).',
}: MasterReferensiViewProps) {
  // Navigation tab: 'data' (items) or 'tipe' (master tipe referensi)
  const [activeMainTab, setActiveMainTab] = useState<'data' | 'tipe'>(initialTab);

  // Common State
  const [selectedModule, setSelectedModule] = useState<string>(initialModule);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Data Referensi State
  const [data, setData] = useState<MasterReferensiItem[]>([]);
  const [categoriesData, setCategoriesData] = useState<ReferensiCategoriesResponse>({
    categories: [],
    modules: [],
  });
  const [selectedTipe, setSelectedTipe] = useState<string>('all');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Tab Master Tipe Referensi State
  const [tipeList, setTipeList] = useState<MasterTipeReferensi[]>([]);
  const [isLoadingTipe, setIsLoadingTipe] = useState(true);

  // Item Referensi Modal State (Create / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    tipe: '',
    modul: initialModule === 'all' ? 'global' : initialModule,
    kode: '',
    nama: '',
    urutan: 1,
    is_active: true,
  });

  // Tipe Referensi Modal State (Create / Edit)
  const [isTipeModalOpen, setIsTipeModalOpen] = useState(false);
  const [isEditingTipe, setIsEditingTipe] = useState(false);
  const [editingTipeId, setEditingTipeId] = useState<number | null>(null);
  const [isSavingTipe, setIsSavingTipe] = useState(false);
  const [tipeFormData, setTipeFormData] = useState({
    kode: '',
    nama: '',
    modul: initialModule === 'all' ? 'global' : initialModule,
    deskripsi: '',
    urutan: 1,
    is_active: true,
  });

  // Item Delete State
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MasterReferensiItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Tipe Delete State
  const [deleteTipeConfirmOpen, setDeleteTipeConfirmOpen] = useState(false);
  const [deletingTipe, setDeletingTipe] = useState<MasterTipeReferensi | null>(null);
  const [isDeletingTipe, setIsDeletingTipe] = useState(false);

  // ===================== FETCH DATA =====================

  const fetchCategories = async () => {
    try {
      const res = await referensiService.getCategories(
        selectedModule !== 'all' ? selectedModule : undefined
      );
      setCategoriesData(res);
    } catch {
      console.error('Failed to load referensi categories');
    }
  };

  const fetchTipeList = async () => {
    setIsLoadingTipe(true);
    try {
      const items = await tipeReferensiService.getAll({
        modul: selectedModule !== 'all' ? selectedModule : undefined,
        search: searchQuery || undefined,
      });
      setTipeList(items);
    } catch {
      toast.error('Gagal memuat daftar master tipe referensi');
    } finally {
      setIsLoadingTipe(false);
    }
  };

  const fetchItemsData = async () => {
    setIsLoadingData(true);
    try {
      const items = await referensiService.getAll({
        modul: selectedModule !== 'all' ? selectedModule : undefined,
        tipe: selectedTipe !== 'all' ? selectedTipe : undefined,
        search: searchQuery || undefined,
      });
      setData(items);
    } catch {
      toast.error('Gagal memuat data master referensi');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTipeList();
  }, [selectedModule]);

  useEffect(() => {
    if (activeMainTab === 'data') {
      fetchItemsData();
    } else {
      fetchTipeList();
    }
  }, [activeMainTab, selectedModule, selectedTipe, searchQuery]);

  // Options for filter select and item form select
  const tipeOptions = useMemo(() => {
    const list = [{ value: 'all', label: 'Semua Kategori Tipe' }];
    categoriesData.categories.forEach((c) => {
      const labelName = c.nama || c.tipe.replace(/_/g, ' ').toUpperCase();
      list.push({
        value: c.tipe,
        label: `${labelName} (${c.total_items})`,
      });
    });
    return list;
  }, [categoriesData]);

  const formTipeOptions = useMemo(() => {
    return tipeList
      .filter((t) => t.is_active)
      .map((t) => ({
        value: t.kode,
        label: `${t.nama} [${t.kode}] (${t.modul.toUpperCase()})`,
      }));
  }, [tipeList]);

  // ===================== ITEM HANDLERS =====================

  const handleOpenCreateItem = () => {
    setIsEditingItem(false);
    setEditingItemId(null);
    const defaultTipe =
      selectedTipe !== 'all'
        ? selectedTipe
        : formTipeOptions[0]?.value || '';
    const matchingTipe = tipeList.find((t) => t.kode === defaultTipe);

    setItemFormData({
      tipe: defaultTipe,
      modul: matchingTipe ? matchingTipe.modul : selectedModule !== 'all' ? selectedModule : 'global',
      kode: '',
      nama: '',
      urutan: data.length + 1,
      is_active: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MasterReferensiItem) => {
    setIsEditingItem(true);
    setEditingItemId(item.id);
    setItemFormData({
      tipe: item.tipe,
      modul: item.modul || 'global',
      kode: item.kode || '',
      nama: item.nama,
      urutan: item.urutan || 1,
      is_active: item.is_active,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.tipe.trim()) {
      toast.error('Kategori tipe referensi wajib dipilih!');
      return;
    }
    if (!itemFormData.nama.trim()) {
      toast.error('Label/Nama referensi wajib diisi!');
      return;
    }

    setIsSavingItem(true);
    try {
      if (isEditingItem && editingItemId) {
        await referensiService.update(editingItemId, {
          tipe: itemFormData.tipe.trim(),
          modul: itemFormData.modul,
          kode: itemFormData.kode.trim() || undefined,
          nama: itemFormData.nama.trim(),
          urutan: Number(itemFormData.urutan) || 1,
          is_active: itemFormData.is_active,
        });
        toast.success('Data referensi berhasil diperbarui');
      } else {
        await referensiService.create({
          tipe: itemFormData.tipe.trim(),
          modul: itemFormData.modul,
          kode: itemFormData.kode.trim() || undefined,
          nama: itemFormData.nama.trim(),
          urutan: Number(itemFormData.urutan) || 1,
          is_active: itemFormData.is_active,
        });
        toast.success('Data referensi baru berhasil ditambahkan');
      }
      setIsItemModalOpen(false);
      fetchItemsData();
      fetchCategories();
      fetchTipeList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data referensi');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleToggleStatusItem = async (item: MasterReferensiItem) => {
    try {
      await referensiService.toggleActive(item.id);
      toast.success(`Status opsi ${item.nama} berhasil diubah`);
      setData((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeletingItem(true);
    try {
      await referensiService.delete(deletingItem.id);
      toast.success(`Opsi "${deletingItem.nama}" berhasil dihapus`);
      setDeleteItemConfirmOpen(false);
      setDeletingItem(null);
      fetchItemsData();
      fetchCategories();
      fetchTipeList();
    } catch {
      toast.error('Gagal menghapus data referensi');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // ===================== TIPE HANDLERS =====================

  const handleOpenCreateTipe = () => {
    setIsEditingTipe(false);
    setEditingTipeId(null);
    setTipeFormData({
      kode: '',
      nama: '',
      modul: selectedModule !== 'all' ? selectedModule : 'global',
      deskripsi: '',
      urutan: tipeList.length + 1,
      is_active: true,
    });
    setIsTipeModalOpen(true);
  };

  const handleOpenEditTipe = (tipe: MasterTipeReferensi) => {
    setIsEditingTipe(true);
    setEditingTipeId(tipe.id);
    setTipeFormData({
      kode: tipe.kode,
      nama: tipe.nama,
      modul: tipe.modul || 'global',
      deskripsi: tipe.deskripsi || '',
      urutan: tipe.urutan || 1,
      is_active: tipe.is_active,
    });
    setIsTipeModalOpen(true);
  };

  const handleSaveTipe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = tipeFormData.kode.toLowerCase().trim().replace(/\s+/g, '_');
    if (!cleanKode) {
      toast.error('Kode unik tipe referensi wajib diisi!');
      return;
    }
    if (!tipeFormData.nama.trim()) {
      toast.error('Nama tipe referensi wajib diisi!');
      return;
    }

    setIsSavingTipe(true);
    try {
      if (isEditingTipe && editingTipeId) {
        await tipeReferensiService.update(editingTipeId, {
          kode: cleanKode,
          nama: tipeFormData.nama.trim(),
          modul: tipeFormData.modul,
          deskripsi: tipeFormData.deskripsi.trim() || undefined,
          urutan: Number(tipeFormData.urutan) || 1,
          is_active: tipeFormData.is_active,
        });
        toast.success('Master Tipe Referensi berhasil diperbarui');
      } else {
        await tipeReferensiService.create({
          kode: cleanKode,
          nama: tipeFormData.nama.trim(),
          modul: tipeFormData.modul,
          deskripsi: tipeFormData.deskripsi.trim() || undefined,
          urutan: Number(tipeFormData.urutan) || 1,
          is_active: tipeFormData.is_active,
        });
        toast.success('Master Tipe Referensi baru berhasil ditambahkan');
      }
      setIsTipeModalOpen(false);
      fetchTipeList();
      fetchCategories();
      if (activeMainTab === 'data') fetchItemsData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan master tipe referensi');
    } finally {
      setIsSavingTipe(false);
    }
  };

  const handleToggleStatusTipe = async (tipe: MasterTipeReferensi) => {
    try {
      await tipeReferensiService.toggleActive(tipe.id);
      toast.success(`Status tipe ${tipe.nama} berhasil diubah`);
      setTipeList((prev) =>
        prev.map((t) => (t.id === tipe.id ? { ...t, is_active: !t.is_active } : t))
      );
      fetchCategories();
    } catch {
      toast.error('Gagal mengubah status tipe');
    }
  };

  const handleConfirmDeleteTipe = async () => {
    if (!deletingTipe) return;
    setIsDeletingTipe(true);
    try {
      await tipeReferensiService.delete(deletingTipe.id);
      toast.success(`Tipe Referensi "${deletingTipe.nama}" berhasil dihapus`);
      setDeleteTipeConfirmOpen(false);
      setDeletingTipe(null);
      fetchTipeList();
      fetchCategories();
      fetchItemsData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus tipe referensi');
    } finally {
      setIsDeletingTipe(false);
    }
  };

  // Helper Badge Modul
  const renderModulBadge = (modul: string) => {
    const modLower = modul?.toLowerCase();
    if (modLower === 'global') {
      return <Badge variant="purple">GLOBAL</Badge>;
    }
    return <ModuleBadge module={modLower || 'sso'} />;
  };

  // ===================== DATA TABLES COLUMNS =====================

  // Columns for Data Items
  const itemColumns: ColumnDef<MasterReferensiItem>[] = [
    {
      key: 'urutan',
      label: 'URUTAN',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
          #{row.urutan}
        </span>
      ),
    },
    {
      key: 'tipe',
      label: 'KATEGORI TIPE',
      align: 'left',
      render: (row) => {
        const cat = categoriesData.categories.find((c) => c.tipe === row.tipe);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              <span className="font-semibold text-xs text-primary-700">
                {cat?.nama || row.tipe.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-2xs text-slate-400 ml-4">{row.tipe}</span>
          </div>
        );
      },
    },
    {
      key: 'modul',
      label: 'CAKUPAN MODUL',
      align: 'left',
      render: (row) => renderModulBadge(row.modul),
    },
    {
      key: 'kode',
      label: 'KODE / KEY',
      align: 'left',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
          {row.kode || '-'}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'LABEL TAMPILAN',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm">{row.nama}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleStatusItem(row)}
          className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
          }`}
          title="Klik untuk mengubah status aktif"
        >
          {row.is_active ? (
            <>
              <CheckCircle2 size={12} /> Aktif
            </>
          ) : (
            <>
              <XCircle size={12} /> Non-aktif
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Edit2 size={14} />}
            onClick={() => handleOpenEditItem(row)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-primary-600"
            title="Edit Referensi"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 size={14} />}
            onClick={() => {
              setDeletingItem(row);
              setDeleteItemConfirmOpen(true);
            }}
            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
            title="Hapus Referensi"
          />
        </div>
      ),
    },
  ];

  // Columns for Master Tipe Referensi
  const tipeColumns: ColumnDef<MasterTipeReferensi>[] = [
    {
      key: 'urutan',
      label: 'URUTAN',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
          #{row.urutan}
        </span>
      ),
    },
    {
      key: 'kode',
      label: 'KODE / SLUG',
      align: 'left',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA TIPE REFERENSI',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm">{row.nama}</span>
          {row.deskripsi && (
            <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>
          )}
        </div>
      ),
    },
    {
      key: 'modul',
      label: 'CAKUPAN MODUL',
      align: 'left',
      render: (row) => renderModulBadge(row.modul),
    },
    {
      key: 'items_count',
      label: 'TOTAL ITEM',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          {row.items_count ?? 0} opsi
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleStatusTipe(row)}
          className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
          }`}
          title="Klik untuk mengubah status aktif"
        >
          {row.is_active ? (
            <>
              <CheckCircle2 size={12} /> Aktif
            </>
          ) : (
            <>
              <XCircle size={12} /> Non-aktif
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Edit2 size={14} />}
            onClick={() => handleOpenEditTipe(row)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-primary-600"
            title="Edit Tipe Referensi"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 size={14} />}
            onClick={() => {
              setDeletingTipe(row);
              setDeleteTipeConfirmOpen(true);
            }}
            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
            title="Hapus Tipe Referensi"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Header */}
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw size={15} />}
              onClick={() => {
                fetchCategories();
                if (activeMainTab === 'data') fetchItemsData();
                else fetchTipeList();
              }}
              title="Muat ulang data"
            >
              Refresh
            </Button>
            {activeMainTab === 'data' ? (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateItem}
              >
                Tambah Opsi Referensi
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreateTipe}
              >
                Tambah Tipe Baru
              </Button>
            )}
          </div>
        }
      />

      {/* Main Switcher: Data Items vs Master Tipe Referensi */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab('data')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex-1 sm:flex-none ${
              activeMainTab === 'data'
                ? 'bg-white text-primary-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={15} />
            Data Item Referensi ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('tipe')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex-1 sm:flex-none ${
              activeMainTab === 'tipe'
                ? 'bg-white text-primary-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tags size={15} />
            Master Tipe Referensi ({tipeList.length})
          </button>
        </div>

        {activeMainTab === 'data' && (
          <Button
            size="sm"
            variant="ghost"
            icon={<SlidersHorizontal size={14} />}
            onClick={() => setActiveMainTab('tipe')}
            className="text-xs text-primary-700 hidden sm:flex items-center gap-1"
          >
            Kelola Master Tipe
          </Button>
        )}
      </div>

      {/* Module Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {MODULE_OPTIONS.map((opt) => {
          const isSelected = selectedModule === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedModule(opt.value)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeMainTab === 'data' && (
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                Kategori Tipe Referensi
              </label>
              <Select
                options={tipeOptions}
                value={selectedTipe}
                onChange={(e) => setSelectedTipe(e.target.value)}
              />
            </div>
          )}
          <div className={activeMainTab === 'data' ? 'md:col-span-2' : 'md:col-span-3'}>
            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
              Pencarian Cepat
            </label>
            <Input
              prefixIcon={<Search size={15} className="text-slate-400" />}
              placeholder={
                activeMainTab === 'data'
                  ? 'Cari berdasarkan label, kode, atau tipe...'
                  : 'Cari berdasarkan nama tipe, kode slug, atau deskripsi...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content View Based on Active Tab */}
      {activeMainTab === 'data' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <DataTable
            columns={itemColumns}
            data={data}
            isLoading={isLoadingData}
            emptyMessage="Tidak ada data item referensi yang cocok dengan filter."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <DataTable
            columns={tipeColumns}
            data={tipeList}
            isLoading={isLoadingTipe}
            emptyMessage="Tidak ada data master tipe referensi yang cocok dengan filter."
          />
        </div>
      )}

      {/* ===================== MODAL ITEM REFERENSI ===================== */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => !isSavingItem && setIsItemModalOpen(false)}
        title={isEditingItem ? 'Edit Opsi Referensi' : 'Tambah Opsi Referensi Baru'}
        size="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kategori Tipe <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    handleOpenCreateTipe();
                  }}
                  className="text-2xs text-primary-600 hover:underline font-bold"
                >
                  + Tipe Baru
                </button>
              </div>
              <Select
                options={formTipeOptions}
                value={itemFormData.tipe}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  const matching = tipeList.find((t) => t.kode === selectedVal);
                  setItemFormData({
                    ...itemFormData,
                    tipe: selectedVal,
                    modul: matching ? matching.modul : itemFormData.modul,
                  });
                }}
              />
              <p className="text-2xs text-slate-400 mt-1">
                Dipilih dari Master Tipe Referensi aktif.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cakupan Modul <span className="text-red-500">*</span>
              </label>
              <Select
                options={[
                  { value: 'global', label: 'Global (Semua Modul)' },
                  { value: 'spmb', label: 'SPMB' },
                  { value: 'siakad', label: 'SIAKAD' },
                  { value: 'simpeg', label: 'SIMPEG' },
                  { value: 'sikeu', label: 'SIKEU' },
                ]}
                value={itemFormData.modul}
                onChange={(e) => setItemFormData({ ...itemFormData, modul: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode / Key <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <Input
                placeholder="misal: ISLAM, WNI, SMA"
                value={itemFormData.kode}
                onChange={(e) => setItemFormData({ ...itemFormData, kode: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Urutan (Sort)
              </label>
              <Input
                type="number"
                min="0"
                value={String(itemFormData.urutan)}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, urutan: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Label / Nama Tampilan <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="misal: Islam, Belum Kawin, Warga Negara Indonesia"
              value={itemFormData.nama}
              onChange={(e) => setItemFormData({ ...itemFormData, nama: e.target.value })}
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={itemFormData.is_active}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, is_active: e.target.checked })
                }
                className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              Aktifkan opsi ini di formulir
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemModalOpen(false)}
                disabled={isSavingItem}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" loading={isSavingItem}>
                {isEditingItem ? 'Simpan Perubahan' : 'Tambah Referensi'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL MASTER TIPE REFERENSI ===================== */}
      <Modal
        isOpen={isTipeModalOpen}
        onClose={() => !isSavingTipe && setIsTipeModalOpen(false)}
        title={isEditingTipe ? 'Edit Master Tipe Referensi' : 'Tambah Master Tipe Referensi Baru'}
        size="md"
      >
        <form onSubmit={handleSaveTipe} className="space-y-4">
          <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100 text-xs text-primary-900 flex items-start gap-2">
            <Info size={16} className="text-primary-600 shrink-0 mt-0.5" />
            <p>
              Tipe referensi mendefinisikan kelompok data dropdown atau opsi pilihan yang
              digunakan bersama oleh modul kampus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Unik / Slug <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="misal: kewarganegaraan"
                value={tipeFormData.kode}
                onChange={(e) =>
                  setTipeFormData({
                    ...tipeFormData,
                    kode: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
              />
              <p className="text-2xs text-slate-400 mt-1 font-mono">
                Format snake_case huruf kecil.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cakupan Modul <span className="text-red-500">*</span>
              </label>
              <Select
                options={[
                  { value: 'global', label: 'Global (Semua Modul)' },
                  { value: 'spmb', label: 'SPMB' },
                  { value: 'siakad', label: 'SIAKAD' },
                  { value: 'simpeg', label: 'SIMPEG' },
                  { value: 'sikeu', label: 'SIKEU' },
                ]}
                value={tipeFormData.modul}
                onChange={(e) => setTipeFormData({ ...tipeFormData, modul: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Tipe Referensi <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="misal: Kewarganegaraan, Pekerjaan Orang Tua"
              value={tipeFormData.nama}
              onChange={(e) => setTipeFormData({ ...tipeFormData, nama: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Fungsi / Catatan
            </label>
            <Input
              placeholder="misal: Standar kewarganegaraan civitas akademika (WNI, WNA)"
              value={tipeFormData.deskripsi}
              onChange={(e) => setTipeFormData({ ...tipeFormData, deskripsi: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Urutan Tampilan
              </label>
              <Input
                type="number"
                min="0"
                value={String(tipeFormData.urutan)}
                onChange={(e) =>
                  setTipeFormData({ ...tipeFormData, urutan: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={tipeFormData.is_active}
                  onChange={(e) =>
                    setTipeFormData({ ...tipeFormData, is_active: e.target.checked })
                  }
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                Aktifkan tipe ini
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTipeModalOpen(false)}
              disabled={isSavingTipe}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isSavingTipe}>
              {isEditingTipe ? 'Simpan Perubahan' : 'Buat Tipe Referensi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== CONFIRM DELETE ITEM ===================== */}
      <ConfirmDialog
        isOpen={deleteItemConfirmOpen}
        title="Hapus Data Referensi"
        message={`Apakah Anda yakin ingin menghapus opsi "${deletingItem?.nama}" (Kategori: ${deletingItem?.tipe})? Tindakan ini dapat memengaruhi data yang sudah memilih opsi ini.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingItem}
        onConfirm={handleConfirmDeleteItem}
        onClose={() => {
          setDeleteItemConfirmOpen(false);
          setDeletingItem(null);
        }}
      />

      {/* ===================== CONFIRM DELETE TIPE ===================== */}
      <ConfirmDialog
        isOpen={deleteTipeConfirmOpen}
        title="Hapus Master Tipe Referensi"
        message={`Apakah Anda yakin ingin menghapus tipe referensi "${deletingTipe?.nama}" (${deletingTipe?.kode})? ${
          (deletingTipe?.items_count || 0) > 0
            ? `PERHATIAN: Tipe ini memiliki ${deletingTipe?.items_count} data opsi di dalamnya!`
            : ''
        }`}
        confirmText="Ya, Hapus Tipe"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingTipe}
        onConfirm={handleConfirmDeleteTipe}
        onClose={() => {
          setDeleteTipeConfirmOpen(false);
          setDeletingTipe(null);
        }}
      />
    </div>
  );
}
