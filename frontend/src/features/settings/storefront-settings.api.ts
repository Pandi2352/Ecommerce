import { api } from '@/lib/api';

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  badgeText?: string;
  isActive: boolean;
  order: number;
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  buttonRadius?: string;
  fontFamily?: string;
  buttonStyle?: 'gradient' | 'solid' | 'outline';
  darkMode?: boolean;
}

export interface HomepageSections {
  showBanners?: boolean;
  showFeatured?: boolean;
  showBestSellers?: boolean;
  showCategories?: boolean;
  showDeals?: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

export interface StorefrontSettings {
  storeName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultProductImageUrl?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
  theme?: ThemeConfig;
  banners?: BannerSlide[];
  homepageSections?: HomepageSections;
  socialLinks?: SocialLinks;
}

export type StorefrontSettingsInput = Partial<StorefrontSettings>;

export const fetchStorefrontSettings = () =>
  api.get<StorefrontSettings>('/settings').then((r) => r.data);

export const fetchPublicStorefrontSettings = () =>
  api.get<StorefrontSettings>('/settings/public').then((r) => r.data);

export const updateStorefrontSettings = (dto: StorefrontSettingsInput) =>
  api.patch<StorefrontSettings>('/settings', dto).then((r) => r.data);
