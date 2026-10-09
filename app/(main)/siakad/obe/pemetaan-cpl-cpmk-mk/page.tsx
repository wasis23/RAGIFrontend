'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Checkbox } from '@/components/ui/Checkbox';
import { Printer, Filter, Edit, Search, Loader2 } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

interface PemetaanRow {
  id: number;
  kurikulum_id: number;
  cpl_id: number;
  kode_cpmk: string;
  deskripsi: string;
  kurikulum?: { id: number; nama?: string; kode?: string };
  cpl?: { id: number; kode_cpl?: string; deskripsi?: string };
  mata_kuliahs?: Array<{ id: number; kode_mk: string; nama: string }>;
}

export default function PemetaanCplCpmkMkPage() {
  const [items, setItems] = useState<PemetaanRow[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter 1:1 (Drawer)
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('kode_cpmk');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    sortBy: 'kode_cpmk',
    sortDir: 'asc' as 'asc' | 'desc',
  });
  const [showFilter, setShowFilter] = useState(false);

  // Modal Edit Mata Kuliah
  const [editingItem, setEditingItem] = useState<PemetaanRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [allMks, setAllMks] = useState<Array<{ id: number; kode_mk: string; nama: string }>>([]);
  const [loadingMks, setLoadingMks] = useState(false);
  const [selectedMkIds, setSelectedMkIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [mkSearch, setMkSearch] = useState('');

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
      const res = await siakadService.getPemetaanCplCpmkMk({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId ? Number(appliedFilters.kurikulumId) : undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        per_page: limit,
      });
      const data = res?.data;
      setItems(Array.isArray(data) ? data : []);
      setMeta(res?.meta || null);
    } catch {
      toast.error('Gagal memuat pemetaan CPL-CPMK-MK');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenEdit = async (item: PemetaanRow) => {
    setEditingItem(item);
    const initialIds = new Set((item.mata_kuliahs || []).map((m) => m.id));
    setSelectedMkIds(initialIds);
    setMkSearch('');
    setModalOpen(true);

    // Ambil daftar seluruh mata kuliah di kurikulum terkait
    setLoadingMks(true);
    try {
      const res = await siakadService.getMataKuliahs({
        kurikulum_id: item.kurikulum_id,
        per_page: 200,
      });
      const raw = res?.data;
      const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      setAllMks(list);
    } catch {
      toast.error('Gagal memuat daftar mata kuliah kurikulum');
    } finally {
      setLoadingMks(false);
    }
  };

  const handleToggleMk = (mkId: number) => {
    setSelectedMkIds((prev) => {
      const next = new Set(prev);
      if (next.has(mkId)) {
        next.delete(mkId);
      } else {
        next.add(mkId);
      }
      return next;
    });
  };

  const handleSavePemetaan = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await siakadService.syncCpmkProdiMataKuliah({
        cpmk_prodi_id: editingItem.id,
        mata_kuliah_ids: Array.from(selectedMkIds),
      });
      toast.success('Pemetaan mata kuliah berhasil disimpan');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pemetaan mata kuliah');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      kurikulumId: filterKurikulumId,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKurikulumId('');
    setFilterSortBy('kode_cpmk');
    setFilterSortDir('asc');
    setAppliedFilters({ search: '', kurikulumId: '', sortBy: 'kode_cpmk', sortDir: 'asc' });
    setShowFilter(false);
  };

  const filteredMks = allMks.filter((m) => {
    if (!mkSearch) return true;
    const q = mkSearch.toLowerCase();
    return m.kode_mk?.toLowerCase().includes(q) || m.nama?.toLowerCase().includes(q);
  });

  const columns: ColumnDef<PemetaanRow>[] = [
    {
      key: 'cpl_kode',
      label: 'KODE CPL',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 block text-xs">
          {row.cpl?.kode_cpl || '-'}
        </span>
      ),
    },
    {
      key: 'cpl_deskripsi',
      label: 'RUMUSAN CPL',
      render: (row) => (
        <span className="text-xs text-slate-700 block leading-relaxed line-clamp-3">
          {row.cpl?.deskripsi || '-'}
        </span>
      ),
    },
    {
      key: 'kode_cpmk',
      label: 'KODE CPMK',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 block text-xs">
          {row.kode_cpmk}
        </span>
      ),
    },
    {
      key: 'deskripsi',
      label: 'RUMUSAN CPMK',
      render: (row) => (
        <span className="text-xs text-slate-700 block leading-relaxed line-clamp-3">
          {row.deskripsi || '-'}
        </span>
      ),
    },
    {
      key: 'mata_kuliahs',
      label: 'MATA KULIAH',
      render: (row) =>
        row.mata_kuliahs && row.mata_kuliahs.length > 0 ? (
          <div className="space-y-1.5 font-mono text-xs text-slate-800">
            {row.mata_kuliahs.map((mk) => (
              <div key={mk.id} className="block">
                <span className="font-semibold text-slate-900">{mk.kode_mk}</span>
                <span className="text-2xs text-slate-500 block uppercase font-sans">{mk.nama}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-300 italic text-2xs">Belum dipetakan</span>
        ),
    },
    {
      key: 'opsi',
      label: 'AKSI',
      align: 'center',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Pemetaan MK',
              icon: <Edit size={14} />,
              onClick: () => handleOpenEdit(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan CPL-CPMK-MK"
        description="Distribusi rumusan Capaian Pembelajaran Mata Kuliah (CPMK-PS) ke mata kuliah-mata kuliah yang mengampunya."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan CPL-CPMK-MK' },
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
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />

      {/* Tabel Pemetaan CPL-CPMK-MK menggunakan DataTable terstandarisasi dengan Pagination & Limit */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="Belum ada rumusan CPMK yang terdaftar. Silakan buat rumusan CPMK terlebih dahulu di menu 'Rumusan CPMK'."
      />

      {/* Modal Checklist Mata Kuliah */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="Mata Kuliah"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-900">Pilih Beberapa Mata Kuliah</p>
              <p className="text-2xs text-slate-500">
                CPMK: <span className="font-mono font-bold text-slate-800">{editingItem?.kode_cpmk}</span> ({editingItem?.cpl?.kode_cpl})
              </p>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
              {selectedMkIds.size} dipilih
            </span>
          </div>

          <Input
            placeholder="Cari kode atau nama mata kuliah..."
            prefixIcon={<Search size={14} />}
            value={mkSearch}
            onChange={(e) => setMkSearch(e.target.value)}
          />

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-100 rounded-lg p-2">
            {loadingMks ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Memuat mata kuliah kurikulum...
              </div>
            ) : filteredMks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {allMks.length === 0
                  ? 'Belum ada mata kuliah yang terdaftar di kurikulum ini.'
                  : 'Tidak ada mata kuliah yang cocok dengan kata kunci.'}
              </div>
            ) : (
              filteredMks.map((mk) => {
                const isSelected = selectedMkIds.has(mk.id);
                return (
                  <div
                    key={mk.id}
                    className="p-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Checkbox
                      id={`mk-${mk.id}`}
                      label={`${mk.kode_mk} - ${mk.nama}`}
                      checked={isSelected}
                      onChange={() => handleToggleMk(mk.id)}
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePemetaan}
              isLoading={saving}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drawer Filter 1:1 */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Pemetaan CPL-CPMK-MK">
        <div className="space-y-4">
          <Input
            label="Kata Kunci"
            placeholder="Cari kode CPL / CPMK / deskripsi..."
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
                { value: 'kode_cpmk', label: 'Kode CPMK' },
                { value: 'cpl_id', label: 'Kode CPL' },
                { value: 'id', label: 'Waktu Input' },
              ]}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'kode_cpmk'))}
            />
            <Select
              label="Arah Urutan"
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
              value={filterSortDir}
              onChange={(v) => setFilterSortDir((v as 'asc' | 'desc') || 'asc')}
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
