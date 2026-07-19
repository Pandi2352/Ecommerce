import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/formatters';

type AvatarSize = 'sm' | 'md' | 'lg';

const sizes: Record<AvatarSize, string> = {
  sm: 'size-7 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
};

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

/**
 * Initials avatar — the shared version of the indigo initials chip duplicated in
 * the Navbar and the Users table.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
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
