'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { JalurMasuk } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm, Controller } from 'react-hook-form';

export default function MasterJalurPage() {
  const [data, setData] = useState<JalurMasuk[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    type: '',
    status: '',
    orderBy: 'id',
    orderDir: 'desc'
  });

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<Partial<JalurMasuk>>();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await spmbService.getJalurMasuk();
      setData(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data jalur masuk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    reset({
      kode: '',
      nama: '',
      deskripsi: '',
      tipe: 'reguler',
      ada_ujian_tulis: false,
      ada_ujian_praktik: false,
      ada_wawancara: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: JalurMasuk) => {
    setEditingId(row.id);
    reset(row);
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: Partial<JalurMasuk>) => {
    try {
      if (editingId) {
        await spmbService.updateJalurMasuk(editingId, formData);
        toast.success('Jalur masuk berhasil diperbarui');
      } else {
        await spmbService.createJalurMasuk(formData);
        toast.success('Jalur masuk berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jalur ini?')) return;
    try {
      await spmbService.deleteJalurMasuk(id);
      toast.success('Jalur masuk berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    if (appliedFilters.name) {
      result = result.filter(item => 
        item.nama.toLowerCase().includes(appliedFilters.name.toLowerCase()) || 
        item.kode.toLowerCase().includes(appliedFilters.name.toLowerCase())
      );
    }
    if (appliedFilters.type) {
      result = result.filter(item => item.tipe === appliedFilters.type);
    }
    if (appliedFilters.status !== '') {
      const isActive = appliedFilters.status === 'true';
      result = result.filter(item => item.is_active === isActive);
    }

    result.sort((a: any, b: any) => {
      const aVal = a[appliedFilters.orderBy];
      const bVal = b[appliedFilters.orderBy];
      if (aVal < bVal) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, appliedFilters]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Master Jalur Masuk"
        description="Kelola jalur masuk pendaftaran mahasiswa baru"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon={<Plus size={16} />} onClick={openAddModal}>
              Tambah Jalur
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
            data={filteredData}
            loading={loading}
            columns={[
              { key: 'kode', label: 'Kode', sortable: true },
              { key: 'nama', label: 'Nama Jalur', sortable: true },
              { key: 'tipe', label: 'Tipe', render: (val) => <span className="uppercase badge badge-ghost badge-sm">{val}</span> },
              { key: 'ujian', label: 'Komponen Ujian', render: (_, row) => (
                <div className="flex gap-1 flex-wrap">
                  {row.ada_ujian_tulis && <span className="badge badge-outline badge-xs">Tulis</span>}
                  {row.ada_ujian_praktik && <span className="badge badge-outline badge-xs">Praktik</span>}
                  {row.ada_wawancara && <span className="badge badge-outline badge-xs">Wawancara</span>}
                  {!row.ada_ujian_tulis && !row.ada_ujian_praktik && !row.ada_wawancara && <span className="text-xs text-gray-400">Tidak ada ujian</span>}
                </div>
              )},
              { key: 'is_active', label: 'Status', render: (val) => val ? <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>Aktif</span> : <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600 }}>Tidak Aktif</span> },
              { key: 'actions', label: 'Aksi', align: 'right', render: (_, row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => openEditModal(row)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => handleDelete(row.id)} />
                </div>
              )}
            ]}
          />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Jalur Masuk' : 'Tambah Jalur Masuk'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Kode Jalur *</label>
              <input 
                type="text" 
                className="input input-bordered" 
                {...register('kode', { required: true })} 
                placeholder="Misal: REG"
              />
            </div>
            <div className="form-control">
              <label className="label">Nama Jalur *</label>
              <input 
                type="text" 
                className="input input-bordered" 
                {...register('nama', { required: true })} 
                placeholder="Misal: Reguler"
              />
            </div>
            
            <div className="form-control">
              <label className="label">Tipe Jalur *</label>
              <select className="select select-bordered" {...register('tipe')}>
                <option value="reguler">Reguler</option>
                <option value="mandiri">Mandiri</option>
                <option value="prestasi">Prestasi</option>
                <option value="kerjasama">Kerjasama</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">Status Aktif</label>
              <label className="cursor-pointer label justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" {...register('is_active')} />
                <span className="label-text">Jalur ini aktif digunakan</span>
              </label>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">Deskripsi Keterangan</label>
            <textarea 
              className="textarea textarea-bordered h-24" 
              {...register('deskripsi')} 
              placeholder="Penjelasan singkat mengenai jalur ini"
            ></textarea>
          </div>

          <div className="divider">Komponen Ujian</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control border rounded-lg p-3">
              <label className="cursor-pointer label">
                <span className="label-text font-medium">Ujian Tulis</span>
                <input type="checkbox" className="checkbox checkbox-primary" {...register('ada_ujian_tulis')} />
              </label>
            </div>
            <div className="form-control border rounded-lg p-3">
              <label className="cursor-pointer label">
                <span className="label-text font-medium">Ujian Praktik</span>
                <input type="checkbox" className="checkbox checkbox-primary" {...register('ada_ujian_praktik')} />
              </label>
            </div>
            <div className="form-control border rounded-lg p-3">
              <label className="cursor-pointer label">
                <span className="label-text font-medium">Wawancara</span>
                <input type="checkbox" className="checkbox checkbox-primary" {...register('ada_wawancara')} />
              </label>
            </div>
          </div>

          <div className="modal-action mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jalur Masuk"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterName('');
                setFilterType('');
                setFilterStatus('');
                setFilterOrderBy('id');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  name: '',
                  type: '',
                  status: '',
                  orderBy: 'id',
                  orderDir: 'desc'
                });
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
                  type: filterType,
                  status: filterStatus,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir
                });
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
            label="Pencarian"
            placeholder="Kode atau nama jalur..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <Select 
            label="Tipe Jalur"
            value={filterType}
            onChange={(val) => setFilterType(val)}
            options={[
              { value: '', label: 'Semua Tipe' },
              { value: 'reguler', label: 'Reguler' },
              { value: 'mandiri', label: 'Mandiri' },
              { value: 'prestasi', label: 'Prestasi' },
              { value: 'kerjasama', label: 'Kerjasama' }
            ]}
          />

          <Select 
            label="Status Aktif"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Tidak Aktif' }
            ]}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'kode', label: 'Kode Jalur' },
                { value: 'nama', label: 'Nama Jalur' },
                { value: 'tipe', label: 'Tipe' }
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
    </div>
  );
}
