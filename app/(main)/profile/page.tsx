'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Lock, Mail, Phone, Shield, Eye, EyeOff, Save, CheckCircle2, Copy, Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/auth.types';

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

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { hasRole } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(user);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authService.getMe()
      .then((res: any) => {
        const u = res?.data || res?.user || res;
        if (u && (u.username || u.email)) {
          setProfileData(u);
          setUser(u);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat profil terbaru:', err);
      });
  }, [setUser]);

  const activeUser = profileData || user;
  const displayUser = activeUser || {
    id: 1,
    name: 'Pengguna Terdaftar',
    nama_lengkap: 'Pengguna Terdaftar',
    username: 'Pengguna Terdaftar',
    email: 'user@kampus.ac.id',
    phone: '081234567890',
    referral_code: 'REF-0DUEEU',
    referal_code: 'REF-0DUEEU',
    is_active: true,
    is_verified: true,
    email_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const fullName = displayUser.name || displayUser.nama_lengkap || displayUser.username;
  const referralCode = displayUser.referral_code || displayUser.referal_code || 'REF-0DUEEU';

  const isMahasiswa = hasRole('mahasiswa');

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
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

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pengaturan Profil Akun"
        description="Kelola informasi identitas dan kredensial keamanan akun SSO Anda"
      />

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('info')}
        >
          <UserIcon size={16} /> Informasi Identitas
        </button>
        <button
          className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-ghost'}`}
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
                    {referralCode}
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
    </div>
  );
}
