/**
 * Typed client for the Volt API.
 *
 * Every response uses the envelope from docs/02 §7:
 *   { success, data, error: { code, message, fields, request_id } }
 * The client unwraps it and throws ApiError, so callers never inspect `success`.
 */
import type { Goal, GoalIn, Profile, ProfilePatch, TokenPair } from '@volt/api-types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from './storage';

function defaultBase(): string {
  // NOTE: babel-preset-expo INLINES EXPO_PUBLIC_* at build time — this compiles to
  // a literal, not a lookup. Setting it in the shell after Metro has started does
  // nothing; restart Metro (or rebuild) for a change to take effect. That is also
  // why the branch is not unit-tested: under Jest it is already `undefined`.
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web') return 'http://localhost:8000';
  // A physical device cannot reach the laptop on localhost — use the Metro host LAN IP.
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:8000` : 'http://localhost:8000';
}

export const API_BASE = defaultBase();

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
    readonly requestId?: string,
  ) { super(message); }

  /** The message for a specific field, if the server named one. */
  field(name: string): string | undefined { return this.fields[name]; }
}

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function raw<T>(
  method: Method, path: string, body?: unknown, extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${API_BASE}/v1${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(extraHeaders ?? {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok || json?.success === false) {
    const e = json?.error ?? {};
    throw new ApiError(
      e.code ?? 'NETWORK',
      e.message ?? 'Could not reach the server. Check your connection.',
      res.status, e.fields ?? {}, e.request_id,
    );
  }
  return json?.data as T;
}

/** Runs the request; on a 401 it tries one silent refresh before surfacing the error. */
async function request<T>(
  method: Method, path: string, body?: unknown, extraHeaders?: Record<string, string>,
): Promise<T> {
  try {
    return await raw<T>(method, path, body, extraHeaders);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || path.startsWith('/auth/')) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) throw err;
    return raw<T>(method, path, body, extraHeaders);
  }
}

/**
 * A refresh in flight, shared by every caller.
 *
 * Without this, a screen that fires several queries at once produces several
 * simultaneous 401s, each of which refreshes independently with the SAME refresh
 * token. The first rotates it; the rest present a token that has just been
 * replaced, and reuse detection — correctly — revokes the entire family and
 * signs the user out. Observed in the logger, where three queries 401 together.
 *
 * Single-flighting makes the concurrent case behave like the sequential one.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const token = await getRefreshToken();
  if (!token) return false;
  try {
    const data = await raw<TokenPair>('POST', '/auth/refresh', { refresh_token: token });
    setAccessToken(data.access_token);
    await setRefreshToken(data.refresh_token);
    return true;
  } catch {
    // Reuse detection may have revoked the whole family — this session is finished.
    await clearRefreshToken();
    setAccessToken(null);
    return false;
  }
}

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export const api = {
  get:   <T>(p: string) => request<T>('GET', p),
  post:  <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b),
  put:   <T>(p: string, b?: unknown) => request<T>('PUT', p, b),
  del:   <T>(p: string) => request<T>('DELETE', p),
  /** For the outbox: an arbitrary verb with the Idempotency-Key header (I8). */
  send:  <T>(m: Method, p: string, b?: unknown, h?: Record<string, string>) =>
           request<T>(m, p, b, h),
  tryRefresh,
};

/* ---------------- typed endpoints ----------------
 * Every shape below comes from @volt/api-types, which is generated from the
 * server's OpenAPI document and gated in CI. Nothing here is hand-typed: a
 * hand-written response shape is drift with extra steps (D3b).
 */
export type { Goal, Profile, TokenPair };

interface AuthResult extends TokenPair { user: { id: string; email: string } }

export const auth = {
  register: (email: string, password: string) =>
    api.post<AuthResult>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<AuthResult>('/auth/login', { email, password }),
  me: () => api.get<{ id: string; email: string; status: string }>('/auth/me'),
  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile'),
  patch: (patch: ProfilePatch) => api.patch<Profile>('/profile', patch),
};

export const goalsApi = {
  list: () => api.get<Goal[]>('/goals'),
  create: (g: GoalIn) => api.post<Goal>('/goals', g),
};
