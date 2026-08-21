'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Key, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { adminService } from '@/services/admin.service';
import { PERMISSION_ACTIONS } from '@/lib/constants';
import { moduleService, AppModule } from '@/services/module.service';
import type { Permission, PermissionAction } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

// ── Zod Schema ─────────────────────────────────────────────────
const permissionSchema = z.object({
  name: z.string().min(1, 'Nama permission wajib diisi'),
  slug: z
    .string()
    .min(1, 'Slug identifier wajib diisi')
    .regex(/^[a-z0-9._-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, titik, atau garis bawah'),
  module: z.string().min(1, 'Modul target wajib dipilih'),
  action: z.string().min(1, 'Action type wajib dipilih'),
  description: z.string().optional(),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

const ACTION_VARIANT_MAP: Record<string, 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray'> = {
  read: 'green',
  create: 'blue',
  update: 'yellow',
  delete: 'red',
  manage: 'purple',
};

export default function AdminPermissionsPage() {
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);

  // Server-side Pagination & Meta
  const [page, setPage] = useState<number>(1);
  const [filterLimit, setFilterLimit] = useState<string>('15');
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterModule, setFilterModule] = useState('all');
  const [filterName, setFilterName] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('name');
  const [filterOrderDir, setFilterOrderDir] = useState('asc');

  const [appliedFilterModule, setAppliedFilterModule] = useState('all');
  const [appliedFilterName, setAppliedFilterName] = useState('');
  const [appliedFilterOrderBy, setAppliedFilterOrderBy] = useState('name');
  const [appliedFilterOrderDir, setAppliedFilterOrderDir] = useState('asc');

  // ── React Hook Form ─────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { name: '', slug: '', module: '', action: 'read', description: '' },
  });

  // ── Data Fetch ──────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPermissions({
        page,
        per_page: Number(filterLimit),
        search: appliedFilterName || undefined,
        sort_by: appliedFilterOrderBy,
        sort_dir: appliedFilterOrderDir as 'asc' | 'desc',
        ...(appliedFilterModule !== 'all' ? { module: appliedFilterModule } : {}),
      } as any);

      const rawData = res?.data;
      if (Array.isArray(rawData)) {
        setPermissions(rawData);
        setMeta({ current_page: page, last_page: 1, per_page: Number(filterLimit), total: rawData.length, from: 1, to: rawData.length });
      } else {
        const paginatedData = rawData as { items?: Permission[]; meta?: PaginationMeta };
        setPermissions(paginatedData?.items ?? []);
        if (paginatedData?.meta) setMeta(paginatedData.meta);
      }
    } catch {
      toast.error('Gagal memuat data permission. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterLimit, appliedFilterName, appliedFilterModule, appliedFilterOrderBy, appliedFilterOrderDir]);

  const fetchModules = async () => {
    try {
      const data = await moduleService.getAllModules();
      setAppModules(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  // ── Form Handlers ────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPermission(null);
    reset({ name: '', slug: '', module: appModules[0]?.code ?? '', action: 'read', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Permission) => {
    setEditingPermission(p);
    reset({
      name: p.name,
      slug: p.slug,
      module: p.module,
      action: p.action,
      description: p.description || '',
    });
    setShowModal(true);
  };

  const onSave = async (values: PermissionFormValues) => {
    try {
      const payload = { ...values, action: values.action as PermissionAction };
      if (editingPermission) {
        await adminService.updatePermission(editingPermission.id, payload);
        toast.success('Permission berhasil diperbarui!');
      } else {
        await adminService.createPermission(payload);
        toast.success('Permission baru berhasil dibuat!');
      }
      fetchPermissions();
    } catch {
      toast.error('Gagal menyimpan permission. Periksa koneksi ke server.');
    } finally {
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPermission) return;
    try {
      await adminService.deletePermission(deletingPermission.id);
      toast.success(`Permission ${deletingPermission.slug} berhasil dihapus.`);
      fetchPermissions();
    } catch {
      toast.error('Gagal menghapus permission. Periksa koneksi ke server.');
    } finally {
      setDeletingPermission(null);
    }
  };

  // ── Table Columns ─────────────────────────────────────────────
  const columns: ColumnDef<Permission>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="font-bold text-slate-400">#{row.id}</span>,
    },
    {
      key: 'name',
      label: 'Nama Permission',
      render: (row) => (
        <div className="flex items-center gap-2 font-bold">
          <Key size={16} color="var(--primary-600)" />
          {row.name}
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug Identifier',
      render: (row) => (
        <code className="bg-slate-100 px-2 py-0.5 rounded text-[0.8125rem] font-bold text-primary-700">
          {row.slug}
        </code>
      ),
    },
    {
      key: 'module',
      label: 'Modul',
      render: (row) => <Badge variant="blue">{row.module.toUpperCase()}</Badge>,
    },
    {
      key: 'action',
      label: 'Tipe Action',
      render: (row) => {
        const variant = ACTION_VARIANT_MAP[row.action] ?? 'gray';
        return <Badge variant={variant}>{row.action}</Badge>;
      },
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (row) => (
        <span className="text-[0.8125rem] text-slate-500">{row.description || '-'}</span>
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
                label: 'Edit',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={14} />,
                onClick: () => setDeletingPermission(row),
                variant: 'danger' as const,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Manajemen Hak Akses (Permissions Table)"
        description="Daftar granular permission untuk setiap modul aplikasi (Tabel: permissions)"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Permission
            </Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={permissions}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setFilterLimit(l.toString()); setPage(1); }}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Hak Akses"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterModule('all');
                setFilterName('');
                setFilterOrderBy('name');
                setFilterOrderDir('asc');
                setAppliedFilterModule('all');
                setAppliedFilterName('');
                setAppliedFilterOrderBy('name');
                setAppliedFilterOrderDir('asc');
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilterModule(filterModule);
                setAppliedFilterName(filterName);
                setAppliedFilterOrderBy(filterOrderBy);
                setAppliedFilterOrderDir(filterOrderDir);
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Cari Permission"
            placeholder="Ketik nama atau slug..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <Select
            label="Modul"
            value={filterModule}
            onChange={(val) => setFilterModule(val)}
            options={[
              { value: 'all', label: 'Semua Modul' },
              ...appModules.map((m) => ({ value: m.code, label: m.name })),
            ]}
          />

          <hr className="border-t border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'name', label: 'Nama Permission' },
                { value: 'slug', label: 'Slug Identifier' },
                { value: 'module', label: 'Modul Target' },
              ]}
            />
            <Select
              label="Arah"
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
        title={editingPermission ? 'Edit Permission' : 'Tambah Permission Baru'}
      >
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Permission"
              required
              placeholder="Contoh: Input Nilai SIAKAD"
              error={errors.name?.message}
              {...register('name')}
            />

            <Controller
              name="module"
              control={control}
              render={({ field }) => (
                <Select
                  label="Modul Target"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.module?.message}
                  options={appModules.map((m) => ({ value: m.code, label: m.name }))}
                />
              )}
            />

            <Controller
              name="action"
              control={control}
              render={({ field }) => (
                <Select
                  label="Action Type"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.action?.message}
                  options={PERMISSION_ACTIONS.map((a) => ({ value: a, label: a }))}
                />
              )}
            />

            <Input
              label="Slug Identifier"
              required
              placeholder="contoh: siakad.grades.update"
              error={errors.slug?.message}
              {...register('slug')}
            />

            <div className="col-span-1 md:col-span-2">
              <Textarea
                label="Deskripsi"
                rows={3}
                placeholder="Deskripsi hak akses..."
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deletingPermission}
        onClose={() => setDeletingPermission(null)}
        title="Hapus Permission?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingPermission(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500">
          Hapus permission <code>{deletingPermission?.slug}</code>?
        </p>
      </Modal>
    </div>
  );
}
