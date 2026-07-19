/**
 * Extract a human-readable message from an unknown thrown value.
 *
 * The axios interceptor rejects with the backend error envelope
 * (`{ message, ... }`), but a value could also be a plain `Error`, a string, or
 * a network failure — this normalizes all of them so catch blocks stay one-liners.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
