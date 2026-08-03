'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { GelombangPenerimaan, JalurMasuk } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

export default function MasterGelombangPage() {
  const [data, setData] = useState<GelombangPenerimaan[]>([]);
  const [jalurList, setJalurList] = useState<JalurMasuk[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterJalur, setFilterJalur] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    jalur: '',
    status: '',
    orderBy: 'id',
    orderDir: 'desc'
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<GelombangPenerimaan>>();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await spmbService.getGelombang();
      setData(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data gelombang');
    } finally {
      setLoading(false);
    }
  };

  const fetchJalur = async () => {
    try {
      const res = await spmbService.getJalurMasuk();
      setJalurList(res.data.filter((j: any) => j.is_active));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchJalur();
  }, []);

  const openAddDrawer = () => {
    setEditingId(null);
    reset({
      jalur_masuk_id: undefined,
      tahun_akademik_id: 1, // Dummy default
      nama: '',
      tanggal_buka: '',
      tanggal_tutup: '',
      tanggal_ujian: '',
      tanggal_pengumuman: '',
      kuota_total: 100,
      biaya_pendaftaran: 250000,
      status: 'draft',
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (row: GelombangPenerimaan) => {
    setEditingId(row.id);
    reset({
      ...row,
      tanggal_buka: row.tanggal_buka ? row.tanggal_buka.substring(0, 10) : '',
      tanggal_tutup: row.tanggal_tutup ? row.tanggal_tutup.substring(0, 10) : '',
      tanggal_ujian: row.tanggal_ujian ? row.tanggal_ujian.substring(0, 10) : '',
      tanggal_pengumuman: row.tanggal_pengumuman ? row.tanggal_pengumuman.substring(0, 10) : '',
    });
    setIsDrawerOpen(true);
  };

  const onSubmit = async (formData: Partial<GelombangPenerimaan>) => {
    try {
      if (editingId) {
        await spmbService.updateGelombang(editingId, formData);
        toast.success('Gelombang berhasil diperbarui');
      } else {
        await spmbService.createGelombang(formData);
        toast.success('Gelombang berhasil ditambahkan');
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gelombang ini?')) return;
    try {
      await spmbService.deleteGelombang(id);
      toast.success('Gelombang berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    if (appliedFilters.name) {
      result = result.filter(item => 
        item.nama.toLowerCase().includes(appliedFilters.name.toLowerCase())
      );
    }
    if (appliedFilters.jalur) {
      result = result.filter(item => item.jalur_masuk_id.toString() === appliedFilters.jalur);
    }
    if (appliedFilters.status !== '') {
      result = result.filter(item => item.status === appliedFilters.status);
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
        title="Master Gelombang"
        description="Kelola jadwal dan gelombang pendaftaran SPMB"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon={<Plus size={16} />} onClick={openAddDrawer}>
              Tambah Gelombang
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
              { key: 'nama', label: 'Nama Gelombang', sortable: true },
              { key: 'jalur', label: 'Jalur Masuk', render: (_, row) => row.jalur_masuk?.nama },
              { key: 'tanggal', label: 'Periode Pendaftaran', render: (_, row) => (
                <span className="text-sm">
                  {new Date(row.tanggal_buka).toLocaleDateString('id-ID')} - {new Date(row.tanggal_tutup).toLocaleDateString('id-ID')}
                </span>
              )},
              { key: 'kuota_total', label: 'Kuota', render: (val, row) => `${row.kuota_terisi || 0} / ${val}` },
              { key: 'biaya_pendaftaran', label: 'Biaya', render: (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}` },
              { key: 'status', label: 'Status', render: (val) => {
                const colors: any = {
                  'draft': { bg: 'var(--bg-light)', color: 'var(--text-secondary)' },
                  'aktif': { bg: 'var(--success-light)', color: 'var(--success-dark)' },
                  'ditutup': { bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
                  'selesai': { bg: 'var(--primary-100)', color: 'var(--primary-700)' },
                };
                const style = colors[val] || colors['draft'];
                return <span style={{ display: 'inline-block', background: style.bg, color: style.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{val}</span>;
              }},
              { key: 'actions', label: 'Aksi', align: 'right', render: (_, row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => openEditDrawer(row)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => handleDelete(row.id)} />
                </div>
              )}
            ]}
          />

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={editingId ? 'Edit Gelombang' : 'Tambah Gelombang'}
        position="right"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          <div className="form-control">
            <label className="label">Jalur Masuk *</label>
            <select className="select select-bordered" {...register('jalur_masuk_id', { required: true })}>
              <option value="">Pilih Jalur...</option>
              {jalurList.map((j) => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">Nama Gelombang *</label>
            <input 
              type="text" 
              className="input input-bordered" 
              {...register('nama', { required: true })} 
              placeholder="Contoh: Gelombang 1 - Prestasi"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Tgl Buka Pendaftaran *</label>
              <input type="date" className="input input-bordered" {...register('tanggal_buka', { required: true })} />
            </div>
            <div className="form-control">
              <label className="label">Tgl Tutup Pendaftaran *</label>
              <input type="date" className="input input-bordered" {...register('tanggal_tutup', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Tgl Ujian</label>
              <input type="date" className="input input-bordered" {...register('tanggal_ujian')} />
            </div>
            <div className="form-control">
              <label className="label">Tgl Pengumuman</label>
              <input type="date" className="input input-bordered" {...register('tanggal_pengumuman')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Kuota Pendaftar *</label>
              <input type="number" className="input input-bordered" {...register('kuota_total', { required: true, min: 1 })} />
            </div>
            <div className="form-control">
              <label className="label">Biaya Pendaftaran (Rp) *</label>
              <input type="number" className="input input-bordered" {...register('biaya_pendaftaran', { required: true, min: 0 })} />
              <label className="label">
                <span className="label-text-alt text-gray-500">Nilai ini digunakan sebagai tarif tagihan SPMB.</span>
              </label>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">Status</label>
            <select className="select select-bordered" {...register('status', { required: true })}>
              <option value="draft">Draft (Belum Dibuka)</option>
              <option value="aktif">Aktif (Sedang Berjalan)</option>
              <option value="ditutup">Ditutup (Pendaftaran Berakhir)</option>
              <option value="selesai">Selesai (Sudah Pengumuman)</option>
            </select>
          </div>
          
          {/* Hidden academic year ID for now since we don't have Siakad integrated yet in this context */}
          <input type="hidden" {...register('tahun_akademik_id')} value={1} />

          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <button type="button" className="btn btn-ghost" onClick={() => setIsDrawerOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Gelombang</button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Gelombang"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterName('');
                setFilterJalur('');
                setFilterStatus('');
                setFilterOrderBy('id');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  name: '',
                  jalur: '',
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
                  jalur: filterJalur,
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
            label="Nama Gelombang"
            placeholder="Cari nama gelombang..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <Select 
            label="Jalur Masuk"
            value={filterJalur}
            onChange={(val) => setFilterJalur(val)}
            options={[
              { value: '', label: 'Semua Jalur' },
              ...jalurList.map(j => ({ value: j.id.toString(), label: j.nama }))
            ]}
          />

          <Select 
            label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'ditutup', label: 'Ditutup' },
              { value: 'selesai', label: 'Selesai' }
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
                { value: 'nama', label: 'Nama Gelombang' },
                { value: 'tanggal_buka', label: 'Tgl Buka' },
                { value: 'status', label: 'Status' }
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
