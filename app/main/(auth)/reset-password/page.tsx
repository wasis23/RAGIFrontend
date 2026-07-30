'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
      .regex(/[0-9]/, 'Harus mengandung angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min. 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf kapital', ok: /[A-Z]/.test(password) },
    { label: 'Angka', ok: /[0-9]/.test(password) },
    { label: 'Karakter khusus', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const labels = ['Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];

  if (!password) return null;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: '0.5rem' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i < score ? colors[score - 1] : 'var(--gray-200)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: '0.75rem', color: c.ok ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{c.ok ? '✓' : '○'}</span> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const password = watch('password', '');

  const onSubmit = async (data: FormValues) => {
    if (!token) { toast.error('Token reset tidak valid.'); return; }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, ...data });
      setIsSuccess(true);
    } catch {
      toast.error('Gagal reset password. Token mungkin sudah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="alert alert-danger">
        <span>⚠️</span>
        <span>Token reset tidak ditemukan. Silakan <Link href="/forgot-password" style={{ fontWeight: 700 }}>kirim ulang email</Link>.</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="animate-bounce-in" style={{ textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#f0fdf4', border: '2px solid #bbf7d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
        }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Password Diperbarui!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
          Password Anda berhasil diperbarui. Silakan login dengan password baru Anda.
        </p>
        <Button full size="lg" onClick={() => router.push('/login')}>
          Masuk Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
        }}>
          <ShieldCheck size={24} color="var(--primary-600)" />
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reset Password</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Buat password baru yang kuat untuk akun kampus Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div className="form-group">
          <Input
            id="reset-password"
            label="Password Baru"
            type={showPw ? 'text' : 'password'}
            placeholder="Minimal 8 karakter"
            required
            prefixIcon={<Lock size={16} />}
            suffixIcon={showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            onSuffixClick={() => setShowPw(!showPw)}
            error={errors.password?.message}
            autoFocus
            {...register('password')}
          />
          <PasswordStrength password={password} />
        </div>

        <Input
          id="reset-password-confirm"
          label="Konfirmasi Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Ulangi password baru"
          required
          prefixIcon={<Lock size={16} />}
          suffixIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          onSuffixClick={() => setShowConfirm(!showConfirm)}
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" full size="lg" loading={isLoading} style={{ marginTop: '0.25rem' }}>
          Simpan Password Baru
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
