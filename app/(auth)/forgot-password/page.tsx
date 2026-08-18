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
      <div className="animate-bounce-in auth-centered">
        <div className="auth-icon-circle">
          <CheckCircle2 size={36} color="var(--primary-600)" />
        </div>
        <h1 className="auth-heading">Email Terkirim!</h1>
        <p className="auth-subheading leading-7 mb-2">
          Kami telah mengirimkan tautan reset password ke:
        </p>
        <p className="auth-link-text mb-6 text-[0.9375rem]">
          {sentEmail}
        </p>
        <div className="alert alert-info text-left mb-6">
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
        <div className="mt-4">
          <Link href="/login" className="auth-link-text text-sm">
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
        className="auth-back-link"
      >
        <ArrowLeft size={16} /> Kembali ke Login
      </Link>

      <div className="mb-8">
        <div className="auth-icon-circle-sm">
          <Mail size={24} color="var(--primary-600)" />
        </div>
        <h1 className="auth-heading">Lupa Password?</h1>
        <p className="auth-subheading">
          Masukkan email akun kampus Anda. Kami akan mengirimkan tautan untuk mereset password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-stack">
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
