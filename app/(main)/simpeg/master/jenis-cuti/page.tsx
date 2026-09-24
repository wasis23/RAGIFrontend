'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2, CalendarDays, Clock } from 'lucide-react';
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
import type { MasterJenisCuti, MasterJenisIzinJamKerja } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

// ── ZOD SCHEMAS ──────────────────────────────────────────
const masterJenisCutiSchema = z.object({
  nama: z.string().min(1, 'Nama jenis izin/cuti wajib diisi'),
  kode: z.string().optional(),
  tipe_durasi: z.enum(['ditetapkan', 'fleksibel'], {
    message: 'Tipe durasi wajib dipilih',
  }),
  durasi_hari: z.number().min(0, 'Durasi hari tidak boleh bernilai negatif').optional(),
  satuan: z.string(),
  lampiran_wajib: z.boolean(),
  keterangan: z.string().optional(),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.tipe_durasi === 'ditetapkan') {
    return (data.durasi_hari ?? 0) >= 1;
  }
  return true;
}, {
  message: 'Durasi hari wajib diisi minimal 1 hari jika tipe durasi ditetapkan',
  path: ['durasi_hari'],
});

type MasterJenisCutiFormValues = z.infer<typeof masterJenisCutiSchema>;

const masterJenisIzinSchema = z.object({
  nama: z.string().min(1, 'Nama jenis izin jam kerja wajib diisi'),
  kode: z.string().min(1, 'Kode jenis izin wajib diisi'),
  tipe_potongan: z.enum(['tidak_potong', 'potong_jam'], {
    message: 'Tipe potongan jam kerja wajib dipilih',
  }),
  urutan: z.number().min(0, 'Nomor urutan minimal 0'),
  deskripsi: z.string().optional(),
  is_active: z.boolean(),
});

type MasterJenisIzinFormValues = z.infer<typeof masterJenisIzinSchema>;

