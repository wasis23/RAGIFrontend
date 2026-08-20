import api from '@/lib/axios';

export interface JalurMasuk {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  tipe: 'reguler' | 'transfer' | 'beasiswa' | 'internasional' | 'rpla';
  ada_ujian_tulis: boolean;
  ada_ujian_praktik: boolean;
  ada_wawancara: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GelombangPenerimaan {
  id: number;
  jalur_masuk_id: number;
  tahun_akademik_id: number;
  nama: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  tanggal_ujian: string | null;
  tanggal_pengumuman: string | null;
  kuota_total: number;
  kuota_terisi: number;
  biaya_pendaftaran: number;
  status: 'draft' | 'aktif' | 'ditutup' | 'selesai';
  jalur_masuk?: JalurMasuk;
}

export interface PendaftaranCalonMhs {
  id: number;
  gelombang_id: number;
  user_id: number;
  program_studi_id: number;
  program_studi_pilihan2_id?: number;
  no_pendaftaran: string;
  nim?: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  tempat_lahir: string;
  jenis_kelamin: 'L' | 'P';
  agama?: string;
  kewarganegaraan?: string;
  no_hp?: string;
  alamat?: string;
  provinsi?: string;
  kota_kabupaten?: string;
  kecamatan?: string;
  kode_pos?: string;
  asal_sekolah?: string;
  jurusan_sekolah?: string;
  nilai_rata_rapor?: number;
  tahun_lulus?: string;
  npsn_sekolah?: string;
  nama_ayah?: string;
  pekerjaan_ayah?: string;
  nama_ibu?: string;
  pekerjaan_ibu?: string;
  penghasilan_ortu?: string;
  nama_wali?: string;
  telepon_wali?: string;
  status: 'draft' | 'submitted' | 'verified' | 'lulus_administrasi' | 'gagal_administrasi' | string;
  status_pembayaran?: 'belum_bayar' | 'sebagian' | 'lunas' | 'gratis' | string;
  catatan_verifikasi?: string;
  created_at?: string;
  updated_at?: string;
  gelombang_penerimaan?: GelombangPenerimaan;
  program_studi?: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  };
  program_studi_pilihan2?: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
    phone?: string;
  };
  dokumen_pendaftaran?: PendaftaranBerkas[];
}

export interface PendaftaranBerkas {
  id: number;
  pendaftaran_id: number;
  jenis_berkas?: string;
  jenis_dokumen?: string;
  file_path: string;
  is_verified: boolean;
  catatan?: string;
}

