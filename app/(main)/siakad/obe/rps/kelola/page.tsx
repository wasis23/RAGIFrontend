'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Plus, Filter, Eye, Copy, Edit2, FileText, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const STATUS_IZIN_EDIT_OPTIONS: SelectOption[] = [
  { value: 'ya', label: 'Ya' },
  { value: 'tidak', label: 'Tidak' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'created_at', label: 'Waktu Dibuat' },
  { value: 'semester', label: 'Semester' },
  { value: 'kode_rps', label: 'Kode RPS' },
  { value: 'id', label: 'ID' },
];

const SEMESTER_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'Menaik (A-Z)' },
  { value: 'desc', label: 'Menurun (Z-A)' },
];

export default function RpsKelolaPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDosenId, setFilterDosenId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    semester: '',
    dosenId: '',
    sortBy: 'created_at',
    sortDir: 'desc' as 'asc' | 'desc',
  });
  const [showFilter, setShowFilter] = useState(false);
  const [deletingRpsId, setDeletingRpsId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const loadDosenOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((d: any) => ({
        value: d.id,
        label: `${d.nama || d.nama_lengkap || d.name}${d.nidn ? ` (${d.nidn})` : ''}`,
        raw: d,
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
        semester: appliedFilters.semester ? Number(appliedFilters.semester) : undefined,
        dosen_id: appliedFilters.dosenId ? Number(appliedFilters.dosenId) : undefined,
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

  const handleToggleDosenEdit = async (rpsId: number, currentVal: boolean) => {
    const nextVal = !currentVal;
    try {
      await siakadService.toggleDosenBisaEditRps(rpsId, nextVal);
      setItems((prev) =>
        prev.map((item) =>
          item.id === rpsId ? { ...item, dosen_bisa_edit: nextVal } : item
        )
      );
      toast.success(nextVal ? 'Dosen diizinkan mengedit RPS' : 'Izin edit dosen dinonaktifkan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah izin edit dosen');
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      semester: filterSemester,
      dosenId: filterDosenId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterSemester('');
    setFilterDosenId('');
    setFilterSortBy('created_at');
    setFilterSortDir('desc');
    setAppliedFilters({ search: '', kurikulumId: '', semester: '', dosenId: '', sortBy: 'created_at', sortDir: 'desc' });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'mata_kuliah',
      label: 'Mata Kuliah',
      sortable: true,
      render: (row) => {
        const mk = row.mata_kuliah || row.mataKuliah;
        return (
          <div className="leading-snug">
            <span className="font-mono font-bold text-slate-900 block text-xs">
              {mk?.kode_mk || '-'}
            </span>
            <span className="text-xs text-slate-700 block uppercase font-medium">
              {mk?.nama || 'Tanpa Nama MK'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'kurikulum',
      label: 'Kurikulum',
      render: (row) => {
        const kur = row.mata_kuliah?.kurikulum || row.kurikulum;
        return (
          <span className="text-xs font-semibold text-slate-700 block">
            {kur?.kode || kur?.nama || '-'}
          </span>
        );
      },
    },
    {
      key: 'semester',
      label: 'Semester',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-slate-800 text-center block">
          {row.semester || row.mata_kuliah?.semester_anjuran || 1}
        </span>
      ),
    },
    {
      key: 'dosen_pengampu',
      label: 'Dosen Koordinator / Anggota',
      render: (row) => {
        const koordinator = row.dosen_koordinator || row.koordinator_rmk || row.koordinatorRmk;
        const anggotas: any[] = Array.isArray(row.dosen_anggotas) ? row.dosen_anggotas : [];
        const kaprodi = row.kaprodi;

        return (
          <div className="space-y-1 text-2xs leading-snug">
            {koordinator && (
              <div>
                <span style={{ color: 'var(--module-primary)' }} className="font-bold block">Koordinator:</span>
                <span className="text-slate-800 font-semibold">{koordinator.nama_lengkap || koordinator.nama || koordinator.name}</span>
              </div>
            )}
            {anggotas.length > 0 && (
              <div>
                <span className="text-slate-500 font-bold block">Anggota:</span>
                <span className="text-slate-700">{anggotas.map((a: any) => a.nama_lengkap || a.nama || a.name).join(', ')}</span>
              </div>
            )}
            {kaprodi && (
              <div className="pt-0.5 border-t border-slate-100">
                <span className="text-slate-400 font-semibold block">Penugasan (Ka Prodi):</span>
                <span style={{ color: 'var(--module-primary)' }} className="font-medium">{kaprodi.nama_lengkap || kaprodi.nama || kaprodi.name}</span>
              </div>
            )}
            {!koordinator && anggotas.length === 0 && !kaprodi && (
              <span className="text-slate-300 italic">Belum ditentukan</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'koor_boleh_edit',
      label: 'Koor Boleh Edit RPS?',
      align: 'center',
      render: (row) => {
        const canEdit = row.dosen_bisa_edit ?? true;
        return (
          <div className="w-24 mx-auto">
            <Select
              options={STATUS_IZIN_EDIT_OPTIONS}
              value={canEdit ? 'ya' : 'tidak'}
              onChange={(opt: any) => {
                const val = typeof opt === 'object' ? opt?.value : opt;
                handleToggleDosenEdit(row.id, val === 'tidak');
              }}
            />
          </div>
        );
      },
    },
    {
      key: 'kelas',
      label: 'Kelas',
      render: (row) => {
        const mk = row.mata_kuliah || row.mataKuliah;
        const distribusiKelas = row.distribusi_kelas_formatted || (row.distribusi_kelas_list?.length > 0 ? row.distribusi_kelas_list.join(',') : null);
        const kelasList = mk?.kelas || [];

        if (distribusiKelas) {
          return (
            <div className="font-mono text-2xs text-slate-900 font-bold">
              {mk?.kode_mk ? `${mk.kode_mk} (${distribusiKelas})` : distribusiKelas}
            </div>
          );
        }

        return kelasList.length > 0 ? (
          <div className="space-y-0.5 font-mono text-2xs text-slate-800">
            {kelasList.map((k: any) => (
              <span key={k.id} className="block">
                {k.kode_kelas || `${mk.kode_mk} (${k.nama_kelas || 'Kelas'})`}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-2xs text-slate-400 italic block">
            Belum ada kelas
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Opsi',
      align: 'center',
      render: (row) => {
        if (!row.has_rps) {
          return (
            <DropdownMenu
              items={[
                {
                  label: 'Buat RPS',
                  icon: <Plus size={14} />,
                  onClick: () => router.push(`/siakad/obe/rps/kelola/create?mata_kuliah_id=${row.mata_kuliah_id}`),
                },
              ]}
            />
          );
        }

        return (
          <DropdownMenu
            items={[
              {
                label: 'Edit RPS',
                icon: <Edit2 size={14} />,
                onClick: () => {
                  router.push(`/siakad/obe/rps/${row.id}/edit`);
                },
              },
              {
                label: 'Detail RPS',
                icon: <Eye size={14} />,
                onClick: () => {
                  router.push(`/siakad/obe/rps/${row.id}`);
                },
              },
              {
                label: 'Cetak RPS',
                icon: <FileText size={14} />,
                onClick: () => {
                  window.open(`/siakad/obe/rps/${row.id}/cetak`, '_blank');
                },
              },
              {
                label: 'Hapus RPS',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => {
                  setDeletingRpsId(row.id);
                },
              },
            ]}
          />
        );
      },
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
        emptyMessage="Belum ada dokumen RPS yang terdaftar. Klik 'Buat RPS' untuk menambahkan dokumen baru."
      />

      {/* Drawer Filter */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Dokumen RPS" width="400px">
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

          <Select
            label="Semester"
            options={SEMESTER_FILTER_OPTIONS}
            value={filterSemester}
            onChange={(v) => setFilterSemester(String(v || ''))}
          />

          <AsyncSelect
            label="Dosen Pengampu / RMK"
            placeholder="Semua dosen..."
            loadOptions={loadDosenOptions}
            value={filterDosenId ? Number(filterDosenId) : null}
            onChange={(opt: any) => setFilterDosenId(opt?.value ? String(opt.value) : '')}
            isClearable
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              options={SORT_BY_OPTIONS}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'created_at'))}
            />
            <Select
              label="Arah Urutan"
              options={SORT_DIR_OPTIONS}
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

      <ConfirmDialog
        isOpen={Boolean(deletingRpsId)}
        onClose={() => setDeletingRpsId(null)}
        onConfirm={async () => {
          if (!deletingRpsId) return;
          try {
            setDeleting(true);
            await siakadService.deleteRps(deletingRpsId);
            toast.success('Dokumen RPS berhasil dihapus');
            setDeletingRpsId(null);
            fetchData();
          } catch {
            toast.error('Gagal menghapus dokumen RPS');
          } finally {
            setDeleting(false);
          }
        }}
        title="Hapus Dokumen RPS?"
        message="Apakah Anda yakin ingin menghapus dokumen RPS ini? Aksi ini tidak dapat dibatalkan."
        isLoading={deleting}
      />
    </div>
  );
}
