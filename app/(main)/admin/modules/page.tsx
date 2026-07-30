'use client';

import { useEffect, useState } from 'react';
import { moduleService, AppModule, CreateModulePayload, UpdateModulePayload } from '@/services/module.service';
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

export default function AdminModulePage() {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateModulePayload>({
    name: '',
    code: '',
    description: '',
    is_active: true
  });
  const [editId, setEditId] = useState<number | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await moduleService.getAllModules();
      setModules(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat modul');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await moduleService.toggleModuleStatus(id);
      toast.success(`Modul berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`);
      fetchModules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status modul');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus modul "${name}" secara permanen?`)) {
      try {
        await moduleService.deleteModule(id);
        toast.success('Modul berhasil dihapus');
        fetchModules();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menghapus modul');
      }
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mod: AppModule) => {
    setModalMode('edit');
    setEditId(mod.id);
    setFormData({
      name: mod.name,
      code: mod.code,
      description: mod.description || '',
      is_active: mod.is_active
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await moduleService.createModule(formData);
        toast.success('Modul berhasil ditambahkan');
      } else if (editId) {
        await moduleService.updateModule(editId, formData as UpdateModulePayload);
        toast.success('Modul berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchModules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan modul');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <List className="text-primary-600" /> Master Modul Aplikasi
          </h1>
          <p className="text-gray-500 mt-1">Mengelola modul aplikasi kampus yang tersedia di SSO (seperti SSO, SPMB, dll).</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn btn-primary btn-outline" onClick={fetchModules} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} className="mr-2" />
            Tambah Modul
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nama Modul</th>
                  <th>Kode (Slug)</th>
                  <th>Deskripsi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Memuat daftar modul...
                    </td>
                  </tr>
                ) : modules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Belum ada modul yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  modules.map((mod) => (
                    <tr key={mod.id} className="hover:bg-gray-50/50">
                      <td className="font-semibold">{mod.name}</td>
                      <td><code>{mod.code}</code></td>
                      <td>{mod.description || '-'}</td>
                      <td>
                        {mod.is_active ? (
                          <span className="badge badge-success"><CheckCircle2 size={14} className="mr-1"/> Aktif</span>
                        ) : (
                          <span className="badge badge-error"><XCircle size={14} className="mr-1"/> Nonaktif</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className={`btn btn-xs ${mod.is_active ? 'btn-error' : 'btn-success'}`}
                            onClick={() => handleToggle(mod.id, mod.is_active)}
                            disabled={togglingId === mod.id}
                            title={mod.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {togglingId === mod.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              mod.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />
                            )}
                          </button>
                          <button
                            className="btn btn-xs btn-primary btn-outline"
                            onClick={() => openEditModal(mod)}
                            title="Edit Modul"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            onClick={() => handleDelete(mod.id, mod.name)}
                            title="Hapus Modul"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal CRUD Module */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card bg-white w-full max-w-2xl shadow-xl">
            <form onSubmit={handleFormSubmit}>
              <div className="card-body">
                <h3 className="text-lg font-bold mb-4">
                  {modalMode === 'create' ? 'Tambah Modul Baru' : 'Edit Modul'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">Nama Modul</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Contoh: Sistem Akademik"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Kode Modul (Slug)</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toLowerCase()})}
                      placeholder="Contoh: siakad"
                    />
                    <span className="text-xs text-gray-400 mt-1">Harus unik dan huruf kecil semua tanpa spasi (misal: sso, spmb).</span>
                  </div>

                  <div className="form-control col-span-1 md:col-span-2">
                    <label className="label">Deskripsi Modul</label>
                    <textarea 
                      className="input py-2" 
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Penjelasan singkat modul ini..."
                    />
                  </div>

                  <div className="form-control flex-row items-center gap-3 mt-4 col-span-1 md:col-span-2">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                    />
                    <label htmlFor="is_active" className="cursor-pointer font-medium text-gray-700">Langsung Aktifkan Modul</label>
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
                      'Simpan Modul'
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
