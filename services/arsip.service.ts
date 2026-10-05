import apiClient from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  ArsipDashboardData,
  NomorSurat,
  KopSurat,
  RequestNomorSurat,
  KlasifikasiSurat,
  GenerateNomorSuratPayload,
  ApplyRequestNomorSuratPayload,
  VerifyRequestNomorSuratPayload,
} from '@/types/arsip.types';

export const arsipService = {
  // ── DASHBOARD ──────────────────────────────────────────────────
  getDashboard: async (): Promise<ApiResponse<ArsipDashboardData>> => {
    const { data } = await apiClient.get<ApiResponse<ArsipDashboardData>>('/arsip/dashboard');
    return data;
  },

  // ── NOMOR SURAT ───────────────────────────────────────────────
  getNomorSuratList: async (params?: Record<string, any>): Promise<PaginatedResponse<NomorSurat>> => {
    const { data } = await apiClient.get<PaginatedResponse<NomorSurat>>('/arsip/nomor-surat', { params });
    return data;
  },

  getNomorSuratDetail: async (id: number): Promise<ApiResponse<NomorSurat>> => {
    const { data } = await apiClient.get<ApiResponse<NomorSurat>>(`/arsip/nomor-surat/${id}`);
    return data;
  },

  generateNomorSurat: async (payload: GenerateNomorSuratPayload): Promise<ApiResponse<NomorSurat | NomorSurat[]>> => {
    const { data } = await apiClient.post<ApiResponse<NomorSurat | NomorSurat[]>>('/arsip/nomor-surat', payload);
    return data;
  },

  updateNomorSurat: async (id: number, payload: Partial<NomorSurat>): Promise<ApiResponse<NomorSurat>> => {
    const { data } = await apiClient.put<ApiResponse<NomorSurat>>(`/arsip/nomor-surat/${id}`, payload);
    return data;
  },

  batalkanNomorSurat: async (id: number, alasan: string): Promise<ApiResponse<NomorSurat>> => {
    const { data } = await apiClient.post<ApiResponse<NomorSurat>>(`/arsip/nomor-surat/${id}/batalkan`, { alasan });
    return data;
  },

  // ── KOP SURAT (2 VERSI) ───────────────────────────────────────
  getKopSuratList: async (params?: Record<string, any>): Promise<PaginatedResponse<KopSurat>> => {
    const { data } = await apiClient.get<PaginatedResponse<KopSurat>>('/arsip/kop-surat', { params });
    return data;
  },

  getKopSuratByYear: async (year?: number): Promise<ApiResponse<KopSurat>> => {
    const { data } = await apiClient.get<ApiResponse<KopSurat>>('/arsip/kop-surat/by-year', {
      params: year ? { year } : undefined,
    });
    return data;
  },

  getKopSuratDetail: async (id: number): Promise<ApiResponse<KopSurat>> => {
    const { data } = await apiClient.get<ApiResponse<KopSurat>>(`/arsip/kop-surat/${id}`);
    return data;
  },

  storeKopSurat: async (formData: FormData): Promise<ApiResponse<KopSurat>> => {
    const { data } = await apiClient.post<ApiResponse<KopSurat>>('/arsip/kop-surat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateKopSurat: async (id: number, formData: FormData): Promise<ApiResponse<KopSurat>> => {
    const { data } = await apiClient.post<ApiResponse<KopSurat>>(`/arsip/kop-surat/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { _method: 'PUT' },
    });
    return data;
  },

  deleteKopSurat: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/arsip/kop-surat/${id}`);
    return data;
  },

  toggleActiveKopSurat: async (id: number): Promise<ApiResponse<KopSurat>> => {
    const { data } = await apiClient.post<ApiResponse<KopSurat>>(`/arsip/kop-surat/${id}/toggle-active`);
    return data;
  },

  // ── REQUEST NOMOR SURAT ───────────────────────────────────────
  getRequestList: async (params?: Record<string, any>): Promise<PaginatedResponse<RequestNomorSurat>> => {
    const { data } = await apiClient.get<PaginatedResponse<RequestNomorSurat>>('/arsip/request-nomor', { params });
    return data;
  },

  getRequestDetail: async (id: number): Promise<ApiResponse<RequestNomorSurat>> => {
    const { data } = await apiClient.get<ApiResponse<RequestNomorSurat>>(`/arsip/request-nomor/${id}`);
    return data;
  },

  applyRequest: async (payload: ApplyRequestNomorSuratPayload): Promise<ApiResponse<RequestNomorSurat>> => {
    const formData = new FormData();
    formData.append('module_origin', payload.module_origin);
    formData.append('perihal', payload.perihal);
    if (payload.tujuan) formData.append('tujuan', payload.tujuan);
    formData.append('tanggal_surat', payload.tanggal_surat);
    formData.append('kode_unit', payload.kode_unit);
    formData.append('kode_klasifikasi', payload.kode_klasifikasi);
    if (payload.jumlah_nomor) formData.append('jumlah_nomor', String(payload.jumlah_nomor));
    if (payload.catatan_pemohon) formData.append('catatan_pemohon', payload.catatan_pemohon);
    if (payload.lampiran) formData.append('lampiran', payload.lampiran);

    const { data } = await apiClient.post<ApiResponse<RequestNomorSurat>>('/arsip/request-nomor', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  verifyRequest: async (id: number, payload: VerifyRequestNomorSuratPayload): Promise<ApiResponse<RequestNomorSurat>> => {
    const { data } = await apiClient.post<ApiResponse<RequestNomorSurat>>(`/arsip/request-nomor/${id}/verify`, payload);
    return data;
  },

  // ── MASTER KLASIFIKASI & KODE UNIT ────────────────────────────
  getKlasifikasiList: async (params?: Record<string, any>): Promise<PaginatedResponse<KlasifikasiSurat> | ApiResponse<KlasifikasiSurat[]>> => {
    const { data } = await apiClient.get<PaginatedResponse<KlasifikasiSurat> | ApiResponse<KlasifikasiSurat[]>>('/arsip/klasifikasi', { params });
    return data;
  },

  getAllKlasifikasi: async (kategori?: string): Promise<KlasifikasiSurat[]> => {
    const { data } = await apiClient.get<ApiResponse<KlasifikasiSurat[]>>('/arsip/klasifikasi', {
      params: { all: true, kategori },
    });
    return data.data || [];
  },

  storeKlasifikasi: async (payload: Partial<KlasifikasiSurat>): Promise<ApiResponse<KlasifikasiSurat>> => {
    const { data } = await apiClient.post<ApiResponse<KlasifikasiSurat>>('/arsip/klasifikasi', payload);
    return data;
  },

  updateKlasifikasi: async (id: number, payload: Partial<KlasifikasiSurat>): Promise<ApiResponse<KlasifikasiSurat>> => {
    const { data } = await apiClient.put<ApiResponse<KlasifikasiSurat>>(`/arsip/klasifikasi/${id}`, payload);
    return data;
  },

  deleteKlasifikasi: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/arsip/klasifikasi/${id}`);
    return data;
  },
};
