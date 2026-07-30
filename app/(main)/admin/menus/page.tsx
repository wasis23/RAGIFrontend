'use client';

import { useEffect, useState } from 'react';
import { menuService } from '@/services/menu.service';
import { Menu, CreateMenuPayload, UpdateMenuPayload } from '@/types/menu';
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
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateMenuPayload>({
    name: '',
    url: '',
    icon: '',
    module: 'sso',
    parent_id: null,
    order_index: 0,
    is_active: true
  });
  const [editId, setEditId] = useState<number | null>(null);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await menuService.getAllMenus('sso');
      setMenus(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

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
    setModalMode('create');
    setFormData({
      name: '',
      url: '',
      icon: '',
      module: 'sso',
      parent_id: null,
      order_index: 0,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (menu: Menu) => {
    setModalMode('edit');
    setEditId(menu.id);
    setFormData({
      name: menu.name,
      url: menu.url,
      icon: menu.icon,
      module: menu.module,
      parent_id: menu.parent_id,
      order_index: menu.order_index,
      is_active: menu.is_active
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await menuService.createMenu(formData);
        toast.success('Menu berhasil ditambahkan');
      } else if (editId) {
        await menuService.updateMenu(editId, formData as UpdateMenuPayload);
        toast.success('Menu berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render table rows recursively (for nested menus)
  const renderMenuRows = (menuList: Menu[], level = 0) => {
    let rows: JSX.Element[] = [];
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
        <div className="flex gap-2">
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

      {/* Modal CRUD Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card bg-white w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleFormSubmit}>
              <div className="card-body">
                <h3 className="text-lg font-bold mb-4">
                  {modalMode === 'create' ? 'Tambah Menu Baru' : 'Edit Menu'}
                </h3>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">Nama Menu</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Contoh: Pengaturan"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">URL Route</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="Contoh: /admin/settings"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">Icon (Teks)</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="Contoh: FaHome"
                    />
                    <span className="text-xs text-gray-400 mt-1">Dapat menggunakan nama lucide-react (misal: FaUsers). Kosongkan jika tidak ada.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">Modul</label>
                      <select 
                        className="input"
                        value={formData.module}
                        onChange={(e) => setFormData({...formData, module: e.target.value})}
                      >
                        <option value="sso">SSO (Auth Center)</option>
                        <option value="SPMB">SPMB</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">Urutan (Order)</label>
                      <input 
                        type="number" 
                        className="input" 
                        value={formData.order_index}
                        onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">Parent Menu</label>
                    <select 
                      className="input"
                      value={formData.parent_id || ''}
                      onChange={(e) => setFormData({...formData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">-- Tidak ada (Root Menu) --</option>
                      {menus.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control flex-row items-center gap-3 mt-4">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                    />
                    <label htmlFor="is_active" className="cursor-pointer font-medium text-gray-700">Langsung Aktifkan</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-8">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><RefreshCw size={16} className="animate-spin mr-2" /> Menyimpan...</>
                    ) : (
                      'Simpan Menu'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
