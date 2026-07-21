import type { Response } from 'express';
import { MS_PER_DAY } from '../../common/utils';

/**
 * The storefront uses its OWN refresh cookie name so a logged-in customer and a
 * logged-in admin don't clobber each other's session in local dev (cookies are
 * scoped by domain, not port, so localhost:5173 and :5175 would otherwise share one).
 */
export const SF_REFRESH_COOKIE = 'sf_refresh_token';
const SF_REFRESH_MAX_AGE = MS_PER_DAY * 7;

export function setSfRefreshCookie(res: Response, token: string): void {
  res.cookie(SF_REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SF_REFRESH_MAX_AGE,
    path: '/',
  });
}

export function clearSfRefreshCookie(res: Response): void {
  res.clearCookie(SF_REFRESH_COOKIE);
}
