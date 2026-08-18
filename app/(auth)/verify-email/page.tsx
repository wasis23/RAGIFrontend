'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';

type VerifyState = 'loading' | 'success' | 'error' | 'no-token';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no-token');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await authService.verifyEmail(token);
        setState('success');
      } catch {
        setState('error');
      }
    })();
  }, [token]);

  const stateConfig = {
    loading: {
      icon: <Loader2 size={40} color="var(--primary-600)" className="animate-spin" />,
      iconClass: 'auth-icon-circle',
      title: 'Memverifikasi Email...',
      desc: 'Harap tunggu, kami sedang memverifikasi alamat email Anda.',
    },
    success: {
      icon: <CheckCircle2 size={40} color="#fff" />,
      iconClass: 'auth-icon-circle auth-icon-success',
      title: 'Email Terverifikasi! 🎉',
      desc: 'Alamat email Anda telah berhasil diverifikasi. Akun Anda kini sepenuhnya aktif.',
    },
    error: {
      icon: <XCircle size={40} color="#fff" />,
      iconClass: 'auth-icon-circle auth-icon-danger',
      title: 'Verifikasi Gagal',
      desc: 'Tautan verifikasi tidak valid atau sudah kadaluarsa. Silakan minta tautan baru.',
    },
    'no-token': {
      icon: <Mail size={40} color="var(--text-muted)" />,
      iconClass: 'auth-icon-circle auth-icon-muted',
      title: 'Token Tidak Ditemukan',
      desc: 'Akses halaman ini melalui tautan yang dikirimkan ke email Anda.',
    },
  };

  const cfg = stateConfig[state];

  return (
    <div className="animate-fade-in auth-centered">
      <div className={cfg.iconClass}>
        {cfg.icon}
      </div>

      <h1 className="auth-heading mb-3">{cfg.title}</h1>
      <p className="auth-subheading leading-7 mb-8">
        {cfg.desc}
      </p>

      {state === 'success' && (
        <div className="auth-actions">
          <Link href="/login">
            <Button full size="lg">Masuk ke Akun</Button>
          </Link>
        </div>
      )}

      {(state === 'error' || state === 'no-token') && (
        <div className="auth-actions">
          <Link href="/forgot-password">
            <Button full variant="secondary">Minta Tautan Baru</Button>
          </Link>
          <Link href="/login" className="auth-muted-link">
            ← Kembali ke Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="auth-centered">
        <Loader2 size={32} className="animate-spin mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
