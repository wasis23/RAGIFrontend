'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, LogOut, User, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';

import { AppLauncher } from '@/components/layout/AppLauncher';

export function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUiStore();
  const [showDropdown, setShowDropdown] = useState(false);

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
          <span className="topbar-title hide-mobile">Single Sign-On (SSO) Portal</span>
          <span className="badge badge-blue hide-mobile">TERINTEGRASI</span>
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
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="hide-mobile topbar-user-text">
              <div className="topbar-user-name">{user?.username || 'User Kampus'}</div>
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