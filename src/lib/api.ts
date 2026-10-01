import * as SecureStore from 'expo-secure-store';

/**
 * NutriAI API client — talks to the live Vercel backend.
 *
 * - Attaches `Authorization: Bearer <accessToken>` (1h TTL).
 * - On 401, rotates via POST /api/auth/refresh exactly once, then retries.
 * - Refresh tokens rotate on every use: the new pair always replaces the old.
 * - A 401 from /auth/refresh means the session is dead → tokens are wiped
 *   and AuthExpiredError is thrown so the app can force a re-login.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://nutriai-backend-nu.vercel.app';

const ACCESS_KEY = 'nutriai.accessToken';
const REFRESH_KEY = 'nutriai.refreshToken';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class AuthExpiredError extends ApiError {
  constructor() {
    super(401, 'Session expired — please sign in again');
    this.name = 'AuthExpiredError';
  }
}

export async function getTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {}),
  ]);
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.error === 'string' && b.error) return b.error;
    if (typeof b.message === 'string' && b.message) return b.message;
  }
  return fallback;
}

/** Single-flight refresh so parallel 401s don't burn the rotating token. */
let refreshFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshFlight) {
    refreshFlight = (async () => {
      const { refresh } = await getTokens();
      if (!refresh) throw new AuthExpiredError();
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (res.status === 401 || res.status === 400) {
        await clearTokens();
        throw new AuthExpiredError();
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(res.status, errorMessage(body, 'Could not refresh session'));
      }
      const data = (await res.json()) as { token?: string; refreshToken?: string };
      if (!data.token || !data.refreshToken) throw new AuthExpiredError();
      await setTokens(data.token, data.refreshToken);
      return data.token;
    })().finally(() => {
      refreshFlight = null;
    });
  }
  return refreshFlight;
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** skip the Authorization header (public endpoints) */
  anonymous?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { anonymous, body, headers, ...rest } = options;

  const doFetch = async (token: string | null): Promise<Response> => {
    const h: Record<string, string> = {
      ...(headers as Record<string, string> | undefined),
    };
    if (body !== undefined && !(body instanceof FormData)) {
      h['Content-Type'] = 'application/json';
    }
    if (token && !anonymous) h.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: h,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const parse = async (res: Response): Promise<T> => {
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, errorMessage(data, `Request failed (${res.status})`));
    return data as T;
  };

  const { access } = await getTokens();
  let res = await doFetch(access);

  if (res.status === 401 && !anonymous) {
    // Access token dead — rotate once and retry.
    const fresh = await refreshAccessToken();
    res = await doFetch(fresh);
    if (res.status === 401) {
      await clearTokens();
      throw new AuthExpiredError();
    }
  }

  return parse(res);
}

/** Multipart upload (food detection photo). Field name is `image`, 5MB cap. */
export async function apiUpload<T>(
  path: string,
  uri: string,
  fieldName = 'image',
): Promise<T> {
  const { access } = await getTokens();
  const form = new FormData();
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  form.append(fieldName, {
    uri,
    name: filename,
    type: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
  } as unknown as Blob);

  let res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    body: form,
  });

  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${fresh}` },
      body: form,
    });
    if (res.status === 401) {
      await clearTokens();
      throw new AuthExpiredError();
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, `Upload failed (${res.status})`));
  return data as T;
}
