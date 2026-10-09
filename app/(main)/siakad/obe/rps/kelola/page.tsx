'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Eye } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function RpsKelolaPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    sortBy: 'created_at',
    sortDir: 'desc' as 'asc' | 'desc',
  });
  const [showFilter, setShowFilter] = useState(false);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((k: any) => ({
        value: k.id,
        label: `${k.nama || k.kode || `Kurikulum #${k.id}`}${k.tahun_berlaku ? ` — ${k.tahun_berlaku}` : ''}`,
        raw: k,
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siakadService.getRps({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId ? Number(appliedFilters.kurikulumId) : undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      const raw = res?.data;
      setItems(Array.isArray(raw) ? raw : (raw?.items || raw?.data || []));
      setMeta(res?.meta || null);
    } catch {
      toast.error('Gagal memuat daftar dokumen RPS');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterSortBy('created_at');
    setFilterSortDir('desc');
    setAppliedFilters({ search: '', kurikulumId: '', sortBy: 'created_at', sortDir: 'desc' });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">
            {row.mata_kuliah?.kode_mk || row.mataKuliah?.kode_mk || '-'}
          </span>
          <span className="text-xs text-slate-700 block">
            {row.mata_kuliah?.nama || row.mataKuliah?.nama || 'Tanpa Nama MK'}
          </span>
        </div>
      ),
    },
    {
      key: 'kurikulum',
      label: 'KURIKULUM',
      render: (row) => (
        <span className="text-2xs text-slate-600 block">
          {row.mata_kuliah?.kurikulum?.nama || row.kurikulum?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS RPS',
      align: 'center',
      render: (row) => {
        const isApproved = row.status === 'disetujui' || row.status === 'approved';
        return (
          <span
            className={`inline-block px-2 py-0.5 text-2xs font-semibold rounded-md ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {row.status || 'Draft'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Detail RPS',
              icon: <Eye size={14} />,
              onClick: () => {
                toast(`Membuka RPS ID #${row.id}`);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Kelola Dokumen RPS"
        description="Manajemen dokumen Rencana Pembelajaran Semester (RPS) mata kuliah, evaluasi mingguan, dan verifikasi silabus."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS' },
          { label: 'Kelola RPS' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/siakad/obe/rps/kelola/create')}
            >
              Buat RPS
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada dokumen RPS yang terdaftar."
      />

      {/* Drawer Filter */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Dokumen RPS">
        <div className="space-y-4">
          <Input
            label="Kata Kunci"
            placeholder="Cari kode MK, nama MK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <AsyncSelect
            label="Kurikulum"
            placeholder="Semua kurikulum..."
            loadOptions={loadKurikulumOptions}
            value={filterKurikulumId ? Number(filterKurikulumId) : null}
            onChange={(opt: any) => setFilterKurikulumId(opt?.value ? String(opt.value) : '')}
            isClearable
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              options={[
                { value: 'created_at', label: 'Waktu Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'created_at'))}
            />
            <Select
              label="Arah Urutan"
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
              value={filterSortDir}
              onChange={(v) => setFilterSortDir((v as 'asc' | 'desc') || 'desc')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
