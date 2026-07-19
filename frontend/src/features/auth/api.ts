import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Role name (dynamic — see the roles feature). */
  role: string;
  avatarUrl?: string;
  /** Flattened permission keys granted by the role. */
  permissions: string[];
}

interface AuthPayload {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (input: { email: string; password: string }) =>
    api.post<AuthPayload>('/auth/login', input).then((r) => r.data),

  /** Invited user sets their password → logged in. */
  acceptInvite: (token: string, password: string) =>
    api.post<AuthPayload>('/auth/accept-invite', { token, password }).then((r) => r.data),

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

  /** Sign out everywhere (revoke all sessions + invalidate access tokens). */
  revokeAllSessions: () => api.delete('/auth/sessions').then(() => undefined),
};
