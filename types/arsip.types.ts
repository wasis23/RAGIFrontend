export type VersiKopSurat = 'lama' | 'baru';
export type StatusNomorSurat = 'terpakai' | 'direservasi' | 'dibatalkan';
export type StatusRequestNomor = 'menunggu_verifikasi' | 'disetujui' | 'ditolak';
export type KategoriKlasifikasi = 'unit' | 'jenjang' | 'klasifikasi' | 'perihal';

export const KATEGORI_KLASIFIKASI_OPTIONS = [
  { value: 'klasifikasi', label: 'Kode Klasifikasi Surat (Contoh: DI, DII, DIII, DIV)' },
  { value: 'unit', label: 'Kode Unit Kerja / Pengaju (Contoh: REK, BAAK, BAU, LPPM)' },
];

export const FILTER_KATEGORI_KLASIFIKASI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'unit', label: 'Kode Unit' },
  { value: 'klasifikasi', label: 'Kode Klasifikasi' },
];

export const STATUS_ACTIVE_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

export const VERSI_KOP_SURAT_OPTIONS = [
  { value: 'baru', label: 'Versi Baru (Untuk Surat Tahun ≥ 2021)' },
  { value: 'lama', label: 'Versi Lama (Untuk Surat Tahun < 2021)' },
];

export const FILTER_VERSI_KOP_OPTIONS = [
  { value: '', label: 'Semua Versi' },
  { value: 'baru', label: 'Versi Baru (≥ 2021)' },
  { value: 'lama', label: 'Versi Lama (< 2021)' },
];

export const STATUS_NOMOR_SURAT_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'terpakai', label: 'Terpakai' },
  { value: 'direservasi', label: 'Direservasi' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
];

export const STATUS_AWAL_NOMOR_OPTIONS = [
  { value: 'terpakai', label: 'Terpakai (Langsung Resmi Digunakan)' },
  { value: 'direservasi', label: 'Direservasi (Dipesan Sementara)' },
];

export const STATUS_REQUEST_NOMOR_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

export const SORT_DIR_OPTIONS = [
  { value: 'desc', label: 'Z-A / Terbaru' },
  { value: 'asc', label: 'A-Z / Terlama' },
];

export interface KlasifikasiSurat {
  id: number;
  kode: string;
  nama: string;
  kategori: KategoriKlasifikasi | string;
  keterangan?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KopSurat {
  id: number;
  nama: string;
  versi: VersiKopSurat;
  tahun_mulai: number;
  tahun_selesai?: number | null;
  file_path: string;
  file_url?: string | null;
  nama_institusi?: string | null;
  alamat_institusi?: string | null;
  kontak_institusi?: string | null;
  website_institusi?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NomorSurat {
  id: number;
  nomor_surat: string;
  nomor_urut: number;
  kode_unit: string;
  kode_klasifikasi: string;
  bulan_romawi: string;
  tahun: number;
  tanggal_surat: string;
  perihal: string;
  tujuan?: string | null;
  status: StatusNomorSurat;
  module_origin: string;
  request_id?: number | null;
  reference_type?: string | null;
  reference_id?: number | null;
  kop_surat_id?: number | null;
  catatan?: string | null;
  created_by: number;
  created_at: string;
  updated_at?: string;
  pembuat?: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  kop_surat?: KopSurat;
  request?: RequestNomorSurat;
}

export interface RequestNomorSurat {
  id: number;
  kode_request: string;
  module_origin: string;
  user_id: number;
  perihal: string;
  tujuan?: string | null;
  tanggal_surat: string;
  kode_unit: string;
  kode_klasifikasi: string;
  jumlah_nomor: number;
  catatan_pemohon?: string | null;
  dokumen_lampiran_path?: string | null;
  dokumen_lampiran_url?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  status: StatusRequestNomor;
  verified_by?: number | null;
  verified_at?: string | null;
  catatan_verifikasi?: string | null;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  verifikator?: {
    id: number;
    name: string;
    email: string;
  };
  nomor_surat?: NomorSurat[];
}

export interface ArsipDashboardData {
  current_year: number;
  total_nomor_surat: number;
  nomor_surat_tahun_ini: number;
  nomor_surat_terpakai: number;
  nomor_surat_direservasi: number;
  request_pending: number;
  request_disetujui: number;
  total_kop_surat: number;
  kop_status: {
    baru_aktif: boolean;
    lama_aktif: boolean;
  };
  recent_nomor: NomorSurat[];
  recent_requests: RequestNomorSurat[];
}

export interface GenerateNomorSuratPayload {
  mode?: 'satuan' | 'bulk';
  tanggal_surat: string;
  kode_unit: string;
  kode_klasifikasi: string;
  perihal: string;
  tujuan?: string;
  status?: StatusNomorSurat;
  module_origin?: string;
  catatan?: string;
  jumlah_nomor?: number;
  keterangan_item?: string[];
  tujuan_item?: string[];
}

export interface ApplyRequestNomorSuratPayload {
  module_origin: string;
  perihal: string;
  tujuan?: string;
  tanggal_surat: string;
  kode_unit: string;
  kode_klasifikasi: string;
  jumlah_nomor?: number;
  catatan_pemohon?: string;
  lampiran?: File | null;
}

export interface VerifyRequestNomorSuratPayload {
  action: 'setujui' | 'tolak' | 'approve' | 'reject';
  catatan?: string;
  kode_klasifikasi?: string;
  kode_unit?: string;
  perihal?: string;
  tujuan?: string;
}
