import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';

export const feederService = {
  /**
   * Dapatkan konfigurasi koneksi Feeder
   */
  getConfig: async (): Promise<ApiResponse<{ url: string; username: string; password?: string }>> => {
    const response = await apiClient.get('/v1/siakad/feeder-sync/config');
    return response.data;
  },

  /**
   * Simpan konfigurasi koneksi Feeder
   */
  saveConfig: async (payload: { url: string; username: string; password?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/feeder-sync/config', payload);
    return response.data;
  },

  /**
   * Dapatkan status token terbaru dari Feeder
   */
  getToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.get('/v1/siakad/feeder-sync/token');
    return response.data;
  },

  /**
   * Trigger sinkronisasi batch berdasarkan entity_type
   */
  triggerSync: async (entity_type: 'mahasiswa' | 'dosen' | 'mata_kuliah' | 'kelas' | 'penugasan_dosen'): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/feeder-sync/trigger', { entity_type });
    return response.data;
  },

  /**
   * Dapatkan riwayat log sinkronisasi
   */
  getLogs: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/feeder-sync/logs', { params });
    return response.data;
  },

  /**
   * Dapatkan daftar data penampungan mapping lokal ke ID Feeder
   */
  getMappings: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/feeder-sync/mappings', { params });
    return response.data;
  },
};
