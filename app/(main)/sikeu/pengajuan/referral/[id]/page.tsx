'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, History, Loader2, Landmark, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { sikeuService } from '@/services/sikeu.service';
import { spmbService } from '@/services/spmb.service';
import { formatRupiah, formatDate } from '@/lib/utils';
import { referralStatusLabel } from '@/lib/referral';
import type { ReferralInvoice } from '@/types/sikeu.types';

function MetadataItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col py-1.5">
      <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      <span className="text-xs font-bold text-slate-800 break-words leading-snug">
        {value || <span className="text-slate-400 font-normal italic text-xs">-</span>}
      </span>
    </div>
  );
}

export default function DetailReferralPencairanPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ReferralInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getReferralInvoiceById(Number(id));
      setData(res?.data ?? null);
    } catch {
      toast.error('Gagal memuat detail invoice referral.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const handleDownloadProof = async () => {
    if (!data) return;
    try {
      setDownloading(true);
      const blob = await spmbService.downloadReferralPayout(data.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bukti-pencairan-referral-${data.nomor_bukti}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh bukti pencairan.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 pb-16 animate-fade-in">
        <PageHeader
          title="Detail Invoice Referral SPMB"
          action={
            <Link href="/sikeu/pengajuan">
              <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">
                Kembali
              </Button>
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center h-56 gap-3 bg-white rounded-xl border border-slate-200 p-8">
          {loading ? <Loader2 size={28} className="animate-spin text-slate-400" /> : <History size={28} className="text-slate-400" />}
          <span className="text-xs font-semibold text-slate-500">
            {loading ? 'Memuat detail invoice referral...' : 'Data invoice referral tidak ditemukan.'}
          </span>
        </div>
      </div>
    );
  }

  const status = referralStatusLabel(data.status);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <PageHeader
        title="Detail Invoice Referral SPMB"
        description={`Bukti pencairan reward referral — ${data.nomor_bukti}`}
        action={
          <Link href="/sikeu/pengajuan">
            <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">
              Kembali
            </Button>
          </Link>
        }
      />

      {/* HEADER CARD */}
      <div className="p-4 md:p-6 rounded-xl bg-white border border-slate-200 border-l-4 border-l-[var(--module-primary)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest block">NOMOR BUKTI</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-mono leading-tight">
            {data.nomor_bukti}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-2 text-slate-600 font-semibold">
              <User size={16} className="text-slate-400 shrink-0" />
              {data.referrer?.name || data.referrer?.username || '-'}
            </span>
            <span className="flex items-center gap-2 text-slate-600 font-semibold">
              <Landmark size={16} className="text-slate-400 shrink-0" />
              {data.nama_bank || '-'} • {data.nomor_rekening || '-'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-2xs font-semibold text-slate-400">
            {data.generated_at ? formatDate(data.generated_at) : '-'}
          </span>
        </div>
      </div>

      {/* INFORMASI INVOICE */}
      <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl">
        <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-100 pb-4 mb-4">
          Informasi Invoice
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <MetadataItem label="Referrer" value={data.referrer?.name || data.referrer?.username || '-'} />
          <MetadataItem label="Total Nominal Bukti" value={formatRupiah(Number(data.total_nominal) || 0)} />
          <MetadataItem label="Jumlah Referral" value={String(data.referral_count ?? data.usages_count ?? 0)} />
          <MetadataItem label="Bank Tujuan" value={data.nama_bank} />
          <MetadataItem label="Nomor Rekening" value={data.nomor_rekening} />
          <MetadataItem label="Pemilik Rekening" value={data.nama_pemilik_rekening} />
          <MetadataItem label="Referensi SIKEU" value={data.sikeu_reference} />
          <MetadataItem label="Ref. Transfer" value={data.nomor_referensi_transfer} />
          <MetadataItem label="Tanggal Dicairkan" value={data.paid_at ? formatDate(data.paid_at) : '-'} />
          <MetadataItem
            label="Approver Keuangan"
            value={data.approver_keuangan ? (data.approver_keuangan.name || data.approver_keuangan.username) : '-'}
          />
          <MetadataItem
            label="Approver Direktur"
            value={data.approver_direktur ? (data.approver_direktur.name || data.approver_direktur.username) : '-'}
          />
          <MetadataItem label="Catatan" value={data.keterangan} />
        </div>
        {data.catatan_penolakan && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-red-500 block mb-1">Catatan Penolakan</span>
            <span className="text-xs font-semibold text-red-800">{data.catatan_penolakan}</span>
          </div>
        )}
      </div>

      {/* RIWAYAT REFERRAL */}
      <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl">
        <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
          <History size={16} /> Riwayat Referral ({data.usages?.length ?? data.usages_count ?? 0})
        </h3>
        {data.usages && data.usages.length > 0 ? (
          <div className="space-y-4">
            {data.usages.map((usage) => (
              <div
                key={usage.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:border-[var(--module-primary)] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{usage.pendaftaran?.nama_lengkap || '-'}</span>
                  <span className="text-2xs text-slate-500 font-mono">
                    {usage.pendaftaran?.no_pendaftaran || '-'} • {usage.referral_code}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xs text-slate-500">{usage.pendaftaran?.gelombang_penerimaan?.nama || '-'}</span>
                  <span className="text-2xs font-semibold text-slate-600">
                    {usage.pendaftaran?.status || usage.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<History size={28} className="text-slate-400" />}
            title="Belum ada riwayat referral"
            description="Bukti ini belum memiliki usage referral yang tercatat."
            className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
          />
        )}
      </div>

      {/* AKSI */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          icon={<Download size={16} />}
          loading={downloading}
          disabled={downloading}
          onClick={handleDownloadProof}
          className="font-bold"
        >
          Unduh Bukti PDF
        </Button>
      </div>
    </div>
  );
}
