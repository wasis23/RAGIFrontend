'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, ShieldAlert, Filter, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { Role } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

const roleSchema = z.object({
  name: z.string().min(1, 'Nama role wajib diisi').max(100, 'Nama role maksimal 100 karakter'),
  slug: z
    .string()
    .min(1, 'Slug identifier wajib diisi')
    .regex(/^[a-z0-9_]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan underscore (contoh: dosen_pembimbing)'),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filters State
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [filterLimit, setFilterLimit] = useState<string>('15');

  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [filterSlug, setFilterSlug] = useState<string>('');
  const [filterDescription, setFilterDescription] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('id');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    slug: '',
    description: '',
    date: '',
    orderBy: 'id',
    orderDir: 'desc',
  });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form + Zod Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (appliedFilters.name !== '') params.name = appliedFilters.name;
      if (appliedFilters.slug !== '') params.slug = appliedFilters.slug;
      if (appliedFilters.description !== '') params.description = appliedFilters.description;
      if (appliedFilters.date !== '') params.created_at = appliedFilters.date;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir !== '') params.order_dir = appliedFilters.orderDir;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await adminService.getRoles(params);
      let roleList = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        roleList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        roleList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        roleList = res.data;
        if (res.meta) {
          metaData = res.meta;
        }
      } else if (Array.isArray(res)) {
        roleList = res;
      }

      setRoles(roleList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data role. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [
    page,
    filterLimit,
    appliedFilters.name,
    appliedFilters.slug,
    appliedFilters.description,
    appliedFilters.date,
    appliedFilters.orderBy,
    appliedFilters.orderDir,
  ]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    reset({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    reset({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const onSaveRole = async (values: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, values);
        toast.success('Role berhasil diperbarui!');
      } else {
        await adminService.createRole(values);
        toast.success('Role baru berhasil ditambahkan!');
      }
      fetchRoles();
      setShowModal(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Gagal menyimpan role. Periksa koneksi ke server.';
      if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki wewenang untuk aksi ini.');
      } else if (error.response?.status === 422) {
        toast.error('Validasi gagal. Pastikan Slug Unique Identifier unik.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      await adminService.deleteRole(deletingRole.id);
      toast.success(`Role ${deletingRole.name} berhasil dihapus.`);
      fetchRoles();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Gagal menghapus role. Periksa koneksi ke server.';
      if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki wewenang untuk menghapus role ini.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsDeleting(false);
      setDeletingRole(null);
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      key: 'id',
      label: 'No',
      render: (row, index) => (
        <span className="font-bold text-slate-400">{meta?.from ? meta.from + index : index + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nama Role',
      render: (row) => (
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldAlert size={16} className="text-primary-600 shrink-0" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug Identifier',
      render: (row) => (
        <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">
          {row.slug}
        </code>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi Akses',
      render: (row) => <span className="text-xs text-slate-600">{row.description || '-'}</span>,
    },
    {
      key: 'created_at',
      label: 'Tanggal Dibuat',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Role',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus Role',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingRole(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex w-full flex-col gap-6">
      <PageHeader
        title="Manajemen Role Akses (Roles Table)"
        description="Definisikan struktur peran pengguna dalam ekosistem kampus (Tabel: roles)"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Role Baru
            </Button>
          </div>
        }
      />

      <div className="w-full bg-white rounded-xl shadow-2xs border border-slate-200">
        <DataTable
          columns={columns}
          data={roles}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setFilterLimit(l.toString());
            setPage(1);
          }}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Role Akses"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterName('');
                setFilterSlug('');
                setFilterDescription('');
                setFilterDate('');
                setFilterOrderBy('id');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  name: '',
                  slug: '',
                  description: '',
                  date: '',
                  orderBy: 'id',
                  orderDir: 'desc',
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  name: filterName,
                  slug: filterSlug,
                  description: filterDescription,
                  date: filterDate,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir,
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Role"
            placeholder="Cari berdasarkan nama role..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <Input
            label="Slug Identifier"
            placeholder="Cari berdasarkan slug..."
            value={filterSlug}
            onChange={(e) => setFilterSlug(e.target.value)}
          />

          <Input
            label="Deskripsi Akses"
            placeholder="Cari dalam deskripsi role..."
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
          />

          <Input
            label="Tanggal Dibuat"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'name', label: 'Nama Role' },
                { value: 'slug', label: 'Slug Identifier' },
                { value: 'description', label: 'Deskripsi Akses' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Form */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSaveRole)} disabled={isSubmitting}>
              {editingRole ? 'Simpan Perubahan' : 'Tambah Role'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSaveRole)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Role"
            required
            placeholder="Contoh: Dosen Pembimbing"
            {...register('name')}
            onChange={(e) => {
              const name = e.target.value;
              setValue('name', name);
              if (!editingRole) {
                const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                setValue('slug', slug);
              }
            }}
            error={errors.name?.message}
          />

          <Input
            label="Slug Unique Identifier"
            required
            placeholder="contoh: dosen_pembimbing"
            {...register('slug')}
            error={errors.slug?.message}
            hint="Format: lowercase dengan underscore"
          />

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Deskripsi Akses"
              rows={3}
              placeholder="Deskripsi wewenang role..."
              {...register('description')}
              error={errors.description?.message}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDelete}
        title="Hapus Role Akses?"
        message={
          <>
            Apakah Anda yakin ingin menghapus role <strong>{deletingRole?.name}</strong>? Pengguna dengan role ini akan kehilangan seluruh wewenang terkait. Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmText="Hapus Role"
        cancelText="Batal"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
