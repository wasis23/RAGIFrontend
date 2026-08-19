import api from '@/lib/axios';
import type {
  HasilCat,
  HasilSeleksi,
  JadwalUjian,
  MataUji,
  PaketSoal,
  PengawasUjian,
  Pengumuman,
  PesertaLulusAdm,
  PesertaUjian,
  RankingResponse,
  SoalCat,
  StatusKelulusan,
  TipeSoalCat,
} from '@/types/spmb.types';

export interface MataUjiPayload {
  gelombang_id: number;
  kode: string;
  nama: string;
  deskripsi?: string;
  bobot: number;
  durasi_menit: number;
  is_active?: boolean;
}

export interface SoalCatPayload {
  mata_uji_id?: number;
  pertanyaan: string;
  tipe: TipeSoalCat;
  opsi?: Record<string, string> | null;
  kunci_jawaban: string;
  bobot: number;
  urutan?: number;
}

export interface JawabCatPayload {
  peserta_ujian_id: number;
  soal_id: number;
  jawaban: string;
  ragu_ragu: boolean;
}

export interface JadwalUjianPayload {
  gelombang_id: number;
  nama_sesi: string;
  tipe_ujian: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
}

export interface AssignPengawasPayload {
  user_id: number;
}

export interface NilaiSeleksiPayload {
  pendaftaran_id: number;
  komponen: string;
  nilai: number;
  catatan?: string;
}

export interface PengumumanPayload {
  gelombang_id?: number | null;
  judul: string;
  konten: string;
}

