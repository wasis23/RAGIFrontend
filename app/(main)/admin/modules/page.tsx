'use client';

import { useEffect, useState } from 'react';
import { moduleService, AppModule, UpdateModulePayload } from '@/services/module.service';
import { toast } from 'react-hot-toast';
import { RefreshCw, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

const moduleSchema = z.object({
  name: z.string().min(1, 'Nama modul wajib diisi').max(255, 'Nama modul maksimal 255 karakter'),
  code: z.string().min(1, 'Kode modul wajib diisi').max(50, 'Kode modul maksimal 50 karakter').regex(/^[a-z0-9-]+$/, 'Kode modul harus berupa huruf kecil, angka, atau tanda hubung'),
  description: z.string().optional().nullable(),
  primary_color: z.string().regex(/^#[a-fA-F0-9]{6}$/, 'Warna primary harus format hex contoh #3b82f6').optional().default('#3b82f6'),
  is_active: z.boolean().default(true)
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function AdminModulePage() {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form handling via React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      primary_color: '#3b82f6',
      is_active: true
    }
  });

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
    setEditId(null);
    reset({
      name: '',
      code: '',
      description: '',
      primary_color: '#3b82f6',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mod: AppModule) => {
    setModalMode('edit');
    setEditId(mod.id);
    reset({
      name: mod.name,
      code: mod.code,
      description: mod.description || '',
      primary_color: mod.primary_color || '#3b82f6',
      is_active: mod.is_active
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (values: ModuleFormValues) => {
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await moduleService.createModule(values);
        toast.success('Modul berhasil ditambahkan');
      } else if (editId) {
        await moduleService.updateModule(editId, values as UpdateModulePayload);
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
    { key: 'primary_color', label: 'Warna Primary', render: (row) => (
      <div className="flex items-center gap-2">
        <span 
          className="w-4 h-4 rounded-full border border-slate-200 shadow-xs shrink-0" 
          style={{ backgroundColor: row.primary_color || '#3b82f6' }} 
        />
        <code className="text-[0.8125rem] font-semibold text-slate-700">
          {row.primary_color || '#3b82f6'}
        </code>
      </div>
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
      <div className="flex justify-end">
        <DropdownMenu
          items={[
            {
              label: 'Edit Modul',
              icon: <Edit2 size={14} />,
              onClick: () => openEditModal(row)
            },
            {
              label: 'Hapus Modul',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleDelete(row.id, row.name)
            }
          ]}
        />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
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
            <Button variant="primary" onClick={handleSubmit(onSubmitForm)} disabled={isSubmitting}>
              {isSubmitting ? (
                <><RefreshCw size={16} className="animate-spin mr-2 inline" /> Menyimpan...</>
              ) : (
                modalMode === 'create' ? 'Tambah Modul' : 'Simpan Modul'
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Modul"
            required
            placeholder="Contoh: Sistem Akademik"
            error={errors.name?.message}
            {...register('name')}
          />
          
          <Input
            label="Kode Modul (Slug)"
            required
            placeholder="Contoh: siakad"
            hint="Harus unik, huruf kecil, tanpa spasi"
            error={errors.code?.message}
            {...register('code')}
          />

          <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
            <Controller
              name="primary_color"
              control={control}
              render={({ field }) => (
                <Input
                  label="Warna Primary Modul"
                  placeholder="#3b82f6"
                  error={errors.primary_color?.message}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  prefixIcon={
                    <span 
                      className="w-4 h-4 rounded-full border border-slate-300 inline-block shrink-0 shadow-xs" 
                      style={{ backgroundColor: field.value || '#3b82f6' }} 
                    />
                  }
                />
              )}
            />
            <div className="flex flex-wrap gap-2">
              {['#3b82f6', '#4f46e5', '#0d9488', '#e11d48', '#059669', '#d97706', '#7c3aed', '#db2777'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('primary_color', color, { shouldValidate: true })}
                  className={`w-6 h-6 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-110 ${watch('primary_color') === color ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Deskripsi Modul"
              rows={3}
              placeholder="Penjelasan singkat kegunaan modul ini..."
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Langsung Aktifkan Modul"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
