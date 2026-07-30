'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { Role } from '@/types/auth.types';

const MOCK_ROLES: Role[] = [
  {
    id: 1,
    name: 'Super Admin',
    slug: 'admin',
    description: 'Akses penuh ke seluruh modul & konfigurasi SSO kampus',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Dosen Pengajar',
    slug: 'dosen',
    description: 'Akses ke SIAKAD, LMS, dan SIMPI untuk kegiatan mengajar & nilai',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Mahasiswa Reguler',
    slug: 'mahasiswa',
    description: 'Akses portal akademik mahasiswa (KRS, KHS, Pembayaran, LMS)',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Staf Keuangan',
    slug: 'staf_keuangan',
    description: 'Kelola pembayaran UKT, billing, dan keuangan mahasiswa di SIKEU',
    created_at: '2026-01-10T00:00:00Z',
  },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getRoles();
      const roleList = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
      setRoles(roleList?.length ? roleList : MOCK_ROLES);
    } catch {
      setRoles(MOCK_ROLES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Nama Role dan Slug wajib diisi.');
      return;
    }

    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, formData);
        toast.success('Role berhasil diperbarui di server!');
      } else {
        await adminService.createRole(formData);
        toast.success('Role baru berhasil ditambahkan ke server!');
      }
      fetchRoles();
    } catch {
      // Fallback update state lokal jika endpoint backend belum tersedia
      if (editingRole) {
        setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? { ...r, ...formData } : r)));
        toast.success('Role diperbarui (Mode lokal)');
      } else {
        const newRole: Role = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
        };
        setRoles((prev) => [...prev, newRole]);
        toast.success('Role ditambahkan (Mode lokal)');
      }
    } finally {
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await adminService.deleteRole(deletingRole.id);
      toast.success(`Role ${deletingRole.name} berhasil dihapus dari server.`);
      fetchRoles();
    } catch {
      setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
      toast.success(`Role ${deletingRole.name} dihapus (Mode lokal).`);
    } finally {
      setDeletingRole(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Role Akses (Roles Table)"
        description="Definisikan struktur peran pengguna dalam ekosistem kampus (Tabel: roles)"
        action={
          <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Tambah Role Baru
          </Button>
        }
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Role</th>
                <th>Slug Identifier</th>
                <th>Deskripsi Akses</th>
                <th>Tanggal Dibuat</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    Belum ada data role.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{role.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <ShieldAlert size={16} color="var(--primary-600)" />
                        {role.name}
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700 }}>
                        {role.slug}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {role.description || '-'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatDate(role.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={14} />}
                          onClick={() => handleOpenEdit(role)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} color="var(--danger)" />}
                          onClick={() => setDeletingRole(role)}
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

      {/* Modal Form */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>
              {editingRole ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <Input
            label="Nama Role"
            required
            placeholder="Contoh: Dosen Pembimbing"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              setFormData({ ...formData, name, slug: editingRole ? formData.slug : slug });
            }}
          />

          <Input
            label="Slug Unique Identifier"
            required
            placeholder="contoh: dosen_pembimbing"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            hint="Format: lowercase dengan underscore"
          />

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Deskripsi wewenang role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        title="Hapus Role?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingRole(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Hapus role <strong>{deletingRole?.name}</strong>? Pengguna dengan role ini akan kehilangan wewenang terkait.
        </p>
      </Modal>
    </div>
  );
}
