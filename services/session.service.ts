import apiClient from '@/lib/axios';
import type { UserSession } from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const sessionService = {
  /**
   * GET /auth/sessions
   * Ambil sesi aktif user sendiri
   */
  getMySessions: async (): Promise<ApiResponse<UserSession[]>> => {
    const { data } = await apiClient.get<ApiResponse<UserSession[]>>('/auth/sessions');
    return data;
  },

  /**
   * DELETE /auth/sessions/:id
   * Revoke/logout sesi tertentu milik user
   */
  deleteSession: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/auth/sessions/${id}`);
    return data;
  },

  /**
   * DELETE /auth/sessions/others
   * Logout semua sesi kecuali yang sekarang
   */
  deleteAllOtherSessions: async (): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>('/auth/sessions/others');
    return data;
  },

  /**
   * GET /admin/sessions (Admin)
   * Ambil seluruh sesi aktif semua pengguna
   */
  getAllSessions: async (): Promise<ApiResponse<UserSession[]>> => {
    const { data } = await apiClient.get<ApiResponse<UserSession[]>>('/admin/sessions');
    return data;
  },

  /**
   * DELETE /admin/sessions/:id (Admin)
   * Force logout sesi user mana saja oleh admin
   */
  forceLogoutSession: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/sessions/${id}`);
    return data;
  },
};
