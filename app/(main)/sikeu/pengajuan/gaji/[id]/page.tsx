'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Loader2,
  Check,
  Ban,
  BadgeCheck,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  pengajuanOperasionalService,
  type PengajuanOperasional,
} from '@/services/pengajuan-operasional.service';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { formatRupiah, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';
import type { PaginationMeta } from '@/types/api.types';

interface GajiRow {
  id: number;
  nip: string;
  nama: string;
  periode: string;
  gajiBersih: number;
  statusBayar: string;
  tanggalTransfer: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; desc: string }
> = {
  pending_keuangan: {
    label: 'Menunggu Keuangan',
    variant: 'warning',
    desc: 'Pengajuan batch gaji telah diajukan dari SIMPEG dan menunggu verifikasi bagian Keuangan.',
  },
  pending_direktur: {
    label: 'Menunggu Direktur',
    variant: 'warning',
    desc: 'Sudah diverifikasi Keuangan dan menunggu persetujuan akhir dari Direktur.',
  },
  disetujui: {
    label: 'Siap Dicairkan',
    variant: 'success',
    desc: 'Telah disetujui Direktur. Siap dieksekusi pencairan kas dan transfer ke rekening pegawai.',
  },
  dicairkan: {
    label: 'Sudah Dicairkan',
    variant: 'success',
    desc: 'Dana telah dicairkan dari unit kas, jurnal akuntansi terbit, dan slip gaji berstatus Lunas.',
  },
  ditolak: {
    label: 'Ditolak',
    variant: 'danger',
    desc: 'Pengajuan batch gaji ditolak dan status slip gaji di SIMPEG dikembalikan ke draft.',
  },
};

const approvalFormSchema = z.object({
  catatan: z.string().optional(),
});
type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

const pencairanFormSchema = z.object({
  unit_kas_id: z.string().min(1, 'Pilih unit kas sumber pembayaran'),
  tanggal_pencairan: z.string().min(1, 'Tanggal pencairan kas wajib diisi'),
  referensi_eksternal: z.string().optional(),
});
type PencairanFormValues = z.infer<typeof pencairanFormSchema>;

export default function GajiBundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bundle, setBundle] = useState<PengajuanOperasional | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sumber Unit Kas
  const [unitKasList, setUnitKasList] = useState<any[]>([]);

  // Modal Approval (Approve / Reject)
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; aksi: 'approve' | 'reject' }>({
    open: false,
    aksi: 'approve',
  });

  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: { catatan: '' },
  });

  // Modal Pencairan
  const [cairModalOpen, setCairModalOpen] = useState(false);
  const [buktiCair, setBuktiCair] = useState<File | null>(null);

  const pencairanForm = useForm<PencairanFormValues>({
    resolver: zodResolver(pencairanFormSchema),
    defaultValues: {
      unit_kas_id: '',
      tanggal_pencairan: new Date().toISOString().split('T')[0],
      referensi_eksternal: '',
    },
  });

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pengajuanOperasionalService.detail(id);
      setBundle(res.data ?? null);
    } catch {
      toast.error('Gagal memuat detail bundle gaji');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const loadUnitKas = async () => {
      try {
        const res = await sikeuService.getUnitKasList();
        const activeList = Array.isArray(res.data)
          ? res.data.filter((u: any) => u.status !== false)
          : [];
        setUnitKasList(activeList);
        if (activeList.length > 0 && !pencairanForm.getValues('unit_kas_id')) {
          pencairanForm.setValue('unit_kas_id', String(activeList[0].id));
        }
      } catch {
        setUnitKasList([]);
      }
    };
    loadUnitKas();
  }, [pencairanForm]);

  const handleExportXlsx = async () => {
    if (!bundle) return;
    setExporting(true);
    try {
      const exportRows = (bundle.items || []).map((item: any, idx: number) => ({
        'NO': idx + 1,
        'NIP': item.gaji_pegawai?.pegawai?.nip || '-',
        'NAMA PEGAWAI': item.gaji_pegawai?.pegawai?.nama_lengkap || item.nama_barang || '-',
        'PERIODE': item.gaji_pegawai?.periode_bulan_tahun || bundle.sumber_id || '-',
        'GAJI BERSIH (Rp)': Number(item.harga_satuan) || 0,
        'STATUS BAYAR': item.gaji_pegawai?.status_transfer === 'paid'
          ? 'Lunas (Slip Terbit)'
          : item.gaji_pegawai?.status_transfer === 'submitted_to_sikeu'
          ? 'Antrean SIKEU'
          : (item.gaji_pegawai?.status_transfer || '-'),
        'TANGGAL TRANSFER': item.gaji_pegawai?.tanggal_transfer
          ? formatDate(item.gaji_pegawai.tanggal_transfer)
          : '-',
      }));
      await exportToExcel(`bundle-gaji-${bundle.nomor_pengajuan}.xlsx`, [
        { name: 'Daftar Gaji Pegawai', data: exportRows },
      ]);
      toast.success('File XLSX berhasil diunduh.');
    } catch (err: any) {
      toast.error('Gagal mengekspor XLSX: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setExporting(false);
    }
  };

  const handleOpenApproval = (aksi: 'approve' | 'reject') => {
    approvalForm.reset({ catatan: '' });
    setApprovalModal({ open: true, aksi });
  };

  const handleOpenPencairan = () => {
    pencairanForm.reset({
      unit_kas_id: unitKasList.length > 0 ? String(unitKasList[0].id) : '',
      tanggal_pencairan: new Date().toISOString().split('T')[0],
      referensi_eksternal: '',
    });
    setBuktiCair(null);
    setCairModalOpen(true);
  };

  const handleExecuteApproval = approvalForm.handleSubmit(async (data) => {
    if (approvalModal.aksi === 'reject' && !data.catatan?.trim()) {
      approvalForm.setError('catatan', { message: 'Alasan penolakan wajib diisi' });
      return;
    }

    setActing(true);
    try {
      const res = await pengajuanOperasionalService.approve(
        id,
        approvalModal.aksi,
        data.catatan?.trim() || undefined
      );
      toast.success(res.message || 'Status batch gaji berhasil diperbarui');
      setApprovalModal({ open: false, aksi: 'approve' });
      approvalForm.reset();
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses persetujuan');
    } finally {
      setActing(false);
    }
  });

  const handleExecutePencairan = pencairanForm.handleSubmit(async (data) => {
    const selectedKas = unitKasList.find((k) => String(k.id) === String(data.unit_kas_id));
    const saldo = Number(selectedKas?.saldo_saat_ini || 0);
    const nominalCair = Number(bundle?.nominal_diajukan || 0);

    if (nominalCair > saldo) {
      toast.error(
        `Saldo kas (${formatRupiah(saldo)}) tidak mencukupi untuk pembayaran sebesar ${formatRupiah(nominalCair)}`
      );
      return;
    }

    setActing(true);
    try {
      const form = new FormData();
      form.append('unit_kas_id', data.unit_kas_id);
      form.append('nominal_cair', String(nominalCair));
      form.append('tanggal_pencairan', data.tanggal_pencairan);
      if (data.referensi_eksternal?.trim()) {
        form.append('referensi_eksternal', data.referensi_eksternal.trim());
      }
      if (buktiCair) {
        form.append('bukti_pencairan', buktiCair);
      }

      const res = await pengajuanOperasionalService.pencairan(id, form);
      toast.success(res.message || 'Batch gaji berhasil dicairkan! Seluruh slip gaji terbit lunas.');
      setCairModalOpen(false);
      pencairanForm.reset();
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mencairkan batch gaji');
    } finally {
      setActing(false);
    }
  });

  const items = bundle?.items || [];
  const paidCount = items.filter((item: any) => item.gaji_pegawai?.status_transfer === 'paid').length;
  const rows: GajiRow[] = useMemo(() => {
    return items.map((item: any) => ({
      id: item.id,
      nip: item.gaji_pegawai?.pegawai?.nip || '-',
      nama: item.gaji_pegawai?.pegawai?.nama_lengkap || item.nama_barang || '-',
      periode: item.gaji_pegawai?.periode_bulan_tahun || bundle?.sumber_id || '-',
      gajiBersih: Number(item.harga_satuan) || 0,
      statusBayar: item.gaji_pegawai?.status_transfer || '-',
      tanggalTransfer: item.gaji_pegawai?.tanggal_transfer || null,
    }));
  }, [items, bundle?.sumber_id]);

  const totalRows = rows.length;
  const lastPage = Math.max(1, Math.ceil(totalRows / limit));
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRows);
  const pagedRows = useMemo(() => rows.slice(startIndex, endIndex), [rows, startIndex, endIndex]);

  const paginationMeta: PaginationMeta = {
    current_page: page,
    last_page: lastPage,
    per_page: limit,
    total: totalRows,
    from: totalRows > 0 ? startIndex + 1 : 0,
    to: endIndex,
  };

  const columns: ColumnDef<GajiRow>[] = [
    {
      key: 'nama',
      label: 'PEGAWAI',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 text-xs">{row.nama}</div>
          <div className="text-2xs text-slate-500 font-mono">NIP: {row.nip}</div>
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'PERIODE',
      render: (row) => <span className="text-xs text-slate-600 font-mono">{row.periode}</span>,
    },
    {
      key: 'gajiBersih',
      label: 'GAJI BERSIH',
      render: (row) => (
        <span className="font-bold tabular-nums text-xs">{formatRupiah(row.gajiBersih)}</span>
      ),
    },
    {
      key: 'statusBayar',
      label: 'STATUS BAYAR',
      render: (row) => (
        <div className="space-y-0.5">
          <Badge
            variant={
              row.statusBayar === 'paid'
                ? 'success'
                : row.statusBayar === 'submitted_to_sikeu'
                ? 'info'
                : 'secondary'
            }
            className="text-2xs"
          >
            {row.statusBayar === 'paid'
              ? 'Lunas (Slip Terbit)'
              : row.statusBayar === 'submitted_to_sikeu'
              ? 'Antrean SIKEU'
              : row.statusBayar || '-'}
          </Badge>
          {row.tanggalTransfer && (
            <div className="text-2xs text-slate-500 font-mono">{formatDate(row.tanggalTransfer)}</div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Bundle gaji tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/sikeu/pengajuan')}>
          Kembali
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[bundle.status] || {
    label: bundle.status,
    variant: 'secondary' as const,
    desc: '-',
  };

  const currentUnitKasId = pencairanForm.watch('unit_kas_id');
  const selectedKasObj = unitKasList.find((k) => String(k.id) === String(currentUnitKasId));
  const saldoTerpilih = Number(selectedKasObj?.saldo_saat_ini || 0);
  const nominalBatch = Number(bundle.nominal_diajukan || 0);
  const isSaldoKurang = selectedKasObj && nominalBatch > saldoTerpilih;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title={`Bundle Gaji: ${bundle.nomor_pengajuan}`}
        description={`${bundle.judul_pengajuan} — ${items.length} pegawai`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/sikeu/pengajuan">
              <Button
                variant="outline"
                icon={<ArrowLeft size={16} />}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              >
                Kembali
              </Button>
            </Link>

            {/* Aksi Berdasarkan Status Workflow */}
            {bundle.status === 'pending_keuangan' && (
              <>
                <Button
                  variant="danger"
                  icon={<Ban size={16} />}
                  onClick={() => handleOpenApproval('reject')}
                >
                  Tolak Batch
                </Button>
                <Button
                  variant="primary"
                  icon={<Check size={16} />}
                  onClick={() => handleOpenApproval('approve')}
                >
                  Verifikasi & Setujui ke Direktur
                </Button>
              </>
            )}

            {bundle.status === 'pending_direktur' && (
              <>
                <Button
                  variant="danger"
                  icon={<Ban size={16} />}
                  onClick={() => handleOpenApproval('reject')}
                >
                  Tolak Batch
                </Button>
                <Button
                  variant="primary"
                  icon={<BadgeCheck size={16} />}
                  onClick={() => handleOpenApproval('approve')}
                >
                  Setujui Direktur (Final)
                </Button>
              </>
            )}

            {bundle.status === 'disetujui' && (
              <Button
                variant="primary"
                icon={<Wallet size={16} />}
                onClick={handleOpenPencairan}
              >
                Cairkan Batch Gaji
              </Button>
            )}
          </div>
        }
      />

      {/* Banner Status & Keterangan Alur */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
            {bundle.status === 'dicairkan' ? (
              <CheckCircle2 size={24} className="text-emerald-600" />
            ) : bundle.status === 'disetujui' ? (
              <Wallet size={24} className="text-emerald-600" />
            ) : (
              <Clock size={24} className="text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Status Pengajuan:</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">{statusInfo.desc}</p>
            {bundle.catatan_penolakan && (
              <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                <span className="font-semibold">Catatan Penolakan: </span>
                {bundle.catatan_penolakan}
              </div>
            )}
          </div>
        </div>

        {bundle.status === 'dicairkan' && bundle.unit_kas && (
          <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 text-xs space-y-1">
            <div className="text-slate-400 font-medium">Dibayarkan Melalui:</div>
            <div className="font-bold text-slate-800">{bundle.unit_kas.nama_kas}</div>
            {bundle.tanggal_pencairan && (
              <div className="text-slate-500 font-mono">Tgl: {formatDate(bundle.tanggal_pencairan)}</div>
            )}
          </div>
        )}
      </div>

      {/* Ringkasan Metrik Gaji */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Periode Penggajian</div>
          <div className="text-sm font-bold text-slate-900 font-mono">{bundle.sumber_id || '-'}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Total Pegawai</div>
          <div className="text-sm font-bold text-slate-900">{items.length} Orang</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Status Pembayaran Slip</div>
          <div className="text-sm font-bold text-emerald-600">
            {paidCount} / {items.length} Lunas
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Total Gaji Bersih Diajukan</div>
          <div className="text-sm font-bold text-slate-900 tabular-nums">
            {formatRupiah(bundle.nominal_diajukan)}
          </div>
        </div>
      </div>

      {/* Daftar Pegawai */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Rincian Penerima Gaji Pegawai ({items.length} Data)
          </h3>
          <Button
            variant="outline"
            icon={<Download size={16} />}
            loading={exporting}
            disabled={exporting}
            onClick={handleExportXlsx}
          >
            Export XLSX Bank
          </Button>
        </div>

        <DataTable
          data={pagedRows}
          isLoading={false}
          columns={columns}
          meta={paginationMeta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="Belum ada pegawai dalam bundle ini."
        />

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
          <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Mekanisme Terpadu SIMPEG & SIKEU:</p>
            <p className="mt-0.5 opacity-90">
              Saat batch gaji ini dicairkan oleh bagian Keuangan, sistem akan otomatis menerbitkan mutasi kas keluar, membukukan jurnal beban gaji seimbang di modul SIKEU, dan menandai seluruh slip gaji 205 pegawai di modul SIMPEG berstatus <strong>Lunas (Slip Terbit)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Persetujuan / Penolakan */}
      <Modal
        open={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, aksi: 'approve' })}
        title={
          approvalModal.aksi === 'approve'
            ? bundle.status === 'pending_keuangan'
              ? 'Verifikasi & Setujui Pengajuan Gaji'
              : 'Persetujuan Direktur untuk Penggajian'
            : 'Tolak Pengajuan Batch Gaji'
        }
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="secondary"
              onClick={() => setApprovalModal({ open: false, aksi: 'approve' })}
              disabled={acting}
            >
              Batal
            </Button>
            <Button
              variant={approvalModal.aksi === 'approve' ? 'primary' : 'danger'}
              onClick={handleExecuteApproval}
              loading={acting}
            >
              {approvalModal.aksi === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            {approvalModal.aksi === 'approve'
              ? `Anda akan menyetujui pengajuan batch penggajian periode ${bundle.sumber_id} sejumlah ${items.length} pegawai dengan total ${formatRupiah(bundle.nominal_diajukan)}.`
              : `Pengajuan batch penggajian periode ${bundle.sumber_id} akan ditolak. Seluruh slip gaji pegawai terkait di modul SIMPEG akan dikembalikan ke status draft.`}
          </p>

          <Controller
            name="catatan"
            control={approvalForm.control}
            render={({ field, fieldState }) => (
              <Textarea
                {...field}
                label={
                  approvalModal.aksi === 'reject' ? 'Alasan Penolakan (Wajib)' : 'Catatan Persetujuan (Opsional)'
                }
                placeholder={
                  approvalModal.aksi === 'reject'
                    ? 'Masukkan alasan penolakan agar bagian kepegawaian dapat melakukan perbaikan...'
                    : 'Tambahkan catatan jika diperlukan...'
                }
                error={fieldState.error?.message}
                rows={3}
              />
            )}
          />
        </div>
      </Modal>

      {/* Modal Pencairan Kas Batch Gaji */}
      <Modal
        open={cairModalOpen}
        onClose={() => setCairModalOpen(false)}
        title="Pencairan Kas & Pembayaran Penggajian Pegawai"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setCairModalOpen(false)} disabled={acting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleExecutePencairan}
              loading={acting}
              disabled={Boolean(isSaldoKurang || acting)}
            >
              <Wallet size={16} /> Cairkan Sekarang & Lunaskan Slip
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950 space-y-1">
            <div className="text-xs text-emerald-700 font-semibold">Total Nominal yang Akan Dicairkan:</div>
            <div className="text-2xl font-black tabular-nums">{formatRupiah(nominalBatch)}</div>
            <div className="text-xs text-emerald-800">
              Untuk {items.length} orang pegawai pada periode {bundle.sumber_id}.
            </div>
          </div>

          <Controller
            name="unit_kas_id"
            control={pencairanForm.control}
            render={({ field, fieldState }) => (
              <AsyncSelect
                label="Pilih Unit Kas Sumber Pembayaran"
                value={field.value}
                onChange={(val) => field.onChange(val)}
                loadOptions={async (input) => {
                  try {
                    const res = await sikeuService.getUnitKasList();
                    const list = Array.isArray(res.data) ? res.data : [];
                    return list
                      .filter((k: any) => k.status !== false)
                      .filter((k: any) =>
                        !input || k.nama_kas?.toLowerCase().includes(input.toLowerCase())
                      )
                      .map((k: any) => ({
                        value: String(k.id),
                        label: `${k.nama_kas} (${k.kode_kas || '-'}) — Saldo: ${formatRupiah(k.saldo_saat_ini || 0)}`,
                      }));
                  } catch {
                    return [];
                  }
                }}
                error={fieldState.error?.message}
                required
              />
            )}
          />

          {isSaldoKurang && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>
                Saldo unit kas ini ({formatRupiah(saldoTerpilih)}) tidak mencukupi untuk mencairkan gaji sebesar{' '}
                {formatRupiah(nominalBatch)}. Silakan pilih kas lain atau lakukan mutasi top-up kas.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="tanggal_pencairan"
              control={pencairanForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label="Tanggal Pencairan Kas"
                  type="date"
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
            <Controller
              name="referensi_eksternal"
              control={pencairanForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label="Nomor Referensi Bank / Transfer"
                  placeholder="Contoh: REF-PAYROLL-BNI-20260925"
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <Input
            label="Bukti Transfer / Rekap Bank (Opsional)"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setBuktiCair(e.target.files[0]);
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
