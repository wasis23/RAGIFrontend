'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { User } from '@/types/auth.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');


  // Modal States
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
      const res = await adminService.getUsers({ search });
      const userList = Array.isArray(res?.data)
        ? res.data
        : (res?.data as { items?: User[] })?.items ?? [];
      setUsers(userList);
    } catch {
      toast.error('Gagal memuat data pengguna. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

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

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
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
                <th>Role(s)</th>
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
                      {user.roles?.map(r => (
                        <span key={r.id} style={{ display: 'inline-block', marginRight: '4px', background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{r.name || r.role?.name}</span>
                      ))}
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
    </div>
  );
}
