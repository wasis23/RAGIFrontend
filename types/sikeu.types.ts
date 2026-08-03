export interface JenisBiaya {
  id: number;
  kode: string;
  nama: string;
  tipe: 'ukt' | 'spp' | 'sks' | 'praktikum' | 'wisuda' | 'spmb_adm' | 'lainnya';
  deskripsi?: string;
  is_recurring: boolean;
  is_active: boolean;
}

export interface TarifUkt {
  id: number;
  program_studi_id?: number;
  jenis_biaya_id: number;
  tahun_akademik_id?: number;
  tahun_angkatan?: number;
  kelompok_ukt: number;
  nominal: number;
  is_active: boolean;
  jenis_biaya?: JenisBiaya;
}

export interface Beasiswa {
  id: number;
  kode: string;
  nama: string;
  sumber: 'internal' | 'eksternal' | 'pemerintah';
  tipe_potongan: 'persen' | 'nominal';
  nilai_potongan: number;
  deskripsi?: string;
  is_active: boolean;
}

export interface TagihanMahasiswa {
  id: number;
  mahasiswa_id: number;
  tahun_akademik_id?: number;
  nomor_tagihan: string;
  total_tagihan: number;
  total_potongan: number;
  total_denda: number;
  total_bayar: number;
  status: 'belum_bayar' | 'sebagian' | 'lunas' | 'dispensasi' | 'pending_approval' | 'batal';
  requires_approval: boolean;
  status_approval: 'pending' | 'approved' | 'rejected';
  disetujui_oleh?: number;
  tanggal_approval?: string;
  catatan_approval?: string;
  source_system: string;
  jatuh_tempo?: string;
  created_at: string;
  detail_tagihan?: DetailTagihan[];
  potongan_tagihan?: PotonganTagihan[];
  virtual_accounts?: VirtualAccount[];
}

export interface DetailTagihan {
  id: number;
  tagihan_id: number;
  jenis_biaya_id: number;
  nominal: number;
  potongan: number;
  nominal_bersih: number;
  keterangan?: string;
  jenis_biaya?: JenisBiaya;
}

export interface PotonganTagihan {
  id: number;
  tagihan_id: number;
  beasiswa_id?: number;
  tipe: string;
  nominal_potongan: number;
  keterangan?: string;
}

export interface DispensasiTagihan {
  id: number;
  tagihan_id: number;
  mahasiswa_id: number;
  tipe_dispensasi: 'penundaan_jatuh_tempo' | 'cicilan' | 'keringanan_khusus';
  jatuh_tempo_baru?: string;
  jumlah_cicilan: number;
  nominal_per_cicilan: number;
  alasan: string;
  dokumen_pendukung?: string;
  status: 'pending' | 'approved' | 'rejected';
  diajukan_oleh?: number;
  disetujui_oleh?: number;
  tanggal_persetujuan?: string;
  catatan_pimpinan?: string;
  created_at: string;
  tagihan?: TagihanMahasiswa;
}

export interface VirtualAccount {
  id: number;
  tagihan_id: number;
  va_number: string;
  bank_kode: string;
  bank_nama: string;
  nominal: number;
  expired_at?: string;
  status: 'aktif' | 'kadaluarsa' | 'dibayar';
}

export interface Pembayaran {
  id: number;
  tagihan_id: number;
  virtual_account_id?: number;
  kode_transaksi: string;
  jumlah_bayar: number;
  waktu_bayar?: string;
  channel_bayar: string;
  bank_pengirim?: string;
  status: 'success' | 'pending' | 'failed' | 'reversed';
  tagihan?: TagihanMahasiswa;
}

export interface UnitKas {
  id: number;
  unit_kerja_id?: number;
  nama_kas: string;
  saldo_awal: number;
  saldo_saat_ini: number;
  penanggung_jawab_id?: number;
  deskripsi?: string;
  status: boolean;
}

export interface AkunKeuangan {
  id: number;
  kode_akun: string;
  nama_akun: string;
  kelompok: 'aset' | 'liabilitas' | 'ekuitas' | 'pendapatan' | 'beban';
  saldo_normal: 'debet' | 'kredit';
  is_active: boolean;
}

export interface PeriodeAkuntansi {
  id: number;
  nama_periode: string;
  tahun: number;
  bulan: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'terbuka' | 'ditutup';
  ditutup_oleh?: number;
  ditutup_pada?: string;
}

export interface PemasukanKampus {
  id: number;
  nomor_transaksi: string;
  sumber_pemasukan: 'hibah_sippm' | 'donatur' | 'kerjasama' | 'pendapatan_lainnya';
  unit_kas_id?: number;
  akun_pendapatan_id?: number;
  nominal: number;
  tanggal_terima: string;
  nama_donor_instansi: string;
  nomor_kontrak_ref?: string;
  file_bukti_transfer?: string;
  keterangan?: string;
  unit_kas?: UnitKas;
  akun_pendapatan?: AkunKeuangan;
}

export interface PengajuanPencairanKas {
  id: number;
  nomor_pengajuan: string;
  unit_kerja_id?: number;
  unit_kas_id: number;
  pemohon_id?: number;
  judul_pengajuan: string;
  deskripsi?: string;
  nominal_diajukan: number;
  nominal_disetujui: number;
  jenis_pengajuan: 'operasional' | 'kegiatan' | 'reimbursement' | 'lainnya';
  file_lampiran?: string;
  status: 'draft' | 'pending_pimpinan' | 'pending_keuangan' | 'disetujui' | 'ditolak' | 'dicairkan';
  unit_kas?: UnitKas;
}

export interface JurnalUmum {
  id: number;
  nomor_jurnal: string;
  tanggal_jurnal: string;
  periode_id?: number;
  jenis_sumber: 'pembayaran_mahasiswa' | 'pemasukan_hibah' | 'pencairan_kas' | 'pengeluaran_manual' | 'penyesuaian' | 'penutupan';
  referensi_id?: number;
  keterangan?: string;
  status_posting: 'draft' | 'posted';
  total_debet: number;
  total_kredit: number;
  details?: DetailJurnalUmum[];
}

export interface DetailJurnalUmum {
  id: number;
  jurnal_id: number;
  akun_id: number;
  debet: number;
  kredit: number;
  keterangan?: string;
  akun?: AkunKeuangan;
  jurnal?: JurnalUmum;
}

export interface PengeluaranKampus {
  id: number;
  nomor_transaksi: string;
  kategori: string;
  akun_beban_id?: number;
  akun_kas_id?: number;
  nominal: number;
  keterangan?: string;
  tanggal_transaksi: string;
  nama_vendor?: string;
  npwp_vendor?: string;
  jenis_pajak: 'tanpa_pajak' | 'pph_21' | 'pph_23' | 'ppn_11';
  tarif_pajak_persen: number;
  nominal_pajak: number;
  net_dibayarkan: number;
  status_pembayaran: 'lunas' | 'pending' | 'batal';
  file_bukti_bayar?: string;
  akun_beban?: AkunKeuangan;
  akun_kas?: AkunKeuangan;
}

export interface LaporanBuktiPelaksanaan {
  id: number;
  sumber_tipe: 'pengajuan_pencairan' | 'pengeluaran_kampus';
  sumber_id: number;
  nomor_bukti: string;
  tanggal_pelaksanaan: string;
  total_realisasi: number;
  file_nota_kuitansi?: string;
  rincian_keterangan?: string;
  status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
  catatan_verifikasi?: string;
}
