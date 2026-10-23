import { type SelectOption } from '@/components/ui/Select';

export const SEMESTER_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

export const HARI_KULIAH_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Hari' },
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
];

export const JENIS_PKL_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Jenis' },
  { value: 'pkl_reguler', label: 'PKL Reguler' },
  { value: 'magang_industri', label: 'Magang Industri' },
  { value: 'magang_mbkm', label: 'Magang MBKM' },
  { value: 'studi_independen', label: 'Studi Independen' },
];

export const STATUS_PKL_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'sedang_berjalan', label: 'Sedang Berjalan' },
  { value: 'dinilai', label: 'Dinilai' },
  { value: 'ditolak', label: 'Ditolak' },
];

export const TAHAP_TA_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Tahap' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'penelitian', label: 'Penelitian & Bimbingan' },
  { value: 'seminar_hasil', label: 'Seminar Hasil' },
  { value: 'sidang_skripsi', label: 'Sidang Skripsi' },
  { value: 'revisi_akhir', label: 'Revisi Akhir' },
  { value: 'lulus', label: 'Lulus' },
];

export const STATUS_TA_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'disetujui_prodi', label: 'Disetujui Prodi' },
  { value: 'sedang_bimbingan', label: 'Sedang Bimbingan' },
  { value: 'siap_sidang', label: 'Siap Sidang' },
  { value: 'revisi', label: 'Revisi' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
];

export const SORT_DIRECTION_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'Menaik (A-Z / Lama)' },
  { value: 'desc', label: 'Menurun (Z-A / Baru)' },
];

export const KRS_SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama', label: 'Nama Kelas' },
  { value: 'sks', label: 'Jumlah SKS' },
];

export const TRANSKRIP_SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'nama_mk', label: 'Nama Mata Kuliah' },
  { value: 'sks', label: 'Jumlah SKS' },
  { value: 'bobot_mutu', label: 'Nilai Bobot' },
];

export const PKL_SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'instansi_nama', label: 'Nama Instansi' },
  { value: 'tanggal', label: 'Tanggal Mulai' },
];

export const TA_SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'judul_utama', label: 'Judul Skripsi' },
  { value: 'status', label: 'Status Persetujuan' },
];
