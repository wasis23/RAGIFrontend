import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  SuratTugas,
  SuratTugasMasters,
  MasterKategoriKegiatanTugas,
  MasterJenisTransportasi,
} from '@/types/simpeg.surat-tugas.types';

export const simpegSuratTugasService = {
  // ── MASTERS DROPDOWN ─────────────────────────────────────────
  getMasters: async (): Promise<ApiResponse<SuratTugasMasters>> => {
    const { data } = await apiClient.get<ApiResponse<SuratTugasMasters>>('/simpeg/surat-tugas/masters');
    return data;
  },

  // ── KATEGORI KEGIATAN CRUD ──────────────────────────────────
  getKategoriList: async (params?: any): Promise<ApiResponse<MasterKategoriKegiatanTugas[]>> => {
    const { data } = await apiClient.get<ApiResponse<MasterKategoriKegiatanTugas[]>>('/simpeg/master/kategori-kegiatan-tugas', { params });
    return data;
  },

  createKategori: async (payload: Partial<MasterKategoriKegiatanTugas>): Promise<ApiResponse<MasterKategoriKegiatanTugas>> => {
    const { data } = await apiClient.post<ApiResponse<MasterKategoriKegiatanTugas>>('/simpeg/master/kategori-kegiatan-tugas', payload);
    return data;
  },

  updateKategori: async (id: number, payload: Partial<MasterKategoriKegiatanTugas>): Promise<ApiResponse<MasterKategoriKegiatanTugas>> => {
    const { data } = await apiClient.put<ApiResponse<MasterKategoriKegiatanTugas>>(`/simpeg/master/kategori-kegiatan-tugas/${id}`, payload);
    return data;
  },

  deleteKategori: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/master/kategori-kegiatan-tugas/${id}`);
    return data;
  },

  // ── JENIS TRANSPORTASI CRUD ─────────────────────────────────
  getTransportasiList: async (params?: any): Promise<ApiResponse<MasterJenisTransportasi[]>> => {
    const { data } = await apiClient.get<ApiResponse<MasterJenisTransportasi[]>>('/simpeg/master/jenis-transportasi', { params });
    return data;
  },

  createTransportasi: async (payload: Partial<MasterJenisTransportasi>): Promise<ApiResponse<MasterJenisTransportasi>> => {
    const { data } = await apiClient.post<ApiResponse<MasterJenisTransportasi>>('/simpeg/master/jenis-transportasi', payload);
    return data;
  },

  updateTransportasi: async (id: number, payload: Partial<MasterJenisTransportasi>): Promise<ApiResponse<MasterJenisTransportasi>> => {
    const { data } = await apiClient.put<ApiResponse<MasterJenisTransportasi>>(`/simpeg/master/jenis-transportasi/${id}`, payload);
    return data;
  },

  deleteTransportasi: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/master/jenis-transportasi/${id}`);
    return data;
  },

  // ── SURAT TUGAS LIST & DETAIL ────────────────────────────────
  getList: async (params?: any): Promise<ApiResponse<SuratTugas[]>> => {
    const { data } = await apiClient.get<ApiResponse<SuratTugas[]>>('/simpeg/surat-tugas', {
      params,
    });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<SuratTugas>> => {
    const { data } = await apiClient.get<ApiResponse<SuratTugas>>(`/simpeg/surat-tugas/${id}`);
    return data;
  },

  create: async (formData: FormData): Promise<ApiResponse<SuratTugas>> => {
    const { data } = await apiClient.post<ApiResponse<SuratTugas>>('/simpeg/surat-tugas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: number, formData: FormData): Promise<ApiResponse<SuratTugas>> => {
    const { data } = await apiClient.post<ApiResponse<SuratTugas>>(`/simpeg/surat-tugas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  approve: async (id: number, payload: {
    status: 'disetujui' | 'ditolak';
    nomor_surat?: string;
    catatan_approval?: string;
    file_surat_tugas?: File | null;
  }): Promise<ApiResponse<SuratTugas>> => {
    const formData = new FormData();
    formData.append('status', payload.status);
    if (payload.nomor_surat) formData.append('nomor_surat', payload.nomor_surat);
    if (payload.catatan_approval) formData.append('catatan_approval', payload.catatan_approval);
    if (payload.file_surat_tugas) formData.append('file_surat_tugas', payload.file_surat_tugas);

    const { data } = await apiClient.post<ApiResponse<SuratTugas>>(`/simpeg/surat-tugas/${id}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  uploadLpj: async (id: number, payload: {
    file_lpj: File;
    laporan_kegiatan?: string;
    biaya_realisasi?: number;
  }): Promise<ApiResponse<SuratTugas>> => {
    const formData = new FormData();
    formData.append('file_lpj', payload.file_lpj);
    if (payload.laporan_kegiatan) formData.append('laporan_kegiatan', payload.laporan_kegiatan);
    if (payload.biaya_realisasi !== undefined) formData.append('biaya_realisasi', payload.biaya_realisasi.toString());

    const { data } = await apiClient.post<ApiResponse<SuratTugas>>(`/simpeg/surat-tugas/${id}/lpj`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/surat-tugas/${id}`);
    return data;
  },
};
