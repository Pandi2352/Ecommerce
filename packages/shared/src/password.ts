/** Password policy shared by the API (DTO validation) and the client (form checks). */

export const PASSWORD_MIN_LENGTH = 8;

/** At least 8 chars, with at least one letter and one digit. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include a letter and a number.';

export const isStrongPassword = (value: string): boolean => PASSWORD_REGEX.test(value);
