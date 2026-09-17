'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/axios';

// ============================================================
// UI STORE — Global UI state (sidebar, modal, theme, module colors)
// ============================================================

interface UiState {
  sidebar_open: boolean;
  active_modal: string | null;
  is_dark_mode: boolean;
  module_color: string | null;
  module_colors: Record<string, string>;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleDarkMode: () => void;
  setModuleColor: (color: string | null) => void;
  updateModuleColor: (code: string, color: string) => void;
  fetchModuleColor: (currentModuleCode: string) => Promise<void>;
  fetchAllModuleColors: () => Promise<Record<string, string>>;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      sidebar_open: true,
      active_modal: null,
      is_dark_mode: false,
      module_color: null,
      module_colors: {},

      toggleSidebar: () => set((state) => ({ sidebar_open: !state.sidebar_open })),
      setSidebarOpen: (open) => set({ sidebar_open: open }),
      openModal: (modalId) => set({ active_modal: modalId }),
      closeModal: () => set({ active_modal: null }),
      toggleDarkMode: () => set((state) => ({ is_dark_mode: !state.is_dark_mode })),
      
      setModuleColor: (color) => set({ module_color: color }),

      updateModuleColor: (code, color) => {
        const lowerCode = code.toLowerCase();
        set((state) => ({
          module_colors: {
            ...state.module_colors,
            [lowerCode]: color,
          },
          module_color: color,
        }));
      },

      fetchModuleColor: async (currentModuleCode: string) => {
        const lowerCode = currentModuleCode.toLowerCase();
        const existingColor = get().module_colors[lowerCode];
        if (existingColor) {
          set({ module_color: existingColor });
          return;
        }

        try {
          const res = await api.get('/admin/modules');
          const list = res.data?.data || res.data || [];
          const mapping: Record<string, string> = { ...get().module_colors };

          if (Array.isArray(list)) {
            list.forEach((m: any) => {
              if (m.code && m.primary_color) {
                mapping[m.code.toLowerCase()] = m.primary_color;
              }
            });
          }

          const activeColor = mapping[lowerCode] || null;
          set({
            module_colors: mapping,
            module_color: activeColor,
          });
        } catch (error) {
          console.error('Failed to fetch module color:', error);
        }
      },

      fetchAllModuleColors: async () => {
        try {
          const res = await api.get('/admin/modules');
          const list = res.data?.data || res.data || [];
          const mapping: Record<string, string> = { ...get().module_colors };

          if (Array.isArray(list)) {
            list.forEach((m: any) => {
              if (m.code && m.primary_color) {
                mapping[m.code.toLowerCase()] = m.primary_color;
              }
            });
          }

          set({ module_colors: mapping });
          return mapping;
        } catch (error) {
          console.error('Failed to fetch all module colors:', error);
          return get().module_colors;
        }
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
