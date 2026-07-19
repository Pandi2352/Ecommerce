import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/formatters';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<AvatarSize, string> = {
  sm: 'size-7 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-20 text-2xl',
};

export interface AvatarProps {
  name: string;
  /** Optional image URL; falls back to initials when absent. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

/**
 * Avatar — shows the photo when `src` is set, otherwise an indigo initials chip.
 */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full border border-border object-cover', sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-border bg-indigo-500/10 font-bold text-indigo-500',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
