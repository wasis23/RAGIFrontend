'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Filter, Check, RotateCcw, Eye, BadgeCheck, Banknote, Ban, Download, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { sikeuService } from '@/services/sikeu.service';
import { spmbService } from '@/services/spmb.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { ReferralInvoice, ReferralPayoutStatus } from '@/types/sikeu.types';

const PAYOUT_STATUS_LABEL: Record<ReferralPayoutStatus, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  dibayar: 'Dibayar',
  ditolak: 'Ditolak',
};

function PayoutStatusBadge({ status }: { status: ReferralPayoutStatus }) {
  const isAccent = status === 'menunggu_verifikasi' || status === 'terverifikasi';
  return (
    <Badge
      className={isAccent ? '' : 'bg-slate-100 text-slate-600 border border-slate-200'}
      style={isAccent ? { backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, white)', color: 'var(--module-primary)', borderColor: 'color-mix(in srgb, var(--module-primary) 35%, white)' } : undefined}
    >
      {PAYOUT_STATUS_LABEL[status] || status}
    </Badge>
  );
}

const paySchema = z.object({
  unit_kas_id: z.number().int().positive('Unit kas wajib dipilih'),
  tanggal_bayar: z.string().optional(),
  nomor_referensi_transfer: z.string().max(100, 'Maksimal 100 karakter').optional(),
  catatan: z.string().max(500, 'Maksimal 500 karakter').optional(),
});

type PayValues = z.infer<typeof paySchema>;

const rejectSchema = z.object({
  catatan: z.string().min(1, 'Catatan penolakan wajib diisi').max(500, 'Maksimal 500 karakter'),
});

type RejectValues = z.infer<typeof rejectSchema>;

export default function ReferralPencairanPage() {
  const [data, setData] = useState<ReferralInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | undefined>(undefined);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  const [detailItem, setDetailItem] = useState<ReferralInvoice | null>(null);
  const [verifyItem, setVerifyItem] = useState<ReferralInvoice | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [payItem, setPayItem] = useState<ReferralInvoice | null>(null);
  const [rejectItem, setRejectItem] = useState<ReferralInvoice | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsForbidden(false);
      const res = await sikeuService.getReferralInvoiceList({
        page,
        per_page: perPage,
        search: appliedFilters.search.trim() || undefined,
        status: appliedFilters.status.trim() || undefined,
      });
      setData(res?.data || []);
      if (res?.meta) {
        setPaginationMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          from: res.meta.from ?? undefined,
          to: res.meta.to ?? undefined,
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      const msg = err?.message || '';
      if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('unauthorized')) {
        setIsForbidden(true);
      } else {
        toast.error(msg || 'Gagal memuat invoice referral');
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadUnitKasOptions = useCallback(async (input: string) => {
    const res = await sikeuService.getUnitKasList();
    const items = res?.data || [];
    return items
      .filter((u: { id: number; nama_kas: string }) =>
        !input || u.nama_kas.toLowerCase().includes(input.toLowerCase())
      )
      .map((u: { id: number; nama_kas: string }) => ({ value: String(u.id), label: u.nama_kas }));
  }, []);

  const {
    control: payControl,
    register: registerPay,
    handleSubmit: handlePaySubmit,
    reset: resetPay,
    formState: { errors: payErrors, isSubmitting: isPaySubmitting },
  } = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { tanggal_bayar: '', nomor_referensi_transfer: '', catatan: '' },
  });

  const {
    register: registerReject,
    handleSubmit: handleRejectSubmit,
    reset: resetReject,
    formState: { errors: rejectErrors, isSubmitting: isRejectSubmitting },
  } = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { catatan: '' },
  });

  const openPay = (row: ReferralInvoice) => {
    setPayItem(row);
    resetPay({ tanggal_bayar: new Date().toISOString().slice(0, 10), nomor_referensi_transfer: '', catatan: '' });
  };

  const openReject = (row: ReferralInvoice) => {
    setRejectItem(row);
    resetReject({ catatan: '' });
  };

  const handleVerify = async () => {
    if (!verifyItem) return;
    setVerifyLoading(true);
    try {
      await sikeuService.verifyReferralInvoice(verifyItem.id);
      toast.success(`Invoice ${verifyItem.nomor_bukti} terverifikasi.`);
      setVerifyItem(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Gagal memverifikasi invoice.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePay = async (values: PayValues) => {
    if (!payItem) return;
    try {
      await sikeuService.payReferralInvoice(payItem.id, {
        unit_kas_id: values.unit_kas_id,
        tanggal_bayar: values.tanggal_bayar || undefined,
        nomor_referensi_transfer: values.nomor_referensi_transfer || undefined,
        catatan: values.catatan || undefined,
      });
      toast.success(`Invoice ${payItem.nomor_bukti} dibayar & tercatat sebagai pengeluaran.`);
      setPayItem(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Gagal membayar invoice.');
    }
  };

  const handleReject = async (values: RejectValues) => {
    if (!rejectItem) return;
    try {
      await sikeuService.rejectReferralInvoice(rejectItem.id, { catatan: values.catatan });
      toast.success(`Invoice ${rejectItem.nomor_bukti} ditolak.`);
      setRejectItem(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Gagal menolak invoice.');
    }
  };

  const handleDownloadProof = async (row: ReferralInvoice) => {
    try {
      const blob = await spmbService.downloadReferralPayout(row.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bukti-pencairan-referral-${row.nomor_bukti}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh bukti pencairan.');
    }
  };

  if (isForbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
        <h1 className="text-4xl font-black text-slate-800">403</h1>
        <h2 className="text-lg font-bold text-slate-700">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Anda tidak memiliki hak akses untuk melihat pencairan referral SPMB.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Pencairan Referral SPMB"
        description="Verifikasi bukti pencairan referral dan catat sebagai pengeluaran kampus."
        action={
          <Button
            variant="outline"
            icon={<Filter size={16} />}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            onClick={() => setShowFilter(true)}
          >
            Filter
          </Button>
        }
      />

      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs">
        <DataTable
          data={data}
          isLoading={loading}
          meta={paginationMeta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setPerPage(l);
            setPage(1);
          }}
          columns={[
            {
              key: 'nomor_bukti',
              label: 'Invoice',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-slate-900 text-xs">{row.nomor_bukti}</span>
                  <span className="text-2xs text-slate-500 flex items-center gap-2">
                    <CalendarDays size={12} /> {row.generated_at ? formatDate(row.generated_at) : '-'}
                  </span>
                </div>
              ),
            },
            {
              key: 'referrer',
              label: 'Referrer',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs">{row.referrer?.name || row.referrer?.username || '-'}</span>
                  <span className="text-2xs text-slate-500">{row.nama_bank || '-'} &bull; {row.nomor_rekening || '-'}</span>
                </div>
              ),
            },
            {
              key: 'total_nominal',
              label: 'Nominal',
              render: (row) => (
                <span className="text-xs font-bold text-slate-800">{formatCurrency(Number(row.total_nominal) || 0)}</span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <PayoutStatusBadge status={row.status} />,
            },
            {
              key: 'actions',
              label: 'Aksi',
              render: (row) => (
                <DropdownMenu
                  items={[
                    { label: 'Detail', icon: <Eye size={16} />, onClick: () => setDetailItem(row) },
                    ...((row.status === 'menunggu_verifikasi' || row.status === 'ditolak')
                      ? [{ label: 'Verifikasi', icon: <BadgeCheck size={16} />, onClick: () => setVerifyItem(row) }]
                      : []),
                    ...((row.status === 'menunggu_verifikasi' || row.status === 'terverifikasi')
                      ? [{ label: 'Bayar', icon: <Banknote size={16} />, onClick: () => openPay(row) }]
                      : []),
                    ...((row.status === 'menunggu_verifikasi' || row.status === 'terverifikasi')
                      ? [{ label: 'Tolak', icon: <Ban size={16} />, variant: 'danger' as const, onClick: () => openReject(row) }]
                      : []),
                  ]}
                />
              ),
            },
          ]}
        />
      </div>

      <Drawer
        position="right"
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Invoice Referral"
        width="400px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              className="w-1/2"
              icon={<RotateCcw size={16} />}
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('');
                setAppliedFilters({ search: '', status: '' });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="w-1/2 font-bold"
              icon={<Check size={16} />}
              onClick={() => {
                setAppliedFilters({ search: filterSearch, status: filterStatus });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="No. bukti / referensi / nama referrer..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
              { value: 'terverifikasi', label: 'Terverifikasi' },
              { value: 'dibayar', label: 'Dibayar' },
              { value: 'ditolak', label: 'Ditolak' },
            ]}
          />
        </div>
      </Drawer>

      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Detail Invoice Referral"
        footer={
          <div className="flex justify-end gap-2 w-full">
            {detailItem && (
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={() => handleDownloadProof(detailItem)}
              >
                Bukti PDF
              </Button>
            )}
            <Button variant="primary" onClick={() => setDetailItem(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs font-medium">No. Bukti</span>
                <span className="font-mono font-bold text-slate-900">{detailItem.nomor_bukti}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs font-medium">Status</span>
                <PayoutStatusBadge status={detailItem.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-2xs font-medium">Referrer</span>
                <span className="font-semibold text-slate-800">{detailItem.referrer?.name || detailItem.referrer?.username || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs font-medium">Nominal</span>
                <span className="font-bold text-slate-900">{formatCurrency(Number(detailItem.total_nominal) || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs font-medium">Bank Tujuan</span>
                <span className="font-semibold text-slate-800">{detailItem.nama_bank || '-'} &bull; {detailItem.nomor_rekening || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs font-medium">Pemilik Rekening</span>
                <span className="font-semibold text-slate-800">{detailItem.nama_pemilik_rekening || '-'}</span>
              </div>
              {detailItem.sikeu_reference && (
                <div>
                  <span className="text-slate-400 block text-2xs font-medium">Referensi SIKEU</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.sikeu_reference}</span>
                </div>
              )}
              {detailItem.catatan_penolakan && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-2xs font-medium">Catatan Penolakan</span>
                  <span className="text-slate-700">{detailItem.catatan_penolakan}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!verifyItem}
        onClose={() => !verifyLoading && setVerifyItem(null)}
        onConfirm={handleVerify}
        isLoading={verifyLoading}
        title="Verifikasi Invoice"
        message={
          <span>
            Verifikasi bukti invoice <strong className="font-mono">{verifyItem?.nomor_bukti}</strong> senilai{' '}
            <strong>{formatCurrency(Number(verifyItem?.total_nominal) || 0)}</strong>?
          </span>
        }
        confirmText="Ya, Verifikasi"
        cancelText="Batal"
      />

      <Modal
        open={!!payItem}
        onClose={() => setPayItem(null)}
        title="Bayar Invoice Referral"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setPayItem(null)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="referral-pay-form"
              variant="primary"
              className="font-bold"
              loading={isPaySubmitting}
              disabled={isPaySubmitting}
              icon={<Banknote size={16} />}
            >
              Bayar & Catat Pengeluaran
            </Button>
          </div>
        }
      >
        {payItem && (
          <form id="referral-pay-form" onSubmit={handlePaySubmit(handlePay)} noValidate className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Invoice</span>
                <span className="font-mono font-bold text-slate-800">{payItem.nomor_bukti}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Penerima</span>
                <span className="font-bold text-slate-800">{payItem.referrer?.name || payItem.referrer?.username || '-'} &bull; {payItem.nama_bank} {payItem.nomor_rekening}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Dibayar</span>
                <span className="font-black text-[var(--module-primary)]">{formatCurrency(Number(payItem.total_nominal) || 0)}</span>
              </div>
            </div>

            <Controller
              control={payControl}
              name="unit_kas_id"
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Kas Sumber Dana"
                  placeholder="Pilih Unit Kas"
                  isClearable
                  defaultOptions
                  loadOptions={loadUnitKasOptions}
                  value={field.value ? String(field.value) : null}
                  error={payErrors.unit_kas_id?.message}
                  onChange={(sel: { value?: string } | null) =>
                    field.onChange(sel?.value ? Number(sel.value) : undefined)
                  }
                />
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Tanggal Bayar"
                type="date"
                error={payErrors.tanggal_bayar?.message}
                {...registerPay('tanggal_bayar')}
              />
              <Input
                label="Ref. Transfer"
                placeholder="No. referensi bank (opsional)"
                error={payErrors.nomor_referensi_transfer?.message}
                {...registerPay('nomor_referensi_transfer')}
              />
            </div>

            <Textarea
              label="Catatan (opsional)"
              placeholder="Catatan pembayaran..."
              maxLength={500}
              error={payErrors.catatan?.message}
              {...registerPay('catatan')}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={!!rejectItem}
        onClose={() => setRejectItem(null)}
        title="Tolak Invoice Referral"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setRejectItem(null)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="referral-reject-form"
              variant="primary"
              className="font-bold"
              loading={isRejectSubmitting}
              disabled={isRejectSubmitting}
              icon={<Ban size={16} />}
            >
              Tolak Invoice
            </Button>
          </div>
        }
      >
        {rejectItem && (
          <form id="referral-reject-form" onSubmit={handleRejectSubmit(handleReject)} noValidate className="space-y-4">
            <p className="text-xs text-slate-600">
              Invoice <strong className="font-mono">{rejectItem.nomor_bukti}</strong> akan ditolak.
              Referral yang ditandai payout ini <strong>tidak dapat diklaim ulang</strong>.
            </p>
            <Textarea
              label="Catatan Penolakan"
              placeholder="Alasan penolakan untuk referrer..."
              required
              maxLength={500}
              error={rejectErrors.catatan?.message}
              {...registerReject('catatan')}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
