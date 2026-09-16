'use client';

import { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';

export default function SikeuLayout({ children }: { children: React.ReactNode }) {
  const { user, hasRole } = useAuth();

  const canAccessSikeu = useMemo(() => {
    if (!user) return false;
    if (hasRole('admin') || hasRole('superadmin') || hasRole('admin_simpeg')) return true;

    const roles: any[] = user.roles || [];
    return roles.some((r) => {
      const perms: any[] = r.permissions || r.role?.permissions || [];
      return perms.some((p) => (p.slug || '').startsWith('sikeu.'));
    });
  }, [user, hasRole]);

  if (!canAccessSikeu) {
    return (
      <div className="theme-sikeu animate-fade-in space-y-6 w-full">
        <PageHeader
          title="Modul Keuangan (SIKEU)"
          description="Keuangan, Akuntansi, Tarif Angkatan, Dispensasi, dan Beasiswa"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40 text-rose-500" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Anda tidak memiliki hak akses ke modul SIKEU. Hubungi administrator untuk diberikan akses.
          </p>
        </div>
      </div>
    );
  }

  return <div className="theme-sikeu w-full">{children}</div>;
}