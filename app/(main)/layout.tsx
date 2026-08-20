'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { menuService } from '@/services/menu.service';
import { Menu } from '@/types/menu';
import { TOKEN_KEY, PUBLIC_ROUTES } from '@/lib/constants';
import NotFoundPage from '@/app/not-found';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const [isNotFound, setIsNotFound] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Helper untuk mengekstrak seluruh URL yang diizinkan dari hierarki menu
  const extractUrls = (menus: Menu[]): string[] => {
    let urls: string[] = [];
    menus.forEach((m) => {
      if (m.url && !m.url.startsWith('#')) {
        urls.push(m.url);
      }
      if (m.children && m.children.length > 0) {
        urls = urls.concat(extractUrls(m.children));
      }
    });
    return urls;
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authService
        .getMe()
        .then(async (res: any) => {
          const userData = res?.data?.id ? res.data : res?.data?.user || res?.user || res?.data || res;
          if (userData && (userData.id || userData.username || userData.email)) {
            setUser(userData);
            const primaryRole = userData.roles?.[0]?.role?.slug || userData.roles?.[0]?.slug;
            if (primaryRole) {
              document.cookie = `sso_user_role=${primaryRole}; path=/; max-age=3600; SameSite=Lax`;
            }

            // Ambil seluruh menu yang dipetakan untuk user dari DB (semua modul)
            try {
              const myMenus = await menuService.getMyMenus('all');
              const allowedUrls = extractUrls(myMenus || []);
              
              // Base routes yang selalu diizinkan untuk pengguna terautentikasi
              const baseAllowed = ['/dashboard', '/profile', '/profile/sessions', '/profile/mfa', '/checkout'];
              
              const currentPath = pathname.replace(/\/$/, '');
              
              // Periksa apakah pathname yang diakses termasuk rute publik / base / dipetakan di Role ↔ Akses Menu
              const isAllowed = 
                (PUBLIC_ROUTES as readonly string[]).includes(currentPath) ||
                baseAllowed.includes(currentPath) ||
                allowedUrls.some((url) => {
                  const normUrl = url.replace(/\/$/, '');
                  return currentPath === normUrl || currentPath.startsWith(normUrl + '/');
                });

              if (!isAllowed) {
                setIsNotFound(true);
              } else {
                setIsNotFound(false);
              }
            } catch (err) {
              console.error('Gagal memverifikasi otorisasi menu:', err);
            }
          }
        })
        .catch(() => {
          // Token expired atau invalid handled by axios interceptor
        })
        .finally(() => {
          setCheckingAccess(false);
        });
    } else {
      setCheckingAccess(false);
    }
  }, [setUser, pathname]);

  if (isNotFound) {
    return <NotFoundPage />;
  }

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
