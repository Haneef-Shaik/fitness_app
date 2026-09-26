/**
 * Typed client for the FitLog API.
 *
 * Every response uses the envelope from docs/02 §7:
 *   { success, data, error: { code, message, fields, request_id } }
 * The client unwraps it and throws ApiError, so callers never inspect `success`.
 */
import type { Goal, GoalIn, GoalPatch, Me, Profile, ProfilePatch } from '@fitlog/api-types';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

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

/**
 * A URL the server handed out, made loadable.
 *
 * The local object store signs paths on this API (`/v1/uploads/…`); the hosted
 * one (S3) signs absolute bucket URLs. Both are expiring capabilities, so an
 * `<Image>` loads either with no token — only a relative one needs the base.
 */
export function resolveApiUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

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

/**
 * The request id of the last call the server refused. "Report a problem" sends
 * it, so a report like "it didn't save" leads straight to the log line saying
 * why (docs/06 §10). An id, not the request: nothing the user typed is kept.
 */
let lastFailedRequest: string | null = null;
export const lastFailedRequestId = () => lastFailedRequest;

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
    if (e.request_id) lastFailedRequest = e.request_id;
    throw new ApiError(
      e.code ?? 'NETWORK',
      e.message ?? 'Could not reach the server. Check your connection.',
      res.status, e.fields ?? {}, e.request_id,
    );
  }
  return json?.data as T;
}

export interface Page<T> {
  data: T;
  /**
   * The envelope's `meta`. `next_cursor` is **opaque** — feed it back, never
   * parse it (H5.1). Absent when the endpoint does not paginate.
   */
  meta?: {
    limit?: number;
    count?: number;
    next_cursor?: string | null;
    has_more?: boolean;
    filtered?: boolean;
    total_unfiltered?: number | null;
  };
}

/**
 * Like `raw`, but keeps the envelope instead of unwrapping to `data`.
 *
 * `raw` returns `json.data` and drops everything else, which is right until a
 * response carries the cursor in `meta` — at that point unwrapping throws away
 * the only route to page two.
 */
async function rawPaged<T>(path: string): Promise<Page<T>> {
  const res = await fetch(`${API_BASE}/v1${path}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok || json?.success === false) {
    const e = json?.error ?? {};
    if (e.request_id) lastFailedRequest = e.request_id;
    throw new ApiError(
      e.code ?? 'NETWORK',
      e.message ?? 'Could not reach the server. Check your connection.',
      res.status, e.fields ?? {}, e.request_id,
    );
  }
  // `?? []` so a filtered-empty page (I13) is iterable without a guard at every
  // call site; the distinction it needs lives in `meta.filtered`, not in null.
  return { data: (json?.data ?? []) as T, meta: json?.meta };
}

/** Runs the request; on a 401 it tries one silent refresh before surfacing the error. */
async function request<T>(
  method: Method, path: string, body?: unknown, extraHeaders?: Record<string, string>,
): Promise<T> {
  try {
    return await raw<T>(method, path, body, extraHeaders);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) throw err;
    return raw<T>(method, path, body, extraHeaders);
  }
}

/**
 * A refresh in flight, shared by every caller.
 *
 * A screen that fires several queries at once gets several 401s together; each
 * refreshing on its own would present the same refresh token several times,
 * and Supabase — like FitLog before it — treats a reused refresh token as
 * stolen and ends the session. Observed in the logger, where three queries
 * 401 together. Single-flighting makes the concurrent case behave like the
 * sequential one.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * L-05 — who hears that the server has ended this session. The session provider,
 * which asks the user to sign in again over the screen they are on, rather than
 * the whole app dropping them at the login screen mid-meal or mid-workout.
 */
let revokedListener: (() => void) | null = null;
export function onSessionRevoked(listener: (() => void) | null): void {
  revokedListener = listener;
}

async function performRefresh(): Promise<boolean> {
  // Supabase Auth holds the session (lib/supabase.ts); a 401 from the FitLog
  // API means its access token went stale or its sign-in ended.
  const { data, error } = await supabase.auth.refreshSession();
  if (data.session) {
    setAccessToken(data.session.access_token);
    return true;
  }
  // ONLY an answer from Supabase means the sign-in is over. No answer at all
  // — the phone has no signal — says nothing about whether it is still valid,
  // and signing out for it ejected someone from a workout in progress (found
  // on a phone, relaunching with the server unreachable). supabase-js keeps
  // the stored session on a retryable failure for the same reason.
  if (error && !isAuthRetryableFetchError(error)) {
    setAccessToken(null);
    revokedListener?.();
  }
  return false;
}

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export const api = {
  get:   <T>(p: string) => request<T>('GET', p),
  /** A cursor-paged read: rows plus the envelope's meta (H5.1). */
  getPaged: async <T>(p: string): Promise<Page<T>> => {
    try {
      return await rawPaged<T>(p);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) throw err;
      if (!(await tryRefresh())) throw err;
      return rawPaged<T>(p);
    }
  },
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
 * Every shape below comes from @fitlog/api-types, which is generated from the
 * server's OpenAPI document and gated in CI. Nothing here is hand-typed: a
 * hand-written response shape is drift with extra steps (D3b).
 */
export type { Goal, Me, Profile };

/** Signing in, out and everything between is Supabase's (lib/supabase.ts);
 *  the API only says who the bearer is — and creates the account on a first
 *  sign-in. */
export const auth = {
  me: () => api.get<Me>('/auth/me'),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile'),
  patch: (patch: ProfilePatch) => api.patch<Profile>('/profile', patch),
};

export const goalsApi = {
  list: () => api.get<Goal[]>('/goals'),
  get: (id: string) => api.get<Goal>(`/goals/${id}`),
  create: (g: GoalIn) => api.post<Goal>('/goals', g),
  patch: (id: string, body: GoalPatch) => api.patch<Goal>(`/goals/${id}`, body),
};
