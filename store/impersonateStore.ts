'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ImpersonateStore, ImpersonateState } from '@/types/impersonateStore.types';

const initialState: ImpersonateState = {
  isImpersonating: false,
  adminToken: null,
  adminRefreshToken: null,
  adminUser: null,
};

export const useImpersonateStore = create<ImpersonateStore>()(
  persist(
    (set) => ({
      ...initialState,

      startImpersonating: (adminToken, adminRefreshToken, adminUser) =>
        set({
          isImpersonating: true,
          adminToken,
          adminRefreshToken,
          adminUser,
        }),

      stopImpersonating: () =>
        set({
          isImpersonating: false,
          adminToken: null,
          adminRefreshToken: null,
          adminUser: null,
        }),
    }),
    {
      name: 'impersonate-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
