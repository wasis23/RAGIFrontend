'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Filter, Edit2, Trash2, ShieldAlert } from 'lucide-react';
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
import type { UnitKerja, TipeUnitKerja } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const unitKerjaSchema = z.object({
  kode: z.string().min(1, 'Kode Unit wajib diisi'),
  nama: z.string().min(1, 'Nama Unit Kerja wajib diisi'),
  tipe: z.enum(['rektorat', 'fakultas', 'prodi', 'lp3m', 'biro', 'unit'], {
    message: 'Tipe Unit Kerja wajib dipilih',
  }),
  induk_id: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type UnitKerjaFormValues = z.infer<typeof unitKerjaSchema>;

export default function UnitKerjaPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.unit_kerja.read') || hasPermission('simpeg.unit_kerja.manage');
  const canCreate = hasPermission('simpeg.unit_kerja.create') || hasPermission('simpeg.unit_kerja.manage');
  const canUpdate = hasPermission('simpeg.unit_kerja.update') || hasPermission('simpeg.unit_kerja.manage');
  const canDelete = hasPermission('simpeg.unit_kerja.delete') || hasPermission('simpeg.unit_kerja.manage');

  const [loading, setLoading] = useState(true);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);
  const [selectedParentOption, setSelectedParentOption] = useState<OptionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UnitKerjaFormValues>({
    resolver: zodResolver(unitKerjaSchema),
    defaultValues: {
      kode: '',
      nama: '',
      tipe: 'fakultas',
      induk_id: '',
      is_active: true,
    },
  });

  const loadData = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getUnitKerjaList({
        page,
        limit,
        search: search || undefined,
        tipe: filterTipe || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setUnitList(res.data || []);
        setMeta(res.meta);
      } else {
        let items: UnitKerja[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (u) => u.nama.toLowerCase().includes(q) || u.kode.toLowerCase().includes(q)
          );
        }
        if (filterTipe) {
          items = items.filter((u) => u.tipe === filterTipe);
        }
        
        items.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = items.slice(startIndex, startIndex + limit);

        setUnitList(paginated);
        setMeta({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Unit Kerja');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterTipe, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Async loader for Parent Unit Kerjas
  const loadParentUnitOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getUnitKerjaList();
      const units: UnitKerja[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = units.filter(
        (u: UnitKerja) =>
          u.id !== editingUnit?.id &&
          (u.nama.toLowerCase().includes(inputValue.toLowerCase()) ||
            u.kode.toLowerCase().includes(inputValue.toLowerCase()))
      );
      return filtered.map((u: UnitKerja) => ({
        value: u.id.toString(),
        label: `[${u.kode}] ${u.nama}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi unit kerja parent', err);
      return [];
    }
  }, [editingUnit]);

  const handleOpenCreate = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Unit Kerja.');
      return;
    }
    setEditingUnit(null);
    setSelectedParentOption(null);
    reset({
      kode: '',
      nama: '',
      tipe: 'fakultas',
      induk_id: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (unit: UnitKerja) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit Unit Kerja.');
      return;
    }
    setEditingUnit(unit);
    
    if (unit.parent) {
      setSelectedParentOption({
        value: unit.parent.id.toString(),
        label: `[${unit.parent.kode}] ${unit.parent.nama}`,
      });
    } else if (unit.induk_id) {
      setSelectedParentOption({
        value: unit.induk_id.toString(),
        label: `[ID ${unit.induk_id}] Unit Induk`,
      });
    } else {
      setSelectedParentOption(null);
    }

    reset({
      kode: unit.kode,
      nama: unit.nama,
      tipe: unit.tipe,
      induk_id: unit.induk_id ? unit.induk_id.toString() : '',
      is_active: unit.is_active,
    });
    setShowModal(true);
  };

  const onSubmit = async (values: UnitKerjaFormValues) => {
    if (editingUnit && !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Unit Kerja.');
      return;
    }
    if (!editingUnit && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Unit Kerja.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        induk_id: values.induk_id ? Number(values.induk_id) : null,
        kode: values.kode,
        nama: values.nama,
        tipe: values.tipe as TipeUnitKerja,
        is_active: values.is_active,
      };

      if (editingUnit) {
        await simpegService.updateUnitKerja(editingUnit.id, payload);
        toast.success('Unit Kerja berhasil diperbarui!');
      } else {
        await simpegService.createUnitKerja(payload);
        toast.success('Unit Kerja berhasil ditambahkan!');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan data Unit Kerja';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Unit Kerja.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus unit kerja "${nama}"?`)) return;
    try {
      await simpegService.deleteUnitKerja(id);
      toast.success('Unit Kerja berhasil dihapus!');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menghapus Unit Kerja';
      toast.error(msg);
    }
  };

  const columns: ColumnDef<UnitKerja>[] = [
    {
      key: 'kode',
      label: 'Kode Unit',
      render: (row) => <span className="font-mono font-bold text-primary-600">{row.kode}</span>,
    },
    {
      key: 'nama',
      label: 'Nama Unit Kerja',
      render: (row) => <span className="font-bold">{row.nama}</span>,
    },
    {
      key: 'tipe',
      label: 'Tipe Unit',
      render: (row) => (
        <Badge variant="purple" className="uppercase">
          {row.tipe}
        </Badge>
      ),
    },
    {
      key: 'parent',
      label: 'Unit Induk',
      render: (row) => row.parent?.nama || (row.induk_id ? `ID ${row.induk_id}` : '-'),
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
            onClick: () => handleOpenEdit(row),
          });
        }
        if (canDelete) {
          menuItems.push({
            label: 'Hapus',
            icon: <Trash2 size={14} />,
            variant: 'danger' as const,
            onClick: () => handleDelete(row.id, row.nama),
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
          title="Manajemen Unit Kerja & SOTK Kampus"
          description="Kelola Struktur Organisasi (Rektorat, Fakultas, Prodi, Biro, & Lembaga)"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk membaca atau mengelola Unit Kerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Manajemen Unit Kerja & SOTK Kampus"
        description="Kelola Struktur Organisasi (Rektorat, Fakultas, Prodi, Biro, & Lembaga)"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
                Tambah Unit Kerja
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

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={unitList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data unit kerja yang sesuai filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Unit Kerja"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian (Kode / Nama)"
            placeholder="Cari FTI, PRODI-IF..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Tipe Unit Kerja"
            value={filterTipe}
            onChange={(val) => {
              setFilterTipe(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Tipe Unit' },
              { value: 'rektorat', label: 'Rektorat / Universitas' },
              { value: 'fakultas', label: 'Fakultas' },
              { value: 'prodi', label: 'Program Studi' },
              { value: 'lp3m', label: 'LPPM / Lembaga' },
              { value: 'biro', label: 'Biro Operasional' },
              { value: 'unit', label: 'Unit Pelaksana Teknis (UPT)' },
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
                { value: 'nama', label: 'Nama Unit' },
                { value: 'kode', label: 'Kode Unit' },
                { value: 'tipe', label: 'Tipe Unit' },
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

      {/* Form Create/Edit Modal */}
      {(canCreate || canUpdate) && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingUnit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                form="unit-kerja-modal-form"
              >
                Simpan Data
              </Button>
            </>
          }
        >
          <form id="unit-kerja-modal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kode Unit"
                required
                placeholder="Contoh: FTI, PRODI-IF"
                error={errors.kode?.message}
                {...register('kode')}
              />
              <Input
                label="Nama Unit Kerja"
                required
                placeholder="Contoh: Fakultas Teknologi Informasi"
                error={errors.nama?.message}
                {...register('nama')}
              />
            </div>

            <Controller
              name="tipe"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipe Unit Kerja"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.tipe?.message}
                  options={[
                    { value: 'rektorat', label: 'Rektorat / Universitas' },
                    { value: 'fakultas', label: 'Fakultas' },
                    { value: 'prodi', label: 'Program Studi' },
                    { value: 'lp3m', label: 'LPPM / Lembaga Pengabdian' },
                    { value: 'biro', label: 'Biro Operasional' },
                    { value: 'unit', label: 'Unit Pelaksana Teknis (UPT)' },
                  ]}
                />
              )}
            />

            <Controller
              name="induk_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Induk (Parent)"
                  placeholder="Cari Unit Induk (opsional)..."
                  loadOptions={loadParentUnitOptions}
                  value={selectedParentOption || (field.value ? { value: field.value, label: field.value } : null)}
                  onChange={(opt) => {
                    setSelectedParentOption(opt);
                    field.onChange(opt ? opt.value : '');
                  }}
                  isClearable
                  error={errors.induk_id?.message}
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Unit Kerja Aktif"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
