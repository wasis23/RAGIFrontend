import type { ReferralPayoutStatus } from '@/types/sikeu.types';

export const REFERRAL_STATUS_LABEL: Record<
  ReferralPayoutStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }
> = {
  pending_keuangan: { label: 'Menunggu Keuangan', variant: 'warning' },
  pending_direktur: { label: 'Menunggu Direktur', variant: 'warning' },
  disetujui: { label: 'Siap Dicairkan', variant: 'success' },
  dicairkan: { label: 'Dicairkan', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
};

export function referralStatusLabel(status: string): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
} {
  return REFERRAL_STATUS_LABEL[status as ReferralPayoutStatus] ?? { label: status, variant: 'secondary' };
}
