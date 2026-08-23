'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { spmbService } from '@/services/spmb.service';

type ProgramStudi = { id: number; kode_prodi?: string; nama: string; jenjang?: string };
type Meta = { current_page: number; last_page: number; total: number; per_page: number; from?: number; to?: number };

export default function TarifUktProgramStudiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProgramStudi[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 15;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort_by') || 'id';
  const sortDir = searchParams.get('sort_dir') || 'asc';
  const [filterSearch, setFilterSearch] = useState(search);
  const [filterSortBy, setFilterSortBy] = useState(sortBy);
  const [filterSortDir, setFilterSortDir] = useState(sortDir);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await spmbService.getProgramStudi({ page, limit, search, sort_by: sortBy, sort_dir: sortDir });
      setData(response.data || []);
      if (response.meta) setMeta(response.meta);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat program studi');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    filterSearch ? params.set('search', filterSearch) : params.delete('search');
    params.set('sort_by', filterSortBy);
    params.set('sort_dir', filterSortDir);
    router.push(`${pathname}?${params.toString()}`);
    setShowFilter(false);
  };

  return (
    <div className="w-full animate-fade-in flex flex-col gap-4 sm:gap-6">
      <PageHeader title="Tarif UKT Daftar Ulang" description="Pilih program studi untuk mengelola kelompok UKT dari master SIKEU" action={<Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>Filter</Button>} />
      <DataTable data={data} meta={meta} isLoading={loading} columns={[
        { key: 'kode_prodi', label: 'Kode Prodi', sortable: true },
        { key: 'nama', label: 'Program Studi', sortable: true },
        { key: 'jenjang', label: 'Jenjang' },
        { key: 'actions', label: 'Aksi', align: 'right', render: (row) => <DropdownMenu items={[{ label: 'Kelola Tarif', icon: <ChevronRight size={14} />, onClick: () => router.push(`/spmb/master/tarif-ukt/${row.id}`) }]} /> },
      ]} />
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Program Studi" footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowFilter(false)}>Batal</Button><Button onClick={applyFilter}>Terapkan</Button></div>}>
        <div className="flex flex-col gap-4">
          <Input label="Pencarian" value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Kode atau nama program studi..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={setFilterSortBy} options={[{ value: 'id', label: 'ID' }, { value: 'nama', label: 'Nama' }, { value: 'kode_prodi', label: 'Kode Prodi' }]} />
            <Select label="Arah" value={filterSortDir} onChange={setFilterSortDir} options={[{ value: 'asc', label: 'Naik' }, { value: 'desc', label: 'Turun' }]} />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
