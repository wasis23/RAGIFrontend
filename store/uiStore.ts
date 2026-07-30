'use client';

import { create } from 'zustand';

// ============================================================
// UI STORE — Global UI state (sidebar, modal, theme)
// ============================================================

interface UiState {
  sidebar_open: boolean;
  active_modal: string | null;
  is_dark_mode: boolean;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleDarkMode: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>((set) => ({
  sidebar_open: true,
  active_modal: null,
  is_dark_mode: false,

  toggleSidebar: () => set((state) => ({ sidebar_open: !state.sidebar_open })),
  setSidebarOpen: (open) => set({ sidebar_open: open }),
  openModal: (modalId) => set({ active_modal: modalId }),
  closeModal: () => set({ active_modal: null }),
  toggleDarkMode: () => set((state) => ({ is_dark_mode: !state.is_dark_mode })),
}));
