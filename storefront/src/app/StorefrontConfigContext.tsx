import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';

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

export interface StorefrontConfig {
  storeName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
  theme?: ThemeConfig;
  banners?: BannerSlide[];
  homepageSections?: HomepageSections;
  socialLinks?: SocialLinks;
}

const StorefrontConfigContext = createContext<{
  config: StorefrontConfig | null;
  loading: boolean;
  refetch: () => void;
}>({
  config: null,
  loading: true,
  refetch: () => {},
});

export function StorefrontConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
    axios
      .get<{ data: StorefrontConfig }>(`${apiUrl}/settings/public`)
      .then((res) => {
        const data = res.data?.data ?? (res.data as unknown as StorefrontConfig);
        setConfig(data);
        applyTheme(data?.theme);
        applyFavicon(data?.faviconUrl);
      })
      .catch((err) => {
        console.warn('Failed to load public storefront settings:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <StorefrontConfigContext.Provider value={{ config, loading, refetch: fetchConfig }}>
      {children}
    </StorefrontConfigContext.Provider>
  );
}

export const useStorefrontConfig = () => useContext(StorefrontConfigContext);

/** Dynamically inject admin-configured CSS variables into `:root` */
function applyTheme(theme?: ThemeConfig) {
  if (!theme) return;
  const root = document.documentElement;

  if (theme.primaryColor) {
    root.style.setProperty('--accent', theme.primaryColor);
    root.style.setProperty('--accent-hover', adjustColorBrightness(theme.primaryColor, -15));
  }
  if (theme.accentColor) {
    root.style.setProperty('--pink', theme.accentColor);
    root.style.setProperty(
      '--gradient-warm',
      `linear-gradient(135deg, ${theme.primaryColor ?? '#6366f1'} 0%, ${theme.accentColor} 100%)`,
    );
  }
  if (theme.buttonRadius) {
    root.style.setProperty('--radius-md', theme.buttonRadius);
  }
  if (theme.fontFamily && theme.fontFamily !== 'System') {
    root.style.setProperty(
      '--font-sans',
      `'${theme.fontFamily}', ui-sans-serif, system-ui, sans-serif`,
    );
  }
}

/** Update favicon link tag */
function applyFavicon(faviconUrl?: string) {
  if (!faviconUrl) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}

function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}
