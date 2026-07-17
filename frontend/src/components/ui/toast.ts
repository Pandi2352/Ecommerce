import { toast as hotToast, type ToastOptions } from 'react-hot-toast';

/** Thin wrapper over react-hot-toast so the app imports one helper. */
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
  success: (msg: string) => hotToast.success(msg, base),
  error: (msg: string) => hotToast.error(msg, base),
  info: (msg: string) => hotToast(msg, base),
};
