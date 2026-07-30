'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/constants';
import type { LoginRequest, User } from '@/types/auth.types';

// Helper set cookie untuk middleware Next.js
function setAuthCookies(token: string, userType: string) {
  document.cookie = `sso_access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `sso_user_type=${userType}; path=/; max-age=86400; SameSite=Lax`;
}

function clearAuthCookies() {
  document.cookie = 'sso_access_token=; path=/; max-age=0;';
  document.cookie = 'sso_user_type=; path=/; max-age=0;';
}

export function useAuth() {
  const router = useRouter();
  const {
    user,
    access_token,
    is_authenticated,
    is_loading,
    requires_mfa,
    mfa_user_id,
    setAuth,
    setLoading,
    logout: clearAuth,
  } = useAuthStore();

  // Login dengan Backend API Laravel Sanctum
  const login = useCallback(
    async (payload: LoginRequest) => {
      setLoading(true);
      try {
        const res = await authService.login(payload);
        
        // Parsing response Laravel Sanctum
        const tokenStr = res?.access_token || res?.data?.access_token || res?.token;
        const userObj: User = res?.data?.id ? res.data : res?.data?.user || res?.user;

        if (tokenStr && userObj) {
          setAuthCookies(tokenStr, userObj.user_type || 'mahasiswa');
          setAuth(userObj, tokenStr, res?.refresh_token || tokenStr);
          toast.success(res?.message || `Selamat datang, ${userObj.username || 'Pengguna'}!`);
          router.push(ROUTES.DASHBOARD);
        } else {
          toast.error(res?.message || 'Gagal autentikasi dari server.');
        }
      } catch (err: unknown) {
        const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
        
        // Tangkap pesan error dari validasi Laravel Sanctum
        const validationErr = error.response?.data?.errors;
        let apiMessage = error.response?.data?.message;

        if (validationErr) {
          const firstKey = Object.keys(validationErr)[0];
          if (firstKey && validationErr[firstKey]?.[0]) {
            apiMessage = validationErr[firstKey][0];
          }
        }

        toast.error(apiMessage || 'Email, username, atau password salah.');
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, router]
  );

  // Quick Demo Login — HANYA TERSEDIA DI DEVELOPMENT
  // Tidak akan bisa dipanggil di production build
  const loginAsDemo = useCallback(
    (roleType: 'mahasiswa' | 'dosen' | 'admin' = 'admin') => {
      if (process.env.NODE_ENV !== 'development') {
        toast.error('Demo login tidak tersedia di production.');
        return;
      }

      setLoading(true);
      const demoUser: User = {
        id: roleType === 'admin' ? 99 : 1,
        username: roleType === 'admin' ? 'admin_super' : roleType === 'dosen' ? 'dosen_siakad' : 'mahasiswa_demo',
        email: `${roleType}@kampus.ac.id`,
        phone: '081234567890',
        user_type: roleType,
        is_active: true,
        is_verified: true,
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        roles: [
          {
            id: 1,
            user_id: 1,
            role_id: 1,
            created_at: new Date().toISOString(),
            role: {
              id: 1,
              name: roleType === 'admin' ? 'Administrator Kampus' : roleType === 'dosen' ? 'Dosen Pengajar' : 'Mahasiswa Reguler',
              slug: roleType,
              description: 'Role Demo',
              created_at: new Date().toISOString(),
            },
          },
        ],
      };
      const demoToken = 'mock_demo_access_token_dev_only';
      setAuthCookies(demoToken, roleType);
      setAuth(demoUser, demoToken, 'mock_demo_refresh_token_dev_only');
      toast.success(`[DEV] Masuk sebagai ${demoUser.username} (${roleType})`);
      setLoading(false);
      router.push(ROUTES.DASHBOARD);
    },
    [setAuth, setLoading, router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      clearAuthCookies();
      clearAuth();
      toast.success('Anda telah keluar.');
      router.push(ROUTES.LOGIN);
    }
  }, [clearAuth, router]);

  const hasRole = useCallback(
    (roleSlug: string) => {
      return user?.roles?.some((r) => r.role?.slug === roleSlug) ?? false;
    },
    [user]
  );

  const isAdmin = user?.user_type === 'admin';
  const isDosen = user?.user_type === 'dosen';
  const isMahasiswa = user?.user_type === 'mahasiswa';

  return {
    user,
    access_token,
    is_authenticated,
    is_loading,
    requires_mfa,
    mfa_user_id,
    isAdmin,
    isDosen,
    isMahasiswa,
    login,
    loginAsDemo,
    logout,
    hasRole,
  };
}
