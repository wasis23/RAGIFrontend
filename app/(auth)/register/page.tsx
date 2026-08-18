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
    <div className="auth-centered">
      <div className="mb-8">
        <h1 className="auth-heading">Daftar Calon Mahasiswa</h1>
        <p className="auth-subheading" className="mt-2">
          Buat akun untuk memulai pendaftaran SPMB Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-stack">
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

        <Button type="submit" variant="primary" full loading={isLoading} className="mt-2">
          Daftar Akun
        </Button>
      </form>

      <p className="auth-muted-link text-center mt-6 text-sm">
        Sudah punya akun?{' '}
        <Link href="/login" className="auth-link-text">
          Login di sini
        </Link>
      </p>
    </div>
  );
}
