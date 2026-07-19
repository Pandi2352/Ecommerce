import type { Response } from 'express';
import { MS_PER_DAY } from '../../common/utils';

/** Name + lifetime of the refresh-token cookie — single source of truth for both auth controllers. */
export const REFRESH_COOKIE = 'refresh_token';
export const REFRESH_MAX_AGE = MS_PER_DAY * 7;

/** Set the rotating refresh token as an httpOnly cookie (never exposed to JS). */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_MAX_AGE,
    path: '/',
  });
}

/** Clear the refresh cookie (logout). */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE);
}
