'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { TOKEN_KEY } from '@/lib/constants';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebar_open } = useUiStore();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authService
        .getMe()
        .then((res: any) => {
          const userData = res?.data?.id ? res.data : res?.data?.user || res?.user || res?.data || res;
          if (userData && (userData.id || userData.username || userData.email)) {
            setUser(userData);
            if (userData.user_type) {
              document.cookie = `sso_user_type=${userData.user_type}; path=/; max-age=3600; SameSite=Lax`;
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
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
