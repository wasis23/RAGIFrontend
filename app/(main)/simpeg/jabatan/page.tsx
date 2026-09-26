'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Briefcase, Plus, Filter, Award, Layers, Edit2, Trash2, ShieldAlert } from 'lucide-react';
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
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type {
  Jabatan,
  JabatanFungsionalAkademik,
  MasterGolonganPangkat,
  UnitKerja,
  TipeJabatan,
} from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const jabatanSchema = z.object({
  nama: z.string().min(1, 'Nama Jabatan wajib diisi'),
  tipe: z.enum(['struktural', 'fungsional', 'teknis'], {
    message: 'Tipe Jabatan wajib dipilih',
  }),
  level_jabatan: z.number().min(1, 'Level Jabatan minimal 1'),
  unit_kerja_id: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type JabatanFormValues = z.infer<typeof jabatanSchema>;

const jafungSchema = z.object({
  nama: z.string().min(1, 'Nama Jabatan Fungsional wajib diisi'),
  golongan: z.string().min(1, 'Jenjang Golongan wajib dipilih'),
  angka_kredit_min: z.number().min(0, 'Min KUM minimal 0'),
  angka_kredit_max: z.number().min(0, 'Max KUM minimal 0'),
});

type JafungFormValues = z.infer<typeof jafungSchema>;

const golonganSchema = z.object({
  kode: z.string().min(1, 'Kode Golongan (misal: III/a) wajib diisi'),
  nama: z.string().min(1, 'Nama Jenjang / Golongan wajib diisi'),
  pangkat: z.string().optional().nullable(),
  ruang: z.string().optional().nullable(),
  urutan: z.number().min(0, 'Urutan minimal 0'),
  is_active: z.boolean(),
});

type GolonganFormValues = z.infer<typeof golonganSchema>;

export default function JabatanPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.jabatan.read') || hasPermission('simpeg.jabatan.manage');
  const canCreate = hasPermission('simpeg.jabatan.create') || hasPermission('simpeg.jabatan.manage');
  const canUpdate = hasPermission('simpeg.jabatan.update') || hasPermission('simpeg.jabatan.manage');
  const canDelete = hasPermission('simpeg.jabatan.delete') || hasPermission('simpeg.jabatan.manage');

  const [activeTab, setActiveTab] = useState<'jabatan' | 'jafung' | 'golongan'>('jabatan');
  const [loading, setLoading] = useState(true);
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [golonganList, setGolonganList] = useState<MasterGolonganPangkat[]>([]);
  // Filter & Pagination state for Jafung
  const [searchJafung, setSearchJafung] = useState('');
  const [filterJafungGolongan, setFilterJafungGolongan] = useState('');
  const [filterJafungSortBy, setFilterJafungSortBy] = useState('nama');
  const [filterJafungSortDir, setFilterJafungSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageJafung, setPageJafung] = useState(1);
  const [limitJafung, setLimitJafung] = useState(15);

  // Pagination & Metadata
  const [metaJabatan, setMetaJabatan] = useState<PaginationMeta | undefined>();
  const [metaJafung, setMetaJafung] = useState<PaginationMeta | undefined>();
  const [metaGolongan, setMetaGolongan] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state for Jabatan
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Filter & Pagination state for Golongan
  const [searchGolongan, setSearchGolongan] = useState('');
  const [filterGolonganKode, setFilterGolonganKode] = useState('');
  const [filterGolonganNama, setFilterGolonganNama] = useState('');
  const [filterGolonganPangkat, setFilterGolonganPangkat] = useState('');
  const [filterGolonganRuang, setFilterGolonganRuang] = useState('');
  const [filterGolonganUrutan, setFilterGolonganUrutan] = useState('');
  const [filterGolonganActive, setFilterGolonganActive] = useState('');
  const [filterGolonganSortBy, setFilterGolonganSortBy] = useState('urutan');
  const [filterGolonganSortDir, setFilterGolonganSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageGolongan, setPageGolongan] = useState(1);
  const [limitGolongan, setLimitGolongan] = useState(15);

  // Dynamic Golongan Options for Jafung dropdown
  const [golonganOptions, setGolonganOptions] = useState<{ value: string; label: string }[]>([]);

  // Modal State for Jabatan
  const [showModalJabatan, setShowModalJabatan] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState<Jabatan | null>(null);
  const [selectedUnitOption, setSelectedUnitOption] = useState<OptionType | null>(null);
  const [isSubmittingJabatan, setIsSubmittingJabatan] = useState(false);

  // Modal State for Jafung
  const [showModalJafung, setShowModalJafung] = useState(false);
  const [isSubmittingJafung, setIsSubmittingJafung] = useState(false);

  // Modal State for Golongan
  const [showModalGolongan, setShowModalGolongan] = useState(false);
  const [editingGolongan, setEditingGolongan] = useState<MasterGolonganPangkat | null>(null);
  const [isSubmittingGolongan, setIsSubmittingGolongan] = useState(false);

  // Dialog Konfirmasi Hapus
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

  // Form Jabatan
  const {
    register: registerJabatan,
    handleSubmit: handleSubmitJabatanForm,
    control: controlJabatan,
    reset: resetJabatan,
    formState: { errors: errorsJabatan },
  } = useForm<JabatanFormValues>({
    resolver: zodResolver(jabatanSchema),
    defaultValues: {
      nama: '',
      tipe: 'struktural',
      level_jabatan: 2,
      unit_kerja_id: '',
      is_active: true,
    },
  });

  // Form Jafung
  const {
    register: registerJafung,
    handleSubmit: handleSubmitJafungForm,
    control: controlJafung,
    reset: resetJafung,
    formState: { errors: errorsJafung },
  } = useForm<JafungFormValues>({
    resolver: zodResolver(jafungSchema),
    defaultValues: {
      nama: '',
      golongan: '',
      angka_kredit_min: 100,
      angka_kredit_max: 150,
    },
  });

  // Form Golongan
  const {
    register: registerGolongan,
    handleSubmit: handleSubmitGolonganForm,
    control: controlGolongan,
    reset: resetGolongan,
    formState: { errors: errorsGolongan },
  } = useForm<GolonganFormValues>({
    resolver: zodResolver(golonganSchema),
    defaultValues: {
      kode: '',
      nama: '',
      pangkat: '',
      ruang: '',
      urutan: 1,
      is_active: true,
    },
  });

  // Fetch dynamic master golongan options for JAFUNG modal
  const fetchGolonganOptions = useCallback(async () => {
    try {
      const res = await simpegService.getGolonganPangkatOptions();
      const raw = res?.data || [];
      const opts = raw.map((item: any) => ({
        value: item.value || item.kode,
        label: `${item.label || item.nama} (${item.value || item.kode})`,
      }));
      setGolonganOptions(opts);
      if (opts.length > 0 && !controlJafung._formValues.golongan) {
        resetJafung((prev) => ({ ...prev, golongan: opts[0].value }));
      }
    } catch (err) {
      console.error('Gagal memuat opsi golongan jafung', err);
    }
  }, [controlJafung._formValues.golongan, resetJafung]);

  // Load Data Golongan Server-Side
  const loadGolonganData = useCallback(async () => {
    if (!canRead) return;
    try {
      const combinedSearch = [
        searchGolongan,
        filterGolonganKode,
        filterGolonganNama,
        filterGolonganPangkat,
        filterGolonganUrutan,
      ].filter(Boolean).join(' ') || undefined;

      const res = await simpegService.getMasterGolonganPangkatList({
        page: pageGolongan,
        per_page: limitGolongan,
        search: combinedSearch,
        ruang: filterGolonganRuang || undefined,
        is_active: filterGolonganActive !== '' ? filterGolonganActive : undefined,
        sort_by: filterGolonganSortBy,
        sort_order: filterGolonganSortDir,
      });

      if (res?.data) {
        setGolonganList(res.data);
        if (res.meta) {
          setMetaGolongan(res.meta);
        }
      }
    } catch (err) {
      console.error('Gagal memuat master golongan pangkat', err);
    }
  }, [canRead, pageGolongan, limitGolongan, searchGolongan, filterGolonganKode, filterGolonganNama, filterGolonganPangkat, filterGolonganUrutan, filterGolonganRuang, filterGolonganActive, filterGolonganSortBy, filterGolonganSortDir]);

  // Load Data Jafung Server-Side
  const loadJafungData = useCallback(async () => {
    if (!canRead) return;
    try {
      const res = await simpegService.getJabatanFungsionalList({
        page: pageJafung,
        limit: limitJafung,
        search: searchJafung || undefined,
        golongan: filterJafungGolongan || undefined,
        sort_by: filterJafungSortBy,
        sort_dir: filterJafungSortDir,
      });

      if (res?.data) {
        setJafungList(res.data);
        if (res.meta) {
          setMetaJafung(res.meta);
        }
      }
    } catch (err) {
      console.error('Gagal memuat master JAFUNG', err);
    }
  }, [canRead, pageJafung, limitJafung, searchJafung, filterJafungGolongan, filterJafungSortBy, filterJafungSortDir]);

  const loadData = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const resJab: any = await simpegService.getJabatanList({
        page,
        limit,
        search: search || undefined,
        tipe: filterTipe || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      // Handle Jabatan Data
      if (resJab?.meta) {
        setJabatanList(resJab.data || []);
        setMetaJabatan(resJab.meta);
      } else {
        let itemsJab: Jabatan[] = Array.isArray(resJab?.data) ? resJab.data : Array.isArray(resJab) ? resJab : [];
        if (search) {
          const q = search.toLowerCase();
          itemsJab = itemsJab.filter((j) => j.nama.toLowerCase().includes(q));
        }
        if (filterTipe) {
          itemsJab = itemsJab.filter((j) => j.tipe === filterTipe);
        }

        itemsJab.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = itemsJab.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedJab = itemsJab.slice(startIndex, startIndex + limit);

        setJabatanList(paginatedJab);
        setMetaJabatan({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }

      // Load Jafung & Golongan Server-Side
      await loadJafungData();
      await loadGolonganData();
      await fetchGolonganOptions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Jabatan');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterTipe, filterOrderBy, filterOrderDir, loadJafungData, loadGolonganData, fetchGolonganOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch golongan when its filters change
  useEffect(() => {
    if (activeTab === 'golongan') {
      loadGolonganData();
    }
  }, [activeTab, loadGolonganData]);

  // Refetch jafung when its filters change
  useEffect(() => {
    if (activeTab === 'jafung') {
      loadJafungData();
    }
  }, [activeTab, loadJafungData]);

  // Async loader for Unit Kerja AsyncSelect
  const loadUnitKerjaOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getUnitKerjaList();
      const units: UnitKerja[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = units.filter(
        (u: UnitKerja) =>
          u.nama.toLowerCase().includes(inputValue.toLowerCase()) ||
          u.kode.toLowerCase().includes(inputValue.toLowerCase())
      );
      return filtered.map((u: UnitKerja) => ({
        value: u.id.toString(),
        label: `[${u.kode}] ${u.nama}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi unit kerja', err);
      return [];
    }
  }, []);

  const handleOpenCreateJabatan = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Jabatan.');
      return;
    }
    setEditingJabatan(null);
    setSelectedUnitOption(null);
    resetJabatan({
      nama: '',
      tipe: 'struktural',
      level_jabatan: 2,
      unit_kerja_id: '',
      is_active: true,
    });
    setShowModalJabatan(true);
  };

  const handleOpenEditJabatan = (j: Jabatan) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit Jabatan.');
      return;
    }
    setEditingJabatan(j);

    if (j.unit_kerja) {
      setSelectedUnitOption({
        value: j.unit_kerja.id.toString(),
        label: `[${j.unit_kerja.kode}] ${j.unit_kerja.nama}`,
      });
    } else if (j.unit_kerja_id) {
      setSelectedUnitOption({
        value: j.unit_kerja_id.toString(),
        label: `[ID ${j.unit_kerja_id}] Unit Kerja`,
      });
    } else {
      setSelectedUnitOption(null);
    }

    resetJabatan({
      nama: j.nama,
      tipe: j.tipe,
      level_jabatan: j.level_jabatan,
      unit_kerja_id: j.unit_kerja_id ? j.unit_kerja_id.toString() : '',
      is_active: j.is_active,
    });
    setShowModalJabatan(true);
  };

  const onSubmitJabatan = async (values: JabatanFormValues) => {
    if (editingJabatan && !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Jabatan.');
      return;
    }
    if (!editingJabatan && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Jabatan.');
      return;
    }

    setIsSubmittingJabatan(true);
    try {
      const payload = {
        unit_kerja_id: values.unit_kerja_id ? Number(values.unit_kerja_id) : null,
        nama: values.nama,
        tipe: values.tipe as TipeJabatan,
        level_jabatan: values.level_jabatan,
        is_active: values.is_active,
      };

      if (editingJabatan) {
        await simpegService.updateJabatan(editingJabatan.id, payload);
        toast.success('Jabatan berhasil diperbarui!');
      } else {
        await simpegService.createJabatan(payload);
        toast.success('Jabatan berhasil ditambahkan!');
      }

      setShowModalJabatan(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Jabatan');
    } finally {
      setIsSubmittingJabatan(false);
    }
  };

  const handleDeleteJabatan = (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Jabatan.');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Jabatan Organisasi',
      message: `Apakah Anda yakin ingin menghapus jabatan "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteJabatan(id);
          toast.success('Jabatan berhasil dihapus!');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Gagal menghapus Jabatan');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const onSubmitJafung = async (values: JafungFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah JAFUNG.');
      return;
    }

    setIsSubmittingJafung(true);
    try {
      await simpegService.createJabatanFungsional({
        nama: values.nama,
        golongan: values.golongan,
        angka_kredit_min: values.angka_kredit_min,
        angka_kredit_max: values.angka_kredit_max,
      });
      toast.success('Jabatan Fungsional Dosen berhasil ditambahkan!');
      setShowModalJafung(false);
      resetJafung();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan Jafung');
    } finally {
      setIsSubmittingJafung(false);
    }
  };

  // ── GOLONGAN CRUD HANDLERS ──
  const handleOpenCreateGolongan = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Master Golongan.');
      return;
    }
    setEditingGolongan(null);
    resetGolongan({
      kode: '',
      nama: '',
      pangkat: '',
      ruang: '',
      urutan: (metaGolongan?.total ?? golonganList.length) + 1,
      is_active: true,
    });
    setShowModalGolongan(true);
  };

  const handleOpenEditGolongan = (g: MasterGolonganPangkat) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit Master Golongan.');
      return;
    }
    setEditingGolongan(g);
    resetGolongan({
      kode: g.kode,
      nama: g.nama,
      pangkat: g.pangkat || '',
      ruang: g.ruang || '',
      urutan: g.urutan,
      is_active: g.is_active,
    });
    setShowModalGolongan(true);
  };

  const onSubmitGolongan = async (values: GolonganFormValues) => {
    setIsSubmittingGolongan(true);
    try {
      const payload: Partial<MasterGolonganPangkat> = {
        kode: values.kode,
        nama: values.nama,
        pangkat: values.pangkat || null,
        ruang: values.ruang || null,
        urutan: values.urutan,
        is_active: values.is_active,
      };

      if (editingGolongan) {
        await simpegService.updateMasterGolonganPangkat(editingGolongan.id, payload);
        toast.success('Master Jenjang Golongan berhasil diperbarui!');
      } else {
        await simpegService.createMasterGolonganPangkat(payload);
        toast.success('Master Jenjang Golongan berhasil ditambahkan!');
      }

      setShowModalGolongan(false);
      loadGolonganData();
      fetchGolonganOptions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Master Golongan');
    } finally {
      setIsSubmittingGolongan(false);
    }
  };

  const handleDeleteGolongan = (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Master Golongan.');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Jenjang Golongan & Pangkat',
      message: `Apakah Anda yakin ingin menghapus data golongan "${nama}"? Data akan disembunyikan secara aman (soft delete).`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deleteMasterGolonganPangkat(id);
          toast.success('Master Golongan berhasil dihapus!');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadGolonganData();
          fetchGolonganOptions();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Gagal menghapus Master Golongan');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Columns for Jabatan DataTable
  const columnsJabatan: ColumnDef<Jabatan>[] = [
    {
      key: 'nama',
      label: 'Nama Jabatan',
      render: (row) => <span className="font-bold text-slate-900">{row.nama}</span>,
    },
    {
      key: 'tipe',
      label: 'Tipe Jabatan',
      render: (row) => (
        <Badge variant="purple" className="uppercase">
          {row.tipe}
        </Badge>
      ),
    },
    {
      key: 'unit_kerja',
      label: 'Unit Kerja',
      render: (row) => (
        <span className="text-slate-700">
          {row.unit_kerja?.nama || (row.unit_kerja_id ? `ID ${row.unit_kerja_id}` : 'Lintas Unit')}
        </span>
      ),
    },
    {
      key: 'level_jabatan',
      label: 'Level',
      render: (row) => (
        <span className="font-mono font-medium text-slate-800">
          Level {row.level_jabatan}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Non-Aktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems = [];
        if (canUpdate) {
          menuItems.push({
            label: 'Ubah Jabatan',
            icon: <Edit2 size={14} />,
            onClick: () => handleOpenEditJabatan(row),
          });
        }
        if (canDelete) {
          menuItems.push({
            label: 'Hapus Jabatan',
            icon: <Trash2 size={14} />,
            variant: 'danger' as const,
            onClick: () => handleDeleteJabatan(row.id, row.nama),
          });
        }

        if (menuItems.length === 0) return '-';

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  // Columns for Jafung DataTable
  const columnsJafung: ColumnDef<JabatanFungsionalAkademik>[] = [
    {
      key: 'nama',
      label: 'Nama Jenjang JAFUNG',
      render: (row) => <span className="font-bold text-slate-900">{row.nama}</span>,
    },
    {
      key: 'golongan',
      label: 'Jenjang / Golongan',
      render: (row) => (
        <Badge variant="blue" className="uppercase">
          {row.golongan.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'angka_kredit_min',
      label: 'Min KUM',
      render: (row) => <span className="font-bold text-slate-800 font-mono">{row.angka_kredit_min} KUM</span>,
    },
    {
      key: 'angka_kredit_max',
      label: 'Max KUM',
      render: (row) => <span className="font-bold text-slate-800 font-mono">{row.angka_kredit_max} KUM</span>,
    },
  ];

  // Columns for Golongan DataTable
  const columnsGolongan: ColumnDef<MasterGolonganPangkat>[] = [
    {
      key: 'urutan',
      label: 'No. Urut',
      render: (row) => <span className="font-mono text-slate-600">{row.urutan}</span>,
    },
    {
      key: 'kode',
      label: 'Kode Golongan',
      render: (row) => <span className="font-bold font-mono text-slate-900">{row.kode}</span>,
    },
    {
      key: 'nama',
      label: 'Nama Jenjang / Pangkat',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.nama}</div>
          {row.pangkat && <div className="text-2xs text-slate-500">{row.pangkat}</div>}
        </div>
      ),
    },
    {
      key: 'ruang',
      label: 'Ruang',
      render: (row) => <span className="font-medium text-slate-700">{row.ruang || '-'}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Aktif' : 'Non-Aktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems = [];
        if (canUpdate) {
          menuItems.push({
            label: 'Ubah Golongan',
            icon: <Edit2 size={14} />,
            onClick: () => handleOpenEditGolongan(row),
          });
        }
        if (canDelete) {
          menuItems.push({
            label: 'Hapus Golongan',
            icon: <Trash2 size={14} />,
            variant: 'danger' as const,
            onClick: () => handleDeleteGolongan(row.id, row.nama),
          });
        }

        if (menuItems.length === 0) return '-';

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Master Jabatan & Jenjang Fungsional (JAFUNG)"
          description="Pengelolaan struktur jabatan struktural, fungsional, teknis, serta jenjang jabatan fungsional akademik dosen (KUM)"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Anda tidak memiliki permission untuk melihat data Master Jabatan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Jabatan & Jenjang Fungsional (JAFUNG)"
        description="Kelola struktur jabatan struktural, fungsional, teknis, jenjang Jabatan Fungsional Akademik (JAFUNG Dosen), dan Master Jenjang Golongan/Pangkat"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button
                icon={<Plus size={16} />}
                onClick={() => {
                  if (activeTab === 'jabatan') handleOpenCreateJabatan();
                  else if (activeTab === 'jafung') setShowModalJafung(true);
                  else handleOpenCreateGolongan();
                }}
              >
                {activeTab === 'jabatan'
                  ? 'Tambah Jabatan'
                  : activeTab === 'jafung'
                  ? 'Tambah Jenjang Jafung'
                  : 'Tambah Golongan'}
              </Button>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('jabatan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'jabatan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase size={16} /> Struktur Jabatan Organisasi ({metaJabatan?.total ?? jabatanList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jafung')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'jafung'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Award size={16} /> Jabatan Fungsional Akademik (JAFUNG) ({metaJafung?.total ?? jafungList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('golongan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'golongan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={16} /> Jenjang Golongan &amp; Pangkat ({metaGolongan?.total ?? golonganList.length})
        </button>
      </div>

      {/* ── TAB 1: JABATAN ORGANISASI ── */}
      {activeTab === 'jabatan' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsJabatan}
            data={jabatanList}
            isLoading={loading}
            meta={metaJabatan}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Briefcase size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada data jabatan organisasi yang terdaftar.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 2: JAFUNG DOSEN ── */}
      {activeTab === 'jafung' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsJafung}
            data={jafungList}
            isLoading={loading}
            meta={metaJafung}
            onPageChange={(newPage) => setPageJafung(newPage)}
            onLimitChange={(newLimit) => {
              setLimitJafung(newLimit);
              setPageJafung(1);
            }}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Award size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada master jenjang Jabatan Fungsional Akademik (JAFUNG) dosen.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 3: JENJANG GOLONGAN & PANGKAT ── */}
      {activeTab === 'golongan' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsGolongan}
            data={golonganList}
            isLoading={loading}
            meta={metaGolongan}
            onPageChange={(newPage) => setPageGolongan(newPage)}
            onLimitChange={(newLimit) => {
              setLimitGolongan(newLimit);
              setPageGolongan(1);
            }}
            emptyMessage={
              <div className="py-8 text-center text-slate-400">
                <Layers size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada data master jenjang golongan &amp; pangkat.</p>
              </div>
            }
          />
        </div>
      )}

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={
          activeTab === 'golongan'
            ? 'Filter & Urutkan Jenjang Golongan'
            : activeTab === 'jafung'
            ? 'Filter & Urutkan Jenjang JAFUNG'
            : 'Filter & Urutkan Jabatan'
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === 'golongan') {
                  setSearchGolongan('');
                  setFilterGolonganKode('');
                  setFilterGolonganNama('');
                  setFilterGolonganPangkat('');
                  setFilterGolonganRuang('');
                  setFilterGolonganUrutan('');
                  setFilterGolonganActive('');
                  setFilterGolonganSortBy('urutan');
                  setFilterGolonganSortDir('asc');
                  setPageGolongan(1);
                } else if (activeTab === 'jafung') {
                  setSearchJafung('');
                  setFilterJafungGolongan('');
                  setFilterJafungSortBy('nama');
                  setFilterJafungSortDir('asc');
                  setPageJafung(1);
                } else {
                  setSearch('');
                  setFilterTipe('');
                  setFilterOrderBy('nama');
                  setFilterOrderDir('asc');
                  setPage(1);
                }
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan Filter
            </Button>
          </div>
        }
      >
        {activeTab === 'golongan' ? (
          <div className="space-y-4">
            <Input
              label="Pencarian Bebas Golongan"
              placeholder="Cari III/a, Lektor, Pembina..."
              value={searchGolongan}
              onChange={(e) => {
                setSearchGolongan(e.target.value);
                setPageGolongan(1);
              }}
            />

            <Input
              label="Kode Golongan"
              placeholder="Contoh: III/a atau IV/b"
              value={filterGolonganKode}
              onChange={(e) => {
                setFilterGolonganKode(e.target.value);
                setPageGolongan(1);
              }}
            />

            <Input
              label="Nama Jenjang / Golongan"
              placeholder="Contoh: Lektor, Pembina..."
              value={filterGolonganNama}
              onChange={(e) => {
                setFilterGolonganNama(e.target.value);
                setPageGolongan(1);
              }}
            />

            <Input
              label="Pangkat"
              placeholder="Contoh: Penata Muda..."
              value={filterGolonganPangkat}
              onChange={(e) => {
                setFilterGolonganPangkat(e.target.value);
                setPageGolongan(1);
              }}
            />

            <Select
              label="Ruang Golongan"
              value={filterGolonganRuang}
              onChange={(val) => {
                setFilterGolonganRuang(val);
                setPageGolongan(1);
              }}
              options={[
                { value: '', label: 'Semua Ruang' },
                { value: 'a', label: 'Ruang a' },
                { value: 'b', label: 'Ruang b' },
                { value: 'c', label: 'Ruang c' },
                { value: 'd', label: 'Ruang d' },
                { value: 'e', label: 'Ruang e' },
              ]}
            />

            <Input
              label="No. Urut"
              type="number"
              placeholder="Contoh: 1"
              value={filterGolonganUrutan}
              onChange={(e) => {
                setFilterGolonganUrutan(e.target.value);
                setPageGolongan(1);
              }}
            />

            <Select
              label="Status Keaktifan"
              value={filterGolonganActive}
              onChange={(val) => {
                setFilterGolonganActive(val);
                setPageGolongan(1);
              }}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'true', label: 'Hanya Aktif' },
                { value: 'false', label: 'Hanya Non-Aktif' },
              ]}
            />

            <hr className="border-t border-slate-200 my-2" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urut Berdasarkan"
                value={filterGolonganSortBy}
                onChange={(val) => setFilterGolonganSortBy(val)}
                options={[
                  { value: 'urutan', label: 'Nomor Urut' },
                  { value: 'kode', label: 'Kode Golongan' },
                  { value: 'nama', label: 'Nama Jenjang / Golongan' },
                  { value: 'pangkat', label: 'Pangkat' },
                  { value: 'ruang', label: 'Ruang' },
                  { value: 'is_active', label: 'Status Keaktifan' },
                  { value: 'created_at', label: 'Waktu Input' },
                ]}
              />
              <Select
                label="Arah"
                value={filterGolonganSortDir}
                onChange={(val) => setFilterGolonganSortDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'A - Z (Naik)' },
                  { value: 'desc', label: 'Z - A (Turun)' },
                ]}
              />
            </div>
          </div>
        ) : activeTab === 'jafung' ? (
          <div className="space-y-4">
            <Input
              label="Pencarian Nama JAFUNG"
              placeholder="Cari Asisten Ahli, Lektor..."
              value={searchJafung}
              onChange={(e) => {
                setSearchJafung(e.target.value);
                setPageJafung(1);
              }}
            />

            <Input
              label="Jenjang / Golongan"
              placeholder="Cari Golongan..."
              value={filterJafungGolongan}
              onChange={(e) => {
                setFilterJafungGolongan(e.target.value);
                setPageJafung(1);
              }}
            />

            <hr className="border-t border-slate-200 my-2" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urut Berdasarkan"
                value={filterJafungSortBy}
                onChange={(val) => setFilterJafungSortBy(val)}
                options={[
                  { value: 'nama', label: 'Nama Jenjang JAFUNG' },
                  { value: 'golongan', label: 'Golongan / Pangkat' },
                  { value: 'angka_kredit_min', label: 'Min Angka Kredit' },
                  { value: 'angka_kredit_max', label: 'Max Angka Kredit' },
                  { value: 'id', label: 'ID' },
                  { value: 'created_at', label: 'Waktu Input' },
                ]}
              />
              <Select
                label="Arah"
                value={filterJafungSortDir}
                onChange={(val) => setFilterJafungSortDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'A - Z (Naik)' },
                  { value: 'desc', label: 'Z - A (Turun)' },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Pencarian Nama Jabatan"
              placeholder="Cari Dekan, Kaprodi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <Select
              label="Tipe Jabatan"
              value={filterTipe}
              onChange={(val) => {
                setFilterTipe(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Tipe Jabatan' },
                { value: 'struktural', label: 'Struktural' },
                { value: 'fungsional', label: 'Fungsional' },
                { value: 'teknis', label: 'Teknis Operasional' },
              ]}
            />

            <hr className="border-t border-slate-200 my-2" />

            {/* Grid 2 Kolom Sorting */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urut Berdasarkan"
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val)}
                options={[
                  { value: 'nama', label: 'Nama Jabatan' },
                  { value: 'tipe', label: 'Tipe' },
                  { value: 'level_jabatan', label: 'Level' },
                  { value: 'id', label: 'ID' },
                ]}
              />
              <Select
                label="Arah"
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'A - Z (Naik)' },
                  { value: 'desc', label: 'Z - A (Turun)' },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Form Jabatan */}
      {(canCreate || canUpdate) && (
        <Modal
          open={showModalJabatan}
          onClose={() => setShowModalJabatan(false)}
          title={editingJabatan ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalJabatan(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmittingJabatan}
                disabled={isSubmittingJabatan}
                form="jabatan-modal-form"
              >
                Simpan Data
              </Button>
            </>
          }
        >
          <form id="jabatan-modal-form" onSubmit={handleSubmitJabatanForm(onSubmitJabatan)} className="space-y-4">
            <Input
              label="Nama Jabatan"
              required
              placeholder="Contoh: Dekan Fakultas Teknik, Kaprodi IF"
              error={errorsJabatan.nama?.message}
              {...registerJabatan('nama')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="tipe"
                control={controlJabatan}
                render={({ field }) => (
                  <Select
                    label="Tipe Jabatan"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errorsJabatan.tipe?.message}
                    options={[
                      { value: 'struktural', label: 'Struktural' },
                      { value: 'fungsional', label: 'Fungsional' },
                      { value: 'teknis', label: 'Teknis Operasional' },
                    ]}
                  />
                )}
              />

              <Input
                label="Level Jabatan"
                type="number"
                required
                error={errorsJabatan.level_jabatan?.message}
                {...registerJabatan('level_jabatan', { valueAsNumber: true })}
              />
            </div>

            <Controller
              name="unit_kerja_id"
              control={controlJabatan}
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Kerja Terikat (Opsional)"
                  placeholder="Cari Unit Kerja (opsional)..."
                  loadOptions={loadUnitKerjaOptions}
                  value={selectedUnitOption || (field.value ? { value: field.value, label: field.value } : null)}
                  onChange={(opt) => {
                    setSelectedUnitOption(opt);
                    field.onChange(opt ? opt.value : '');
                  }}
                  isClearable
                  error={errorsJabatan.unit_kerja_id?.message}
                />
              )}
            />

            <Controller
              name="is_active"
              control={controlJabatan}
              render={({ field }) => (
                <Checkbox
                  label="Jabatan Aktif"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </form>
        </Modal>
      )}

      {/* Modal Form Jafung (Dinamis dari Master Golongan) */}
      {canCreate && (
        <Modal
          open={showModalJafung}
          onClose={() => setShowModalJafung(false)}
          title="Tambah Master Jafung Dosen"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalJafung(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmittingJafung}
                disabled={isSubmittingJafung}
                form="jafung-modal-form"
              >
                Simpan Master Jafung
              </Button>
            </>
          }
        >
          <form id="jafung-modal-form" onSubmit={handleSubmitJafungForm(onSubmitJafung)} className="space-y-4">
            <Input
              label="Nama Jabatan Fungsional"
              required
              placeholder="Contoh: Lektor Kepala (AK 400)"
              error={errorsJafung.nama?.message}
              {...registerJafung('nama')}
            />

            <Controller
              name="golongan"
              control={controlJafung}
              render={({ field }) => (
                <Select
                  label="Jenjang Golongan"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errorsJafung.golongan?.message}
                  options={golonganOptions}
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Min KUM"
                type="number"
                required
                error={errorsJafung.angka_kredit_min?.message}
                {...registerJafung('angka_kredit_min', { valueAsNumber: true })}
              />
              <Input
                label="Max KUM"
                type="number"
                required
                error={errorsJafung.angka_kredit_max?.message}
                {...registerJafung('angka_kredit_max', { valueAsNumber: true })}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Form Master Golongan & Pangkat (Tab 3) */}
      {(canCreate || canUpdate) && (
        <Modal
          open={showModalGolongan}
          onClose={() => setShowModalGolongan(false)}
          title={editingGolongan ? 'Edit Jenjang Golongan & Pangkat' : 'Tambah Jenjang Golongan & Pangkat'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalGolongan(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmittingGolongan}
                disabled={isSubmittingGolongan}
                form="golongan-modal-form"
              >
                Simpan Golongan
              </Button>
            </>
          }
        >
          <form id="golongan-modal-form" onSubmit={handleSubmitGolonganForm(onSubmitGolongan)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kode Golongan"
                required
                placeholder="Contoh: III/a atau IV/b"
                error={errorsGolongan.kode?.message}
                {...registerGolongan('kode')}
              />
              <Input
                label="Urutan Tampilan"
                type="number"
                required
                error={errorsGolongan.urutan?.message}
                {...registerGolongan('urutan', { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Nama Jenjang / Pangkat"
              required
              placeholder="Contoh: Penata Muda (III/a) atau Pembina"
              error={errorsGolongan.nama?.message}
              {...registerGolongan('nama')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pangkat (Opsional)"
                placeholder="Contoh: Penata Muda Tingkat I"
                error={errorsGolongan.pangkat?.message}
                {...registerGolongan('pangkat')}
              />
              <Input
                label="Ruang (Opsional)"
                placeholder="Contoh: a / b / c"
                error={errorsGolongan.ruang?.message}
                {...registerGolongan('ruang')}
              />
            </div>

            <Controller
              name="is_active"
              control={controlGolongan}
              render={({ field }) => (
                <Checkbox
                  label="Golongan Aktif Digunakan"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </form>
        </Modal>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
}
