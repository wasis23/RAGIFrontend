'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { moduleService, AppModule } from '@/services/module.service';
import { adminService } from '@/services/admin.service';

interface PermissionItem {
  id: number;
  name: string;
  slug: string;
  module: string;
}

const MOCK_ROLES = [
  { id: 1, name: 'Super Admin (admin)', slug: 'admin' },
  { id: 2, name: 'Dosen Pengajar (dosen)', slug: 'dosen' },
  { id: 3, name: 'Mahasiswa Reguler (mahasiswa)', slug: 'mahasiswa' },
  { id: 4, name: 'Staf Keuangan (staf_keuangan)', slug: 'staf_keuangan' },
];

const MOCK_PERMISSIONS: PermissionItem[] = [
  { id: 1, name: 'Kelola Seluruh Pengguna', slug: 'iam.users.manage', module: 'iam' },
  { id: 2, name: 'Kelola Role & Hak Akses', slug: 'iam.roles.manage', module: 'iam' },
  { id: 3, name: 'Lihat Nilai & KHS', slug: 'siakad.grades.read', module: 'siakad' },
  { id: 4, name: 'Input & Edit Nilai Dosen', slug: 'siakad.grades.update', module: 'siakad' },
  { id: 5, name: 'Cetak Kartu Ujian (KPU)', slug: 'siakad.kpu.print', module: 'siakad' },
  { id: 6, name: 'Verifikasi Lunas UKT', slug: 'sikeu.billing.update', module: 'sikeu' },
  { id: 7, name: 'Generate Invoice Tagihan', slug: 'sikeu.billing.create', module: 'sikeu' },
  { id: 8, name: 'Kelola Kurikulum OBE', slug: 'obe.curriculum.manage', module: 'obe' },
  { id: 9, name: 'Akses Ruang Kelas LMS', slug: 'lms.courses.read', module: 'lms' },
  { id: 10, name: 'Upload Tugas & Quiz', slug: 'lms.assignments.create', module: 'lms' },
  { id: 11, name: 'Verifikasi Berkas Calon MHS', slug: 'spmb.documents.verify', module: 'spmb' },
  { id: 12, name: 'Kelola Publikasi & Penelitian', slug: 'simpi.research.manage', module: 'simpi' },
];

