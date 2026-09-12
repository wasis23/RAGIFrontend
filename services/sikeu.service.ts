import { ApiResponse, PaginationMeta } from '@/types/api.types';
import {
  TagihanMahasiswa,
  DispensasiTagihan,
  PemasukanKampus,
  AkunKeuangan,
  JurnalUmum,
  DetailJurnalUmum
} from '@/types/sikeu.types';

import { getCookie } from '@/lib/domain';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('sso_access_token') || getCookie('sso_access_token')) : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada request API SIKEU');
  }

  return data;
}

export const sikeuService = {
  // External Bill Generation
  createExternalBill: async (payload: any) => {
    return fetchWithAuth<ApiResponse<{ tagihan: TagihanMahasiswa; virtual_account?: any }>>('/v1/sikeu/tagihan/external', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Piutang Mahasiswa & Rekapitulasi Tunggakan
  getPiutangMahasiswa: async (params?: {
    search?: string;
    angkatan?: string | number;
    tahun_akademik_id?: string | number;
    program_studi_id?: string | number;
    cutoff_date?: string;
    status?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/piutang?${query}`);
  },

  downloadPiutangExcel: async (params?: any) => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('sso_access_token') || getCookie('sso_access_token')) : null;
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_BASE_URL}/v1/sikeu/piutang/export-excel?${query}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) {
      throw new Error('Gagal mengunduh file Excel piutang');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Piutang_Mahasiswa_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Dispensasi Tagihan
  getDispensasiList: async (params?: { status?: string; mahasiswa_id?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth<ApiResponse<DispensasiTagihan[]>>(`/v1/sikeu/dispensasi?${query}`);
  },

  submitDispensasi: async (payload: {
    tagihan_id: number;
    tipe_dispensasi: string;
    jatuh_tempo_baru?: string;
    jumlah_cicilan?: number;
    nominal_per_cicilan?: number;
    allow_krs?: boolean;
    alasan: string;
    dokumen_pendukung?: string;
  }) => {
    return fetchWithAuth<ApiResponse<DispensasiTagihan>>('/v1/sikeu/dispensasi', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Approval Pimpinan
  getPendingApprovals: async () => {
    return fetchWithAuth<ApiResponse<{ tagihan_pending: TagihanMahasiswa[]; dispensasi_pending: DispensasiTagihan[] }>>('/v1/sikeu/approvals');
  },

  approveTagihan: async (id: number, catatan?: string) => {
    return fetchWithAuth<ApiResponse<TagihanMahasiswa>>(`/v1/sikeu/approvals/tagihan/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    });
  },

  rejectTagihan: async (id: number, catatan?: string) => {
    return fetchWithAuth<ApiResponse<TagihanMahasiswa>>(`/v1/sikeu/approvals/tagihan/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    });
  },

  approveDispensasi: async (id: number, catatan?: string) => {
    return fetchWithAuth<ApiResponse<DispensasiTagihan>>(`/v1/sikeu/approvals/dispensasi/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    });
  },

  rejectDispensasi: async (id: number, catatan?: string) => {
    return fetchWithAuth<ApiResponse<DispensasiTagihan>>(`/v1/sikeu/approvals/dispensasi/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    });
  },

  // Pemasukan Kampus
  getPemasukanList: async (params?: { sumber?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth<ApiResponse<PemasukanKampus[]>>(`/v1/sikeu/pemasukan?${query}`);
  },

  storeExternalIncome: async (payload: {
    sumber_pemasukan: string;
    nominal: number;
    tanggal_terima: string;
    nama_donor_instansi: string;
    nomor_kontrak_ref?: string;
    keterangan?: string;
  }) => {
    return fetchWithAuth<ApiResponse<PemasukanKampus>>('/v1/sikeu/pemasukan/external', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Akuntansi & COA
  getCoaList: async (kelompok?: string) => {
    const query = kelompok ? `?kelompok=${kelompok}` : '';
    return fetchWithAuth<ApiResponse<AkunKeuangan[]>>(`/v1/sikeu/akuntansi/coa${query}`);
  },

  storeCoa: async (payload: {
    kode_akun: string;
    nama_akun: string;
    kelompok: string;
    saldo_normal: string;
  }) => {
    return fetchWithAuth<ApiResponse<AkunKeuangan>>('/v1/sikeu/akuntansi/coa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getJurnalList: async (params?: { jenis_sumber?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth<ApiResponse<JurnalUmum[]>>(`/v1/sikeu/akuntansi/jurnal?${query}`);
  },

  storeJurnal: async (payload: {
    tanggal_jurnal: string;
    jenis_sumber: string;
    keterangan: string;
    details: { akun_id: number; debet: number; kredit: number; keterangan?: string }[];
  }) => {
    return fetchWithAuth<ApiResponse<JurnalUmum>>('/v1/sikeu/akuntansi/jurnal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBukuBesar: async (akun_id?: number) => {
    const query = akun_id ? `?akun_id=${akun_id}` : '';
    return fetchWithAuth<ApiResponse<DetailJurnalUmum[]>>(`/v1/sikeu/akuntansi/buku-besar${query}`);
  },

  getLaporanKeuangan: async () => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/akuntansi/laporan');
  },

  // Master Tarif Gaji Pegawai
  getMasterGajiList: async (params?: { search?: string; jenis_pegawai?: string; page?: number; per_page?: number; sort_by?: string; sort_order?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.jenis_pegawai && params.jenis_pegawai !== 'all') query.append('jenis_pegawai', params.jenis_pegawai);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/master/gaji-pegawai${queryString}`);
  },

  saveMasterGaji: async (payload: {
    pegawai_id: number;
    gaji_pokok: number;
    tunjangan_tetap: number;
    potongan_tetap: number;
    tarif_transport_harian: number;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/gaji-pegawai', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Master Tarif UKT per Angkatan & Jalur Kelas
  getTarifList: async (params?: { tahun_angkatan?: number; jalur_kelas?: string; program_studi_id?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/master/tarif-ukt?${query}`);
  },

  storeTarif: async (payload: { jenis_biaya_id: number; tahun_angkatan: number; jalur_kelas?: string; kelompok_ukt: number; nama_kelompok?: string; program_studi_id?: number; nominal: number }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/tarif-ukt', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTarif: async (id: number, payload: any) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/tarif-ukt/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteTarif: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/tarif-ukt/${id}`, {
      method: 'DELETE',
    });
  },

  // Master Jalur Kelas
  getJalurKelasList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/jalur-kelas');
  },

  storeJalurKelas: async (payload: { nama_jalur: string; deskripsi?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/jalur-kelas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateJalurKelas: async (id: number, payload: { nama_jalur?: string; deskripsi?: string; is_active?: boolean }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/jalur-kelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteJalurKelas: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/jalur-kelas/${id}`, {
      method: 'DELETE',
    });
  },

  // Master Jenis Biaya Pendidikan
  getJenisBiayaList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/master-biaya');
  },

  storeJenisBiaya: async (payload: { kode: string; nama: string; tipe: string; nominal_standar?: number; deskripsi?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/master-biaya', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateJenisBiaya: async (id: number, payload: { nama?: string; tipe?: string; nominal_standar?: number; deskripsi?: string; is_active?: boolean }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/master-biaya/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteJenisBiaya: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/master-biaya/${id}`, {
      method: 'DELETE',
    });
  },

  // Master & Mapping Beasiswa Mahasiswa
  getBeasiswaList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/beasiswa');
  },

  storeBeasiswa: async (payload: { kode: string; nama: string; sumber: string; tipe_potongan: string; nilai_potongan: number; jenis_biaya_id?: number; berlaku_angkatan_mulai?: number; berlaku_angkatan_sampai?: number; deskripsi?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/beasiswa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBeasiswa: async (id: number, payload: any) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/beasiswa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteBeasiswa: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/beasiswa/${id}`, {
      method: 'DELETE',
    });
  },

  getMahasiswaBeasiswaList: async (params?: { page?: number; per_page?: number; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.q) query.append('q', params.q);
    return fetchWithAuth<ApiResponse<any[]> & { meta?: PaginationMeta }>(`/v1/sikeu/master/mahasiswa-beasiswa?${query.toString()}`);
  },

  assignMahasiswaBeasiswa: async (payload: { mahasiswa_id: number; nim?: string; nama_mahasiswa?: string; beasiswa_id: number; berlaku_mulai?: string; berlaku_sampai?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/mahasiswa-beasiswa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Penetapan Tipe Tagihan & Jalur Kelas Mahasiswa (SPMB / SIAKAD / Change Status)
  getStudentBillingTypes: async (params?: { page?: number; per_page?: number; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.q) query.append('q', params.q);
    return fetchWithAuth<ApiResponse<any[]> & { meta?: PaginationMeta }>(`/v1/sikeu/master/student-billing-types?${query.toString()}`);
  },

  assignStudentBillingType: async (payload: { mahasiswa_id: number; nim?: string; nama_mahasiswa?: string; tahun_angkatan: number; jalur_kelas: string; kelompok_ukt: number; beasiswa_id?: number; catatan_perubahan?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/assign-student-billing-type', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStudentBillingType: async (id: number, payload: { jalur_kelas?: string; kelompok_ukt?: number; beasiswa_id?: number; catatan_perubahan: string }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/update-student-billing-type/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  syncStudentsFromSiakad: async (payload?: { tahun_angkatan?: number }) => {
    return fetchWithAuth<ApiResponse<{ synced_count: number; target_angkatan?: string }>>('/v1/sikeu/master/sync-students', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  // Pencarian Mahasiswa untuk Tagihan & Dispensasi
  searchMahasiswa: async (q: string) => {
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/mahasiswa-search?q=${encodeURIComponent(q)}`);
  },

  // Portal Tagihan & Invoice Mahasiswa Mandiri
  getMyBills: async (mahasiswaId?: number) => {
    const q = mahasiswaId ? `?mahasiswa_id=${mahasiswaId}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/mahasiswa/tagihan${q}`);
  },

  getMyPaymentHistory: async (mahasiswaId?: number) => {
    const q = mahasiswaId ? `?mahasiswa_id=${mahasiswaId}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/mahasiswa/riwayat-pembayaran${q}`);
  },

  getInvoice: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/mahasiswa/invoice/${id}`);
  },

  generateBatchInvoice: async (tagihanIds: number[]) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/mahasiswa/invoice-batch', {
      method: 'POST',
      body: JSON.stringify({ tagihan_ids: tagihanIds }),
    });
  },

  payStudentBills: async (payload: { tagihan_ids: number[]; channel_bayar?: string; catatan?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/mahasiswa/pay-bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Cetak Bukti Dispensasi
  getCetakBuktiDispensasi: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/dispensasi/${id}/cetak-bukti`);
  },

  // Riwayat Pembayaran Mahasiswa (with filters)
  getPembayaranList: async (params?: { search?: string; status?: string; channel?: string; tgl_mulai?: string; tgl_selesai?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pembayaran?${query}`);
  },

  // Payment Gateway Config
  getPaymentGateways: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/payment-gateway');
  },

  getActivePaymentGateway: async () => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/payment-gateway/active');
  },

  getPaymentGatewayBalance: async (gatewayName: string) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/payment-gateway/${gatewayName}/balance`);
  },

  updatePaymentGateway: async (gatewayName: string, payload: any) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/payment-gateway/${gatewayName}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Master Unit Kas
  getUnitKasList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/unit-kas');
  },

  storeUnitKas: async (payload: any) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/unit-kas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUnitKas: async (id: number, payload: any) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/unit-kas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteUnitKas: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/unit-kas/${id}`, {
      method: 'DELETE',
    });
  },

  // Pengajuan Pencairan Kas
  getPengajuanKasList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/pengajuan-kas');
  },

  storePengajuanKas: async (payload: any) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/pengajuan-kas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  approvePengajuanKas: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pengajuan-kas/${id}/approve`, {
      method: 'POST',
    });
  },

  // Dashboard Executive Summary & Live Xendit
  getDashboardSummary: async () => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/dashboard-summary');
  },

  // Pengeluaran Kampus
  getPengeluaranList: async (params?: { search?: string; kategori?: string; jenis_pajak?: string; status?: string; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.kategori) query.append('kategori', params.kategori);
    if (params?.jenis_pajak) query.append('jenis_pajak', params.jenis_pajak);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pengeluaran?${query.toString()}`);
  },

  storePengeluaran: async (payload: {
    kategori: string;
    nominal: number;
    tanggal_transaksi: string;
    nama_vendor: string;
    npwp_vendor?: string;
    jenis_pajak: string;
    unit_kas_id?: number;
    keterangan?: string;
    file_bukti_bayar?: string;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/pengeluaran', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Pajak Kampus & Setor NTPN
  getPajakList: async (params?: { search?: string; jenis?: string; status?: string; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.jenis) query.append('jenis', params.jenis);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pajak?${query.toString()}`);
  },

  setorPajak: async (id: number, payload: { ntpn: string; tanggal_setor?: string; unit_kas_id?: number }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pajak/${id}/setor`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Setting Tarif per Angkatan/Prodi/Semester
  getSettingTarifList: async (params?: {
    tahun_angkatan?: number;
    program_studi_id?: number;
    semester?: number;
    jalur_kelas?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/master/setting-tarif?${query.toString()}`);
  },

  storeSettingTarif: async (payload: {
    master_biaya_id: number;
    tahun_angkatan: number;
    program_studi_id?: number;
    semester?: number;
    jalur_kelas: string;
    nominal: number;
    is_active?: boolean;
    keterangan?: string;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/setting-tarif', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateSettingTarif: async (id: number, payload: any) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/setting-tarif/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteSettingTarif: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/setting-tarif/${id}`, {
      method: 'DELETE',
    });
  },

  // Program Studi Reference for SIKEU
  getProgramStudiList: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/program-studi');
  },

  // Pembayaran Kasir (Offline / Loket Kampus)
  processKasirPayment: async (payload: {
    tagihan_id?: number;
    tagihan_ids?: number[];
    jumlah_bayar: number;
    channel_bayar: 'LOKET_TUNAI' | 'LOKET_TRANSFER';
    potongan?: number;
    alasan_potongan?: string;
    catatan?: string;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/pembayaran/kasir', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  koreksiPembayaran: async (id: number, payload: { alasan_koreksi: string }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/pembayaran/${id}/koreksi`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Daftar Tagihan Mahasiswa (Real Tagihan Index & Detail)
  getTagihanList: async (params?: { page?: number; per_page?: number; search?: string; status?: string; tahun_angkatan?: number; program_studi_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.tahun_angkatan) query.append('tahun_angkatan', params.tahun_angkatan.toString());
    if (params?.program_studi_id) query.append('program_studi_id', params.program_studi_id.toString());
    return fetchWithAuth<ApiResponse<any[]> & { meta?: PaginationMeta }>(`/v1/sikeu/tagihan?${query.toString()}`);
  },

  getTagihanDetail: async (id: number | string) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/tagihan/${id}`);
  },

  // Tagihan Belum Lunas Mahasiswa untuk Kasir / Loket
  getStudentUnpaidBills: async (studentId: number | string) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/mahasiswa/${studentId}/unpaid-bills`);
  },

  // Generate Tagihan Semester Masal
  generateMassTagihan: async (payload: {
    tahun_angkatan: number;
    jalur_kelas: string;
    semester?: number;
    program_studi_id?: number;
    master_biaya_ids?: number[];
    jatuh_tempo: string;
    semester_label?: string;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/tagihan/generate-mass', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Pengaturan On/Off Skema Golongan UKT
  getUktSetting: async () => {
    return fetchWithAuth<ApiResponse<{ enabled: boolean; description?: string }>>('/v1/sikeu/settings/golongan-ukt');
  },

  updateUktSetting: async (enabled: boolean) => {
    return fetchWithAuth<ApiResponse<{ enabled: boolean }>>('/v1/sikeu/settings/golongan-ukt', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  },

  // Pembayaran Langsung di Kasir Loket (Direct Billing & Payment)
  processDirectCashierPayment: async (payload: {
    mahasiswa_id: number;
    items: { master_biaya_id?: number; master_biaya_kode?: string; nominal: number; keterangan?: string }[];
    jumlah_bayar: number;
    potongan?: number;
    alasan_potongan?: string;
    channel_bayar: 'LOKET_TUNAI' | 'LOKET_TRANSFER';
    catatan?: string;
  }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/pembayaran/direct-cashier', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

