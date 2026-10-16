'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, LockOpen, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah, formatDate, getApiErrorMessage } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { TutupKasUnit } from '@/types/sikeu.types';
import { SORT_DIRECTION_OPTIONS, TUTUP_KAS_SORT_OPTIONS } from '@/types/sikeu.types';

const tutupKasSchema = z.object({
  unit_kas_id: z.number({ error: 'Unit kas wajib dipilih' }).int('Unit kas wajib dipilih'),
  tanggal: z.string().min(1, 'Tanggal tutup wajib diisi'),
  saldo_awal: z.coerce.number().min(0, 'Saldo tidak boleh negatif').optional(),
  saldo_masuk: z.coerce.number().min(0, 'Saldo tidak boleh negatif').optional(),
  saldo_keluar: z.coerce.number().min(0, 'Saldo tidak boleh negatif').optional(),
});

type TutupKasForm = z.infer<typeof tutupKasSchema>;

export default function TutupKasPage() {
  const { hasPermission } = useAuth();

  const [data, setData] = useState<TutupKasUnit[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [selectedUnitKas, setSelectedUnitKas] = useState<{ value: string; label: string } | null>(null);
  const [unitKasId, setUnitKasId] = useState('all');
  const [tanggal, setTanggal] = useState('');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [applied, setApplied] = useState({ unit_kas_id: 'all', tanggal: '', sort_by: 'tanggal', sort_dir: 'desc' as 'asc' | 'desc' });

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCreateUnitKas, setSelectedCreateUnitKas] = useState<{ value: string; label: string } | null>(null);

  const [unlockTarget, setUnlockTarget] = useState<TutupKasUnit | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const canManage = hasPermission('sikeu.kas.manage');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TutupKasForm>({
    resolver: zodResolver(tutupKasSchema) as unknown as Resolver<TutupKasForm>,
    defaultValues: { tanggal: new Date().toISOString().slice(0, 10), saldo_awal: 0, saldo_masuk: 0, saldo_keluar: 0 },
  });

  const watchedSaldo = watch(['saldo_awal', 'saldo_masuk', 'saldo_keluar']);
  const saldoAkhirOtomatis = (Number(watchedSaldo[0]) || 0) + (Number(watchedSaldo[1]) || 0) - (Number(watchedSaldo[2]) || 0);

  const fetchData = useCallback(async (p = 1, f = applied) => {
    setLoading(true);
    try {
      const res = await sikeuService.getTutupKasList({
        unit_kas_id: f.unit_kas_id !== 'all' ? f.unit_kas_id : undefined,
        tanggal: f.tanggal || undefined,
        sort_by: f.sort_by,
        sort_order: f.sort_dir,
        page: p,
        per_page: 15,
      });
      setData(Array.isArray(res.data) ? res.data : []);
      setMeta(res.meta);
      setPage(p);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat data tutup kas.'));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
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
    const next = { unit_kas_id: unitKasId, tanggal, sort_by: sortBy, sort_dir: sortDir };
    setApplied(next);
    setShowFilter(false);
    fetchData(1, next);
  };

  const handleResetFilter = () => {
    setSelectedUnitKas(null);
    setUnitKasId('all');
    setTanggal('');
    setSortBy('tanggal');
    setSortDir('desc');
    const next = { unit_kas_id: 'all', tanggal: '', sort_by: 'tanggal', sort_dir: 'desc' as 'asc' | 'desc' };
    setApplied(next);
    setShowFilter(false);
    fetchData(1, next);
  };

  const onSubmitCreate = async (form: TutupKasForm) => {
    setSubmitting(true);
    try {
      await sikeuService.createTutupKas({
        unit_kas_id: form.unit_kas_id,
        tanggal: form.tanggal,
        saldo_awal: form.saldo_awal ?? 0,
        saldo_masuk: form.saldo_masuk ?? 0,
        saldo_keluar: form.saldo_keluar ?? 0,
        saldo_akhir: (form.saldo_awal ?? 0) + (form.saldo_masuk ?? 0) - (form.saldo_keluar ?? 0),
      });
      toast.success('Unit kas berhasil ditutup pada tanggal tersebut.');
      setCreateOpen(false);
      setSelectedCreateUnitKas(null);
      reset({ tanggal: new Date().toISOString().slice(0, 10), saldo_awal: 0, saldo_masuk: 0, saldo_keluar: 0 });
      fetchData(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menutup kas.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockTarget) return;
    setUnlocking(true);
    try {
      await sikeuService.deleteTutupKas(unlockTarget.id);
      toast.success('Kunci tutup kas berhasil dibuka.');
      setUnlockTarget(null);
      fetchData(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal membuka kunci tutup kas.'));
    } finally {
      setUnlocking(false);
    }
  };

  const columns: ColumnDef<TutupKasUnit>[] = [
    {
      key: 'unit_kas',
      label: 'UNIT KAS',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1"><Lock size={12} className="text-slate-400" />{row.unit_kas?.nama_kas || `Unit #${row.unit_kas_id}`}</p>
          <p className="text-2xs text-slate-400">Terkunci per {formatDate(row.tanggal)}</p>
        </div>
      ),
    },
    {
      key: 'saldo_akhir',
      label: 'SALDO AKHIR',
      align: 'right',
      render: (row) => <span className="text-xs font-bold tabular-nums">{formatRupiah(row.saldo_akhir)}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={canManage
              ? [{ label: 'Buka Kunci', icon: <LockOpen size={14} />, onClick: () => setUnlockTarget(row) }]
              : []}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Tutup Kas per Unit"
        description="Kunci transaksi mundur per unit kas. Kasir, UMK, kas kecil, dan pencairan menolak tanggal terkunci."
        action={
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)} className="font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]">
              Filter
            </Button>
            {canManage && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => { setSelectedCreateUnitKas(null); setCreateOpen(true); }} className="font-bold">
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
        emptyMessage="Belum ada kunci tutup kas."
      />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Tutup Kas">
        <div className="space-y-4">
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
          <Input label="Tanggal Tepat" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan"
              value={sortBy}
              onChange={(val) => setSortBy(typeof val === 'object' && val?.target ? val.target.value : (val || 'tanggal'))}
              options={TUTUP_KAS_SORT_OPTIONS}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tutup Kas Unit">
        <form onSubmit={handleSubmit(onSubmitCreate)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="unit_kas_id"
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Kas"
                  required
                  loadOptions={loadUnitKasOptions}
                  value={selectedCreateUnitKas}
                  onChange={(val: { value: string; label: string } | null) => {
                    setSelectedCreateUnitKas(val || null);
                    field.onChange(val ? Number(val.value) : undefined);
                  }}
                  placeholder="Pilih unit kas..."
                  error={errors.unit_kas_id?.message as string | undefined}
                  isClearable
                />
              )}
            />

            <Input label="Tanggal Tutup *" type="date" {...register('tanggal')} error={errors.tanggal?.message} />
            <Input label="Saldo Awal (Rp)" type="number" min={0} {...register('saldo_awal')} error={errors.saldo_awal?.message} />
            <Input label="Saldo Masuk (Rp)" type="number" min={0} {...register('saldo_masuk')} error={errors.saldo_masuk?.message} />
            <Input label="Saldo Keluar (Rp)" type="number" min={0} {...register('saldo_keluar')} error={errors.saldo_keluar?.message} />
            <div className="col-span-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Saldo Akhir (otomatis = awal + masuk − keluar)</span>
              <span className="text-xs font-black text-slate-800 tabular-nums">{formatRupiah(saldoAkhirOtomatis)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!unlockTarget}
        onClose={() => setUnlockTarget(null)}
        title="Buka Kunci Tutup Kas?"
        message={`Transaksi mundur untuk ${unlockTarget?.unit_kas?.nama_kas} per ${unlockTarget ? formatDate(unlockTarget.tanggal) : ''} akan diizinkan kembali.`}
        confirmText="Buka Kunci"
        variant="warning"
        isLoading={unlocking}
        onConfirm={handleUnlock}
      />
    </div>
  );
}
