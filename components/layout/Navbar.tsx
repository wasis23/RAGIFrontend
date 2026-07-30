'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, LogOut, User, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { UserTypeBadge } from '@/components/ui/Badge';

import { AppLauncher } from '@/components/layout/AppLauncher';

export function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUiStore();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-icon hide-desktop"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Single Sign-On (SSO) Portal
          </span>
          <span style={{
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.5rem',
            borderRadius: 99,
            border: '1px solid var(--primary-200)'
          }}>
            TERINTEGRASI
          </span>
        </div>
      </div>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Module Switcher 9-dot */}
        <AppLauncher />
        {/* Notification Bell mock */}
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            background: 'var(--danger)',
            borderRadius: '50%'
          }} />
        </button>

        {/* User Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <div className="avatar avatar-md">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ textAlign: 'left' }} className="hide-mobile">
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user?.username || 'User Kampus'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.email || 'user@kampus.ac.id'}
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 0.5rem)',
                width: 240,
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                padding: '0.5rem',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <div style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--gray-100)', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Tipe Akun:
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  {user?.user_type && <UserTypeBadge type={user.user_type} />}
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowDropdown(false)}
                className="sidebar-item"
                style={{ color: 'var(--text-primary)' }}
              >
                <User size={16} />
                <span>Pengaturan Profil</span>
              </Link>

              <Link
                href="/profile/mfa"
                onClick={() => setShowDropdown(false)}
                className="sidebar-item"
                style={{ color: 'var(--text-primary)' }}
              >
                <Shield size={16} />
                <span>Keamanan 2FA</span>
              </Link>

              <div style={{ borderTop: '1px solid var(--gray-100)', margin: '0.25rem 0' }} />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="sidebar-item"
                style={{ width: '100%', color: 'var(--danger)', background: 'none', border: 'none', textAlign: 'left' }}
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
