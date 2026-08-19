'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { TOKEN_KEY } from '@/lib/constants';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authService
        .getMe()
        .then((res: any) => {
          const userData = res?.data?.id ? res.data : res?.data?.user || res?.user || res?.data || res;
          if (userData && (userData.id || userData.username || userData.email)) {
            setUser(userData);
            const primaryRole = userData.roles?.[0]?.role?.slug || userData.roles?.[0]?.slug;
            if (primaryRole) {
              document.cookie = `sso_user_role=${primaryRole}; path=/; max-age=3600; SameSite=Lax`;
              
              // Dynamic RBAC Guard
              let hasSuperAccess = false;
              const allowedModules = new Set<string>(['dashboard', 'profile']); // Base modules

              userData.roles?.forEach((r: any) => {
                const roleSlug = r.slug || r.role?.slug;
                if (roleSlug === 'admin' || roleSlug === 'superadmin') {
                  hasSuperAccess = true;
                }
                const permissions = r.permissions || r.role?.permissions || [];
                permissions.forEach((p: any) => {
                  const pMod = p.module || p.permission?.module;
                  if (pMod) allowedModules.add(pMod);
                });
              });

              if (!hasSuperAccess) {
                // Determine module from pathname, e.g., '/simpeg/...' -> 'simpeg'
                const currentModule = pathname.split('/')[1];
                if (currentModule && !allowedModules.has(currentModule)) {
                  router.replace('/dashboard');
                }
              }
            }
          }
        })
        .catch(() => {
          // Token expired atau invalid handled by axios interceptor
        });
    }
  }, [setUser]);

  return (
    <div className={`main-layout ${sidebar_open ? '' : 'sidebar-collapsed'}`}>
      <Suspense fallback={<div style={{ width: 260 }} />}>
        <Sidebar />
      </Suspense>
      {sidebar_open && (
        <div 
          className="sidebar-overlay hide-desktop" 
          onClick={toggleSidebar}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <Navbar />
        <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
