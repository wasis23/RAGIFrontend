'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Pencil, Trash2, CheckCircle2, RotateCcw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah, formatDate, getApiErrorMessage } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { UangMukaKerja } from '@/types/sikeu.types';
import { SORT_DIRECTION_OPTIONS, UMK_FILTER_STATUS_OPTIONS, UMK_SORT_OPTIONS, UMK_STATUS_OPTIONS } from '@/types/sikeu.types';

const statusSchema = z.object({
  status: z.enum(['aktif', 'selesai'], { error: 'Status wajib dipilih' }),
});

type StatusForm = z.infer<typeof statusSchema>;

export default function UmkPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [data, setData] = useState<UangMukaKerja[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [unitKasId, setUnitKasId] = useState('all');
  const [selectedUnitKas, setSelectedUnitKas] = useState<{ value: string; label: string } | null>(null);
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [applied, setApplied] = useState({ search: '', status: 'all', unit_kas_id: 'all', sort_by: 'tanggal', sort_dir: 'desc' as 'asc' | 'desc' });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<UangMukaKerja | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const {
    control: controlStatus,
    handleSubmit: handleSubmitStatus,
    reset: resetStatus,
    formState: { errors: statusErrors },
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema) as unknown as Resolver<StatusForm>,
    defaultValues: { status: 'selesai' },
  });

  const [deleteTarget, setDeleteTarget] = useState<UangMukaKerja | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canPengajuan = hasPermission('sikeu.kaskecil.pengajuan');
  const canApprove = hasPermission('sikeu.kaskecil.approve');

  const fetchData = useCallback(async (p = 1, f = applied) => {
    setLoading(true);
    try {
      const res = await sikeuService.getUmkList({
        search: f.search || undefined,
        status: f.status,
        unit_kas_id: f.unit_kas_id !== 'all' ? f.unit_kas_id : undefined,
        sort_by: f.sort_by,
        sort_order: f.sort_dir,
        page: p,
        per_page: 15,
      });
      setData(Array.isArray(res.data) ? res.data : []);
      setMeta(res.meta);
      setPage(p);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat data UMK.'));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(1, applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUnitKasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await sikeuService.getUnitKasList();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((u) => String(u.nama_kas || '').toLowerCase().includes(q)) : list;
      return filtered.map((u) => ({ value: String(u.id), label: u.nama_kas }));
    } catch {
      return [];
    }
  }, []);

  const handleApplyFilter = () => {
    const next = { search, status, unit_kas_id: unitKasId, sort_by: sortBy, sort_dir: sortDir };
    setApplied(next);
    setShowFilter(false);
    fetchData(1, next);
  };

  const handleResetFilter = () => {
    setSearch('');
    setStatus('all');
    setSelectedUnitKas(null);
    setUnitKasId('all');
    setSortBy('tanggal');
    setSortDir('desc');
    const next = { search: '', status: 'all', unit_kas_id: 'all', sort_by: 'tanggal', sort_dir: 'desc' as 'asc' | 'desc' };
    setApplied(next);
    setShowFilter(false);
    fetchData(1, next);
  };

  const handleStatusSubmit = async (form: StatusForm) => {
    if (!statusTarget) return;
    setStatusSubmitting(true);
    try {
      await sikeuService.updateUmkStatus(statusTarget.id, {
        status: form.status,
        tanggal_selesai: form.status === 'selesai' ? new Date().toISOString().slice(0, 10) : null,
      });
      toast.success('Status UMK berhasil diperbarui.');
      setStatusModalOpen(false);
      setStatusTarget(null);
      fetchData(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memperbarui status UMK.'));
    } finally {
      setStatusSubmitting(false);
    }
  };

  const openStatusModal = (row: UangMukaKerja) => {
    setStatusTarget(row);
    resetStatus({ status: row.status === 'aktif' ? 'selesai' : 'aktif' });
    setStatusModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await sikeuService.deleteUmk(deleteTarget.id);
      toast.success('UMK berhasil dihapus.');
      setDeleteTarget(null);
      fetchData(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus UMK.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<UangMukaKerja>[] = [
    {
      key: 'nama_penerima',
      label: 'PENERIMA',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-800">{row.nama_penerima}</p>
          <p className="text-2xs text-slate-400">{row.unit_kas?.nama_kas || 'Tanpa unit kas'} • {formatDate(row.tanggal)}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'TOTAL',
      align: 'right',
      render: (row) => <span className="text-xs font-bold tabular-nums">{formatRupiah(row.total)}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        row.status === 'selesai'
          ? <Badge variant="green" className="text-2xs font-bold">Selesai</Badge>
          : <Badge variant="yellow" className="text-2xs font-bold">Aktif</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              ...(canPengajuan && row.status === 'aktif'
                ? [{ label: 'Ubah', icon: <Pencil size={14} />, onClick: () => router.push(`/sikeu/umk/${row.id}/edit`) }]
                : []),
              ...(canApprove
                ? [{
                    label: row.status === 'aktif' ? 'Selesaikan' : 'Aktifkan Kembali',
                    icon: row.status === 'aktif' ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />,
                    onClick: () => openStatusModal(row),
                  }]
                : []),
              ...(canApprove && row.status === 'aktif'
                ? [{ label: 'Hapus', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(row) }]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Uang Muka Kerja (UMK)"
        description="Pencatatan uang muka kegiatan: penerima, tanggal, total, dan penyelesaian pertanggungjawaban."
        action={
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Filter
            </Button>
            {canPengajuan && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => router.push('/sikeu/umk/create')}
                className="font-bold"
              >
                Tambah Data
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        data={data}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={(p) => fetchData(p)}
        emptyMessage="Tidak ada data UMK yang ditemukan."
      />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter UMK">
        <div className="space-y-4">
          <Input label="Cari Penerima / Keterangan" placeholder="Nama penerima atau keterangan..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            label="Status"
            value={status}
            onChange={(val) => setStatus(typeof val === 'object' && val?.target ? val.target.value : (val || 'all'))}
            options={UMK_FILTER_STATUS_OPTIONS}
          />
          <AsyncSelect
            label="Unit Kas"
            loadOptions={loadUnitKasOptions}
            value={selectedUnitKas}
            onChange={(val: { value: string; label: string } | null) => {
              setSelectedUnitKas(val);
              setUnitKasId(val ? val.value : 'all');
            }}
            placeholder="Semua unit kas..."
            isClearable
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan"
              value={sortBy}
              onChange={(val) => setSortBy(typeof val === 'object' && val?.target ? val.target.value : (val || 'tanggal'))}
              options={UMK_SORT_OPTIONS}
            />
            <Select
              label="Arah"
              value={sortDir}
              onChange={(val) => setSortDir(typeof val === 'object' && val?.target ? val.target.value : (val || 'desc'))}
              options={SORT_DIRECTION_OPTIONS}
            />
          </div>
          <div className="pt-4 flex gap-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" className="flex-1 font-bold" onClick={handleApplyFilter}>Terapkan Filter</Button>
          </div>
        </div>
      </Drawer>

      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Ubah Status UMK">
        <form onSubmit={handleSubmitStatus(handleStatusSubmit)} noValidate className="space-y-4">
          <p className="text-xs text-slate-500">
            {statusTarget?.nama_penerima} • {statusTarget ? formatRupiah(statusTarget.total) : ''}
          </p>
          <Controller
            control={controlStatus}
            name="status"
            render={({ field }) => (
              <Select
                label="Status Baru"
                value={field.value}
                onChange={(val) => field.onChange(typeof val === 'object' && val?.target ? val.target.value : val)}
                options={UMK_STATUS_OPTIONS}
                error={statusErrors.status?.message}
              />
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={statusSubmitting}>
              <CheckCircle2 size={16} className="mr-2" /> Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus UMK?"
        message={`UMK ${deleteTarget?.nama_penerima} akan dihapus permanen. Lanjutkan?`}
        confirmText="Hapus"
        isLoading={deleting}
        onConfirm={handleDelete}
      />

      {!canPengajuan && (
        <p className="text-2xs text-slate-400 flex items-center gap-1"><Wallet size={12} /> Anda memiliki akses baca UMK.</p>
      )}
    </div>
  );
}
