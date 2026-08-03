'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, ShieldAlert, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
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

export default function AdminUserRolesPage() {
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRoleMapping | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('username');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('asc');

  const [appliedFilterName, setAppliedFilterName] = useState<string>('');
  const [appliedFilterRole, setAppliedFilterRole] = useState<string>('all');
  const [appliedFilterOrderBy, setAppliedFilterOrderBy] = useState<string>('username');
  const [appliedFilterOrderDir, setAppliedFilterOrderDir] = useState<string>('asc');

  const filteredUserRoles = [...userRoles].filter(ur => {
    // Filter by name/email
    let matchName = true;
    if (appliedFilterName) {
      const lowerQ = appliedFilterName.toLowerCase();
      matchName = ur.username.toLowerCase().includes(lowerQ) || ur.email.toLowerCase().includes(lowerQ);
    }

    // Filter by Role
    let matchRole = true;
    if (appliedFilterRole !== 'all') {
      if (appliedFilterRole === '0') {
        matchRole = ur.roles.length === 0; // 0 = Tanpa Role
      } else {
        matchRole = ur.roles.some(r => r.id.toString() === appliedFilterRole);
      }
    }

    return matchName && matchRole;
  }).sort((a, b) => {
    let cmp = 0;
    if (appliedFilterOrderBy === 'username') {
      cmp = a.username.localeCompare(b.username);
    } else if (appliedFilterOrderBy === 'email') {
      cmp = a.email.localeCompare(b.email);
    }

    return appliedFilterOrderDir === 'desc' ? -cmp : cmp;
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesRes, userRolesRes] = await Promise.allSettled([
          adminService.getRoles(),
          adminService.getUserRoles(),
        ]);

        if (rolesRes.status === 'fulfilled') {
          const res = rolesRes.value;
          const roleList = Array.isArray(res?.data)
            ? res.data
            : (res?.data as { items?: { id: number; name: string; slug: string }[] })?.items ?? [];
          setRoles(roleList.map((r) => ({ id: r.id, name: r.name, slug: r.slug })));
        } else {
          toast.error('Gagal memuat data role. Periksa koneksi ke server.');
        }

        if (userRolesRes.status === 'fulfilled') {
          const res = userRolesRes.value;
          const userList = Array.isArray(res?.data)
            ? res.data
            : ((res?.data as unknown as { items?: unknown[] })?.items ?? []);
          if (userList.length) {
            const mapped: UserRoleMapping[] = (userList as any[]).map((u) => ({
              user_id: u.id,
              username: u.username,
              email: u.email,
              user_type: u.user_type,
              roles: u.roles || [],
              created_at: u.created_at || new Date().toISOString(),
            }));
            setUserRoles(mapped);
          }
        } else {
          toast.error('Gagal memuat data user-roles. Periksa koneksi ke server.');
        }
      } finally {
        setIsLoading(false);
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
      toast.success(`Role untuk ${editingUser.username} berhasil diperbarui!`);
    } catch {
      toast.error(`Gagal menyimpan role untuk ${editingUser.username}. Periksa koneksi ke server.`);
    } finally {
      setEditingUser(null);
    }
  };

  const columns: ColumnDef<UserRoleMapping>[] = [
    { key: 'user_id', label: 'No', render: (row, index) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span> },
    { key: 'pengguna', label: 'Pengguna', render: (row) => (
      <div>
        <div style={{ fontWeight: 700 }}>{row.username}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
      </div>
    )},
    { key: 'roles', label: 'Role Terpasang', render: (row) => (
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {row.roles.length === 0 ? (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tanpa Role</span>
        ) : (
          row.roles.map((r) => (
            <span key={r.id} className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={12} /> {r.name}
            </span>
          ))
        )}
      </div>
    )},
    { key: 'created_at', label: 'Tanggal Penugasan', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {formatDate(row.created_at)}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <Button
        variant="outline"
        size="sm"
        icon={<Edit2 size={14} />}
        onClick={() => handleOpenAssign(row)}
      >
        Kelola Role
      </Button>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Penugasan Role Pengguna (User-Roles Table)"
        description="Hubungkan pengguna dengan satu atau lebih role sesuai wewenang (Tabel: user_roles)"
        action={
          <Button 
            style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
            icon={<Filter size={16} />} 
            onClick={() => setShowFilter(true)}
          >
            Filter
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredUserRoles}
        isLoading={isLoading}
      />

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
                setFilterName('');
                setFilterRole('all');
                setFilterOrderBy('username');
                setFilterOrderDir('asc');
                setAppliedFilterName('');
                setAppliedFilterRole('all');
                setAppliedFilterOrderBy('username');
                setAppliedFilterOrderDir('asc');
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
            label="Cari Pengguna"
            placeholder="Ketik username atau email..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <Select
            label="Role Terpasang"
            value={filterRole}
            onChange={(val) => setFilterRole(val)}
            options={[
              { value: 'all', label: 'Semua Role' },
              { value: '0', label: 'Tanpa Role' },
              ...roles.map(r => ({ value: r.id.toString(), label: r.name }))
            ]}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'username', label: 'Nama Pengguna' },
                { value: 'email', label: 'Email' }
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

          <div style={{ minHeight: '12rem' }}>
            <Select
              isMulti
              placeholder="Cari dan pilih role..."
              options={roles.map(r => ({ value: r.id.toString(), label: r.name + ' (' + r.slug + ')' }))}
              value={selectedRoleIds.map(id => id.toString())}
              onChange={(vals: string[]) => setSelectedRoleIds(vals.map(v => parseInt(v)))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
