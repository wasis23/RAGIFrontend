'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  Smartphone,
  Users,
  ShieldAlert,
  Key,
  Lock,
  UserCheck,
  Activity,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { SYSTEM_MODULES } from '@/lib/constants';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user, isAdmin } = useAuth();

  const isMainActive = (path: string) => pathname === path;

  return (
    <aside className={`sidebar ${sidebar_open ? '' : 'sidebar-collapsed'}`}>
      {/* Brand */}
      <div className="sidebar-brand" style={{ justifyContent: sidebar_open ? 'space-between' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="sidebar-logo">
            <GraduationCap size={22} color="white" />
          </div>
          {sidebar_open && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                SSO Campus
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                Auth Center v1.0
              </div>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-icon btn-sm hide-mobile"
          style={{ color: 'rgba(255,255,255,0.5)', padding: 4 }}
          title={sidebar_open ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
        >
          {sidebar_open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {/* Main Section */}
        <div className="sidebar-section">
          {sidebar_open && <div className="sidebar-section-label">Utama</div>}
          <Link
            href="/dashboard"
            className={`sidebar-item ${isMainActive('/dashboard') ? 'active' : ''}`}
            title="Dashboard"
          >
            <LayoutDashboard className="sidebar-item-icon" />
            {sidebar_open && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Profile & Security Section */}
        <div className="sidebar-section">
          {sidebar_open && <div className="sidebar-section-label">Akun & Keamanan</div>}
          <Link
            href="/profile"
            className={`sidebar-item ${isMainActive('/profile') ? 'active' : ''}`}
            title="Profil Saya"
          >
            <User className="sidebar-item-icon" />
            {sidebar_open && <span>Profil Saya</span>}
          </Link>
          <Link
            href="/profile/sessions"
            className={`sidebar-item ${isMainActive('/profile/sessions') ? 'active' : ''}`}
            title="Sesi Aktif"
          >
            <Smartphone className="sidebar-item-icon" />
            {sidebar_open && <span>Sesi Perangkat</span>}
          </Link>
          <Link
            href="/profile/mfa"
            className={`sidebar-item ${isMainActive('/profile/mfa') ? 'active' : ''}`}
            title="2FA / MFA"
          >
            <ShieldCheck className="sidebar-item-icon" />
            {sidebar_open && <span>Autentikasi 2FA</span>}
          </Link>
        </div>

        {/* Admin Section (Conditional) */}
        {isAdmin && (
          <div className="sidebar-section">
            {sidebar_open && <div className="sidebar-section-label" style={{ color: '#f87171' }}>Admin Panel</div>}
            <Link
              href="/admin/users"
              className={`sidebar-item ${isMainActive('/admin/users') ? 'active' : ''}`}
              title="Manajemen Pengguna"
            >
              <Users className="sidebar-item-icon" />
              {sidebar_open && <span>Pengguna</span>}
            </Link>
            <Link
              href="/admin/roles"
              className={`sidebar-item ${isMainActive('/admin/roles') ? 'active' : ''}`}
              title="Manajemen Role"
            >
              <ShieldAlert className="sidebar-item-icon" />
              {sidebar_open && <span>Role Akses</span>}
            </Link>
            <Link
              href="/admin/permissions"
              className={`sidebar-item ${isMainActive('/admin/permissions') ? 'active' : ''}`}
              title="Manajemen Permission"
            >
              <Key className="sidebar-item-icon" />
              {sidebar_open && <span>Hak Akses</span>}
            </Link>
            <Link
              href="/admin/role-permissions"
              className={`sidebar-item ${isMainActive('/admin/role-permissions') ? 'active' : ''}`}
              title="Role & Permission"
            >
              <Lock className="sidebar-item-icon" />
              {sidebar_open && <span>Role ↔ Permission</span>}
            </Link>
            <Link
              href="/admin/user-roles"
              className={`sidebar-item ${isMainActive('/admin/user-roles') ? 'active' : ''}`}
              title="User & Role"
            >
              <UserCheck className="sidebar-item-icon" />
              {sidebar_open && <span>User ↔ Role</span>}
            </Link>
            <Link
              href="/admin/sessions"
              className={`sidebar-item ${isMainActive('/admin/sessions') ? 'active' : ''}`}
              title="Monitor Sesi"
            >
              <Activity className="sidebar-item-icon" />
              {sidebar_open && <span>Monitor Sesi</span>}
            </Link>
            <Link
              href="/admin/audit-logs"
              className={`sidebar-item ${isMainActive('/admin/audit-logs') ? 'active' : ''}`}
              title="Audit Logs"
            >
              <History className="sidebar-item-icon" />
              {sidebar_open && <span>Audit Logs</span>}
            </Link>
          </div>
        )}

        {/* Integrated Subsystems */}
        {sidebar_open && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Sub-Sistem Terintegrasi</div>
            {SYSTEM_MODULES.slice(0, 5).map((mod) => (
              <a
                key={mod.value}
                href={`#${mod.value}`}
                onClick={(e) => e.preventDefault()}
                className="sidebar-item"
                style={{ fontSize: '0.8125rem' }}
              >
                <ExternalLink className="sidebar-item-icon" style={{ width: 14, height: 14 }} />
                <span>{mod.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {sidebar_open && user && (
        <div className="sidebar-footer">
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div className="avatar avatar-sm">
              {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {user.user_type}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
