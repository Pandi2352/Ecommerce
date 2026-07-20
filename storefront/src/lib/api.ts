import axios, { type AxiosRequestConfig } from 'axios';
import type { Meta, Paginated } from './types';

/**
 * Public storefront Axios instance. No auth — every storefront endpoint is public.
 * Unwraps the backend `{ data, meta }` envelope so callers get the payload directly.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data, meta: response.data.meta };
    }
    return response;
  },
  (error) =>
    Promise.reject(error.response?.data ?? { message: error.message, code: 'NETWORK_ERROR' }),
);

/** Typed GET for paginated list endpoints. */
export async function getList<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
  const res = await api.get<T[]>(url, config);
  return { data: res.data, meta: (res as unknown as { meta: Meta }).meta };
}
