import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Shared Axios instance.
 * - Base URL from VITE_API_URL; sends cookies (httpOnly refresh token).
 * - Request: attaches the in-memory access token.
 * - Response: unwraps the `{ data }` envelope; on 401 it refreshes once and retries.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

// ── In-memory access token (never persisted; the refresh token lives in an httpOnly cookie) ──
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Callback invoked when a refresh attempt fails (session truly gone) → AuthProvider logs out.
let onAuthFailure: (() => void) | null = null;
export function onSessionExpired(cb: () => void) {
  onAuthFailure = cb;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Raw axios (bypass interceptors) so a 401 here doesn't loop.
  const res = await axios.post<{ data: { accessToken: string } }>(
    `${api.defaults.baseURL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  return res.data.data.accessToken;
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data, meta: response.data.meta };
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute = url.includes('/auth/refresh') || url.includes('/auth/login');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const token = await (refreshing ??= refreshAccessToken());
        setAccessToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
        onAuthFailure?.();
      } finally {
        refreshing = null;
      }
    }

    return Promise.reject(error.response?.data ?? { message: error.message, code: 'NETWORK_ERROR' });
  },
);
