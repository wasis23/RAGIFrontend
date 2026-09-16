import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { TridharmaDossierData } from '@/types/simpeg.dossier.types';

export const simpegDossierService = {
  /**
   * Dapatkan seluruh portofolio Tridharma dosen terpadu (SIAKAD, SIPPM, SIMPEG)
   */
  getTridharmaDossier: async (pegawaiId: number): Promise<ApiResponse<TridharmaDossierData>> => {
    const { data } = await apiClient.get<ApiResponse<TridharmaDossierData>>(
      `/simpeg/pegawai/${pegawaiId}/tridharma-dossier`
    );
    return data;
  },
};
