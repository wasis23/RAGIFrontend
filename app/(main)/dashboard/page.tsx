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
import { StatCard } from '@/components/ui/StatCard';
import { Hero } from '@/components/ui/Hero';
import { formatDateTime } from '@/lib/utils';
import { moduleService, AppModule } from '@/services/module.service';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  iam: <Lock size={22} />,
  spmb: <UserCheck size={22} />,
  siakad: <GraduationCap size={22} />,
  obe: <Award size={22} />,
  simpi: <FileText size={22} />,
  simanta: <Building size={22} />,
  simpreskul: <Award size={22} />,
  sikeu: <DollarSign size={22} />,
  simpeg: <Users size={22} />,
  lms: <BookOpen size={22} />,
  sinapra: <Activity size={22} />,
  kerjasama: <Users size={22} />,
  upm: <CheckCircle2 size={22} />,
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

  const allowedModules = new Set<string>();
  let hasSuperAccess = false;

  displayUser.roles?.forEach((r: any) => {
    const roleSlug = r.slug || r.role?.slug;
    if (roleSlug === 'admin' || roleSlug === 'superadmin') {
      hasSuperAccess = true;
    }
    const permissions = r.permissions || r.role?.permissions || [];
    permissions.forEach((p: any) => {
      const pMod = p.module || p.permission?.module;
      if (pMod) allowedModules.add(pMod);
    });
  });

  const filteredModules = hasSuperAccess
    ? appModules
    : appModules.filter(m => allowedModules.has(m.code) || m.code === 'iam'); // 'iam' is the base module

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Portal Terintegrasi SSO"
        description="Pusat autentikasi & akses seluruh aplikasi ekosistem universitas"
      />

      <Hero
        badge={
          <span className="flex items-center gap-2">
            <UserTypeBadge type={displayUser.user_type} />
            <StatusBadge active={displayUser.is_active} />
          </span>
        }
        title={`Selamat Datang, ${displayUser.username}! 👋`}
        description="Akun Anda terhubung dengan 10+ modul akademik & administratif. Anda dapat berpindah aplikasi tanpa harus memasukkan password kembali."
        actions={
          <div className="hero-last-login">
            <div className="hero-last-login-label">Login Terakhir</div>
            <div className="hero-last-login-value">{formatDateTime(displayUser.last_login_at || new Date().toISOString())}</div>
            <div className="hero-last-login-status">
              <span className="hero-last-login-dot" />
              Sesi Aktif Aman
            </div>
          </div>
        }
      />

      <div className="kpi-grid">
        <StatCard
          label="Status Keamanan"
          value="Terverifikasi"
          icon={<ShieldCheck size={24} />}
          iconVariant="blue"
          footer="Enkripsi SSL/TLS Active"
        />
        <StatCard
          label="Sesi Aktif"
          value="1 Perangkat"
          icon={<Smartphone size={24} />}
          iconVariant="green"
          footer={
            <Link href="/profile/sessions" className="auth-link-text" style={{ fontSize: '0.8125rem' }}>
              Kelola Sesi →
            </Link>
          }
        />
        <StatCard
          label="Peran (Roles)"
          value={`${displayUser.roles?.length || 1} Role`}
          icon={<UserCheck size={24} />}
          iconVariant="amber"
          footer={displayUser.roles?.[0]?.role?.name || 'Mahasiswa'}
        />
        <StatCard
          label="Modul Tersedia"
          value={`${filteredModules.length} Modul`}
          icon={<GraduationCap size={24} />}
          iconVariant="indigo"
          footer="PDDikti & OBE Compliant"
        />
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold">Aplikasi & Sistem Terintegrasi</h3>
          <p className="text-sm text-slate-500">
            Pilih sistem yang ingin Anda akses dengan Single Sign-On
          </p>
        </div>

        <div className="module-launcher-grid">
          {filteredModules.map((mod) => (
            <div key={mod.id} className="card module-card-body">
              <div className="card-body">
                <div className="module-card-row">
                  <div className="module-card-icon-lg">
                    {MODULE_ICONS[mod.code] || <ExternalLink size={20} />}
                  </div>
                  <span className="badge badge-blue">SSO Ready</span>
                </div>
                <h4 className="mt-4 font-bold">{mod.name}</h4>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {mod.description || `Akses modul ${mod.name} secara langsung menggunakan tiket autentikasi terpusat.`}
                </p>
              </div>
              <div className="card-footer">
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
