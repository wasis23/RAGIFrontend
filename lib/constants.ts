// ============================================================
// CONSTANTS — Konstanta global untuk SSO Campus
// ============================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SSO Campus';
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// ============================================================
// TOKEN
// ============================================================
export const TOKEN_KEY = 'sso_access_token';
export const REFRESH_TOKEN_KEY = 'sso_refresh_token';
export const USER_KEY = 'sso_user';

// ============================================================
// ROUTES — Daftar route aplikasi
// ============================================================
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  LOGIN_SSO: '/login/sso',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  MFA: '/mfa',

  // Main
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_SESSIONS: '/profile/sessions',
  PROFILE_MFA: '/profile/mfa',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_ROLE_PERMISSIONS: '/admin/role-permissions',
  ADMIN_USER_ROLES: '/admin/user-roles',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
} as const;

// ============================================================
// USER TYPE LABELS — Sesuai ERD: users.user_type enum
// ============================================================
export const USER_TYPE_LABELS: Record<string, string> = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen',
  tendik: 'Tenaga Kependidikan',
  admin: 'Administrator',
  calon_mhs: 'Calon Mahasiswa',
};

export const USER_TYPE_COLORS: Record<string, string> = {
  mahasiswa: 'badge-blue',
  dosen: 'badge-green',
  tendik: 'badge-yellow',
  admin: 'badge-red',
  calon_mhs: 'badge-gray',
};

// ============================================================
// PERMISSION ACTIONS — Sesuai ERD: permissions.action enum
// ============================================================
export const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete', 'approve'] as const;

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  create: 'Buat',
  read: 'Lihat',
  update: 'Ubah',
  delete: 'Hapus',
  approve: 'Setujui',
};

// ============================================================
// MODULES — Modul-modul yang terdaftar di sistem kampus
// Sesuai 10 domain ERD Ekosistem Kampus
// ============================================================
export const SYSTEM_MODULES = [
  { value: 'iam', label: 'IAM & Auth Center' },
  { value: 'spmb', label: 'SPMB' },
  { value: 'siakad', label: 'SIAKAD' },
  { value: 'obe', label: 'OBE' },
  { value: 'simpi', label: 'SIMPI' },
  { value: 'simanta', label: 'SIMANTA' },
  { value: 'simpreskul', label: 'SIMPRESKUL' },
  { value: 'sikeu', label: 'SIKEU' },
  { value: 'simpeg', label: 'SIMPEG' },
  { value: 'lms', label: 'LMS' },
  { value: 'sinapra', label: 'SINAPRA' },
  { value: 'kerjasama', label: 'Kerjasama' },
  { value: 'upm', label: 'UPM' },
] as const;

// ============================================================
// PAGINATION
// ============================================================
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============================================================
// PUBLIC ROUTES — Route yang tidak memerlukan autentikasi
// ============================================================
export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.LOGIN_SSO,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.MFA,
];

// ============================================================
// ADMIN ROUTES — Route yang hanya dapat diakses role admin
// ============================================================
export const ADMIN_ROUTES = [
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_ROLES,
  ROUTES.ADMIN_PERMISSIONS,
  ROUTES.ADMIN_ROLE_PERMISSIONS,
  ROUTES.ADMIN_USER_ROLES,
  ROUTES.ADMIN_SESSIONS,
  ROUTES.ADMIN_AUDIT_LOGS,
];
