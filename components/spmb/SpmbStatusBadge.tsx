'use client';

import React from 'react';
import { FileText, Clock, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface StatusConfig {
  label: string;
  variant: 'gray' | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'cyan';
  icon: any;
  description: string;
}

export const SPMB_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    variant: 'gray',
    icon: FileText,
    description: 'Pendaftaran belum dikirim atau dalam tahap pengisian awal.',
  },
  submitted: {
    label: 'Submitted (Menunggu Verifikasi)',
    variant: 'blue',
    icon: Clock,
    description: 'Berkas dan formulir telah dikirim, menunggu verifikasi berkas oleh admin.',
  },
  verified: {
    label: 'Verified (Terverifikasi)',
    variant: 'purple',
    icon: CheckCircle2,
    description: 'Seluruh berkas pendaftaran telah diperiksa dan dinyatakan valid.',
  },
  lulus_administrasi: {
    label: 'Lulus Administrasi',
    variant: 'green',
    icon: ShieldCheck,
    description: 'Pendaftar dinyatakan LULUS seleksi berkas dan berhak lanjut ke tahap berikutnya.',
  },
  gagal_administrasi: {
    label: 'Gagal Administrasi',
    variant: 'red',
    icon: XCircle,
    description: 'Pendaftar TIDAK LULUS verifikasi administrasi. Catatan verifikasi wajib diisi.',
  },
};

export function SpmbStatusBadge({ status }: { status: string }) {
  const config = SPMB_STATUS_CONFIG[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    variant: 'gray' as const,
    icon: FileText,
    description: '',
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full shadow-2xs">
      <Icon size={14} className="shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}

export function SpmbPaymentBadge({ status }: { status?: string }) {
  const isPaid = status === 'lunas';
  return (
    <Badge variant={isPaid ? 'green' : 'yellow'} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-2xs font-extrabold rounded-full border border-slate-200 shadow-2xs">
      {isPaid ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Clock size={12} className="text-amber-600" />}
      <span>{isPaid ? 'Bayar: Lunas' : 'Bayar: Belum Lunas'}</span>
    </Badge>
  );
}
