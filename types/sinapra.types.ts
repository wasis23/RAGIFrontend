// ============================================================
// SINAPRA TYPES — Sarana, Prasarana, & Aset Management
// ============================================================

import type { PaginationParams } from './api.types';

// ------------------------------------------------------------
// 1. Gedung & Ruangan Types
// ------------------------------------------------------------
export interface Gedung {
  id: number;
  kode: string;
  nama: string;
  jumlah_lantai: number;
  alamat?: string;
  tahun_bangun?: number;
  luas_m2?: number;
  status: 'aktif' | 'renovasi' | 'nonaktif';
  ruangan_count?: number;
  ruangan?: Ruangan[];
  created_at?: string;
  updated_at?: string;
}

export interface GedungFormPayload {
  kode: string;
  nama: string;
  jumlah_lantai: number;
  alamat?: string;
  tahun_bangun?: number;
  luas_m2?: number;
  status?: 'aktif' | 'renovasi' | 'nonaktif';
}

export interface Ruangan {
  id: number;
  gedung_id: number;
  kode: string;
  nama: string;
  lantai: number;
  tipe: 'kelas' | 'laboratorium' | 'kantor' | 'aula' | 'gudang' | 'lainnya';
  kapasitas: number;
  luas_m2?: number;
  ada_ac: boolean;
  ada_proyektor: boolean;
  ada_wifi: boolean;
  keterangan?: string;
  status: 'aktif' | 'maintenance' | 'nonaktif';
  gedung?: Gedung;
  created_at?: string;
  updated_at?: string;
}

export interface RuanganFormPayload {
  gedung_id: number;
  kode: string;
  nama: string;
  lantai: number;
  tipe: 'kelas' | 'laboratorium' | 'kantor' | 'aula' | 'gudang' | 'lainnya';
  kapasitas: number;
  luas_m2?: number;
  ada_ac?: boolean;
  ada_proyektor?: boolean;
  ada_wifi?: boolean;
  keterangan?: string;
  status?: 'aktif' | 'maintenance' | 'nonaktif';
}

