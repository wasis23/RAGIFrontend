'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setSentEmail(data.email);
      setIsSuccess(true);
    } catch {
      toast.error('Gagal mengirim email. Pastikan email terdaftar di sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-bounce-in" style={{ textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary-50)', border: '2px solid var(--primary-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle2 size={36} color="var(--primary-600)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Email Terkirim!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
          Kami telah mengirimkan tautan reset password ke:
        </p>
        <p style={{ fontWeight: 700, color: 'var(--primary-700)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          {sentEmail}
        </p>
        <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <span>💡</span>
          <span>Periksa folder <strong>Spam</strong> jika email tidak masuk dalam 5 menit. Tautan berlaku selama <strong>60 menit</strong>.</span>
        </div>
        <Button
          variant="secondary"
          full
          onClick={() => setIsSuccess(false)}
        >
          Kirim Ulang Email
        </Button>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/login"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1.75rem', fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Kembali ke Login
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
        }}>
          <Mail size={24} color="var(--primary-600)" />
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Lupa Password?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Masukkan email akun kampus Anda. Kami akan mengirimkan tautan untuk mereset password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Input
          id="forgot-email"
          label="Email Kampus"
          type="email"
          placeholder="nama@kampus.ac.id"
          required
          prefixIcon={<Mail size={16} />}
          error={errors.email?.message}
          autoFocus
          autoComplete="email"
          {...register('email')}
        />

        <Button
          type="submit"
          full
          size="lg"
          loading={isLoading}
          icon={<Send size={16} />}
        >
          Kirim Tautan Reset
        </Button>
      </form>
    </div>
  );
}
