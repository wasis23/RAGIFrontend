'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Car,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import type {
  MasterKategoriKegiatanTugas,
  MasterJenisTransportasi,
} from '@/types/simpeg.surat-tugas.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

// ── ZOD SCHEMAS ─────────────────────────────────────────────

const kategoriSchema = z.object({
  nama: z
    .string()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(100, 'Nama kategori maksimal 100 karakter'),
  kode: z
    .string()
    .min(2, 'Kode kategori minimal 2 karakter')
    .max(50, 'Kode kategori maksimal 50 karakter'),
  deskripsi: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional().nullable(),
  urutan: z.number().int('Urutan harus berupa angka bulat').min(0, 'Urutan minimal 0'),
  is_active: z.boolean(),
});

type KategoriFormValues = z.infer<typeof kategoriSchema>;

const transportasiSchema = z.object({
  nama: z
    .string()
    .min(2, 'Nama moda transportasi minimal 2 karakter')
    .max(100, 'Nama moda transportasi maksimal 100 karakter'),
  kode: z
    .string()
    .min(2, 'Kode moda transportasi minimal 2 karakter')
    .max(50, 'Kode moda transportasi maksimal 50 karakter'),
  is_kendaraan_kampus: z.boolean(),
  urutan: z.number().int('Urutan harus berupa angka bulat').min(0, 'Urutan minimal 0'),
  is_active: z.boolean(),
});

type TransportasiFormValues = z.infer<typeof transportasiSchema>;

