import type { ReactNode } from 'react';

/** Shared input styling — rounded-md, border-based, NO shadows (project design rules). */
export const inputCls =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-danger disabled:opacity-60';

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-text">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-text-secondary">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}
