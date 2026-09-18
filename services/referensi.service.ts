import apiClient from '@/lib/axios';
import { ApiResponse, PaginationMeta } from '@/types/api.types';

export interface MasterTipeReferensi {
  id: number;
  kode: string;
  nama: string;
  modul: string;
  deskripsi?: string | null;
  urutan: number;
  is_active: boolean;
  items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTipeReferensiPayload {
  kode: string;
  nama: string;
  modul: string;
  deskripsi?: string;
  urutan?: number;
  is_active?: boolean;
}

export interface UpdateTipeReferensiPayload {
  kode?: string;
  nama: string;
  modul: string;
  deskripsi?: string;
  urutan?: number;
  is_active?: boolean;
}

export interface PaginatedReferensiResult<T> {
  data: T[];
  meta?: PaginationMeta;
}

function extractPaginated<T>(payload: any): PaginatedReferensiResult<T> {
  if (Array.isArray(payload)) return { data: payload };
  if (payload && Array.isArray(payload.data)) {
    const { data: rows, ...rest } = payload;
    const meta: PaginationMeta = {
      current_page: rest.current_page ?? 1,
      last_page: rest.last_page ?? 1,
      per_page: rest.per_page ?? rows.length,
      total: rest.total ?? rows.length,
      from: rest.from,
      to: rest.to,
    };
    return { data: rows, meta };
  }
  return { data: [] };
}

export interface ReferensiQueryParams {
  modul?: string;
  tipe?: string;
  search?: string;
  is_active?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}
export interface MasterReferensiItem {
  id: number;
  tipe: string;
  modul: string;
  kode: string | null;
  nama: string;
  urutan: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReferensiCategory {
  tipe: string;
  nama?: string;
  modul: string;
  deskripsi?: string;
  total_items: number;
}

export interface ReferensiCategoriesResponse {
  categories: ReferensiCategory[];
  modules: { modul: string; total_items: number }[];
}

export const tipeReferensiService = {
  /**
   * Mengambil daftar master tipe referensi
   */
  getAll: async (params?: {
    modul?: string;
    search?: string;
    is_active?: boolean;
  }): Promise<MasterTipeReferensi[]> => {
    const response = await apiClient.get<ApiResponse<MasterTipeReferensi[]>>(
      '/admin/master-tipe-referensi',
      { params }
    );
    return response.data.data || [];
  },

  /**
   * Mengambil daftar master tipe referensi dengan pagination server-side + sorting
   */
  getPaginated: async (params?: ReferensiQueryParams): Promise<PaginatedReferensiResult<MasterTipeReferensi>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      '/admin/master-tipe-referensi',
      { params }
    );
    return extractPaginated<MasterTipeReferensi>(response.data.data);
  },

  /**
   * Mengambil detail tipe referensi by ID
   */
  getById: async (id: number | string): Promise<MasterTipeReferensi> => {
    const response = await apiClient.get<ApiResponse<MasterTipeReferensi>>(
      `/admin/master-tipe-referensi/${id}`
    );
    return response.data.data!;
  },

  /**
   * Menambah tipe referensi baru
   */
  create: async (payload: CreateTipeReferensiPayload): Promise<MasterTipeReferensi> => {
    const response = await apiClient.post<ApiResponse<MasterTipeReferensi>>(
      '/admin/master-tipe-referensi',
      payload
    );
    return response.data.data!;
  },

  /**
   * Mengubah tipe referensi
   */
  update: async (
    id: number | string,
    payload: UpdateTipeReferensiPayload
  ): Promise<MasterTipeReferensi> => {
    const response = await apiClient.put<ApiResponse<MasterTipeReferensi>>(
      `/admin/master-tipe-referensi/${id}`,
      payload
    );
    return response.data.data!;
  },

  /**
   * Toggle status aktif/non-aktif tipe referensi
   */
  toggleActive: async (id: number | string): Promise<MasterTipeReferensi> => {
    const response = await apiClient.patch<ApiResponse<MasterTipeReferensi>>(
      `/admin/master-tipe-referensi/${id}/toggle`
    );
    return response.data.data!;
  },

  /**
   * Menghapus tipe referensi
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/admin/master-tipe-referensi/${id}`);
  },
};

export const referensiService = {
  /**
   * Mengambil daftar master referensi dengan filter
   */
  getAll: async (params?: {
    modul?: string;
    tipe?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<MasterReferensiItem[]> => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/master-referensi', { params });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * Mengambil daftar master referensi dengan pagination server-side + sorting
   */
  getPaginated: async (params?: ReferensiQueryParams): Promise<PaginatedReferensiResult<MasterReferensiItem>> => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/master-referensi', { params });
    return extractPaginated<MasterReferensiItem>(response.data.data);
  },

  /**
   * Mengambil metadata kategori dan modul untuk filter
   */
  getCategories: async (modul?: string): Promise<ReferensiCategoriesResponse> => {
    const params = modul && modul !== 'all' ? { modul } : undefined;
    const response = await apiClient.get<ApiResponse<ReferensiCategoriesResponse>>(
      '/admin/master-referensi/categories',
      { params }
    );
    return response.data.data || { categories: [], modules: [] };
  },

  /**
   * Mengambil detail referensi by ID
   */
  getById: async (id: number): Promise<MasterReferensiItem> => {
    const response = await apiClient.get<ApiResponse<MasterReferensiItem>>(
      `/admin/master-referensi/${id}`
    );
    return response.data.data!;
  },

  /**
   * Menambah referensi baru
   */
  create: async (payload: {
    tipe: string;
    modul?: string;
    kode?: string;
    nama: string;
    urutan?: number;
    is_active?: boolean;
  }): Promise<MasterReferensiItem> => {
    const response = await apiClient.post<ApiResponse<MasterReferensiItem>>(
      '/admin/master-referensi',
      payload
    );
    return response.data.data!;
  },

  /**
   * Mengubah referensi
   */
  update: async (
    id: number,
    payload: {
      tipe?: string;
      modul?: string;
      kode?: string;
      nama?: string;
      urutan?: number;
      is_active?: boolean;
    }
  ): Promise<MasterReferensiItem> => {
    const response = await apiClient.put<ApiResponse<MasterReferensiItem>>(
      `/admin/master-referensi/${id}`,
      payload
    );
    return response.data.data!;
  },

  /**
   * Toggle status aktif/non-aktif
   */
  toggleActive: async (id: number): Promise<MasterReferensiItem> => {
    const response = await apiClient.patch<ApiResponse<MasterReferensiItem>>(
      `/admin/master-referensi/${id}/toggle`
    );
    return response.data.data!;
  },

  /**
   * Menghapus referensi
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/master-referensi/${id}`);
  },

  /**
   * Endpoint dropdown publik/client by tipe
   */
  getByTipe: async (tipe: string, modul?: string): Promise<MasterReferensiItem[]> => {
    const params = modul ? { modul } : undefined;
    const response = await apiClient.get<ApiResponse<MasterReferensiItem[]>>(
      `/referensi/${tipe}`,
      { params }
    );
    return response.data.data || [];
  },
};
