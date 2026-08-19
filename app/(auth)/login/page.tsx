'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identitas login wajib diisi')
    .max(255, 'Maksimal 255 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
  remember_me: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, is_loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember_me: false },
  });

  const onSubmit = (data: LoginFormValues) => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    login({
      identifier: data.identifier,
      password: data.password,
      remember_me: data.remember_me,
    }, redirect);
  };

  return (
    <div className="login-page animate-fade-in">
      {/* Header */}
      <div className="login-header">
        <h1 className="login-title">Selamat datang kembali</h1>
        <p className="login-subtitle">
          Lanjutkan dengan Google atau masukkan detail akun Anda.
        </p>
      </div>

      {/* Google SSO Button */}
      <button
        type="button"
        className="btn-sso-google"
        id="btn-oauth-google"
        onClick={() => {
          toast('Silakan login menggunakan Email & Password resmi terdaftar di database backend.', { icon: '🔑' });
        }}
      >
        <GoogleIcon />
        <span>Masuk dengan Google</span>
      </button>

      {/* Divider */}
      <div className="login-divider">
        <span className="login-divider-line" />
        <span className="login-divider-text">atau</span>
        <span className="login-divider-line" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
        {/* Email */}
        <div className="login-field">
          <label htmlFor="login-identifier" className="login-label">Email / Username / NIM / NIDN</label>
          <input
            id="login-identifier"
            type="text"
            placeholder="Masukkan Email, Username, NIM, atau NIDN"
            autoComplete="username"
            className={`login-input${errors.identifier ? ' login-input-error' : ''}`}
            {...register('identifier')}
          />
          {errors.identifier && (
            <span className="login-error-msg">{errors.identifier.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="login-field">
          <label htmlFor="login-password" className="login-label">Password</label>
          <div className="login-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password Anda"
              autoComplete="current-password"
              className={`login-input${errors.password ? ' login-input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="login-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <span className="login-error-msg">{errors.password.message}</span>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="login-meta">
          <label className="login-remember">
            <input
              type="checkbox"
              className="login-checkbox"
              id="remember-me"
              {...register('remember_me')}
            />
            <span>Ingat selama 30 hari</span>
          </label>
          <Link href="/forgot-password" className="login-forgot">
            Lupa password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="btn-login"
          className="btn-login-submit"
          disabled={is_loading}
        >
          {is_loading ? (
            <span className="login-spinner" />
          ) : null}
          {is_loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      {/* Footer */}
        <p className="login-footer-text">
          Belum punya akun?{' '}
          <Link href="/register" className="login-footer-link">
            Daftar Calon Mahasiswa SPMB
          </Link>
          <br />
          Mengalami kendala? <a href="#" className="login-footer-link">Hubungi Helpdesk</a>
        </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
