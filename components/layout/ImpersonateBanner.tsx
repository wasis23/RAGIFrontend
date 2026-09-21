'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useImpersonateStore } from '@/store/impersonateStore';
import { adminService } from '@/services/admin.service';
import { getCookieDomain, getAuthTokenKey } from '@/lib/domain';
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
  const [isLeaving, setIsLeaving] = useState(false);

  if (!isImpersonating) return null;

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      try {
        await adminService.leaveImpersonate();
      } catch {
        // best effort jika token sudah kadaluarsa
      }

      if (adminToken && adminUser) {
        stopImpersonating();

        const domainAttr = getCookieDomain();
        const tokenKey = getAuthTokenKey();
        const roleKey = tokenKey === 'demo_sso_access_token' ? 'demo_sso_user_role' : 'sso_user_role';
        const adminRole = adminUser.roles?.[0]?.role?.slug || adminUser.roles?.[0]?.slug || 'super_admin';

        document.cookie = `${tokenKey}=${adminToken}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `${roleKey}=${adminRole}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;

        setAuth(adminUser, adminToken, adminRefreshToken || adminToken);
        toast.success(`Kembali ke akun administrator (${adminUser.name || adminUser.username})`);
        window.location.href = '/admin/users';
      } else {
        stopImpersonating();
        window.location.href = '/login';
      }
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
