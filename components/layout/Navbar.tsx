'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, LogOut, User, Shield, Bell, ArrowLeftCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useImpersonateStore } from '@/store/impersonateStore';
import { useDomain } from '@/hooks/useDomain';
import { adminService } from '@/services/admin.service';
import { getCookieDomain, getAuthTokenKey } from '@/lib/domain';
import toast from 'react-hot-toast';

import { AppLauncher } from '@/components/layout/AppLauncher';

export function Navbar() {
  const { user, logout } = useAuth();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isImpersonating = useImpersonateStore((s) => s.isImpersonating);
  const adminToken = useImpersonateStore((s) => s.adminToken);
  const adminRefreshToken = useImpersonateStore((s) => s.adminRefreshToken);
  const adminUser = useImpersonateStore((s) => s.adminUser);
  const stopImpersonating = useImpersonateStore((s) => s.stopImpersonating);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { moduleLabel, isDemo } = useDomain();
  const [showDropdown, setShowDropdown] = useState(false);

  const isMahasiswa = (user?.roles || []).some((r: any) => {
    const slug = (typeof r === 'string' ? r : r.slug || r.name || '').toLowerCase();
    return slug === 'mahasiswa';
  });

  return (
    <header className="topbar">
      <div className="topbar-section">
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-icon hide-desktop flex items-center justify-center p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-section">
          <span className="topbar-title hide-mobile">
            {moduleLabel ? `${moduleLabel} Portal` : 'Single Sign-On (SSO) Portal'}
          </span>
          <span className="badge badge-blue hide-mobile">TERINTEGRASI</span>
          {isDemo && (
            <span className="badge bg-amber-500 text-slate-950 font-bold hide-mobile">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="topbar-section">
        {/* Module Switcher 9-dot */}
        <AppLauncher />
        {/* Notification Bell mock */}
        <button className="btn btn-ghost btn-icon topbar-bell" aria-label="Notifikasi">
          <Bell size={18} />
          <span className="topbar-bell-dot" />
        </button>

        {/* User Menu Dropdown */}
        <div className="topbar-user-menu">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="topbar-trigger"
            aria-haspopup="menu"
            aria-expanded={showDropdown}
          >
            <div className="avatar avatar-md">
              {(user?.name || user?.nama_lengkap || user?.username)
                ? (user.name || user.nama_lengkap || user.username).slice(0, 2).toUpperCase()
                : 'US'}
            </div>
            <div className="hide-mobile topbar-user-text">
              <div className="topbar-user-name">{user?.name || user?.nama_lengkap || user?.username || 'User Kampus'}</div>
              <div className="topbar-user-email">{user?.email || 'user@kampus.ac.id'}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-header">
                <div className="dropdown-item-label">Tipe Akun:</div>
                <div className="dropdown-roles">
                  {user?.roles?.map(r => (
                    <span key={r.id} className="dropdown-role-tag">{r.name || r.role?.name}</span>
                  ))}
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowDropdown(false)}
                className="dropdown-item"
                role="menuitem"
              >
                <User size={16} />
                <span>Pengaturan Profil</span>
              </Link>

              {isMahasiswa && (
                <Link
                  href="/siakad/profil"
                  onClick={() => setShowDropdown(false)}
                  className="dropdown-item text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold"
                  role="menuitem"
                >
                  <User size={16} className="text-amber-700" />
                  <span>Biodata PDDIKTI</span>
                </Link>
              )}

              <Link
                href="/profile/mfa"
                onClick={() => setShowDropdown(false)}
                className="dropdown-item"
                role="menuitem"
              >
                <Shield size={16} />
                <span>Keamanan 2FA</span>
              </Link>

              <div className="dropdown-divider" />

              {isImpersonating && (
                <button
                  onClick={async () => {
                    setShowDropdown(false);
                    let leaveData = null;
                    try {
                      const res = await adminService.leaveImpersonate();
                      leaveData = res?.data ?? null;
                    } catch {}
                    // Prioritas: token admin baru dari backend (berfungsi di
                    // tab baru tanpa simpanan adminToken lokal).
                    if (leaveData && leaveData.access_token && leaveData.admin) {
                      const nextAdmin = leaveData.admin;
                      stopImpersonating();
                      const domainAttr = getCookieDomain();
                      const tokenKey = getAuthTokenKey();
                      const roleKey = tokenKey === 'demo_sso_access_token' ? 'demo_sso_user_role' : 'sso_user_role';
                      const adminRole = nextAdmin.roles?.[0]?.role?.slug || nextAdmin.roles?.[0]?.slug || 'super_admin';
                      document.cookie = `${tokenKey}=${leaveData.access_token}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
                      document.cookie = `${roleKey}=${adminRole}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
                      setAuth(nextAdmin, leaveData.access_token, leaveData.access_token);
                      toast.success(`Kembali ke akun administrator (${nextAdmin.name || nextAdmin.username})`);
                      window.location.href = '/admin/users';
                    } else if (adminToken && adminUser) {
                      stopImpersonating();
                      const domainAttr = getCookieDomain();
                      const tokenKey = getAuthTokenKey();
                      const roleKey = tokenKey === 'demo_sso_access_token' ? 'demo_sso_user_role' : 'sso_user_role';
                      const adminRole = adminUser.roles?.[0]?.role?.slug || adminUser.roles?.[0]?.slug || 'super_admin';
                      document.cookie = `${tokenKey}=${adminToken}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
                      document.cookie = `${roleKey}=${adminRole}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
                      setAuth(adminUser, adminToken, adminRefreshToken || adminToken);
                      toast.success(`Kembali ke akun administrator (${adminUser.name || adminUser.username})`);
                      window.location.href = '/admin/users';
                    } else {
                      stopImpersonating();
                      window.location.href = '/login';
                    }
                  }}
                  className="dropdown-item text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold"
                  role="menuitem"
                >
                  <ArrowLeftCircle size={16} className="text-amber-600" />
                  <span>Kembali ke Akun Admin</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="dropdown-item dropdown-item-danger"
                role="menuitem"
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}