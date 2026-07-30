import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface AppModule {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateModulePayload {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateModulePayload {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export const moduleService = {
  /**
   * Mengambil semua module
   */
  getAllModules: async (): Promise<AppModule[]> => {
    const response = await apiClient.get<ApiResponse<AppModule[]>>('/admin/modules');
    return response.data.data;
  },

  /**
   * Menambah module baru
   */
  createModule: async (payload: CreateModulePayload): Promise<AppModule> => {
    const response = await apiClient.post<ApiResponse<AppModule>>('/admin/modules', payload);
    return response.data.data;
  },

  /**
   * Mengubah module
   */
  updateModule: async (id: number, payload: UpdateModulePayload): Promise<AppModule> => {
    const response = await apiClient.put<ApiResponse<AppModule>>(`/admin/modules/${id}`, payload);
    return response.data.data;
  },

  /**
   * Menghapus module
   */
  deleteModule: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/modules/${id}`);
  },

  /**
   * Mengubah status aktif/nonaktif module
   */
  toggleModuleStatus: async (moduleId: number): Promise<AppModule> => {
    const response = await apiClient.put<ApiResponse<AppModule>>(`/admin/modules/${moduleId}/toggle`);
    return response.data.data;
  }
};
