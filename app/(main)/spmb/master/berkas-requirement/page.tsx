'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, MoreVertical } from 'lucide-react';
import { spmbService, BerkasRequirement, JalurMasuk } from '@/services/spmb.service';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

export default function MasterBerkasRequirementPage() {
  const router = useRouter();
  const [data, setData] = useState<BerkasRequirement[]>([]);
  const [loading, setLoading] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterJalur, setFilterJalur] = useState<any>(null); // Store the full option {value, label}
  const [filterStatus, setFilterStatus] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    jalur: '',
    status: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('label');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { 
        page, 
        limit, 
        sort_by: sortBy, 
        sort_dir: sortDir 
      };
      
      if (appliedFilters.name) params.search = appliedFilters.name;
      if (appliedFilters.jalur) params.jalur_masuk_id = appliedFilters.jalur;
      if (appliedFilters.status !== '') params.is_active = appliedFilters.status;

      const res = await spmbService.getBerkasRequirements(params);
      setData(res.data?.data || res.data || []);
      if (res.data?.meta || res.meta) {
        setMeta(res.data?.meta || res.meta);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data syarat berkas');
    } finally {
      setLoading(false);
    }
  };

  const loadJalurOptions = async () => {
    try {
      const res = await spmbService.getJalurMasuk();
      return res.data
        .filter((j: any) => j.is_active)
        .map((j: any) => ({
          value: j.id.toString(),
          label: j.nama,
        }));
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, sortBy, sortDir, appliedFilters]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus syarat berkas ini?')) return;
    try {
      await spmbService.deleteBerkasRequirement(id);
      toast.success('Syarat berkas berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const statusLabels = ['Semua Status', 'Aktif', 'Nonaktif'];
  const statusValues = ['', '1', '0'];
  const statusOptions = statusLabels.map((label, idx) => ({ value: statusValues[idx], label }));

  const sortLabels = ['Label Dokumen', 'Jalur Masuk', 'Urutan', 'Status'];
  const sortValues = ['label', 'jalur_masuk_id', 'urutan', 'is_active'];
  const sortOptions = sortLabels.map((label, idx) => ({ value: sortValues[idx], label }));
  
  const sortDirLabels = ['Naik (A-Z)', 'Turun (Z-A)'];
  const sortDirValues = ['asc', 'desc'];
  const sortDirOptions = sortDirLabels.map((label, idx) => ({ value: sortDirValues[idx], label }));

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Master Syarat Berkas"
        description="Kelola persyaratan dokumen untuk pendaftaran berdasarkan jalur masuk"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={() => router.push('/spmb/master/berkas-requirement/create')}>
              Tambah Syarat
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
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        columns={[
          { key: 'label', label: 'Nama Dokumen / Label' },
          { key: 'jalur_masuk', label: 'Jalur Masuk', render: (row) => row.jalur_masuk?.nama },
          { key: 'jenis_dokumen', label: 'Jenis Dokumen', render: (row) => row.jenis_dokumen },
          { key: 'wajib', label: 'Kewajiban', render: (row) => (
            row.wajib ? <Badge variant="spmb">Wajib</Badge> : <Badge variant="gray">Opsional</Badge>
          )},
          { key: 'urutan', label: 'Urutan' },
          { key: 'is_active', label: 'Status', render: (row) => (
            row.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="danger">Nonaktif</Badge>
          )},
          { key: 'actions', label: 'Aksi', align: 'right', render: (row) => (
            <DropdownMenu
              triggerIcon={<MoreVertical size={16} />}
              items={[
                {
                  label: 'Edit',
                  icon: <Edit size={14} />,
                  onClick: () => router.push(`/spmb/master/berkas-requirement/${row.id}/edit`)
                },
                {
                  label: 'Hapus',
                  icon: <Trash2 size={14} />,
                  variant: 'danger',
                  onClick: () => handleDelete(row.id)
                }
              ]}
            />
          )}
        ]}
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Syarat Berkas"
        footer={
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setFilterName('');
                setFilterJalur(null);
                setFilterStatus('');
                setAppliedFilters({ name: '', jalur: '', status: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              className="w-full"
              onClick={() => {
                setAppliedFilters({
                  name: filterName,
                  jalur: filterJalur ? filterJalur.value : '',
                  status: filterStatus,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input 
            label="Pencarian Nama" 
            placeholder="Cari label dokumen..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <AsyncSelect 
            label="Jalur Masuk"
            value={filterJalur}
            onChange={setFilterJalur}
            loadOptions={async () => {
              const options = await loadJalurOptions();
              return [{ value: '', label: 'Semua Jalur' }, ...options];
            }}
            defaultOptions
          />
          <Select 
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
            <Select 
              label="Arah Urutan"
              value={sortDir}
              onChange={(val) => setSortDir(val as 'asc'|'desc')}
              options={sortDirOptions}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
