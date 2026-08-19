'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  ExternalLink,
  GraduationCap,
  Users,
  CheckCircle2,
  Lock,
  Activity,
  UserCheck,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { moduleService, AppModule } from '@/services/module.service';

// ── Icon map per modul code ──────────────────────────────────
const MODULE_ICONS: Record<string, React.ReactNode> = {
  iam:       <Lock size={20} />,
  spmb:      <UserCheck size={20} />,
  siakad:    <GraduationCap size={20} />,
  simpeg:    <Users size={20} />,
  sikeu:     <Activity size={20} />,
  lms:       <LayoutGrid size={20} />,
};

const getModuleIcon = (code: string) =>
  MODULE_ICONS[code] ?? <ExternalLink size={20} />;

// ── Account summary items ────────────────────────────────────
interface SummaryItem {
  id: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ReactNode;
  iconVariant: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    moduleService.getAllModules()
      .then(setAppModules)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const displayUser = user || {
    username: 'Pengguna',
    email: 'user@kampus.ac.id',
    user_type: 'mahasiswa',
    is_active: true,
    is_verified: true,
    last_login_at: new Date().toISOString(),
    roles: [],
  };

  // ── Role & module access logic ──────────────────────────
  const allowedModules = new Set<string>();
  let hasSuperAccess = false;

  displayUser.roles?.forEach((r: any) => {
    const slug = r.slug || r.role?.slug;
    if (slug === 'admin' || slug === 'superadmin') hasSuperAccess = true;
    const perms = r.permissions || r.role?.permissions || [];
    perms.forEach((p: any) => {
      const mod = p.module || p.permission?.module;
      if (mod) allowedModules.add(mod);
    });
  });

  const filteredModules = hasSuperAccess
    ? appModules
    : appModules.filter(m => allowedModules.has(m.code) || m.code === 'iam');

  const primaryRole =
    displayUser.roles?.[0]?.role?.name ||
    displayUser.roles?.[0]?.name ||
    'Pengguna';

  const roleCount = displayUser.roles?.length ?? 1;

  // ── Summary items config ──────────────────────────────────
  const summaryItems: SummaryItem[] = [
    {
      id: 'security',
      label: 'Status Keamanan',
      value: 'Terverifikasi',
      sub: 'Enkripsi SSL/TLS Aktif',
      icon: <ShieldCheck size={18} />,
      iconVariant: 'stat-icon-blue',
    },
    {
      id: 'session',
      label: 'Sesi Aktif',
      value: '1 Perangkat',
      sub: (
        <Link href="/profile/sessions" className="db-sub-link">
          Kelola Sesi →
        </Link>
      ),
      icon: <Smartphone size={18} />,
      iconVariant: 'stat-icon-green',
    },
    {
      id: 'roles',
      label: 'Peran (Roles)',
      value: `${roleCount} Role`,
      sub: primaryRole,
      icon: <UserCheck size={18} />,
      iconVariant: 'stat-icon-amber',
    },
    {
      id: 'modules',
      label: 'Modul Tersedia',
      value: `${filteredModules.length} Modul`,
      sub: 'PDDikti & OBE Compliant',
      icon: <GraduationCap size={18} />,
      iconVariant: 'stat-icon-indigo',
    },
  ];

  return (
    <div className="db-page animate-fade-in">

      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Portal Terintegrasi SSO"
        description="Pusat autentikasi & akses seluruh aplikasi ekosistem universitas"
      />

      {/* ── Welcome / Identity Card ─────────────────────── */}
      <div className="db-welcome-card">
        {/* decorative blur circles */}
        <div className="db-welcome-blob db-welcome-blob-1" aria-hidden />
        <div className="db-welcome-blob db-welcome-blob-2" aria-hidden />

        <div className="db-welcome-inner">
          {/* Left: identity */}
          <div className="db-welcome-left">
            <div className="db-welcome-badges">
              <UserTypeBadge type={displayUser.user_type} />
              <StatusBadge active={displayUser.is_active} />
            </div>

            <h2 className="db-welcome-title">
              Selamat Datang, {displayUser.username}! 👋
            </h2>
            <p className="db-welcome-desc">
              Akun Anda terhubung dengan 10+ modul akademik &amp; administratif.
              Anda dapat berpindah aplikasi tanpa harus memasukkan password kembali.
            </p>
          </div>

          {/* Right: last login */}
          <div className="db-last-login">
            <div className="db-last-login-label">Login Terakhir</div>
            <div className="db-last-login-time">
              {formatDateTime(displayUser.last_login_at || new Date().toISOString())}
            </div>
            <div className="db-session-badge">
              <span className="db-session-dot" aria-hidden />
              Sesi Aktif Aman
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Summary Grid ────────────────────────── */}
      <div className="db-summary-grid">
        {summaryItems.map((item) => (
          <div key={item.id} className="db-summary-card card">
            <div className="db-summary-top">
              <span className="db-summary-label">{item.label}</span>
              <div className={`db-summary-icon ${item.iconVariant}`}>
                {item.icon}
              </div>
            </div>
            <div className="db-summary-value">{item.value}</div>
            <div className="db-summary-sub">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Application Access ──────────────────────────── */}
      <section className="db-apps-section">
        <div className="db-apps-header">
          <div>
            <h3 className="db-apps-title">Aplikasi &amp; Sistem Terintegrasi</h3>
            <p className="db-apps-desc">
              Pilih sistem yang ingin Anda akses dengan Single Sign-On
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="db-apps-loading">
            <div className="spinner" style={{ width: 24, height: 24 }} />
            <span>Memuat aplikasi...</span>
          </div>
        ) : filteredModules.length === 0 ? (
          /* Empty state */
          <div className="db-empty-state">
            <div className="db-empty-icon">
              <LayoutGrid size={24} />
            </div>
            <p className="db-empty-title">Belum ada aplikasi tersedia</p>
            <p className="db-empty-desc">
              Belum ada sistem yang dapat diakses oleh akun Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="db-apps-grid">
            {filteredModules.map((mod) => (
              <div key={mod.id} className="db-app-card card">
                <div className="db-app-card-top">
                  <div className="db-app-icon">
                    {getModuleIcon(mod.code)}
                  </div>
                  <span className="badge badge-blue db-app-badge">SSO Ready</span>
                </div>

                <div className="db-app-body">
                  <h4 className="db-app-name">{mod.name}</h4>
                  <p className="db-app-desc">
                    {mod.description ||
                      `Akses modul ${mod.name} menggunakan tiket autentikasi terpusat.`}
                  </p>
                </div>

                <button
                  type="button"
                  className="db-app-cta"
                  onClick={() => {
                    toast.success(`Membuka ${mod.name}…`);
                    window.open(`/${mod.code}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <span>Buka Aplikasi</span>
                  <ArrowRight size={15} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
