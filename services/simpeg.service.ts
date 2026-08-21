import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  UnitKerja,
  Jabatan,
  JabatanFungsionalAkademik,
  Pegawai,
  RiwayatJabatan,
  RiwayatPendidikanPegawai,
  PegawaiFilterParams,
  DokumenPegawai,
  PengajuanCuti,
  PresensiPegawai,
  GajiPegawai,
  UsulanJafung,
  PenilaianKinerja,
} from '@/types/simpeg.types';

export const simpegService = {
  // ── UNIT KERJA ──────────────────────────────────────────────
  getUnitKerjaList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/unit-kerja', { params });
    return data;
  },

  getUnitKerjaTree: async (): Promise<ApiResponse<UnitKerja[]>> => {
    const { data } = await apiClient.get<ApiResponse<UnitKerja[]>>('/simpeg/unit-kerja', {
      params: { tree: 1 },
    });
    return data;
  },

  getUnitKerjaDetail: async (id: number): Promise<ApiResponse<UnitKerja>> => {
    const { data } = await apiClient.get<ApiResponse<UnitKerja>>(`/simpeg/unit-kerja/${id}`);
    return data;
  },

  createUnitKerja: async (payload: Partial<UnitKerja>): Promise<ApiResponse<UnitKerja>> => {
    const { data } = await apiClient.post<ApiResponse<UnitKerja>>('/simpeg/unit-kerja', payload);
    return data;
  },

  updateUnitKerja: async (id: number, payload: Partial<UnitKerja>): Promise<ApiResponse<UnitKerja>> => {
    const { data } = await apiClient.put<ApiResponse<UnitKerja>>(`/simpeg/unit-kerja/${id}`, payload);
    return data;
  },

  deleteUnitKerja: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/unit-kerja/${id}`);
    return data;
  },

  // ── JABATAN ──────────────────────────────────────────────────
  getJabatanList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/jabatan', {
      params: typeof params === 'number' ? { unit_kerja_id: params } : params,
    });
    return data;
  },

  createJabatan: async (payload: Partial<Jabatan>): Promise<ApiResponse<Jabatan>> => {
    const { data } = await apiClient.post<ApiResponse<Jabatan>>('/simpeg/jabatan', payload);
    return data;
  },

  updateJabatan: async (id: number, payload: Partial<Jabatan>): Promise<ApiResponse<Jabatan>> => {
    const { data } = await apiClient.put<ApiResponse<Jabatan>>(`/simpeg/jabatan/${id}`, payload);
    return data;
  },

  deleteJabatan: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/jabatan/${id}`);
    return data;
  },

  // ── JABATAN FUNGSIONAL ──────────────────────────────────────
  getJabatanFungsionalList: async (): Promise<ApiResponse<JabatanFungsionalAkademik[]>> => {
    const { data } = await apiClient.get<ApiResponse<JabatanFungsionalAkademik[]>>('/simpeg/jabatan-fungsional');
    return data;
  },

  createJabatanFungsional: async (payload: Partial<JabatanFungsionalAkademik>): Promise<ApiResponse<JabatanFungsionalAkademik>> => {
    const { data } = await apiClient.post<ApiResponse<JabatanFungsionalAkademik>>('/simpeg/jabatan-fungsional', payload);
    return data;
  },

  // ── PEGAWAI ──────────────────────────────────────────────────
  getPegawaiMe: async (): Promise<ApiResponse<Pegawai>> => {
    const { data } = await apiClient.get<ApiResponse<Pegawai>>('/simpeg/pegawai/me');
    return data;
  },

  getPegawaiList: async (params?: PegawaiFilterParams): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get('/simpeg/pegawai', { params });
    return data;
  },

  getPegawaiDetail: async (id: number): Promise<ApiResponse<Pegawai>> => {
    const { data } = await apiClient.get<ApiResponse<Pegawai>>(`/simpeg/pegawai/${id}`);
    return data;
  },

  createPegawai: async (payload: Partial<Pegawai>): Promise<ApiResponse<Pegawai>> => {
    const { data } = await apiClient.post<ApiResponse<Pegawai>>('/simpeg/pegawai', payload);
    return data;
  },

  updatePegawai: async (id: number, payload: Partial<Pegawai>): Promise<ApiResponse<Pegawai>> => {
    const { data } = await apiClient.put<ApiResponse<Pegawai>>(`/simpeg/pegawai/${id}`, payload);
    return data;
  },

  deletePegawai: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/pegawai/${id}`);
    return data;
  },

  // ── RIWAYAT ──────────────────────────────────────────────────
  getRiwayatJabatan: async (pegawaiId: number): Promise<ApiResponse<RiwayatJabatan[]>> => {
    const { data } = await apiClient.get<ApiResponse<RiwayatJabatan[]>>(`/simpeg/pegawai/${pegawaiId}/riwayat-jabatan`);
    return data;
  },

  createRiwayatJabatan: async (pegawaiId: number, payload: Partial<RiwayatJabatan>): Promise<ApiResponse<RiwayatJabatan>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatJabatan>>(`/simpeg/pegawai/${pegawaiId}/riwayat-jabatan`, payload);
    return data;
  },

  getRiwayatPendidikan: async (pegawaiId: number): Promise<ApiResponse<RiwayatPendidikanPegawai[]>> => {
    const { data } = await apiClient.get<ApiResponse<RiwayatPendidikanPegawai[]>>(`/simpeg/pegawai/${pegawaiId}/riwayat-pendidikan`);
    return data;
  },

  createRiwayatPendidikan: async (pegawaiId: number, payload: Partial<RiwayatPendidikanPegawai>): Promise<ApiResponse<RiwayatPendidikanPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<RiwayatPendidikanPegawai>>(`/simpeg/pegawai/${pegawaiId}/riwayat-pendidikan`, payload);
    return data;
  },

  // ── ENTERPRISE FEATURES ─────────────────────────────────────
  // Dokumen E-File
  getDokumenList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/dokumen', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  createDokumen: async (payload: Partial<DokumenPegawai>): Promise<ApiResponse<DokumenPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<DokumenPegawai>>('/simpeg/dokumen', payload);
    return data;
  },

  getSecureDokumenView: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/dokumen/${id}/secure-view`);
    return data;
  },

  deleteDokumen: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/dokumen/${id}`);
    return data;
  },

  // Cuti Online
  getCutiList: async (pegawaiId?: number): Promise<ApiResponse<PengajuanCuti[]>> => {
    const { data } = await apiClient.get<ApiResponse<PengajuanCuti[]>>('/simpeg/cuti', {
      params: pegawaiId ? { pegawai_id: pegawaiId } : undefined,
    });
    return data;
  },

  createCuti: async (payload: Partial<PengajuanCuti>): Promise<ApiResponse<PengajuanCuti>> => {
    const { data } = await apiClient.post<ApiResponse<PengajuanCuti>>('/simpeg/cuti', payload);
    return data;
  },

  updateStatusCuti: async (id: number, status: string, catatan?: string): Promise<ApiResponse<PengajuanCuti>> => {
    const { data } = await apiClient.patch<ApiResponse<PengajuanCuti>>(`/simpeg/cuti/${id}/status`, {
      status_approval: status,
      catatan_approval: catatan,
    });
    return data;
  },

  // Presensi
  getPresensiList: async (pegawaiId?: number, tanggal?: string): Promise<ApiResponse<PresensiPegawai[]>> => {
    const { data } = await apiClient.get<ApiResponse<PresensiPegawai[]>>('/simpeg/presensi', {
      params: { pegawai_id: pegawaiId, tanggal },
    });
    return data;
  },

  createPresensi: async (payload: Partial<PresensiPegawai>): Promise<ApiResponse<PresensiPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<PresensiPegawai>>('/simpeg/presensi', payload);
    return data;
  },

  // Payroll / Gaji
  getPayrollList: async (pegawaiId?: number, periode?: string): Promise<ApiResponse<GajiPegawai[]>> => {
    const { data } = await apiClient.get<ApiResponse<GajiPegawai[]>>('/simpeg/payroll', {
      params: { pegawai_id: pegawaiId, periode },
    });
    return data;
  },

  createPayroll: async (payload: Partial<GajiPegawai>): Promise<ApiResponse<GajiPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<GajiPegawai>>('/simpeg/payroll', payload);
    return data;
  },

  // Usulan Jafung
  getUsulanJafungList: async (pegawaiId?: number): Promise<ApiResponse<UsulanJafung[]>> => {
    const { data } = await apiClient.get<ApiResponse<UsulanJafung[]>>('/simpeg/usulan-jafung', {
      params: pegawaiId ? { pegawai_id: pegawaiId } : undefined,
    });
    return data;
  },

  createUsulanJafung: async (payload: Partial<UsulanJafung>): Promise<ApiResponse<UsulanJafung>> => {
    const { data } = await apiClient.post<ApiResponse<UsulanJafung>>('/simpeg/usulan-jafung', payload);
    return data;
  },

  // Penilaian Kinerja BKD / SKP
  getKinerjaList: async (pegawaiId?: number, tahun?: number): Promise<ApiResponse<PenilaianKinerja[]>> => {
    const { data } = await apiClient.get<ApiResponse<PenilaianKinerja[]>>('/simpeg/penilaian-kinerja', {
      params: { pegawai_id: pegawaiId, tahun },
    });
    return data;
  },

  createKinerja: async (payload: Partial<PenilaianKinerja>): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>('/simpeg/penilaian-kinerja', payload);
    return data;
  },

  // PDDikti Feeder Engine
  getPddiktiStatus: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/pddikti/status');
    return data;
  },

  triggerPddiktiSync: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/pddikti/sync-all');
    return data;
  },
};
