'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Building2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import type {
  SinapraProdiRoleItem,
  SinapraAvailableRole,
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function PlottingRoleProdiPage() {
  const [dataList, setDataList] = useState<SinapraProdiRoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState('');
  const [statusPlottingFilter, setStatusPlottingFilter] = useState('');
  const [sortBy, setSortBy] = useState('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Available Roles Master
  const [availableRoles, setAvailableRoles] = useState<SinapraAvailableRole[]>([]);

  // Modal Plotting State
  const [selectedProdi, setSelectedProdi] = useState<SinapraProdiRoleItem | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | number>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res: any = await sinapraService.getProdiRolesList({
        page,
        search: search || undefined,
        jenjang: jenjangFilter || undefined,
        status_plotting: statusPlottingFilter || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      });

      let items = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        items = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
        metaData = res.meta;
      }

      setDataList(items);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data plotting role program studi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res: any = await sinapraService.getAvailableRolesOptions();
      const roles = res?.data || res || [];
      if (Array.isArray(roles)) {
        setAvailableRoles(roles);
      }
    } catch {
      toast.error('Gagal memuat daftar role laboran.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, jenjangFilter, statusPlottingFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenPlottingModal = (prodi: SinapraProdiRoleItem) => {
    setSelectedProdi(prodi);
    const currentRole = prodi.sinapra_roles?.[0];
    setSelectedRoleId(currentRole ? currentRole.id : '');
  };

  const handleSavePlotting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdi) return;

    setIsSaving(true);
    try {
      const roleIdNum = selectedRoleId ? Number(selectedRoleId) : null;
      await sinapraService.updateProdiRoles(selectedProdi.id, {
        role_id: roleIdNum,
        role_ids: roleIdNum ? [roleIdNum] : [],
      });

      toast.success(`Plotting role untuk ${selectedProdi.nama} berhasil disimpan!`);
      setSelectedProdi(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan plotting role.');
    } finally {
      setIsSaving(false);
    }
  };

  // Columns Definitions (SIMPEG Model Standard: Max 12px, 2-Row Format)
  const columns: ColumnDef<SinapraProdiRoleItem>[] = [
    {
      key: 'kode_prodi',
      label: 'KODE & JENJANG',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            {row.kode_prodi}
          </span>
          <span className="text-2xs text-slate-400 font-semibold uppercase block">
            {row.jenjang || 'Jenjang -'} • ID #{row.id}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'PROGRAM STUDI & FAKULTAS',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.nama}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1 flex items-center gap-1">
            <Building2 size={12} className="text-slate-400" />
            {row.fakultas?.nama ? `${row.fakultas.nama} (${row.fakultas.kode})` : 'Pusat / Umum Kampus'}
          </div>
        </div>
      ),
    },
    {
      key: 'sinapra_roles',
      label: 'ROLE LABORAN PENGAMPU',
      render: (row) => {
        const roles = row.sinapra_roles || [];
        if (roles.length === 0) {
          return (
            <Badge variant="secondary" className="text-2xs font-normal italic">
              Belum Ditentukan
            </Badge>
          );
        }

        return (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            {roles.map((r) => (
              <Badge
                key={r.id}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
                  color: 'var(--module-primary)',
                  borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                }}
                className="text-2xs font-medium flex items-center gap-1"
                title={r.description || r.name}
              >
                <ShieldCheck size={11} />
                {r.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS PLOTTING',
      render: (row) => {
        const count = row.sinapra_roles?.length || 0;
        if (count > 0) {
          return (
            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={12} /> Terplot ({count} Role)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <AlertCircle size={12} /> Belum Diplot
          </span>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Atur Role Laboran',
                icon: <Settings2 size={16} className="text-[var(--module-primary)]" />,
                onClick: () => handleOpenPlottingModal(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Plotting Role Program Studi"
        description="Pemetaan wewenang role laboran pengampu sarana, prasarana, & laboratorium per program studi (Data live dari SIAKAD)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* INFORMATIONAL NOTICE BANNER */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-start gap-3">
        <Info size={18} className="text-[var(--module-primary)] shrink-0 mt-0.5" />
        <div className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-800 dark:text-slate-200">Integrasi Terpusat Modul SIAKAD:</span>{' '}
          Seluruh data Program Studi pada tabel ini merujuk langsung secara dinamis ke master data SIAKAD. Apabila terdapat program studi baru atau perubahan nama di SIAKAD, data akan otomatis ter-update di SINAPRA. Admin SINAPRA berfokus menentukan role laboran pengampu operasional pada masing-masing prodi.
        </div>
      </div>

      {/* DATA TABLE (Standard SIMPEG: bg-white Solid, Server-side pagination) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={dataList}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada data program studi ditemukan."
        />
      </div>

      {/* ------------------------------------------------------------ */}
      {/* FILTER DRAWER (Standard SSO/IAM Kanan ke Kiri) */}
      {/* ------------------------------------------------------------ */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Program Studi"
      >
        <div className="space-y-4 p-4 text-xs">
          <Input
            label="Pencarian Prodi"
            placeholder="Cari nama atau kode prodi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Jenjang Pendidikan"
            value={jenjangFilter}
            onChange={(val) => {
              setJenjangFilter(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Jenjang' },
              { value: 'D3', label: 'D3 (Diploma Tiga)' },
              { value: 'D4', label: 'D4 (Sarjana Terapan)' },
              { value: 'S1', label: 'S1 (Sarjana)' },
              { value: 'S2', label: 'S2 (Magister)' },
            ]}
          />

          <Select
            label="Status Plotting Role"
            value={statusPlottingFilter}
            onChange={(val) => {
              setStatusPlottingFilter(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'terplot', label: 'Sudah Diplot Role' },
              { value: 'belum_terplot', label: 'Belum Diplot Role' },
            ]}
          />

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'nama', label: 'Nama Prodi' },
                { value: 'kode_prodi', label: 'Kode Prodi' },
                { value: 'jenjang', label: 'Jenjang' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortOrder}
              onChange={(val) => setSortOrder(val as any)}
              options={[
                { value: 'asc', label: 'A-Z (Menaik)' },
                { value: 'desc', label: 'Z-A (Menurun)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearch('');
                setJenjangFilter('');
                setStatusPlottingFilter('');
                setSortBy('nama');
                setSortOrder('asc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setShowFilterDrawer(false)}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM ATUR PLOTTING ROLE */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={!!selectedProdi}
        onClose={() => setSelectedProdi(null)}
        title={`Atur Role Laboran — ${selectedProdi?.nama || ''}`}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedProdi(null)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSavePlotting}
              loading={isSaving}
            >
              Simpan Plotting Role
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePlotting} className="space-y-4">
          {/* Identitas Prodi (Read-only banner) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--module-primary)] text-white flex items-center justify-center font-bold text-xs">
                <GraduationCap size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  {selectedProdi?.nama}
                </span>
                <span className="text-2xs text-slate-500 font-mono block">
                  Kode: {selectedProdi?.kode_prodi} • {selectedProdi?.jenjang || '-'} • {selectedProdi?.fakultas?.nama || 'Umum Kampus'}
                </span>
              </div>
            </div>
            <span className="text-2xs text-slate-400 font-mono">
              ID #{selectedProdi?.id}
            </span>
          </div>

          {/* Pemilihan Role Laboran (Dropdown Tunggal yang Bisa Diketik) */}
          <div className="space-y-3">
            <Select
              label="Role Laboran Pengampu"
              value={selectedRoleId}
              onChange={(val) => setSelectedRoleId(val !== undefined && val !== null ? val : '')}
              placeholder="Pilih atau cari role laboran..."
              isClearable={true}
              options={[
                { value: '', label: '-- Lepas Penugasan (Tanpa Role) --' },
                ...availableRoles.map((role) => ({
                  value: role.id,
                  label: role.name,
                })),
              ]}
              hint="Ketik nama role untuk mencari. Setiap program studi hanya dapat ditentukan 1 role pengampu."
            />

            {selectedRoleId && (
              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2 text-2xs text-blue-700 dark:text-blue-300">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-semibold block">
                    {availableRoles.find((r) => String(r.id) === String(selectedRoleId))?.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block line-clamp-2">
                    {availableRoles.find((r) => String(r.id) === String(selectedRoleId))?.description ||
                      `Slug: ${availableRoles.find((r) => String(r.id) === String(selectedRoleId))?.slug}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
