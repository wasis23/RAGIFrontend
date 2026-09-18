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
  MasterJenisCuti,
  PengajuanCuti,
  PresensiPegawai,
  GajiPegawai,
  UsulanJafung,
  PenilaianKinerja,
  FingerprintDevice,
  FingerprintSyncPayload,
  BulkAssignShiftPayload,
  CutoffReport,
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

  getAvailableRoles: async (): Promise<ApiResponse<{ id: number; name: string; slug: string; description?: string }[]>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/pegawai/roles');
    return data;
  },

  getDashboardStats: async (): Promise<ApiResponse<{
    total_pegawai: number;
    total_dosen: number;
    total_tendik: number;
    total_unit_kerja: number;
    recent_pegawai: Pegawai[];
  }>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/dashboard-stats');
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

  resetFaceBiometric: async (id: number): Promise<ApiResponse<Pegawai>> => {
    const { data } = await apiClient.post<ApiResponse<Pegawai>>(`/simpeg/pegawai/${id}/reset-face`);
    return data;
  },

  downloadPegawaiTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/simpeg/pegawai/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  importPegawai: async (formData: FormData): Promise<ApiResponse<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
    data: any[];
  }>> => {
    const { data } = await apiClient.post('/simpeg/pegawai/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  createDokumen: async (payload: FormData | Partial<DokumenPegawai>): Promise<ApiResponse<DokumenPegawai>> => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.post<ApiResponse<DokumenPegawai>>('/simpeg/dokumen', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return data;
  },

  getSecureDokumenView: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/dokumen/${id}/secure-view`);
    return data;
  },

  downloadDokumenFile: async (id: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/simpeg/dokumen/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  deleteDokumen: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/dokumen/${id}`);
    return data;
  },

  // Master Jenis Izin & Cuti
  getMasterJenisCutiList: async (params?: any): Promise<ApiResponse<MasterJenisCuti[]>> => {
    const { data } = await apiClient.get<ApiResponse<MasterJenisCuti[]>>('/simpeg/master-jenis-cuti', { params });
    return data;
  },

  getMasterJenisCutiDetail: async (id: number): Promise<ApiResponse<MasterJenisCuti>> => {
    const { data } = await apiClient.get<ApiResponse<MasterJenisCuti>>(`/simpeg/master-jenis-cuti/${id}`);
    return data;
  },

  createMasterJenisCuti: async (payload: Partial<MasterJenisCuti>): Promise<ApiResponse<MasterJenisCuti>> => {
    const { data } = await apiClient.post<ApiResponse<MasterJenisCuti>>('/simpeg/master-jenis-cuti', payload);
    return data;
  },

  updateMasterJenisCuti: async (id: number, payload: Partial<MasterJenisCuti>): Promise<ApiResponse<MasterJenisCuti>> => {
    const { data } = await apiClient.put<ApiResponse<MasterJenisCuti>>(`/simpeg/master-jenis-cuti/${id}`, payload);
    return data;
  },

  deleteMasterJenisCuti: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/simpeg/master-jenis-cuti/${id}`);
    return data;
  },

  // Cuti Online
  getCutiList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/cuti', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  createCuti: async (payload: FormData | Partial<PengajuanCuti>): Promise<ApiResponse<PengajuanCuti>> => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.post<ApiResponse<PengajuanCuti>>('/simpeg/cuti', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
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
  getPresensiList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/presensi', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  createPresensi: async (payload: Partial<PresensiPegawai>): Promise<ApiResponse<PresensiPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<PresensiPegawai>>('/simpeg/presensi', payload);
    return data;
  },

  uploadPresensiRekap: async (payload: FormData): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/upload-rekap', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 minutes timeout for processing large SQL dumps
    });
    return data;
  },

  getPresensiDetail: async (id: number | string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/presensi/${id}`);
    return data;
  },

  getPresensiBundleDetail: async (id: number | string, params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/presensi/${id}`, { params });
    return data;
  },

  deletePresensiBundle: async (id: number | string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/presensi/${id}`);
    return data;
  },

  processBundlePayroll: async (id: number | string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/simpeg/presensi/${id}/payroll`);
    return data;
  },

  approvePresensi: async (id: number | string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/simpeg/presensi/${id}/approve`);
    return data;
  },

  setKeteranganPresensi: async (payload: {
    pegawai_id: number;
    tanggal: string;
    status_kehadiran: 'izin' | 'sakit' | 'dinas' | 'alfa';
    catatan?: string;
  }): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/keterangan', payload);
    return data;
  },

  getPresensiSettings: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/presensi/settings');
    return data;
  },

  updatePresensiSettings: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>('/simpeg/presensi/settings', payload);
    return data;
  },

  getOfficeLocations: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/presensi/office-locations');
    return data;
  },

  createOfficeLocation: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/office-locations', payload);
    return data;
  },

  updateOfficeLocation: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/presensi/office-locations/${id}`, payload);
    return data;
  },

  deleteOfficeLocation: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/presensi/office-locations/${id}`);
    return data;
  },

  getShiftTemplates: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/presensi/shift-templates');
    return data;
  },

  updateShiftTemplate: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/presensi/shift-templates/${id}`, payload);
    return data;
  },

  createShiftTemplate: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/shift-templates', payload);
    return data;
  },

  deleteShiftTemplate: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/presensi/shift-templates/${id}`);
    return data;
  },

  getNationalHolidays: async (year?: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/presensi/national-holidays', {
      params: year ? { year } : undefined,
    });
    return data;
  },

  createNationalHoliday: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/national-holidays', payload);
    return data;
  },

  updateNationalHoliday: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/presensi/national-holidays/${id}`, payload);
    return data;
  },

  deleteNationalHoliday: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/presensi/national-holidays/${id}`);
    return data;
  },

  syncNationalHolidays: async (year?: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/national-holidays/sync', year ? { year } : {});
    return data;
  },

  // ── PERANGKAT FINGERPRINT & OTOMASI PRESENSI ────────────────
  getFingerprintDevices: async (): Promise<ApiResponse<FingerprintDevice[]>> => {
    const { data } = await apiClient.get<ApiResponse<FingerprintDevice[]>>('/simpeg/presensi/fingerprint-devices');
    return data;
  },

  createFingerprintDevice: async (payload: Partial<FingerprintDevice>): Promise<ApiResponse<FingerprintDevice>> => {
    const { data } = await apiClient.post<ApiResponse<FingerprintDevice>>('/simpeg/presensi/fingerprint-devices', payload);
    return data;
  },

  updateFingerprintDevice: async (id: number, payload: Partial<FingerprintDevice>): Promise<ApiResponse<FingerprintDevice>> => {
    const { data } = await apiClient.put<ApiResponse<FingerprintDevice>>(`/simpeg/presensi/fingerprint-devices/${id}`, payload);
    return data;
  },

  deleteFingerprintDevice: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/simpeg/presensi/fingerprint-devices/${id}`);
    return data;
  },

  testFingerprintDevice: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/simpeg/presensi/fingerprint-devices/${id}/test-connection`);
    return data;
  },

  syncFingerprintLogs: async (payload: FingerprintSyncPayload): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/presensi/fingerprint/sync', payload);
    return data;
  },

  runDailyCutoff: async (params?: { date?: string; unit_kerja_id?: number }): Promise<ApiResponse<CutoffReport>> => {
    const { data } = await apiClient.post<ApiResponse<CutoffReport>>('/simpeg/presensi/daily-cutoff', params || {});
    return data;
  },

  assignShiftBulk: async (payload: BulkAssignShiftPayload): Promise<ApiResponse<{ shift_template_id: number; shift_name: string; total_assigned: number }>> => {
    const { data } = await apiClient.post<ApiResponse<{ shift_template_id: number; shift_name: string; total_assigned: number }>>('/simpeg/presensi/shift-assign-bulk', payload);
    return data;
  },

  getPegawaiOfficeLocations: async (pegawaiId: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/presensi/pegawai/${pegawaiId}/office-locations`);
    return data;
  },

  updatePegawaiOfficeLocations: async (pegawaiId: number, officeLocationIds: number[]): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/presensi/pegawai/${pegawaiId}/office-locations`, {
      office_location_ids: officeLocationIds,
    });
    return data;
  },

  assignOfficesBulk: async (payload: {
    office_location_ids: number[];
    unit_kerja_id?: number | null;
    jenis_pegawai?: string | null;
    pegawai_ids?: number[];
    mode?: 'attach' | 'sync';
  }): Promise<ApiResponse<{ office_location_ids: number[]; total_assigned: number; mode: string }>> => {
    const { data } = await apiClient.post<ApiResponse<{ office_location_ids: number[]; total_assigned: number; mode: string }>>('/simpeg/presensi/office-assign-bulk', payload);
    return data;
  },

  // Payroll / Gaji Fleksibel
  getPayrollList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/payroll', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  getPayrollDetail: async (id: number): Promise<ApiResponse<GajiPegawai>> => {
    const { data } = await apiClient.get<ApiResponse<GajiPegawai>>(`/simpeg/payroll/${id}`);
    return data;
  },

  createPayroll: async (payload: Partial<GajiPegawai>): Promise<ApiResponse<GajiPegawai>> => {
    const { data } = await apiClient.post<ApiResponse<GajiPegawai>>('/simpeg/payroll', payload);
    return data;
  },

  generatePayroll: async (payload: { periode: string; pegawai_id?: number } | string): Promise<ApiResponse<any>> => {
    const body = typeof payload === 'string' ? { periode: payload } : payload;
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/payroll/generate', body);
    return data;
  },

  submitPayrollToSikeu: async (periode: string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/payroll/submit-to-sikeu', { periode });
    return data;
  },

  processPayrollPayment: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/simpeg/payroll/${id}/process-payment`);
    return data;
  },

  // Master Komponen Gaji
  getKomponenGajiList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/payroll/komponen', { params });
    return data;
  },

  createKomponenGaji: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/payroll/komponen', payload);
    return data;
  },

  updateKomponenGaji: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/payroll/komponen/${id}`, payload);
    return data;
  },

  deleteKomponenGaji: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/payroll/komponen/${id}`);
    return data;
  },

  // Master Skala Gaji Pokok (Masa Kerja)
  getSkalaGajiList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/payroll/skala-gaji', { params });
    return data;
  },

  createSkalaGaji: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/simpeg/payroll/skala-gaji', payload);
    return data;
  },

  updateSkalaGaji: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/payroll/skala-gaji/${id}`, payload);
    return data;
  },

  deleteSkalaGaji: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/simpeg/payroll/skala-gaji/${id}`);
    return data;
  },

  // Tunjangan Jabatan Fungsional Akademik (Dosen)
  getJafungTunjanganList: async (params?: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/payroll/jafung-tunjangan', { params });
    return data;
  },

  updateJafungTunjangan: async (id: number, tunjangan_nominal: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/payroll/jafung-tunjangan/${id}`, { tunjangan_nominal });
    return data;
  },

  // Master Bracket Tarif PPh 21 (TER)
  getBracketPph21List: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/simpeg/payroll/bracket-pph21');
    return data;
  },

  updateBracketPph21: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/simpeg/payroll/bracket-pph21/${id}`, payload);
    return data;
  },

  // Komponen Gaji Spesifik Pegawai
  getPegawaiKomponenList: async (pegawaiId: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/simpeg/payroll/pegawai/${pegawaiId}/komponen`);
    return data;
  },

  savePegawaiKomponenList: async (pegawaiId: number, komponen: any[]): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/simpeg/payroll/pegawai/${pegawaiId}/komponen`, { komponen });
    return data;
  },

  // Usulan Jafung
  getUsulanJafungList: async (params?: number | Record<string, any>): Promise<ApiResponse<UsulanJafung[]>> => {
    const { data } = await apiClient.get<ApiResponse<UsulanJafung[]>>('/simpeg/usulan-jafung', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  createUsulanJafung: async (payload: Partial<UsulanJafung>): Promise<ApiResponse<UsulanJafung>> => {
    const { data } = await apiClient.post<ApiResponse<UsulanJafung>>('/simpeg/usulan-jafung', payload);
    return data;
  },

  // Penilaian Kinerja & SKP Butir-per-Butir
  getKinerjaMasters: async (): Promise<ApiResponse<{ kategori_skp: any[]; pejabat_penilai: any[] }>> => {
    const { data } = await apiClient.get<ApiResponse<{ kategori_skp: any[]; pejabat_penilai: any[] }>>('/simpeg/penilaian-kinerja/masters');
    return data;
  },

  getKinerjaList: async (params?: number | Record<string, any>): Promise<ApiResponse<PenilaianKinerja[]>> => {
    const { data } = await apiClient.get<ApiResponse<PenilaianKinerja[]>>('/simpeg/penilaian-kinerja', {
      params: typeof params === 'number' ? { pegawai_id: params } : params,
    });
    return data;
  },

  getKinerjaDetail: async (id: number): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.get<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}`);
    return data;
  },

  createKinerja: async (payload: any): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>('/simpeg/penilaian-kinerja', payload);
    return data;
  },

  updateKinerja: async (id: number, payload: any): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.put<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}`, payload);
    return data;
  },

  deleteKinerja: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/simpeg/penilaian-kinerja/${id}`);
    return data;
  },

  submitTargetKinerja: async (id: number): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}/submit-target`);
    return data;
  },

  approveTargetKinerja: async (id: number): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}/approve-target`);
    return data;
  },

  submitRealisasiKinerja: async (id: number, formData: FormData): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}/submit-realisasi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  evaluateKinerja: async (id: number, payload: any): Promise<ApiResponse<PenilaianKinerja>> => {
    const { data } = await apiClient.post<ApiResponse<PenilaianKinerja>>(`/simpeg/penilaian-kinerja/${id}/evaluate`, payload);
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
