'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.register(formData);
      toast.success('Pendaftaran berhasil! Silakan login.');
      router.push('/login');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast.error(firstError[0] || 'Validasi gagal.');
      } else {
        toast.error(error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Daftar Calon Mahasiswa
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Buat akun untuk memulai pendaftaran SPMB Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Input
          label="Username"
          name="username"
          required
          value={formData.username}
          onChange={handleChange}
          placeholder="contoh: budi_2026"
        />
        
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="nama@email.com"
        />

        <Input
          label="Nomor WhatsApp"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="081234567890"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimal 8 karakter"
        />

        <Input
          label="Konfirmasi Password"
          name="password_confirmation"
          type="password"
          required
          value={formData.password_confirmation}
          onChange={handleChange}
          placeholder="Ulangi password"
        />

        <Button type="submit" variant="primary" loading={isLoading} style={{ marginTop: '0.5rem' }}>
          Daftar Akun
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Sudah punya akun?{' '}
        <Link href="/login" style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline' }}>
          Login di sini
        </Link>
      </p>
    </div>
  );
}
