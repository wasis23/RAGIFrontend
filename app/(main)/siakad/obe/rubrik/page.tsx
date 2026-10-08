'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { TIPE_RUBRIK_OPTIONS, loadProdiOptions } from '@/components/siakad/RubrikForm';
import toast from 'react-hot-toast';

// Nilai tetap domain (closed-set, bukan tabel master): terpusat di satu lokasi.
const SORT_RUBRIK_OPTIONS: SelectOption[] = [
  { value: 'nama_rubrik', label: 'Nama Rubrik' },
  { value: 'kode_rubrik', label: 'Kode Rubrik' },
  { value: 'tipe_rubrik', label: 'Tipe Rubrik' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'A - Z' },
  { value: 'desc', label: 'Z - A' },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

export default function RubrikObePage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama_rubrik');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi: '',
    tipe: '',
    status: '',
    sortBy: 'nama_rubrik',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siakadService.getObeRubrikList({
        search: appliedFilters.search || undefined,
        program_studi_id: appliedFilters.prodi || undefined,
        tipe_rubrik: appliedFilters.tipe || undefined,
        is_active: appliedFilters.status === 'aktif' ? true : appliedFilters.status === 'nonaktif' ? false : undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      if (res.data) {
        setItems(res.data);
        setMeta(res.meta);
      }
    } catch {
      toast.error('Gagal memuat rubrik penilaian');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteObeRubrik(deletingItem.id);
      toast.success('Rubrik penilaian berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus rubrik');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterProdi('');
    setFilterTipe('');
    setFilterStatus('');
    setFilterSortBy('nama_rubrik');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', prodi: '', tipe: '', status: '', sortBy: 'nama_rubrik', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      prodi: filterProdi,
      tipe: filterTipe,
      status: filterStatus,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const tipeLabel = (t: string) => TIPE_RUBRIK_OPTIONS.find((o) => o.value === t)?.label || t;

  const columns: ColumnDef<any>[] = [
    {
      key: 'id',
      label: 'NO',
      align: 'center',
      render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span>,
    },
    {
      key: 'nama_rubrik',
      label: 'RUBRIK',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama_rubrik}</span>
          <span className="text-2xs text-slate-500 font-mono block">{r.kode_rubrik} • {r.kriterias?.length || 0} kriteria</span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.program_studi?.nama || r.programStudi?.nama || '-'}</span>
          <span className="text-2xs text-slate-400 font-mono block">{r.program_studi?.kode_prodi || r.programStudi?.kode_prodi || '-'}</span>
        </div>
      ),
    },
    {
      key: 'tipe_rubrik',
      label: 'TIPE',
      align: 'center',
      render: (r) => <Badge variant="blue" className="capitalize">{tipeLabel(r.tipe_rubrik)}</Badge>,
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (r) => (r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge>),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Rubrik', icon: <Edit2 size={14} />, onClick: () => router.push(`/siakad/obe/rubrik/${r.id}/edit`) },
              { label: 'Hapus Rubrik', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  const renderKriteriaPreview = (r: any) => {
    const list = Array.isArray(r.kriterias) ? r.kriterias : [];
    if (list.length === 0) return <p className="text-2xs text-slate-400 px-4 py-2">Belum ada kriteria pada rubrik ini.</p>;
    return (
      <div className="px-4 py-2 space-y-2 bg-slate-50/60">
        {list.map((k: any, i: number) => (
          <div key={k.id || i} className="rounded-lg border border-slate-200 bg-white p-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-bold text-slate-800 text-xs">{i + 1}. {k.nama_kriteria}</span>
              <span className="text-2xs font-mono text-slate-500">Bobot {k.bobot_persen ?? 0}% • Skor {k.skor_min ?? 0}–{k.skor_max ?? 100}</span>
            </div>
            {k.deskripsi && <p className="text-2xs text-slate-500 mt-1">{k.deskripsi}</p>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rubrik Penilaian"
        description="Instrumen rubrik asesmen, kriteria penilaian, rentang skor minimum/maksimum, dan deskriptor capaian."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Rubrik Penilaian' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/siakad/obe/rubrik/create')}>
              Tambah Rubrik
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        emptyMessage="Belum ada rubrik penilaian yang dibuat."
        renderExpandedRow={renderKriteriaPreview}
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Rubrik Penilaian"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode / nama rubrik..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <AsyncSelect
            label="Program Studi"
            placeholder="Semua prodi..."
            loadOptions={loadProdiOptions}
            value={filterProdi ? Number(filterProdi) : null}
            onChange={(opt: any) => setFilterProdi(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipe Rubrik"
              placeholder="Semua Tipe"
              options={[{ value: '', label: 'Semua Tipe' }, ...TIPE_RUBRIK_OPTIONS]}
              value={filterTipe}
              onChange={(val) => setFilterTipe(String(val || ''))}
              isClearable
            />
            <Select
              label="Status Rubrik"
              options={STATUS_FILTER_OPTIONS}
              value={filterStatus}
              onChange={(val) => setFilterStatus(String(val || ''))}
              isClearable
            />
          </div>
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={(val) => setFilterSortBy(String(val || 'nama_rubrik'))} options={SORT_RUBRIK_OPTIONS} />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')}
              options={SORT_DIR_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Rubrik?"
        message={`Apakah Anda yakin ingin menghapus rubrik ${deletingItem?.nama_rubrik}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