export const spmbUjianService = {
  // Mata Uji
  getMataUji: async (params?: { gelombang_id?: number | string }) => {
    const response = await api.get('/spmb/mata-uji', { params });
    return response.data as { data: MataUji[] };
  },

  getMataUjiById: async (id: number | string) => {
    const response = await api.get(`/spmb/mata-uji/${id}`);
    return response.data as { data: MataUji };
  },

  createMataUji: async (data: MataUjiPayload) => {
    const response = await api.post('/spmb/mata-uji', data);
    return response.data;
  },

  updateMataUji: async (id: number | string, data: Partial<MataUjiPayload>) => {
    const response = await api.put(`/spmb/mata-uji/${id}`, data);
    return response.data;
  },

  deleteMataUji: async (id: number | string) => {
    const response = await api.delete(`/spmb/mata-uji/${id}`);
    return response.data;
  },

  // Bank Soal CAT
  getSoal: async (params: { mata_uji_id: number | string }) => {
    const response = await api.get('/spmb/soal', { params });
    return response.data as { data: SoalCat[] };
  },

  createSoal: async (data: SoalCatPayload) => {
    const response = await api.post('/spmb/soal', data);
    return response.data;
  },

  updateSoal: async (id: number | string, data: Partial<SoalCatPayload>) => {
    const response = await api.put(`/spmb/soal/${id}`, data);
    return response.data;
  },

  deleteSoal: async (id: number | string) => {
    const response = await api.delete(`/spmb/soal/${id}`);
    return response.data;
  },

  // Sesi CAT
  mulaiSesiCat: async (jadwalUjianId: number | string) => {
    const response = await api.post(`/spmb/cat/sesi/${jadwalUjianId}/mulai`);
    return response.data;
  },

  selesaiSesiCat: async (jadwalUjianId: number | string) => {
    const response = await api.post(`/spmb/cat/sesi/${jadwalUjianId}/selesai`);
    return response.data;
  },

  getPaketSoal: async (pesertaUjianId: number | string) => {
    const response = await api.get(`/spmb/cat/paket/${pesertaUjianId}`);
    return response.data as { data: PaketSoal };
  },

  jawabSoal: async (data: JawabCatPayload) => {
    const response = await api.post('/spmb/cat/jawab', data);
    return response.data;
  },

  hitungSkorSesi: async (jadwalUjianId: number | string) => {
    const response = await api.post(`/spmb/cat/sesi/${jadwalUjianId}/skor`);
    return response.data;
  },

  getHasilCat: async (params: { gelombang_id: number | string }) => {
    const response = await api.get('/spmb/cat/hasil', { params });
    return response.data as { data: HasilCat[] };
  },

  // Jadwal Ujian (endpoint existing, dibungkus di sini agar page tidak memanggil api langsung)
  getJadwalUjian: async (params?: { gelombang_id?: number | string }) => {
    const response = await api.get('/spmb/jadwal-ujian', { params });
    return response.data as { data: JadwalUjian[] };
  },

  getJadwalUjianById: async (id: number | string) => {
    const response = await api.get(`/spmb/jadwal-ujian/${id}`);
    return response.data as { data: JadwalUjian };
  },

  createJadwalUjian: async (data: JadwalUjianPayload) => {
    const response = await api.post('/spmb/jadwal-ujian', data);
    return response.data;
  },

  plottingOtomatis: async (jadwalUjianId: number | string) => {
    const response = await api.post(`/spmb/jadwal-ujian/${jadwalUjianId}/plotting-otomatis`);
    return response.data;
  },

  assignPeserta: async (jadwalUjianId: number | string, pendaftaranIds: (number | string)[]) => {
    const response = await api.post(`/spmb/jadwal-ujian/${jadwalUjianId}/assign-peserta`, {
      pendaftaran_ids: pendaftaranIds,
    });
    return response.data;
  },

  // Pengawas
  getPengawas: async (jadwalUjianId: number | string) => {
    const response = await api.get(`/spmb/jadwal-ujian/${jadwalUjianId}/pengawas`);
    return response.data as { data: PengawasUjian[] };
  },

  assignPengawas: async (jadwalUjianId: number | string, data: AssignPengawasPayload) => {
    const response = await api.post(`/spmb/jadwal-ujian/${jadwalUjianId}/pengawas`, data);
    return response.data;
  },

  getSesiSayaPengawas: async () => {
    const response = await api.get('/spmb/pengawas/sesi-saya');
    return response.data as { data: JadwalUjian[] };
  },

  getPesertaJadwal: async (jadwalUjianId: number | string) => {
    const response = await api.get(`/spmb/jadwal-ujian/${jadwalUjianId}`);
    return response.data as { data: JadwalUjian & { peserta?: PesertaUjian[] } };
  },

  tandaiHadir: async (pesertaUjianId: number | string, hadir: boolean) => {
    const response = await api.post(`/spmb/pengawas/${pesertaUjianId}/hadir`, { hadir });
    return response.data;
  },

  // Seleksi
  getPesertaLulusAdm: async (params: { gelombang_id: number | string }) => {
    const response = await api.get('/spmb/seleksi/peserta-lulus-adm', { params });
    return response.data as { data: PesertaLulusAdm[] };
  },

  simpanNilaiSeleksi: async (data: NilaiSeleksiPayload) => {
    const response = await api.post('/spmb/seleksi/nilai', data);
    return response.data;
  },

  getRanking: async (params: { gelombang_id: number | string; program_studi_id: number | string }) => {
    const response = await api.get('/spmb/seleksi/ranking', { params });
    return response.data as { data: RankingResponse };
  },

  tetapkanHasilSeleksi: async (gelombangId: number | string) => {
    const response = await api.post('/spmb/seleksi/tetapkan', { gelombang_id: gelombangId });
    return response.data;
  },

  mundurSeleksi: async (pendaftaranId: number | string) => {
    const response = await api.post(`/spmb/seleksi/${pendaftaranId}/mundur`);
    return response.data as { data?: { promosikan?: HasilSeleksi | null } };
  },

  // Hasil seleksi (list status per peserta setelah penetapan)
  getHasilSeleksi: async (params: { gelombang_id: number | string; status?: StatusKelulusan }) => {
    const response = await api.get('/spmb/seleksi/hasil', { params });
    return response.data as { data: HasilSeleksi[] };
  },

  // Pengumuman
  getPengumuman: async (params?: { gelombang_id?: number | string }) => {
    const response = await api.get('/spmb/pengumuman', { params });
    return response.data as { data: Pengumuman[] };
  },

  createPengumuman: async (data: PengumumanPayload) => {
    const response = await api.post('/spmb/pengumuman', data);
    return response.data;
  },

  updatePengumuman: async (id: number | string, data: Partial<PengumumanPayload>) => {
    const response = await api.put(`/spmb/pengumuman/${id}`, data);
    return response.data;
  },

  deletePengumuman: async (id: number | string) => {
    const response = await api.delete(`/spmb/pengumuman/${id}`);
    return response.data;
  },

  publishPengumuman: async (id: number | string, isPublished: boolean) => {
    const response = await api.post(`/spmb/pengumuman/${id}/publish`, { is_published: isPublished });
    return response.data;
  },

  getPengumumanPublished: async () => {
    const response = await api.get('/spmb/pengumuman/published');
    return response.data as { data: Pengumuman[] };
  },
};
