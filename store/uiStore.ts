'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/axios';

// ============================================================
// UI STORE — Global UI state (sidebar, modal, theme)
// ============================================================

interface UiState {
  sidebar_open: boolean;
  active_modal: string | null;
  is_dark_mode: boolean;
  module_color: string | null;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleDarkMode: () => void;
  fetchModuleColor: (currentModuleCode: string) => Promise<void>;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebar_open: true,
      active_modal: null,
      is_dark_mode: false,
      module_color: null,

      toggleSidebar: () => set((state) => ({ sidebar_open: !state.sidebar_open })),
      setSidebarOpen: (open) => set({ sidebar_open: open }),
      openModal: (modalId) => set({ active_modal: modalId }),
      closeModal: () => set({ active_modal: null }),
      toggleDarkMode: () => set((state) => ({ is_dark_mode: !state.is_dark_mode })),
      
      fetchModuleColor: async (currentModuleCode: string) => {
        try {
          const res = await api.get('/admin/modules');
          const list = res.data?.data || res.data || [];
          const activeMod = list.find((m: any) => m.code.toLowerCase() === currentModuleCode.toLowerCase());
          if (activeMod?.primary_color) {
            set({ module_color: activeMod.primary_color });
          }
        } catch (error) {
          console.error('Failed to fetch module color:', error);
        }
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
