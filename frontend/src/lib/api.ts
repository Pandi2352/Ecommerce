import axios from 'axios';

/**
 * Shared Axios instance. Base URL comes from VITE_API_URL. The response interceptor
 * unwraps the backend's `{ data }` envelope so callers get the payload directly.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    // Unwrap { data } / { data, meta } envelope.
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data, meta: response.data.meta };
    }
    return response;
  },
  (error) => {
    const payload = error.response?.data;
    return Promise.reject(payload ?? { message: error.message, code: 'NETWORK_ERROR' });
  },
);
