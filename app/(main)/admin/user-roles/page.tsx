'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, ShieldAlert, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { PaginationMeta } from '@/types/api.types';

interface UserRoleMapping {
  user_id: number;
  username: string;
  email: string;
  roles: { id: number; name: string; slug: string }[];
  created_at: string;
}

const assignRoleSchema = z.object({
  roles: z.array(z.string()).min(1, 'Pilih minimal satu role untuk pengguna ini'),
});

type AssignRoleValues = z.infer<typeof assignRoleSchema>;

export default function AdminUserRolesPage() {
  const [userRoles, setUserRoles] = useState<UserRoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRoleMapping | null>(null);

  // Server-side Pagination & Meta State
  const [page, setPage] = useState<number>(1);
  const [filterLimit, setFilterLimit] = useState<string>('15');
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [filterRoleObj, setFilterRoleObj] = useState<{ value: string; label: string } | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('username');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('asc');

  const [appliedFilterName, setAppliedFilterName] = useState<string>('');
  const [appliedFilterRole, setAppliedFilterRole] = useState<string>('all');
  const [appliedFilterOrderBy, setAppliedFilterOrderBy] = useState<string>('username');
  const [appliedFilterOrderDir, setAppliedFilterOrderDir] = useState<string>('asc');

  const {
    handleSubmit: handleAssignSubmit,
    control: assignControl,
    reset: resetAssignForm,
    formState: { errors: assignErrors },
  } = useForm<AssignRoleValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { roles: [] },
  });

  const fetchUserRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUserRoles({
        page,
        limit: Number(filterLimit),
        search: appliedFilterName || undefined,
        role_id: appliedFilterRole !== 'all' ? appliedFilterRole : undefined,
        orderBy: appliedFilterOrderBy,
        orderDir: appliedFilterOrderDir,
      });

      const rawItems = Array.isArray(res?.data)
        ? res.data
        : ((res?.data as unknown as { items?: unknown[] })?.items ?? []);

      const mapped: UserRoleMapping[] = (rawItems as any[]).map((u) => ({
        user_id: u.id ?? u.user_id,
        username: u.username,
        email: u.email,
        roles: u.roles || [],
        created_at: u.created_at || new Date().toISOString(),
      }));

      setUserRoles(mapped);
      if (res?.meta) {
        setMeta(res.meta);
      } else {
        setMeta({
          current_page: page,
          last_page: 1,
          per_page: Number(filterLimit),
          total: mapped.length,
          from: mapped.length ? 1 : 0,
          to: mapped.length,
        });
      }
    } catch {
      toast.error('Gagal memuat data user-roles. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterLimit, appliedFilterName, appliedFilterRole, appliedFilterOrderBy, appliedFilterOrderDir]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  const loadRoleOptions = async (query: string) => {
    try {
      const rolesRes = await adminService.getRoles();
      const roleList = Array.isArray(rolesRes?.data)
        ? rolesRes.data
        : (rolesRes?.data as { items?: { id: number; name: string; slug: string }[] })?.items ?? [];
      const filtered = roleList.filter(
        (r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.slug.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.map((r) => ({ value: r.id.toString(), label: `${r.name} (${r.slug})` }));
    } catch {
      return [];
    }
  };

  const handleOpenAssign = (ur: UserRoleMapping) => {
    setEditingUser(ur);
    resetAssignForm({
      roles: ur.roles.map((r) => r.id.toString()),
    });
  };

  const onSaveAssignment = async (values: AssignRoleValues) => {
    if (!editingUser) return;

    try {
      const selectedIds = values.roles.map((v) => parseInt(v, 10));
      await adminService.assignRolesToUser(editingUser.user_id, selectedIds);
      toast.success(`Role untuk ${editingUser.username} berhasil diperbarui!`);
      fetchUserRoles();
    } catch {
      toast.error(`Gagal menyimpan role untuk ${editingUser.username}. Periksa koneksi ke server.`);
    } finally {
      setEditingUser(null);
    }
  };

  const columns: ColumnDef<UserRoleMapping>[] = [
    {
      key: 'user_id',
      label: 'No',
      render: (_, index) => (
        <span className="font-bold text-slate-400">{(page - 1) * Number(filterLimit) + index + 1}</span>
      ),
    },
    {
      key: 'pengguna',
      label: 'Pengguna',
      render: (row) => (
        <div>
          <div className="font-bold">{row.username}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Role Terpasang',
      render: (row) => (
        <div className="flex gap-1.5 flex-wrap">
          {row.roles.length === 0 ? (
            <span className="text-[0.8125rem] text-slate-400">Tanpa Role</span>
          ) : (
            row.roles.map((r) => (
              <Badge key={r.id} variant="blue" className="inline-flex items-center gap-1">
                <ShieldAlert size={12} /> {r.name}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Tanggal Penugasan',
      render: (row) => (
        <span className="text-[0.8125rem] text-slate-400">{formatDate(row.created_at)}</span>
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
                label: 'Kelola Role',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenAssign(row),
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
        title="Penugasan Role Pengguna (User-Roles Table)"
        description="Hubungkan pengguna dengan satu atau lebih role sesuai wewenang (Tabel: user_roles)"
        action={
          <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
            Filter
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={userRoles}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setFilterLimit(l.toString());
          setPage(1);
        }}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengguna"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterName('');
                setFilterRoleObj(null);
                setFilterRole('all');
                setFilterOrderBy('username');
                setFilterOrderDir('asc');
                setAppliedFilterName('');
                setAppliedFilterRole('all');
                setAppliedFilterOrderBy('username');
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
                setAppliedFilterName(filterName);
                setAppliedFilterRole(filterRole);
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
            label="Cari Pengguna"
            placeholder="Ketik username atau email..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <AsyncSelect
            label="Role Terpasang"
            placeholder="Cari nama role..."
            value={filterRoleObj}
            onChange={(selected: any) => {
              setFilterRoleObj(selected);
              setFilterRole(selected ? selected.value : 'all');
            }}
            loadOptions={loadRoleOptions}
            isClearable
          />

          <hr className="border-t border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'username', label: 'Nama Pengguna' },
                { value: 'email', label: 'Email' },
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

      {/* Modal Assign Roles */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Kelola Role untuk ${editingUser?.username}`}
      >
        <form onSubmit={handleAssignSubmit(onSaveAssignment)} className="flex flex-col gap-5">
          <p className="text-sm text-slate-500">
            Pilih role yang ingin dipasangkan ke akun <strong>{editingUser?.email}</strong>:
          </p>

          <div className="min-h-48">
            <Controller
              name="roles"
              control={assignControl}
              render={({ field }) => (
                <AsyncSelect
                  label="Pilih Role Wajib"
                  required
                  placeholder="Cari dan pilih role..."
                  value={field.value.map((v) => ({ value: v, label: `Role ID: ${v}` }))}
                  onChange={(vals: any) => field.onChange((vals || []).map((item: any) => item.value))}
                  loadOptions={loadRoleOptions}
                  isMulti
                  error={assignErrors.roles?.message}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
