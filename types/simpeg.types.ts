// ============================================================
// SIMPEG TYPES — Types & Interfaces for Kepegawaian
// ============================================================

import type { User } from './auth.types';

export type TipeUnitKerja = 'rektorat' | 'fakultas' | 'prodi' | 'lp3m' | 'biro' | 'unit';
export type TipeJabatan = 'struktural' | 'fungsional' | 'teknis';
export type GolonganJafung = 'asisten_ahli' | 'lektor' | 'lektor_kepala' | 'guru_besar';
export type JenisPegawai = 'dosen' | 'tendik' | 'honorer';
export type StatusKepegawaian = 'pns' | 'non_pns' | 'kontrak' | 'tetap_yayasan';
export type StatusPegawai = 'aktif' | 'non_aktif' | 'pensiun' | 'meninggal';
export type JenjangPendidikan = 'sma' | 'd3' | 'd4' | 's1' | 's2' | 's3';

export interface UnitKerja {
  id: number;
  induk_id?: number | null;
  kode: string;
  nama: string;
  tipe: TipeUnitKerja;
  is_active: boolean;
  parent?: UnitKerja | null;
  children?: UnitKerja[];
  jabatan?: Jabatan[];
  pegawai?: Pegawai[];
  created_at?: string;
  updated_at?: string;
}

export interface Jabatan {
  id: number;
  unit_kerja_id?: number | null;
  nama: string;
  tipe: TipeJabatan;
  level_jabatan: number;
  is_active: boolean;
  unit_kerja?: UnitKerja | null;
  created_at?: string;
  updated_at?: string;
}

export interface JabatanFungsionalAkademik {
  id: number;
  nama: string;
  angka_kredit_min?: number | null;
  angka_kredit_max?: number | null;
  golongan: GolonganJafung;
  created_at?: string;
  updated_at?: string;
}

export interface Pegawai {
  id: number;
  user_id?: number | null;
  unit_kerja_id?: number | null;
  nip?: string | null;
  nik?: string | null;
  nama_lengkap: string;
  tanggal_lahir?: string | null;
  tempat_lahir?: string | null;
  jenis_kelamin: 'L' | 'P';
  agama?: string | null;
  jenis_pegawai: JenisPegawai;
  status_kepegawaian: StatusKepegawaian;
  tanggal_masuk?: string | null;
  tanggal_keluar?: string | null;
  status: StatusPegawai;
  alamat?: string | null;
  telepon?: string | null;
  nomor_rekening?: string | null;
  bank_nama?: string | null;
  user?: User | null;
  unit_kerja?: UnitKerja | null;
  riwayat_jabatan?: RiwayatJabatan[];
  riwayat_pendidikan?: RiwayatPendidikanPegawai[];
  created_at?: string;
  updated_at?: string;
}

export interface RiwayatJabatan {
  id: number;
  pegawai_id: number;
  jabatan_id?: number | null;
  jabatan_fungsional_id?: number | null;
  mulai_jabatan?: string | null;
  selesai_jabatan?: string | null;
  sk_nomor?: string | null;
  sk_tanggal?: string | null;
  file_sk?: string | null;
  is_active: boolean;
  jabatan?: Jabatan | null;
  jabatan_fungsional?: JabatanFungsionalAkademik | null;
  created_at?: string;
  updated_at?: string;
}

