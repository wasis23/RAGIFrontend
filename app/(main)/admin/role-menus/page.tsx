'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckSquare, Square, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { adminService } from '@/services/admin.service';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { Menu } from '@/types/menu';

export default function AdminRoleMenusPage() {
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [menusByModule, setMenusByModule] = useState<Record<string, Menu[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [assignedMenus, setAssignedMenus] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper untuk mendapatkan list ID dari hierarki menu
  const getFlatMenuIds = (menuList: Menu[]): number[] => {
    let ids: number[] = [];
    menuList.forEach(m => {
      ids.push(m.id);
      if (m.children && m.children.length > 0) {
        ids = ids.concat(getFlatMenuIds(m.children));
      }
    });
    return ids;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [rolesRes, modulesRes] = await Promise.allSettled([
          adminService.getRoles(),
          moduleService.getAllModules(),
        ]);

        if (rolesRes.status === 'fulfilled') {
          const res = rolesRes.value;
          const roleList = Array.isArray(res?.data)
            ? res.data
            : (res?.data as any)?.items ?? [];
          const mapped = roleList.map((r: any) => ({ id: r.id, name: `${r.name} (${r.slug})`, slug: r.slug }));
          setRoles(mapped);
          if (mapped[0]) setSelectedRoleId(mapped[0].id);
        } else {
          toast.error('Gagal memuat data role.');
        }

        let modulesData: AppModule[] = [];
        if (modulesRes.status === 'fulfilled') {
          modulesData = modulesRes.value.filter(m => m.is_active);
          setAppModules(modulesData);
        }

        // Fetch menus for each active module
        const menusMap: Record<string, Menu[]> = {};
        await Promise.all(
          modulesData.map(async (mod) => {
            try {
              const menus = await menuService.getAllMenus(mod.code);
              menusMap[mod.code] = menus;
            } catch (err) {
              console.error(`Failed to fetch menus for module ${mod.code}`);
            }
          })
        );
        setMenusByModule(menusMap);

      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch assigned menus when selected role changes
  useEffect(() => {
    if (selectedRoleId === 0) return;
    
    const fetchRoleMenus = async () => {
      try {
        const res = await adminService.getRoleMenus(selectedRoleId);
        const menusData = Array.isArray(res?.data) ? res.data : [];
        setAssignedMenus(menusData.map((m: any) => m.id));
      } catch (err) {
        toast.error('Gagal memuat akses menu untuk role ini.');
      }
    };
    fetchRoleMenus();
  }, [selectedRoleId]);

  const handleToggle = (menuId: number) => {
    const isChecked = assignedMenus.includes(menuId);
    if (isChecked) {
      setAssignedMenus(assignedMenus.filter(id => id !== menuId));
    } else {
      setAssignedMenus([...assignedMenus, menuId]);
    }
  };

  const handleToggleModuleAll = (menuList: Menu[]) => {
    const moduleMenuIds = getFlatMenuIds(menuList);
    const allChecked = moduleMenuIds.every((id) => assignedMenus.includes(id));

    if (allChecked) {
      setAssignedMenus(assignedMenus.filter((id) => !moduleMenuIds.includes(id)));
    } else {
      setAssignedMenus(Array.from(new Set([...assignedMenus, ...moduleMenuIds])));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminService.assignMenusToRole(selectedRoleId, assignedMenus);
      toast.success(`Akses menu untuk role berhasil disimpan!`);
    } catch {
      toast.error('Gagal menyimpan akses menu. Periksa koneksi ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMenuItems = (menuList: Menu[], level = 0) => {
    return menuList.map(menu => {
      const checked = assignedMenus.includes(menu.id);
      return (
        <div key={menu.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: level === 0 ? '0.75rem' : '0' }}>
          <div
            onClick={() => handleToggle(menu.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              marginLeft: `${level * 1.5}rem`,
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
            <div className="flex items-center gap-2">
              {level > 0 && <ChevronRight size={16} color="var(--gray-400)" />}
              <span style={{ fontSize: '0.875rem', fontWeight: level === 0 ? 700 : 500, color: checked ? 'var(--primary-900)' : 'var(--text-primary)' }}>
                {menu.name}
              </span>
              <span className="text-xs text-slate-400 font-mono ml-2">
                {menu.url}
              </span>
            </div>
          </div>
          {menu.children && menu.children.length > 0 && (
            <div className="flex flex-col gap-2">
              {renderMenuItems(menu.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Pemetaan Role ↔ Akses Menu"
        description="Atur menu navigasi apa saja yang dapat dilihat dan diakses oleh setiap role."
        action={
          <Button icon={<Save size={16} />} loading={isSaving} onClick={handleSave}>
            Simpan Perubahan
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
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
          <Select
            label="Filter Modul Aplikasi"
            value={selectedModule}
            onChange={(val: string) => setSelectedModule(val)}
            options={[{ value: 'all', label: 'Tampilkan Semua Modul' }, ...appModules.map(m => ({ value: m.code, label: `${m.name} (${m.code.toUpperCase()})` }))]}
            isDisabled={isLoading}
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>
        <div className="mt-3 text-[0.8125rem] text-slate-400">
          Terdapat <strong>{assignedMenus.length}</strong> menu navigasi aktif untuk role ini.
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">
          Memuat data menu...
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          
          {appModules.filter(mod => selectedModule === 'all' || mod.code === selectedModule).map(mod => {
            const menus = menusByModule[mod.code] || [];
            if (menus.length === 0) return null;

            return (
              <div key={mod.id} className="card">
                <div className="card-header flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-blue">{mod.code.toUpperCase()}</span>
                    <h4 className="text-[1.0625rem] font-bold m-0">Menu Aplikasi {mod.name}</h4>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleModuleAll(menus)}
                    className="text-[0.8125rem]"
                  >
                    {getFlatMenuIds(menus).every(id => assignedMenus.includes(id)) ? 'Batalkan Semua' : 'Pilih Semua Modul Ini'}
                  </button>
                </div>
                <div className="card-body">
                  {renderMenuItems(menus)}
                </div>
              </div>
            );
          })}
          
        </div>
      )}
    </div>
  );
}
