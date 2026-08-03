'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { adminService } from '@/services/admin.service';
import type { Role } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filters State
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [filterLimit, setFilterLimit] = useState<string>('15');
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('id');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    orderBy: 'id',
    orderDir: 'desc'
  });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (appliedFilters.name !== '') params.search = appliedFilters.name;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir !== '') params.order_dir = appliedFilters.orderDir;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await adminService.getRoles(params);
      let roleList = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        roleList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        roleList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        roleList = res.data;
      } else if (Array.isArray(res)) {
        roleList = res;
      }

      setRoles(roleList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data role. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page, filterLimit, appliedFilters.name, appliedFilters.orderBy, appliedFilters.orderDir]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Nama Role dan Slug wajib diisi.');
      return;
    }

    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, formData);
        toast.success('Role berhasil diperbarui!');
      } else {
        await adminService.createRole(formData);
        toast.success('Role baru berhasil ditambahkan!');
      }
      fetchRoles();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal menyimpan role. Periksa koneksi ke server.';
      if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki wewenang untuk aksi ini.');
      } else if (error.response?.status === 422) {
        toast.error('Validasi gagal. Pastikan Slug Unique Identifier unik.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await adminService.deleteRole(deletingRole.id);
      toast.success(`Role ${deletingRole.name} berhasil dihapus.`);
      fetchRoles();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal menghapus role. Periksa koneksi ke server.';
      if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki wewenang untuk menghapus role ini.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setDeletingRole(null);
    }
  };

  const columns: ColumnDef<Role>[] = [
    { key: 'id', label: 'No', render: (row, index) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{meta?.from ? meta.from + index : index + 1}</span> },
    { key: 'name', label: 'Nama Role', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
        <ShieldAlert size={16} color="var(--primary-600)" />
        {row.name}
      </div>
    )},
    { key: 'slug', label: 'Slug Identifier', render: (row) => (
      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700 }}>
        {row.slug}
      </code>
    )},
    { key: 'description', label: 'Deskripsi Akses', render: (row) => (
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {row.description || '-'}
      </span>
    )},
    { key: 'created_at', label: 'Tanggal Dibuat', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {formatDate(row.created_at)}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Edit2 size={14} />}
          onClick={() => handleOpenEdit(row)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} color="var(--danger)" />}
          onClick={() => setDeletingRole(row)}
        />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Role Akses (Roles Table)"
        description="Definisikan struktur peran pengguna dalam ekosistem kampus (Tabel: roles)"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Role Baru
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
        data={roles}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setFilterLimit(l.toString()); setPage(1); }}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Role"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterName('');
                setFilterOrderBy('id');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  name: '',
                  orderBy: 'id',
                  orderDir: 'desc'
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilters({
                  name: filterName,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir
                });
                setPage(1);
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
            label="Nama / Slug Role"
            placeholder="Ketik kata kunci..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'name', label: 'Nama Role' },
                { value: 'slug', label: 'Slug' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
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
        title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>
              {editingRole ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Role"
            required
            placeholder="Contoh: Dosen Pembimbing"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              setFormData({ ...formData, name, slug: editingRole ? formData.slug : slug });
            }}
          />

          <Input
            label="Slug Unique Identifier"
            required
            placeholder="contoh: dosen_pembimbing"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            hint="Format: lowercase dengan underscore"
          />

          <div className="col-span-1 md:col-span-2">
            <Textarea
              label="Deskripsi"
              rows={3}
              placeholder="Deskripsi wewenang role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        title="Hapus Role?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingRole(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Hapus role <strong>{deletingRole?.name}</strong>? Pengguna dengan role ini akan kehilangan wewenang terkait.
        </p>
      </Modal>
    </div>
  );
}
