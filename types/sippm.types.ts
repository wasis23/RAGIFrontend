// ============================================================
// SIPPM TYPES — Typescript Definitions for SIPPM Module
// (Sistem Informasi Penelitian dan Pengabdian Masyarakat)
// ============================================================

import type { PaginationMeta } from './api.types';

export type JenisKegiatan = 'penelitian' | 'pengabdian';
export type KategoriSkema = 'dasar' | 'terapan' | 'pengembangan';
export type StatusProposal = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'revision' 
  | 'approved' 
  | 'rejected' 
  | 'contracted'
  | 'completed';

export type PeranAnggota = 'ketua' | 'anggota_dosen' | 'anggota_mahasiswa' | 'mitra';
export type StatusReviewer = 'assigned' | 'in_review' | 'completed';
export type RekomendasiReviewer = 'terima' | 'revisi' | 'tolak';

export type StatusPencairan = 'pending' | 'verified' | 'disbursed' | 'rejected';
export type JenisLaporan = 'kemajuan' | 'akhir';
export type StatusLaporan = 'draft' | 'submitted' | 'approved' | 'revision';

export type KategoriPublikasi = 'scopus' | 'wos' | 'sinta_1_2' | 'sinta_3_6' | 'international' | 'national_indexed';
export type KategoriHki = 'paten' | 'paten_sederhana' | 'hak_cipta' | 'merek' | 'desain_industri' | 'buku_ajar' | 'prototype';
export type StatusVerifikasiLuaran = 'pending' | 'verified' | 'rejected';

// ------------------------------------------------------------
// Master Entities
// ------------------------------------------------------------

