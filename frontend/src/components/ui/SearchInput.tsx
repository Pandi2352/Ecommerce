import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'onSubmit'> {
  value: string;
  /** Fires with the raw string on every keystroke. */
  onValueChange: (value: string) => void;
  /** Called when cleared (via the ✕ button or Escape). Defaults to `onValueChange('')`. */
  onClear?: () => void;
  /** Fires with the current value on Enter. */
  onSubmit?: (value: string) => void;
  /** Show a spinner on the right (e.g. while results load). */
  loading?: boolean;
  /** Wrapper class — put width/flex here (e.g. `min-w-56 flex-1`). */
  containerClassName?: string;
}

/**
 * Reusable search field: left search icon, clearable ✕ button, Escape-to-clear,
 * optional Enter submit and loading spinner. Controlled via `value`/`onValueChange`.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value,
    onValueChange,
    onClear,
    onSubmit,
    loading = false,
    placeholder = 'Search…',
    disabled,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const clear = () => (onClear ? onClear() : onValueChange(''));

  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={typeof placeholder === 'string' ? placeholder : 'Search'}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            clear();
          } else if (e.key === 'Enter') {
            onSubmit?.(value);
          }
        }}
        className={cn(
          'h-10 w-full rounded-md border bg-surface pl-9 pr-9 text-sm text-text',
          'placeholder:text-text-secondary focus:border-info focus:outline-none',
          'disabled:opacity-50',
          // hide the native search "cancel" X so we control it
          '[&::-webkit-search-cancel-button]:appearance-none',
          className,
        )}
        {...props}
      />
      {loading ? (
        <svg className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-row-hover hover:text-text"
          >
            <X className="size-4" />
          </button>
        )
      )}
    </div>
  );
});
