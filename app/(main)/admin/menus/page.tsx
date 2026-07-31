'use client';

import { useEffect, useState } from 'react';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { Menu, CreateMenuPayload, UpdateMenuPayload } from '@/types/menu';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  List,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('sso');
  const router = useRouter();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await menuService.getAllMenus(selectedModule);
      setMenus(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const modulesData = await moduleService.getAllModules();
        setAppModules(modulesData);
        // default select to first active module if sso is not available
        if (modulesData.length > 0 && !modulesData.find(m => m.code === 'sso')) {
          setSelectedModule(modulesData[0].code);
        }
      } catch (err) {
        console.error('Failed to fetch modules');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchMenus();
    }
  }, [selectedModule]);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await menuService.toggleMenuStatus(id);
      toast.success(`Menu berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`);
      fetchMenus(); // Refresh to ensure sync
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status menu');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus menu "${name}" secara permanen?`)) {
      try {
        await menuService.deleteMenu(id);
        toast.success('Menu berhasil dihapus');
        fetchMenus();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menghapus menu');
      }
    }
  };

  const openCreateModal = () => {
    router.push('/admin/menus/create');
  };

  const openEditModal = (menu: Menu) => {
    router.push(`/admin/menus/${menu.id}/edit`);
  };

  // Helper to render table rows recursively (for nested menus)
  const renderMenuRows = (menuList: Menu[], level = 0) => {
    let rows: React.ReactNode[] = [];
    menuList.forEach((menu) => {
      rows.push(
        <tr key={menu.id} className="hover:bg-gray-50/50">
          <td style={{ paddingLeft: `${level * 2 + 1}rem` }}>
            <div className="flex items-center gap-2">
              {level > 0 && <span className="text-gray-400">↳</span>}
              <span className={level === 0 ? 'font-semibold' : ''}>{menu.name}</span>
            </div>
          </td>
          <td><code>{menu.url}</code></td>
          <td>{menu.icon || '-'}</td>
          <td>
            {menu.is_active ? (
              <span className="badge badge-success"><CheckCircle2 size={14} className="mr-1"/> Aktif</span>
            ) : (
              <span className="badge badge-error"><XCircle size={14} className="mr-1"/> Nonaktif</span>
            )}
          </td>
          <td>
            <div className="flex items-center gap-2">
              <button
                className={`btn btn-xs ${menu.is_active ? 'btn-error' : 'btn-success'}`}
                onClick={() => handleToggle(menu.id, menu.is_active)}
                disabled={togglingId === menu.id}
                title={menu.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {togglingId === menu.id ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  menu.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />
                )}
              </button>
              <button
                className="btn btn-xs btn-primary btn-outline"
                onClick={() => openEditModal(menu)}
                title="Edit Menu"
              >
                <Pencil size={14} />
              </button>
              <button
                className="btn btn-xs btn-error btn-outline"
                onClick={() => handleDelete(menu.id, menu.name)}
                title="Hapus Menu"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </tr>
      );

      if (menu.children && menu.children.length > 0) {
        rows = rows.concat(renderMenuRows(menu.children, level + 1));
      }
    });
    return rows;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <List className="text-primary-600" /> Manajemen Menu
          </h1>
          <p className="text-gray-500 mt-1">Mengelola menu navigasi dan status aktif/nonaktifnya.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="select max-w-xs"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            {appModules.map(mod => (
              <option key={mod.id} value={mod.code}>Modul: {mod.name.toUpperCase()}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-outline" onClick={fetchMenus} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} className="mr-2" />
            Tambah Menu
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nama Menu</th>
                  <th>URL</th>
                  <th>Icon</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Memuat daftar menu...
                    </td>
                  </tr>
                ) : menus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Belum ada menu yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  renderMenuRows(menus)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      
    </div>
  );
}