export interface PeriodeHibah {
  id: number;
  tahun_anggaran: string;
  nama_periode: string;
  tgl_buka: string;
  tgl_tutup: string;
  tgl_tutup_review: string;
  total_anggaran: number;
  is_active: boolean;
  keterangan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SkemaKegiatan {
  id: number;
  nama?: string;
  nama_skema?: string;
  kode?: string;
  kode_skema?: string;
  tipe?: string;
  jenis_kegiatan?: JenisKegiatan;
  sumber_dana?: string;
  kategori_skema?: KategoriSkema;
  maksimal_anggaran?: number;
  maksimal_dana?: number;
  kuota_proposal?: number;
  persyaratan?: string;
  template_proposal_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ------------------------------------------------------------
// Proposal & Anggota
// ------------------------------------------------------------

export interface AnggotaKegiatan {
  id: number;
  proposal_kegiatan_id: number;
  pegawai_id?: number;
  nim?: string;
  nama: string;
  email?: string;
  peran: PeranAnggota;
  instansi_asal?: string;
  tugas?: string;
  created_at?: string;
}

export interface ProposalKegiatan {
  id: number;
  periode_hibah_id: number;
  skema_kegiatan_id: number;
  dosen_ketua_id: number;
  judul: string;
  abstrak: string;
  rumpun_ilmu: string;
  dana_diusulkan: number;
  dana_disetujui?: number;
  status: StatusProposal;
  file_proposal_path?: string;
  file_proposal_url?: string;
  tgl_submission?: string;
  catatan_revisi?: string;
  periode?: PeriodeHibah;
  skema?: SkemaKegiatan;
  ketua?: {
    id: number;
    nip: string;
    nama_lengkap: string;
    program_studi?: string;
  };
  anggota?: AnggotaKegiatan[];
  reviewers?: ReviewerKegiatan[];
  kontrak?: KontrakKegiatan;
  created_at?: string;
  updated_at?: string;
}

// ------------------------------------------------------------
// Reviewer & Penilaian
// ------------------------------------------------------------

export interface PenilaianProposal {
  id: number;
  reviewer_kegiatan_id: number;
  skor_rekam_jejak: number;
  skor_substansi: number;
  skor_rab: number;
  total_skor: number;
  catatan_reviewer?: string;
  rekomendasi: RekomendasiReviewer;
  tgl_penilaian: string;
  created_at?: string;
}

export interface ReviewerKegiatan {
  id: number;
  proposal_kegiatan_id: number;
  reviewer_pegawai_id: number;
  status: StatusReviewer;
  tgl_assigned: string;
  proposal?: ProposalKegiatan;
  reviewer?: {
    id: number;
    nip: string;
    nama_lengkap: string;
  };
  penilaian?: PenilaianProposal;
  created_at?: string;
}

// ------------------------------------------------------------
// Kontrak & Keuangan / Monev
// ------------------------------------------------------------

export interface PencairanDanaHibah {
  id: number;
  kontrak_kegiatan_id: number;
  termin: number; // 1 (70%), 2 (30%)
  persentase: number;
  nominal: number;
  status: StatusPencairan;
  no_sp2d?: string;
  tgl_pencairan?: string;
  file_lpj_path?: string;
  catatan_keuangan?: string;
  created_at?: string;
}

export interface KontrakKegiatan {
  id: number;
  proposal_kegiatan_id: number;
  nomor_kontrak: string;
  nominal_dana: number;
  tgl_mulai: string;
  tgl_selesai: string;
  file_kontrak_url?: string;
  is_signed: boolean;
  proposal?: ProposalKegiatan;
  pencairan?: PencairanDanaHibah[];
  laporan?: LaporanKegiatan[];
  created_at?: string;
}

export interface LaporanKegiatan {
  id: number;
  kontrak_kegiatan_id: number;
  jenis_laporan: JenisLaporan;
  persentase_capaian: number;
  ringkasan_progress: string;
  file_laporan_url?: string;
  status: StatusLaporan;
  catatan_reviewer?: string;
  created_at?: string;
}

// ------------------------------------------------------------
// Luaran (Publikasi & HKI)
// ------------------------------------------------------------

export interface PublikasiIlmiah {
  id: number;
  proposal_id?: number;
  proposal_kegiatan_id?: number;
  pegawai_id: number;
  judul_artikel: string;
  nama_jurnal?: string;
  nama_jurnal_prosiding?: string;
  kategori_publikasi?: KategoriPublikasi;
  jenis_publikasi?: string;
  indexing?: string;
  issn_isbn?: string;
  volume?: string;
  nomor?: string;
  volume_issue_tahun?: string;
  tahun?: number;
  doi?: string;
  url_artikel?: string;
  doi_url?: string;
  status_verifikasi?: StatusVerifikasiLuaran;
  is_verified_lppm?: boolean;
  created_at?: string;
}

export interface HkiDanBuku {
  id: number;
  proposal_id?: number;
  proposal_kegiatan_id?: number;
  pegawai_id: number;
  judul?: string;
  judul_hki?: string;
  jenis_luaran?: string;
  kategori_hki?: KategoriHki;
  nomor_pencatatan_isbn?: string;
  nomor_pendaftaran?: string;
  nomor_sertifikat?: string;
  penerbit_lembaga?: string;
  tgl_terbit_catat?: string;
  tahun?: number;
  file_sertifikat_buku?: string;
  file_sertifikat_url?: string;
  status_verifikasi?: StatusVerifikasiLuaran;
  is_verified_lppm?: boolean;
  created_at?: string;
}

// ------------------------------------------------------------
// Params & Payloads
// ------------------------------------------------------------

export interface ProposalFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  periode_hibah_id?: number;
  skema_kegiatan_id?: number;
  jenis_kegiatan?: JenisKegiatan;
  status?: StatusProposal;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface CreateProposalPayload {
  periode_hibah_id: number;
  skema_kegiatan_id: number;
  judul: string;
  abstrak: string;
  rumpun_ilmu: string;
  dana_diusulkan: number;
  anggota?: Array<{
    pegawai_id?: number;
    nim?: string;
    nama: string;
    email?: string;
    peran: PeranAnggota;
    instansi_asal?: string;
    tugas?: string;
  }>;
  file_proposal?: File;
}

export interface UpdateProposalPayload extends Partial<CreateProposalPayload> {}

export interface CreatePeriodePayload {
  tahun_anggaran: string;
  nama_periode: string;
  tgl_buka: string;
  tgl_tutup: string;
  tgl_tutup_review: string;
  total_anggaran: number;
  is_active?: boolean;
  keterangan?: string;
}

export interface CreateSkemaPayload {
  nama_skema: string;
  kode_skema: string;
  jenis_kegiatan: JenisKegiatan;
  kategori_skema: KategoriSkema;
  maksimal_dana: number;
  kuota_proposal?: number;
  persyaratan?: string;
  is_active?: boolean;
}

export interface AssignReviewerPayload {
  reviewer_pegawai_ids?: number[];
  reviewer_ids?: number[];
}

export interface SubmitPenilaianPayload {
  skor_rekam_jejak: number;
  skor_substansi: number;
  skor_rab: number;
  catatan_reviewer: string;
  rekomendasi: RekomendasiReviewer;
}

export interface FinalizeDecisionPayload {
  status: 'approved' | 'rejected' | 'revision';
  dana_disetujui?: number;
  catatan_revisi?: string;
}

export interface CreateKontrakPayload {
  nomor_kontrak: string;
  nominal_dana: number;
  tgl_mulai: string;
  tgl_selesai: string;
}

export interface RequestPencairanPayload {
  termin: number;
  nominal: number;
  file_lpj?: File;
  catatan_keuangan?: string;
}

export interface SubmitLaporanPayload {
  jenis_laporan: JenisLaporan;
  persentase_capaian: number;
  ringkasan_progress: string;
  file_laporan?: File;
}

export interface CreatePublikasiPayload {
  proposal_kegiatan_id?: number;
  judul_artikel: string;
  nama_jurnal: string;
  kategori_publikasi: KategoriPublikasi;
  issn_isbn?: string;
  volume?: string;
  nomor?: string;
  tahun: number;
  doi_url?: string;
}

export interface CreateHkiPayload {
  proposal_kegiatan_id?: number;
  judul_hki: string;
  kategori_hki: KategoriHki;
  nomor_pendaftaran?: string;
  nomor_sertifikat?: string;
  tahun: number;
}

export interface Iku5StandardProdi {
  id: string;
  unit_kerja_id?: number;
  nama_prodi: string;
  fakultas: string;
  target_scopus: number;
  target_sinta: number;
  target_dikti: number;
  target_internal: number;
  target_hki: number;
  min_capaian_iku: number;
  tahun_akademik: string;
}

