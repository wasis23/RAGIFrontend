'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCallback } from 'react';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { loadMataKuliahOptions } from '@/components/siakad/DistribusiMengajarForm';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SEMESTER_OPTIONS } from '@/components/siakad/DistribusiMengajarForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const SORT_BY_OPTIONS = [
  { value: 'semester', label: 'Semester' },
  { value: 'id', label: 'ID' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
];

const SORT_DIR_OPTIONS = [
  { value: 'asc', label: 'A - Z (Naik)' },
  { value: 'desc', label: 'Z - A (Turun)' },
];

export default function DistribusiMengajarPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterMataKuliahId, setFilterMataKuliahId] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('semester');
  const [filterOrderDir, setFilterOrderDir] = useState('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    semester: '',
    kurikulumId: '',
    mataKuliahId: '',
    orderBy: 'semester',
    orderDir: 'asc',
  });

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const kurRes = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = kurRes?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
      return list.map((k: any) => ({
        value: k.id,
        label: `${k.nama || k.kode}${k.tahun_berlaku ? ` — ${k.tahun_berlaku}` : ''}`,
        raw: k,
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getDistribusiMengajarList({
        search: appliedFilters.search || undefined,
        semester: appliedFilters.semester || undefined,
        kurikulum_id: appliedFilters.kurikulumId || undefined,
        mata_kuliah_id: appliedFilters.mataKuliahId || undefined,
        sort_by: appliedFilters.orderBy || undefined,
        sort_order: appliedFilters.orderDir || undefined,
        page,
        limit,
      });
      setItems(res.data || []);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat distribusi mengajar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, page, limit]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteDistribusiMengajar(deletingItem.id);
      toast.success('Distribusi mengajar berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus distribusi mengajar');
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      semester: filterSemester,
      kurikulumId: filterKurikulumId,
      mataKuliahId: filterMataKuliahId,
      orderBy: filterOrderBy,
      orderDir: filterOrderDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSemester('');
    setFilterKurikulumId('');
    setFilterMataKuliahId('');
    setFilterOrderBy('semester');
    setFilterOrderDir('asc');
    setAppliedFilters({
      search: '',
      semester: '',
      kurikulumId: '',
      mataKuliahId: '',
      orderBy: 'semester',
      orderDir: 'asc',
    });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'id',
      label: 'NO',
      align: 'center',
      render: (_r, i) => (
        <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MAKUL',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{r.mata_kuliah?.kode_mk || '-'}</span>
          <span className="font-bold text-slate-800 text-xs block">{r.mata_kuliah?.nama || '-'}</span>
        </div>
      ),
    },
    {
      key: 'kurikulum',
      label: 'KURIKULUM',
      align: 'center',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{r.kurikulum?.tahun_berlaku || '-'}</span>
          <span className="text-2xs text-slate-500 block">{r.kurikulum?.kode || r.kurikulum?.nama || '-'}</span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SEMESTER',
      align: 'center',
      render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.semester}</span>,
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN',
      align: 'center',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {r.tahun_akademik?.tahun_mulai || r.tahun_akademik?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-500 font-mono block">{r.tahun_akademik?.kode || ''}</span>
        </div>
      ),
    },
    {
      key: 'dosen',
      label: 'DOSEN KOORDINATOR DAN ANGGOTA',
      render: (r) => {
        const anggotas: any[] = Array.isArray(r.dosen_anggotas) ? r.dosen_anggotas : [];
        return (
          <div>
            <span className="font-bold text-xs block text-[var(--module-primary)]">
              {r.dosen_koordinator?.nama_lengkap || '-'}
            </span>
            <span className="text-2xs text-slate-500 block">
              {anggotas.length > 0
                ? anggotas.map((a: any) => a.nama_lengkap).join(', ')
                : 'Tanpa anggota'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'kelas',
      label: 'KELAS',
      render: (r) => {
        const kelasList: string[] = Array.isArray(r.kelas_list) ? r.kelas_list : [];
        return (
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {r.mata_kuliah?.kode_mk || '-'} ({kelasList.length > 0 ? kelasList.join(',') : '-'})
            </span>
            <span className="text-2xs text-slate-500 block">{kelasList.length} kelas dibuka</span>
          </div>
        );
      },
    },
    {
      key: 'aksi',
      label: 'OPSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Distribusi',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/siakad/obe/distribusi-mk/${r.id}/edit`),
              },
              {
                label: 'Hapus Distribusi',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingItem(r),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Distribusi Mata Kuliah"
        description="Distribusi penugasan dosen koordinator dan tim pengajar mata kuliah per semester."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Distribusi Mata Kuliah' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/siakad/obe/distribusi-mk/create')}
            >
              Tambah Distribusi Mengajar
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
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Belum ada data distribusi mengajar mata kuliah."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Distribusi Mengajar"
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
          <Input
            label="Pencarian"
            placeholder="Cari MK / kode / dosen..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Semester"
            options={[{ value: '', label: 'Semua Semester' }, ...SEMESTER_OPTIONS]}
            value={filterSemester}
            onChange={(val) => setFilterSemester(val || '')}
          />
          <AsyncSelect
            label="Kurikulum"
            placeholder="Semua Kurikulum..."
            loadOptions={loadKurikulumOptions}
            value={filterKurikulumId ? Number(filterKurikulumId) : null}
            onChange={(opt: any) => {
              setFilterKurikulumId(opt?.value ? String(opt.value) : '');
              setFilterMataKuliahId('');
            }}
            isClearable
          />
          <AsyncSelect
            label="Mata Kuliah"
            placeholder={filterKurikulumId ? 'Cari kode / nama MK...' : 'Pilih kurikulum terlebih dahulu...'}
            loadOptions={(keyword: string) =>
              loadMataKuliahOptions(keyword, filterKurikulumId ? Number(filterKurikulumId) : null)
            }
            value={filterMataKuliahId ? Number(filterMataKuliahId) : null}
            onChange={(opt: any) => setFilterMataKuliahId(opt?.value ? String(opt.value) : '')}
            isDisabled={!filterKurikulumId}
            isClearable
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" options={SORT_BY_OPTIONS} value={filterOrderBy} onChange={(val) => setFilterOrderBy(val || 'semester')} />
            <Select label="Arah" options={SORT_DIR_OPTIONS} value={filterOrderDir} onChange={(val) => setFilterOrderDir(val || 'asc')} />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Distribusi Mengajar?"
        message={`Apakah Anda yakin ingin menghapus distribusi mengajar untuk ${deletingItem?.mata_kuliah?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
