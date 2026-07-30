'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UserTypeBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { UserType } from '@/types/auth.types';

interface UserRoleMapping {
  user_id: number;
  username: string;
  email: string;
  user_type: UserType;
  roles: { id: number; name: string; slug: string }[];
  created_at: string;
}

const MOCK_ROLES = [
  { id: 1, name: 'Super Admin', slug: 'admin' },
  { id: 2, name: 'Dosen Pengajar', slug: 'dosen' },
  { id: 3, name: 'Mahasiswa Reguler', slug: 'mahasiswa' },
  { id: 4, name: 'Staf Keuangan', slug: 'staf_keuangan' },
];

const MOCK_USER_ROLES: UserRoleMapping[] = [
  {
    user_id: 1,
    username: 'admin_super',
    email: 'admin@kampus.ac.id',
    user_type: 'admin',
    roles: [{ id: 1, name: 'Super Admin', slug: 'admin' }],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 2,
    username: 'dosen_siakad',
    email: 'dosen@kampus.ac.id',
    user_type: 'dosen',
    roles: [{ id: 2, name: 'Dosen Pengajar', slug: 'dosen' }],
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    user_id: 3,
    username: 'mahasiswa_demo',
    email: 'mhs@kampus.ac.id',
    user_type: 'mahasiswa',
    roles: [{ id: 3, name: 'Mahasiswa Reguler', slug: 'mahasiswa' }],
    created_at: '2026-01-10T00:00:00Z',
  },
];

export default function AdminUserRolesPage() {
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [userRoles, setUserRoles] = useState<UserRoleMapping[]>(MOCK_USER_ROLES);
  const [editingUser, setEditingUser] = useState<UserRoleMapping | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, userRolesRes] = await Promise.allSettled([
          adminService.getRoles(),
          adminService.getUserRoles(),
        ]);

        if (rolesRes.status === 'fulfilled') {
          const res = rolesRes.value;
          const roleList = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
          if (roleList?.length) {
            setRoles(roleList.map((r: any) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
            })));
          }
        }

        if (userRolesRes.status === 'fulfilled') {
          const res = userRolesRes.value;
          const userList = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
          if (userList?.length) {
            const mapped: UserRoleMapping[] = userList.map((u: any) => ({
              user_id: u.id,
              username: u.username,
              email: u.email,
              user_type: u.user_type,
              roles: u.roles || [],
              created_at: u.created_at || new Date().toISOString(),
            }));
            setUserRoles(mapped);
          }
        }
      } catch {
        // Fallback to MOCK_USER_ROLES if backend endpoint is unavailable
      }
    };
    fetchData();
  }, []);

  const handleOpenAssign = (ur: UserRoleMapping) => {
    setEditingUser(ur);
    setSelectedRoleIds(ur.roles.map((r) => r.id));
  };

  const handleToggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveAssignment = async () => {
    if (!editingUser) return;

    try {
      await adminService.assignRolesToUser(editingUser.user_id, selectedRoleIds);
      const newAssignedRoles = roles.filter((r) => selectedRoleIds.includes(r.id));
      setUserRoles((prev) =>
        prev.map((ur) =>
          ur.user_id === editingUser.user_id ? { ...ur, roles: newAssignedRoles } : ur
        )
      );
      toast.success(`Role untuk ${editingUser.username} berhasil diperbarui di server!`);
    } catch {
      const newAssignedRoles = roles.filter((r) => selectedRoleIds.includes(r.id));
      setUserRoles((prev) =>
        prev.map((ur) =>
          ur.user_id === editingUser.user_id ? { ...ur, roles: newAssignedRoles } : ur
        )
      );
      toast.success(`Role untuk ${editingUser.username} diperbarui (Mode lokal)`);
    } finally {
      setEditingUser(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Penugasan Role Pengguna (User-Roles Table)"
        description="Hubungkan pengguna dengan satu atau lebih role sesuai wewenang (Tabel: user_roles)"
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Pengguna</th>
                <th>Tipe</th>
                <th>Role Terpasang</th>
                <th>Tanggal Penugasan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {userRoles.map((ur) => (
                <tr key={ur.user_id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{ur.user_id}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{ur.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ur.email}</div>
                  </td>
                  <td>
                    <UserTypeBadge type={ur.user_type} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {ur.roles.length === 0 ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tanpa Role</span>
                      ) : (
                        ur.roles.map((r) => (
                          <span key={r.id} className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <ShieldAlert size={12} /> {r.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {formatDate(ur.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenAssign(ur)}
                    >
                      Kelola Role
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assign Roles */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Kelola Role untuk ${editingUser?.username}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveAssignment}>Simpan Role</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pilih role yang ingin dipasangkan ke akun <strong>{editingUser?.email}</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {roles.map((r) => {
              const isChecked = selectedRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isChecked ? 'var(--primary-300)' : 'var(--border-light)'}`,
                    background: isChecked ? 'var(--primary-50)' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRole(r.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>slug: {r.slug}</div>
                    </div>
                  </div>
                  {isChecked && <span className="badge badge-green">Terpasang</span>}
                </label>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
