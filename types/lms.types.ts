import { ApiResponse, PaginationMeta } from './api.types';

export interface LmsKelasSetting {
  id?: number;
  kelas_id: number;
  total_pertemuan: number;
  metode_absensi: 'manual_dosen' | 'token_mahasiswa' | 'keduanya';
  batas_min_hadir_persen: number;
  can_submit_late: boolean;
  show_nilai_to_mahasiswa: boolean;
  storage_disk?: string | null;
}

export interface LmsKelasItem {
  id: number;
  program_studi_id: number;
  mata_kuliah_id: number;
  tahun_akademik_id: number;
  kode_kelas: string;
  nama_kelas: string;
  kapasitas: number;
  mata_kuliah?: {
    id: number;
    kode_mk: string;
    nama: string;
    sks_teori: number;
    sks_praktik: number;
    total_sks: number;
  };
  tahun_akademik?: {
    id: number;
    kode: string;
    nama: string;
    semester: string;
    is_aktif: boolean;
  };
  program_studi?: {
    id: number;
    kode_prodi: string;
    nama: string;
    jenjang: string;
  };
  dosen_pengampu?: Array<{
    id: number;
    peran: string;
    dosen?: {
      id: number;
      nidn: string;
      nama_lengkap: string;
    };
  }>;
}

export interface LmsKelasOverview {
  kelas: LmsKelasItem;
  lms_setting: LmsKelasSetting;
  komponen_obe?: Array<{
    id: number;
    nama_komponen: string;
    bobot: number;
    urutan: number;
  }>;
  progress: {
    total_pertemuan_terencana: number;
    pertemuan_selesai: number;
    pertemuan_berjalan: number;
    persentase_selesai: number;
  };
  statistik: {
    total_materi: number;
    total_tugas: number;
    total_izin_pending: number;
    total_mahasiswa_krs: number;
  };
  pertemuan_list: LmsPertemuanItem[];
}

export interface LmsMateriFile {
  id: number;
  materi_id: number;
  nama_file: string;
  file_path: string;
  disk: string;
  mime_type?: string | null;
  ukuran_bytes?: number | null;
}

export interface LmsMateriItem {
  id: number;
  pertemuan_id: number;
  tipe_konten_id?: number | null;
  judul: string;
  deskripsi?: string | null;
  tipe_konten: 'teks' | 'file' | 'link_eksternal' | 'video_embed';
  link_eksternal?: string | null;
  urutan: number;
  is_published: boolean;
  files?: LmsMateriFile[];
  tipe_konten_ref?: {
    id: number;
    kode: string;
    nama: string;
  };
}

export interface LmsTugasItem {
  id: number;
  pertemuan_id: number;
  komponen_penilaian_id?: number | null;
  judul: string;
  deskripsi?: string | null;
  deadline_at?: string | null;
  maks_nilai: number;
  can_submit_late: boolean;
  is_published: boolean;
  komponen_penilaian?: {
    id: number;
    nama_komponen: string;
    bobot: number;
  };
  pengumpulan_count?: number;
  pengumpulan?: LmsPengumpulanTugas[];
}

export interface LmsPengumpulanTugas {
  id: number;
  tugas_id: number;
  mahasiswa_id: number;
  catatan_mahasiswa?: string | null;
  file_path?: string | null;
  nama_file_asli?: string | null;
  ukuran_bytes?: number | null;
  is_late: boolean;
  nilai?: number | null;
  feedback_dosen?: string | null;
  dinilai_at?: string | null;
  mahasiswa?: {
    id: number;
    nim: string;
    nama_lengkap: string;
  };
}

export interface LmsIzinAbsensiItem {
  id: number;
  pertemuan_id: number;
  mahasiswa_id: number;
  tipe_izin_id?: number | null;
  tipe_izin: 'sakit' | 'izin';
  alasan: string;
  surat_path?: string | null;
  status: 'pending' | 'disetujui' | 'ditolak';
  catatan_dosen?: string | null;
  diproses_at?: string | null;
  mahasiswa?: {
    id: number;
    nim: string;
    nama_lengkap: string;
  };
}

export interface LmsPertemuanItem {
  id: number;
  kelas_id: number;
  pertemuan_ke: number;
  tanggal: string;
  materi?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  status_pertemuan?: 'belum_mulai' | 'berlangsung' | 'selesai';
  token_absensi?: string | null;
  token_expired_at?: string | null;
  is_token_active?: boolean;
  materi_list_count?: number;
  tugas_list_count?: number;
  hadir_count?: number;
}

export interface LmsPertemuanDetail {
  pertemuan: LmsPertemuanItem;
  materi_list: LmsMateriItem[];
  tugas_list: LmsTugasItem[];
  absensi_list: Array<{
    id?: number;
    mahasiswa_id: number;
    nim: string;
    nama_lengkap: string;
    status: 'hadir' | 'sakit' | 'izin' | 'alfa' | 'belum_absen';
    catatan?: string | null;
  }>;
  izin_list: LmsIzinAbsensiItem[];
  komponen_obe_list?: Array<{
    id: number;
    nama_komponen: string;
    bobot: number;
  }>;
  token_aktif?: boolean;
  token_sisa_detik?: number;
  my_absensi?: {
    id: number;
    status: string;
    catatan?: string | null;
    waktu_absen?: string | null;
  } | null;
  my_pengumpulan?: Record<number, LmsPengumpulanTugas>;
  my_izin?: LmsIzinAbsensiItem | null;
}

export interface LmsRekapAbsensi {
  kelas_id: number;
  total_pertemuan: number;
  batas_min_hadir_persen: number;
  rekapitulasi: Array<{
    mahasiswa_id: number;
    nim: string;
    nama_lengkap: string;
    total_hadir: number;
    total_sakit: number;
    total_izin: number;
    total_alfa: number;
    persentase_kehadiran: number;
    is_memenuhi_syarat: boolean;
    detail_pertemuan: Record<number, string>;
  }>;
}

export type LmsListKelasResponse = ApiResponse<LmsKelasItem[]>;
export type LmsOverviewResponse = ApiResponse<LmsKelasOverview>;
export type LmsPertemuanResponse = ApiResponse<LmsPertemuanDetail>;
export type LmsRekapAbsensiResponse = ApiResponse<LmsRekapAbsensi>;
