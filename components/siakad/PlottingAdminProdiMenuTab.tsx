'use client';

import { useState, useEffect } from 'react';
import { Save, CheckSquare, Square, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { adminService } from '@/services/admin.service';
import { menuService } from '@/services/menu.service';
import { Menu } from '@/types/menu';
import toast from 'react-hot-toast';

interface PlottingAdminProdiMenuTabProps {
  prodis?: any[];
}

export function PlottingAdminProdiMenuTab({ prodis }: PlottingAdminProdiMenuTabProps) {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [assignedMenuIds, setAssignedMenuIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Helper flatten ID menu
  const getFlatMenuIds = (menuList: Menu[]): number[] => {
    let ids: number[] = [];
    menuList.forEach((m) => {
      ids.push(m.id);
      if (m.children && m.children.length > 0) {
        ids = ids.concat(getFlatMenuIds(m.children));
      }
    });
    return ids;
  };

  const fetchInitial = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, menusRes] = await Promise.all([
        siakadService.getAdminObeEligibleRoles(),
        menuService.getAllMenus('siakad'),
      ]);

      if (rolesRes.data) {
        const raw = rolesRes.data;
        const list = Array.isArray(raw) ? raw : (raw.items || []);
        setRoles(list);
        if (list[0]) {
          setSelectedRoleId(list[0].id);
        }
      }

      if (menusRes) {
        setAllMenus(menusRes);
      }
    } catch {
      toast.error('Gagal memuat master role atau menu SIAKAD.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  // Fetch menu yang di-assign untuk role terpilih (default sinkron dengan role-menus)
  useEffect(() => {
    if (!selectedRoleId) return;

    const fetchAssigned = async () => {
      try {
        const res = await siakadService.getAdminObeRoleMenus(selectedRoleId);
        if (res.data) {
          const ids = res.data.map((m: any) => m.id);
          setAssignedMenuIds(ids);
        }
      } catch {
        toast.error('Gagal memuat plotting menu untuk role ini.');
      }
    };

    fetchAssigned();
  }, [selectedRoleId]);

  const toggleMenu = (id: number) => {
    setAssignedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = getFlatMenuIds(allMenus);
    setAssignedMenuIds(allIds);
  };

  const handleDeselectAll = () => {
    setAssignedMenuIds([]);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      await siakadService.assignAdminObeRoleMenus(selectedRoleId, assignedMenuIds);
      toast.success('Konfigurasi menu Admin OBE untuk role ini berhasil disimpan!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan plotting menu.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId);

  const renderMenuItem = (item: Menu, level = 0) => {
    const isChecked = assignedMenuIds.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="flex flex-col">
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            isChecked
              ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
          style={{ marginLeft: `${level * 1.5}rem` }}
          onClick={() => toggleMenu(item.id)}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`p-1 rounded transition-colors ${
                isChecked ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span>{item.name}</span>
                {(item as any).permission && (
                  <Badge variant="blue" className="text-[10px] font-mono">
                    {(item as any).permission.slug}
                  </Badge>
                )}
              </div>
              <div className="text-2xs text-slate-400 font-mono mt-0.5">
                Path: {item.url || '#'}
              </div>
            </div>
          </div>

          <Badge variant={isChecked ? 'amber' : 'gray'} className="text-[10px]">
            {isChecked ? 'Diizinkan' : 'Terkunci'}
          </Badge>
        </div>

        {hasChildren && (
          <div className="flex flex-col gap-2 mt-2">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
        Memuat data plotting menu Admin OBE...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Control Banner Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
            style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Pilih Role Induk Pengguna</h4>
            <p className="text-2xs text-slate-500">
              Pilih role asal (Dosen/Tendik/Pegawai) untuk menentukan menu default saat ditugaskan sebagai Admin OBE.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-80">
            <Select
              options={roles.map((r) => ({
                value: String(r.id),
                label: `${r.name} (${r.slug})`,
              }))}
              value={String(selectedRoleId)}
              onChange={(val) => setSelectedRoleId(Number(val))}
            />
          </div>

          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving || !selectedRoleId}
            className="shrink-0"
          >
            Simpan Plotting Role
          </Button>
        </div>
      </div>

      {/* Target Info Summary */}
      {selectedRoleObj && (
        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-amber-700 shrink-0" />
            <span>
              Konfigurasi Menu untuk Akun Ber-Role:{' '}
              <strong className="text-slate-900 font-bold">
                {selectedRoleObj.name} ({selectedRoleObj.slug})
              </strong>{' '}
              yang berstatus sebagai <span className="bg-amber-200/70 px-2 py-0.5 rounded font-bold text-amber-900">Admin OBE</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-2xs font-bold text-primary-700 hover:underline cursor-pointer"
            >
              Pilih Semua
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-2xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Batalkan Semua
            </button>
          </div>
        </div>
      )}

      {/* Menu Checklist Tree */}
      <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
        {allMenus.map((menu) => renderMenuItem(menu))}
      </div>
    </div>
  );
}
