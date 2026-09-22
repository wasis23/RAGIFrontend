import apiClient from '@/lib/axios';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type {
  KasKecilUnit,
  KasKecilTransaksi,
  KasKecilPengajuan,
  ReferensiKasKecil,
  FakultasRingkas,
} from '@/types/sikeu.types';

// ============================================================
// Kas Kecil (Petty Cash) Service — SIKEU
// Base: /api/v1/sikeu/kas-kecil
// ============================================================

export interface KasKecilUnitQuery {
  search?: string;
  fakultas_id?: number | string;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface KasKecilUnitPayload {
  nama_kas: string;
  fakultas_id: number;
  penanggung_jawab_id: number;
  akun_keuangan_id: number;
  saldo_awal: number;
  deskripsi?: string;
}

export interface UpdateKasKecilUnitPayload {
  nama_kas: string;
  fakultas_id: number;
  penanggung_jawab_id: number;
  akun_keuangan_id: number;
  deskripsi?: string;
  status: boolean;
}

export interface KasKecilTransaksiQuery {
  search?: string;
  kategori_id?: number | string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
  page?: number;
  per_page?: number;
}

export interface KasKecilPengajuanQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface KasKecilPengajuanPayload {
  judul_pengajuan: string;
  keperluan?: string;
  nominal_diajukan: number;
}

export interface TransaksiKasUnitListResponse {
  status?: string;
  message?: string;
  data?: KasKecilTransaksi[];
  meta?: PaginationMeta;
  saldo_saat_ini?: number | string;
}

export const kasKecilService = {
  // ---- Unit Kas Kecil ----
  listUnits: async (params?: KasKecilUnitQuery) => {
    const { data } = await apiClient.get<ApiResponse<KasKecilUnit[]>>('/v1/sikeu/kas-kecil', { params });
    return data;
  },

  detailUnit: async (id: number | string) => {
    const { data } = await apiClient.get<ApiResponse<KasKecilUnit>>(`/v1/sikeu/kas-kecil/${id}`);
    return data;
  },

  createUnit: async (payload: KasKecilUnitPayload) => {
    const { data } = await apiClient.post<ApiResponse<KasKecilUnit>>('/v1/sikeu/kas-kecil', payload);
    return data;
  },

  updateUnit: async (id: number | string, payload: UpdateKasKecilUnitPayload) => {
    const { data } = await apiClient.put<ApiResponse<KasKecilUnit>>(`/v1/sikeu/kas-kecil/${id}`, payload);
    return data;
  },

  // ---- Transaksi Kas Kecil ----
  listTransaksi: async (unitId: number | string, params?: KasKecilTransaksiQuery) => {
    const { data } = await apiClient.get<TransaksiKasUnitListResponse>(
      `/v1/sikeu/kas-kecil/${unitId}/transaksi`,
      { params }
    );
    return data;
  },

  createTransaksi: async (unitId: number | string, form: FormData) => {
    const { data } = await apiClient.post<ApiResponse<KasKecilTransaksi>>(
      `/v1/sikeu/kas-kecil/${unitId}/transaksi`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  // ---- Pengajuan Kas Langsung (Top-up) ----
  listPengajuan: async (unitId: number | string, params?: KasKecilPengajuanQuery) => {
    const { data } = await apiClient.get<ApiResponse<KasKecilPengajuan[]>>(
      `/v1/sikeu/kas-kecil/${unitId}/pengajuan`,
      { params }
    );
    return data;
  },

  createPengajuan: async (unitId: number | string, payload: KasKecilPengajuanPayload) => {
    const { data } = await apiClient.post<ApiResponse<KasKecilPengajuan>>(
      `/v1/sikeu/kas-kecil/${unitId}/pengajuan`,
      payload
    );
    return data;
  },

  approvePengajuan: async (pengajuanId: number | string, nominal_disetujui?: number) => {
    const { data } = await apiClient.post<ApiResponse<KasKecilPengajuan>>(
      `/v1/sikeu/kas-kecil/pengajuan/${pengajuanId}/approve`,
      nominal_disetujui ? { nominal_disetujui } : {}
    );
    return data;
  },

  rejectPengajuan: async (pengajuanId: number | string, catatan_penolakan: string) => {
    const { data } = await apiClient.post<ApiResponse<KasKecilPengajuan>>(
      `/v1/sikeu/kas-kecil/pengajuan/${pengajuanId}/reject`,
      { catatan_penolakan }
    );
    return data;
  },

  deletePengajuan: async (pengajuanId: number | string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/v1/sikeu/kas-kecil/pengajuan/${pengajuanId}`
    );
    return data;
  },

  // ---- Referensi Dinamis (tanpa hardcode) ----
  referensiKategori: async () => {
    const { data } = await apiClient.get<ApiResponse<ReferensiKasKecil[]>>('/v1/sikeu/kas-kecil/referensi/kategori');
    return data;
  },

  referensiPetugas: async (q?: string) => {
    const { data } = await apiClient.get<ApiResponse<Array<{ id: number; label: string; username: string }>>>(
      '/v1/sikeu/kas-kecil/referensi/petugas',
      { params: q ? { q } : {} }
    );
    return data;
  },

  referensiFakultas: async () => {
    const { data } = await apiClient.get<ApiResponse<FakultasRingkas[]>>('/v1/sikeu/referensi/fakultas');
    return data;
  },
};