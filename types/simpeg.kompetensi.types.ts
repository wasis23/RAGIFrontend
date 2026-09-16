import type { Pegawai } from './simpeg.types';

export interface MasterJenisSertifikasi {
  id: number;
  nama: string;
  kode: string;
  deskripsi?: string;
  is_active: boolean;
}

export interface MasterJenisTes {
  id: number;
  nama: string;
  kode: string;
  kategori: string;
  skor_min: number;
  skor_max: number;
  deskripsi?: string;
  is_active: boolean;
}

export interface MasterJenisPelatihan {
  id: number;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
}

export interface MasterPeranPelatihan {
  id: number;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
}

export interface MasterTingkatKegiatan {
  id: number;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
}

export interface KompetensiMasters {
  jenis_sertifikasi: MasterJenisSertifikasi[];
  jenis_tes: MasterJenisTes[];
  jenis_pelatihan: MasterJenisPelatihan[];
  peran_pelatihan: MasterPeranPelatihan[];
  tingkat_kegiatan: MasterTingkatKegiatan[];
}

export interface SertifikasiDosen {
  id: number;
  pegawai_id: number;
  jenis_sertifikasi_id: number;
  nama_sertifikat: string;
  bidang_studi: string;
  nomor_registrasi?: string | null;
  nomor_sk?: string | null;
  tahun_sertifikasi: number;
  penyelenggara: string;
  file_path?: string | null;
  tautan?: string | null;
  created_at?: string;
  updated_at?: string;
  pegawai?: Pegawai;
  jenis_sertifikasi?: MasterJenisSertifikasi;
}

export interface RiwayatTes {
  id: number;
  pegawai_id: number;
  jenis_tes_id: number;
  nama_tes: string;
  penyelenggara: string;
  tahun: number;
  skor: number;
  masa_berlaku?: string | null;
  file_path?: string | null;
  tautan?: string | null;
  created_at?: string;
  updated_at?: string;
  pegawai?: Pegawai;
  jenis_tes?: MasterJenisTes;
}

export interface RiwayatPelatihan {
  id: number;
  pegawai_id: number;
  nama_kegiatan: string;
  jenis_pelatihan_id?: number | null;
  peran_id: number;
  tingkat_id?: number | null;
  tanggal_mulai: string;
  tanggal_selesai?: string | null;
  jumlah_jam?: number | null;
  penyelenggara: string;
  tempat?: string | null;
  nomor_sertifikat?: string | null;
  file_path?: string | null;
  tautan?: string | null;
  created_at?: string;
  updated_at?: string;
  pegawai?: Pegawai;
  jenis_pelatihan?: MasterJenisPelatihan;
  peran?: MasterPeranPelatihan;
  tingkat?: MasterTingkatKegiatan;
}
