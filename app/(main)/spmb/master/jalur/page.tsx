'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { JalurMasuk } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function MasterJalurPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<JalurMasuk[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
  }>({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [loading, setLoading] = useState(false);

  // Filter drawer state
  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const nameQ = searchParams.get('name') || '';
  const statusQ = searchParams.get('status') || '';
  const orderByQ = searchParams.get('sort_by') || 'nama';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterName, setFilterName] = useState(nameQ);
  const [filterStatus, setFilterStatus] = useState(statusQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getJalurMasuk({
        page,
        limit,
        name: nameQ,
        status: statusQ,
        sort_by: orderByQ,
        sort_dir: orderDirQ
      });
      setData(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data jalur masuk');
    } finally {
      setLoading(false);
    }
  }, [page, limit, nameQ, statusQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      name: filterName,
      status: filterStatus,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterName('');
    setFilterStatus('');
    setFilterOrderBy('nama');
    setFilterOrderDir('asc');
    updateURLParams({
      page: 1,
      name: '',
      status: '',
      sort_by: 'nama',
      sort_dir: 'asc'
    });
    setShowFilter(false);
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

  return (
    <div className="animate-fade-in flex flex-col gap-6">
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
        data={data}
        meta={meta}
        isLoading={loading}
        columns={[
          { key: 'kode', label: 'Kode', sortable: true },
          { key: 'nama', label: 'Nama Jalur', sortable: true },
          { 
            key: 'master_tipe_jalur', 
            label: 'Tipe Jalur', 
            render: (row) => (
              <Badge variant="ghost">
                {row.master_tipe_jalur?.nama || '-'}
              </Badge>
            ) 
          },
          { 
            key: 'is_active', 
            label: 'Status', 
            render: (row) => row.is_active ? (
              <Badge variant="success">Aktif</Badge>
            ) : (
              <Badge variant="danger">Tidak Aktif</Badge>
            ) 
          },
          { 
            key: 'actions', 
            label: 'Aksi', 
            align: 'right', 
            render: (row) => (
              <DropdownMenu
                items={[
                  {
                    label: 'Edit Data',
                    icon: <Edit size={14} />,
                    onClick: () => router.push(`/spmb/master/jalur/${row.id}/edit`),
                  },
                  {
                    label: 'Hapus',
                    icon: <Trash2 size={14} className="text-red-500" />,
                    onClick: () => handleDelete(row.id),
                    danger: true,
                  },
                ]}
              />
            ) 
          }
        ]}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jalur Masuk"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input 
            label="Pencarian"
            placeholder="Kode atau nama jalur..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
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
          
          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'nama', label: 'Nama Jalur' },
                { value: 'kode', label: 'Kode Jalur' },
                { value: 'id', label: 'ID' },
                { value: 'created_at', label: 'Tanggal Dibuat' }
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
