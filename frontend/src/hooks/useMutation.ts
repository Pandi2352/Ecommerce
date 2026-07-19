import { useState } from 'react';
import { toast } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export interface RunOptions<T> {
  /** Toast shown on success (omit for no toast). */
  success?: string;
  /** Fallback toast message on failure. */
  error?: string;
  /** Runs after success, before `saving` flips back — e.g. close modal + reload list. */
  onSuccess?: (result: T) => void | Promise<void>;
}

/**
 * Standardizes the write flow used by every CRUD page:
 * set `saving` → run the action → toast success → onSuccess (close/reload) →
 * on error toast the message → always clear `saving`.
 *
 * ```ts
 * const { saving, run } = useMutation();
 * const save = () => run(() => createRole(input), {
 *   success: 'Role created',
 *   onSuccess: () => { close(); void reload(); },
 * });
 * ```
 */
export function useMutation() {
  const [saving, setSaving] = useState(false);

  async function run<T>(action: () => Promise<T>, options: RunOptions<T> = {}): Promise<T | undefined> {
    setSaving(true);
    try {
      const result = await action();
      if (options.success) toast.success(options.success);
      await options.onSuccess?.(result);
      return result;
    } catch (e) {
      toast.error(getErrorMessage(e, options.error));
      return undefined;
    } finally {
      setSaving(false);
    }
  }

  return { saving, run };
}
