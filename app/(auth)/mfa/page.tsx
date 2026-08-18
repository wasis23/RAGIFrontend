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
    <div className="otp-row">
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
          className={`otp-input${v ? ' filled' : ''}`}
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
    <div className="animate-fade-in auth-centered">
      <div className="auth-icon-circle">
        <ShieldCheck size={36} color="var(--primary-600)" />
      </div>

      <h1 className="auth-heading">Verifikasi Dua Faktor</h1>
      <p className="auth-subheading mb-2">
        Masukkan kode 6-digit dari aplikasi autentikator Anda
      </p>
      <p className="auth-muted-link text-[0.8125rem] mb-8">
        Google Authenticator · Microsoft Authenticator · Authy
      </p>

      <div className="otp-section">
        <OtpInput value={digits} onChange={setDigits} />
      </div>

      <Button
        full
        size="lg"
        loading={isLoading}
        disabled={!isComplete}
        onClick={handleVerify}
        className="mb-4"
      >
        Verifikasi Kode
      </Button>

      <button
        type="button"
        disabled={countdown > 0}
        onClick={handleResend}
        className="resend-button"
      >
        <RefreshCw size={14} />
        {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Tidak menerima kode?'}
      </button>

      <div className="alert alert-info auth-alert">
        <span>💡</span>
        <span>Kode berlaku selama <strong>30 detik</strong>. Pastikan waktu perangkat Anda sudah sinkron.</span>
      </div>

      <div className="auth-switch">
        <a href="/login" className="auth-muted-link">
          ← Gunakan akun lain
        </a>
      </div>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={<div className="auth-centered auth-muted-link">Memuat...</div>}>
      <MfaForm />
    </Suspense>
  );
}
