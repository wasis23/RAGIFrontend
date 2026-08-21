'use client';

import { useEffect, useState, useCallback } from 'react';
import { Briefcase, Plus, Filter, Award, Edit2, Trash2, ShieldAlert } from 'lucide-react';
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
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { Jabatan, JabatanFungsionalAkademik, UnitKerja, TipeJabatan, GolonganJafung } from '@/types/simpeg.types';
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
  golongan: z.enum(['tenaga_pengajar', 'asisten_ahli', 'lektor', 'lektor_kepala', 'guru_besar'], {
    message: 'Jenjang Golongan wajib dipilih',
  }),
  angka_kredit_min: z.number().min(0, 'Min KUM minimal 0'),
  angka_kredit_max: z.number().min(0, 'Max KUM minimal 0'),
});

type JafungFormValues = z.infer<typeof jafungSchema>;

export default function JabatanPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.jabatan.read') || hasPermission('simpeg.jabatan.manage');
  const canCreate = hasPermission('simpeg.jabatan.create') || hasPermission('simpeg.jabatan.manage');
  const canUpdate = hasPermission('simpeg.jabatan.update') || hasPermission('simpeg.jabatan.manage');
  const canDelete = hasPermission('simpeg.jabatan.delete') || hasPermission('simpeg.jabatan.manage');

  const [activeTab, setActiveTab] = useState<'jabatan' | 'jafung'>('jabatan');
  const [loading, setLoading] = useState(true);
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  
  // Pagination & Metadata
  const [metaJabatan, setMetaJabatan] = useState<PaginationMeta | undefined>();
  const [metaJafung, setMetaJafung] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state for Jabatan
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal State for Jabatan
  const [showModalJabatan, setShowModalJabatan] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState<Jabatan | null>(null);
  const [selectedUnitOption, setSelectedUnitOption] = useState<OptionType | null>(null);
  const [isSubmittingJabatan, setIsSubmittingJabatan] = useState(false);

  // Modal State for Jafung
  const [showModalJafung, setShowModalJafung] = useState(false);
  const [isSubmittingJafung, setIsSubmittingJafung] = useState(false);

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
      golongan: 'asisten_ahli',
      angka_kredit_min: 100,
      angka_kredit_max: 150,
    },
  });

  const loadData = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const [resJab, resJaf]: [any, any] = await Promise.all([
        simpegService.getJabatanList({
          page,
          limit,
          search: search || undefined,
          tipe: filterTipe || undefined,
          sort_by: filterOrderBy,
          sort_dir: filterOrderDir,
        }),
        simpegService.getJabatanFungsionalList(),
      ]);

      // Handle Jabatan Data
      if (resJab?.meta) {
        setJabatanList(resJab.data || []);
        setMetaJabatan(resJab.meta);
      } else {
        let itemsJab: Jabatan[] = Array.isArray(resJab.data) ? resJab.data : Array.isArray(resJab) ? resJab : [];
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

      // Handle Jafung Data
      let itemsJaf: JabatanFungsionalAkademik[] = Array.isArray(resJaf?.data) ? resJaf.data : Array.isArray(resJaf) ? resJaf : [];
      setJafungList(itemsJaf);
      setMetaJafung({
        current_page: 1,
        last_page: 1,
        per_page: itemsJaf.length || 15,
        total: itemsJaf.length,
        from: itemsJaf.length > 0 ? 1 : 0,
        to: itemsJaf.length,
      });

    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Jabatan');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterTipe, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleDeleteJabatan = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Jabatan.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus jabatan "${nama}"?`)) return;
    try {
      await simpegService.deleteJabatan(id);
      toast.success('Jabatan berhasil dihapus!');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus Jabatan');
    }
  };

  const onSubmitJafung = async (values: JafungFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengelola Jafung.');
      return;
    }

    setIsSubmittingJafung(true);
    try {
      await simpegService.createJabatanFungsional({
        nama: values.nama,
        golongan: values.golongan as GolonganJafung,
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

  // Columns for Jabatan DataTable
  const columnsJabatan: ColumnDef<Jabatan>[] = [
    {
      key: 'nama',
      label: 'Nama Jabatan',
      render: (row) => <span className="font-bold">{row.nama}</span>,
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
      render: (row) => row.unit_kerja?.nama || (row.unit_kerja_id ? `ID ${row.unit_kerja_id}` : 'Lintas Unit'),
    },
    {
      key: 'level_jabatan',
      label: 'Level',
      render: (row) => `Lvl ${row.level_jabatan}`,
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
            label: 'Edit',
            icon: <Edit2 size={14} />,
            onClick: () => handleOpenEditJabatan(row),
          });
        }
        if (canDelete) {
          menuItems.push({
            label: 'Hapus',
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
      label: 'Nama Jafung',
      render: (row) => <span className="font-bold">{row.nama}</span>,
    },
    {
      key: 'golongan',
      label: 'Golongan',
      render: (row) => (
        <Badge variant="blue" className="uppercase">
          {row.golongan.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'angka_kredit_min',
      label: 'Min KUM',
      render: (row) => <span className="font-bold text-slate-800">{row.angka_kredit_min} KUM</span>,
    },
    {
      key: 'angka_kredit_max',
      label: 'Max KUM',
      render: (row) => <span className="font-bold text-slate-800">{row.angka_kredit_max} KUM</span>,
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Manajemen Jabatan & Jafung Dosen"
          description="Kelola daftar Jabatan Struktural/Teknis serta Jabatan Fungsional Akademik Dosen"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat Jabatan & Jafung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Manajemen Jabatan & Jafung Dosen"
        description="Kelola daftar Jabatan Struktural/Teknis serta Jabatan Fungsional Akademik Dosen"
        action={
          <div className="flex gap-2">
            {canCreate && activeTab === 'jabatan' && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateJabatan}>
                Tambah Jabatan
              </Button>
            )}
            {canCreate && activeTab === 'jafung' && (
              <Button icon={<Plus size={16} />} onClick={() => setShowModalJafung(true)}>
                Tambah Jafung Dosen
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('jabatan')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer border-none ${
              activeTab === 'jabatan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase size={16} /> Jabatan Struktural & Teknis ({jabatanList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jafung')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer border-none ${
              activeTab === 'jafung'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award size={16} /> Jabatan Fungsional (Jafung) ({jafungList.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Jabatan DataTable */}
      {activeTab === 'jabatan' && (
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
              <p>Belum ada data jabatan yang sesuai filter.</p>
            </div>
          }
        />
      )}

      {/* Tab 2: Jafung DataTable */}
      {activeTab === 'jafung' && (
        <DataTable
          columns={columnsJafung}
          data={jafungList}
          isLoading={loading}
          meta={metaJafung}
          emptyMessage={
            <div className="py-8 text-center text-slate-400">
              <Award size={48} className="mx-auto mb-4 opacity-40" />
              <p>Belum ada master Jabatan Fungsional Dosen.</p>
            </div>
          }
        />
      )}

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Jabatan"
      >
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

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterTipe('');
                setFilterOrderBy('nama');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
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

      {/* Modal Form Jafung */}
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
                  options={[
                    { value: 'tenaga_pengajar', label: 'Tenaga Pengajar' },
                    { value: 'asisten_ahli', label: 'Asisten Ahli (III/a - III/b)' },
                    { value: 'lektor', label: 'Lektor (III/c - III/d)' },
                    { value: 'lektor_kepala', label: 'Lektor Kepala (IV/a - IV/c)' },
                    { value: 'guru_besar', label: 'Guru Besar / Profesor (IV/d - IV/e)' },
                  ]}
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
    </div>
  );
}
