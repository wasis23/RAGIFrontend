'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { spmbService, GelombangPenerimaan } from '@/services/spmb.service';

interface SpmbState {
  activeGelombang: GelombangPenerimaan | null;
  isLoadingActiveGelombang: boolean;
}

interface SpmbActions {
  fetchActiveGelombang: () => Promise<GelombangPenerimaan | null>;
  setActiveGelombang: (gelombang: GelombangPenerimaan | null) => void;
}

export type SpmbStore = SpmbState & SpmbActions;

export const useSpmbStore = create<SpmbStore>()(
  persist(
    (set, get) => ({
      activeGelombang: null,
      isLoadingActiveGelombang: false,

      fetchActiveGelombang: async () => {
        set({ isLoadingActiveGelombang: true });
        try {
          const res = await spmbService.getGelombang();
          const list: GelombangPenerimaan[] = res.data || [];
          // Find gelombang explicitly set to 'aktif' by Admin
          const active = list.find((g) => g.status === 'aktif') || list[0] || null;
          set({ activeGelombang: active, isLoadingActiveGelombang: false });
          return active;
        } catch (error) {
          console.error('Failed to fetch active gelombang:', error);
          set({ isLoadingActiveGelombang: false });
          return get().activeGelombang;
        }
      },

      setActiveGelombang: (gelombang) => set({ activeGelombang: gelombang }),
    }),
    {
      name: 'spmb-active-gelombang-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
