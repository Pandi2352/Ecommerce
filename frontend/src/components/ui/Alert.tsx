import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type AlertTone = 'danger' | 'success' | 'warning' | 'info';

const tones: Record<AlertTone, string> = {
  danger: 'border-danger/40 bg-danger/10 text-danger',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  info: 'border-info/40 bg-info/10 text-info',
};

export interface AlertProps {
  tone?: AlertTone;
  className?: string;
  children?: ReactNode;
}

/**
 * Inline message banner — the shared version of the tinted error/info `<div>`
 * repeated on forms. Renders nothing when there are no children, so it's safe to
 * write `<Alert>{error}</Alert>` with a possibly-empty value.
 */
export function Alert({ tone = 'danger', className, children }: AlertProps) {
  if (!children) return null;
  return (
    <div className={cn('rounded-md border px-3 py-2 text-sm', tones[tone], className)} role="alert">
      {children}
    </div>
  );
}
