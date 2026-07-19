/**
 * Tiny, dependency-free validators for inline form checks.
 * Keep the rules here so "min 8 chars", "looks like an email", etc. mean the
 * same thing on every page (and match the backend DTO rules).
 */

import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '@ecommerce/shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string): boolean => EMAIL_RE.test(value.trim());

export const minLength = (value: string, length: number): boolean => value.trim().length >= length;

/** Matches the backend password policy (≥ 8 chars, a letter + a number). */
export const isValidPassword = (value: string): boolean => isStrongPassword(value);

/** User-facing description of the password rule (shared with the API). */
export const PASSWORD_HINT = PASSWORD_POLICY_MESSAGE;

/** Non-empty after trimming. */
export const isRequired = (value: string): boolean => value.trim().length > 0;
