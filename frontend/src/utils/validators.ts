/**
 * Tiny, dependency-free validators for inline form checks.
 * Keep the rules here so "min 8 chars", "looks like an email", etc. mean the
 * same thing on every page (and match the backend DTO rules).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string): boolean => EMAIL_RE.test(value.trim());

export const minLength = (value: string, length: number): boolean => value.trim().length >= length;

/** Matches the backend password rule (≥ 8 chars). */
export const isValidPassword = (value: string): boolean => value.length >= 8;

/** Non-empty after trimming. */
export const isRequired = (value: string): boolean => value.trim().length > 0;
