// ============================================================
// IMPERSONATE TYPES — Mengacu pada tabel: core_impersonation_sessions
// ============================================================

import type { User } from './auth.types';

/**
 * Identitas admin yang merasuki (dari backend).
 */
export interface ImpersonatedBy {
  id: number;
  username: string;
  name: string;
}

/**
 * Response GET /api/admin/impersonate-status.
 * Status dihitung per-token: device 1 (token A) dan device 2 (token B)
 * mendapat hasil masing-masing walaupun admin-nya sama.
 */
export interface ImpersonateStatusData {
  is_impersonating: boolean;
  impersonation_session_id?: number | null;
  started_at?: string | null;
  is_legacy?: boolean;
  impersonated_by?: ImpersonatedBy | null;
}

/**
 * Response POST /api/admin/users/leave-impersonate.
 * Backend menerbitkan token admin baru agar tab baru tanpa simpanan
 * adminToken tetap bisa kembali ke akun admin. Kasus lawas (token
 * dibuat sebelum tabel sesi ada) mengembalikan data null.
 */
export interface LeaveImpersonateData {
  admin: User;
  access_token: string;
  token: string;
  token_type: string;
}