export default function MasterSuratTugasPage() {
  const router = useRouter();
  const { hasPermission, isAdmin } = useAuth();

  const canRead =
    isAdmin ||
    hasPermission('simpeg.surat_tugas.read') ||
    hasPermission('simpeg.surat_tugas.manage') ||
    hasPermission('simpeg.master.manage');
  const canManage =
    isAdmin ||
    hasPermission('simpeg.surat_tugas.manage') ||
    hasPermission('simpeg.master.manage');

  const [activeTab, setActiveTab] = useState<'kategori' | 'transportasi'>('kategori');

  // ── TAB 1: KATEGORI STATE ──────────────────────────────────
  const [loadingKategori, setLoadingKategori] = useState(true);
  const [kategoriList, setKategoriList] = useState<MasterKategoriKegiatanTugas[]>([]);
  const [metaKategori, setMetaKategori] = useState<PaginationMeta | undefined>();
  const [searchKategori, setSearchKategori] = useState('');
  const [statusKategori, setStatusKategori] = useState('');
  const [orderKategoriBy, setOrderKategoriBy] = useState('urutan');
  const [orderKategoriDir, setOrderKategoriDir] = useState<'asc' | 'desc'>('asc');
  const [pageKategori, setPageKategori] = useState(1);
  const [limitKategori, setLimitKategori] = useState(15);
  const [showFilterKategori, setShowFilterKategori] = useState(false);

  // Modal Kategori
  const [showModalKategori, setShowModalKategori] = useState(false);
  const [editingKategori, setEditingKategori] = useState<MasterKategoriKegiatanTugas | null>(null);
  const [isSubmittingKategori, setIsSubmittingKategori] = useState(false);

  // ── TAB 2: TRANSPORTASI STATE ──────────────────────────────
  const [loadingTransportasi, setLoadingTransportasi] = useState(true);
  const [transportasiList, setTransportasiList] = useState<MasterJenisTransportasi[]>([]);
  const [metaTransportasi, setMetaTransportasi] = useState<PaginationMeta | undefined>();
  const [searchTransportasi, setSearchTransportasi] = useState('');
  const [statusTransportasi, setStatusTransportasi] = useState('');
  const [filterKendaraanKampus, setFilterKendaraanKampus] = useState('');
  const [orderTransportasiBy, setOrderTransportasiBy] = useState('urutan');
  const [orderTransportasiDir, setOrderTransportasiDir] = useState<'asc' | 'desc'>('asc');
  const [pageTransportasi, setPageTransportasi] = useState(1);
  const [limitTransportasi, setLimitTransportasi] = useState(15);
  const [showFilterTransportasi, setShowFilterTransportasi] = useState(false);

  // Modal Transportasi
  const [showModalTransportasi, setShowModalTransportasi] = useState(false);
  const [editingTransportasi, setEditingTransportasi] = useState<MasterJenisTransportasi | null>(null);
  const [isSubmittingTransportasi, setIsSubmittingTransportasi] = useState(false);

  // ── CONFIRM DIALOG STATE ────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: async () => {},
  });

  // ── REACT HOOK FORM: KATEGORI ──────────────────────────────
  const formKategori = useForm<KategoriFormValues>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: {
      nama: '',
      kode: '',
      deskripsi: '',
      urutan: 1,
      is_active: true,
    },
  });

  // ── REACT HOOK FORM: TRANSPORTASI ──────────────────────────
  const formTransportasi = useForm<TransportasiFormValues>({
    resolver: zodResolver(transportasiSchema),
    defaultValues: {
      nama: '',
      kode: '',
      is_kendaraan_kampus: true,
      urutan: 1,
      is_active: true,
    },
  });

  // ── FETCH KATEGORI ─────────────────────────────────────────
  const fetchKategori = useCallback(async () => {
    if (!canRead) return;
    setLoadingKategori(true);
    try {
      const res: any = await simpegSuratTugasService.getKategoriList({
        page: pageKategori,
        limit: limitKategori,
        search: searchKategori || undefined,
        is_active: statusKategori !== '' ? statusKategori : undefined,
        sort_by: orderKategoriBy,
        sort_dir: orderKategoriDir,
      });

      if (res?.meta) {
        setKategoriList(res.data || []);
        setMetaKategori(res.meta);
      } else {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setKategoriList(items);
      }
    } catch {
      toast.error('Gagal memuat master kategori kegiatan');
    } finally {
      setLoadingKategori(false);
    }
  }, [
    canRead,
    pageKategori,
    limitKategori,
    searchKategori,
    statusKategori,
    orderKategoriBy,
    orderKategoriDir,
  ]);

  // ── FETCH TRANSPORTASI ─────────────────────────────────────
  const fetchTransportasi = useCallback(async () => {
    if (!canRead) return;
    setLoadingTransportasi(true);
    try {
      const res: any = await simpegSuratTugasService.getTransportasiList({
        page: pageTransportasi,
        limit: limitTransportasi,
        search: searchTransportasi || undefined,
        is_active: statusTransportasi !== '' ? statusTransportasi : undefined,
        is_kendaraan_kampus: filterKendaraanKampus !== '' ? filterKendaraanKampus : undefined,
        sort_by: orderTransportasiBy,
        sort_dir: orderTransportasiDir,
      });

      if (res?.meta) {
        setTransportasiList(res.data || []);
        setMetaTransportasi(res.meta);
      } else {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setTransportasiList(items);
      }
    } catch {
      toast.error('Gagal memuat master jenis transportasi');
    } finally {
      setLoadingTransportasi(false);
    }
  }, [
    canRead,
    pageTransportasi,
    limitTransportasi,
    searchTransportasi,
    statusTransportasi,
    filterKendaraanKampus,
    orderTransportasiBy,
    orderTransportasiDir,
  ]);

  useEffect(() => {
    if (activeTab === 'kategori') {
      fetchKategori();
    } else {
      fetchTransportasi();
    }
  }, [activeTab, fetchKategori, fetchTransportasi]);

  // ── HANDLERS: KATEGORI ─────────────────────────────────────
  const handleOpenCreateKategori = () => {
    setEditingKategori(null);
    formKategori.reset({
      nama: '',
      kode: '',
      deskripsi: '',
      urutan: (metaKategori?.total ?? kategoriList.length) + 1,
      is_active: true,
    });
    setShowModalKategori(true);
  };

  const handleOpenEditKategori = (item: MasterKategoriKegiatanTugas) => {
    setEditingKategori(item);
    formKategori.reset({
      nama: item.nama,
      kode: item.kode,
      deskripsi: item.deskripsi || '',
      urutan: item.urutan ?? 0,
      is_active: Boolean(item.is_active),
    });
    setShowModalKategori(true);
  };

  const onSubmitKategori = async (values: KategoriFormValues) => {
    setIsSubmittingKategori(true);
    try {
      if (editingKategori) {
        await simpegSuratTugasService.updateKategori(editingKategori.id, values);
        toast.success('Kategori kegiatan berhasil diperbarui');
      } else {
        await simpegSuratTugasService.createKategori(values);
        toast.success('Kategori kegiatan baru berhasil ditambahkan');
      }
      setShowModalKategori(false);
      fetchKategori();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori kegiatan');
    } finally {
      setIsSubmittingKategori(false);
    }
  };

  const handleDeleteKategori = (item: MasterKategoriKegiatanTugas) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Kategori Kegiatan',
      message: `Apakah Anda yakin ingin menghapus kategori "${item.nama}" (${item.kode})? Surat tugas yang telah merujuk kategori ini mungkin terpengaruh.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegSuratTugasService.deleteKategori(item.id);
          toast.success('Kategori kegiatan berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchKategori();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus kategori kegiatan');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // ── HANDLERS: TRANSPORTASI ─────────────────────────────────
  const handleOpenCreateTransportasi = () => {
    setEditingTransportasi(null);
    formTransportasi.reset({
      nama: '',
      kode: '',
      is_kendaraan_kampus: true,
      urutan: (metaTransportasi?.total ?? transportasiList.length) + 1,
      is_active: true,
    });
    setShowModalTransportasi(true);
  };

  const handleOpenEditTransportasi = (item: MasterJenisTransportasi) => {
    setEditingTransportasi(item);
    formTransportasi.reset({
      nama: item.nama,
      kode: item.kode,
      is_kendaraan_kampus: Boolean(item.is_kendaraan_kampus),
      urutan: item.urutan ?? 0,
      is_active: Boolean(item.is_active),
    });
    setShowModalTransportasi(true);
  };

  const onSubmitTransportasi = async (values: TransportasiFormValues) => {
    setIsSubmittingTransportasi(true);
    try {
      if (editingTransportasi) {
        await simpegSuratTugasService.updateTransportasi(editingTransportasi.id, values);
        toast.success('Moda transportasi berhasil diperbarui');
      } else {
        await simpegSuratTugasService.createTransportasi(values);
        toast.success('Moda transportasi baru berhasil ditambahkan');
      }
      setShowModalTransportasi(false);
      fetchTransportasi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan moda transportasi');
    } finally {
      setIsSubmittingTransportasi(false);
    }
  };

  const handleDeleteTransportasi = (item: MasterJenisTransportasi) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Moda Transportasi',
      message: `Apakah Anda yakin ingin menghapus moda transportasi "${item.nama}" (${item.kode})? Data surat tugas terkait mungkin terpengaruh.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegSuratTugasService.deleteTransportasi(item.id);
          toast.success('Moda transportasi berhasil dihapus');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchTransportasi();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus moda transportasi');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // ── TABLE COLUMNS: KATEGORI ────────────────────────────────
  const columnsKategori: ColumnDef<MasterKategoriKegiatanTugas>[] = useMemo(
    () => [
      {
        key: 'urutan',
        label: 'No. Urut',
        align: 'center',
        render: (row) => (
          <span className="font-bold text-slate-700 text-sm">{row.urutan ?? '-'}</span>
        ),
      },
      {
        key: 'nama',
        label: 'Nama Kategori Kegiatan',
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900 text-sm">{row.nama}</div>
            <div className="text-xs font-mono text-slate-500">{row.kode}</div>
          </div>
        ),
      },
      {
        key: 'deskripsi',
        label: 'Deskripsi / Catatan',
        render: (row) => (
          <span className="text-xs text-slate-600 line-clamp-2">
            {row.deskripsi || '-'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (row) => (
          <Badge variant={row.is_active ? 'green' : 'gray'}>
            {row.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        ),
      },
      {
        key: 'aksi',
        label: 'Aksi',
        align: 'right',
        render: (row) => {
          if (!canManage) return null;
          return (
            <div className="flex justify-end">
              <DropdownMenu
                items={[
                  {
                    label: 'Ubah Data',
                    icon: <Edit2 size={14} />,
                    onClick: () => handleOpenEditKategori(row),
                  },
                  {
                    label: 'Hapus Kategori',
                    icon: <Trash2 size={14} />,
                    onClick: () => handleDeleteKategori(row),
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage]
  );

  // ── TABLE COLUMNS: TRANSPORTASI ────────────────────────────
  const columnsTransportasi: ColumnDef<MasterJenisTransportasi>[] = useMemo(
    () => [
      {
        key: 'urutan',
        label: 'No. Urut',
        align: 'center',
        render: (row) => (
          <span className="font-bold text-slate-700 text-sm">{row.urutan ?? '-'}</span>
        ),
      },
      {
        key: 'nama',
        label: 'Nama Moda Transportasi',
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900 text-sm">{row.nama}</div>
            <div className="text-xs font-mono text-slate-500">{row.kode}</div>
          </div>
        ),
      },
      {
        key: 'is_kendaraan_kampus',
        label: 'Tipe Kepemilikan',
        render: (row) => (
          <Badge variant={row.is_kendaraan_kampus ? 'blue' : 'gray'}>
            {row.is_kendaraan_kampus ? 'Armada Dinas Kampus' : 'Transportasi Umum / Pribadi'}
          </Badge>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (row) => (
          <Badge variant={row.is_active ? 'green' : 'gray'}>
            {row.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        ),
      },
      {
        key: 'aksi',
        label: 'Aksi',
        align: 'right',
        render: (row) => {
          if (!canManage) return null;
          return (
            <div className="flex justify-end">
              <DropdownMenu
                items={[
                  {
                    label: 'Ubah Data',
                    icon: <Edit2 size={14} />,
                    onClick: () => handleOpenEditTransportasi(row),
                  },
                  {
                    label: 'Hapus Moda',
                    icon: <Trash2 size={14} />,
                    onClick: () => handleDeleteTransportasi(row),
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage]
  );

  // Akses Ditolak
  if (!canRead) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Master Penugasan Dinas & Transportasi"
          description="Akses ditolak"
          backUrl="/simpeg/surat-tugas"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <ShieldAlert size={56} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">Akses Terbatas</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk mengelola master data
            penugasan dinas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Master Penugasan & Transportasi Dinas"
        description="Kelola kategori kegiatan kedinasan serta daftar moda armada transportasi kampus dan eksternal secara dinamis tanpa tergantung seeder."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/surat-tugas')}
            >
              Kembali ke Surat Tugas
            </Button>
            {activeTab === 'kategori' && (
              <>
                <Button
                  variant="outline"
                  icon={<Filter size={16} />}
                  onClick={() => setShowFilterKategori(true)}
                >
                  Filter
                </Button>
                {canManage && (
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenCreateKategori}
                  >
                    Tambah Kategori
                  </Button>
                )}
              </>
            )}
            {activeTab === 'transportasi' && (
              <>
                <Button
                  variant="outline"
                  icon={<Filter size={16} />}
                  onClick={() => setShowFilterTransportasi(true)}
                >
                  Filter
                </Button>
                {canManage && (
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenCreateTransportasi}
                  >
                    Tambah Moda Transportasi
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('kategori')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'kategori'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={16} /> Kategori Kegiatan Tugas (
          {metaKategori?.total ?? kategoriList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transportasi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'transportasi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Car size={16} /> Moda & Armada Transportasi (
          {metaTransportasi?.total ?? transportasiList.length})
        </button>
      </div>

      {/* TAB 1: KATEGORI KEGIATAN */}
      {activeTab === 'kategori' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Kategori Kegiatan Tugas Dinas
              </h2>
              <p className="text-xs text-slate-500">
                Digunakan sebagai opsi pilihan kategori pada form pengajuan surat tugas dinas
                pegawai & dosen.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total: <strong>{metaKategori?.total ?? kategoriList.length}</strong> Kategori
            </div>
          </div>

          <DataTable
            columns={columnsKategori}
            data={kategoriList}
            isLoading={loadingKategori}
            meta={metaKategori}
            onPageChange={(p) => setPageKategori(p)}
            onLimitChange={(l) => {
              setLimitKategori(l);
              setPageKategori(1);
            }}
            emptyMessage="Belum ada data kategori kegiatan tugas. Klik tombol 'Tambah Kategori' di atas untuk membuat kategori baru."
          />
        </div>
      )}

      {/* TAB 2: MODA TRANSPORTASI */}
      {activeTab === 'transportasi' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Moda Transportasi & Armada Dinas
              </h2>
              <p className="text-xs text-slate-500">
                Digunakan sebagai opsi moda transportasi perjalanan dinas (kendaraan kampus, umum,
                atau pribadi).
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total: <strong>{metaTransportasi?.total ?? transportasiList.length}</strong> Moda
            </div>
          </div>

          <DataTable
            columns={columnsTransportasi}
            data={transportasiList}
            isLoading={loadingTransportasi}
            meta={metaTransportasi}
            onPageChange={(p) => setPageTransportasi(p)}
            onLimitChange={(l) => {
              setLimitTransportasi(l);
              setPageTransportasi(1);
            }}
            emptyMessage="Belum ada data moda transportasi. Klik tombol 'Tambah Moda Transportasi' di atas untuk membuat data baru."
          />
        </div>
      )}

      {/* DRAWER FILTER: TAB 1 (KATEGORI) */}
      <Drawer
        isOpen={showFilterKategori}
        onClose={() => setShowFilterKategori(false)}
        title="Filter Kategori Kegiatan"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pencarian Kata Kunci
            </label>
            <Input
              placeholder="Cari nama atau kode..."
              value={searchKategori}
              onChange={(e) => setSearchKategori(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Keaktifan
            </label>
            <Select
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'true', label: 'Hanya Aktif' },
                { value: 'false', label: 'Hanya Nonaktif' },
              ]}
              value={statusKategori}
              onChange={(val) => setStatusKategori(val || '')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urutkan Berdasarkan
              </label>
              <Select
                options={[
                  { value: 'urutan', label: 'No. Urutan' },
                  { value: 'nama', label: 'Nama Kategori' },
                  { value: 'id', label: 'ID Kategori' },
                  { value: 'created_at', label: 'Tanggal Dibuat' },
                ]}
                value={orderKategoriBy}
                onChange={(val) => setOrderKategoriBy(val || 'urutan')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arah Urutan
              </label>
              <Select
                options={[
                  { value: 'asc', label: 'Menaik (A-Z / 1-9)' },
                  { value: 'desc', label: 'Menurun (Z-A / 9-1)' },
                ]}
                value={orderKategoriDir}
                onChange={(val) => setOrderKategoriDir((val as 'asc' | 'desc') || 'asc')}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchKategori('');
                setStatusKategori('');
                setOrderKategoriBy('urutan');
                setOrderKategoriDir('asc');
                setPageKategori(1);
              }}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setPageKategori(1);
                setShowFilterKategori(false);
                fetchKategori();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* DRAWER FILTER: TAB 2 (TRANSPORTASI) */}
      <Drawer
        isOpen={showFilterTransportasi}
        onClose={() => setShowFilterTransportasi(false)}
        title="Filter Moda Transportasi"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pencarian Kata Kunci
            </label>
            <Input
              placeholder="Cari nama moda atau kode..."
              value={searchTransportasi}
              onChange={(e) => setSearchTransportasi(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kepemilikan Armada
            </label>
            <Select
              options={[
                { value: '', label: 'Semua Moda' },
                { value: 'true', label: 'Armada Dinas Kampus' },
                { value: 'false', label: 'Transportasi Umum / Pribadi' },
              ]}
              value={filterKendaraanKampus}
              onChange={(val) => setFilterKendaraanKampus(val || '')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Keaktifan
            </label>
            <Select
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'true', label: 'Hanya Aktif' },
                { value: 'false', label: 'Hanya Nonaktif' },
              ]}
              value={statusTransportasi}
              onChange={(val) => setStatusTransportasi(val || '')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urutkan Berdasarkan
              </label>
              <Select
                options={[
                  { value: 'urutan', label: 'No. Urutan' },
                  { value: 'nama', label: 'Nama Moda' },
                  { value: 'id', label: 'ID Moda' },
                  { value: 'created_at', label: 'Tanggal Dibuat' },
                ]}
                value={orderTransportasiBy}
                onChange={(val) => setOrderTransportasiBy(val || 'urutan')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arah Urutan
              </label>
              <Select
                options={[
                  { value: 'asc', label: 'Menaik (A-Z / 1-9)' },
                  { value: 'desc', label: 'Menurun (Z-A / 9-1)' },
                ]}
                value={orderTransportasiDir}
                onChange={(val) => setOrderTransportasiDir((val as 'asc' | 'desc') || 'asc')}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchTransportasi('');
                setStatusTransportasi('');
                setFilterKendaraanKampus('');
                setOrderTransportasiBy('urutan');
                setOrderTransportasiDir('asc');
                setPageTransportasi(1);
              }}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setPageTransportasi(1);
                setShowFilterTransportasi(false);
                fetchTransportasi();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* MODAL: KATEGORI (CREATE / EDIT) */}
      <Modal
        open={showModalKategori}
        onClose={() => setShowModalKategori(false)}
        title={editingKategori ? 'Ubah Kategori Kegiatan' : 'Tambah Kategori Kegiatan'}
        size="md"
      >
        <form onSubmit={formKategori.handleSubmit(onSubmitKategori)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Kategori Kegiatan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Rapat Koordinasi Dinas Luar"
                {...formKategori.register('nama')}
                error={formKategori.formState.errors.nama?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kode Kategori <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: RAKOR_DINAS"
                {...formKategori.register('kode')}
                error={formKategori.formState.errors.kode?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. Urutan Tampilan <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="1"
                {...formKategori.register('urutan', { valueAsNumber: true })}
                error={formKategori.formState.errors.urutan?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Deskripsi / Catatan Lingkup Kegiatan
              </label>
              <Input
                placeholder="Penjelasan singkat kategori kegiatan..."
                {...formKategori.register('deskripsi')}
                error={formKategori.formState.errors.deskripsi?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <Controller
                control={formKategori.control}
                name="is_active"
                render={({ field }) => (
                  <Select
                    options={[
                      { value: '1', label: 'Aktif (Muncul di Form Pengajuan)' },
                      { value: '0', label: 'Nonaktif (Disembunyikan)' },
                    ]}
                    value={field.value ? '1' : '0'}
                    onChange={(val) => field.onChange(val === '1')}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModalKategori(false)}
              disabled={isSubmittingKategori}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmittingKategori}>
              {editingKategori ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TRANSPORTASI (CREATE / EDIT) */}
      <Modal
        open={showModalTransportasi}
        onClose={() => setShowModalTransportasi(false)}
        title={editingTransportasi ? 'Ubah Moda Transportasi' : 'Tambah Moda Transportasi'}
        size="md"
      >
        <form onSubmit={formTransportasi.handleSubmit(onSubmitTransportasi)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Moda Transportasi <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Mobil Dinas Kampus / Pesawat Terbang"
                {...formTransportasi.register('nama')}
                error={formTransportasi.formState.errors.nama?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kode Moda <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: MOBIL_KAMPUS"
                {...formTransportasi.register('kode')}
                error={formTransportasi.formState.errors.kode?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. Urutan Tampilan <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="1"
                {...formTransportasi.register('urutan', { valueAsNumber: true })}
                error={formTransportasi.formState.errors.urutan?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kepemilikan Armada
              </label>
              <Controller
                control={formTransportasi.control}
                name="is_kendaraan_kampus"
                render={({ field }) => (
                  <Select
                    options={[
                      { value: '1', label: 'Armada Dinas Kampus (Ada Driver & Nopol)' },
                      { value: '0', label: 'Transportasi Umum / Pribadi' },
                    ]}
                    value={field.value ? '1' : '0'}
                    onChange={(val) => field.onChange(val === '1')}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <Controller
                control={formTransportasi.control}
                name="is_active"
                render={({ field }) => (
                  <Select
                    options={[
                      { value: '1', label: 'Aktif (Muncul di Form Pengajuan)' },
                      { value: '0', label: 'Nonaktif (Disembunyikan)' },
                    ]}
                    value={field.value ? '1' : '0'}
                    onChange={(val) => field.onChange(val === '1')}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModalTransportasi(false)}
              disabled={isSubmittingTransportasi}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmittingTransportasi}>
              {editingTransportasi ? 'Simpan Perubahan' : 'Tambah Moda'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG HAPUS */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        isLoading={deleteConfirm.isLoading}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
      />
    </div>
  );
}
