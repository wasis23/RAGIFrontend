import type { Pegawai } from './simpeg.types';

// ==========================================
// 1. Izin Parsial Jam Kerja Types
// ==========================================

export interface MasterJenisIzinJamKerja {
  id: number;
  nama: string;
  kode: string;
  tipe_potongan: 'tidak_potong' | 'potong_jam';
  deskripsi?: string | null;
  urutan: number;
  is_active: boolean;
}

export interface IzinJamKerjaMasters {
  jenis_izin: MasterJenisIzinJamKerja[];
}

export type IzinJamKerjaStatus = 'menunggu' | 'disetujui' | 'ditolak';

export interface IzinJamKerja {
  id: number;
  pegawai_id: number;
  master_jenis_izin_id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  alasan: string;
  file_bukti?: string | null;
  file_bukti_url?: string | null;
  status: IzinJamKerjaStatus;
  catatan_approval?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  pegawai?: Pegawai;
  jenis_izin?: MasterJenisIzinJamKerja;
  approver?: {
    id: number;
    name: string;
    username: string;
  } | null;
}

// ==========================================
// 2. Arsip & Pelaporan SK Pegawai Types
// ==========================================

export interface MasterKategoriSk {
  id: number;
  nama: string;
  kode: string;
  deskripsi?: string | null;
  urutan: number;
  is_active: boolean;
}

export interface SkPegawaiMasters {
  kategori_sk: MasterKategoriSk[];
}

export type SkVerifikasiStatus = 'pending' | 'terverifikasi' | 'ditolak';

export interface SkPegawai {
  id: number;
  pegawai_id: number;
  kategori_sk_id: number;
  nomor_sk: string;
  judul_sk: string;
  tanggal_sk: string;
  tmt_sk: string;
  tmt_selesai?: string | null;
  pejabat_penetap: string;
  file_sk: string;
  keterangan?: string | null;
  status_verifikasi: SkVerifikasiStatus;
  catatan_verifikasi?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
  pegawai?: Pegawai;
  kategori_sk?: MasterKategoriSk;
  verifier?: {
    id: number;
    name: string;
    username: string;
  } | null;
}
