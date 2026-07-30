'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckSquare, Square, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { Menu } from '@/types/menu';

export default function AdminRoleMenusPage() {
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [menusByModule, setMenusByModule] = useState<Record<string, Menu[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {level > 0 && <ChevronRight size={16} color="var(--gray-400)" />}
              <span style={{ fontSize: '0.875rem', fontWeight: level === 0 ? 700 : 500, color: checked ? 'var(--primary-900)' : 'var(--text-primary)' }}>
                {menu.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '0.5rem' }}>
                {menu.url}
              </span>
            </div>
          </div>
          {menu.children && menu.children.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {renderMenuItems(menu.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Pemetaan Role ↔ Akses Menu"
        description="Atur menu navigasi apa saja yang dapat dilihat dan diakses oleh setiap role."
        action={
          <Button icon={<Save size={16} />} loading={isSaving} onClick={handleSave}>
            Simpan Perubahan
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
            disabled={isLoading}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            ({assignedMenus.length} menu aktif untuk role ini)
          </span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuat data menu...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {appModules.map(mod => {
            const menus = menusByModule[mod.code] || [];
            if (menus.length === 0) return null;

            return (
              <div key={mod.id} className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-blue">{mod.code.toUpperCase()}</span>
                    <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>Menu Aplikasi {mod.name}</h4>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleModuleAll(menus)}
                    style={{ fontSize: '0.8125rem' }}
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
