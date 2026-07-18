import { api } from '@/lib/api';

export type Role = 'ADMIN' | 'MODERATOR' | 'OPERATOR' | 'ANALYST' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthPayload {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  signup: (input: { name: string; email: string; password: string }) =>
    api.post<AuthPayload>('/auth/signup', input).then((r) => r.data),

  login: (input: { email: string; password: string }) =>
    api.post<AuthPayload>('/auth/login', input).then((r) => r.data),

  /** Uses the httpOnly refresh cookie to mint a new access token. */
  refresh: () => api.post<AuthPayload>('/auth/refresh').then((r) => r.data),

  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout').then(() => undefined),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(() => undefined),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then(() => undefined),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }).then(() => undefined),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then(() => undefined),

  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch<AuthUser>('/auth/profile', data).then((r) => r.data),

  listSessions: () =>
    api
      .get<{ id: string; userAgent: string; createdAt: string; expiresAt: string }[]>('/auth/sessions')
      .then((r) => r.data),

  revokeSession: (id: string) => api.delete(`/auth/sessions/${id}`).then(() => undefined),
};
