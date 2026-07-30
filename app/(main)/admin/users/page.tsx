'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UserTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { User, UserType } from '@/types/auth.types';

const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'admin_super',
    email: 'admin@kampus.ac.id',
    phone: '081234567890',
    user_type: 'admin',
    is_active: true,
    is_verified: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 2,
    username: 'dosen_siakad',
    email: 'dosen.utama@kampus.ac.id',
    phone: '081987654321',
    user_type: 'dosen',
    is_active: true,
    is_verified: true,
    created_at: '2026-02-01T09:30:00Z',
    updated_at: '2026-02-01T09:30:00Z',
  },
  {
    id: 3,
    username: 'mahasiswa_demo',
    email: 'mhs2026@kampus.ac.id',
    phone: '081333444555',
    user_type: 'mahasiswa',
    is_active: true,
    is_verified: true,
    created_at: '2026-02-10T14:15:00Z',
    updated_at: '2026-02-10T14:15:00Z',
  },
  {
    id: 4,
    username: 'tendik_keuangan',
    email: 'tendik.keu@kampus.ac.id',
    phone: '081555666777',
    user_type: 'tendik',
    is_active: false,
    is_verified: true,
    created_at: '2026-03-05T11:20:00Z',
    updated_at: '2026-03-05T11:20:00Z',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    user_type: 'mahasiswa' as UserType,
    password: '',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({ search });
      const userList = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
      setUsers(userList?.length ? userList : MOCK_USERS);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', phone: '', user_type: 'mahasiswa', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      user_type: user.user_type,
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
      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
        );
        toast.success('Pengguna diperbarui (Mode lokal)');
      } else {
        const newUser: User = {
          id: Date.now(),
          ...formData,
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);
        toast.success('Pengguna baru ditambahkan (Mode lokal)');
      }
    } finally {
      setShowModal(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await adminService.toggleUserActive(user.id, !user.is_active);
      toast.success(`Status ${user.username} diubah menjadi ${!user.is_active ? 'Aktif' : 'Nonaktif'}`);
      fetchUsers();
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
      toast.success(`Status ${user.username} diubah (Mode lokal)`);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminService.deleteUser(deletingUser.id);
      toast.success(`Pengguna ${deletingUser.username} telah dihapus.`);
      fetchUsers();
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      toast.success(`Pengguna ${deletingUser.username} dihapus (Mode lokal).`);
    } finally {
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || u.user_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Pengguna (Users Table)"
        description="Kelola akun, role, dan hak akses pengguna ekosistem kampus (Tabel: users)"
        action={
          <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Tambah Pengguna
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Cari berdasarkan username atau email..."
              prefixIcon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tipe:</span>
            <select
              className="select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="all">Semua Tipe</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="tendik">Tendik</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pengguna</th>
                <th>Tipe (user_type)</th>
                <th>Status Akun</th>
                <th>Terverifikasi</th>
                <th>Tanggal Dibuat</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Data pengguna tidak ditemukan.</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{user.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <UserTypeBadge type={user.user_type} />
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Klik untuk mengubah status"
                      >
                        <StatusBadge active={user.is_active} />
                      </button>
                    </td>
                    <td>
                      {user.is_verified ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>
                          <CheckCircle size={14} /> Ya
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>
                          <XCircle size={14} /> Belum
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={14} />}
                          onClick={() => handleOpenEdit(user)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} color="var(--danger)" />}
                          onClick={() => setDeletingUser(user)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
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

          <div className="form-group">
            <label className="form-label required">Tipe Pengguna (user_type)</label>
            <select
              className="select"
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value as UserType })}
            >
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="tendik">Tendik</option>
              <option value="admin">Admin</option>
              <option value="calon_mhs">Calon Mahasiswa</option>
            </select>
          </div>

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
    </div>
  );
}
