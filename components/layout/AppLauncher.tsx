'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Grid,
  Shield,
  Users,
  CreditCard,
  UserPlus,
  BookOpen,
  FlaskConical,
  LayoutGrid,
  Building2,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { moduleService, AppModule } from '@/services/module.service';

const MODULE_META: Record<string, any> = {
  sso: {
    href: '/admin/users',
    icon: Shield,
    badgeColor: 'bg-blue-50 text-blue-600',
  },
  simpeg: {
    href: '/simpeg',
    icon: Users,
    badgeColor: 'bg-emerald-50 text-emerald-600',
  },
  sippm: {
    href: '/sippm/proposal',
    icon: FlaskConical,
    badgeColor: 'bg-purple-50 text-purple-600',
  },
  sikeu: {
    href: '/sikeu',
    icon: CreditCard,
    badgeColor: 'bg-amber-50 text-amber-600',
  },
  spmb: {
    href: '/spmb',
    icon: UserPlus,
    badgeColor: 'bg-indigo-50 text-indigo-600',
  },
  siakad: {
    href: '/siakad',
    icon: BookOpen,
    badgeColor: 'bg-cyan-50 text-cyan-600',
  },
  sinapra: {
    href: '/sinapra/gedung-ruangan',
    icon: Building2,
    badgeColor: 'bg-rose-50 text-rose-600',
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
    moduleService
      .getAllModules()
      .then((res) => {
        setModules(res.filter((m) => m.is_active));
      })
      .catch(() => {});
  }, []);

  const checkAccess = (code: string) => {
    if (isAdmin || isSuperAdmin) return true;

    switch (code) {
      case 'sso':
        return false;
      case 'simpeg':
        return isAdminSimpeg || isDosen || isTendik;
      case 'sippm':
        return isDosen || hasRole('reviewer');
      case 'sikeu':
        return isMahasiswa || isTendik;
      case 'siakad':
        return isDosen || isMahasiswa;
      case 'sinapra':
        return isTendik || hasRole('admin_sarpras');
      case 'spmb':
        return true;
      default:
        return true;
    }
  };

  const accessibleModules = modules.filter((m) => checkAccess(m.code));

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-ghost btn-icon ${isOpen ? 'text-primary-600 bg-primary-50' : ''}`}
        title="Modul Switcher Terintegrasi"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Grid size={20} />
      </button>

      {isOpen && (
        <>
          {/* Mobile Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[998] sm:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* App Switcher Dropdown Container */}
          <div className="fixed inset-x-3 top-16 z-[999] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 animate-fade-in max-h-[85vh] overflow-y-auto">
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                  <LayoutGrid size={16} />
                </div>
                <span className="font-bold text-sm text-slate-900">Sub-Sistem SSO</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-2xs font-bold">
                  {accessibleModules.length} Modul
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup Modul Switcher"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modules Grid (Mobile: 1-column list | Desktop: 2-column grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accessibleModules.map((app) => {
                const meta = MODULE_META[app.code] || {
                  href: `/${app.code}`,
                  icon: LayoutGrid,
                  badgeColor: 'bg-slate-100 text-slate-700',
                };

                const IconComp = meta.icon;
                return (
                  <Link
                    key={app.id}
                    href={meta.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center sm:flex-col sm:items-start p-3 rounded-xl border border-slate-100 hover:border-primary-200 bg-slate-50/60 hover:bg-primary-50/40 transition-all text-left"
                    role="menuitem"
                  >
                    <div
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mb-0 sm:mb-2 mr-3 sm:mr-0 ${meta.badgeColor}`}
                    >
                      <IconComp size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {app.name}
                      </div>
                      <div className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                        {app.description || 'Modul terintegrasi'}
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-slate-400 group-hover:text-primary-600 sm:hidden shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}