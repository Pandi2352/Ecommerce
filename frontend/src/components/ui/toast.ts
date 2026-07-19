import { toast as hotToast, type ToastOptions } from 'react-hot-toast';

/** Thin wrapper over react-hot-toast so the app imports one helper (one style, one API). */
const base: ToastOptions = {
  position: 'top-right',
  style: {
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: 'none',
    fontSize: '13px',
  },
};

export const toast = {
  success: (msg: string, opts?: ToastOptions) => hotToast.success(msg, { ...base, ...opts }),
  error: (msg: string, opts?: ToastOptions) => hotToast.error(msg, { ...base, ...opts }),
  /** Warning — amber icon (react-hot-toast has no native warning variant). */
  warning: (msg: string, opts?: ToastOptions) =>
    hotToast(msg, { ...base, icon: '⚠️', ...opts }),
  info: (msg: string, opts?: ToastOptions) => hotToast(msg, { ...base, icon: 'ℹ️', ...opts }),
  /** Pending toast; resolve/replace it by passing the returned id to success/error via `{ id }`. */
  loading: (msg: string, opts?: ToastOptions) => hotToast.loading(msg, { ...base, ...opts }),
  dismiss: (id?: string) => hotToast.dismiss(id),
};
