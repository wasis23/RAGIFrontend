'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Info,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import type { SaldoAwalData } from '@/types/sikeu.types';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

const barisSchema = z
  .object({
    akun_id: z.number({ error: 'Akun wajib dipilih' }).int().positive('Akun wajib dipilih'),
    debet: z.number({ error: 'Debet wajib diisi' }).min(0, 'Nominal tidak boleh negatif'),
    kredit: z.number({ error: 'Kredit wajib diisi' }).min(0, 'Nominal tidak boleh negatif'),
    keterangan: z.string().optional(),
  })
  .refine((row) => row.debet > 0 || row.kredit > 0, {
    message: 'Isi nominal debet atau kredit',
    path: ['debet'],
  })
  .refine((row) => !(row.debet > 0 && row.kredit > 0), {
    message: 'Isi salah satu saja: debet atau kredit',
    path: ['kredit'],
  });

const saldoAwalSchema = z
  .object({
    tanggal: z.string().min(1, 'Tanggal saldo awal wajib diisi'),
    keterangan: z.string().max(1000, 'Keterangan maksimal 1000 karakter').optional(),
    details: z.array(barisSchema).min(1, 'Tambahkan minimal satu baris akun'),
  })
  .superRefine((values, ctx) => {
    const akunDipakai = new Set<number>();
    values.details.forEach((row, index) => {
      if (akunDipakai.has(row.akun_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['details', index, 'akun_id'],
          message: 'Akun yang sama tidak boleh dipilih dua kali',
        });
      }
      akunDipakai.add(row.akun_id);
    });

    if (values.details.every((row) => row.debet === 0 && row.kredit === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['details'],
        message: 'Total saldo awal harus lebih dari nol',
      });
    }
  });

type SaldoAwalFormValues = z.infer<typeof saldoAwalSchema>;

const emptyRow = { akun_id: 0, debet: 0, kredit: 0, keterangan: '' };

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
};

export default function SaldoAwalAkuntansiPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('sikeu.akuntansi.manage');

  const [data, setData] = useState<SaldoAwalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<SaldoAwalFormValues>({
    resolver: zodResolver(saldoAwalSchema),
    defaultValues: {
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: '',
      details: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'details' });
  const watchedDetails = watch('details');

  const saldoAwal = data?.saldo_awal ?? null;
  const isPosted = saldoAwal?.status === 'posted';
  const isDraft = saldoAwal?.status === 'draft';
  const readOnly = isPosted || !canManage;

  const coaOptions = useMemo(
    () => (data?.coa ?? []).map((akun) => ({
      value: akun.id,
      label: `${akun.kode_akun} — ${akun.nama_akun}`,
    })),
    [data]
  );

  const loadAkunOptions = useCallback(
    async (inputValue: string) => {
      const keyword = inputValue.trim().toLowerCase();
      if (!keyword) return coaOptions;

      return coaOptions.filter((option) => option.label.toLowerCase().includes(keyword));
    },
    [coaOptions]
  );

  const totals = useMemo(() => {
    const rows = watchedDetails ?? [];
    const debet = rows.reduce((sum, row) => sum + (Number(row.debet) || 0), 0);
    const kredit = rows.reduce((sum, row) => sum + (Number(row.kredit) || 0), 0);
    const selisih = Math.round((debet - kredit) * 100) / 100;
    const penyeimbangDebet = selisih < 0 ? Math.abs(selisih) : 0;
    const penyeimbangKredit = selisih > 0 ? selisih : 0;

    return {
      debet,
      kredit,
      selisih,
      penyeimbangDebet,
      penyeimbangKredit,
      totalDebet: debet + penyeimbangDebet,
      totalKredit: kredit + penyeimbangKredit,
    };
  }, [watchedDetails]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getSaldoAwal();
      const payload = res?.data ?? null;
      setData(payload);

      const header = payload?.saldo_awal;
      const rows = (header?.details ?? []).map((detail) => ({
        akun_id: Number(detail.akun_id),
        debet: Number(detail.debet),
        kredit: Number(detail.kredit),
        keterangan: detail.keterangan ?? '',
      }));

      replace(rows);
      reset({
        tanggal: header?.tanggal
          ? String(header.tanggal).slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        keterangan: header?.keterangan ?? '',
        details: rows,
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal memuat data saldo awal'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detailError = (index: number, field: 'akun_id' | 'debet' | 'kredit' | 'keterangan') => {
    const detailsErrors = errors.details;
    if (!Array.isArray(detailsErrors)) return undefined;

    const row = detailsErrors[index] as
      | Partial<Record<'akun_id' | 'debet' | 'kredit' | 'keterangan', { message?: string }>>
      | undefined;

    return row?.[field]?.message;
  };

  const payloadFromValues = (values: SaldoAwalFormValues) => ({
    tanggal: values.tanggal,
    keterangan: values.keterangan?.trim() || undefined,
    details: values.details.map((row) => ({
      akun_id: Number(row.akun_id),
      debet: Number(row.debet) || 0,
      kredit: Number(row.kredit) || 0,
      keterangan: row.keterangan?.trim() || undefined,
    })),
  });

  const simpanDraft = handleSubmit(async (values) => {
    if (!canManage || readOnly) return;

    setSaving(true);
    try {
      await sikeuService.saveSaldoAwal(payloadFromValues(values));
      toast.success('Draft saldo awal berhasil disimpan');
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan draft saldo awal'));
    } finally {
      setSaving(false);
    }
  });

  const postingSaldoAwal = handleSubmit(async (values) => {
    if (!canManage || readOnly) return;

    setPosting(true);
    try {
      await sikeuService.saveSaldoAwal(payloadFromValues(values));
      await sikeuService.postSaldoAwal();
      toast.success('Saldo awal berhasil diposting ke jurnal umum');
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal memposting saldo awal'));
      await load();
    } finally {
      setPosting(false);
    }
  });

  const batalkan = async () => {
    setCanceling(true);
    try {
      await sikeuService.cancelSaldoAwal();
      toast.success(isPosted ? 'Posting saldo awal dibatalkan' : 'Draft saldo awal dihapus');
      setConfirmCancel(false);
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal membatalkan saldo awal'));
    } finally {
      setCanceling(false);
    }
  };

  const columns: ColumnDef<(typeof fields)[number]>[] = [
    {
      key: 'akun_id',
      label: 'Akun COA',
      render: (_row, index) => (
        <Controller
          control={control}
          name={`details.${index}.akun_id`}
          render={({ field }) => (
            <div className="min-w-[220px]">
              <AsyncSelect
                loadOptions={loadAkunOptions}
                defaultOptions={coaOptions}
                value={coaOptions.find((option) => option.value === field.value) ?? null}
                onChange={(option: { value?: number } | null) =>
                  field.onChange(Number(option?.value) || 0)
                }
                placeholder="Pilih akun..."
                isDisabled={readOnly}
                error={detailError(index, 'akun_id')}
              />
            </div>
          )}
        />
      ),
    },
    {
      key: 'debet',
      label: 'Debet (Rp)',
      align: 'right',
      render: (_row, index) => (
        <Controller
          control={control}
          name={`details.${index}.debet`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={field.value === 0 ? '' : field.value}
              onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
              onBlur={field.onBlur}
              disabled={readOnly}
              error={detailError(index, 'debet')}
              className="text-right font-mono tabular-nums min-w-[130px]"
              placeholder="0"
            />
          )}
        />
      ),
    },
    {
      key: 'kredit',
      label: 'Kredit (Rp)',
      align: 'right',
      render: (_row, index) => (
        <Controller
          control={control}
          name={`details.${index}.kredit`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={field.value === 0 ? '' : field.value}
              onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
              onBlur={field.onBlur}
              disabled={readOnly}
              error={detailError(index, 'kredit')}
              className="text-right font-mono tabular-nums min-w-[130px]"
              placeholder="0"
            />
          )}
        />
      ),
    },
    {
      key: 'keterangan',
      label: 'Keterangan',
      render: (_row, index) => (
        <Controller
          control={control}
          name={`details.${index}.keterangan`}
          render={({ field }) => (
            <Input
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
              disabled={readOnly}
              error={detailError(index, 'keterangan')}
              className="min-w-[160px]"
              placeholder="Opsional"
            />
          )}
        />
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'center',
      render: (_row, index) => (
        <DropdownMenu
          items={[
            {
              label: 'Hapus baris',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              disabled: readOnly,
              onClick: () => remove(index),
            },
          ]}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <PageHeader
          title="Saldo Awal Akuntansi"
          description="Menetapkan saldo awal neraca setelah migrasi/cut-over sistem."
          breadcrumbs={[
            { label: 'Keuangan', href: '/sikeu' },
            { label: 'Akuntansi', href: '/sikeu/akuntansi' },
            { label: 'Saldo Awal' },
          ]}
        />
        <Card>
          <CardBody className="py-16 text-center text-slate-400 space-y-3">
            <Loader2 size={30} className="animate-spin mx-auto" />
            <p className="font-semibold text-xs">Memuat saldo awal akuntansi...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fade-in pb-6">
      <PageHeader
        title="Saldo Awal Akuntansi"
        description="Tetapkan saldo awal aset, liabilitas, dan ekuitas setelah migrasi. Selisih otomatis diseimbangkan ke ekuitas saldo awal."
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Akuntansi', href: '/sikeu/akuntansi' },
          { label: 'Saldo Awal' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => window.history.back()}
            className="font-bold min-h-[38px] text-xs"
          >
            Kembali
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isPosted ? 'green' : isDraft ? 'amber' : 'gray'} dot>
          {isPosted ? 'Sudah diposting (terkunci)' : isDraft ? 'Draft' : 'Belum diisi'}
        </Badge>
        {saldoAwal?.jurnal?.nomor_jurnal && (
          <span className="text-2xs font-mono text-slate-500">
            Jurnal: {saldoAwal.jurnal.nomor_jurnal}
          </span>
        )}
        {saldoAwal?.periode?.nama_periode && (
          <span className="text-2xs text-slate-500">
            Periode: {saldoAwal.periode.nama_periode}
          </span>
        )}
        {!canManage && (
          <span className="text-2xs font-semibold text-amber-700">
            Anda hanya memiliki akses baca untuk fitur ini.
          </span>
        )}
      </div>

      {isPosted && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <p>
            Saldo awal sudah diposting ke jurnal umum dan terkunci. Untuk mengubahnya, batalkan posting
            terlebih dahulu. Pembatalan hanya bisa dilakukan selama belum ada jurnal lain setelah tanggal saldo awal.
          </p>
        </div>
      )}

      {data?.validasi && !data.validasi.siap_posting && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">
              Cut-off saldo awal belum aman ({data.validasi.jumlah_jurnal_sebelum} jurnal pada/sebelum tanggal saldo awal)
            </p>
            <p>{data.validasi.pesan}</p>
            {data.validasi.tanggal_jurnal_terawal && (
              <p className="font-mono text-2xs">
                Jurnal terawal: {data.validasi.tanggal_jurnal_terawal}
              </p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardBody className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              Hanya akun neraca (aset, liabilitas, ekuitas) yang dapat diisi. Perbedaan total debet dan kredit
              otomatis dibukukan ke akun <strong>{data?.akun_penyeimbang?.kode_akun ?? '301.03'} — {data?.akun_penyeimbang?.nama_akun ?? 'Ekuitas Saldo Awal'}</strong>.
              Tetapkan tanggal saldo awal <strong>setelah</strong> seluruh transaksi lama selesai dimigrasikan agar saldo tidak terhitung dua kali.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tanggal Saldo Awal *"
              type="date"
              {...register('tanggal')}
              disabled={readOnly}
              error={errors.tanggal?.message}
            />
            <Input
              label="Keterangan"
              {...register('keterangan')}
              disabled={readOnly}
              error={errors.keterangan?.message}
              placeholder="cth. Cut-over migrasi data keuangan per 1 Januari 2026"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Rincian Saldo Awal
              </h2>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => append({ ...emptyRow })}
                  className="font-bold text-xs"
                >
                  Tambah Baris
                </Button>
              )}
            </div>

            <DataTable
              columns={columns}
              data={fields}
              keyExtractor={(row) => row.id}
              emptyMessage="Belum ada baris saldo awal. Tambahkan akun terlebih dahulu."
            />

            {typeof errors.details?.message === 'string' && (
              <p className="form-error">{errors.details.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Debet</p>
              <p className="text-xs font-bold font-mono tabular-nums text-slate-900">{formatRupiah(totals.debet)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Kredit</p>
              <p className="text-xs font-bold font-mono tabular-nums text-slate-900">{formatRupiah(totals.kredit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Selisih</p>
              <p className="text-xs font-bold font-mono tabular-nums text-slate-900">{formatRupiah(totals.selisih)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-2xs font-bold uppercase tracking-wider text-amber-700">
                Penyeimbang {data?.akun_penyeimbang?.kode_akun ?? '301.03'}
              </p>
              <p className="text-xs font-bold font-mono tabular-nums text-amber-900">
                {totals.penyeimbangDebet > 0
                  ? `Dr ${formatRupiah(totals.penyeimbangDebet)}`
                  : totals.penyeimbangKredit > 0
                    ? `Cr ${formatRupiah(totals.penyeimbangKredit)}`
                    : formatRupiah(0)}
              </p>
            </div>
            <div className={`rounded-xl border p-3 ${
              Math.abs(totals.totalDebet - totals.totalKredit) < 0.005
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-rose-200 bg-rose-50/70'
            }`}>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Setelah Penyeimbang</p>
              <p className="text-xs font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(totals.totalDebet)} = {formatRupiah(totals.totalKredit)}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 pt-4">
              <div>
                {(isDraft || isPosted) && (
                  <Button
                    type="button"
                    variant="outline-danger"
                    icon={<Ban size={16} />}
                    onClick={() => setConfirmCancel(true)}
                    className="font-bold text-xs"
                  >
                    {isPosted ? 'Batalkan Posting' : 'Hapus Draft'}
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  icon={<Save size={16} />}
                  onClick={() => simpanDraft()}
                  loading={saving}
                  disabled={posting}
                  className="font-bold text-xs"
                >
                  Simpan Draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={<Send size={16} />}
                  onClick={() => postingSaldoAwal()}
                  loading={posting}
                  disabled={saving}
                  className="font-bold text-xs"
                >
                  Posting ke Jurnal
                </Button>
              </div>
            </div>
          )}

          {isPosted && canManage && (
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline-danger"
                icon={<Ban size={16} />}
                onClick={() => setConfirmCancel(true)}
                className="font-bold text-xs"
              >
                Batalkan Posting
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={batalkan}
        isLoading={canceling}
        variant="danger"
        title={isPosted ? 'Batalkan posting saldo awal?' : 'Hapus draft saldo awal?'}
        message={
          isPosted
            ? 'Jurnal saldo awal akan dihapus dan status kembali menjadi draft. Tindakan ini ditolak bila sudah ada jurnal lain setelah tanggal saldo awal atau periodenya sudah ditutup.'
            : 'Seluruh baris draft saldo awal akan dihapus. Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText={isPosted ? 'Ya, Batalkan Posting' : 'Ya, Hapus Draft'}
        cancelText="Batal"
      />
    </div>
  );
}
