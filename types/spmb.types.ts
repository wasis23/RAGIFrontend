export interface MasterTipeJalurAlur {
  id?: number;
  nama_tahap: string;
  urutan?: number;
}

export interface MasterTipeJalur {
  id: number;
  kode: string;
  nama: string;
  alur?: MasterTipeJalurAlur[];
  created_at?: string;
  updated_at?: string;
}

export interface JalurMasuk {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  ada_wawancara: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GelombangPenerimaan {
  id: number;
  jalur_masuk_id: number;
  nama: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  tanggal_pengumuman: string | null;
  kuota_total: number;
  kuota_terisi: number;
  biaya_pendaftaran: string | number;
  status: 'draft' | 'aktif' | 'ditutup' | 'selesai';
  created_at: string;
  updated_at: string;
  jalur_masuk?: JalurMasuk;
}

export interface ProgramStudi {
  id: number;
  kode: string;
  nama: string;
  jenjang?: string;
  fakultas?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TahunAkademik {
  id: number;
  kode: string;
  nama: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BerkasRequirement {
  id: number;
  jalur_masuk_id: number;
  jenis_dokumen?: string;
  label?: string;
  wajib?: boolean;
  kode?: string;
  nama_dokumen?: string;
  deskripsi?: string | null;
  is_wajib?: boolean;
  urutan?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  jalur_masuk?: JalurMasuk;
}

export interface BerkasRequirementPayload {
  jalur_masuk_id: number;
  label?: string;
  wajib?: boolean;
  is_active?: boolean;
  jenis_dokumen?: string;
  urutan?: number;
  kode?: string;
  nama_dokumen?: string;
  deskripsi?: string;
  is_wajib?: boolean;
}

export type PendaftaranStatus =
  | 'draft'
  | 'submitted'
  | 'verified'
  | 'lulus_administrasi'
  | 'gagal_administrasi';

export interface PendaftaranBerkasItem {
  id: number;
  pendaftaran_id: number;
  jenis_dokumen: string;
  file_path: string;
  is_verified: boolean;
  catatan?: string | null;
  created_at?: string;
}

export interface PendaftaranAlur {
  id: number;
  pendaftaran_id: number;
  master_tipe_jalur_alur_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  catatan?: string | null;
  master_alur?: MasterTipeJalurAlur;
  created_at?: string;
  updated_at?: string;
}

export interface Pendaftaran {
  id: number;
  gelombang_id: number;
  user_id: number;
  program_studi_id: number;
  program_studi_pilihan2_id?: number | null;
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
  status: PendaftaranStatus;
  catatan_verifikasi?: string | null;
  created_at?: string;
  updated_at?: string;
  gelombang_penerimaan?: GelombangPenerimaan;
  program_studi?: ProgramStudi;
  dokumen_pendaftaran?: PendaftaranBerkasItem[];
  konversi?: KonversiRecord | null;
  progress_alur?: PendaftaranAlur[];
}

export interface StatusHistoryItem {
  id: number;
  pendaftaran_id: number;
  status: string;
  status_lama?: string | null;
  status_baru?: string | null;
  catatan?: string | null;
  created_at: string;
  user?: {
    id: number;
    name?: string;
    username?: string;
  } | null;
}

export interface KonversiRecord {
  id: number;
  pendaftaran_id: number;
  nim?: string | null;
  status?: string;
  processed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  pendaftaran?: Pendaftaran;
}

export interface DaftarUlangInfo {
  pendaftaran_id: number;
  no_pendaftaran?: string;
  nama_lengkap?: string;
  status_daftar_ulang?: 'belum' | 'menunggu_pembayaran' | 'lunas' | string;
  tagihan?: {
    id?: number;
    nomor_tagihan?: string;
    total_bayar?: number;
    status?: string;
  } | null;
  virtual_account?: {
    bank_code?: string;
    va_number?: string;
  } | null;
  konversi?: KonversiRecord | null;
}

export interface StatistikSpmb {
  per_status?: { status: string; total: number }[];
  lulus_per_prodi?: { program_studi_diterima_id: number; nama_prodi?: string; total_lulus: number }[];
  antrian_verifikasi?: number;
  sla_verifikasi?: { id: number; no_pendaftaran: string; nama_lengkap: string; hari_menunggu: number; created_at?: string }[];
  pendaftar_per_hari?: { tanggal: string; total: number }[];
  kuota_prodi?: { program_studi_id: number; nama_prodi?: string; kuota_total: number; kuota_terisi: number }[];
  per_jalur?: { jalur_masuk_id: number; nama_jalur?: string; total: number }[];
  per_gelombang?: { gelombang_id: number; nama_gelombang?: string; total: number }[];
  per_prodi?: { program_studi_id: number; nama_prodi?: string; total: number }[];
}

export type StatusKelulusan = 'lulus' | 'tidak_lulus' | 'cadangan' | 'pending';

export interface PesertaLulusAdm {
  id: number;
  pendaftaran_id?: number;
  no_pendaftaran: string;
  nama_lengkap: string;
  gelombang_id: number;
}

export interface RankingResponse {
  ranking?: any[];
  data?: any[];
}

export interface HasilSeleksi {
  id: number;
  pendaftaran_id: number;
  status: StatusKelulusan;
  nilai_total?: number;
  catatan?: string;
  created_at?: string;
}

export interface Pengumuman {
  id: number;
  gelombang_id?: number | null;
  judul: string;
  konten: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MasterKomponenBiaya {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  tipe_potongan: boolean;
  urutan: number;
  is_active: boolean;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MasterBiayaItem {
  id?: number;
  master_biaya_id?: number;
  komponen_biaya_id: number;
  nominal: number;
  dibebankan_saat_pendaftaran?: boolean;
  keterangan?: string | null;
  komponen_biaya?: MasterKomponenBiaya;
}

export interface BiayaBebanItem {
  komponen_biaya_id: number;
  kode: string;
  nama: string;
  kategori?: string | null;
  nominal: number;
}

export interface BiayaPendaftaranInfo {
  beban_pendaftaran: BiayaBebanItem[];
  total_pendaftaran: number;
  beban_daftar_ulang: BiayaBebanItem[];
  total_daftar_ulang: number;
}

export interface MasterBiayaSpmb {
  id: number;
  gelombang_id: number;
  program_studi_id: number;
  total_biaya: number;
  is_active: boolean;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: MasterBiayaItem[];
  program_studi?: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  };
  gelombang?: {
    id: number;
    nama: string;
    status?: string;
    jalur_masuk?: {
      id: number;
      kode: string;
      nama: string;
    };
  };
}

export interface MasterBiayaMatrixRow {
  master_biaya_id: number | null;
  program_studi_id: number;
  program_studi: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  };
  gelombang_id: number | null;
  components: Record<string, number>;
  total_biaya: number;
  is_active: boolean;
  keterangan?: string | null;
}
