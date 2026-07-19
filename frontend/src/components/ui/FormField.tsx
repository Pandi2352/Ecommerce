import { type ReactNode, useId } from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label: ReactNode;
  /** Optional id to link the label to a control; auto-generated when omitted. */
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Labelled form control wrapper — the shared version of the
 * `<label><span>…</span><Input/></label>` block repeated across every form.
 * Renders an error or hint line underneath when provided.
 */
export function FormField({ label, htmlFor, error, hint, required, className, children }: FormFieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  );
}
