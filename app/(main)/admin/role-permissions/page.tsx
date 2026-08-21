'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckSquare, Square, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { moduleService, AppModule } from '@/services/module.service';
import { adminService } from '@/services/admin.service';
import type { Permission } from '@/types/auth.types';

interface PermissionItem {
  id: number;
  name: string;
  slug: string;
  module: string;
}

export default function AdminRolePermissionsPage() {
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [assignedMap, setAssignedMap] = useState<Record<number, number[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesRes, rolePermsRes, permsRes, modulesRes] = await Promise.allSettled([
          adminService.getRoles({ per_page: 100 }),
          adminService.getRolePermissions(),
          adminService.getPermissions({ per_page: 500 }),
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
          setPermissions(
            permList.map((p) => ({ id: (p as any).id, name: (p as any).name, slug: (p as any).slug, module: (p as any).module }))
          );
        }

        if (rolePermsRes.status === 'fulfilled') {
          const res = rolePermsRes.value;
          const rolePermsList = Array.isArray(res?.data)
            ? res.data
            : ((res?.data as unknown as { items?: unknown[] })?.items ?? []);
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

  const handleToggle = (permId: number) => {
    const isChecked = currentAssigned.includes(permId);
    const updated = isChecked
      ? currentAssigned.filter((id) => id !== permId)
      : [...currentAssigned, permId];

    setAssignedMap({ ...assignedMap, [selectedRoleId]: updated });
  };

  const isModuleCodeMatch = (modCode: string, permModule: string) => {
    const c = (modCode || '').toLowerCase();
    const m = (permModule || '').toLowerCase();
    if (c === m) return true;
    if ((c === 'sso' || c === 'iam') && (m === 'sso' || m === 'iam')) return true;
    return false;
  };

  const handleToggleModuleAll = (moduleCode: string) => {
    const modulePerms = permissions
      .filter((p) => isModuleCodeMatch(moduleCode, p.module))
      .map((p) => p.id);
    const allChecked = modulePerms.every((id) => currentAssigned.includes(id));

    const updated = allChecked
      ? currentAssigned.filter((id) => !modulePerms.includes(id))
      : Array.from(new Set([...currentAssigned, ...modulePerms]));

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

  const renderPermissionCard = (p: PermissionItem) => {
    const checked = currentAssigned.includes(p.id);
    return (
      <div
        key={p.id}
        onClick={() => handleToggle(p.id)}
        className={[
          'flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-all',
          checked
            ? 'bg-primary-50 border border-primary-300'
            : 'bg-white border border-slate-200 hover:border-slate-300',
        ].join(' ')}
      >
        {checked ? (
          <CheckSquare size={20} className="text-primary-600 shrink-0" />
        ) : (
          <Square size={20} className="text-slate-400 shrink-0" />
        )}
        <div className="min-w-0">
          <div className={`text-sm font-bold truncate ${checked ? 'text-primary-900' : 'text-slate-700'}`}>
            {p.name}
          </div>
          <div className="text-xs text-slate-400 font-mono">{p.slug}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Pemetaan Role ↔ Permission (Role-Permissions Table)"
        description="Atur matrix hak akses granular untuk setiap role dalam ekosistem SSO (Tabel: role_permissions)"
        action={
          <Button icon={<Save size={16} />} loading={isSaving} onClick={handleSave}>
            Simpan Perubahan Matrix
          </Button>
        }
      />

      {/* Filters Section */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Pilih Role Pengguna"
            value={selectedRoleId ? selectedRoleId.toString() : ''}
            onChange={(val: string) => setSelectedRoleId(parseInt(val) || 0)}
            options={roles.map((r) => ({ value: r.id.toString(), label: r.name }))}
            isDisabled={isLoading}
          />
          <Select
            label="Filter Modul Aplikasi"
            value={selectedModule}
            onChange={(val: string) => setSelectedModule(val)}
            options={[
              { value: 'all', label: 'Tampilkan Semua Modul' },
              ...appModules.map((m) => ({ value: m.code, label: `${m.name} (${m.code.toUpperCase()})` })),
            ]}
            isDisabled={isLoading}
          />
        </div>
        <p className="mt-3 text-[0.8125rem] text-slate-400">
          Terdapat <strong>{currentAssigned.length}</strong> hak akses aktif dari total{' '}
          {permissions.length} permission.
        </p>
      </div>

      {/* Dynamic Module Permission Cards */}
      <div className="flex flex-col gap-5">
        {appModules
          .filter((mod) => selectedModule === 'all' || mod.code === selectedModule)
          .map((mod) => {
            const modulePerms = permissions.filter((p) => isModuleCodeMatch(mod.code, p.module));
            if (modulePerms.length === 0) return null;

            const allModuleChecked = modulePerms.every((p) => currentAssigned.includes(p.id));

            return (
              <div key={mod.id} className="card">
                <div className="card-header flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Badge variant="blue">{mod.code.toUpperCase()}</Badge>
                    <h4 className="text-[1.0625rem] font-bold m-0">Modul: {mod.name}</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleModuleAll(mod.code)}
                  >
                    {allModuleChecked ? 'Batalkan Semua' : 'Pilih Semua Modul Ini'}
                  </Button>
                </div>

                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulePerms.map((p) => renderPermissionCard(p))}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Fallback Section for permissions with modules not in appModules */}
        {selectedModule === 'all' &&
          (() => {
            const otherPerms = permissions.filter(
              (p) => !p.module || !appModules.some((m) => isModuleCodeMatch(m.code, p.module))
            );
            if (otherPerms.length === 0) return null;

            return (
              <div className="card">
                <div className="card-header bg-slate-50">
                  <h4 className="text-[1.0625rem] font-bold m-0">Permission Lainnya</h4>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherPerms.map((p) => renderPermissionCard(p))}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
