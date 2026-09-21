import type { User } from './auth.types';

export interface ImpersonateState {
  isImpersonating: boolean;
  adminToken: string | null;
  adminRefreshToken: string | null;
  adminUser: User | null;
}

export interface ImpersonateActions {
  startImpersonating: (adminToken: string, adminRefreshToken: string, adminUser: User) => void;
  stopImpersonating: () => void;
}

export type ImpersonateStore = ImpersonateState & ImpersonateActions;
