// ============================================================
// SIMPEG DOSSIER TYPES — Unified Academic Dossier Tridharma
// ============================================================

import type { PenilaianKinerja } from './simpeg.types';
import type { SkPegawai } from './simpeg.izin-sk.types';
import type { SuratTugas } from './simpeg.surat-tugas.types';
import type { SertifikasiDosen, RiwayatPelatihan } from './simpeg.kompetensi.types';

export interface TridharmaPegawai {
  id: number;
  nama_lengkap: string;
  nama_gelar: string;
  nip?: string | null;
  nidn?: string | null;
  nuptk?: string | null;
  unit_kerja?: string | null;
  program_studi?: string | null;
  jabatan_fungsional?: string | null;
  status_kepegawaian?: string | null;
  sinta_id?: string | null;
  scopus_id?: string | null;
  google_scholar_id?: string | null;
  orcid_id?: string | null;
}

export interface TridharmaMetrics {
  total_kelas_ajar: number;
  total_sks_ajar: number;
  total_mhs_wali: number;
  total_penelitian: number;
  total_dana_penelitian: number;
  total_pengabdian: number;
  total_dana_pengabdian: number;
  total_publikasi: number;
  total_publikasi_scopus: number;
  total_publikasi_sinta: number;
  total_hki_buku: number;
  total_surat_tugas: number;
  total_sk_penugasan: number;
  total_sertifikasi: number;
  total_pelatihan: number;
  rerata_nilai_skp: number;
  rerata_nilai_bkd: number;
}

export interface TridharmaKelasAjar {
  id: number;
  kelas_id: number;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  kode_kelas: string;
  nama_kelas: string;
  tahun_akademik: string;
  semester: string;
  peran: string;
}

export interface TridharmaMahasiswaWali {
  id: number;
  nim: string;
  nama_lengkap: string;
  program_studi?: string | null;
  angkatan: string | number;
  status: string;
}

export interface TridharmaProposal {
  id: number;
  kode_proposal: string;
  judul: string;
  abstrak?: string | null;
  rumpun_ilmu?: string | null;
  target_tkt?: number | null;
  anggaran_diajukan: number;
  anggaran_disetujui: number;
  status: string;
  skema?: {
    id: number;
    nama: string;
    kode: string;
    tipe: 'penelitian' | 'pengabdian';
    sumber_dana: string;
  } | null;
  periode?: {
    id: number;
    tahun_anggaran: string;
    nama_gelombang: string;
  } | null;
}

export interface TridharmaPublikasi {
  id: number;
  judul_artikel: string;
  jenis_publikasi: string;
  nama_jurnal_prosiding: string;
  indexing?: string | null;
  volume_issue_tahun?: string | null;
  doi?: string | null;
  url_artikel?: string | null;
  file_artikel?: string | null;
  is_verified_lppm: boolean;
}

export interface TridharmaHki {
  id: number;
  judul: string;
  jenis: string;
  nomor_pendaftaran?: string | null;
  nomor_sertifikat?: string | null;
  tahun?: string | number | null;
  link_dokumen?: string | null;
}

export interface TridharmaDossierData {
  pegawai: TridharmaPegawai;
  metrics: TridharmaMetrics;
  pengajaran: {
    kelas: TridharmaKelasAjar[];
    mahasiswa_wali: TridharmaMahasiswaWali[];
  };
  penelitian: {
    hibah_ketua: TridharmaProposal[];
    hibah_anggota: any[];
    publikasi: TridharmaPublikasi[];
    hki_buku: TridharmaHki[];
  };
  pengabdian: {
    hibah_ketua: TridharmaProposal[];
    hibah_anggota: any[];
  };
  penunjang: {
    surat_tugas: SuratTugas[];
    sk_pegawai: SkPegawai[];
    sertifikasi: SertifikasiDosen[];
    pelatihan: RiwayatPelatihan[];
    kinerja_skp: PenilaianKinerja[];
  };
}
