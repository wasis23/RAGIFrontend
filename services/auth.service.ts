import apiClient from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MfaVerifyRequest,
  ChangePasswordRequest,
  User,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

// ============================================================
// AUTH SERVICE — Semua pemanggilan API autentikasi Laravel Sanctum
// ============================================================

export const authService = {
  /**
   * POST /auth/login
   * Login dengan email/username + password ke Laravel Sanctum
   */
  login: async (payload: LoginRequest): Promise<any> => {
    const body = {
      email: payload.identifier,
      username: payload.identifier,
      identifier: payload.identifier,
      password: payload.password,
      remember_me: payload.remember_me,
    };
    const { data } = await apiClient.post('/auth/login', body);
    return data;
  },

  /**
   * POST /auth/register
   * Daftar akun baru
   */
  register: async (payload: any): Promise<any> => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  /**
   * POST /auth/logout
   * Invalidate token di server
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  refreshToken: async (refresh_token: string) => {
    const { data } = await apiClient.post('/auth/refresh', { refresh_token });
    return data;
  },

  /**
   * GET /auth/me
   * Ambil data user yang sedang login
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  /**
   * POST /auth/forgot-password
   * Kirim email reset password
   */
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', payload);
    return data;
  },

  /**
   * POST /auth/reset-password
   * Reset password dengan token dari email
   */
  resetPassword: async (payload: ResetPasswordRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/reset-password', payload);
    return data;
  },

  /**
   * POST /auth/verify-email
   * Verifikasi email dengan token
   */
  verifyEmail: async (token: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/verify-email', { token });
    return data;
  },

  /**
   * POST /auth/mfa/verify
   * Verifikasi kode TOTP (2FA)
   */
  verifyMfa: async (payload: MfaVerifyRequest): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/mfa/verify', payload);
    return data;
  },

  /**
   * POST /auth/mfa/setup
   * Konfirmasi setup 2FA
   */
  setupMfa: async (payload: { secret: string; code: string }): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/mfa/setup', payload);
    return data;
  },

  /**
   * POST /auth/mfa/disable
   * Nonaktifkan 2FA dengan password
   */
  disableMfa: async (payload: { password: string }): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/mfa/disable', payload);
    return data;
  },

  /**
   * POST /auth/change-password
   * Ganti password user yang sedang login
   */
  changePassword: async (payload: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/change-password', payload);
    return data;
  },
};
