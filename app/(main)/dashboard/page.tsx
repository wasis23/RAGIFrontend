'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  ExternalLink,
  BookOpen,
  DollarSign,
  GraduationCap,
  Award,
  FileText,
  Users,
  Building,
  CheckCircle2,
  Lock,
  Activity,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { moduleService, AppModule } from '@/services/module.service';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  iam: <Lock size={22} color="#3b82f6" />,
  spmb: <UserCheck size={22} color="#10b981" />,
  siakad: <GraduationCap size={22} color="#6366f1" />,
  obe: <Award size={22} color="#f59e0b" />,
  simpi: <FileText size={22} color="#06b6d4" />,
  simanta: <Building size={22} color="#ec4899" />,
  simpreskul: <Award size={22} color="#8b5cf6" />,
  sikeu: <DollarSign size={22} color="#10b981" />,
  simpeg: <Users size={22} color="#3b82f6" />,
  lms: <BookOpen size={22} color="#f97316" />,
  sinapra: <Activity size={22} color="#64748b" />,
  kerjasama: <Users size={22} color="#0284c7" />,
  upm: <CheckCircle2 size={22} color="#16a34a" />,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [appModules, setAppModules] = useState<AppModule[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modules = await moduleService.getAllModules();
        setAppModules(modules);
      } catch (err) {
        console.error('Failed to load modules', err);
      }
    };
    fetchModules();
  }, []);

  const displayUser = user || {
    username: 'Pengguna Terdaftar',
    email: 'user@kampus.ac.id',
    user_type: 'admin',
    is_active: true,
    is_verified: true,
    last_login_at: new Date().toISOString(),
    roles: [{ role: { name: 'Pengguna SSO Active', slug: 'admin' } }],
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Portal Terintegrasi SSO"
        description="Pusat autentikasi & akses seluruh aplikasi ekosistem universitas"
      />

      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 60%, var(--accent-600) 100%)',
          color: 'white',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <UserTypeBadge type={displayUser.user_type} />
              <StatusBadge active={displayUser.is_active} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
              Selamat Datang, {displayUser.username}! 👋
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', maxWidth: 600 }}>
              Akun Anda terhubung dengan 10+ modul akademik & administratif. Anda dapat berpindah aplikasi tanpa harus memasukkan password kembali.
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            minWidth: 220,
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Login Terakhir
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
              {formatDateTime(displayUser.last_login_at || new Date().toISOString())}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#86efac', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              Sesi Aktif Aman
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status Keamanan</span>
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <ShieldCheck size={24} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Terverifikasi</div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>Enkripsi SSL/TLS Active</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sesi Aktif</span>
            <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
              <Smartphone size={24} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>1 Perangkat</div>
          <Link href="/profile/sessions" style={{ fontSize: '0.8125rem', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Kelola Sesi →
          </Link>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Peran (Roles)</span>
            <div className="stat-icon" style={{ background: '#fef9c3', color: '#854d0e' }}>
              <UserCheck size={24} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {displayUser.roles?.length || 1} Role
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {displayUser.roles?.[0]?.role?.name || 'Mahasiswa'}
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Modul Tersedia</span>
            <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
              <GraduationCap size={24} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>10 Modul</div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>PDDikti & OBE Compliant</span>
        </div>
      </div>

      {/* Subsystem Grid Launcher */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Aplikasi & Sistem Terintegrasi</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pilih sistem yang ingin Anda akses dengan Single Sign-On
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {appModules.map((mod) => (
            <div key={mod.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="card-body" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                    background: 'var(--gray-50)', border: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {MODULE_ICONS[mod.code] || <ExternalLink size={20} />}
                  </div>
                  <span className="badge badge-blue">SSO Ready</span>
                </div>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  {mod.name}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {mod.description || `Akses modul ${mod.name} secara langsung menggunakan tiket autentikasi terpusat.`}
                </p>
              </div>
              <div className="card-footer" style={{ background: 'var(--gray-50)', padding: '0.75rem 1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-full"
                  onClick={() => {
                    const targetUrl = `/${mod.code}`;
                    toast.success(`Membuka ${mod.name} di tab baru (Sesi ${displayUser.username} Aktif)`);
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Buka Aplikasi <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
