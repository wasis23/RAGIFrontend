import type { Pegawai } from './simpeg.types';

export interface MasterJenisTransportasi {
  id: number;
  nama: string;
  kode: string;
  is_kendaraan_kampus: boolean;
  urutan: number;
  is_active: boolean;
}

export interface MasterKategoriKegiatanTugas {
  id: number;
  nama: string;
  kode: string;
  deskripsi?: string;
  urutan: number;
  is_active: boolean;
}

export interface SuratTugasMasters {
  kategori_kegiatan: MasterKategoriKegiatanTugas[];
  jenis_transportasi: MasterJenisTransportasi[];
}

export interface SuratTugasAnggota {
  id?: number;
  surat_tugas_id?: number;
  pegawai_id: number;
  peran: string;
  keterangan?: string | null;
  pegawai?: Pegawai;
  created_at?: string;
  updated_at?: string;
}

export type SuratTugasStatus = 'draft' | 'diajukan' | 'disetujui' | 'ditolak' | 'selesai';

export interface SuratTugas {
  id: number;
  nomor_surat?: string | null;
  pegawai_id: number;
  kategori_kegiatan_id: number;
  jenis_transportasi_id: number;
  nama_kegiatan: string;
  tempat_berangkat: string;
  lokasi_tujuan: string;
  tanggal_berangkat: string;
  tanggal_kembali: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  maksud_tujuan?: string | null;
  beban_anggaran?: string | null;
  estimasi_biaya?: number | string | null;
  biaya_realisasi?: number | string | null;
  laporan_kegiatan?: string | null;
  kendaraan_dinas?: string | null;
  nama_driver?: string | null;
  kontak_driver?: string | null;
  keterangan?: string | null;
  file_surat_tugas?: string | null;
  file_lpj?: string | null;
  tanggal_upload_lpj?: string | null;
  status: SuratTugasStatus;
  catatan_approval?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  pegawai?: Pegawai;
  kategori_kegiatan?: MasterKategoriKegiatanTugas;
  jenis_transportasi?: MasterJenisTransportasi;
  anggota?: SuratTugasAnggota[];
  approver?: {
    id: number;
    name?: string;
    username?: string;
    email?: string;
  };
}
