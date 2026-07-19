import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Prefix icon (before the label). */
  leftIcon?: ReactNode;
  /** Suffix icon (after the label). */
  rightIcon?: ReactNode;
  /** Show a spinner and disable the button. */
  loading?: boolean;
  /** Square icon-only button (no text padding). */
  iconOnly?: boolean;
  /** Stretch to full width. */
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  // Project theme — indigo (not black).
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
  secondary: 'bg-surface border border-border text-text hover:bg-row-hover',
  danger: 'bg-surface border border-danger text-danger hover:bg-danger/10',
  ghost: 'text-text hover:bg-row-hover',
  outline: 'bg-transparent border border-border text-text hover:bg-row-hover',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

const iconSizes: Record<Size, string> = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
};

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      loading = false,
      iconOnly = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info',
        'disabled:pointer-events-none disabled:opacity-50',
        iconOnly ? cn(iconSizes[size], 'p-0') : sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
