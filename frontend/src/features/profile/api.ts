import { api, uploadImage } from '@/lib/api';

export { uploadImage };

export interface ProfileLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  links?: ProfileLinks;
  lastLogin?: string;
  createdAt?: string;
  permissions?: string[];
}

export interface ProfileInput {
  name?: string;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  links?: ProfileLinks;
}

export const fetchMyProfile = () => api.get<AdminProfile>('/auth/me').then((r) => r.data);
export const updateMyProfile = (dto: ProfileInput) =>
  api.patch<AdminProfile>('/auth/profile', dto).then((r) => r.data);
export const fetchAdminProfile = (id: string) =>
  api.get<AdminProfile>(`/users/${id}`).then((r) => r.data);
