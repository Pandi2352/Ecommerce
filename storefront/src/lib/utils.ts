import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditional class names, Tailwind-conflict aware. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a rupee amount. Prices are stored as plain numbers (rupees). */
export function money(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

/** High-quality default product image fallback for storefront product cards */
export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

/** High-quality default banner image fallback */
export const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200';
