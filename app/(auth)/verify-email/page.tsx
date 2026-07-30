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
      bg: 'var(--primary-50)', border: 'var(--primary-200)',
      title: 'Memverifikasi Email...',
      desc: 'Harap tunggu, kami sedang memverifikasi alamat email Anda.',
    },
    success: {
      icon: <CheckCircle2 size={40} color="#16a34a" />,
      bg: '#f0fdf4', border: '#bbf7d0',
      title: 'Email Terverifikasi! 🎉',
      desc: 'Alamat email Anda telah berhasil diverifikasi. Akun Anda kini sepenuhnya aktif.',
    },
    error: {
      icon: <XCircle size={40} color="#dc2626" />,
      bg: '#fef2f2', border: '#fecaca',
      title: 'Verifikasi Gagal',
      desc: 'Tautan verifikasi tidak valid atau sudah kadaluarsa. Silakan minta tautan baru.',
    },
    'no-token': {
      icon: <Mail size={40} color="var(--text-muted)" />,
      bg: 'var(--gray-100)', border: 'var(--border-light)',
      title: 'Token Tidak Ditemukan',
      desc: 'Akses halaman ini melalui tautan yang dikirimkan ke email Anda.',
    },
  };

  const cfg = stateConfig[state];

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: cfg.bg, border: `2px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
      }}>
        {cfg.icon}
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>{cfg.title}</h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.9375rem' }}>
        {cfg.desc}
      </p>

      {state === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/login">
            <Button full size="lg">Masuk ke Akun</Button>
          </Link>
        </div>
      )}

      {(state === 'error' || state === 'no-token') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/forgot-password">
            <Button full variant="secondary">Minta Tautan Baru</Button>
          </Link>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
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
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
