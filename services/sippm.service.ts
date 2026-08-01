// ============================================================
// SIPPM SERVICE — API Integration Layer for SIPPM Module
// ============================================================

import apiClient from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  PeriodeHibah,
  SkemaKegiatan,
  ProposalKegiatan,
  ReviewerKegiatan,
  KontrakKegiatan,
  PublikasiIlmiah,
  HkiDanBuku,
  ProposalFilterParams,
  CreateProposalPayload,
  UpdateProposalPayload,
  CreatePeriodePayload,
  CreateSkemaPayload,
  AssignReviewerPayload,
  SubmitPenilaianPayload,
  FinalizeDecisionPayload,
  CreateKontrakPayload,
  RequestPencairanPayload,
  SubmitLaporanPayload,
  CreatePublikasiPayload,
  CreateHkiPayload,
  RubrikIndikator,
  CreateRubrikPayload,
} from '@/types/sippm.types';

export const sippmService = {
  // ------------------------------------------------------------
  // Master Skema & Periode
  // ------------------------------------------------------------
  indexSkema: async (): Promise<ApiResponse<SkemaKegiatan[]>> => {
    const { data } = await apiClient.get<ApiResponse<SkemaKegiatan[]>>('/sippm/skema');
    return data;
  },

  storeSkema: async (payload: CreateSkemaPayload): Promise<ApiResponse<SkemaKegiatan>> => {
    const { data } = await apiClient.post<ApiResponse<SkemaKegiatan>>('/sippm/skema', payload);
    return data;
  },

  indexPeriode: async (): Promise<ApiResponse<PeriodeHibah[]>> => {
    const { data } = await apiClient.get<ApiResponse<PeriodeHibah[]>>('/sippm/periode');
    return data;
  },

  storePeriode: async (payload: CreatePeriodePayload): Promise<ApiResponse<PeriodeHibah>> => {
    const { data } = await apiClient.post<ApiResponse<PeriodeHibah>>('/sippm/periode', payload);
    return data;
  },

  // ------------------------------------------------------------
  // Proposal Kegiatan
  // ------------------------------------------------------------
  getProposals: async (params?: ProposalFilterParams): Promise<PaginatedResponse<ProposalKegiatan>> => {
    const { data } = await apiClient.get<PaginatedResponse<ProposalKegiatan>>('/sippm/proposal', { params });
    return data;
  },

  getProposalDetail: async (id: number): Promise<ApiResponse<ProposalKegiatan>> => {
    const { data } = await apiClient.get<ApiResponse<ProposalKegiatan>>(`/sippm/proposal/${id}`);
    return data;
  },

  createProposal: async (payload: CreateProposalPayload): Promise<ApiResponse<ProposalKegiatan>> => {
    const formData = new FormData();
    formData.append('periode_hibah_id', payload.periode_hibah_id.toString());
    formData.append('skema_kegiatan_id', payload.skema_kegiatan_id.toString());
    formData.append('judul', payload.judul);
    formData.append('abstrak', payload.abstrak);
    formData.append('rumpun_ilmu', payload.rumpun_ilmu);
    formData.append('dana_diusulkan', payload.dana_diusulkan.toString());

    if (payload.anggota && payload.anggota.length > 0) {
      formData.append('anggota', JSON.stringify(payload.anggota));
    }

    if (payload.file_proposal) {
      formData.append('file_proposal', payload.file_proposal);
    }

    const { data } = await apiClient.post<ApiResponse<ProposalKegiatan>>('/sippm/proposal', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateProposal: async (id: number, payload: UpdateProposalPayload): Promise<ApiResponse<ProposalKegiatan>> => {
    const { data } = await apiClient.put<ApiResponse<ProposalKegiatan>>(`/sippm/proposal/${id}`, payload);
    return data;
  },

  submitProposal: async (id: number): Promise<ApiResponse<ProposalKegiatan>> => {
    const { data } = await apiClient.post<ApiResponse<ProposalKegiatan>>(`/sippm/proposal/${id}/submit`);
    return data;
  },

  assignReviewer: async (id: number, payload: AssignReviewerPayload): Promise<ApiResponse<ReviewerKegiatan[]>> => {
    const { data } = await apiClient.post<ApiResponse<ReviewerKegiatan[]>>(`/sippm/proposal/${id}/assign-reviewer`, payload);
    return data;
  },

  // ------------------------------------------------------------
  // Reviewer & Decision
  // ------------------------------------------------------------
  myAssignedProposals: async (): Promise<ApiResponse<ReviewerKegiatan[]>> => {
    const { data } = await apiClient.get<ApiResponse<ReviewerKegiatan[]>>('/sippm/reviewer/assigned');
    return data;
  },

  submitPenilaian: async (reviewerKegiatanId: number, payload: SubmitPenilaianPayload): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/sippm/reviewer/${reviewerKegiatanId}/penilaian`, payload);
    return data;
  },

  finalizeDecision: async (proposalId: number, payload: FinalizeDecisionPayload): Promise<ApiResponse<ProposalKegiatan>> => {
    const { data } = await apiClient.post<ApiResponse<ProposalKegiatan>>(`/sippm/proposal/${proposalId}/finalize`, payload);
    return data;
  },

  // ------------------------------------------------------------
  // Kontrak, Pencairan, & Monev/Laporan
  // ------------------------------------------------------------
  indexKontrak: async (): Promise<ApiResponse<KontrakKegiatan[]>> => {
    const { data } = await apiClient.get<ApiResponse<KontrakKegiatan[]>>('/sippm/kontrak');
    return data;
  },

  storeKontrak: async (proposalId: number, payload: CreateKontrakPayload): Promise<ApiResponse<KontrakKegiatan>> => {
    const { data } = await apiClient.post<ApiResponse<KontrakKegiatan>>(`/sippm/proposal/${proposalId}/kontrak`, payload);
    return data;
  },

  requestPencairan: async (kontrakId: number, payload: RequestPencairanPayload): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('termin', payload.termin.toString());
    formData.append('nominal', payload.nominal.toString());
    if (payload.catatan_keuangan) formData.append('catatan_keuangan', payload.catatan_keuangan);
    if (payload.file_lpj) formData.append('file_lpj', payload.file_lpj);

    const { data } = await apiClient.post<ApiResponse<any>>(`/sippm/kontrak/${kontrakId}/pencairan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  submitLaporan: async (kontrakId: number, payload: SubmitLaporanPayload): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('jenis_laporan', payload.jenis_laporan);
    formData.append('persentase_capaian', payload.persentase_capaian.toString());
    formData.append('ringkasan_progress', payload.ringkasan_progress);
    if (payload.file_laporan) formData.append('file_laporan', payload.file_laporan);

    const { data } = await apiClient.post<ApiResponse<any>>(`/sippm/kontrak/${kontrakId}/laporan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // ------------------------------------------------------------
  // Luaran Riset (Publikasi & HKI)
  // ------------------------------------------------------------
  indexPublikasi: async (): Promise<ApiResponse<PublikasiIlmiah[]>> => {
    const { data } = await apiClient.get<ApiResponse<PublikasiIlmiah[]>>('/sippm/luaran/publikasi');
    return data;
  },

  storePublikasi: async (payload: CreatePublikasiPayload): Promise<ApiResponse<PublikasiIlmiah>> => {
    const { data } = await apiClient.post<ApiResponse<PublikasiIlmiah>>('/sippm/luaran/publikasi', payload);
    return data;
  },

  verifyPublikasi: async (id: number, status: 'verified' | 'rejected'): Promise<ApiResponse<PublikasiIlmiah>> => {
    const { data } = await apiClient.post<ApiResponse<PublikasiIlmiah>>(`/sippm/luaran/publikasi/${id}/verify`, { status });
    return data;
  },

  indexHki: async (): Promise<ApiResponse<HkiDanBuku[]>> => {
    const { data } = await apiClient.get<ApiResponse<HkiDanBuku[]>>('/sippm/luaran/hki');
    return data;
  },

  storeHki: async (payload: CreateHkiPayload): Promise<ApiResponse<HkiDanBuku>> => {
    const { data } = await apiClient.post<ApiResponse<HkiDanBuku>>('/sippm/luaran/hki', payload);
    return data;
  },

  verifyHki: async (id: number, status: 'verified' | 'rejected'): Promise<ApiResponse<HkiDanBuku>> => {
    const { data } = await apiClient.post<ApiResponse<HkiDanBuku>>(`/sippm/luaran/hki/${id}/verify`, { status });
    return data;
  },

  // ------------------------------------------------------------
  // Cross-Module Integration & Reference Endpoints
  // ------------------------------------------------------------
  getUpmMetrics: async (): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/sippm/integration/upm-iku-metrics');
    return data;
  },

  getDosenReference: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/sippm/ref/dosen');
    return data;
  },

  getTendikReference: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/sippm/ref/tendik');
    return data;
  },

  getActiveMataKuliahMahasiswa: async (mahasiswaId: number): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(`/sippm/ref/mahasiswa/${mahasiswaId}/mata-kuliah-aktif`);
    return data;
  },

  // ------------------------------------------------------------
  // Master Rubrik Indikator Penilaian
  // ------------------------------------------------------------
  indexRubrik: async (params?: { tipe_reviewer?: string; search?: string }): Promise<PaginatedResponse<RubrikIndikator>> => {
    const { data } = await apiClient.get<PaginatedResponse<RubrikIndikator>>('/sippm/rubrik', { params });
    return data;
  },

  storeRubrik: async (payload: CreateRubrikPayload): Promise<ApiResponse<RubrikIndikator>> => {
    const { data } = await apiClient.post<ApiResponse<RubrikIndikator>>('/sippm/rubrik', payload);
    return data;
  },

  updateRubrik: async (id: number, payload: Partial<CreateRubrikPayload>): Promise<ApiResponse<RubrikIndikator>> => {
    const { data } = await apiClient.put<ApiResponse<RubrikIndikator>>(`/sippm/rubrik/${id}`, payload);
    return data;
  },

  destroyRubrik: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/sippm/rubrik/${id}`);
    return data;
  },
};
