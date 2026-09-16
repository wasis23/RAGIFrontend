import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  IzinJamKerja,
  IzinJamKerjaMasters,
  SkPegawai,
  SkPegawaiMasters,
} from '@/types/simpeg.izin-sk.types';

export const simpegIzinKerjaService = {
  getMasters: async (): Promise<ApiResponse<IzinJamKerjaMasters>> => {
    const { data } = await apiClient.get<ApiResponse<IzinJamKerjaMasters>>('/simpeg/izin-kerja/masters');
    return data;
  },

  getList: async (params?: Record<string, any>): Promise<ApiResponse<IzinJamKerja[]>> => {
    const { data } = await apiClient.get<ApiResponse<IzinJamKerja[]>>('/simpeg/izin-kerja', { params });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<IzinJamKerja>> => {
    const { data } = await apiClient.get<ApiResponse<IzinJamKerja>>(`/simpeg/izin-kerja/${id}`);
    return data;
  },

  create: async (formData: FormData): Promise<ApiResponse<IzinJamKerja>> => {
    const { data } = await apiClient.post<ApiResponse<IzinJamKerja>>('/simpeg/izin-kerja', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: number, formData: FormData): Promise<ApiResponse<IzinJamKerja>> => {
    const { data } = await apiClient.post<ApiResponse<IzinJamKerja>>(`/simpeg/izin-kerja/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  approve: async (id: number, payload: {
    status: 'disetujui' | 'ditolak';
    catatan_approval?: string;
  }): Promise<ApiResponse<IzinJamKerja>> => {
    const { data } = await apiClient.post<ApiResponse<IzinJamKerja>>(`/simpeg/izin-kerja/${id}/approve`, payload);
    return data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/izin-kerja/${id}`);
    return data;
  },
};

export const simpegSkPegawaiService = {
  getMasters: async (): Promise<ApiResponse<SkPegawaiMasters>> => {
    const { data } = await apiClient.get<ApiResponse<SkPegawaiMasters>>('/simpeg/sk-pegawai/masters');
    return data;
  },

  getList: async (params?: Record<string, any>): Promise<ApiResponse<SkPegawai[]>> => {
    const { data } = await apiClient.get<ApiResponse<SkPegawai[]>>('/simpeg/sk-pegawai', { params });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<SkPegawai>> => {
    const { data } = await apiClient.get<ApiResponse<SkPegawai>>(`/simpeg/sk-pegawai/${id}`);
    return data;
  },

  create: async (formData: FormData): Promise<ApiResponse<SkPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<SkPegawai>>('/simpeg/sk-pegawai', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: number, formData: FormData): Promise<ApiResponse<SkPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<SkPegawai>>(`/simpeg/sk-pegawai/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  verify: async (id: number, payload: {
    status_verifikasi: 'terverifikasi' | 'ditolak';
    catatan_verifikasi?: string;
  }): Promise<ApiResponse<SkPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<SkPegawai>>(`/simpeg/sk-pegawai/${id}/verify`, payload);
    return data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/sk-pegawai/${id}`);
    return data;
  },
};
