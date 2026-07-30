'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { CreateMenuPayload, Menu } from '@/types/menu';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CreateMenuPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [parentMenus, setParentMenus] = useState<Menu[]>([]);
  
  const [formData, setFormData] = useState<CreateMenuPayload>({
    name: '',
    url: '',
    icon: '',
    module: '',
    parent_id: null,
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const modulesData = await moduleService.getAllModules();
        setAppModules(modulesData);
        if (modulesData.length > 0) {
          const initialModule = modulesData.find(m => m.code === 'sso')?.code || modulesData[0].code;
          setFormData(prev => ({ ...prev, module: initialModule }));
          fetchParentMenus(initialModule);
        }
      } catch (err) {
        toast.error('Gagal memuat modul');
      }
    };
    fetchInitialData();
  }, []);

  const fetchParentMenus = async (moduleCode: string) => {
    try {
      const data = await menuService.getAllMenus(moduleCode);
      setParentMenus(data);
    } catch (err) {
      console.error('Failed to fetch parent menus');
    }
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModule = e.target.value;
    setFormData(prev => ({ ...prev, module: newModule, parent_id: null }));
    fetchParentMenus(newModule);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await menuService.createMenu(formData);
      toast.success('Menu berhasil ditambahkan');
      router.push('/admin/menus');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Tambah Menu Baru
          </h1>
          <p className="text-gray-500 mt-1">Buat menu navigasi baru untuk sistem</p>
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
                  placeholder="Contoh: /admin/settings atau #kategori"
                />
                <span className="text-xs text-gray-500 mt-1">Gunakan awalan <strong>#</strong> (contoh: <strong>#master</strong>) jika ini adalah Grup/Label Induk. Menu dengan awalan # tidak akan bisa diklik dan akan tampil sebagai judul grup.</span>
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
                <span className="text-xs text-gray-400 mt-1">Gunakan nama lucide-react (misal: FaUsers).</span>
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
                <span className="text-xs text-gray-500 mt-1">Pilih menu induk jika Anda ingin menjadikan ini sebagai sub-menu di bawah grup tertentu.</span>
              </div>

              <div className="form-control flex-row items-center gap-3 mt-2 lg:col-span-3">
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
                  <><Save size={18} className="mr-2" /> Simpan Menu</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
