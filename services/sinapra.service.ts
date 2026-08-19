import apiClient from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  Gedung,
  GedungFormPayload,
  Ruangan,
  RuanganFormPayload,
  CheckKetersediaanPayload,
  CheckKetersediaanResponse,
  KategoriAset,
  KategoriAsetFormPayload,
  Aset,
  AsetFormPayload,
  PenyusutanAsetResult,
  PeminjamanRuangan,
  ApplyPeminjamanRuanganPayload,
  ApprovePeminjamanRuanganPayload,
  PeminjamanAset,
  ApplyPeminjamanAsetPayload,
  ApprovePeminjamanAsetPayload,
  KembalikanAsetPayload,
  MaintenanceLog,
  MaintenanceLogFormPayload,
  PengajuanPengadaan,
  PengajuanPengadaanFormPayload,
  UpdateStatusPengadaanPayload,
  SinapraFilterParams,
} from '@/types/sinapra.types';

export const sinapraService = {
  // ── GEDUNG ──────────────────────────────────────────────────
  getGedungList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<Gedung>> => {
    const { data } = await apiClient.get<PaginatedResponse<Gedung>>('/sinapra/gedung', { params });
    return data;
  },

  createGedung: async (payload: GedungFormPayload): Promise<ApiResponse<Gedung>> => {
    const { data } = await apiClient.post<ApiResponse<Gedung>>('/sinapra/gedung', payload);
    return data;
  },

  getGedungDetail: async (id: number): Promise<ApiResponse<Gedung>> => {
    const { data } = await apiClient.get<ApiResponse<Gedung>>(`/sinapra/gedung/${id}`);
    return data;
  },

  updateGedung: async (id: number, payload: Partial<GedungFormPayload>): Promise<ApiResponse<Gedung>> => {
    const { data } = await apiClient.put<ApiResponse<Gedung>>(`/sinapra/gedung/${id}`, payload);
    return data;
  },

  deleteGedung: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/gedung/${id}`);
    return data;
  },

  // ── RUANGAN ─────────────────────────────────────────────────
  getRuanganList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<Ruangan>> => {
    const { data } = await apiClient.get<PaginatedResponse<Ruangan>>('/sinapra/ruangan', { params });
    return data;
  },

  createRuangan: async (payload: RuanganFormPayload): Promise<ApiResponse<Ruangan>> => {
    const { data } = await apiClient.post<ApiResponse<Ruangan>>('/sinapra/ruangan', payload);
    return data;
  },

  getRuanganDetail: async (id: number): Promise<ApiResponse<Ruangan>> => {
    const { data } = await apiClient.get<ApiResponse<Ruangan>>(`/sinapra/ruangan/${id}`);
    return data;
  },

  updateRuangan: async (id: number, payload: Partial<RuanganFormPayload>): Promise<ApiResponse<Ruangan>> => {
    const { data } = await apiClient.put<ApiResponse<Ruangan>>(`/sinapra/ruangan/${id}`, payload);
    return data;
  },

  deleteRuangan: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/ruangan/${id}`);
    return data;
  },

  checkKetersediaanRuangan: async (payload: CheckKetersediaanPayload): Promise<ApiResponse<CheckKetersediaanResponse>> => {
    const { data } = await apiClient.post<ApiResponse<CheckKetersediaanResponse>>('/sinapra/ruangan/check-ketersediaan', payload);
    return data;
  },

  // ── KATEGORI ASET ───────────────────────────────────────────
  getKategoriList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<KategoriAset>> => {
    const { data } = await apiClient.get<PaginatedResponse<KategoriAset>>('/sinapra/kategori-aset', { params });
    return data;
  },

  createKategori: async (payload: KategoriAsetFormPayload): Promise<ApiResponse<KategoriAset>> => {
    const { data } = await apiClient.post<ApiResponse<KategoriAset>>('/sinapra/kategori-aset', payload);
    return data;
  },

  getKategoriDetail: async (id: number): Promise<ApiResponse<KategoriAset>> => {
    const { data } = await apiClient.get<ApiResponse<KategoriAset>>(`/sinapra/kategori-aset/${id}`);
    return data;
  },

  updateKategori: async (id: number, payload: Partial<KategoriAsetFormPayload>): Promise<ApiResponse<KategoriAset>> => {
    const { data } = await apiClient.put<ApiResponse<KategoriAset>>(`/sinapra/kategori-aset/${id}`, payload);
    return data;
  },

  deleteKategori: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/kategori-aset/${id}`);
    return data;
  },

  // ── ASET INVENTARIS ─────────────────────────────────────────
  getAsetList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<Aset>> => {
    const { data } = await apiClient.get<PaginatedResponse<Aset>>('/sinapra/aset', { params });
    return data;
  },

  createAset: async (payload: AsetFormPayload): Promise<ApiResponse<Aset>> => {
    const { data } = await apiClient.post<ApiResponse<Aset>>('/sinapra/aset', payload);
    return data;
  },

  getAsetDetail: async (id: number): Promise<ApiResponse<Aset>> => {
    const { data } = await apiClient.get<ApiResponse<Aset>>(`/sinapra/aset/${id}`);
    return data;
  },

  updateAset: async (id: number, payload: Partial<AsetFormPayload>): Promise<ApiResponse<Aset>> => {
    const { data } = await apiClient.put<ApiResponse<Aset>>(`/sinapra/aset/${id}`, payload);
    return data;
  },

  deleteAset: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/aset/${id}`);
    return data;
  },

  hitungPenyusutanAset: async (id: number): Promise<ApiResponse<PenyusutanAsetResult>> => {
    const { data } = await apiClient.get<ApiResponse<PenyusutanAsetResult>>(`/sinapra/aset/${id}/hitung-penyusutan`);
    return data;
  },

  // ── PEMINJAMAN RUANGAN ──────────────────────────────────────
  getPeminjamanRuanganList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<PeminjamanRuangan>> => {
    const { data } = await apiClient.get<PaginatedResponse<PeminjamanRuangan>>('/sinapra/peminjaman-ruangan', { params });
    return data;
  },

  applyPeminjamanRuangan: async (payload: ApplyPeminjamanRuanganPayload): Promise<ApiResponse<PeminjamanRuangan>> => {
    const { data } = await apiClient.post<ApiResponse<PeminjamanRuangan>>('/sinapra/peminjaman-ruangan', payload);
    return data;
  },

  getPeminjamanRuanganDetail: async (id: number): Promise<ApiResponse<PeminjamanRuangan>> => {
    const { data } = await apiClient.get<ApiResponse<PeminjamanRuangan>>(`/sinapra/peminjaman-ruangan/${id}`);
    return data;
  },

  approvePeminjamanRuangan: async (id: number, payload: ApprovePeminjamanRuanganPayload): Promise<ApiResponse<PeminjamanRuangan>> => {
    const { data } = await apiClient.post<ApiResponse<PeminjamanRuangan>>(`/sinapra/peminjaman-ruangan/${id}/approve`, payload);
    return data;
  },

  // ── PEMINJAMAN ASET ─────────────────────────────────────────
  getPeminjamanAsetList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<PeminjamanAset>> => {
    const { data } = await apiClient.get<PaginatedResponse<PeminjamanAset>>('/sinapra/peminjaman-aset', { params });
    return data;
  },

  applyPeminjamanAset: async (payload: ApplyPeminjamanAsetPayload): Promise<ApiResponse<PeminjamanAset>> => {
    const { data } = await apiClient.post<ApiResponse<PeminjamanAset>>('/sinapra/peminjaman-aset', payload);
    return data;
  },

  getPeminjamanAsetDetail: async (id: number): Promise<ApiResponse<PeminjamanAset>> => {
    const { data } = await apiClient.get<ApiResponse<PeminjamanAset>>(`/sinapra/peminjaman-aset/${id}`);
    return data;
  },

  approvePeminjamanAset: async (id: number, payload: ApprovePeminjamanAsetPayload): Promise<ApiResponse<PeminjamanAset>> => {
    const { data } = await apiClient.post<ApiResponse<PeminjamanAset>>(`/sinapra/peminjaman-aset/${id}/approve`, payload);
    return data;
  },

  kembalikanPeminjamanAset: async (id: number, payload: KembalikanAsetPayload): Promise<ApiResponse<PeminjamanAset>> => {
    const { data } = await apiClient.post<ApiResponse<PeminjamanAset>>(`/sinapra/peminjaman-aset/${id}/kembalikan`, payload);
    return data;
  },

  // ── MAINTENANCE / PERAWATAN ──────────────────────────────────
  getMaintenanceList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<MaintenanceLog>> => {
    const { data } = await apiClient.get<PaginatedResponse<MaintenanceLog>>('/sinapra/maintenance', { params });
    return data;
  },

  createMaintenance: async (payload: MaintenanceLogFormPayload): Promise<ApiResponse<MaintenanceLog>> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceLog>>('/sinapra/maintenance', payload);
    return data;
  },

  getMaintenanceDetail: async (id: number): Promise<ApiResponse<MaintenanceLog>> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceLog>>(`/sinapra/maintenance/${id}`);
    return data;
  },

  updateMaintenance: async (id: number, payload: Partial<MaintenanceLogFormPayload>): Promise<ApiResponse<MaintenanceLog>> => {
    const { data } = await apiClient.put<ApiResponse<MaintenanceLog>>(`/sinapra/maintenance/${id}`, payload);
    return data;
  },

  deleteMaintenance: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/maintenance/${id}`);
    return data;
  },

  // ── PENGAJUAN PENGADAAN ─────────────────────────────────────
  getPengadaanList: async (params?: SinapraFilterParams): Promise<PaginatedResponse<PengajuanPengadaan>> => {
    const { data } = await apiClient.get<PaginatedResponse<PengajuanPengadaan>>('/sinapra/pengadaan', { params });
    return data;
  },

  createPengadaan: async (payload: PengajuanPengadaanFormPayload): Promise<ApiResponse<PengajuanPengadaan>> => {
    const { data } = await apiClient.post<ApiResponse<PengajuanPengadaan>>('/sinapra/pengadaan', payload);
    return data;
  },

  getPengadaanDetail: async (id: number): Promise<ApiResponse<PengajuanPengadaan>> => {
    const { data } = await apiClient.get<ApiResponse<PengajuanPengadaan>>(`/sinapra/pengadaan/${id}`);
    return data;
  },

  updateStatusPengadaan: async (id: number, payload: UpdateStatusPengadaanPayload): Promise<ApiResponse<PengajuanPengadaan>> => {
    const { data } = await apiClient.patch<ApiResponse<PengajuanPengadaan>>(`/sinapra/pengadaan/${id}/status`, payload);
    return data;
  },

  deletePengadaan: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/sinapra/pengadaan/${id}`);
    return data;
  },
};
