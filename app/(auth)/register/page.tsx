'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { registerAndLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 33;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength += 33;
    if (pass.match(/[0-9]/) && pass.match(/[^a-zA-Z0-9]/)) strength += 34;
    return strength;
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    
    setIsLoading(true);
    try {
      await registerAndLogin(formData, '/dashboard');
    } catch (error: any) {
      // Catch blok dari registerAndLogin akan menangani toast error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[32px] sm:text-[36px] font-[800] text-slate-900 tracking-tight leading-[1.15] mb-3">
          Daftar Calon Mahasiswa
        </h1>
        <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
          Buat akun untuk memulai proses pendaftaran SPMB Anda.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          name="username"
          required
          value={formData.username}
          onChange={handleChange}
          placeholder="contoh: budi_2026"
          className="h-12 bg-transparent border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-[10px] transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
        />
        
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="nama@email.com"
          className="h-12 bg-transparent border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-[10px] transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
        />

        <Input
          label="Nomor WhatsApp"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="081234567890"
          hint="Gunakan nomor WhatsApp yang aktif."
          className="h-12 bg-transparent border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-[10px] transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
        />

        <div className="pt-2">
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimal 8 karakter"
            suffixIcon={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            className="h-12 bg-transparent border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-[10px] transition-all text-[15px] text-slate-800 placeholder:text-slate-400 pr-10"
          />
          
          {/* Password Strength Indicator */}
          {formData.password.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full transition-all duration-300 ${strength >= 33 ? 'bg-rose-500 w-1/3' : 'w-0'}`} />
                <div className={`h-full transition-all duration-300 ${strength >= 66 ? 'bg-amber-500 w-1/3' : 'w-0'}`} />
                <div className={`h-full transition-all duration-300 ${strength >= 100 ? 'bg-emerald-500 w-1/3' : 'w-0'}`} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-14 text-right">
                {strength < 33 ? 'Lemah' : strength < 100 ? 'Sedang' : 'Kuat'}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Konfirmasi Password"
          name="password_confirmation"
          type={showConfirmPassword ? "text" : "password"}
          required
          value={formData.password_confirmation}
          onChange={handleChange}
          placeholder="Ulangi password"
          suffixIcon={
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          className="h-12 bg-transparent border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-[10px] transition-all text-[15px] text-slate-800 placeholder:text-slate-400 pr-10"
        />

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 text-[15px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[10px] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Daftar Akun</span>
            )}
          </Button>
        </div>
      </form>

      {/* Footer Link */}
      <div className="mt-8 text-[14px] text-slate-500 text-center sm:text-left">
        Sudah punya akun?{' '}
        <Link 
          href="/login" 
          className="text-[#2563EB] font-medium hover:text-[#1D4ED8] hover:underline underline-offset-4 transition-colors"
        >
          Login di sini
        </Link>
      </div>
    </div>
  );
}
