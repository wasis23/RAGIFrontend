'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Tag,
  Tags,
  Layers,
  Filter,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge, ModuleBadge, StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import {
  referensiService,
  tipeReferensiService,
  type MasterReferensiItem,
  type MasterTipeReferensi,
  type ReferensiCategoriesResponse,
} from '@/services/referensi.service';
import { moduleService, type AppModule } from '@/services/module.service';
import type { PaginationMeta } from '@/types/api.types';

interface MasterReferensiViewProps {
  initialModule?: string;
  initialTab?: 'data' | 'tipe';
  pageTitle?: string;
  pageDescription?: string;
}

// ============================================================================
// Skema Validasi Zod (di luar komponen — tidak dibuat ulang tiap render)
// ============================================================================

const itemFormSchema = z.object({
  tipe: z.string().min(1, 'Kategori tipe wajib dipilih'),
  modul: z.string().min(1, 'Cakupan modul wajib dipilih'),
  kode: z.string().max(50, 'Kode maksimal 50 karakter').optional(),
  nama: z
    .string()
    .trim()
    .min(1, 'Label/nama tampilan wajib diisi')
    .max(255, 'Label maksimal 255 karakter'),
  urutan: z.coerce.number().min(0, 'Nomor urutan minimal 0'),
  is_active: z.boolean(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

const tipeFormSchema = z.object({
  kode: z
    .string()
    .trim()
    .min(1, 'Kode unik wajib diisi')
    .max(50, 'Kode maksimal 50 karakter')
    .regex(/^[a-z0-9_]+$/, 'Kode hanya boleh huruf kecil, angka, dan garis bawah (_)'),
  nama: z
    .string()
    .trim()
    .min(1, 'Nama tipe wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  modul: z.string().min(1, 'Cakupan modul wajib dipilih'),
  deskripsi: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  urutan: z.coerce.number().min(0, 'Nomor urutan minimal 0'),
  is_active: z.boolean(),
});

type TipeFormValues = z.infer<typeof tipeFormSchema>;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const DIRECTION_OPTIONS = [
  { value: 'asc', label: 'A - Z (Naik)' },
  { value: 'desc', label: 'Z - A (Turun)' },
];

const ITEM_SORT_OPTIONS = [
  { value: '', label: 'Default Sistem' },
  { value: 'nama', label: 'Label / Nama' },
  { value: 'kode', label: 'Kode' },
  { value: 'urutan', label: 'Urutan' },
  { value: 'modul', label: 'Modul' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const TIPE_SORT_OPTIONS = [
  { value: '', label: 'Default Sistem' },
  { value: 'nama', label: 'Nama Tipe' },
  { value: 'kode', label: 'Kode / Slug' },
  { value: 'urutan', label: 'Urutan' },
  { value: 'modul', label: 'Modul' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const DEFAULT_FILTERS = {
  search: '',
  tipe: 'all',
  status: '',
  orderBy: '',
  orderDir: 'asc',
};

export function MasterReferensiView({
  initialModule = 'all',
  initialTab = 'data',
  pageTitle = 'Master Data Referensi',
  pageDescription = 'Pengelolaan data master opsi dan referensi standar sistem kampus (Agama, Status Sipil, Kewarganegaraan, dll).',
}: MasterReferensiViewProps) {
  // Mode tampilan ditentukan oleh tab yang aktif (dapat diubah melalui panel filter)
  const [activeMainTab, setActiveMainTab] = useState<'data' | 'tipe'>(initialTab);

  // Dynamic modules from API
  const [appModules, setAppModules] = useState<AppModule[]>([]);

  useEffect(() => {
    moduleService
      .getAllModules()
      .then((data) => {
        if (Array.isArray(data)) {
          setAppModules(data);
        }
      })
      .catch(() => {});
  }, []);

  const moduleOptions = useMemo(() => [
    { value: 'global', label: 'Global (Semua Modul)' },
    ...appModules.map((m) => ({
      value: (m.code || m.name).toLowerCase(),
      label: m.name ? `${m.name} (${(m.code || '').toUpperCase()})` : m.code,
    })),
  ], [appModules]);

  const moduleTabs = useMemo(() => [
    { value: 'all', label: 'Semua Modul' },
    ...moduleOptions,
  ], [moduleOptions]);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);

  // Filter State (draft di Drawer vs terapan ke API)
  const defaultFilters = useMemo(
    () => ({
      tab: initialTab,
      search: '',
      tipe: 'all',
      modul: initialModule,
      status: '',
      orderBy: '',
      orderDir: 'asc',
    }),
    [initialTab, initialModule]
  );
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [showFilter, setShowFilter] = useState(false);

  // Tab Data Referensi State
  const [data, setData] = useState<MasterReferensiItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [categoriesData, setCategoriesData] = useState<ReferensiCategoriesResponse>({
    categories: [],
    modules: [],
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Tab Master Tipe Referensi State
  const [tipeList, setTipeList] = useState<MasterTipeReferensi[]>([]);
  const [metaTipe, setMetaTipe] = useState<PaginationMeta | undefined>(undefined);
  const [isLoadingTipe, setIsLoadingTipe] = useState(true);

  // Item Referensi Modal State (Create / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterReferensiItem | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Tipe Referensi Modal State (Create / Edit)
  const [isTipeModalOpen, setIsTipeModalOpen] = useState(false);
  const [editingTipe, setEditingTipe] = useState<MasterTipeReferensi | null>(null);
  const [isSavingTipe, setIsSavingTipe] = useState(false);

  // Item Delete State
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MasterReferensiItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Tipe Delete State
  const [deleteTipeConfirmOpen, setDeleteTipeConfirmOpen] = useState(false);
  const [deletingTipe, setDeletingTipe] = useState<MasterTipeReferensi | null>(null);
  const [isDeletingTipe, setIsDeletingTipe] = useState(false);

  // Modul aktif yang sedang diterapkan
  const currentAppliedModul = initialModule !== 'all' ? initialModule : appliedFilters.modul;

  // React Hook Form + Zod (z.input untuk nilai form, z.output untuk submit terkoersi)
  const itemForm = useForm<z.input<typeof itemFormSchema>, unknown, ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      tipe: '',
      modul: initialModule === 'all' ? 'global' : initialModule,
      kode: '',
      nama: '',
      urutan: 1,
      is_active: true,
    },
  });

  const tipeForm = useForm<z.input<typeof tipeFormSchema>, unknown, TipeFormValues>({
    resolver: zodResolver(tipeFormSchema),
    defaultValues: {
      kode: '',
      nama: '',
      modul: initialModule === 'all' ? 'global' : initialModule,
      deskripsi: '',
      urutan: 1,
      is_active: true,
    },
  });

  // ===================== FETCH DATA =====================

  const fetchCategories = useCallback(async () => {
    try {
      const res = await referensiService.getCategories(
        currentAppliedModul !== 'all' ? currentAppliedModul : undefined
      );
      setCategoriesData(res);
    } catch {
      console.error('Failed to load referensi categories');
    }
  }, [currentAppliedModul]);

  const fetchTipeList = useCallback(async () => {
    setIsLoadingTipe(true);
    try {
      const params: Record<string, string | number> = { page, per_page: limit };
      if (currentAppliedModul && currentAppliedModul !== 'all') params.modul = currentAppliedModul;
      if (appliedFilters.search !== '') params.search = appliedFilters.search;
      if (appliedFilters.status !== '') params.is_active = appliedFilters.status;
      if (appliedFilters.orderBy !== '') {
        params.sort_by = appliedFilters.orderBy;
        params.sort_order = appliedFilters.orderDir;
      }
      const res = await tipeReferensiService.getPaginated(params);
      setTipeList(res.data);
      setMetaTipe(res.meta);
    } catch {
      toast.error('Gagal memuat daftar master tipe referensi');
    } finally {
      setIsLoadingTipe(false);
    }
  }, [currentAppliedModul, appliedFilters, page, limit]);

  const fetchItemsData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const params: Record<string, string | number> = { page, per_page: limit };
      if (currentAppliedModul && currentAppliedModul !== 'all') params.modul = currentAppliedModul;
      if (appliedFilters.tipe !== 'all') params.tipe = appliedFilters.tipe;
      if (appliedFilters.search !== '') params.search = appliedFilters.search;
      if (appliedFilters.status !== '') params.is_active = appliedFilters.status;
      if (appliedFilters.orderBy !== '') {
        params.sort_by = appliedFilters.orderBy;
        params.sort_order = appliedFilters.orderDir;
      }
      const res = await referensiService.getPaginated(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data master referensi');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentAppliedModul, appliedFilters, page, limit]);

  useEffect(() => {
    setActiveMainTab(initialTab);
    setDraftFilters((prev) => ({ ...prev, tab: initialTab }));
    setAppliedFilters((prev) => ({ ...prev, tab: initialTab }));
  }, [initialTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeMainTab === 'data') {
      fetchItemsData();
    } else {
      fetchTipeList();
    }
  }, [activeMainTab, fetchItemsData, fetchTipeList]);

  // Initial fetch untuk memastikan counter kedua jenis data terisi akurat di panel filter
  useEffect(() => {
    if (initialTab === 'data') {
      fetchTipeList();
    } else {
      fetchItemsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opsi server-side untuk AsyncSelect kategori tipe di form item
  const loadTipeOptions = useCallback(
    async (inputValue: string) => {
      try {
        const list = await tipeReferensiService.getAll({
          modul: currentAppliedModul !== 'all' ? currentAppliedModul : undefined,
          search: inputValue || undefined,
        });
        return list
          .filter((t) => t.is_active)
          .map((t) => ({
            value: t.kode,
            label: `${t.nama} [${t.kode}] (${t.modul.toUpperCase()})`,
            modul: t.modul,
          }));
      } catch {
        return [];
      }
    },
    [currentAppliedModul]
  );

  // Options for filter select
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

  // ===================== FILTER HANDLERS =====================

  const handleApplyFilter = () => {
    setAppliedFilters({ ...draftFilters });
    setActiveMainTab(draftFilters.tab);
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setDraftFilters({ ...defaultFilters });
    setAppliedFilters({ ...defaultFilters });
    setActiveMainTab(defaultFilters.tab);
    setPage(1);
    setShowFilter(false);
  };

  // ===================== ITEM HANDLERS =====================

  const handleOpenCreateItem = () => {
    setEditingItem(null);
    const targetModul =
      initialModule !== 'all'
        ? initialModule
        : appliedFilters.modul !== 'all'
        ? appliedFilters.modul
        : 'global';
    itemForm.reset({
      tipe: appliedFilters.tipe !== 'all' ? appliedFilters.tipe : '',
      modul: targetModul,
      kode: '',
      nama: '',
      urutan: (meta?.total ?? data.length) + 1,
      is_active: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MasterReferensiItem) => {
    setEditingItem(item);
    itemForm.reset({
      tipe: item.tipe,
      modul: item.modul || 'global',
      kode: item.kode || '',
      nama: item.nama,
      urutan: item.urutan ?? 1,
      // API dapat mengembalikan 1/0 (tanpa cast boolean) — normalisasi ke boolean
      is_active: Boolean(item.is_active),
    });
    setIsItemModalOpen(true);
  };

  const onSaveItem = async (values: ItemFormValues) => {
    setIsSavingItem(true);
    try {
      const payload = {
        tipe: values.tipe.trim(),
        modul: values.modul,
        kode: values.kode?.trim() || undefined,
        nama: values.nama.trim(),
        urutan: Number(values.urutan) || 1,
        is_active: values.is_active,
      };
      if (editingItem) {
        await referensiService.update(editingItem.id, payload);
        toast.success('Data referensi berhasil diperbarui');
      } else {
        await referensiService.create(payload);
        toast.success('Data referensi baru berhasil ditambahkan');
      }
      setIsItemModalOpen(false);
      fetchItemsData();
      fetchCategories();
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
    } catch {
      toast.error('Gagal menghapus data referensi');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // ===================== TIPE HANDLERS =====================

  const handleOpenCreateTipe = () => {
    setEditingTipe(null);
    const targetModul =
      initialModule !== 'all'
        ? initialModule
        : appliedFilters.modul !== 'all'
        ? appliedFilters.modul
        : 'global';
    tipeForm.reset({
      kode: '',
      nama: '',
      modul: targetModul,
      deskripsi: '',
      urutan: (metaTipe?.total ?? tipeList.length) + 1,
      is_active: true,
    });
    setIsTipeModalOpen(true);
  };

  const handleOpenEditTipe = (tipe: MasterTipeReferensi) => {
    setEditingTipe(tipe);
    tipeForm.reset({
      kode: tipe.kode,
      nama: tipe.nama,
      modul: tipe.modul || 'global',
      deskripsi: tipe.deskripsi || '',
      urutan: tipe.urutan ?? 1,
      // Normalisasi defensif ke boolean
      is_active: Boolean(tipe.is_active),
    });
    setIsTipeModalOpen(true);
  };

  const onSaveTipe = async (values: TipeFormValues) => {
    setIsSavingTipe(true);
    try {
      const payload = {
        kode: values.kode,
        nama: values.nama.trim(),
        modul: values.modul,
        deskripsi: values.deskripsi?.trim() || undefined,
        urutan: Number(values.urutan) || 1,
        is_active: values.is_active,
      };
      if (editingTipe) {
        await tipeReferensiService.update(editingTipe.id, payload);
        toast.success('Master Tipe Referensi berhasil diperbarui');
      } else {
        await tipeReferensiService.create(payload);
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
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-slate-400" />
              <span className="font-semibold text-xs text-slate-900">
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
          <span className="font-bold text-slate-900 text-xs">{row.nama}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatusItem(row)}
          title="Klik untuk mengubah status aktif"
        >
          <StatusBadge active={row.is_active} />
        </Button>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Referensi',
                icon: <Edit2 size={16} />,
                onClick: () => handleOpenEditItem(row),
              },
              {
                label: row.is_active ? 'Nonaktifkan' : 'Aktifkan',
                icon: <Power size={16} />,
                onClick: () => handleToggleStatusItem(row),
              },
              {
                label: 'Hapus Referensi',
                icon: <Trash2 size={16} />,
                variant: 'danger',
                onClick: () => {
                  setDeletingItem(row);
                  setDeleteItemConfirmOpen(true);
                },
              },
            ]}
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
        <span className="font-mono font-bold text-xs text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg">
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
          <span className="font-bold text-slate-900 text-xs">{row.nama}</span>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatusTipe(row)}
          title="Klik untuk mengubah status aktif"
        >
          <StatusBadge active={row.is_active} />
        </Button>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Tipe',
                icon: <Edit2 size={16} />,
                onClick: () => handleOpenEditTipe(row),
              },
              {
                label: row.is_active ? 'Nonaktifkan' : 'Aktifkan',
                icon: <Power size={16} />,
                onClick: () => handleToggleStatusTipe(row),
              },
              {
                label: 'Hapus Tipe',
                icon: <Trash2 size={16} />,
                variant: 'danger',
                onClick: () => {
                  setDeletingTipe(row);
                  setDeleteTipeConfirmOpen(true);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Header */}
      <PageHeader
        title={activeMainTab === 'data' ? pageTitle : 'Master Tipe Referensi'}
        description={
          activeMainTab === 'data'
            ? pageDescription
            : 'Pengelolaan kelompok kategori referensi sistem kampus lintas modul.'
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
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

      {/* Content View Based on Active Tab */}
      {activeMainTab === 'data' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <DataTable
            columns={itemColumns}
            data={data}
            isLoading={isLoadingData}
            meta={meta}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            emptyMessage="Tidak ada data item referensi yang cocok dengan filter."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <DataTable
            columns={tipeColumns}
            data={tipeList}
            isLoading={isLoadingTipe}
            meta={metaTipe}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            emptyMessage="Tidak ada data master tipe referensi yang cocok dengan filter."
          />
        </div>
      )}

      {/* ===================== FILTER DRAWER ===================== */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Pengaturan Data"
        width="440px"
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
          {/* Tampilan Master Data (Data Item Referensi vs Master Tipe Referensi) */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700">Tampilan Master Data</label>
            <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setDraftFilters({ ...draftFilters, tab: 'data' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  draftFilters.tab === 'data'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={16} />
                <span>Item Referensi ({meta?.total ?? data.length})</span>
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setDraftFilters({ ...draftFilters, tab: 'tipe' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  draftFilters.tab === 'tipe'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tags size={16} />
                <span>Master Tipe ({metaTipe?.total ?? tipeList.length})</span>
              </Button>
            </div>
          </div>

          {/* Cakupan Modul Pills */}
          {initialModule === 'all' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700">Cakupan Modul</label>
              <div className="flex flex-wrap gap-2">
                {moduleTabs.map((opt) => {
                  const isSelected = draftFilters.modul === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      variant="ghost"
                      type="button"
                      onClick={() => setDraftFilters({ ...draftFilters, modul: opt.value })}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? 'text-white shadow-xs font-bold'
                          : 'bg-white text-slate-600 hover:border-slate-300 border border-slate-200/70'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--module-primary)' } : undefined}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pencarian Keyword */}
          <Input
            label="Pencarian"
            placeholder={
              draftFilters.tab === 'data'
                ? 'Cari label, kode, atau tipe...'
                : 'Cari nama tipe, kode slug, atau deskripsi...'
            }
            value={draftFilters.search}
            onChange={(e) => setDraftFilters({ ...draftFilters, search: e.target.value })}
          />

          {/* Kategori Tipe (hanya jika mode data) */}
          {draftFilters.tab === 'data' && (
            <Select
              label="Kategori Tipe"
              value={draftFilters.tipe}
              onChange={(val: string) => setDraftFilters({ ...draftFilters, tipe: val })}
              options={tipeOptions}
            />
          )}

          {/* Status */}
          <Select
            label="Status"
            value={draftFilters.status}
            onChange={(val: string) => setDraftFilters({ ...draftFilters, status: val })}
            options={STATUS_FILTER_OPTIONS}
          />

          <hr className="border-t border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={draftFilters.orderBy}
              onChange={(val: string) => setDraftFilters({ ...draftFilters, orderBy: val })}
              options={activeMainTab === 'data' ? ITEM_SORT_OPTIONS : TIPE_SORT_OPTIONS}
            />
            <Select
              label="Arah"
              value={draftFilters.orderDir}
              onChange={(val: string) => setDraftFilters({ ...draftFilters, orderDir: val })}
              options={DIRECTION_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      {/* ===================== MODAL ITEM REFERENSI ===================== */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => !isSavingItem && setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Opsi Referensi' : 'Tambah Opsi Referensi Baru'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsItemModalOpen(false)}
              disabled={isSavingItem}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={itemForm.handleSubmit(onSaveItem)}
              loading={isSavingItem}
              disabled={isSavingItem}
            >
              {editingItem ? 'Simpan Perubahan' : 'Tambah Referensi'}
            </Button>
          </>
        }
      >
        <form onSubmit={itemForm.handleSubmit(onSaveItem)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="tipe"
            control={itemForm.control}
            render={({ field, fieldState }) => (
              <AsyncSelect
                label="Kategori Tipe"
                required
                placeholder="Cari & pilih kategori tipe..."
                value={field.value}
                onChange={(opt: any) => {
                  field.onChange(opt?.value ?? '');
                  if (opt?.modul) itemForm.setValue('modul', opt.modul);
                }}
                loadOptions={loadTipeOptions}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="modul"
            control={itemForm.control}
            render={({ field, fieldState }) => (
              <Select
                label="Cakupan Modul"
                required
                value={field.value}
                onChange={field.onChange}
                options={moduleOptions}
                error={fieldState.error?.message}
              />
            )}
          />

          <Input
            label="Kode / Key"
            hint="Opsional, misal: ISLAM, WNI"
            placeholder="misal: ISLAM, WNI, SMA"
            {...itemForm.register('kode')}
            error={itemForm.formState.errors.kode?.message}
          />

          <Input
            label="Nomor Urutan"
            type="number"
            min="0"
            {...itemForm.register('urutan', { valueAsNumber: true })}
            error={itemForm.formState.errors.urutan?.message}
          />

          <div className="md:col-span-2">
            <Input
              label="Label / Nama Tampilan"
              required
              placeholder="misal: Islam, Belum Kawin, Warga Negara Indonesia"
              {...itemForm.register('nama')}
              error={itemForm.formState.errors.nama?.message}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              name="is_active"
              control={itemForm.control}
              render={({ field, fieldState }) => (
                <Checkbox
                  label="Aktifkan opsi ini di formulir"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL MASTER TIPE REFERENSI ===================== */}
      <Modal
        isOpen={isTipeModalOpen}
        onClose={() => !isSavingTipe && setIsTipeModalOpen(false)}
        title={editingTipe ? 'Edit Master Tipe Referensi' : 'Tambah Master Tipe Referensi Baru'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsTipeModalOpen(false)}
              disabled={isSavingTipe}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={tipeForm.handleSubmit(onSaveTipe)}
              loading={isSavingTipe}
              disabled={isSavingTipe}
            >
              {editingTipe ? 'Simpan Perubahan' : 'Buat Tipe Referensi'}
            </Button>
          </>
        }
      >
        <form onSubmit={tipeForm.handleSubmit(onSaveTipe)} className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <p>
              Tipe referensi mendefinisikan kelompok data dropdown atau opsi pilihan yang
              digunakan bersama oleh modul kampus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Unik / Slug"
              required
              hint="Format snake_case huruf kecil"
              placeholder="misal: kewarganegaraan"
              {...tipeForm.register('kode')}
              onChange={(e) =>
                tipeForm.setValue('kode', e.target.value.toLowerCase().replace(/\s+/g, '_'), {
                  shouldValidate: true,
                })
              }
              error={tipeForm.formState.errors.kode?.message}
            />

            <Controller
              name="modul"
              control={tipeForm.control}
              render={({ field, fieldState }) => (
                <Select
                  label="Cakupan Modul"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={moduleOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <Input
            label="Nama Tipe Referensi"
            required
            placeholder="misal: Kewarganegaraan, Pekerjaan Orang Tua"
            {...tipeForm.register('nama')}
            error={tipeForm.formState.errors.nama?.message}
          />

          <Input
            label="Deskripsi Fungsi / Catatan"
            placeholder="misal: Standar kewarganegaraan civitas akademika (WNI, WNA)"
            {...tipeForm.register('deskripsi')}
            error={tipeForm.formState.errors.deskripsi?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nomor Urutan Tampilan"
              type="number"
              min="0"
              {...tipeForm.register('urutan', { valueAsNumber: true })}
              error={tipeForm.formState.errors.urutan?.message}
            />

            <div className="flex items-center pt-6">
              <Controller
                name="is_active"
                control={tipeForm.control}
                render={({ field, fieldState }) => (
                  <Checkbox
                    label="Aktifkan tipe ini"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
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
