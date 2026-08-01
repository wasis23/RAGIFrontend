'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/services/admin.service';
import { PERMISSION_ACTIONS } from '@/lib/constants';
import { moduleService, AppModule } from '@/services/module.service';
import type { Permission, PermissionAction } from '@/types/auth.types';

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [filterModule, setFilterModule] = useState('all');
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

  const fetchPermissions = async () => {
    try {
      const res = await adminService.getPermissions({ per_page: 500 });
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as { items?: Permission[] })?.items ?? [];
      setPermissions(list);
    } catch {
      toast.error('Gagal memuat data permission. Periksa koneksi ke server.');
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
  }, [filterModule]);

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

  const filteredPermissions = permissions.filter((p) => isModuleMatch(filterModule, p.module));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Hak Akses (Permissions Table)"
        description="Daftar granular permission untuk setiap modul aplikasi (Tabel: permissions)"
        action={
          <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Tambah Permission
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Filter Modul:</span>
          <select
            className="select"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            style={{ maxWidth: 260 }}
          >
            <option value="">Semua Modul ({permissions.length} Hak Akses)</option>
            {appModules.map((m) => (
              <option key={m.id} value={m.code}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Permission</th>
                <th>Slug Identifier</th>
                <th>Modul</th>
                <th>Tipe Action</th>
                <th>Deskripsi</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{p.id}</td>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Key size={16} color="var(--primary-600)" />
                      {p.name}
                    </div>
                  </td>
                  <td>
                    <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      {p.slug}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-blue">{p.module.toUpperCase()}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.action === 'manage' ? 'badge-red' : p.action === 'read' ? 'badge-green' : 'badge-gold'}`}>
                      {p.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {p.description || '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEdit(p)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => setDeletingPermission(p)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            onChange={(e) => {
              const name = e.target.value;
              setFormData({ ...formData, name });
            }}
          />

            <div className="form-group">
              <label className="form-label required">Modul Target</label>
              <select
                className="select"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              >
                {appModules.map((m) => (
                  <option key={m.id} value={m.code}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Action Type</label>
              <select
                className="select"
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as PermissionAction })}
              >
                {PERMISSION_ACTIONS.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

          <Input
            label="Slug Identifier"
            required
            placeholder="contoh: siakad.grades.update"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <div className="form-group col-span-1 md:col-span-2">
            <label className="form-label">Deskripsi</label>
            <textarea
              className="textarea"
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
