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
import { useRouter } from 'next/navigation';

export default function MasterGelombangPage() {
  const router = useRouter();
  const [data, setData] = useState<GelombangPenerimaan[]>([]);
  const [jalurList, setJalurList] = useState<JalurMasuk[]>([]);
  const [loading, setLoading] = useState(false);

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
            <Button icon={<Plus size={16} />} onClick={() => router.push('/spmb/master/gelombang/create')}>
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
              { key: 'jalur', label: 'Jalur Masuk', render: (row) => row.jalur_masuk?.nama },
              { key: 'tanggal', label: 'Periode Pendaftaran', render: (row) => (
                <span className="text-sm">
                  {new Date(row.tanggal_buka).toLocaleDateString('id-ID')} - {new Date(row.tanggal_tutup).toLocaleDateString('id-ID')}
                </span>
              )},
              { key: 'kuota_total', label: 'Kuota', render: (row) => `${row.kuota_terisi || 0} / ${row.kuota_total}` },
              { key: 'biaya_pendaftaran', label: 'Biaya', render: (row) => `Rp ${(Number(row.biaya_pendaftaran) || 0).toLocaleString('id-ID')}` },
              { key: 'status', label: 'Status', render: (row) => {
                const colors: any = {
                  'draft': { bg: 'var(--bg-light)', color: 'var(--text-secondary)' },
                  'aktif': { bg: 'var(--success-light)', color: 'var(--success-dark)' },
                  'ditutup': { bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
                  'selesai': { bg: 'var(--primary-100)', color: 'var(--primary-700)' },
                };
                const style = colors[row.status] || colors['draft'];
                return <span style={{ display: 'inline-block', background: style.bg, color: style.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{row.status}</span>;
              }},
              { key: 'actions', label: 'Aksi', align: 'right', render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => router.push(`/spmb/master/gelombang/${row.id}/edit`)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => handleDelete(row.id)} />
                </div>
              )}
            ]}
          />

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