export default function MasterJenisCutiPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.cuti.read') || hasPermission('simpeg.cuti.manage');
  const canManage = hasPermission('simpeg.cuti.manage') || hasPermission('simpeg.cuti.create');

  const [activeTab, setActiveTab] = useState<'cuti' | 'izin-kerja'>(
    tabParam === 'izin-kerja' ? 'izin-kerja' : 'cuti'
  );

  // Sync tab with URL
  const handleTabChange = (newTab: 'cuti' | 'izin-kerja') => {
    setActiveTab(newTab);
    router.replace(`/simpeg/master/jenis-cuti${newTab === 'izin-kerja' ? '?tab=izin-kerja' : ''}`, { scroll: false });
  };

  // ── TAB 1: CUTI STATES ─────────────────────────────────
  const [loadingCuti, setLoadingCuti] = useState(true);
  const [dataCutiList, setDataCutiList] = useState<MasterJenisCuti[]>([]);
  const [metaCuti, setMetaCuti] = useState<PaginationMeta | undefined>();
  const [pageCuti, setPageCuti] = useState(1);
  const [limitCuti, setLimitCuti] = useState(15);
  const [searchCuti, setSearchCuti] = useState('');
  const [filterTipeCuti, setFilterTipeCuti] = useState('');
  const [filterStatusCuti, setFilterStatusCuti] = useState('');
  const [filterOrderByCuti, setFilterOrderByCuti] = useState('nama');
  const [filterOrderDirCuti, setFilterOrderDirCuti] = useState<'asc' | 'desc'>('asc');
  const [showFilterCuti, setShowFilterCuti] = useState(false);

  // Modal Cuti
  const [showModalCuti, setShowModalCuti] = useState(false);
  const [editCutiId, setEditCutiId] = useState<number | null>(null);

  // Delete Cuti
  const [deleteConfirmCutiOpen, setDeleteConfirmCutiOpen] = useState(false);
  const [itemToDeleteCuti, setItemToDeleteCuti] = useState<{ id: number; nama: string } | null>(null);
  const [isDeletingCuti, setIsDeletingCuti] = useState(false);

  const formCuti = useForm<MasterJenisCutiFormValues>({
    resolver: zodResolver(masterJenisCutiSchema),
    defaultValues: {
      nama: '',
      kode: '',
      tipe_durasi: 'fleksibel',
      durasi_hari: 0,
      satuan: 'hari',
      lampiran_wajib: false,
      keterangan: '',
      is_active: true,
    },
  });

  // ── TAB 2: IZIN KERJA STATES ───────────────────────────
  const [loadingIzin, setLoadingIzin] = useState(true);
  const [dataIzinList, setDataIzinList] = useState<MasterJenisIzinJamKerja[]>([]);
  const [metaIzin, setMetaIzin] = useState<PaginationMeta | undefined>();
  const [pageIzin, setPageIzin] = useState(1);
  const [limitIzin, setLimitIzin] = useState(15);
  const [searchIzin, setSearchIzin] = useState('');
  const [filterPotonganIzin, setFilterPotonganIzin] = useState('');
  const [filterStatusIzin, setFilterStatusIzin] = useState('');
  const [filterOrderByIzin, setFilterOrderByIzin] = useState('urutan');
  const [filterOrderDirIzin, setFilterOrderDirIzin] = useState<'asc' | 'desc'>('asc');
  const [showFilterIzin, setShowFilterIzin] = useState(false);

  // Modal Izin
  const [showModalIzin, setShowModalIzin] = useState(false);
  const [editIzinId, setEditIzinId] = useState<number | null>(null);

  // Delete Izin
  const [deleteConfirmIzinOpen, setDeleteConfirmIzinOpen] = useState(false);
  const [itemToDeleteIzin, setItemToDeleteIzin] = useState<{ id: number; nama: string } | null>(null);
  const [isDeletingIzin, setIsDeletingIzin] = useState(false);

  const formIzin = useForm<MasterJenisIzinFormValues>({
    resolver: zodResolver(masterJenisIzinSchema),
    defaultValues: {
      nama: '',
      kode: '',
      tipe_potongan: 'tidak_potong',
      urutan: 1,
      deskripsi: '',
      is_active: true,
    },
  });

  // ── FETCH CUTI ─────────────────────────────────────────
  const fetchCuti = useCallback(async () => {
    if (!canRead) return;
    setLoadingCuti(true);
    try {
      const params: Record<string, any> = {
        page: pageCuti,
        per_page: limitCuti,
        sort_by: filterOrderByCuti,
        sort_order: filterOrderDirCuti,
      };
      if (searchCuti) params.search = searchCuti;
      if (filterTipeCuti) params.tipe_durasi = filterTipeCuti;
      if (filterStatusCuti !== '') params.is_active = filterStatusCuti;

      const res = await simpegService.getMasterJenisCutiList(params);
      setDataCutiList(res.data || []);
      if (res.meta) setMetaCuti(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master jenis cuti');
    } finally {
      setLoadingCuti(false);
    }
  }, [canRead, pageCuti, limitCuti, searchCuti, filterTipeCuti, filterStatusCuti, filterOrderByCuti, filterOrderDirCuti]);

  // ── FETCH IZIN JAM KERJA ───────────────────────────────
  const fetchIzin = useCallback(async () => {
    if (!canRead) return;
    setLoadingIzin(true);
    try {
      const params: Record<string, any> = {
        page: pageIzin,
        per_page: limitIzin,
        sort_by: filterOrderByIzin,
        sort_order: filterOrderDirIzin,
      };
      if (searchIzin) params.search = searchIzin;
      if (filterPotonganIzin) params.tipe_potongan = filterPotonganIzin;
      if (filterStatusIzin !== '') params.is_active = filterStatusIzin;

      const res = await simpegService.getMasterJenisIzinJamKerjaList(params);
      setDataIzinList(res.data || []);
      if (res.meta) setMetaIzin(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat master jenis izin jam kerja');
    } finally {
      setLoadingIzin(false);
    }
  }, [canRead, pageIzin, limitIzin, searchIzin, filterPotonganIzin, filterStatusIzin, filterOrderByIzin, filterOrderDirIzin]);

  useEffect(() => {
    if (activeTab === 'cuti') {
      fetchCuti();
    } else {
      fetchIzin();
    }
  }, [activeTab, fetchCuti, fetchIzin]);

  // ── HANDLERS CUTI ──────────────────────────────────────
  const handleOpenCreateCuti = () => {
    setEditCutiId(null);
    formCuti.reset({
      nama: '',
      kode: '',
      tipe_durasi: 'fleksibel',
      durasi_hari: 0,
      satuan: 'hari',
      lampiran_wajib: false,
      keterangan: '',
      is_active: true,
    });
    setShowModalCuti(true);
  };

  const handleOpenEditCuti = (item: MasterJenisCuti) => {
    setEditCutiId(item.id);
    formCuti.reset({
      nama: item.nama,
      kode: item.kode || '',
      tipe_durasi: item.tipe_durasi,
      durasi_hari: item.durasi_hari || 0,
      satuan: item.satuan || 'hari',
      lampiran_wajib: item.lampiran_wajib,
      keterangan: item.keterangan || '',
      is_active: item.is_active,
    });
    setShowModalCuti(true);
  };

  const onSubmitCuti = async (values: MasterJenisCutiFormValues) => {
    try {
      if (editCutiId) {
        await simpegService.updateMasterJenisCuti(editCutiId, values);
        toast.success('Jenis cuti berhasil diperbarui');
      } else {
        await simpegService.createMasterJenisCuti(values);
        toast.success('Jenis cuti berhasil ditambahkan');
      }
      setShowModalCuti(false);
      fetchCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan jenis cuti');
    }
  };

  const handleConfirmDeleteCuti = async () => {
    if (!itemToDeleteCuti) return;
    setIsDeletingCuti(true);
    try {
      await simpegService.deleteMasterJenisCuti(itemToDeleteCuti.id);
      toast.success('Jenis cuti berhasil dihapus');
      setDeleteConfirmCutiOpen(false);
      setItemToDeleteCuti(null);
      fetchCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jenis cuti');
    } finally {
      setIsDeletingCuti(false);
    }
  };

  // ── HANDLERS IZIN JAM KERJA ────────────────────────────
  const handleOpenCreateIzin = () => {
    setEditIzinId(null);
    formIzin.reset({
      nama: '',
      kode: '',
      tipe_potongan: 'tidak_potong',
      urutan: (dataIzinList.length > 0 ? Math.max(...dataIzinList.map((d) => d.urutan || 0)) + 1 : 1),
      deskripsi: '',
      is_active: true,
    });
    setShowModalIzin(true);
  };

  const handleOpenEditIzin = (item: MasterJenisIzinJamKerja) => {
    setEditIzinId(item.id);
    formIzin.reset({
      nama: item.nama,
      kode: item.kode,
      tipe_potongan: item.tipe_potongan,
      urutan: item.urutan,
      deskripsi: item.deskripsi || '',
      is_active: item.is_active,
    });
    setShowModalIzin(true);
  };

  const onSubmitIzin = async (values: MasterJenisIzinFormValues) => {
    try {
      if (editIzinId) {
        await simpegService.updateMasterJenisIzinJamKerja(editIzinId, values);
        toast.success('Jenis izin jam kerja berhasil diperbarui');
      } else {
        await simpegService.createMasterJenisIzinJamKerja(values);
        toast.success('Jenis izin jam kerja berhasil ditambahkan');
      }
      setShowModalIzin(false);
      fetchIzin();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan jenis izin jam kerja');
    }
  };

  const handleConfirmDeleteIzin = async () => {
    if (!itemToDeleteIzin) return;
    setIsDeletingIzin(true);
    try {
      await simpegService.deleteMasterJenisIzinJamKerja(itemToDeleteIzin.id);
      toast.success('Jenis izin jam kerja berhasil dihapus');
      setDeleteConfirmIzinOpen(false);
      setItemToDeleteIzin(null);
      fetchIzin();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jenis izin jam kerja');
    } finally {
      setIsDeletingIzin(false);
    }
  };

  // ── COLUMNS CUTI ───────────────────────────────────────
  const columnsCuti: ColumnDef<MasterJenisCuti>[] = [
    {
      key: 'nama',
      label: 'JENIS CUTI & KODE',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono tracking-wider">{row.kode || '-'}</span>
        </div>
      ),
    },
    {
      key: 'tipe_durasi',
      label: 'TIPE DURASI',
      render: (row) => (
        <div className="flex flex-col">
          <Badge variant={row.tipe_durasi === 'ditetapkan' ? 'info' : 'warning'} className="text-2xs capitalize w-fit">
            {row.tipe_durasi}
          </Badge>
          <span className="text-2xs text-slate-500 mt-0.5">
            {row.tipe_durasi === 'ditetapkan' ? `${row.durasi_hari} ${row.satuan}` : 'Sesuai Pengajuan'}
          </span>
        </div>
      ),
    },
    {
      key: 'lampiran_wajib',
      label: 'SYARAT LAMPIRAN',
      render: (row) => (
        <Badge variant={row.lampiran_wajib ? 'danger' : 'gray'} className="text-2xs">
          {row.lampiran_wajib ? 'Wajib Unggah' : 'Opsional'}
        </Badge>
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
              onClick: () => handleOpenEditCuti(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => {
                setItemToDeleteCuti({ id: row.id, nama: row.nama });
                setDeleteConfirmCutiOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  // ── COLUMNS IZIN JAM KERJA ─────────────────────────────
  const columnsIzin: ColumnDef<MasterJenisIzinJamKerja>[] = [
    {
      key: 'nama',
      label: 'JENIS IZIN & KODE',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono tracking-wider">{row.kode}</span>
        </div>
      ),
    },
    {
      key: 'tipe_potongan',
      label: 'TIPE POTONGAN JAM',
      render: (row) => (
        <Badge variant={row.tipe_potongan === 'tidak_potong' ? 'success' : 'danger'} className="text-2xs">
          {row.tipe_potongan === 'tidak_potong' ? 'Tidak Memotong Jam' : 'Memotong Jam Kerja'}
        </Badge>
      ),
    },
    {
      key: 'urutan',
      label: 'NO. URUT',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
          {row.urutan}
        </span>
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
              onClick: () => handleOpenEditIzin(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => {
                setItemToDeleteIzin({ id: row.id, nama: row.nama });
                setDeleteConfirmIzinOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full flex-col grid-cols-1 gap-4 space-y-4">
      <PageHeader
        title="Master Regulasi Cuti & Izin Kerja"
        description="Pengaturan master regulasi cuti tahunan/khusus dan jenis izin keterlambatan / pulang cepat pegawai."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === 'cuti') setShowFilterCuti(true);
                else setShowFilterIzin(true);
              }}
              className="flex items-center gap-2 border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              <Filter size={16} />
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                onClick={() => {
                  if (activeTab === 'cuti') handleOpenCreateCuti();
                  else handleOpenCreateIzin();
                }}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Tambah {activeTab === 'cuti' ? 'Jenis Cuti' : 'Jenis Izin Jam Kerja'}
              </Button>
            )}
          </div>
        }
      />

      {/* ── TAB NAVIGASI STANDAR (Mengikuti Format Presensi Pegawai) ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        <Button
          type="button"
          variant="ghost"
          onClick={() => handleTabChange('cuti')}
          style={activeTab === 'cuti' ? { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' } : undefined}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'cuti'
              ? '!border-[var(--module-primary)] !text-[var(--module-primary)] !bg-[var(--module-primary-subtle)] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays size={16} />
          Master Jenis Cuti Pegawai
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => handleTabChange('izin-kerja')}
          style={activeTab === 'izin-kerja' ? { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' } : undefined}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'izin-kerja'
              ? '!border-[var(--module-primary)] !text-[var(--module-primary)] !bg-[var(--module-primary-subtle)] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Clock size={16} />
          Master Jenis Izin Jam Kerja
        </Button>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'cuti' && (
        <DataTable
          columns={columnsCuti}
          data={dataCutiList}
          isLoading={loadingCuti}
          meta={metaCuti}
          onPageChange={(newPage) => setPageCuti(newPage)}
          onLimitChange={(newLimit) => {
            setLimitCuti(newLimit);
            setPageCuti(1);
          }}
        />
      )}

      {activeTab === 'izin-kerja' && (
        <DataTable
          columns={columnsIzin}
          data={dataIzinList}
          isLoading={loadingIzin}
          meta={metaIzin}
          onPageChange={(newPage) => setPageIzin(newPage)}
          onLimitChange={(newLimit) => {
            setLimitIzin(newLimit);
            setPageIzin(1);
          }}
        />
      )}

      {/* ── FILTER DRAWER CUTI ── */}
      <Drawer
        open={showFilterCuti}
        onClose={() => setShowFilterCuti(false)}
        title="Filter & Urutkan Jenis Cuti"
      >
        <div className="space-y-4">
          <Input
            label="Cari Kata Kunci"
            placeholder="Cari nama, kode, atau keterangan..."
            value={searchCuti}
            onChange={(e) => setSearchCuti(e.target.value)}
          />

          <Select
            label="Tipe Durasi"
            value={filterTipeCuti}
            onChange={(val) => setFilterTipeCuti(val || '')}
            options={[
              { value: '', label: '-- Semua Tipe Durasi --' },
              { value: 'ditetapkan', label: 'Ditetapkan (Jumlah Hari Pasti)' },
              { value: 'fleksibel', label: 'Fleksibel (Bebas Ditentukan Saat Izin)' },
            ]}
          />

          <Select
            label="Status Data"
            value={filterStatusCuti}
            onChange={(val) => setFilterStatusCuti(val || '')}
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
              value={filterOrderByCuti}
              onChange={(val) => setFilterOrderByCuti(val || 'nama')}
              options={[
                { value: 'nama', label: 'Nama Cuti' },
                { value: 'kode', label: 'Kode' },
                { value: 'durasi_hari', label: 'Durasi Hari' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDirCuti}
              onChange={(val) => setFilterOrderDirCuti((val as 'asc' | 'desc') || 'asc')}
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
                setSearchCuti('');
                setFilterTipeCuti('');
                setFilterStatusCuti('');
                setFilterOrderByCuti('nama');
                setFilterOrderDirCuti('asc');
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowFilterCuti(false);
                setPageCuti(1);
                fetchCuti();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── FILTER DRAWER IZIN JAM KERJA ── */}
      <Drawer
        open={showFilterIzin}
        onClose={() => setShowFilterIzin(false)}
        title="Filter & Urutkan Jenis Izin Jam Kerja"
      >
        <div className="space-y-4">
          <Input
            label="Cari Kata Kunci"
            placeholder="Cari nama atau kode izin..."
            value={searchIzin}
            onChange={(e) => setSearchIzin(e.target.value)}
          />

          <Select
            label="Tipe Potongan Jam"
            value={filterPotonganIzin}
            onChange={(val) => setFilterPotonganIzin(val || '')}
            options={[
              { value: '', label: '-- Semua Tipe Potongan --' },
              { value: 'tidak_potong', label: 'Tidak Memotong Jam' },
              { value: 'potong_jam', label: 'Memotong Jam Kerja' },
            ]}
          />

          <Select
            label="Status Data"
            value={filterStatusIzin}
            onChange={(val) => setFilterStatusIzin(val || '')}
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
              value={filterOrderByIzin}
              onChange={(val) => setFilterOrderByIzin(val || 'urutan')}
              options={[
                { value: 'urutan', label: 'No. Urutan' },
                { value: 'nama', label: 'Nama Izin' },
                { value: 'kode', label: 'Kode Izin' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDirIzin}
              onChange={(val) => setFilterOrderDirIzin((val as 'asc' | 'desc') || 'asc')}
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
                setSearchIzin('');
                setFilterPotonganIzin('');
                setFilterStatusIzin('');
                setFilterOrderByIzin('urutan');
                setFilterOrderDirIzin('asc');
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowFilterIzin(false);
                setPageIzin(1);
                fetchIzin();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── MODAL CUTI ── */}
      <Modal
        open={showModalCuti}
        onClose={() => setShowModalCuti(false)}
        title={editCutiId ? 'Edit Master Jenis Cuti' : 'Tambah Master Jenis Cuti'}
      >
        <form onSubmit={formCuti.handleSubmit(onSubmitCuti)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Jenis Cuti *"
                placeholder="Contoh: Cuti Tahunan Pegawai"
                error={formCuti.formState.errors.nama?.message}
                {...formCuti.register('nama')}
              />
            </div>
            <Input
              label="Kode Cuti (Opsional)"
              placeholder="Contoh: CT-01"
              error={formCuti.formState.errors.kode?.message}
              {...formCuti.register('kode')}
            />
            <Controller
              name="tipe_durasi"
              control={formCuti.control}
              render={({ field }) => (
                <Select
                  label="Tipe Durasi *"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'ditetapkan', label: 'Ditetapkan (Jumlah Hari Baku)' },
                    { value: 'fleksibel', label: 'Fleksibel (Dapat Diisi Bebas)' },
                  ]}
                />
              )}
            />

            {formCuti.watch('tipe_durasi') === 'ditetapkan' && (
              <>
                <Input
                  type="number"
                  label="Durasi Hari *"
                  placeholder="12"
                  error={formCuti.formState.errors.durasi_hari?.message}
                  {...formCuti.register('durasi_hari', { valueAsNumber: true })}
                />
                <Input
                  label="Satuan *"
                  placeholder="hari"
                  error={formCuti.formState.errors.satuan?.message}
                  {...formCuti.register('satuan')}
                />
              </>
            )}

            <Controller
              name="lampiran_wajib"
              control={formCuti.control}
              render={({ field }) => (
                <Select
                  label="Kewajiban Unggah Lampiran *"
                  value={field.value ? 'true' : 'false'}
                  onChange={(val) => field.onChange(val === 'true')}
                  options={[
                    { value: 'false', label: 'Opsional (Tidak Wajib)' },
                    { value: 'true', label: 'Wajib Lampirkan Surat/Bukti' },
                  ]}
                />
              )}
            />

            <Controller
              name="is_active"
              control={formCuti.control}
              render={({ field }) => (
                <Select
                  label="Status Regulasi *"
                  value={field.value ? 'true' : 'false'}
                  onChange={(val) => field.onChange(val === 'true')}
                  options={[
                    { value: 'true', label: 'Aktif (Dapat Dipilih Pegawai)' },
                    { value: 'false', label: 'Nonaktif' },
                  ]}
                />
              )}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Keterangan / Regulasi Tambahan"
                placeholder="Penjelasan ketentuan..."
                rows={3}
                {...formCuti.register('keterangan')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModalCuti(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={formCuti.formState.isSubmitting}>
              {editCutiId ? 'Simpan Perubahan' : 'Tambah Jenis Cuti'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL IZIN JAM KERJA ── */}
      <Modal
        open={showModalIzin}
        onClose={() => setShowModalIzin(false)}
        title={editIzinId ? 'Edit Master Jenis Izin Jam Kerja' : 'Tambah Master Jenis Izin Jam Kerja'}
      >
        <form onSubmit={formIzin.handleSubmit(onSubmitIzin)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Jenis Izin Jam Kerja *"
                placeholder="Contoh: Izin Datang Terlambat"
                error={formIzin.formState.errors.nama?.message}
                {...formIzin.register('nama')}
              />
            </div>
            <Input
              label="Kode Izin *"
              placeholder="Contoh: IZIN_TERLAMBAT"
              error={formIzin.formState.errors.kode?.message}
              {...formIzin.register('kode')}
            />
            <Controller
              name="tipe_potongan"
              control={formIzin.control}
              render={({ field }) => (
                <Select
                  label="Tipe Potongan Jam Kerja *"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'tidak_potong', label: 'Tidak Potong Jam (Toleransi Dinas/Keperluan)' },
                    { value: 'potong_jam', label: 'Potong Jam Kerja Efektif' },
                  ]}
                />
              )}
            />

            <Input
              type="number"
              label="Nomor Urutan Tampilan *"
              placeholder="1"
              error={formIzin.formState.errors.urutan?.message}
              {...formIzin.register('urutan', { valueAsNumber: true })}
            />

            <Controller
              name="is_active"
              control={formIzin.control}
              render={({ field }) => (
                <Select
                  label="Status Tampil *"
                  value={field.value ? 'true' : 'false'}
                  onChange={(val) => field.onChange(val === 'true')}
                  options={[
                    { value: 'true', label: 'Aktif (Muncul di Form Pengajuan Izin)' },
                    { value: 'false', label: 'Nonaktif' },
                  ]}
                />
              )}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Deskripsi / Catatan"
                placeholder="Penjelasan aturan izin ini..."
                rows={3}
                {...formIzin.register('deskripsi')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModalIzin(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={formIzin.formState.isSubmitting}>
              {editIzinId ? 'Simpan Perubahan' : 'Tambah Jenis Izin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── CONFIRM DIALOGS ── */}
      <ConfirmDialog
        isOpen={deleteConfirmCutiOpen}
        onClose={() => setDeleteConfirmCutiOpen(false)}
        onConfirm={handleConfirmDeleteCuti}
        title="Hapus Master Jenis Cuti"
        message={`Apakah Anda yakin ingin menghapus jenis cuti "${itemToDeleteCuti?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingCuti}
      />

      <ConfirmDialog
        isOpen={deleteConfirmIzinOpen}
        onClose={() => setDeleteConfirmIzinOpen(false)}
        onConfirm={handleConfirmDeleteIzin}
        title="Hapus Master Jenis Izin Jam Kerja"
        message={`Apakah Anda yakin ingin menghapus jenis izin "${itemToDeleteIzin?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingIzin}
      />
    </div>
  );
}
