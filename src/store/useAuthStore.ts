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
  /** Returns true when the user ends up signed in (new account, or existing
   *  email with a correct password). False means the email exists but the
   *  password didn't match — the UI should send them to login. */
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

export const useAuthStore = create<AuthState>((set) => {
  /** Shared sign-in: stores the token pair and marks the session authed. */
  const signIn = async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; refreshToken: string; user: unknown }>(
      '/api/auth/login',
      { method: 'POST', anonymous: true, body: { email, password } },
    );
    await setTokens(data.token, data.refreshToken);
    set({ status: 'authed', user: toUser(data.user) });
  };

  return {
    status: 'loading' as Status,
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

    login: signIn,

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
      // Existing email: the backend issues no token (anti-enumeration).
      // The user probably just forgot they had an account — try the
      // credentials they just typed so a correct password takes them
      // straight into the app instead of bouncing them to login.
      try {
        await signIn(email, password);
        return true;
      } catch {
        return false;
      }
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
  };
});
