'use client';

import { useState, useEffect } from 'react';
import { Filter, Lock, LockOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function PengesahanKhsPage() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [prodis, setProdis] = useState<any[]>([]);
  const loadProdiOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getProdi({ search: keyword || undefined, per_page: 50 });
      const list: any[] = res.data || prodis;
      const q = keyword.toLowerCase();
      return list
        .filter((p: any) => !keyword ? true : p.nama?.toLowerCase().includes(q))
        .map((p: any) => ({ value: p.id, label: p.nama, raw: p }));
    } catch {
      return [];
    }
  };
  const [applied, setApplied] = useState({ search: '', prodi: '', sort_by: 'created_at', sort_order: 'desc', ta: null as number | null });
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortDir, setFilterSortDir] = useState('desc');

  const [lockItem, setLockItem] = useState<any | null>(null);
  const [bulkMode, setBulkMode] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKhsList({
        tahun_akademik_id: applied.ta || undefined,
        search: applied.search || undefined,
        program_studi_id: applied.prodi || undefined,
        sort_by: applied.sort_by || undefined,
        sort_order: applied.sort_order || undefined,
        page,
        per_page: 15,
      });
      setData(res.data || []);
      setMeta((res as any).meta);
    } catch {
      toast.error('Gagal memuat daftar KHS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    siakadService.getTahunAkademiks().then((res) => {
      const list: any[] = res.data || [];
      setTahunAkademiks(list);
      const aktif = list.find((t: any) => t.is_active) || list[0];
      if (aktif) {
        setApplied((prev) => (prev.ta ? prev : { ...prev, ta: aktif.id }));
        setDraftTaId((prev) => prev ?? aktif.id);
      }
    });
    siakadService.getProdi().then((res) => res.data && setProdis(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, applied]);

  const handleLockSatu = async () => {
    if (!lockItem) return;
    try {
      setWorking(true);
      await siakadService.lockKhs(lockItem.id, !lockItem.is_locked);
      toast.success(lockItem.is_locked ? 'Kunci KHS dibuka' : 'KHS dikunci dan disahkan');
      setLockItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah kunci');
    } finally {
      setWorking(false);
    }
  };

  const handleBulk = async () => {
    if (bulkMode === null || !applied.ta) return;
    try {
      setWorking(true);
      const res = await siakadService.bulkLockKhs({
        tahun_akademik_id: applied.ta,
        program_studi_id: applied.prodi ? Number(applied.prodi) : undefined,
        is_locked: bulkMode,
      });
      toast.success(res.message || 'Pengesahan massal selesai');
      setBulkMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal pengesahan massal');
    } finally {
      setWorking(false);
    }
  };

  const selectedTa = tahunAkademiks.find((t) => t.id === applied.ta);
  const [draftTaId, setDraftTaId] = useState<number | null>(null);

  const columns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & NAMA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mahasiswa?.nama_lengkap || '-'}</span>
          <span className="font-mono text-2xs text-slate-500">{row.mahasiswa?.nim || '-'} • {row.mahasiswa?.program_studi?.nama || '-'}</span>
        </div>
      ),
    },
    {
      key: 'ips',
      label: 'IPS',
      align: 'center',
      render: (row) => <span className="font-mono font-bold text-xs">{Number(row.ips || 0).toFixed(2)}</span>,
    },
    {
      key: 'ipk',
      label: 'IPK',
      align: 'center',
      render: (row) => <span className="font-mono font-bold text-xs">{Number(row.ipk || 0).toFixed(2)}</span>,
    },
    {
      key: 'sks',
      label: 'SKS SEM/KUM',
      align: 'center',
      render: (row) => <span className="font-mono text-xs">{row.total_sks_semester || 0}/{row.sks_kumulatif || 0}</span>,
    },
    {
      key: 'status',
      label: 'PENGESAHAN',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_locked ? 'green' : 'amber'} className="text-2xs font-bold">
          {row.is_locked ? 'Disahkan' : 'Draf'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: row.is_locked ? 'Buka Kunci' : 'Kunci & Sahkan',
              icon: row.is_locked ? <LockOpen size={14} /> : <Lock size={14} />,
              onClick: () => setLockItem(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengesahan KHS"
        description="Kunci nilai semester yang sudah final agar tidak dihitung ulang, per mahasiswa atau massal per periode."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pengesahan KHS' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }} onClick={() => { setDraftTaId(applied.ta); setShowFilter(true); }}>
              Filter
            </Button>
          </div>
        }
      />

      <p className="text-2xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
        <span>
          Periode: <strong>{selectedTa?.nama || '-'}</strong> • KHS terkunci tidak dihitung ulang saat nilai final disimpan.
        </span>
        <span className="flex items-center gap-2">
          <Button variant="primary" icon={<Lock size={13} />} className="font-bold text-2xs py-1.5 px-3 h-auto" onClick={() => setBulkMode(true)} disabled={!applied.ta}>
            Sahkan Massal
          </Button>
          <Button variant="outline" icon={<LockOpen size={13} />} className="font-bold text-2xs py-1.5 px-3 h-auto" onClick={() => setBulkMode(false)} disabled={!applied.ta}>
            Buka Massal
          </Button>
        </span>
      </p>

      <DataTable columns={columns} data={data} meta={meta} isLoading={loading} emptyMessage="Belum ada KHS tersimpan periode ini." />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter KHS">
        <div className="flex flex-col gap-5">
          <PeriodeSelector value={draftTaId} onChange={(id) => setDraftTaId(id)} required />
          <Input label="Pencarian" placeholder="Cari NIM / nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <AsyncSelect
            label="Program Studi"
            placeholder="Semua Prodi"
            loadOptions={loadProdiOptions}
            value={filterProdi ? Number(filterProdi) : null}
            onChange={(opt: any) => setFilterProdi(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan"
              options={[
                { value: 'mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'created_at', label: 'Tanggal' },
                { value: 'updated_at', label: 'Diperbarui' },
                { value: 'id', label: 'ID' },
              ]}
              value={filterSortBy || 'created_at'}
              onChange={(v: any) => setFilterSortBy(String(v || 'created_at'))}
            />
            <Select
              label="Arah"
              options={[
                { value: 'desc', label: 'Terbaru' },
                { value: 'asc', label: 'Terlama' },
              ]}
              value={filterSortDir || 'desc'}
              onChange={(v: any) => setFilterSortDir(String(v || 'desc'))}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setApplied({ search, prodi: filterProdi, sort_by: filterSortBy, sort_order: filterSortDir, ta: draftTaId });
              setPage(1);
              setShowFilter(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!lockItem}
        onClose={() => setLockItem(null)}
        onConfirm={handleLockSatu}
        title={lockItem?.is_locked ? 'Buka Kunci KHS?' : 'Kunci & Sahkan KHS?'}
        message={`KHS ${lockItem?.mahasiswa?.nama_lengkap} periode ${selectedTa?.nama || ''} akan ${lockItem?.is_locked ? 'dibuka (dapat dihitung ulang)' : 'dikunci dan disahkan BAAK'}.`}
        confirmText={lockItem?.is_locked ? 'Ya, Buka' : 'Ya, Sahkan'}
        variant="primary"
        isLoading={working}
      />

      <ConfirmDialog
        isOpen={bulkMode !== null}
        onClose={() => setBulkMode(null)}
        onConfirm={handleBulk}
        title={bulkMode ? 'Sahkan Seluruh KHS Periode Ini?' : 'Buka Seluruh Kunci Periode Ini?'}
        message={`Berlaku untuk periode ${selectedTa?.nama || ''}${applied.prodi ? ' (prodi terfilter)' : ' (semua prodi)'}. Tercatat sebagai satu batch audit.`}
        confirmText={bulkMode ? 'Ya, Sahkan Massal' : 'Ya, Buka Massal'}
        variant={bulkMode ? 'primary' : 'danger'}
        isLoading={working}
      />
    </div>
  );
}
