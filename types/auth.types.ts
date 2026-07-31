// ============================================================
// AUTH TYPES — Mengacu pada ERD: users, sso_tokens, user_sessions
// ============================================================

export type UserType = string;

/**
 * Representasi tabel `users` pada ERD IAM & Auth Center
 */
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  user_type?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relasi yang disertakan dari backend (eager load)
  roles?: UserRole[];
}

/**
 * Representasi tabel `sso_tokens` pada ERD
 */
export interface SsoToken {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  client_app: string;
  access_expires_at: string;
  refresh_expires_at: string;
  created_at: string;
}

/**
 * Representasi tabel `user_sessions` pada ERD
 */
export interface UserSession {
  id: number;
  user_id: number;
  token: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

/**
 * Representasi tabel `roles` pada ERD
 */
export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'manage';

/**
 * Representasi tabel `permissions` pada ERD
 */
export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: PermissionAction;
  description?: string;
  created_at?: string;
}

/**
 * Representasi tabel `user_roles` pada ERD
 */
export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  name?: string;
  slug?: string;
  assigned_by?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  created_at?: string;
  role?: Role;
}

/**
 * Representasi tabel `role_permissions` pada ERD
 */
export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at?: string;
  permission?: Permission;
}

/**
 * Representasi tabel `audit_logs` pada ERD
 */
export interface AuditLog {
  id: number;
  user_id: number;
  module?: string;
  action: string;
  table_name?: string;
  record_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  payload?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

/**
 * Representasi tabel `password_resets` pada ERD
 */
export interface PasswordReset {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

// ============================================================
// REQUEST / RESPONSE PAYLOADS
// ============================================================

export interface LoginRequest {
  identifier: string; // email atau username
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface MfaVerifyRequest {
  code: string;
  user_id: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// ============================================================
// AUTH STORE STATE (Zustand)
// ============================================================

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
  is_loading: boolean;
  requires_mfa: boolean;
  mfa_user_id: number | null;
}
