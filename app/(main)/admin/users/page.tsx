'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Mail, CheckCircle, XCircle, Filter, Key, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useImpersonateStore } from '@/store/impersonateStore';
import { getCookieDomain, getAuthTokenKey } from '@/lib/domain';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import type { User } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

const userSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').max(150, 'Nama maksimal 150 karakter'),
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

  // Impersonate States & Auth Store
  const { user: currentUser } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const adminAccessToken = useAuthStore((s) => s.access_token);
  const adminRefreshToken = useAuthStore((s) => s.refresh_token);
  const startImpersonating = useImpersonateStore((s) => s.startImpersonating);
  const [impersonatingUser, setImpersonatingUser] = useState<User | null>(null);
  const [isImpersonatingSubmitting, setIsImpersonatingSubmitting] = useState(false);

  // React Hook Form + Zod Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
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
        if (res.meta) {
          metaData = res.meta;
        }
      } else if (Array.isArray(res)) {
        userList = res;
      }

      if (!metaData && Array.isArray(userList)) {
        metaData = {
          current_page: page,
          last_page: 1,
          per_page: Number(filterLimit) || 15,
          total: userList.length,
          from: userList.length > 0 ? 1 : 0,
          to: userList.length,
        };
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
    reset({ name: '', username: '', email: '', phone: '', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name || user.nama_lengkap || user.username,
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

  const handleOpenImpersonate = (user: User) => {
    if (currentUser && currentUser.id === user.id) {
      toast.error('Anda tidak dapat merasuki akun sendiri.');
      return;
    }
    if (!user.is_active) {
      toast.error('Pengguna ini sedang non-aktif dan tidak dapat dirasuki.');
      return;
    }
    setImpersonatingUser(user);
  };

  const handleConfirmImpersonate = async () => {
    if (!impersonatingUser) return;
    setIsImpersonatingSubmitting(true);
    try {
      const res = await adminService.impersonateUser(impersonatingUser.id);
      const resData = res?.data;
      const targetToken = resData?.token || resData?.access_token;
      const targetUser = resData?.user || impersonatingUser;

      if (!targetToken) {
        throw new Error('Gagal mendapatkan token autentikasi dari server.');
      }

      // 1. Simpan sesi admin aktif ke Zustand Impersonate Store
      const tokenKey = getAuthTokenKey();
      const currentAdminToken = adminAccessToken || '';
      const currentAdminRefreshToken = adminRefreshToken || currentAdminToken;

      if (currentUser) {
        startImpersonating(currentAdminToken, currentAdminRefreshToken, currentUser);
      }

      // 2. Terapkan token dan cookie pengguna yang dirasuki
      const domainAttr = getCookieDomain();
      const roleKey = tokenKey === 'demo_sso_access_token' ? 'demo_sso_user_role' : 'sso_user_role';
      const targetRole = targetUser.roles?.[0]?.role?.slug || targetUser.roles?.[0]?.slug || 'user';

      document.cookie = `${tokenKey}=${targetToken}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `${roleKey}=${targetRole}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;

      setAuth(targetUser, targetToken, targetToken);

      const targetName = targetUser.name || targetUser.nama_lengkap || targetUser.username;
      toast.success(`Berhasil merasuki pengguna ${targetName}!`);

      // 3. Alihkan ke dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal merasuki pengguna.');
      setIsImpersonatingSubmitting(false);
      setImpersonatingUser(null);
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
      render: (row) => {
        const displayName = row.name || row.nama_lengkap || row.username;
        return (
          <div className="flex items-center gap-3">
            <div className="avatar avatar-sm">{displayName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="font-bold text-slate-900">{displayName}</div>
              <div className="text-xs text-slate-400">{row.username} • {row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'roles',
      label: 'Role(s)',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((r: any) => (
              <Badge key={r.id || r.name} variant="blue">
                {r.name || r.role?.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
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
          <Badge variant="success" className="inline-flex items-center gap-2">
            <CheckCircle size={14} /> Ya
          </Badge>
        ) : (
          <Badge variant="gray" className="inline-flex items-center gap-2">
            <XCircle size={14} /> Belum
          </Badge>
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
                label: 'Rasuki Pengguna',
                icon: <Sparkles size={14} className="text-amber-500" />,
                onClick: () => handleOpenImpersonate(row),
              },
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
    <div className="animate-fade-in flex w-full flex-col gap-6">
      <PageHeader
        title="Manajemen Pengguna (Users Table)"
        description="Kelola akun, role, dan hak akses pengguna ekosistem kampus (Tabel: users)"
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
              Tambah Pengguna
            </Button>
          </div>
        }
      />

      {/* Table Card */}
      <div className="w-full bg-white rounded-xl shadow-2xs border border-slate-200">
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
      </div>

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
            label="Nama Lengkap"
            required
            {...register('name')}
            error={errors.name?.message}
            placeholder="contoh: Dr. Ahmad Fauzi, M.Kom"
          />

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

      {/* Modal Rasuki Pengguna */}
      <Modal
        open={!!impersonatingUser}
        onClose={() => setImpersonatingUser(null)}
        title="Rasuki Pengguna (Impersonate)"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setImpersonatingUser(null)}
              disabled={isImpersonatingSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={handleConfirmImpersonate}
              loading={isImpersonatingSubmitting}
              disabled={isImpersonatingSubmitting}
            >
              {isImpersonatingSubmitting ? 'Memproses Sesi...' : 'Ya, Rasuki Sekarang'}
            </Button>
          </>
        }
      >
        {impersonatingUser && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <div className="avatar avatar-sm bg-amber-200 text-amber-900 font-bold">
                {(impersonatingUser.name || impersonatingUser.username).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {impersonatingUser.name || impersonatingUser.username}
                </div>
                <div className="text-xs text-slate-500">
                  {impersonatingUser.username} • {impersonatingUser.email}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Anda akan beralih dan otomatis login sebagai <strong>{impersonatingUser.name || impersonatingUser.username}</strong> dengan seluruh wewenang peran yang dimilikinya. Seluruh aksi Anda selama sesi ini akan tercatat dalam sistem.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span>Anda dapat kembali ke akun Administrator kapan saja melalui tombol bilah atas.</span>
            </div>
          </div>
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
        <div className="flex flex-col gap-4">
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
                { value: 'name', label: 'Nama Lengkap' },
                { value: 'username', label: 'Nama Pengguna' },
                { value: 'email', label: 'Email' },
                { value: 'is_active', label: 'Status Akun' },
                { value: 'is_verified', label: 'Status Verifikasi' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
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
