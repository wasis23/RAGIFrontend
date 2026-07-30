import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Menu, CreateMenuPayload, UpdateMenuPayload } from '@/types/menu';

export const menuService = {
  /**
   * Mengambil menu untuk user yang sedang login berdasarkan modul.
   */
  getMyMenus: async (module: string = 'sso'): Promise<Menu[]> => {
    const response = await apiClient.get<ApiResponse<Menu[]>>(`/menus/my-menus?module=${module}`);
    return response.data.data;
  },

  /**
   * Mengambil semua menu (Khusus Admin)
   */
  getAllMenus: async (module: string = 'sso'): Promise<Menu[]> => {
    const response = await apiClient.get<ApiResponse<Menu[]>>(`/admin/menus?module=${module}`);
    return response.data.data;
  },

  /**
   * Menambah menu baru (Khusus Admin)
   */
  createMenu: async (payload: CreateMenuPayload): Promise<Menu> => {
    const response = await apiClient.post<ApiResponse<Menu>>('/admin/menus', payload);
    return response.data.data;
  },

  /**
   * Mengubah menu (Khusus Admin)
   */
  updateMenu: async (id: number, payload: UpdateMenuPayload): Promise<Menu> => {
    const response = await apiClient.put<ApiResponse<Menu>>(`/admin/menus/${id}`, payload);
    return response.data.data;
  },

  /**
   * Menghapus menu (Khusus Admin)
   */
  deleteMenu: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/menus/${id}`);
  },

  /**
   * Mengubah status aktif/nonaktif menu (Khusus Admin)
   */
  toggleMenuStatus: async (menuId: number): Promise<Menu> => {
    const response = await apiClient.put<ApiResponse<Menu>>(`/admin/menus/${menuId}/toggle`);
    return response.data.data;
  }
};
