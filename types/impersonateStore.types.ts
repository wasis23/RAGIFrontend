import type { User } from './auth.types';

export interface ImpersonateState {
  isImpersonating: boolean;
  adminToken: string | null;
  adminRefreshToken: string | null;
  adminUser: User | null;
}

export interface ImpersonateActions {
  startImpersonating: (adminToken: string, adminRefreshToken: string, adminUser: User) => void;
  stopImpersonating: () => void;
  /**
   * Hidrasikan flag impersonasi dari verifikasi backend
   * (GET /api/admin/impersonate-status) agar banner tetap muncul di
   * tab/subdomain baru tanpa bergantung pada sessionStorage tab lama.
   * Token admin dibiarkan apa adanya (bisa null di tab baru) karena
   * backend menerbitkan token admin baru saat leave.
   */
  syncFromBackend: (adminUser: User) => void;
}

export type ImpersonateStore = ImpersonateState & ImpersonateActions;
