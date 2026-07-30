'use client';

import { useState, useRef, KeyboardEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';

// ── 6-digit OTP Input ────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value]; next[idx] = ''; onChange(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value]; next[idx] = ch; onChange(next);
    if (ch && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...value];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
      {value.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          style={{
            width: 52, height: 60, textAlign: 'center',
            fontSize: '1.5rem', fontWeight: 700,
            border: `2px solid ${v ? 'var(--primary-500)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            background: v ? 'var(--primary-50)' : 'white',
            color: 'var(--text-primary)',
            transition: 'all var(--transition-fast)',
            caretColor: 'var(--primary-600)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary-500)')}
          onBlur={(e) => (e.target.style.borderColor = e.target.value ? 'var(--primary-500)' : 'var(--border-light)')}
        />
      ))}
    </div>
  );
}

function MfaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number(searchParams.get('user_id'));
  const { setAuth, mfa_user_id } = useAuthStore();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const code = digits.join('');
  const isComplete = code.length === 6;

  const handleVerify = async () => {
    if (!isComplete) { toast.error('Masukkan 6 digit kode terlebih dahulu.'); return; }
    const uid = userId || mfa_user_id;
    if (!uid) { toast.error('Sesi tidak valid. Silakan login ulang.'); router.push('/login'); return; }

    setIsLoading(true);
    try {
      const res = await authService.verifyMfa({ code, user_id: uid });
      if (res?.data) {
        setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
        toast.success('Verifikasi berhasil!');
        router.push('/dashboard');
      }
    } catch {
      toast.error('Kode tidak valid atau sudah kadaluarsa.');
      setDigits(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend countdown
  const handleResend = () => {
    setCountdown(60);
    toast.success('Kode baru telah dikirim!');
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
        border: '2px solid var(--primary-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
      }}>
        <ShieldCheck size={36} color="var(--primary-600)" />
      </div>

      <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Verifikasi Dua Faktor
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
        Masukkan kode 6-digit dari aplikasi autentikator Anda
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '2rem' }}>
        Google Authenticator · Microsoft Authenticator · Authy
      </p>

      {/* OTP Input */}
      <div style={{ marginBottom: '1.75rem' }}>
        <OtpInput value={digits} onChange={setDigits} />
      </div>

      {/* Verify Button */}
      <Button
        full
        size="lg"
        loading={isLoading}
        disabled={!isComplete}
        onClick={handleVerify}
        style={{ marginBottom: '1rem' }}
      >
        Verifikasi Kode
      </Button>

      {/* Resend */}
      <button
        type="button"
        disabled={countdown > 0}
        onClick={handleResend}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          margin: '0 auto', fontSize: '0.875rem',
          color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary-600)',
          fontWeight: 600, background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer',
        }}
      >
        <RefreshCw size={14} />
        {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Tidak menerima kode?'}
      </button>

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
        <span>💡</span>
        <span>Kode berlaku selama <strong>30 detik</strong>. Pastikan waktu perangkat Anda sudah sinkron.</span>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Gunakan akun lain
        </a>
      </div>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>}>
      <MfaForm />
    </Suspense>
  );
}
