'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { SEMESTER_OPTIONS } from '@/components/siakad/DistribusiMengajarForm';
import toast from 'react-hot-toast';

const FILTER_SEMESTER_OPTIONS = [{ value: '', label: 'Semua Semester' }, ...SEMESTER_OPTIONS];

const FILTER_KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'wajib', label: 'Wajib' },
  { value: 'pilihan', label: 'Pilihan' },
];

const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

export default function MataKuliahObePage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    semester: '',
    kategori: '',
    status: '',
    sortBy: 'nama',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Backend hanya mengembalikan current_page/per_page/total,
  // lengkapi last_page/from/to agar footer limit & pagination akurat.
  const enrichedMeta = useMemo(() => {
    if (!meta) return undefined;
    const perPage = Number(meta.per_page ?? limit) || 10;
    const total = Number(meta.total ?? 0);
    const currentPage = Number(meta.current_page ?? page) || 1;
    const lastPage = meta.last_page ?? Math.max(1, Math.ceil(total / perPage));
    const from = meta.from ?? (total === 0 ? 0 : (currentPage - 1) * perPage + 1);
    const to = meta.to ?? Math.min(currentPage * perPage, total);
    return { ...meta, per_page: perPage, total, current_page: currentPage, last_page: lastPage, from, to };
  }, [meta, limit, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getMataKuliahs({
        search: appliedFilters.search || undefined,
        semester_anjuran: appliedFilters.semester || undefined,
        tipe: appliedFilters.kategori || undefined,
        is_active: appliedFilters.status || undefined,
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
      toast.error('Gagal memuat mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteMataKuliah(deletingItem.id);
      toast.success('Mata kuliah berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus mata kuliah');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSemester('');
    setFilterKategori('');
    setFilterStatus('');
    setFilterSortBy('nama');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', semester: '', kategori: '', status: '', sortBy: 'nama', sortDir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      semester: filterSemester,
      kategori: filterKategori,
      status: filterStatus,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_r, i) => (
        <span className="font-bold text-slate-400 text-xs">
          {enrichedMeta?.from ? enrichedMeta.from + i : i + 1}
        </span>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama}</span>
          <span className="text-2xs text-slate-500 font-mono block">{r.kode_mk}</span>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI',
      align: 'center',
      render: (r) => {
        const tipe = String(r.tipe || r.kategori || 'wajib').toLowerCase();
        const label = tipe === 'pilihan' ? 'Pilihan' : 'Wajib';
        return <Badge variant={tipe === 'pilihan' ? 'purple' : 'blue'}>{label}</Badge>;
      },
    },
    {
      key: 'bobot_sks',
      label: 'BOBOT SKS',
      align: 'center',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.total_sks ?? 0} SKS</span>
          <span className="text-2xs text-slate-500 font-mono block">
            T:{r.sks_teori ?? 0} • P:{r.sks_praktik ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SEMESTER',
      align: 'center',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-700 text-xs block">Sem. {r.semester_anjuran}</span>
          <span className="text-2xs text-slate-500 block">{r.jumlah_pertemuan || 16}x pertemuan</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (r) =>
        r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge>,
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Mata Kuliah', icon: <Edit2 size={14} />, onClick: () => router.push(`/siakad/obe/matakuliah/${r.id}/edit`) },
              { label: 'Hapus Mata Kuliah', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Daftar Mata Kuliah"
        description="Struktur kurikulum mata kuliah, komposisi SKS teori/praktik, dan alokasi semester."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/siakad/obe/matakuliah/create')}>
              Tambah Daftar Mata Kuliah
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={enrichedMeta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        emptyMessage="Belum ada data mata kuliah."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mata Kuliah"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Kata Kunci" placeholder="Cari kode atau nama..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select
            label="Semester"
            options={FILTER_SEMESTER_OPTIONS}
            value={filterSemester}
            onChange={(val) => setFilterSemester(val || '')}
          />
          <Select
            label="Kategori"
            options={FILTER_KATEGORI_OPTIONS}
            value={filterKategori}
            onChange={(val) => setFilterKategori(val || '')}
          />
          <Select
            label="Status"
            options={FILTER_STATUS_OPTIONS}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
          />
          <hr className="border-t border-slate-200 my-2" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val || 'nama')}
              options={[
                { value: 'nama', label: 'Nama MK' },
                { value: 'kode_mk', label: 'Kode MK' },
                { value: 'total_sks', label: 'Total SKS' },
                { value: 'semester_anjuran', label: 'Semester' },
                { value: 'tipe', label: 'Kategori' },
                { value: 'is_active', label: 'Status' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Kuliah?"
        message={`Apakah Anda yakin ingin menghapus mata kuliah ${deletingItem?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