export interface CheckKetersediaanPayload {
  ruangan_id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface CheckKetersediaanResponse {
  is_available: boolean;
  bentrok_peminjaman?: any;
}

// ------------------------------------------------------------
// 2. Kategori Aset & Inventaris Aset Types
// ------------------------------------------------------------
export interface KategoriAset {
  id: number;
  parent_id?: number;
  kode: string;
  nama: string;
  deskripsi?: string;
  masa_manfaat_tahun?: number;
  tarif_penyusutan_persen?: number;
  children?: KategoriAset[];
  parent?: KategoriAset;
  created_at?: string;
  updated_at?: string;
}

export interface KategoriAsetFormPayload {
  parent_id?: number | null;
  kode: string;
  nama: string;
  deskripsi?: string;
  masa_manfaat_tahun?: number;
  tarif_penyusutan_persen?: number;
}

export interface Aset {
  id: number;
  kategori_id: number;
  ruangan_id?: number;
  kode_aset: string;
  nama: string;
  merk?: string;
  nomor_seri?: string;
  spesifikasi?: string;
  tanggal_perolehan?: string;
  harga_perolehan: number;
  nilai_buku: number;
  kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat';
  status: 'tersedia' | 'dipinjam' | 'maintenance' | 'disetujui_diapkir';
  keterangan?: string;
  kategori?: KategoriAset;
  ruangan?: Ruangan;
  created_at?: string;
  updated_at?: string;
}

export interface AsetFormPayload {
  kategori_id: number;
  ruangan_id?: number | null;
  kode_aset: string;
  nama: string;
  merk?: string;
  nomor_seri?: string;
  spesifikasi?: string;
  tanggal_perolehan?: string;
  harga_perolehan: number;
  kondisi?: 'baik' | 'rusak_ringan' | 'rusak_berat';
  status?: 'tersedia' | 'dipinjam' | 'maintenance' | 'disetujui_diapkir';
  keterangan?: string;
}

export interface PenyusutanAsetResult {
  aset_id: number;
  kode_aset: string;
  nama: string;
  harga_perolehan: number;
  nilai_buku_saat_ini: number;
}

// ------------------------------------------------------------
// 3. Peminjaman Ruangan & Aset Types
// ------------------------------------------------------------
export interface PeminjamanRuangan {
  id: number;
  ruangan_id: number;
  user_id: number;
  disetujui_oleh?: number;
  keperluan: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  status: 'pending' | 'disetujui' | 'ditolak' | 'batal';
  catatan_approver?: string;
  ruangan?: Ruangan;
  user?: { id: number; name: string; email: string };
  approver?: { id: number; name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface ApplyPeminjamanRuanganPayload {
  ruangan_id: number;
  keperluan: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface ApprovePeminjamanRuanganPayload {
  is_approved: boolean;
  catatan_approver?: string;
}

export interface PeminjamanAset {
  id: number;
  aset_id: number;
  user_id: number;
  disetujui_oleh?: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_realisasi?: string;
  status: 'pending' | 'dipinjam' | 'ditolak' | 'kembali';
  kondisi_pinjam: 'baik' | 'rusak_ringan';
  kondisi_kembali?: 'baik' | 'rusak_ringan' | 'rusak_berat';
  catatan_approver?: string;
  aset?: Aset;
  user?: { id: number; name: string; email: string };
  approver?: { id: number; name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface ApplyPeminjamanAsetPayload {
  aset_id: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
}

export interface ApprovePeminjamanAsetPayload {
  is_approved: boolean;
  catatan_approver?: string;
}

export interface KembalikanAsetPayload {
  kondisi_kembali: 'baik' | 'rusak_ringan' | 'rusak_berat';
  catatan?: string;
}

// ------------------------------------------------------------
// 4. Maintenance / Perawatan Types
// ------------------------------------------------------------
export interface MaintenanceLog {
  id: number;
  aset_id?: number;
  ruangan_id?: number;
  dilaporkan_oleh: number;
  ditangani_oleh?: number;
  judul: string;
  deskripsi_kerusakan: string;
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'darurat';
  status: 'dilaporkan' | 'proses' | 'selesai' | 'batal';
  biaya?: number;
  hasil_perbaikan?: string;
  tanggal_selesai?: string;
  aset?: Aset;
  ruangan?: Ruangan;
  pelapor?: { id: number; name: string; email: string };
  teknisi?: { id: number; name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceLogFormPayload {
  aset_id?: number | null;
  ruangan_id?: number | null;
  judul: string;
  deskripsi_kerusakan: string;
  prioritas?: 'rendah' | 'sedang' | 'tinggi' | 'darurat';
  status?: 'dilaporkan' | 'proses' | 'selesai' | 'batal';
  biaya?: number;
  hasil_perbaikan?: string;
}

// ------------------------------------------------------------
// 5. Pengajuan Pengadaan Types
// ------------------------------------------------------------
export interface DetailPengadaan {
  id: number;
  pengajuan_id: number;
  kategori_aset_id?: number;
  nama_barang: string;
  spesifikasi?: string;
  jumlah: number;
  satuan: string;
  harga_satuan_estimasi: number;
  subtotal_estimasi: number;
  kategori?: KategoriAset;
  created_at?: string;
  updated_at?: string;
}

export interface PengajuanPengadaan {
  id: number;
  unit_kerja_id?: number;
  diajukan_oleh: number;
  judul: string;
  alasan_kebutuhan: string;
  tanggal_pengajuan: string;
  estimasi_anggaran: number;
  status: 'draft' | 'diajukan' | 'disetujui' | 'ditolak' | 'proses_beli' | 'selesai';
  disetujui_oleh?: number;
  details?: DetailPengadaan[];
  unit_kerja?: { id: number; nama: string; kode: string };
  pengaju?: { id: number; name: string; email: string };
  approver?: { id: number; name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface DetailPengadaanItemPayload {
  kategori_aset_id?: number | null;
  nama_barang: string;
  spesifikasi?: string;
  jumlah: number;
  satuan: string;
  harga_satuan_estimasi: number;
}

export interface PengajuanPengadaanFormPayload {
  unit_kerja_id?: number | null;
  judul: string;
  alasan_kebutuhan: string;
  details: DetailPengadaanItemPayload[];
}

export interface UpdateStatusPengadaanPayload {
  status: 'disetujui' | 'ditolak' | 'proses_beli' | 'selesai';
  catatan?: string;
}

// ------------------------------------------------------------
// 6. Query Parameters
// ------------------------------------------------------------
export interface SinapraFilterParams extends PaginationParams {
  status?: string;
  gedung_id?: number;
  kategori_id?: number;
  kondisi?: string;
  prioritas?: string;
  unit_kerja_id?: number;
  tanggal?: string;
}
