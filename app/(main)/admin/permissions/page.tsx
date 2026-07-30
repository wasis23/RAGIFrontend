'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/services/admin.service';
import { SYSTEM_MODULES, PERMISSION_ACTIONS } from '@/lib/constants';
import type { Permission, PermissionAction } from '@/types/auth.types';

const MOCK_PERMISSIONS: Permission[] = [
  { id: 1, name: 'Kelola Seluruh Pengguna', slug: 'iam.users.manage', module: 'iam', action: 'manage', description: 'Hak akses CRUD penuh untuk pengguna SSO' },
  { id: 2, name: 'Kelola Role & Hak Akses', slug: 'iam.roles.manage', module: 'iam', action: 'manage', description: 'Konfigurasi wewenang dan permission role' },
  { id: 3, name: 'Lihat Nilai & KHS', slug: 'siakad.grades.read', module: 'siakad', action: 'read', description: 'Hak membaca transkrip KHS/KRS di SIAKAD' },
  { id: 4, name: 'Input & Edit Nilai Dosen', slug: 'siakad.grades.update', module: 'siakad', action: 'update', description: 'Hak menginput dan mengubah nilai matakuliah' },
  { id: 5, name: 'Cetak Kartu Ujian (KPU)', slug: 'siakad.kpu.print', module: 'siakad', action: 'read', description: 'Cetak kartu peserta ujian semester' },
  { id: 6, name: 'Verifikasi Lunas UKT', slug: 'sikeu.billing.update', module: 'sikeu', action: 'update', description: 'Verifikasi status lunas pembayaran UKT' },
  { id: 7, name: 'Generate Invoice Tagihan', slug: 'sikeu.billing.create', module: 'sikeu', action: 'create', description: 'Buat tagihan biaya kuliah mahasiswa baru' },
  { id: 8, name: 'Kelola Kurikulum OBE', slug: 'obe.curriculum.manage', module: 'obe', action: 'manage', description: 'Desain CPL, CPMK, dan kurikulum OBE' },
  { id: 9, name: 'Akses Ruang Kelas LMS', slug: 'lms.courses.read', module: 'lms', action: 'read', description: 'Akses kelas online dan materi kuliah' },
  { id: 10, name: 'Upload Tugas & Quiz', slug: 'lms.assignments.create', module: 'lms', action: 'create', description: 'Upload materi dan kuis perkuliahan' },
  { id: 11, name: 'Verifikasi Berkas Calon MHS', slug: 'spmb.documents.verify', module: 'spmb', action: 'update', description: 'Verifikasi ijazah dan syarat pendaftaran' },
  { id: 12, name: 'Kelola Publikasi & Penelitian', slug: 'simpi.research.manage', module: 'simpi', action: 'manage', description: 'Input jurnal dan luaran publikasi dosen' },
];

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
      const res = await adminService.getPermissions();
      const list = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
      setPermissions(list?.length ? list : MOCK_PERMISSIONS);
    } catch {
      setPermissions(MOCK_PERMISSIONS);
    }
  };

  useEffect(() => {
    fetchPermissions();
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
      if (editingPermission) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === editingPermission.id ? { ...p, ...formData } : p))
        );
        toast.success('Permission diperbarui (Mode lokal)');
      } else {
        const newP: Permission = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
        };
        setPermissions((prev) => [...prev, newP]);
        toast.success('Permission baru dibuat (Mode lokal)');
      }
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
      setPermissions((prev) => prev.filter((p) => p.id !== deletingPermission.id));
      toast.success(`Permission ${deletingPermission.slug} dihapus (Mode lokal).`);
    } finally {
      setDeletingPermission(null);
    }
  };

  const filteredPermissions = permissions.filter(
    (p) => filterModule === 'all' || p.module === filterModule
  );

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
            <option value="all">Semua Modul ({permissions.length} Hak Akses)</option>
            {SYSTEM_MODULES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label required">Modul Target</label>
              <select
                className="select"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              >
                {SYSTEM_MODULES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
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
          </div>

          <Input
            label="Slug Identifier"
            required
            placeholder="contoh: siakad.grades.update"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <div className="form-group">
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
