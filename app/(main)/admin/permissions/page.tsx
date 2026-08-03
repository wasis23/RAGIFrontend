'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import { PERMISSION_ACTIONS } from '@/lib/constants';
import { moduleService, AppModule } from '@/services/module.service';
import type { Permission, PermissionAction } from '@/types/auth.types';

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    module: 'siakad',
    action: 'read' as PermissionAction,
    description: '',
  });

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterModule, setFilterModule] = useState('all');
  const [filterName, setFilterName] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('name');
  const [filterOrderDir, setFilterOrderDir] = useState('asc');
  
  const [appliedFilterModule, setAppliedFilterModule] = useState('all');
  const [appliedFilterName, setAppliedFilterName] = useState('');
  const [appliedFilterOrderBy, setAppliedFilterOrderBy] = useState('name');
  const [appliedFilterOrderDir, setAppliedFilterOrderDir] = useState('asc');

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPermissions({ per_page: 500 });
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as { items?: Permission[] })?.items ?? [];
      setPermissions(list);
    } catch {
      toast.error('Gagal memuat data permission. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await moduleService.getAllModules();
      setAppModules(data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchModules();
  }, []);

  const handleOpenCreate = () => {
    setEditingPermission(null);
    setFormData({ name: '', slug: '', module: 'siakad', action: 'read', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Permission) => {
    setEditingPermission(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      module: p.module,
      action: p.action,
      description: p.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Nama Permission dan Slug wajib diisi.');
      return;
    }

    try {
      if (editingPermission) {
        await adminService.updatePermission(editingPermission.id, formData);
        toast.success('Permission berhasil diperbarui!');
      } else {
        await adminService.createPermission(formData);
        toast.success('Permission baru berhasil dibuat!');
      }
      fetchPermissions();
    } catch {
      toast.error('Gagal menyimpan permission. Periksa koneksi ke server.');
    } finally {
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPermission) return;
    try {
      await adminService.deletePermission(deletingPermission.id);
      toast.success(`Permission ${deletingPermission.slug} berhasil dihapus.`);
      fetchPermissions();
    } catch {
      toast.error(`Gagal menghapus permission. Periksa koneksi ke server.`);
    } finally {
      setDeletingPermission(null);
    }
  };

  const isModuleMatch = (filter: string, permModule: string) => {
    if (!filter || filter === 'all') return true;
    const f = filter.toLowerCase();
    const m = (permModule || '').toLowerCase();
    if (f === m) return true;
    if ((f === 'sso' || f === 'iam') && (m === 'sso' || m === 'iam')) return true;
    return false;
  };

  const filteredPermissions = [...permissions].filter((p) => {
    const matchModule = isModuleMatch(appliedFilterModule, p.module);
    const matchName = appliedFilterName === '' || 
      p.name.toLowerCase().includes(appliedFilterName.toLowerCase()) || 
      p.slug.toLowerCase().includes(appliedFilterName.toLowerCase());
    return matchModule && matchName;
  }).sort((a, b) => {
    let cmp = 0;
    if (appliedFilterOrderBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (appliedFilterOrderBy === 'slug') cmp = a.slug.localeCompare(b.slug);
    else if (appliedFilterOrderBy === 'module') cmp = a.module.localeCompare(b.module);
    
    return appliedFilterOrderDir === 'desc' ? -cmp : cmp;
  });

  const columns: ColumnDef<Permission>[] = [
    { key: 'id', label: 'ID', render: (row) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{row.id}</span> },
    { key: 'name', label: 'Nama Permission', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
        <Key size={16} color="var(--primary-600)" />
        {row.name}
      </div>
    )},
    { key: 'slug', label: 'Slug Identifier', render: (row) => (
      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)' }}>
        {row.slug}
      </code>
    )},
    { key: 'module', label: 'Modul', render: (row) => (
      <span className="badge badge-blue">{row.module.toUpperCase()}</span>
    )},
    { key: 'action', label: 'Tipe Action', render: (row) => {
      let badgeClass = 'badge-gray';
      if (row.action === 'read') badgeClass = 'badge-green';
      if (row.action === 'create') badgeClass = 'badge-blue';
      if (row.action === 'update') badgeClass = 'badge-yellow';
      if (row.action === 'delete') badgeClass = 'badge-red';
      if (row.action === 'manage') badgeClass = 'badge-purple';
      return (
        <span className={`badge ${badgeClass}`}>
          {row.action}
        </span>
      );
    }},
    { key: 'description', label: 'Deskripsi', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        {row.description || '-'}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEdit(row)} />
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingPermission(row)} />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Hak Akses (Permissions Table)"
        description="Daftar granular permission untuk setiap modul aplikasi (Tabel: permissions)"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Permission
            </Button>
            <Button 
              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredPermissions}
        isLoading={isLoading}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Hak Akses"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterModule('all');
                setFilterName('');
                setFilterOrderBy('name');
                setFilterOrderDir('asc');
                setAppliedFilterModule('all');
                setAppliedFilterName('');
                setAppliedFilterOrderBy('name');
                setAppliedFilterOrderDir('asc');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilterModule(filterModule);
                setAppliedFilterName(filterName);
                setAppliedFilterOrderBy(filterOrderBy);
                setAppliedFilterOrderDir(filterOrderDir);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Cari Permission"
            placeholder="Ketik nama atau slug..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <Select
            label="Modul"
            value={filterModule}
            onChange={(val) => setFilterModule(val)}
            options={[
              { value: 'all', label: 'Semua Modul' },
              ...appModules.map(m => ({ value: m.code, label: m.name }))
            ]}
          />

          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'name', label: 'Nama Permission' },
                { value: 'slug', label: 'Slug Identifier' },
                { value: 'module', label: 'Modul Target' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' }
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Form */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPermission ? 'Edit Permission' : 'Tambah Permission Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Permission"
            required
            placeholder="Contoh: Input Nilai SIAKAD"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Modul Target <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Select
              value={appModules.find(m => m.code === formData.module) ? { value: formData.module, label: appModules.find(m => m.code === formData.module)?.name } : null}
              onChange={(v: any) => setFormData({ ...formData, module: v?.value || '' })}
              options={appModules.map(m => ({ value: m.code, label: m.name }))}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Action Type <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Select
              value={{ value: formData.action, label: formData.action }}
              onChange={(v: any) => setFormData({ ...formData, action: v?.value || 'read' })}
              options={PERMISSION_ACTIONS.map(a => ({ value: a, label: a }))}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            />
          </div>

          <Input
            label="Slug Identifier"
            required
            placeholder="contoh: siakad.grades.update"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Deskripsi"
              rows={3}
              placeholder="Deskripsi hak akses..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deletingPermission}
        onClose={() => setDeletingPermission(null)}
        title="Hapus Permission?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingPermission(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Hapus permission <code>{deletingPermission?.slug}</code>?
        </p>
      </Modal>
    </div>
  );
}
