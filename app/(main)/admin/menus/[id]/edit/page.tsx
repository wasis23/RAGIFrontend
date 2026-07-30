'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { UpdateMenuPayload, Menu } from '@/types/menu';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = parseInt(params.id as string, 10);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [parentMenus, setParentMenus] = useState<Menu[]>([]);
  
  const [formData, setFormData] = useState<UpdateMenuPayload>({
    name: '',
    url: '',
    icon: '',
    module: '',
    parent_id: null,
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    if (isNaN(menuId)) {
      toast.error('ID Menu tidak valid');
      router.push('/admin/menus');
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const modulesData = await moduleService.getAllModules();
        setAppModules(modulesData);
        
        // Normally there would be a getMenuById endpoint, but for now we fetch all and filter
        // In a real app you'd call menuService.getMenuById(menuId)
        // Since we don't know the module beforehand, we might have to fetch menus from all active modules
        // For this demo, let's assume we can fetch by module, but let's fetch first module's menus as fallback
        
        let foundMenu: Menu | null = null;
        for (const mod of modulesData) {
            const allMenusInModule = await menuService.getAllMenus(mod.code);
            // Recursive search function
            const findMenuInTree = (menus: Menu[], id: number): Menu | null => {
               for (const m of menus) {
                 if (m.id === id) return m;
                 if (m.children) {
                   const found = findMenuInTree(m.children, id);
                   if (found) return found;
                 }
               }
               return null;
            };
            foundMenu = findMenuInTree(allMenusInModule, menuId);
            if (foundMenu) break;
        }

        if (foundMenu) {
            setFormData({
                name: foundMenu.name,
                url: foundMenu.url,
                icon: foundMenu.icon || '',
                module: foundMenu.module,
                parent_id: foundMenu.parent_id,
                order_index: foundMenu.order_index,
                is_active: foundMenu.is_active
            });
            // Fetch parent menus for this module
            const parentsData = await menuService.getAllMenus(foundMenu.module);
            // exclude itself from being its own parent
            setParentMenus(parentsData.filter(m => m.id !== menuId));
        } else {
            toast.error('Data menu tidak ditemukan');
            router.push('/admin/menus');
        }

      } catch (err) {
        toast.error('Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [menuId, router]);

  const handleModuleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModule = e.target.value;
    setFormData(prev => ({ ...prev, module: newModule, parent_id: null }));
    try {
      const parentsData = await menuService.getAllMenus(newModule);
      setParentMenus(parentsData.filter(m => m.id !== menuId));
    } catch (err) {
      console.error('Failed to fetch parent menus');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await menuService.updateMenu(menuId, formData);
      toast.success('Menu berhasil diperbarui');
      router.push('/admin/menus');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm"
          title="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Edit Menu
          </h1>
          <p className="text-gray-500 mt-1">Perbarui informasi menu navigasi</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="form-control">
                <label className="label">Nama Menu</label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                />
              </div>

              <div className="form-control">
                <label className="label">Icon (Teks)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">Modul</label>
                <select 
                  className="input"
                  value={formData.module}
                  onChange={handleModuleChange}
                >
                  {appModules.map(mod => (
                    <option key={mod.id} value={mod.code}>{mod.name}</option>
                  ))}
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

              <div className="form-control">
                <label className="label">Kategori / Parent Menu</label>
                <select 
                  className="input"
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">-- Menu Utama (Tidak Punya Parent) --</option>
                  {parentMenus.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-row items-center gap-3 mt-2 lg:col-span-3">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <label htmlFor="is_active" className="cursor-pointer font-medium text-gray-700">Aktif</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => router.back()}
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
                  <><RefreshCw size={18} className="animate-spin mr-2" /> Menyimpan...</>
                ) : (
                  <><Save size={18} className="mr-2" /> Simpan Perubahan</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
