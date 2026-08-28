import { ApiResponse, PaginationMeta } from '@/types/api.types';
import {
  TagihanMahasiswa,
  DispensasiTagihan,
  PemasukanKampus,
  AkunKeuangan,
  JurnalUmum,
  DetailJurnalUmum
} from '@/types/sikeu.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sso_access_token') : null;

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
    return fetchWithAuth<ApiResponse<{ tagihan: TagihanMahasiswa }>>('/v1/sikeu/tagihan/external', {
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('sso_access_token') : null;
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
    a.download = `Laporan_Piutang_Mahasiswa_${new Date().toISOString().slice(0, 10)}.csv`;
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
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/master/jenis-biaya');
  },

  storeJenisBiaya: async (payload: { kode: string; nama: string; tipe: string; nominal_standar?: number; deskripsi?: string }) => {
    return fetchWithAuth<ApiResponse<any>>('/v1/sikeu/master/jenis-biaya', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateJenisBiaya: async (id: number, payload: { nama?: string; tipe?: string; nominal_standar?: number; deskripsi?: string; is_active?: boolean }) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/jenis-biaya/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteJenisBiaya: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/master/jenis-biaya/${id}`, {
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

  assignMahasiswaBeasiswa: async (payload: { mahasiswa_id: number; beasiswa_id: number; berlaku_mulai?: string; berlaku_sampai?: string }) => {
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

  // Pencarian Mahasiswa untuk Tagihan & Dispensasi
  searchMahasiswa: async (q: string) => {
    return fetchWithAuth<ApiResponse<any[]>>(`/v1/sikeu/mahasiswa-search?q=${encodeURIComponent(q)}`);
  },

  // Portal Tagihan & Invoice Mahasiswa Mandiri
  getMyBills: async () => {
    return fetchWithAuth<ApiResponse<any[]>>('/v1/sikeu/mahasiswa/tagihan');
  },

  getInvoice: async (id: number) => {
    return fetchWithAuth<ApiResponse<any>>(`/v1/sikeu/mahasiswa/invoice/${id}`);
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
};

