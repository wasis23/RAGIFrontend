'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PeriodeHibah, ProposalFilterParams, CreateProposalPayload } from '@/types/sippm.types';

interface SippmState {
  activePeriode: PeriodeHibah | null;
  filters: ProposalFilterParams;
  proposalDraft: Partial<CreateProposalPayload> | null;
  activeTab: 'all' | 'penelitian' | 'pengabdian';
}

interface SippmActions {
  setActivePeriode: (periode: PeriodeHibah | null) => void;
  setFilters: (filters: Partial<ProposalFilterParams>) => void;
  resetFilters: () => void;
  setProposalDraft: (draft: Partial<CreateProposalPayload> | null) => void;
  clearProposalDraft: () => void;
  setActiveTab: (tab: 'all' | 'penelitian' | 'pengabdian') => void;
}

type SippmStore = SippmState & SippmActions;

const initialFilters: ProposalFilterParams = {
  page: 1,
  per_page: 10,
  search: '',
  periode_id: undefined,
  skema_id: undefined,
  jenis_kegiatan: undefined,
  status: undefined,
  sort_by: 'created_at',
  sort_dir: 'desc',
};

export const useSippmStore = create<SippmStore>()(
  persist(
    (set) => ({
      activePeriode: null,
      filters: initialFilters,
      proposalDraft: null,
      activeTab: 'all',

      setActivePeriode: (periode) => set({ activePeriode: periode }),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: initialFilters }),
      setProposalDraft: (draft) =>
        set((state) => ({
          proposalDraft: state.proposalDraft ? { ...state.proposalDraft, ...draft } : draft,
        })),
      clearProposalDraft: () => set({ proposalDraft: null }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'sippm-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
