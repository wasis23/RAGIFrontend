'use client';

import { useEffect, useState, useCallback } from 'react';
import { Award, FileText, BookOpen, UserCheck, Globe, Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import type {
  MasterJenisSertifikasi,
  MasterJenisTes,
  MasterJenisPelatihan,
  MasterPeranPelatihan,
  MasterTingkatKegiatan,
} from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

// ── ZOD SCHEMAS ──────────────────────────────────────────
const sertifikasiSchema = z.object({
  nama: z.string().min(1, 'Nama sertifikasi wajib diisi'),
  kode: z.string().min(1, 'Kode sertifikasi wajib diisi'),
  deskripsi: z.string().optional(),
  is_active: z.boolean(),
});

const tesSchema = z.object({
  nama: z.string().min(1, 'Nama jenis tes wajib diisi'),
  kode: z.string().min(1, 'Kode jenis tes wajib diisi'),
  kategori: z.enum(['bahasa', 'potensi_akademik'], {
    message: 'Kategori tes wajib dipilih',
  }),
  skor_min: z.number().min(0, 'Skor minimal tidak boleh negatif'),
  skor_max: z.number().min(1, 'Skor maksimal minimal 1'),
  deskripsi: z.string().optional(),
  is_active: z.boolean(),
}).refine((data) => data.skor_max >= data.skor_min, {
  message: 'Skor maksimal harus lebih besar atau sama dengan skor minimal',
  path: ['skor_max'],
});

const simpleMasterSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  deskripsi: z.string().optional(),
  is_active: z.boolean(),
});

type TabType = 'sertifikasi' | 'tes' | 'pelatihan' | 'peran' | 'tingkat';

