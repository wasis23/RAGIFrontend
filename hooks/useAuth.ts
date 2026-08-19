'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/constants';
import type { LoginRequest, User, Permission } from '@/types/auth.types';

// Helper set cookie untuk middleware Next.js (1 jam = 3600 detik)
function setAuthCookies(token: string, userRole: string) {
  document.cookie = `sso_access_token=${token}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `sso_user_role=${userRole}; path=/; max-age=3600; SameSite=Lax`;
}

function clearAuthCookies() {
  document.cookie = 'sso_access_token=; path=/; max-age=0;';
  document.cookie = 'sso_user_role=; path=/; max-age=0;';
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
    async (payload: LoginRequest, redirectPath?: string | null) => {
      setLoading(true);
      try {
        const res = await authService.login(payload);
        
        // Parsing response Laravel Sanctum
        const tokenStr = res?.access_token || res?.data?.access_token || res?.token;
        const userObj: User = res?.data?.id ? res.data : res?.data?.user || res?.user;

        if (tokenStr && userObj) {
          setAuthCookies(tokenStr, userObj.roles?.[0]?.role?.slug || userObj.roles?.[0]?.slug || 'user');
          setAuth(userObj, tokenStr, res?.refresh_token || tokenStr);
          toast.success(res?.message || `Selamat datang, ${userObj.username || 'Pengguna'}!`);
          router.push(redirectPath || ROUTES.DASHBOARD);
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

  // Cek apakah user memiliki role tertentu
  const hasRole = useCallback(
    (roleSlug: string) => {
      if (!user) return false;
      return user.roles?.some((r: any) => r.slug === roleSlug || r.role?.slug === roleSlug) ?? false;
    },
    [user]
  );

  // Cek apakah user memiliki permission tertentu (Granular RBAC)
  const hasPermission = useCallback(
    (permSlug: string) => {
      if (!user) return false;

      // Super admin & Admin SIMPEG memiliki semua permission
      if (hasRole('admin') || hasRole('superadmin')) return true;
      if (hasRole('admin_simpeg')) return true;

      // Periksa daftar permission yang terikat pada role-role user
      const shortSlug = permSlug.replace(/^simpeg\.|^iam\./, '');
      return (
        user.roles?.some((r: any) => {
          const perms: Permission[] = r.permissions || r.role?.permissions || [];
          return perms.some(
            (p) =>
              p.slug === permSlug ||
              p.slug === `simpeg.${shortSlug}` ||
              p.slug === `iam.${shortSlug}` ||
              p.slug === shortSlug
          );
        }) ?? false
      );
    },
    [user]
  );

  const isAdmin = useMemo(() => hasRole('admin') || hasRole('superadmin'), [hasRole]);
  const isSuperAdmin = useMemo(() => hasRole('superadmin'), [hasRole]);
  const isDosen = useMemo(() => hasRole('dosen'), [hasRole]);
  const isTendik = useMemo(() => hasRole('tendik'), [hasRole]);
  const isMahasiswa = useMemo(() => hasRole('mahasiswa'), [hasRole]);

  const isAdminSimpeg = useMemo(() => {
    if (!user) return false;
    if (hasRole('admin') || hasRole('superadmin')) return true;
    return hasRole('admin_simpeg');
  }, [user, hasRole]);

  return {
    user,
    access_token,
    is_authenticated,
    is_loading,
    requires_mfa,
    mfa_user_id,
    isAdmin,
    isSuperAdmin,
    isDosen,
    isTendik,
    isMahasiswa,
    isAdminSimpeg,
    login,
    logout,
    hasRole,
    hasPermission,
  };
}