export default function AdminRolePermissionsPage() {
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [assignedMap, setAssignedMap] = useState<Record<number, number[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesRes, rolePermsRes, permsRes, modulesRes] = await Promise.allSettled([
          adminService.getRoles(),
          adminService.getRolePermissions(),
          adminService.getPermissions(),
          moduleService.getAllModules(),
        ]);

        if (rolesRes.status === 'fulfilled') {
          const res = rolesRes.value;
          const roleList = Array.isArray(res?.data)
            ? res.data
            : (res?.data as { items?: { id: number; name: string; slug: string }[] })?.items ?? [];
          const mapped = roleList.map((r) => ({ id: r.id, name: `${r.name} (${r.slug})`, slug: r.slug }));
          setRoles(mapped);
          if (mapped[0]) setSelectedRoleId(mapped[0].id);
        } else {
          toast.error('Gagal memuat data role. Periksa koneksi ke server.');
        }

        if (permsRes.status === 'fulfilled') {
          const res = permsRes.value;
          const permList = Array.isArray(res?.data)
            ? res.data
            : (res?.data as { items?: PermissionItem[] })?.items ?? [];
          setPermissions(permList.map((p) => ({ id: p.id, name: p.name, slug: p.slug, module: p.module })));
        }

        if (rolePermsRes.status === 'fulfilled') {
          const res = rolePermsRes.value;
          const rolePermsList = Array.isArray(res?.data) ? res.data : ((res?.data as unknown as { items?: unknown[] })?.items ?? []);
          if (rolePermsList.length) {
            const map: Record<number, number[]> = {};
            (rolePermsList as any[]).forEach((item) => {
              const pIds = (item.permissions || []).map((p: { id: number }) => p.id);
              map[item.id] = pIds;
            });
            setAssignedMap((prev) => ({ ...prev, ...map }));
          }
        }

        if (modulesRes.status === 'fulfilled') {
          setAppModules(modulesRes.value);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentAssigned = assignedMap[selectedRoleId] || [];
  const activePermissions = permissions.length > 0 ? permissions : MOCK_PERMISSIONS;

  const handleToggle = (permId: number) => {
    const isChecked = currentAssigned.includes(permId);
    const updated = isChecked
      ? currentAssigned.filter((id) => id !== permId)
      : [...currentAssigned, permId];

    setAssignedMap({
      ...assignedMap,
      [selectedRoleId]: updated,
    });
  };

  const handleToggleModuleAll = (moduleName: string) => {
    const modulePerms = activePermissions.filter((p) => p.module === moduleName).map((p) => p.id);
    const allChecked = modulePerms.every((id) => currentAssigned.includes(id));

    let updated: number[];
    if (allChecked) {
      updated = currentAssigned.filter((id) => !modulePerms.includes(id));
    } else {
      updated = Array.from(new Set([...currentAssigned, ...modulePerms]));
    }

    setAssignedMap({ ...assignedMap, [selectedRoleId]: updated });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminService.assignPermissionsToRole(selectedRoleId, currentAssigned);
      toast.success(`Hak akses untuk role berhasil disimpan! (${currentAssigned.length} permission)`);
    } catch {
      toast.error('Gagal menyimpan hak akses. Periksa koneksi ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Pemetaan Role ↔ Permission (Role-Permissions Table)"
        description="Atur matrix hak akses granular untuk setiap role dalam ekosistem SSO (Tabel: role_permissions)"
        action={
          <Button icon={<Save size={16} />} loading={isSaving} onClick={handleSave}>
            Simpan Perubahan Matrix
          </Button>
        }
      />

      {/* Role Selection Selector */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ShieldAlert size={20} color="var(--primary-600)" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Pilih Role yang Ingin Diatur:</span>
          <select
            className="select"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(Number(e.target.value))}
            style={{ maxWidth: 320, fontWeight: 700 }}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            ({currentAssigned.length} dari {activePermissions.length} hak akses aktif)
          </span>
        </div>
      </div>

      {/* Dynamic Module Permission Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {appModules.map((mod) => {
          const modulePerms = activePermissions.filter(
            (p) => p.module && p.module.toLowerCase() === mod.code.toLowerCase()
          );
          if (modulePerms.length === 0) return null;

          const allModuleChecked = modulePerms.every((p) => currentAssigned.includes(p.id));

          return (
            <div key={mod.id} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-blue">{mod.code.toUpperCase()}</span>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>Modul: {mod.name}</h4>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleToggleModuleAll(mod.code)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {allModuleChecked ? 'Batalkan Semua' : 'Pilih Semua Modul Ini'}
                </button>
              </div>

              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
                  {modulePerms.map((p) => {
                    const checked = currentAssigned.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggle(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${checked ? 'var(--primary-300)' : 'var(--border-light)'}`,
                          background: checked ? 'var(--primary-50)' : 'white',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {checked ? (
                          <CheckSquare size={20} color="var(--primary-600)" />
                        ) : (
                          <Square size={20} color="var(--gray-400)" />
                        )}
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: checked ? 'var(--primary-900)' : 'var(--text-primary)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {p.slug}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Fallback Section for permissions with modules not in appModules */}
        {(() => {
          const knownModules = appModules.map((m) => m.code.toLowerCase());
          const otherPerms = activePermissions.filter(
            (p) => !p.module || !knownModules.includes(p.module.toLowerCase())
          );
          if (otherPerms.length === 0) return null;

          return (
            <div className="card">
              <div className="card-header" style={{ background: 'var(--gray-50)' }}>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>Permission Lainnya</h4>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
                  {otherPerms.map((p) => {
                    const checked = currentAssigned.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggle(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${checked ? 'var(--primary-300)' : 'var(--border-light)'}`,
                          background: checked ? 'var(--primary-50)' : 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {checked ? <CheckSquare size={20} color="var(--primary-600)" /> : <Square size={20} color="var(--gray-400)" />}
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.slug}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
