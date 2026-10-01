import { create } from 'zustand';

import {
  apiFetch,
  clearTokens,
  getTokens,
  setTokens,
  AuthExpiredError,
} from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type Status = 'loading' | 'authed' | 'guest';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  /** Load persisted session: validates against /auth/me, refreshes if needed. */
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** Returns true when the account was created AND signed in.
   *  False means "check your email / please sign in" (existing email). */
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

function toUser(raw: unknown): AuthUser {
  const u = raw as Record<string, unknown>;
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    name: String(u.name ?? ''),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  restore: async () => {
    try {
      const { access } = await getTokens();
      if (!access) {
        set({ status: 'guest', user: null });
        return;
      }
      const me = await apiFetch<{ id: string; email: string; name: string }>('/api/auth/me');
      set({ status: 'authed', user: toUser(me) });
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        set({ status: 'guest', user: null });
      } else {
        // Network down etc. — stay on splash until we know more.
        set({ status: 'guest', user: null });
      }
    }
  },

  login: async (email, password) => {
    const data = await apiFetch<{ token: string; refreshToken: string; user: unknown }>(
      '/api/auth/login',
      { method: 'POST', anonymous: true, body: { email, password } },
    );
    await setTokens(data.token, data.refreshToken);
    set({ status: 'authed', user: toUser(data.user) });
  },

  register: async (name, email, password) => {
    const data = await apiFetch<{ token?: string; refreshToken?: string; user?: unknown }>(
      '/api/auth/register',
      { method: 'POST', anonymous: true, body: { name, email, password } },
    );
    if (data.token && data.refreshToken) {
      await setTokens(data.token, data.refreshToken);
      set({ status: 'authed', user: toUser(data.user) });
      return true;
    }
    // Existing email: backend returns 201 with a message but no token.
    return false;
  },

  logout: async () => {
    try {
      const { refresh } = await getTokens();
      if (refresh) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          anonymous: true,
          body: { refreshToken: refresh },
        }).catch(() => {});
      }
    } finally {
      await clearTokens();
      set({ status: 'guest', user: null });
    }
  },
}));
