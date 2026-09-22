'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useImpersonateStore } from '@/store/impersonateStore';
import { adminService } from '@/services/admin.service';
import { getCookieDomain, getAuthTokenKey } from '@/lib/domain';
import type { User } from '@/types/auth.types';
import { Sparkles, ArrowLeftCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ImpersonateBanner() {
  const { user } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isImpersonating = useImpersonateStore((s) => s.isImpersonating);
  const adminUser = useImpersonateStore((s) => s.adminUser);
  const adminToken = useImpersonateStore((s) => s.adminToken);
  const adminRefreshToken = useImpersonateStore((s) => s.adminRefreshToken);
  const stopImpersonating = useImpersonateStore((s) => s.stopImpersonating);
  const syncFromBackend = useImpersonateStore((s) => s.syncFromBackend);
  const [isLeaving, setIsLeaving] = useState(false);

  // Verifikasi sesi ke backend agar banner tetap muncul di tab/subdomain
  // baru (sessionStorage bersifat per-tab sehingga flag lokal kosong di
  // tab baru). Status dihitung per-token sehingga 2 device milik admin
  // yang sama mendapat hasil masing-masing.
  const verifySession = useCallback(async () => {
    try {
      const res = await adminService.getImpersonateStatus();
      const status = res?.data;
      if (status?.is_impersonating) {
        if (status.impersonated_by) {
          syncFromBackend(status.impersonated_by as unknown as User);
        } else {
          // Token lawas tanpa info admin: pertahankan flag lokal bila ada.
          if (!useImpersonateStore.getState().isImpersonating) return;
        }
      } else if (useImpersonateStore.getState().isImpersonating) {
        // Sesi berakhir dari tempat lain (tab/device lain leave).
        stopImpersonating();
      }
    } catch {
      // Jaringan/401: pertahankan state lokal, jangan sembunyikan banner.
    }
  }, [stopImpersonating, syncFromBackend]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    window.addEventListener('focus', verifySession);
    return () => window.removeEventListener('focus', verifySession);
  }, [verifySession]);

  if (!isImpersonating) return null;

  const applyAdminSession = (
    nextAdminUser: typeof adminUser,
    nextToken: string,
    nextRefreshToken: string
  ) => {
    if (!nextAdminUser) return false;
    stopImpersonating();

    const domainAttr = getCookieDomain();
    const tokenKey = getAuthTokenKey();
    const roleKey = tokenKey === 'demo_sso_access_token' ? 'demo_sso_user_role' : 'sso_user_role';
    const adminRole = nextAdminUser.roles?.[0]?.role?.slug || nextAdminUser.roles?.[0]?.slug || 'super_admin';

    document.cookie = `${tokenKey}=${nextToken}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `${roleKey}=${adminRole}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;

    setAuth(nextAdminUser, nextToken, nextRefreshToken);
    toast.success(`Kembali ke akun administrator (${nextAdminUser.name || nextAdminUser.username})`);
    window.location.href = '/admin/users';
    return true;
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      let leaveData = null;
      try {
        const res = await adminService.leaveImpersonate();
        leaveData = res?.data ?? null;
      } catch {
        // best effort jika token sudah kadaluarsa
      }

      // 1. Prioritas: token admin baru dari backend (berfungsi di tab baru
      // tanpa simpanan adminToken lokal).
      if (leaveData && leaveData.access_token && leaveData.admin) {
        applyAdminSession(
          leaveData.admin,
          leaveData.access_token,
          leaveData.access_token
        );
        return;
      }

      // 2. Fallback: simpanan adminToken tab asal.
      if (adminToken && adminUser) {
        applyAdminSession(adminUser, adminToken, adminRefreshToken || adminToken);
        return;
      }

      stopImpersonating();
      window.location.href = '/login';
    } catch {
      toast.error('Gagal keluar dari mode rasuki.');
    } finally {
      setIsLeaving(false);
    }
  };

  const adminName = adminUser ? adminUser.name || adminUser.username || 'Admin' : 'Admin';

  const displayName = user?.name || user?.nama_lengkap || user?.username || 'Pengguna';
  const roleDisplay = (user?.roles || [])
    .map((r: any) => r.name || r.role?.name || r.slug || (typeof r === 'string' ? r : ''))
    .filter(Boolean)
    .join(', ') || 'Pengguna';

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md z-50 border-b border-amber-700 animate-fade-in">
      <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-amber-400 shrink-0 shadow-sm">
          <Sparkles size={14} className="animate-pulse" />
        </span>
        <span className="leading-tight">
          <strong className="font-bold tracking-wide">MODE RASUKI PENGGUNA:</strong> Anda sedang masuk sebagai{' '}
          <strong className="underline underline-offset-2 font-bold">{displayName}</strong>{' '}
          <span className="opacity-90">(@{user?.username || '-'})</span>{' '}
          <span className="bg-slate-950/15 px-1.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase border border-slate-950/10">
            {roleDisplay}
          </span>
          {adminName && (
            <span className="hidden md:inline text-xs opacity-85 ml-2">
              (Dirasuki oleh: {adminName})
            </span>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleLeave}
        disabled={isLeaving}
        className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-300 hover:bg-slate-900 hover:text-amber-200 px-3 py-1 rounded-md text-xs font-bold transition-all shadow hover:shadow-md cursor-pointer disabled:opacity-50 shrink-0"
      >
        {isLeaving ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <ArrowLeftCircle size={14} />
            <span>Kembali ke Akun Admin</span>
          </>
        )}
      </button>
    </div>
  );
}