export const spmbService = {
  getProgramStudi: async () => {
    const response = await api.get('/spmb/prodi');
    return response.data;
  },

  getJalurMasuk: async () => {
    const response = await api.get('/spmb/jalur');
    return response.data;
  },

  getJalurMasukById: async (id: number) => {
    const response = await api.get(`/spmb/jalur/${id}`);
    return response.data;
  },

  createJalurMasuk: async (data: Partial<JalurMasuk>) => {
    const response = await api.post('/spmb/jalur', data);
    return response.data;
  },

  updateJalurMasuk: async (id: number, data: Partial<JalurMasuk>) => {
    const response = await api.put(`/spmb/jalur/${id}`, data);
    return response.data;
  },

  deleteJalurMasuk: async (id: number) => {
    const response = await api.delete(`/spmb/jalur/${id}`);
    return response.data;
  },
  
  getGelombang: async () => {
    const response = await api.get('/spmb/gelombang');
    return response.data;
  },

  getGelombangById: async (id: number) => {
    const response = await api.get(`/spmb/gelombang/${id}`);
    return response.data;
  },

  createGelombang: async (data: Partial<GelombangPenerimaan>) => {
    const response = await api.post('/spmb/gelombang', data);
    return response.data;
  },

  updateGelombang: async (id: number, data: Partial<GelombangPenerimaan>) => {
    const response = await api.put(`/spmb/gelombang/${id}`, data);
    return response.data;
  },

  deleteGelombang: async (id: number) => {
    const response = await api.delete(`/spmb/gelombang/${id}`);
    return response.data;
  },

  // Pendaftaran (Calon Mhs)
  getMyPendaftaran: async () => {
    const response = await api.get('/spmb/pendaftaran/me');
    return response.data;
  },

  resetPendaftaran: async () => {
    const response = await api.post('/spmb/pendaftaran/reset');
    return response.data;
  },

  reissueVa: async () => {
    const response = await api.post('/spmb/pendaftaran/reissue-va');
    return response.data;
  },

  submitBiodata: async (data: Partial<PendaftaranCalonMhs>) => {
    const response = await api.post('/spmb/pendaftaran/biodata', data);
    return response.data;
  },

  finalizePendaftaran: async () => {
    const response = await api.post('/spmb/pendaftaran/finalize');
    return response.data;
  },

  uploadBerkas: async (data: FormData) => {
    const response = await api.post('/spmb/pendaftaran/berkas', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin Pendaftaran
  getPendaftaran: async (params?: { search?: string; status?: string; order_by?: string; order_dir?: string; page?: number; per_page?: number }) => {
    const response = await api.get('/spmb/pendaftaran', { params });
    return response.data;
  },

  getPendaftaranDetail: async (id: number) => {
    const response = await api.get(`/spmb/pendaftaran/${id}`);
    return response.data;
  },

  verifyBerkasPendaftaran: async (id: number, data: { is_verified: boolean; catatan?: string }) => {
    const response = await api.post(`/spmb/pendaftaran/berkas/${id}/verify`, data);
    return response.data;
  },

  updateStatusPendaftaran: async (id: number, data: { status: string; catatan_verifikasi?: string }) => {
    const response = await api.post(`/spmb/pendaftaran/${id}/status`, data);
    return response.data;
  },

  tetapkanKelulusan: async (id: number, data: { status: string; program_studi_diterima_id?: number; nilai_total?: number; catatan?: string; is_published?: boolean }) => {
    const response = await api.post(`/spmb/pendaftar/${id}/kelulusan`, data);
    return response.data;
  },

  getSikeuTarifList: async (moduleId?: number) => {
    try {
      const url = moduleId ? `/sikeu/master/jenis-biaya?module_id=${moduleId}` : '/sikeu/master/jenis-biaya?module=spmb';
      const response = await api.get(url);
      if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data;
      }
      const allBiaya = await api.get('/sikeu/master/jenis-biaya');
      if (allBiaya.data && Array.isArray(allBiaya.data.data) && allBiaya.data.data.length > 0) {
        return allBiaya.data;
      }
      const fallback = await api.get('/sikeu/master/tarif-spmb');
      return fallback.data;
    } catch {
      return { status: 'success', data: [] };
    }
  },

  getTahunAkademikList: async () => {
    try {
      const response = await api.get('/spmb/tahun-akademik');
      return response.data;
    } catch {
      return { status: 'success', data: [] };
    }
  },

  // Master Tipe Ujian
  getTipeUjian: async (params?: { search?: string; is_active?: boolean }) => {
    const response = await api.get('/spmb/master/tipe-ujian', { params });
    return response.data;
  },

  createTipeUjian: async (data: { kode: string; nama: string; deskripsi?: string; is_active: boolean }) => {
    const response = await api.post('/spmb/master/tipe-ujian', data);
    return response.data;
  },

  updateTipeUjian: async (id: number, data: { kode: string; nama: string; deskripsi?: string; is_active: boolean }) => {
    const response = await api.put(`/spmb/master/tipe-ujian/${id}`, data);
    return response.data;
  },

  deleteTipeUjian: async (id: number) => {
    const response = await api.delete(`/spmb/master/tipe-ujian/${id}`);
    return response.data;
  },
};
