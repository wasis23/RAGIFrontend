'use client';

import { useEffect, useState } from 'react';
import { moduleService, AppModule, CreateModulePayload, UpdateModulePayload } from '@/services/module.service';
import { toast } from 'react-hot-toast';
import { RefreshCw, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';

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

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [appliedFilterName, setAppliedFilterName] = useState<string>('');

  const filteredModules = modules.filter(m => {
    if (!appliedFilterName) return true;
    const lowerQ = appliedFilterName.toLowerCase();
    return m.name.toLowerCase().includes(lowerQ) || m.code.toLowerCase().includes(lowerQ);
  });

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

  const columns: ColumnDef<AppModule>[] = [
    { key: 'id', label: 'No', render: (row, index) => <span className="font-bold text-slate-400">{index + 1}</span> },
    { key: 'name', label: 'Nama Modul', render: (row) => (
      <span className="font-bold text-slate-900">{row.name}</span>
    )},
    { key: 'code', label: 'Kode (Slug)', render: (row) => (
      <code className="bg-slate-100 px-2 py-0.5 rounded text-[0.8125rem] font-bold">
        {row.code}
      </code>
    )},
    { key: 'description', label: 'Deskripsi', render: (row) => (
      <span className="text-sm text-slate-500">
        {row.description || '-'}
      </span>
    )},
    { key: 'is_active', label: 'Status', render: (row) => (
      <button
        onClick={() => handleToggle(row.id, row.is_active)}
        disabled={togglingId === row.id}
        className="bg-transparent border-none cursor-pointer p-0"
        title="Klik untuk mengubah status"
      >
        {togglingId === row.id ? (
          <RefreshCw size={14} className="animate-spin text-gray-500" />
        ) : (
          <StatusBadge active={row.is_active} />
        )}
      </button>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<Edit2 size={14} />}
          onClick={() => openEditModal(row)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} color="var(--danger)" />}
          onClick={() => handleDelete(row.id, row.name)}
        />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in" className="flex flex-col gap-7">
      <PageHeader
        title="Master Modul Aplikasi"
        description="Mengelola modul aplikasi yang tersedia di ekosistem kampus (seperti SSO, SPMB, dll)."
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button variant="secondary" icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchModules} disabled={loading}>
              Refresh
            </Button>
            <Button icon={<Plus size={16} />} onClick={openCreateModal}>
              Tambah Modul
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredModules}
        isLoading={loading}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Modul"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterName('');
                setAppliedFilterName('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilterName(filterName);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input 
            label="Cari Modul"
            placeholder="Ketik nama atau kode modul..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
      </Drawer>

      {/* Modal CRUD Module */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Modul Baru' : 'Edit Modul'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button variant="primary" onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <><RefreshCw size={16} className="animate-spin mr-2 inline" /> Menyimpan...</>
              ) : (
                modalMode === 'create' ? 'Tambah Modul' : 'Simpan Modul'
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Modul"
            required
            placeholder="Contoh: Sistem Akademik"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          
          <Input
            label="Kode Modul (Slug)"
            required
            placeholder="Contoh: siakad"
            hint="Harus unik, huruf kecil, tanpa spasi"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value.toLowerCase()})}
          />

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Deskripsi Modul"
              rows={3}
              placeholder="Penjelasan singkat kegunaan modul ini..."
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="col-span-1 md:col-span-2 mt-2">
            <Checkbox
              label="Langsung Aktifkan Modul"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
