import type { BadgeTone } from '@/components/ui';

/**
 * Domain value → Badge tone maps. Import these instead of re-deriving a
 * `status → color` switch on every page, so status colors stay consistent.
 */

/** User account status (see backend `UserStatus`). */
export const USER_STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  INVITED: 'info',
  SUSPENDED: 'warning',
  BANNED: 'danger',
  DELETED: 'neutral',
};

/** Order lifecycle status (used once orders land). */
export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
};

/** Resolve a tone from a map, defaulting to neutral for unknown values. */
export const toneFor = (map: Record<string, BadgeTone>, value?: string | null): BadgeTone =>
  (value && map[value]) || 'neutral';
