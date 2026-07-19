import { api } from '@/lib/api';

export interface BusinessAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface BusinessSettings {
  storeName: string;
  legalName?: string;
  tagline?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: BusinessAddress;
  currency: string;
  locale: string;
  timezone: string;
  uploadDriver: 'local' | 's3';
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
}

export type BusinessSettingsInput = Partial<BusinessSettings> & { s3SecretAccessKey?: string };

export const fetchSettings = () => api.get<BusinessSettings>('/settings').then((r) => r.data);
export const updateSettings = (dto: BusinessSettingsInput) =>
  api.patch<BusinessSettings>('/settings', dto).then((r) => r.data);
