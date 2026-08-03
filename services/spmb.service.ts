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
  status: 'draft' | 'submitted' | 'verified' | 'lulus_administrasi' | 'gagal_administrasi';
  gelombang_penerimaan?: GelombangPenerimaan;
}

export const spmbService = {
  // Master Data
  getJalurMasuk: async () => {
    const response = await api.get('/spmb/jalur-masuk');
    return response.data;
  },

  createJalurMasuk: async (data: Partial<JalurMasuk>) => {
    const response = await api.post('/spmb/jalur-masuk', data);
    return response.data;
  },

  updateJalurMasuk: async (id: number, data: Partial<JalurMasuk>) => {
    const response = await api.put(`/spmb/jalur-masuk/${id}`, data);
    return response.data;
  },

  deleteJalurMasuk: async (id: number) => {
    const response = await api.delete(`/spmb/jalur-masuk/${id}`);
    return response.data;
  },
  
  getGelombang: async () => {
    const response = await api.get('/spmb/gelombang');
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

  // Admin Seleksi
  getPendaftar: async (params?: { status?: string; gelombang_id?: number; page?: number }) => {
    const response = await api.get('/spmb/pendaftar', { params });
    return response.data;
  },

  verifikasiPendaftar: async (id: number, data: { is_lulus: boolean; catatan?: string }) => {
    const response = await api.post(`/spmb/pendaftar/${id}/verifikasi`, data);
    return response.data;
  },

  tetapkanKelulusan: async (id: number, data: { status: string; nilai_total: number; program_studi_diterima_id?: number; peringkat?: number; catatan?: string }) => {
    const response = await api.post(`/spmb/pendaftar/${id}/kelulusan`, data);
    return response.data;
  },
};
