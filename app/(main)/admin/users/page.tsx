'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Mail, CheckCircle, XCircle, Filter, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { User } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

const userSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(100, 'Username maksimal 100 karakter'),
  email: z.string().min(1, 'Email kampus wajib diisi').email('Format email tidak valid (contoh: user@kampus.ac.id)'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterIsActive, setFilterIsActive] = useState<string>('');
  const [filterIsVerified, setFilterIsVerified] = useState<string>('');
  const [filterName, setFilterName] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterRoleObj, setFilterRoleObj] = useState<{ value: string; label: string } | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('id');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('desc');
  const [filterLimit, setFilterLimit] = useState<string>('15');

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    isActive: '',
    isVerified: '',
    name: '',
    role: '',
    date: '',
    orderBy: 'id',
    orderDir: 'desc',
  });

  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Modal States
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password States
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordValues, setPasswordValues] = useState({ password: '', password_confirmation: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // React Hook Form + Zod Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (appliedFilters.isActive !== '') params.is_active = appliedFilters.isActive === 'true';
      if (appliedFilters.isVerified !== '') params.is_verified = appliedFilters.isVerified === 'true';
      if (appliedFilters.name !== '') params.name = appliedFilters.name;
      if (appliedFilters.role !== '') params.role_id = appliedFilters.role;
      if (appliedFilters.date !== '') params.created_at = appliedFilters.date;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir !== '') params.order_dir = appliedFilters.orderDir;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await adminService.getUsers(params);
      let userList = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        userList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        userList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        userList = res.data;
      } else if (Array.isArray(res)) {
        userList = res;
      }

      setUsers(userList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data pengguna. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [
    appliedFilters.isActive,
    appliedFilters.isVerified,
    appliedFilters.name,
    appliedFilters.role,
    appliedFilters.date,
    appliedFilters.orderBy,
    appliedFilters.orderDir,
    filterLimit,
    page,
  ]);

  const loadRoleOptions = async (inputValue: string) => {
    try {
      const res = await adminService.getRoles({ search: inputValue });
      let roleList = [];
      if (res && Array.isArray((res as any).data) && 'current_page' in res) {
        roleList = (res as any).data;
      } else if (res && (res as any).data && Array.isArray((res as any).data.items)) {
        roleList = (res as any).data.items;
      } else if (res && Array.isArray((res as any).data)) {
        roleList = (res as any).data;
      } else if (Array.isArray(res)) {
        roleList = res;
      }
      return roleList.map((r: any) => ({ value: r.id.toString(), label: r.name }));
    } catch {
      return [];
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({ username: '', email: '', phone: '', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    reset({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: '',
    });
    setShowModal(true);
  };

  const onSaveUser = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, values);
        toast.success('Pengguna berhasil diperbarui!');
      } else {
        if (!values.password || values.password.length < 6) {
          toast.error('Password minimal 6 karakter.');
          setIsSubmitting(false);
          return;
        }
        await adminService.createUser(values);
        toast.success('Pengguna baru berhasil ditambahkan!');
      }
      fetchUsers();
      setShowModal(false);
    } catch {
      toast.error('Gagal menyimpan data. Periksa koneksi ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await adminService.toggleUserActive(user.id, !user.is_active);
      toast.success(`Status ${user.username} berhasil diubah.`);
      fetchUsers();
    } catch {
      toast.error(`Gagal mengubah status ${user.username}. Periksa koneksi ke server.`);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminService.deleteUser(deletingUser.id);
      toast.success(`Pengguna ${deletingUser.username} telah dihapus.`);
      fetchUsers();
    } catch {
      toast.error(`Gagal menghapus ${deletingUser.username}. Periksa koneksi ke server.`);
    } finally {
      setDeletingUser(null);
    }
  };

  const handleOpenChangePassword = (user: User) => {
    setPasswordUser(user);
    setPasswordValues({ password: '', password_confirmation: '' });
  };

  const onSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (!passwordValues.password || passwordValues.password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    if (passwordValues.password !== passwordValues.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await adminService.changeUserPassword(passwordUser.id, passwordValues);
      toast.success(`Password untuk pengguna ${passwordUser.username} berhasil diubah!`);
      setPasswordUser(null);
      setPasswordValues({ password: '', password_confirmation: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal mengubah password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      key: 'id',
      label: 'No',
      render: (row, index) => (
        <span className="font-bold text-slate-400">{meta?.from ? meta.from + index : index + 1}</span>
      ),
    },
    {
      key: 'pengguna',
      label: 'Pengguna',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="avatar avatar-sm">{row.username.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="font-bold text-slate-900">{row.username}</div>
            <div className="text-xs text-slate-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Role(s)',
      render: (row) => (
        <>
          {row.roles?.map((r) => (
            <span key={r.id} className="dropdown-role-tag">
              {r.name || r.role?.name}
            </span>
          ))}
        </>
      ),
    },
    {
      key: 'status',
      label: 'Status Akun',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className="bg-transparent border-none cursor-pointer p-0"
          title="Klik untuk mengubah status"
        >
          <StatusBadge active={row.is_active} />
        </button>
      ),
    },
    {
      key: 'verified',
      label: 'Terverifikasi',
      render: (row) =>
        row.is_verified ? (
          <span className="flex items-center gap-1 text-[0.8125rem] font-semibold text-emerald-600">
            <CheckCircle size={14} /> Ya
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[0.8125rem] font-semibold text-red-500">
            <XCircle size={14} /> Belum
          </span>
        ),
    },
    {
      key: 'created_at',
      label: 'Tanggal Dibuat',
      render: (row) => (
        <span className="text-[0.8125rem] text-slate-500">{formatDate(row.created_at)}</span>
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
                label: 'Edit Pengguna',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Ganti Password',
                icon: <Key size={14} />,
                onClick: () => handleOpenChangePassword(row),
              },
              {
                label: 'Hapus Pengguna',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingUser(row),
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
        title="Manajemen Pengguna (Users Table)"
        description="Kelola akun, role, dan hak akses pengguna ekosistem kampus (Tabel: users)"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Pengguna
            </Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
          </div>
        }
      />

      {/* Table Card */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setFilterLimit(l.toString());
          setPage(1);
        }}
      />

      {/* Modal Form Create/Edit */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSaveUser)} disabled={isSubmitting}>
              {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSaveUser)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Username"
            required
            {...register('username')}
            error={errors.username?.message}
            placeholder="contoh: mhs_2026"
          />

          <Input
            label="Email Kampus"
            type="email"
            required
            prefixIcon={<Mail size={16} />}
            {...register('email')}
            error={errors.email?.message}
            placeholder="nama@kampus.ac.id"
          />

          <Input
            label="Nomor HP / WhatsApp"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="08123456789"
          />

          {!editingUser && (
            <Input
              label="Password Default"
              type="password"
              required
              {...register('password')}
              error={errors.password?.message}
              placeholder="Minimal 6 karakter"
            />
          )}
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Hapus Pengguna?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingUser(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500">
          Apakah Anda yakin ingin menghapus pengguna <strong>{deletingUser?.username}</strong>? Tindakan ini
          tidak dapat dibatalkan.
        </p>
      </Modal>

      {/* Modal Ganti Password */}
      <Modal
        open={!!passwordUser}
        onClose={() => setPasswordUser(null)}
        title="Ganti Password Pengguna"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordUser(null)} disabled={isChangingPassword}>
              Batal
            </Button>
            <Button variant="primary" icon={<Key size={14} />} onClick={onSubmitChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </>
        }
      >
        {passwordUser && (
          <form onSubmit={onSubmitChangePassword} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="avatar avatar-sm">{passwordUser.username.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{passwordUser.username}</div>
                <div className="text-xs text-slate-500">{passwordUser.email}</div>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Password Baru"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={passwordValues.password}
                onChange={(e) => setPasswordValues({ ...passwordValues, password: e.target.value })}
              />

              <Input
                label="Konfirmasi Password Baru"
                type="password"
                required
                placeholder="Ketik ulang password baru"
                value={passwordValues.password_confirmation}
                onChange={(e) => setPasswordValues({ ...passwordValues, password_confirmation: e.target.value })}
              />
            </div>
          </form>
        )}
      </Modal>

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
                setFilterIsActive('');
                setFilterIsVerified('');
                setFilterName('');
                setFilterRole('');
                setFilterRoleObj(null);
                setFilterDate('');
                setFilterOrderBy('id');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  isActive: '',
                  isVerified: '',
                  name: '',
                  role: '',
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
                  isActive: filterIsActive,
                  isVerified: filterIsVerified,
                  name: filterName,
                  role: filterRole,
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
        <div className="flex flex-col gap-5">
          <Input
            label="Nama Pengguna"
            placeholder="Ketik nama pengguna..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <AsyncSelect
            label="Role"
            placeholder="Cari nama role (cth: admin)..."
            value={filterRoleObj}
            onChange={(selected: any) => {
              setFilterRoleObj(selected);
              setFilterRole(selected ? selected.value : '');
            }}
            loadOptions={loadRoleOptions}
            isClearable
          />

          <Input
            label="Tanggal Dibuat"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <Select
            label="Status Akun"
            value={filterIsActive}
            onChange={(val) => setFilterIsActive(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
            ]}
          />

          <Select
            label="Status Verifikasi"
            value={filterIsVerified}
            onChange={(val) => setFilterIsVerified(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Terverifikasi' },
              { value: 'false', label: 'Belum Verifikasi' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'username', label: 'Nama Pengguna' },
                { value: 'email', label: 'Email' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'is_active', label: 'Status Akun' },
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
    </div>
  );
}
