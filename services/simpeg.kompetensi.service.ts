import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  KompetensiMasters,
  SertifikasiDosen,
  RiwayatTes,
  RiwayatPelatihan,
} from '@/types/simpeg.kompetensi.types';

export const simpegKompetensiService = {
  // ── MASTERS ──────────────────────────────────────────────────
  getMasters: async (): Promise<ApiResponse<KompetensiMasters>> => {
    const { data } = await apiClient.get<ApiResponse<KompetensiMasters>>('/simpeg/kompetensi/masters');
    return data;
  },

  // ── SERTIFIKASI DOSEN ─────────────────────────────────────────
  getSertifikasiList: async (params?: any): Promise<ApiResponse<SertifikasiDosen[]>> => {
    const { data } = await apiClient.get<ApiResponse<SertifikasiDosen[]>>('/simpeg/kompetensi/sertifikasi', {
      params,
    });
    return data;
  },

  createSertifikasi: async (formData: FormData): Promise<ApiResponse<SertifikasiDosen>> => {
    const { data } = await apiClient.post<ApiResponse<SertifikasiDosen>>('/simpeg/kompetensi/sertifikasi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateSertifikasi: async (id: number, formData: FormData): Promise<ApiResponse<SertifikasiDosen>> => {
    const { data } = await apiClient.post<ApiResponse<SertifikasiDosen>>(`/simpeg/kompetensi/sertifikasi/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteSertifikasi: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/kompetensi/sertifikasi/${id}`);
    return data;
  },

  // ── RIWAYAT TES (TOEFL, TKDA, TPA) ───────────────────────────
  getTesList: async (params?: any): Promise<ApiResponse<RiwayatTes[]>> => {
    const { data } = await apiClient.get<ApiResponse<RiwayatTes[]>>('/simpeg/kompetensi/tes', {
      params,
    });
    return data;
  },

  createTes: async (formData: FormData): Promise<ApiResponse<RiwayatTes>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatTes>>('/simpeg/kompetensi/tes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateTes: async (id: number, formData: FormData): Promise<ApiResponse<RiwayatTes>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatTes>>(`/simpeg/kompetensi/tes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteTes: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/kompetensi/tes/${id}`);
    return data;
  },

  // ── RIWAYAT PELATIHAN, DIKLAT, WORKSHOP ────────────────────────
  getPelatihanList: async (params?: any): Promise<ApiResponse<RiwayatPelatihan[]>> => {
    const { data } = await apiClient.get<ApiResponse<RiwayatPelatihan[]>>('/simpeg/kompetensi/pelatihan', {
      params,
    });
    return data;
  },

  createPelatihan: async (formData: FormData): Promise<ApiResponse<RiwayatPelatihan>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatPelatihan>>('/simpeg/kompetensi/pelatihan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updatePelatihan: async (id: number, formData: FormData): Promise<ApiResponse<RiwayatPelatihan>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatPelatihan>>(`/simpeg/kompetensi/pelatihan/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deletePelatihan: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/kompetensi/pelatihan/${id}`);
    return data;
  },

  // ── ADMIN PENCARIAN & REKAP ───────────────────────────────────
  searchKompetensiAdmin: async (params?: any): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/simpeg/kompetensi/pencarian', {
      params,
    });
    return data;
  },
};
