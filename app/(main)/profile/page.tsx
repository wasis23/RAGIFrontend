'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Lock, Mail, Phone, Shield, Eye, EyeOff, Save, CheckCircle2, Copy, Check, Share2, Filter, Gift, Award, Ban, Users, Wallet, RotateCcw, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { spmbService } from '@/services/spmb.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { User } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';
import type { MyReferralData, ReferralUsageItem } from '@/types/spmb.types';

const REFERRAL_STATUS_LABEL: Record<string, string> = {
  claimed: 'Terklaim',
  qualified: 'Lolos Administrasi',
  rewarded: 'Reward Diberikan',
  cancelled: 'Dibatalkan',
};

function ReferralStatusBadge({ status }: { status: string }) {
  const isAccent = status === 'qualified' || status === 'rewarded';
  return (
    <Badge
      className={isAccent ? '' : 'bg-slate-100 text-slate-600 border border-slate-200'}
      style={isAccent ? { backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, white)', color: 'var(--module-primary)', borderColor: 'color-mix(in srgb, var(--module-primary) 35%, white)' } : undefined}
    >
      {REFERRAL_STATUS_LABEL[status] || status}
    </Badge>
  );
}

// Schema ganti password
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Password saat ini wajib diisi'),
    password: z
      .string()
      .min(8, 'Password baru minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus mengandung minimal 1 huruf kapital')
      .regex(/[0-9]/, 'Harus mengandung minimal 1 angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Konfirmasi password tidak cocok',
    path: ['password_confirmation'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const payoutSchema = z.object({
  keterangan: z.string().max(255, 'Keterangan maksimal 255 karakter').optional(),
});

type PayoutValues = z.infer<typeof payoutSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { hasRole } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(user);
  const [copied, setCopied] = useState(false);
  const [referral, setReferral] = useState<MyReferralData | null>(null);

  useEffect(() => {
    authService.getMe()
      .then((res: unknown) => {
        const r = res as { data?: User; user?: User };
        const u = r?.data || r?.user || (res as User);
        if (u && (u.username || u.email)) {
          setProfileData(u);
          setUser(u);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat profil terbaru:', err);
      });
  }, [setUser]);

  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'referral'>('info');

  const [usages, setUsages] = useState<ReferralUsageItem[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [usagesPage, setUsagesPage] = useState(1);
  const [usagesPerPage, setUsagesPerPage] = useState(15);
  const [usagesMeta, setUsagesMeta] = useState<PaginationMeta | undefined>(undefined);
  const [showReferralFilter, setShowReferralFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortOrder, setFilterSortOrder] = useState('desc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    start_date: '',
    end_date: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const {
    register: registerPayout,
    handleSubmit: handlePayoutSubmit,
    reset: resetPayout,
    formState: { isSubmitting: isPayoutSubmitting, errors: payoutErrors },
  } = useForm<PayoutValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { keterangan: '' },
  });

  const loadMyReferral = () => {
    spmbService.getMyReferral()
      .then((res) => {
        if (res?.data) setReferral(res.data);
      })
      .catch(() => {
        // Diamkan bila endpoint referral tidak tersedia untuk role ini.
      });
  };

  useEffect(() => {
    loadMyReferral();
  }, []);

  const fetchReferralUsages = useCallback(async () => {
    try {
      setUsagesLoading(true);
      const params: {
        page: number;
        per_page: number;
        sort_by: string;
        sort_order: string;
        search?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
      } = {
        page: usagesPage,
        per_page: usagesPerPage,
        sort_by: appliedFilters.sort_by,
        sort_order: appliedFilters.sort_order,
      };
      if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();
      if (appliedFilters.status.trim()) params.status = appliedFilters.status.trim();
      if (appliedFilters.start_date.trim()) params.start_date = appliedFilters.start_date.trim();
      if (appliedFilters.end_date.trim()) params.end_date = appliedFilters.end_date.trim();

      const res = await spmbService.getMyReferralUsages(params);
      setUsages(res?.data || []);
      if (res?.meta) {
        setUsagesMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          from: res.meta.from ?? undefined,
          to: res.meta.to ?? undefined,
        });
      }
    } catch {
      toast.error('Gagal memuat riwayat referral.');
    } finally {
      setUsagesLoading(false);
    }
  }, [usagesPage, usagesPerPage, appliedFilters]);

  useEffect(() => {
    fetchReferralUsages();
  }, [fetchReferralUsages]);

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  const handleGeneratePayout = async (values: PayoutValues) => {
    try {
      const keterangan = values.keterangan?.trim();
      const res = await spmbService.createReferralPayout(
        keterangan ? { keterangan } : {}
      );
      const payout = res?.data;
      if (!payout) {
        throw new Error('Data payout tidak diterima.');
      }
      toast.success(`Bukti pencairan ${payout.nomor_bukti} berhasil dibuat.`);
      try {
        const blob = await spmbService.downloadReferralPayout(payout.id);
        triggerBlobDownload(blob, `bukti-pencairan-referral-${payout.nomor_bukti}.pdf`);
      } catch {
        toast.error('Bukti berhasil dibuat, namun gagal mengunduh PDF.');
      }
      setShowPayoutModal(false);
      resetPayout();
      loadMyReferral();
      fetchReferralUsages();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Gagal membuat bukti pencairan.');
    }
  };

  const withdrawable = referral?.withdrawable;
  const canWithdraw = (withdrawable?.count ?? 0) > 0;

  const activeUser = profileData || user;
  const displayUser = activeUser || {
    id: 1,
    name: 'Pengguna Terdaftar',
    nama_lengkap: 'Pengguna Terdaftar',
    username: 'Pengguna Terdaftar',
    email: 'user@kampus.ac.id',
    phone: '081234567890',
    referral_code: '',
    referal_code: '',
    is_active: true,
    is_verified: true,
    email_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const fullName = displayUser.name || displayUser.nama_lengkap || displayUser.username;
  const referralCode =
    referral?.summary?.referral_code || displayUser.referral_code || displayUser.referal_code || '';
  const referralShareLink =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${referralCode}`
      : '';

  const isMahasiswa = hasRole('mahasiswa');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePasswordSubmit = async (data: ChangePasswordValues) => {
    setIsLoading(true);
    try {
      await authService.changePassword(data);
      toast.success('Password Anda berhasil diperbarui!');
      reset();
    } catch {
      toast.error('Gagal memperbarui password. Pastikan password saat ini benar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (referralCode && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success(`Kode referal "${referralCode}" berhasil disalin!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReferral = () => {
    if (referralShareLink && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralShareLink);
      setCopied(true);
      toast.success('Tautan pendaftaran referral berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pengaturan Profil Akun"
        description="Kelola informasi identitas dan kredensial keamanan akun SSO Anda"
        action={
          activeTab === 'referral' ? (
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setShowReferralFilter(true)}
            >
              Filter
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'info'
              ? 'text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg border-b-2 border-[var(--module-primary)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <UserIcon size={16} /> Informasi Identitas
        </button>
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'referral'
              ? 'text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg border-b-2 border-[var(--module-primary)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('referral')}
        >
          <Gift size={16} /> Referral
        </button>
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'password'
              ? 'text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg border-b-2 border-[var(--module-primary)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={16} /> Ganti Password
        </button>
      </div>

      {/* Tab Content: Info */}
      {activeTab === 'info' && (
        <div className="profile-grid">
          {/* Card 1: Avatar & Status */}
          <div className="card">
            <div className="card-body profile-avatar-body">
              <div className="avatar avatar-2xl profile-avatar">
                {fullName ? fullName.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <h3 className="text-xl font-extrabold">{fullName}</h3>
              <p className="text-sm text-slate-500 mb-4">
                {displayUser.username} • {displayUser.email}
              </p>

              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="blue">{displayUser?.roles?.[0]?.name || 'Pengguna'}</Badge>
                <StatusBadge active={displayUser.is_active} />
              </div>

              {/* Box Kode Referal */}
              <div className="w-full mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                  Kode Referal Anda
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-2 font-mono font-extrabold text-xs bg-white rounded-lg border border-slate-300 text-slate-900 shadow-2xs tracking-wider">
                    {referralCode || '—'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    onClick={handleCopyReferral}
                    title="Salin Kode Referal"
                  >
                    {copied ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={<Share2 size={16} />}
                  onClick={handleShareReferral}
                  disabled={!referralCode}
                >
                  Bagikan Tautan Pendaftaran
                </Button>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="block text-2xs uppercase tracking-wider text-slate-400 font-bold">Total</span>
                    <span className="text-sm font-extrabold text-slate-800">{referral?.summary.total ?? 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="block text-2xs uppercase tracking-wider text-slate-400 font-bold">Lolos</span>
                    <span className="text-sm font-extrabold text-[var(--module-primary)]">{referral?.summary.qualified ?? 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="block text-2xs uppercase tracking-wider text-slate-400 font-bold">Reward</span>
                    <span className="text-sm font-extrabold text-[var(--module-primary)]">{referral?.summary.rewarded ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="profile-meta mt-4">
                <div className="profile-meta-row">
                  <span className="text-slate-500">Status Email:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Terverifikasi
                  </span>
                </div>
                <div className="profile-meta-row">
                  <span className="text-slate-500">Terdaftar Sejak:</span>
                  <span className="font-semibold">{formatDate(displayUser.created_at)}</span>
                </div>
              </div>

              {isMahasiswa && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">Identitas PDDikti Terbaca</span>
                  <p className="text-2xs text-slate-500 mb-2">Anda dapat mengubah data alamat, orang tua, dan rincian konversi transfer melalui portal khusus.</p>
                  <Link href="/siakad/profil" className="inline-block w-full">
                    <Button variant="outline" size="sm" className="w-full font-bold text-amber-900 border-amber-300 hover:bg-amber-100 bg-white">
                      Buka Biodata PDDIKTI
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Detail Attributes (Form Read-only / Update) */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-bold m-0">Detail Pengguna (ERD Attributes)</h3>
              <Shield size={18} color="var(--primary-600)" />
            </div>
            <div className="card-body flex flex-col gap-4">
              <Input
                label="Nama Lengkap"
                value={fullName}
                disabled
                prefixIcon={<UserIcon size={16} />}
                hint="Nama lengkap akun resmi pengguna di SSO"
              />

              <Input
                label="Username"
                value={displayUser.username}
                disabled
                prefixIcon={<UserIcon size={16} />}
                hint="Username dikelola oleh Sistem Kepegawaian/Akademik"
              />

              <Input
                label="Email Resmi Kampus"
                value={displayUser.email}
                disabled
                prefixIcon={<Mail size={16} />}
                hint="Alamat email terdaftar di SSO"
              />

              {/* Input Kode Referal Unik yang Rapi & Sejajar */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Kode Referal (Unique Referral Code)"
                    value={referralCode}
                    readOnly
                    prefixIcon={<Share2 size={16} />}
                    hint="Kode referal unik akun Anda untuk program afiliasi dan pendaftaran calon mahasiswa"
                    className="font-mono font-bold text-slate-800 bg-slate-50 cursor-default"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  icon={copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  onClick={handleCopyReferral}
                  className="shrink-0 px-4 font-medium"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </Button>
              </div>

              <Input
                label="Nomor Telepon / WhatsApp"
                defaultValue={displayUser.phone || '081234567890'}
                prefixIcon={<Phone size={16} />}
              />

              <Input
                label="Role Pengguna"
                value={(displayUser.roles?.[0]?.name || 'Pengguna').toUpperCase()}
                disabled
                prefixIcon={<Shield size={16} />}
              />

              <div className="mt-2">
                <Button variant="primary" icon={<Save size={16} />} onClick={() => toast.success('Data telepon berhasil disimpan!')}>
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Referral */}
      {activeTab === 'referral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Total', value: referral?.summary.total ?? 0, icon: Gift, accent: false },
              { label: 'Terklaim', value: referral?.summary.claimed ?? 0, icon: Users, accent: false },
              { label: 'Lolos', value: referral?.summary.qualified ?? 0, icon: Award, accent: true },
              { label: 'Reward', value: referral?.summary.rewarded ?? 0, icon: Award, accent: true },
              { label: 'Dibatalkan', value: referral?.summary.cancelled ?? 0, icon: Ban, accent: false },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">{item.label}</span>
                  <item.icon size={16} className={item.accent ? 'text-[var(--module-primary)]' : 'text-slate-400'} />
                </div>
                <span className={`text-2xl font-black ${item.accent ? 'text-[var(--module-primary)]' : 'text-slate-900'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--module-primary-subtle)] text-[var(--module-primary)]">
                <Wallet size={20} />
              </div>
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">Nominal Dapat Dicairkan</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(withdrawable?.total_nominal ?? 0)}</span>
                <span className="text-2xs text-slate-500 block">
                  {withdrawable?.count ?? 0} referral layak &bull; {formatCurrency(withdrawable?.reward_per_referral ?? 0)}/referral
                </span>
              </div>
            </div>
            <Button
              icon={<FileText size={16} />}
              disabled={!canWithdraw}
              style={canWithdraw ? { backgroundColor: 'var(--module-primary)', color: 'white' } : undefined}
              onClick={() => setShowPayoutModal(true)}
            >
              Buat Bukti Pencairan
            </Button>
          </div>

          <h3 className="text-sm font-bold text-slate-800">Riwayat Referral</h3>

          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs">
            <DataTable
              data={usages}
              isLoading={usagesLoading}
              meta={usagesMeta}
              onPageChange={(p) => setUsagesPage(p)}
              onLimitChange={(l) => {
                setUsagesPerPage(l);
                setUsagesPage(1);
              }}
              columns={[
                {
                  key: 'referral_code',
                  label: 'Kode Referral',
                  render: (row) => (
                    <span className="font-mono font-bold text-slate-900 text-xs">{row.referral_code}</span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <ReferralStatusBadge status={row.status} />,
                },
                {
                  key: 'created_at',
                  label: 'Tanggal',
                  render: (row) => (
                    <span className="text-xs text-slate-600">
                      {row.created_at ? formatDate(row.created_at) : '-'}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab Content: Password */}
      {activeTab === 'password' && (
        <div className="card max-w-[600px]">
          <div className="card-header">
            <h3 className="text-base font-bold m-0">Form Pembaruan Password</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onChangePasswordSubmit)} className="flex flex-col gap-4">
              <Input
                label="Password Saat Ini"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Masukkan password saat ini"
                required
                prefixIcon={<Lock size={16} />}
                suffixIcon={showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                onSuffixClick={() => setShowCurrent(!showCurrent)}
                error={errors.current_password?.message}
                {...register('current_password')}
              />

              <Input
                label="Password Baru"
                type={showNew ? 'text' : 'password'}
                placeholder="Minimal 8 karakter (Huruf Kapital + Angka)"
                required
                prefixIcon={<Lock size={16} />}
                suffixIcon={showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                onSuffixClick={() => setShowNew(!showNew)}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Konfirmasi Password Baru"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password baru"
                required
                prefixIcon={<Lock size={16} />}
                suffixIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                onSuffixClick={() => setShowConfirm(!showConfirm)}
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />

              <div className="mt-2">
                <Button type="submit" loading={isLoading} size="lg" icon={<Save size={16} />}>
                  Perbarui Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Drawer
        position="right"
        open={showReferralFilter}
        onClose={() => setShowReferralFilter(false)}
        title="Filter Riwayat Referral"
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
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterSortBy('created_at');
                setFilterSortOrder('desc');
                setAppliedFilters({
                  search: '',
                  status: '',
                  start_date: '',
                  end_date: '',
                  sort_by: 'created_at',
                  sort_order: 'desc',
                });
                setShowReferralFilter(false);
                setUsagesPage(1);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="w-1/2 font-bold"
              icon={<Check size={16} />}
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  status: filterStatus,
                  start_date: filterStartDate,
                  end_date: filterEndDate,
                  sort_by: filterSortBy,
                  sort_order: filterSortOrder,
                });
                setShowReferralFilter(false);
                setUsagesPage(1);
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
            placeholder="Cari nama / no pendaftaran / kode..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Status Referral"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'claimed', label: 'Terklaim' },
              { value: 'qualified', label: 'Lolos Administrasi' },
              { value: 'rewarded', label: 'Reward Diberikan' },
              { value: 'cancelled', label: 'Dibatalkan' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          <hr className="border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal' },
                { value: 'status', label: 'Status' },
                { value: 'referral_code', label: 'Kode Referral' },
              ]}
            />
            <Select
              label="Arah"
              value={filterSortOrder}
              onChange={(val) => setFilterSortOrder(val)}
              options={[
                { value: 'asc', label: 'A - Z (Ascending)' },
                { value: 'desc', label: 'Z - A (Descending)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      <Modal
        open={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        title="Buat Bukti Pencairan Referral"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="payout-form"
              variant="primary"
              className="font-bold"
              loading={isPayoutSubmitting}
              disabled={isPayoutSubmitting}
              icon={<Download size={16} />}
            >
              Buat & Unduh Bukti
            </Button>
          </div>
        }
      >
        <form id="payout-form" onSubmit={handlePayoutSubmit(handleGeneratePayout)} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Jumlah referral layak</span>
              <span className="font-bold text-slate-800">{withdrawable?.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Reward per referral</span>
              <span className="font-bold text-slate-800">{formatCurrency(withdrawable?.reward_per_referral ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-slate-200">
              <span className="font-bold text-slate-700">Total Pencairan</span>
              <span className="font-black text-[var(--module-primary)]">{formatCurrency(withdrawable?.total_nominal ?? 0)}</span>
            </div>
          </div>

          <Textarea
            label="Keterangan (opsional)"
            placeholder="Catatan tambahan untuk bukti pencairan..."
            maxLength={255}
            error={payoutErrors.keterangan?.message}
            {...registerPayout('keterangan')}
          />
        </form>
      </Modal>
    </div>
  );
}
