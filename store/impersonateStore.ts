'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ImpersonateStore, ImpersonateState } from '@/types/impersonateStore.types';

const initialState: ImpersonateState = {
  isImpersonating: false,
  adminToken: null,
  adminRefreshToken: null,
  adminUser: null,
  returnUrl: null,
};

export const useImpersonateStore = create<ImpersonateStore>()(
  persist(
    (set) => ({
      ...initialState,

      startImpersonating: (adminToken, adminRefreshToken, adminUser, returnUrl) =>
        set({
          isImpersonating: true,
          adminToken,
          adminRefreshToken,
          adminUser,
          returnUrl: returnUrl || null,
        }),

      stopImpersonating: () =>
        set({
          isImpersonating: false,
          adminToken: null,
          adminRefreshToken: null,
          adminUser: null,
          returnUrl: null,
        }),

      syncFromBackend: (adminUser) =>
        set((state) => ({
          isImpersonating: true,
          adminToken: state.adminToken,
          adminRefreshToken: state.adminRefreshToken,
          adminUser,
          returnUrl: state.returnUrl,
        })),
    }),
    {
      name: 'impersonate-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
