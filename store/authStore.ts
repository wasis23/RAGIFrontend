'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, User } from '@/types/auth.types';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';

// ============================================================
// AUTH STORE — Global state autentikasi (Zustand)
// Mengelola: user, token, status login, MFA state
// Mengacu pada tabel: users, sso_tokens
// ============================================================

interface AuthActions {
  setAuth: (user: User, access_token: string, refresh_token: string) => void;
  setUser: (user: User) => void;
  setLoading: (is_loading: boolean) => void;
  setRequiresMfa: (user_id: number) => void;
  clearMfa: () => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  is_authenticated: false,
  is_loading: false,
  requires_mfa: false,
  mfa_user_id: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (user, access_token, refresh_token) => {
        // Simpan token di localStorage
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        set({
          user,
          access_token,
          refresh_token,
          is_authenticated: true,
          is_loading: false,
          requires_mfa: false,
          mfa_user_id: null,
        });
      },

      setUser: (user) => set({ user }),

      setLoading: (is_loading) => set({ is_loading }),

      setRequiresMfa: (user_id) =>
        set({
          requires_mfa: true,
          mfa_user_id: user_id,
          is_loading: false,
        }),

      clearMfa: () =>
        set({
          requires_mfa: false,
          mfa_user_id: null,
        }),

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set(initialState);
      },
    }),
    {
      name: 'sso-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        is_authenticated: state.is_authenticated,
      }),
    }
  )
);
