'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { JalurMasuk } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useRouter } from 'next/navigation';

export default function MasterJalurPage() {
  const router = useRouter();
  const [data, setData] = useState<JalurMasuk[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Master Jalur Masuk"
        description="Kelola jalur masuk pendaftaran mahasiswa baru"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={() => router.push('/spmb/master/jalur/create')}>
              Tambah Jalur
            </Button>
            <Button 
              variant="outline"
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
              { key: 'tipe', label: 'Tipe', render: (row) => <span className="uppercase badge badge-ghost badge-sm">{row.tipe}</span> },
              { key: 'ujian', label: 'Komponen Ujian', render: (row) => (
                <div className="flex gap-1 flex-wrap">
                  {row.ada_ujian_tulis && <span className="text-[0.7rem] px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">Tulis</span>}
                  {row.ada_ujian_praktik && <span className="text-[0.7rem] px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">Praktik</span>}
                  {row.ada_wawancara && <span className="text-[0.7rem] px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">Wawancara</span>}
                  {!row.ada_ujian_tulis && !row.ada_ujian_praktik && !row.ada_wawancara && <span className="text-slate-400">-</span>}
                </div>
              )},
              { key: 'is_active', label: 'Status', render: (row) => row.is_active ? <span className="flex items-center gap-1 text-[0.8125rem] font-semibold text-emerald-600">Aktif</span> : <span className="flex items-center gap-1 text-[0.8125rem] font-semibold text-red-500">Tidak Aktif</span> },
              { key: 'actions', label: 'Aksi', align: 'right', render: (row) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => router.push(`/spmb/master/jalur/${row.id}/edit`)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--danger)" />} onClick={() => handleDelete(row.id)} />
                </div>
              )}
            ]}
          />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jalur Masuk"
        footer={
          <div className="flex justify-end gap-3">
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
        <div className="flex flex-col gap-5">
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
              { value: 'transfer', label: 'Transfer' },
              { value: 'beasiswa', label: 'Beasiswa' },
              { value: 'internasional', label: 'Internasional' },
              { value: 'rpla', label: 'RPL/A' }
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
          
          <hr className="border-t border-slate-200 my-2" />

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