export interface RiwayatPendidikanPegawai {
  id: number;
  pegawai_id: number;
  jenjang: JenjangPendidikan;
  nama_institusi: string;
  program_studi?: string | null;
  bidang_ilmu?: string | null;
  tahun_masuk?: number | null;
  tahun_lulus?: number | null;
  nomor_ijazah?: string | null;
  file_ijazah?: string | null;
  is_pendidikan_terakhir: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PegawaiFilterParams {
  search?: string;
  unit_kerja_id?: number;
  jenis_pegawai?: JenisPegawai;
  status?: StatusPegawai;
  page?: number;
  per_page?: number;
}

// ============================================================
// ENTERPRISE SIMPEG TYPES
// ============================================================

export type JenisDokumenPegawai = 'ktp' | 'kk' | 'ijazah' | 'sk' | 'serdos' | 'sertifikat' | 'lainnya';
export type StatusVerifikasiDokumen = 'pending' | 'terverifikasi' | 'ditolak';

export interface DokumenPegawai {
  id: number;
  pegawai_id: number;
  nama_dokumen: string;
  jenis_dokumen: JenisDokumenPegawai;
  file_path: string;
  file_size?: string | null;
  status_verifikasi: StatusVerifikasiDokumen;
  catatan_verifikasi?: string | null;
  pegawai?: Pegawai | null;
  created_at?: string;
  updated_at?: string;
}

export type JenisCuti = 'tahunan' | 'sakit' | 'melahirkan' | 'alasan_penting' | 'besar';
export type StatusApprovalCuti = 'pending' | 'approved' | 'rejected';

export interface PengajuanCuti {
  id: number;
  pegawai_id: number;
  jenis_cuti: JenisCuti;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jumlah_hari: number;
  alasan: string;
  status_approval: StatusApprovalCuti;
  approved_by?: number | null;
  catatan_approval?: string | null;
  file_pendukung?: string | null;
  pegawai?: Pegawai | null;
  approver?: User | null;
  created_at?: string;
  updated_at?: string;
}

export type StatusKehadiran = 'hadir' | 'izin' | 'sakit' | 'alfa' | 'dinas';

export interface PresensiPegawai {
  id: number;
  pegawai_id: number;
  tanggal: string;
  jam_masuk?: string | null;
  jam_keluar?: string | null;
  status_kehadiran: StatusKehadiran;
  lat_long?: string | null;
  foto_presensi?: string | null;
  catatan?: string | null;
  pegawai?: Pegawai | null;
  created_at?: string;
  updated_at?: string;
}

export type StatusTransferGaji = 'draft' | 'submitted_to_sikeu' | 'paid' | 'cancelled';

export interface GajiPegawai {
  id: number;
  pegawai_id: number;
  periode_bulan_tahun: string;
  gaji_pokok: number;
  tunjangan_tetap?: number;
  total_biaya_transport?: number;
  jumlah_hari_hadir_tepat_waktu?: number;
  total_tunjangan: number;
  total_potongan: number;
  gaji_bersih: number;
  status_transfer: StatusTransferGaji;
  tanggal_transfer?: string | null;
  submitted_at?: string | null;
  nomor_rekening?: string | null;
  bank_nama?: string | null;
  catatan?: string | null;
  pegawai?: Pegawai | null;
  created_at?: string;
  updated_at?: string;
}

export type StatusUsulanJafung = 'draft' | 'submitted' | 'diverifikasi' | 'disetujui' | 'ditolak';

export interface UsulanJafung {
  id: number;
  pegawai_id: number;
  jafung_asal_id?: number | null;
  jafung_tujuan_id: number;
  angka_kredit_usulan: number;
  status_usulan: StatusUsulanJafung;
  file_sk_hasil?: string | null;
  catatan_reviewer?: string | null;
  pegawai?: Pegawai | null;
  jafung_asal?: JabatanFungsionalAkademik | null;
  jafung_tujuan?: JabatanFungsionalAkademik | null;
  created_at?: string;
  updated_at?: string;
}

export type SemesterKinerja = 'ganjil' | 'genap' | 'tahunan';
export type PredikatKinerja = 'sangat_baik' | 'baik' | 'cukup' | 'kurang' | 'sangat_kurang';

export interface PenilaianKinerja {
  id: number;
  pegawai_id: number;
  tahun: number;
  semester: SemesterKinerja;
  nilai_skp: number;
  nilai_bkd?: number | null;
  predikat: PredikatKinerja;
  catatan_evaluator?: string | null;
  evaluator_id?: number | null;
  pegawai?: Pegawai | null;
  evaluator?: User | null;
  created_at?: string;
  updated_at?: string;
}
