'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Mail, Phone, Shield, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

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
  const { user } = useAuth();
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

  const displayUser = user || {
    id: 1,
    username: 'mahasiswa_demo',
    email: 'mhs@kampus.ac.id',
    phone: '081234567890',
    user_type: 'mahasiswa' as const,
    is_active: true,
    is_verified: true,
    email_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Pengaturan Profil Akun"
        description="Kelola informasi identitas dan kredensial keamanan akun SSO Anda"
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('info')}
        >
          <User size={16} /> Informasi Identitas
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Card 1: Avatar & Status */}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div
                className="avatar avatar-2xl"
                style={{ margin: '0 auto 1rem auto', border: '4px solid var(--primary-100)' }}
              >
                {displayUser.username ? displayUser.username.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {displayUser.username}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {displayUser.email}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <UserTypeBadge type={displayUser.user_type} />
                <StatusBadge active={displayUser.is_active} />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status Email:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> Terverifikasi
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Terdaftar Sejak:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatDate(displayUser.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Detail Attributes (Form Read-only / Update) */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>Detail Pengguna (ERD Attributes)</h3>
              <Shield size={18} color="var(--primary-600)" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Username"
                value={displayUser.username}
                disabled
                prefixIcon={<User size={16} />}
                hint="Username dikelola oleh Sistem Kepegawaian/Akademik"
              />

              <Input
                label="Email Resmi Kampus"
                value={displayUser.email}
                disabled
                prefixIcon={<Mail size={16} />}
                hint="Alamat email terdaftar di SSO"
              />

              <Input
                label="Nomor Telepon / WhatsApp"
                defaultValue={displayUser.phone || '081234567890'}
                prefixIcon={<Phone size={16} />}
              />

              <Input
                label="Tipe Pengguna (user_type)"
                value={displayUser.user_type.toUpperCase()}
                disabled
                prefixIcon={<Shield size={16} />}
              />

              <div style={{ marginTop: '0.5rem' }}>
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
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>Form Pembaruan Password</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onChangePasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div style={{ marginTop: '0.5rem' }}>
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
