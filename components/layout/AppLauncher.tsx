'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Grid, Shield, Users, CreditCard, UserPlus, BookOpen } from 'lucide-react';

interface SubSystemApp {
  id: string;
  name: string;
  description: string;
  href: string;
  color: string;
  icon: any;
  badge?: string;
}

const APPS: SubSystemApp[] = [
  {
    id: 'sso',
    name: 'SSO Auth Center',
    description: 'IAM, Audit Logs & User Roles',
    href: '/admin/users',
    color: '#3b82f6',
    icon: Shield,
  },
  {
    id: 'simpeg',
    name: 'SIMPEG Kampus',
    description: 'Kepegawaian, Unit Kerja & Jabatan',
    href: '/simpeg',
    color: '#6366f1',
    icon: Users,
    badge: 'AKTIF',
  },
  {
    id: 'sikeu',
    name: 'SIKEU Kampus',
    description: 'Tagihan UKT & Payment Gateway',
    href: '/sikeu',
    color: '#10b981',
    icon: CreditCard,
    badge: 'DEV',
  },
  {
    id: 'spmb',
    name: 'SPMB Kampus',
    description: 'Penerimaan Mahasiswa Baru',
    href: '/spmb',
    color: '#0284c7',
    icon: UserPlus,
    badge: 'DEV',
  },
  {
    id: 'siakad',
    name: 'SIAKAD Core',
    description: 'Sistem Informasi Akademik',
    href: '/siakad',
    color: '#f59e0b',
    icon: BookOpen,
    badge: 'PLANNED',
  },
];

export function AppLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-icon"
        title="Modul Switcher Terintegrasi"
        style={{ color: isOpen ? 'var(--primary-600)' : 'var(--text-secondary)' }}
      >
        <Grid size={20} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: 320,
            background: 'white',
            borderRadius: 'var(--radius-xl, 12px)',
            boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1))',
            border: '1px solid var(--border-light, #e5e7eb)',
            padding: '1rem',
            zIndex: 999,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
              Sub-Sistem Terintegrasi SSO
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
              5 Modul
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {APPS.map((app) => {
              const IconComp = app.icon;
              return (
                <Link
                  key={app.id}
                  href={app.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: app.id === 'simpeg' ? '#f5f3ff' : '#fafafa',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = app.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${app.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: app.color,
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    {app.badge && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: app.id === 'simpeg' ? '#6366f1' : '#e5e7eb',
                          color: app.id === 'simpeg' ? 'white' : '#374151',
                        }}
                      >
                        {app.badge}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                    {app.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: 2, lineHeight: 1.2 }}>
                    {app.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
