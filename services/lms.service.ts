import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import {
  LmsKelasItem,
  LmsKelasOverview,
  LmsPertemuanDetail,
  LmsRekapAbsensi,
  LmsMateriItem,
  LmsTugasItem,
  LmsKelasSetting,
  LmsIzinAbsensiItem,
  LmsPengumpulanTugas,
} from '@/types/lms.types';

export const lmsService = {
  // 1. Kelas LMS
  getMyKelas: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    tahun_akademik_id?: number;
  }): Promise<ApiResponse<LmsKelasItem[]>> => {
    const response = await apiClient.get('/v1/siakad/lms/kelas/my', { params });
    return response.data;
  },

  getKelasOverview: async (kelasId: number): Promise<ApiResponse<LmsKelasOverview>> => {
    const response = await apiClient.get(`/v1/siakad/lms/kelas/${kelasId}/overview`);
    return response.data;
  },

  getRekapAbsensi: async (kelasId: number): Promise<ApiResponse<LmsRekapAbsensi>> => {
    const response = await apiClient.get(`/v1/siakad/lms/kelas/${kelasId}/rekap-absensi`);
    return response.data;
  },

  updateKelasSetting: async (kelasId: number, payload: Partial<LmsKelasSetting>): Promise<ApiResponse<LmsKelasSetting>> => {
    const response = await apiClient.put(`/v1/siakad/lms/kelas/${kelasId}/setting`, payload);
    return response.data;
  },

  // 2. Pertemuan
  getPertemuanDetail: async (pertemuanId: number): Promise<ApiResponse<LmsPertemuanDetail>> => {
    const response = await apiClient.get(`/v1/siakad/lms/pertemuan/${pertemuanId}`);
    return response.data;
  },

  // 3. Materi Pembelajaran
  createMateri: async (pertemuanId: number, formData: FormData): Promise<ApiResponse<LmsMateriItem>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/materi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateMateri: async (materiId: number, payload: Partial<LmsMateriItem>): Promise<ApiResponse<LmsMateriItem>> => {
    const response = await apiClient.put(`/v1/siakad/lms/materi/${materiId}`, payload);
    return response.data;
  },

  deleteMateri: async (materiId: number): Promise<ApiResponse<{ id: number; is_deleted: boolean }>> => {
    const response = await apiClient.delete(`/v1/siakad/lms/materi/${materiId}`);
    return response.data;
  },

  uploadMateriFile: async (materiId: number, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/v1/siakad/lms/materi/${materiId}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteMateriFile: async (fileId: number): Promise<ApiResponse<{ id: number; is_deleted: boolean }>> => {
    const response = await apiClient.delete(`/v1/siakad/lms/materi-file/${fileId}`);
    return response.data;
  },

  // 4. Tugas Perkuliahan & Sinkronisasi Nilai OBE
  createTugas: async (pertemuanId: number, payload: Partial<LmsTugasItem>): Promise<ApiResponse<LmsTugasItem>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/tugas`, payload);
    return response.data;
  },

  updateTugas: async (tugasId: number, payload: Partial<LmsTugasItem>): Promise<ApiResponse<LmsTugasItem>> => {
    const response = await apiClient.put(`/v1/siakad/lms/tugas/${tugasId}`, payload);
    return response.data;
  },

  deleteTugas: async (tugasId: number): Promise<ApiResponse<{ id: number; is_deleted: boolean }>> => {
    const response = await apiClient.delete(`/v1/siakad/lms/tugas/${tugasId}`);
    return response.data;
  },

  beriNilaiTugas: async (
    pengumpulanId: number,
    payload: { nilai: number; feedback_dosen?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/lms/pengumpulan/${pengumpulanId}/nilai`, payload);
    return response.data;
  },

  // 5. Presensi & Token Realtime
  generateTokenAbsensi: async (
    pertemuanId: number
  ): Promise<ApiResponse<{ pertemuan_id: number; token: string; token_expired_at: string; ttl_minutes: number }>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/token`);
    return response.data;
  },

  bulkInputAbsensi: async (
    pertemuanId: number,
    absensi: Array<{ mahasiswa_id: number; status_id: number; catatan?: string }>
  ): Promise<ApiResponse<{ pertemuan_id: number; total_saved: number }>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/bulk-absensi`, { absensi });
    return response.data;
  },

  prosesIzin: async (
    izinId: number,
    payload: { status_id: number; catatan_dosen?: string }
  ): Promise<ApiResponse<LmsIzinAbsensiItem>> => {
    const response = await apiClient.patch(`/v1/siakad/lms/izin/${izinId}/proses`, payload);
    return response.data;
  },

  // 6. Mahasiswa Actions
  getMyAllTugas: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ApiResponse<LmsTugasItem[]>> => {
    const response = await apiClient.get('/v1/siakad/lms/tugas/my', { params });
    return response.data;
  },

  inputTokenAbsensi: async (
    pertemuanId: number,
    token: string
  ): Promise<ApiResponse<{ pertemuan_id: number; is_present: boolean }>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/input-token`, { token });
    return response.data;
  },

  kumpulkanTugas: async (
    tugasId: number,
    formData: FormData
  ): Promise<ApiResponse<LmsPengumpulanTugas>> => {
    const response = await apiClient.post(`/v1/siakad/lms/tugas/${tugasId}/kumpul`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  ajukanIzin: async (
    pertemuanId: number,
    formData: FormData
  ): Promise<ApiResponse<LmsIzinAbsensiItem>> => {
    const response = await apiClient.post(`/v1/siakad/lms/pertemuan/${pertemuanId}/izin`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 7. Download / Berkas Aman
  getDownloadUrl: async (type: 'materi' | 'tugas' | 'izin', id: number): Promise<ApiResponse<{ url: string; file_name: string }>> => {
    const response = await apiClient.get(`/v1/siakad/lms/download/${type}/${id}`);
    return response.data;
  },
};