export default function MasterKompetensiPage() {
  const { hasPermission, isAdmin, isSuperAdmin, hasRole } = useAuth();
  const canRead =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.kompetensi.read') ||
    hasPermission('simpeg.kompetensi.manage');
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    hasRole('admin_simpeg') ||
    hasRole('operator_sdm') ||
    hasPermission('simpeg.kompetensi.manage') ||
    hasPermission('simpeg.kompetensi.create');

  const [activeTab, setActiveTab] = useState<TabType>('sertifikasi');

  // List States & Pagination
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Data per tab
  const [sertifikasiList, setSertifikasiList] = useState<MasterJenisSertifikasi[]>([]);
  const [tesList, setTesList] = useState<MasterJenisTes[]>([]);
  const [pelatihanList, setPelatihanList] = useState<MasterJenisPelatihan[]>([]);
  const [peranList, setPeranList] = useState<MasterPeranPelatihan[]>([]);
  const [tingkatList, setTingkatList] = useState<MasterTingkatKegiatan[]>([]);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKategoriTes, setFilterKategoriTes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  // Modal & Confirm States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; nama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const formSertifikasi = useForm<z.infer<typeof sertifikasiSchema>>({
    resolver: zodResolver(sertifikasiSchema),
    defaultValues: { nama: '', kode: '', deskripsi: '', is_active: true },
  });

  const formTes = useForm<z.infer<typeof tesSchema>>({
    resolver: zodResolver(tesSchema),
    defaultValues: { nama: '', kode: '', kategori: 'bahasa', skor_min: 0, skor_max: 677, deskripsi: '', is_active: true },
  });

  const formSimple = useForm<z.infer<typeof simpleMasterSchema>>({
    resolver: zodResolver(simpleMasterSchema),
    defaultValues: { nama: '', deskripsi: '', is_active: true },
  });

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: limit,
        sort_by: filterOrderBy,
        sort_order: filterOrderDir,
      };
      if (search) params.search = search;
      if (filterStatus) params.is_active = filterStatus;

      if (activeTab === 'sertifikasi') {
        const res = await simpegService.getMasterJenisSertifikasiList(params);
        setSertifikasiList(res.data || []);
        if (res.meta) setMeta(res.meta);
      } else if (activeTab === 'tes') {
        if (filterKategoriTes) params.kategori = filterKategoriTes;
        const res = await simpegService.getMasterJenisTesList(params);
        setTesList(res.data || []);
        if (res.meta) setMeta(res.meta);
      } else if (activeTab === 'pelatihan') {
        const res = await simpegService.getMasterJenisPelatihanList(params);
        setPelatihanList(res.data || []);
        if (res.meta) setMeta(res.meta);
      } else if (activeTab === 'peran') {
        const res = await simpegService.getMasterPeranPelatihanList(params);
        setPeranList(res.data || []);
        if (res.meta) setMeta(res.meta);
      } else if (activeTab === 'tingkat') {
        const res = await simpegService.getMasterTingkatKegiatanList(params);
        setTingkatList(res.data || []);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master kompetensi');
    } finally {
      setLoading(false);
    }
  }, [canRead, activeTab, page, limit, search, filterKategoriTes, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeTab === 'sertifikasi') {
      formSertifikasi.reset({ nama: '', kode: '', deskripsi: '', is_active: true });
    } else if (activeTab === 'tes') {
      formTes.reset({ nama: '', kode: '', kategori: 'bahasa', skor_min: 0, skor_max: 677, deskripsi: '', is_active: true });
    } else {
      formSimple.reset({ nama: '', deskripsi: '', is_active: true });
    }
    setModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'sertifikasi') {
      formSertifikasi.reset({
        nama: item.nama,
        kode: item.kode,
        deskripsi: item.deskripsi || '',
        is_active: item.is_active,
      });
    } else if (activeTab === 'tes') {
      formTes.reset({
        nama: item.nama,
        kode: item.kode,
        kategori: item.kategori,
        skor_min: Number(item.skor_min),
        skor_max: Number(item.skor_max),
        deskripsi: item.deskripsi || '',
        is_active: item.is_active,
      });
    } else {
      formSimple.reset({
        nama: item.nama,
        deskripsi: item.deskripsi || '',
        is_active: item.is_active,
      });
    }
    setModalOpen(true);
  };

  // Submit Handler
  const onSubmit = async () => {
    try {
      if (activeTab === 'sertifikasi') {
        const values = await formSertifikasi.handleSubmit(async (data) => {
          if (editingItem) {
            await simpegService.updateMasterJenisSertifikasi(editingItem.id, data);
            toast.success('Jenis sertifikasi berhasil diperbarui');
          } else {
            await simpegService.createMasterJenisSertifikasi(data);
            toast.success('Jenis sertifikasi berhasil ditambahkan');
          }
        })();
      } else if (activeTab === 'tes') {
        const values = await formTes.handleSubmit(async (data) => {
          if (editingItem) {
            await simpegService.updateMasterJenisTes(editingItem.id, data);
            toast.success('Jenis tes resmi berhasil diperbarui');
          } else {
            await simpegService.createMasterJenisTes(data);
            toast.success('Jenis tes resmi berhasil ditambahkan');
          }
        })();
      } else if (activeTab === 'pelatihan') {
        const values = await formSimple.handleSubmit(async (data) => {
          if (editingItem) {
            await simpegService.updateMasterJenisPelatihan(editingItem.id, data);
            toast.success('Jenis pelatihan berhasil diperbarui');
          } else {
            await simpegService.createMasterJenisPelatihan(data);
            toast.success('Jenis pelatihan berhasil ditambahkan');
          }
        })();
      } else if (activeTab === 'peran') {
        const values = await formSimple.handleSubmit(async (data) => {
          if (editingItem) {
            await simpegService.updateMasterPeranPelatihan(editingItem.id, data);
            toast.success('Peran kegiatan berhasil diperbarui');
          } else {
            await simpegService.createMasterPeranPelatihan(data);
            toast.success('Peran kegiatan berhasil ditambahkan');
          }
        })();
      } else if (activeTab === 'tingkat') {
        const values = await formSimple.handleSubmit(async (data) => {
          if (editingItem) {
            await simpegService.updateMasterTingkatKegiatan(editingItem.id, data);
            toast.success('Tingkat kegiatan berhasil diperbarui');
          } else {
            await simpegService.createMasterTingkatKegiatan(data);
            toast.success('Tingkat kegiatan berhasil ditambahkan');
          }
        })();
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data master');
    }
  };

  // Delete Handler
  const handleDeleteClick = (id: number, nama: string) => {
    setItemToDelete({ id, nama });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (activeTab === 'sertifikasi') {
        await simpegService.deleteMasterJenisSertifikasi(itemToDelete.id);
      } else if (activeTab === 'tes') {
        await simpegService.deleteMasterJenisTes(itemToDelete.id);
      } else if (activeTab === 'pelatihan') {
        await simpegService.deleteMasterJenisPelatihan(itemToDelete.id);
      } else if (activeTab === 'peran') {
        await simpegService.deleteMasterPeranPelatihan(itemToDelete.id);
      } else if (activeTab === 'tingkat') {
        await simpegService.deleteMasterTingkatKegiatan(itemToDelete.id);
      }
      toast.success('Data master berhasil dihapus');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data master');
    } finally {
      setIsDeleting(false);
    }
  };

  // Tab Definitions
  const tabs = [
    { key: 'sertifikasi', label: 'Jenis Sertifikasi', icon: Award },
    { key: 'tes', label: 'Jenis Tes Resmi', icon: FileText },
    { key: 'pelatihan', label: 'Jenis Pelatihan', icon: BookOpen },
    { key: 'peran', label: 'Peran Kegiatan', icon: UserCheck },
    { key: 'tingkat', label: 'Tingkat Kegiatan', icon: Globe },
  ];

  // Helper for title
  const currentTabLabel = tabs.find((t) => t.key === activeTab)?.label || 'Master';

  // Columns per Tab
  const columnsSertifikasi: ColumnDef<MasterJenisSertifikasi>[] = [
    {
      key: 'nama',
      label: 'KODE & SERTIFIKASI',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono tracking-wider">{row.kode}</span>
        </div>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI',
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2">{row.deskripsi || '-'}</p>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'gray'} className="text-2xs">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'AKSI',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleDeleteClick(row.id, row.nama),
            },
          ]}
        />
      ),
    },
  ];

  const columnsTes: ColumnDef<MasterJenisTes>[] = [
    {
      key: 'nama',
      label: 'KODE & NAMA TES',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono tracking-wider">{row.kode}</span>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI TES',
      render: (row) => (
        <Badge variant={row.kategori === 'bahasa' ? 'info' : 'warning'} className="text-2xs uppercase">
          {row.kategori === 'bahasa' ? 'Bahasa Asing' : 'Potensi Akademik'}
        </Badge>
      ),
    },
    {
      key: 'skor_min',
      label: 'RENTANG SKOR HASIL',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.skor_min} — {row.skor_max}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'gray'} className="text-2xs">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'AKSI',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleDeleteClick(row.id, row.nama),
            },
          ]}
        />
      ),
    },
  ];

  const columnsSimple: ColumnDef<any>[] = [
    {
      key: 'nama',
      label: 'NAMA DATA',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI',
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2">{row.deskripsi || '-'}</p>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'gray'} className="text-2xs">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'AKSI',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleDeleteClick(row.id, row.nama),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full flex-col grid-cols-1 gap-4 space-y-4">
      <PageHeader
        title="Master Kompetensi & Pelatihan"
        description="Kelola seluruh referensi jenis sertifikasi dosen, jenis tes resmi, pelatihan & diklat, serta peran dan tingkat kegiatan."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-2 border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              <Filter size={16} />
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                onClick={handleOpenCreate}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Tambah {currentTabLabel}
              </Button>
            )}
          </div>
        }
      />

      {/* ── TAB NAVIGASI STANDAR (Mengikuti Format Presensi Pegawai) ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              type="button"
              variant="ghost"
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setPage(1);
                setSearch('');
                setFilterStatus('');
                setFilterKategoriTes('');
              }}
              style={isActive ? { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' } : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? '!border-[var(--module-primary)] !text-[var(--module-primary)] !bg-[var(--module-primary-subtle)] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* ── DATATABLE PER TAB ── */}
      <div className="space-y-4">
        {activeTab === 'sertifikasi' && (
          <DataTable
            columns={columnsSertifikasi}
            data={sertifikasiList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}

        {activeTab === 'tes' && (
          <DataTable
            columns={columnsTes}
            data={tesList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}

        {activeTab === 'pelatihan' && (
          <DataTable
            columns={columnsSimple}
            data={pelatihanList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}

        {activeTab === 'peran' && (
          <DataTable
            columns={columnsSimple}
            data={peranList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}

        {activeTab === 'tingkat' && (
          <DataTable
            columns={columnsSimple}
            data={tingkatList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* ── FILTER DRAWER ── */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={`Filter & Urutkan ${currentTabLabel}`}
      >
        <div className="space-y-4">
          <Input
            label="Cari Kata Kunci"
            placeholder="Ketik nama atau kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {activeTab === 'tes' && (
            <Select
              label="Kategori Tes"
              value={filterKategoriTes}
              onChange={(val) => setFilterKategoriTes(val || '')}
              options={[
                { value: '', label: '-- Semua Kategori --' },
                { value: 'bahasa', label: 'Bahasa Asing' },
                { value: 'potensi_akademik', label: 'Potensi Akademik' },
              ]}
            />
          )}

          <Select
            label="Status Data"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={[
              { value: '', label: '-- Semua Status --' },
              { value: '1', label: 'Hanya Aktif' },
              { value: '0', label: 'Hanya Nonaktif' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val || 'nama')}
              options={[
                { value: 'nama', label: 'Nama' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir((val as 'asc' | 'desc') || 'asc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterKategoriTes('');
                setFilterOrderBy('nama');
                setFilterOrderDir('asc');
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowFilter(false);
                setPage(1);
                loadData();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── MODAL CREATE / EDIT ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editingItem ? 'Edit' : 'Tambah'} ${currentTabLabel}`}
      >
        <div className="space-y-4">
          {/* TAB SERTIFIKASI */}
          {activeTab === 'sertifikasi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nama Jenis Sertifikasi *"
                  placeholder="Contoh: Sertifikat Pendidik (Serdos)"
                  error={formSertifikasi.formState.errors.nama?.message}
                  {...formSertifikasi.register('nama')}
                />
              </div>
              <Input
                label="Kode Sertifikasi *"
                placeholder="Contoh: SERDOS"
                error={formSertifikasi.formState.errors.kode?.message}
                {...formSertifikasi.register('kode')}
              />
              <Controller
                name="is_active"
                control={formSertifikasi.control}
                render={({ field }) => (
                  <Select
                    label="Status *"
                    value={field.value ? 'true' : 'false'}
                    onChange={(val) => field.onChange(val === 'true')}
                    options={[
                      { value: 'true', label: 'Aktif' },
                      { value: 'false', label: 'Nonaktif' },
                    ]}
                  />
                )}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Deskripsi / Catatan"
                  placeholder="Keterangan tambahan..."
                  rows={3}
                  {...formSertifikasi.register('deskripsi')}
                />
              </div>
            </div>
          )}

          {/* TAB TES RESMI */}
          {activeTab === 'tes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nama Jenis Tes *"
                  placeholder="Contoh: TOEFL ITP (Institutional Testing Program)"
                  error={formTes.formState.errors.nama?.message}
                  {...formTes.register('nama')}
                />
              </div>
              <Input
                label="Kode Tes *"
                placeholder="Contoh: TOEFL_ITP"
                error={formTes.formState.errors.kode?.message}
                {...formTes.register('kode')}
              />
              <Controller
                name="kategori"
                control={formTes.control}
                render={({ field }) => (
                  <Select
                    label="Kategori Tes *"
                    value={field.value}
                    onChange={field.onChange}
                    error={formTes.formState.errors.kategori?.message}
                    options={[
                      { value: 'bahasa', label: 'Kemampuan Bahasa Asing' },
                      { value: 'potensi_akademik', label: 'Tes Potensi Akademik (TPA/TKDA)' },
                    ]}
                  />
                )}
              />
              <Input
                type="number"
                label="Skor Minimum *"
                placeholder="0"
                error={formTes.formState.errors.skor_min?.message}
                {...formTes.register('skor_min', { valueAsNumber: true })}
              />
              <Input
                type="number"
                label="Skor Maksimum *"
                placeholder="677"
                error={formTes.formState.errors.skor_max?.message}
                {...formTes.register('skor_max', { valueAsNumber: true })}
              />
              <div className="md:col-span-2">
                <Controller
                  name="is_active"
                  control={formTes.control}
                  render={({ field }) => (
                    <Select
                      label="Status *"
                      value={field.value ? 'true' : 'false'}
                      onChange={(val) => field.onChange(val === 'true')}
                      options={[
                        { value: 'true', label: 'Aktif' },
                        { value: 'false', label: 'Nonaktif' },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Deskripsi / Catatan"
                  placeholder="Keterangan standar sertifikat..."
                  rows={2}
                  {...formTes.register('deskripsi')}
                />
              </div>
            </div>
          )}

          {/* TAB PELATIHAN / PERAN / TINGKAT */}
          {['pelatihan', 'peran', 'tingkat'].includes(activeTab) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label={`Nama ${currentTabLabel} *`}
                  placeholder={`Contoh: ${
                    activeTab === 'pelatihan'
                      ? 'Pelatihan PEKERTI / AA'
                      : activeTab === 'peran'
                      ? 'Narasumber / Pemateri'
                      : 'Tingkat Nasional'
                  }`}
                  error={formSimple.formState.errors.nama?.message}
                  {...formSimple.register('nama')}
                />
              </div>
              <div className="md:col-span-2">
                <Controller
                  name="is_active"
                  control={formSimple.control}
                  render={({ field }) => (
                    <Select
                      label="Status *"
                      value={field.value ? 'true' : 'false'}
                      onChange={(val) => field.onChange(val === 'true')}
                      options={[
                        { value: 'true', label: 'Aktif' },
                        { value: 'false', label: 'Nonaktif' },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Deskripsi / Keterangan"
                  placeholder="Keterangan opsional..."
                  rows={3}
                  {...formSimple.register('deskripsi')}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={onSubmit}>
              {editingItem ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM DIALOG HAPUS ── */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${currentTabLabel}`}
        message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
