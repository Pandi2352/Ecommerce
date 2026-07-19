import { storeConfig } from '@/config/store.config';

/**
 * Presentation formatters — the one place to format money, dates, and numbers.
 * Currency/locale come from `store.config` (single source of truth), so a
 * white-label clone only changes config, never these call sites.
 */

// Re-exported so features import all formatting from `@/utils/formatters`.
export { formatCurrency } from '@/config/store.config';

/** Locale-aware thousands formatting, e.g. `1,240`. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(storeConfig.locale).format(value);
}

function toDate(value?: string | number | Date | null): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `19 Jul 2026` — falls back to an em dash for missing/invalid input. */
export function formatDate(value?: string | number | Date | null): string {
  const d = toDate(value);
  return d
    ? d.toLocaleDateString(storeConfig.locale, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
}

/** `19 Jul 2026, 3:42 PM`. */
export function formatDateTime(value?: string | number | Date | null): string {
  const d = toDate(value);
  return d
    ? d.toLocaleString(storeConfig.locale, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
}

/**
 * Relative time, e.g. `3 min ago`, `in 12 min`, `2 days ago`. Handles both past
 * and future. Useful for "invited 5 min ago" / "expires in 10 min".
 */
export function formatRelative(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '—';
  const diffMs = d.getTime() - Date.now();
  const past = diffMs < 0;
  const suffix = (n: number, unit: string) => {
    const label = `${n} ${unit}${n === 1 ? '' : 's'}`;
    return past ? `${label} ago` : `in ${label}`;
  };
  const mins = Math.round(Math.abs(diffMs) / 60_000);
  if (mins < 1) return past ? 'just now' : 'in <1 min';
  if (mins < 60) return past ? `${mins} min ago` : `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return suffix(hrs, 'hr');
  return suffix(Math.round(hrs / 24), 'day');
}

/** Up to two uppercase initials from a name, e.g. `John Doe` → `JD`. */
export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
