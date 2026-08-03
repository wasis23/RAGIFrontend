'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Grid, Shield, Users, CreditCard, UserPlus, BookOpen, FlaskConical, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { moduleService, AppModule } from '@/services/module.service';

const MODULE_META: Record<string, any> = {
  'sso': {
    href: '/admin/users',
    color: '#3b82f6',
    icon: Shield,
  },
  'simpeg': {
    href: '/simpeg',
    color: '#6366f1',
    icon: Users,
  },
  'sippm': {
    href: '/sippm/proposal',
    color: '#0d9488',
    icon: FlaskConical,
  },
  'sikeu': {
    href: '/sikeu',
    color: '#10b981',
    icon: CreditCard,
  },
  'spmb': {
    href: '/spmb',
    color: '#0284c7',
    icon: UserPlus,
  },
  'siakad': {
    href: '/siakad',
    color: '#f59e0b',
    icon: BookOpen,
  },
};

export function AppLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [modules, setModules] = useState<AppModule[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isAdmin, isSuperAdmin, isAdminSimpeg, isDosen, isTendik, isMahasiswa, hasRole } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch modules dari API untuk disesuaikan dengan DB
    moduleService.getAllModules().then((res) => {
      setModules(res.filter(m => m.is_active));
    }).catch(() => {
      // Ignore if failed
    });
  }, []);

  // Cek akses pengguna terhadap modul
  const checkAccess = (code: string) => {
    if (isAdmin || isSuperAdmin) return true; // Admin dapat mengakses semua
    
    switch (code) {
      case 'sso': return false; // User biasa tidak punya akses sso/admin
      case 'simpeg': return isAdminSimpeg || isDosen || isTendik;
      case 'sippm': return isDosen || hasRole('reviewer');
      case 'sikeu': return isMahasiswa || isTendik;
      case 'siakad': return isDosen || isMahasiswa;
      case 'spmb': return true; // Publik/User Baru
      default: return true; // Untuk modul kustom lain
    }
  };

  const accessibleModules = modules.filter(m => checkAccess(m.code));

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
              {accessibleModules.length} Modul
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {accessibleModules.map((app) => {
              const meta = MODULE_META[app.code] || {
                href: `/${app.code}`,
                color: '#6b7280',
                icon: LayoutGrid
              };
              
              const IconComp = meta.icon;
              return (
                <Link
                  key={app.id}
                  href={meta.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: '#fafafa',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color;
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
                        background: `${meta.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: meta.color,
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                    {app.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: 2, lineHeight: 1.2 }}>
                    {app.description || '-'}
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
