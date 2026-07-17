/**
 * Single source of truth for store identity / branding.
 *
 * COPY-FRIENDLY: to repurpose this whole codebase for a different ecommerce, change
 * the values here (and reseed the catalog) — do NOT hardcode brand/currency/locale
 * anywhere else. (A backend Settings collection will override these at runtime later.)
 */
export interface StoreConfig {
  name: string;
  tagline: string;
  /** Single-letter/short mark shown in the logo tile. */
  logoMark: string;
  currency: string;
  locale: string;
}

export const storeConfig: StoreConfig = {
  name: 'NovaShop',
  tagline: "Here's what's happening with your store today.",
  logoMark: 'N',
  currency: 'INR',
  locale: 'en-IN',
};

/** Format a number as the store's currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(storeConfig.locale, {
    style: 'currency',
    currency: storeConfig.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
