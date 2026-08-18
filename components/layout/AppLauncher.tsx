'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Grid, Shield, Users, CreditCard, UserPlus, BookOpen, FlaskConical, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { moduleService, AppModule } from '@/services/module.service';

const MODULE_META: Record<string, any> = {
  'sso': {
    href: '/admin/users',
    icon: Shield,
  },
  'simpeg': {
    href: '/simpeg',
    icon: Users,
  },
  'sippm': {
    href: '/sippm/proposal',
    icon: FlaskConical,
  },
  'sikeu': {
    href: '/sikeu',
    icon: CreditCard,
  },
  'spmb': {
    href: '/spmb',
    icon: UserPlus,
  },
  'siakad': {
    href: '/siakad',
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
    <div className="app-launcher-wrap" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-ghost btn-icon ${isOpen ? 'app-launcher-active' : ''}`}
        title="Modul Switcher Terintegrasi"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Grid size={20} />
      </button>

      {isOpen && (
        <div className="dropdown-menu dropdown-menu-lg app-launcher-menu" role="menu">
          <div className="app-launcher-header">
            <span className="app-launcher-title">Sub-Sistem Terintegrasi SSO</span>
            <span className="app-launcher-count">{accessibleModules.length} Modul</span>
          </div>

          <div className="app-launcher-grid">
            {accessibleModules.map((app) => {
              const meta = MODULE_META[app.code] || {
                href: `/${app.code}`,
                icon: LayoutGrid
              };
              
              const IconComp = meta.icon;
              return (
                <Link
                  key={app.id}
                  href={meta.href}
                  onClick={() => setIsOpen(false)}
                  className="module-card"
                  role="menuitem"
                >
                  <div className="module-card-icon">
                    <IconComp size={18} />
                  </div>
                  <div className="module-card-title">{app.name}</div>
                  <div className="module-card-desc">{app.description || '-'}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}