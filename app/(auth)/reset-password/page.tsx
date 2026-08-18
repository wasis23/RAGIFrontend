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
  const colors = ['var(--danger)', 'var(--warning)', 'var(--primary-500)', 'var(--success)'];
  const labels = ['Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`password-strength-bar${i < score ? ` filled` : ''}`}
            style={{ background: i < score ? colors[score - 1] : undefined }} />
        ))}
      </div>
      <div className="password-strength-meta">
        <div className="password-strength-checks">
          {checks.map((c, i) => (
            <span key={i} className={`password-strength-check${c.ok ? ' ok' : ''}`}>
              <span>{c.ok ? '✓' : '○'}</span> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="password-strength-label" style={{ color: colors[score - 1] }}>
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
        <span>Token reset tidak ditemukan. Silakan <Link href="/forgot-password" className="font-bold">kirim ulang email</Link>.</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="animate-bounce-in auth-centered">
        <div className="auth-icon-circle auth-icon-success">
          <CheckCircle2 size={36} color="#fff" />
        </div>
        <h1 className="auth-heading">Password Diperbarui!</h1>
        <p className="auth-subheading mb-8">
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
      <div className="mb-8">
        <div className="auth-icon-circle-sm">
          <ShieldCheck size={24} color="var(--primary-600)" />
        </div>
        <h1 className="auth-heading">Reset Password</h1>
        <p className="auth-subheading">
          Buat password baru yang kuat untuk akun kampus Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-stack">
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

        <Button type="submit" full size="lg" loading={isLoading} className="mt-1">
          Simpan Password Baru
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center auth-muted-link">Memuat...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
