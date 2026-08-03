'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle, Filter } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { User, Role } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterIsActive, setFilterIsActive] = useState<string>('');
  const [filterIsVerified, setFilterIsVerified] = useState<string>('');
  const [filterName, setFilterName] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterRoleObj, setFilterRoleObj] = useState<{value: string, label: string} | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('id');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('desc');
  const [filterLimit, setFilterLimit] = useState<string>('15');

  // Applied Filters State (yang benar-benar digunakan untuk fetch API)
  const [appliedFilters, setAppliedFilters] = useState({
    isActive: '',
    isVerified: '',
    name: '',
    role: '',
    date: '',
    orderBy: 'id',
    orderDir: 'desc'
  });

  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Modal States
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',

    password: '',
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

      // Check if it's a direct Laravel paginator response
      if (res && Array.isArray(res.data) && 'current_page' in res) {
        userList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to
        };
      } 
      // Check if it's wrapped in a custom response format { data: { items, meta } }
      else if (res && res.data && Array.isArray(res.data.items)) {
        userList = res.data.items;
        metaData = res.data.meta;
      } 
      // Fallback if it's just an array inside data
      else if (res && Array.isArray(res.data)) {
        userList = res.data;
      }
      // Absolute fallback if res is the array itself
      else if (Array.isArray(res)) {
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
    page
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
    } catch (err) {
      return [];
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', phone: '', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',

      password: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      toast.error('Username dan Email wajib diisi.');
      return;
    }

    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, formData);
        toast.success('Pengguna berhasil diperbarui!');
      } else {
        await adminService.createUser(formData);
        toast.success('Pengguna baru berhasil ditambahkan!');
      }
      fetchUsers();
    } catch {
      toast.error('Gagal menyimpan data. Periksa koneksi ke server.');
    } finally {
      setShowModal(false);
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

  const columns: ColumnDef<User>[] = [
    { key: 'id', label: 'No', render: (row, index) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{meta?.from ? meta.from + index : index + 1}</span> },
    { key: 'pengguna', label: 'Pengguna', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="avatar avatar-sm">
          {row.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.username}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      </div>
    )},
    { key: 'roles', label: 'Role(s)', render: (row) => (
      <>
        {row.roles?.map(r => (
          <span key={r.id} style={{ display: 'inline-block', marginRight: '4px', background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{r.name || r.role?.name}</span>
        ))}
      </>
    )},
    { key: 'status', label: 'Status Akun', render: (row) => (
      <button
        onClick={() => handleToggleStatus(row)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        title="Klik untuk mengubah status"
      >
        <StatusBadge active={row.is_active} />
      </button>
    )},
    { key: 'verified', label: 'Terverifikasi', render: (row) => (
      row.is_verified ? (
        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>
          <CheckCircle size={14} /> Ya
        </span>
      ) : (
        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>
          <XCircle size={14} /> Belum
        </span>
      )
    )},
    { key: 'created_at', label: 'Tanggal Dibuat', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        {formatDate(row.created_at)}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Edit2 size={14} />}
          onClick={() => handleOpenEdit(row)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} color="var(--danger)" />}
          onClick={() => setDeletingUser(row)}
        />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Pengguna (Users Table)"
        description="Kelola akun, role, dan hak akses pengguna ekosistem kampus (Tabel: users)"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Pengguna
            </Button>
            <Button 
              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
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
        onLimitChange={(l) => { setFilterLimit(l.toString()); setPage(1); }}
      />

      {/* Modal Form Create/Edit */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>
              {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="contoh: mhs_2026"
          />

          <Input
            label="Email Kampus"
            type="email"
            required
            prefixIcon={<Mail size={16} />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="nama@kampus.ac.id"
          />

          <Input
            label="Nomor HP / WhatsApp"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="08123456789"
          />



          {!editingUser && (
            <Input
              label="Password Default"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            <Button variant="secondary" onClick={() => setDeletingUser(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin menghapus pengguna <strong>{deletingUser?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengguna"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
                  orderDir: 'desc'
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
                  orderDir: filterOrderDir
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              { value: 'false', label: 'Nonaktif' }
            ]}
          />

          <Select 
            label="Status Verifikasi"
            value={filterIsVerified}
            onChange={(val) => setFilterIsVerified(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Terverifikasi' },
              { value: 'false', label: 'Belum Verifikasi' }
            ]}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

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
                { value: 'is_active', label: 'Status Akun' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' }
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
