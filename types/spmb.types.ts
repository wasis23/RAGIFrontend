export interface JalurMasuk {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  tipe: 'reguler' | 'mandiri' | 'prestasi' | 'kerjasama';
  ada_ujian_tulis: boolean;
  ada_ujian_praktik: boolean;
  ada_wawancara: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GelombangPenerimaan {
  id: number;
  jalur_masuk_id: number;
  tahun_akademik_id: number;
  nama: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  tanggal_ujian: string | null;
  tanggal_pengumuman: string | null;
  kuota_total: number;
  kuota_terisi: number;
  biaya_pendaftaran: string | number;
  status: 'draft' | 'aktif' | 'ditutup' | 'selesai';
  created_at: string;
  updated_at: string;
  jalur_masuk?: JalurMasuk;
}
