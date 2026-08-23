import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';

export const siakadService = {
  // Dashboard & Metrics
  getDashboardSummary: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/dashboard/summary');
    return response.data;
  },

  // Tahun Akademik
  getTahunAkademiks: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/tahun-akademik');
    return response.data;
  },

  storeTahunAkademik: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/tahun-akademik', payload);
    return response.data;
  },

  setActiveTahunAkademik: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/v1/siakad/akademik/tahun-akademik/${id}/set-active`);
    return response.data;
  },

  // Mahasiswa
  getMahasiswas: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/mahasiswa', { params });
    return response.data;
  },

  getMahasiswaDetail: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/mahasiswa/${id}`);
    return response.data;
  },

  createMahasiswa: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa', payload);
    return response.data;
  },

  updateMahasiswa: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/mahasiswa/${id}`, payload);
    return response.data;
  },

  deleteMahasiswa: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/mahasiswa/${id}`);
    return response.data;
  },

  generateNim: async (payload: { program_studi_id: number; angkatan: number; nama_lengkap: string; jenis_kelamin: string; id?: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/generate-nim', payload);
    return response.data;
  },

  generateMissingNims: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/generate-missing-nims');
    return response.data;
  },

  syncMahasiswaFromSpmb: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/sync-from-spmb');
    return response.data;
  },

  // Profil & Biodata Mahasiswa (Self-Service & Neo Feeder)
  getMahasiswaProfil: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/mahasiswa/profil', { params });
    return response.data;
  },

  updateMahasiswaProfil: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/v1/siakad/mahasiswa/profil', payload);
    return response.data;
  },

  syncMahasiswaProfilToFeeder: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/profil/sync-feeder', params);
    return response.data;
  },

  // Konversi Transfer
  getKonversis: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/mahasiswa/konversi', { params });
    return response.data;
  },

  createKonversi: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/konversi', payload);
    return response.data;
  },

  deleteKonversi: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/mahasiswa/konversi/${id}`);
    return response.data;
  },

  updateKonversiStatus: async (id: number, payload: { status: string; catatan?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/v1/siakad/mahasiswa/konversi/${id}/status`, payload);
    return response.data;
  },

  bulkAssignPa: async (payload: { mahasiswa_ids: number[]; dosen_wali_id: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/mahasiswa/bulk-assign-pa', payload);
    return response.data;
  },

  // Fakultas & Program Studi CRUD
  getFakultas: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/fakultas', { params });
    return response.data;
  },

  createFakultas: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/fakultas', payload);
    return response.data;
  },

  updateFakultas: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/akademik/fakultas/${id}`, payload);
    return response.data;
  },

  deleteFakultas: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/akademik/fakultas/${id}`);
    return response.data;
  },

  getProdi: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/prodi', { params });
    return response.data;
  },

  createProdi: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/prodi', payload);
    return response.data;
  },

  updateProdi: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/akademik/prodi/${id}`, payload);
    return response.data;
  },

  deleteProdi: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/akademik/prodi/${id}`);
    return response.data;
  },

  // Kurikulum
  getKurikulums: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/kurikulum', { params });
    return response.data;
  },

  createKurikulum: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/kurikulum', payload);
    return response.data;
  },

  updateKurikulum: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/akademik/kurikulum/${id}`, payload);
    return response.data;
  },

  deleteKurikulum: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/akademik/kurikulum/${id}`);
    return response.data;
  },

  // Mata Kuliah
  getMataKuliahs: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/matakuliah', { params });
    return response.data;
  },

  createMataKuliah: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/matakuliah', payload);
    return response.data;
  },

  updateMataKuliah: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/akademik/matakuliah/${id}`, payload);
    return response.data;
  },

  deleteMataKuliah: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/akademik/matakuliah/${id}`);
    return response.data;
  },

  // Dosen
  getDosens: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/akademik/dosen', { params });
    return response.data;
  },

  createDosen: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/dosen', payload);
    return response.data;
  },

  updateDosen: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/akademik/dosen/${id}`, payload);
    return response.data;
  },

  deleteDosen: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/akademik/dosen/${id}`);
    return response.data;
  },

  // Perkuliahan & Kelas
  getRefRuangan: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/ref/ruangan', { params });
    return response.data;
  },

  getKelas: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/kelas', { params });
    return response.data;
  },

  createKelas: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/perkuliahan/kelas', payload);
    return response.data;
  },

  updateKelas: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/perkuliahan/kelas/${id}`, payload);
    return response.data;
  },

  deleteKelas: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/perkuliahan/kelas/${id}`);
    return response.data;
  },

  // KRS API
  getKrs: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/krs', { params });
    return response.data;
  },

  getActiveKrs: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/krs/active', { params });
    return response.data;
  },

  getAvailableClasses: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/krs/available-classes', { params });
    return response.data;
  },

  addClassToKrs: async (payload: { kelas_id: number; tahun_akademik_id?: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/perkuliahan/krs/add-class', payload);
    return response.data;
  },

  dropClassFromKrs: async (detailId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/perkuliahan/krs/drop-class/${detailId}`);
    return response.data;
  },

  submitKrs: async (payload?: { tahun_akademik_id?: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/perkuliahan/krs/submit', payload);
    return response.data;
  },

  reopenKrs: async (payload?: { tahun_akademik_id?: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/perkuliahan/krs/reopen', payload);
    return response.data;
  },

  approveKrs: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/v1/siakad/perkuliahan/krs/${id}/approve`);
    return response.data;
  },

  bulkApproveKrs: async (krsIds: number[]): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/perkuliahan/krs/bulk-approve', { krs_ids: krsIds });
    return response.data;
  },

  syncDosenFromSimpeg: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/akademik/dosen/sync-from-simpeg');
    return response.data;
  },

  // Nilai & Transkrip
  getNilai: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/nilai', { params });
    return response.data;
  },

  updateNilai: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/v1/siakad/perkuliahan/nilai/${id}`, payload);
    return response.data;
  },

  getTranskrip: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/perkuliahan/transkrip', { params });
    return response.data;
  },

  // OBE (Outcome-Based Education)
  getCpl: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/cpl', { params });
    return response.data;
  },

  storeCpl: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/cpl', payload);
    return response.data;
  },

  getCpmk: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/cpmk', { params });
    return response.data;
  },

  storeCpmk: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/cpmk', payload);
    return response.data;
  },

  getKelasKomponenObe: async (kelasId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/obe/kelas/${kelasId}/komponen`);
    return response.data;
  },

  storeKelasKomponenObe: async (kelasId: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/obe/kelas/${kelasId}/komponen`, payload);
    return response.data;
  },

  deleteKelasKomponenObe: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/obe/komponen/${id}`);
    return response.data;
  },

  getKelasNilaiObe: async (kelasId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/obe/kelas/${kelasId}/nilai`);
    return response.data;
  },

  saveKelasNilaiObe: async (kelasId: number, payload: { krs_detail_id: number; scores: Record<number, number>; is_final?: boolean }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/obe/kelas/${kelasId}/nilai`, payload);
    return response.data;
  },

  getObeDashboard: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/dashboard', { params });
    return response.data;
  },

  getRps: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/rps', { params });
    return response.data;
  },

  showRps: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/obe/rps/${id}`);
    return response.data;
  },

  storeRps: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/rps', payload);
    return response.data;
  },

  submitRps: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/obe/rps/${id}/submit`);
    return response.data;
  },

  approveRps: async (id: number, payload: { status: 'disetujui' | 'revisi'; catatan_revisi?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/v1/siakad/obe/rps/${id}/approve`, payload);
    return response.data;
  },

  getMahasiswaPortofolioObe: async (mahasiswaId?: number | string): Promise<ApiResponse<any>> => {
    const url = mahasiswaId ? `/v1/siakad/obe/mahasiswa/${mahasiswaId}/portofolio` : '/v1/siakad/obe/mahasiswa/portofolio';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Profil Lulusan & Bahan Kajian (OBE)
  getProfilLulusans: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/profil-lulusan', { params });
    return response.data;
  },

  storeProfilLulusan: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/profil-lulusan', payload);
    return response.data;
  },

  deleteProfilLulusan: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/obe/profil-lulusan/${id}`);
    return response.data;
  },

  mapProfilLulusanCpl: async (payload: { profil_lulusan_id: number; cpl_ids: number[] }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/profil-lulusan/cpl', payload);
    return response.data;
  },

  getBahanKajians: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/v1/siakad/obe/bahan-kajian', { params });
    return response.data;
  },

  storeBahanKajian: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/bahan-kajian', payload);
    return response.data;
  },

  deleteBahanKajian: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/v1/siakad/obe/bahan-kajian/${id}`);
    return response.data;
  },

  mapMataKuliahBahanKajian: async (payload: { mata_kuliah_id: number; bahan_kajian_ids: number[] }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/v1/siakad/obe/matakuliah/bahan-kajian', payload);
    return response.data;
  },

  // Absensi Mahasiswa
  getPertemuans: async (kelasId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/perkuliahan/kelas/${kelasId}/pertemuan`);
    return response.data;
  },

  createPertemuan: async (kelasId: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/perkuliahan/kelas/${kelasId}/pertemuan`, payload);
    return response.data;
  },

  getAbsensiList: async (pertemuanId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/v1/siakad/perkuliahan/pertemuan/${pertemuanId}/absensi`);
    return response.data;
  },

  saveAbsensi: async (pertemuanId: number, payload: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/perkuliahan/pertemuan/${pertemuanId}/absensi`, payload);
    return response.data;
  },

  updateModePenilaian: async (taId: number, payload: { mode_penilaian: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/v1/siakad/akademik/tahun-akademik/${taId}/mode-penilaian`, payload);
    return response.data;
  },

  saveBulkNilaiObe: async (kelasId: number, payload: { is_final: boolean; grades: any[] }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/v1/siakad/obe/kelas/${kelasId}/bulk-nilai`, payload);
    return response.data;
  },
};
