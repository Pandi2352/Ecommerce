import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Meta } from '@/lib/types';
import { Button } from './Button';
import { Select } from './Select';

export interface PaginationProps {
  /** Server-provided pagination metadata (`{ data, meta }` envelope). */
  meta: Meta;
  onPageChange: (page: number) => void;
  /** Optional — render a page-size selector when provided. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/** Windowed page list with ellipses, e.g. `1 … 4 5 6 … 20`. */
function pageWindow(current: number, total: number, span = 1): (number | '…')[] {
  const pages = new Set<number>([1, total]);
  for (let i = current - span; i <= current + span; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Reusable server-side pagination bar. Drives page/pageSize changes back to the
 * caller (which refetches from the API) — it never slices data on the client.
 * Advanced: "showing X–Y of Z", page-size selector, first/prev/next/last, and a
 * windowed numbered page list.
 */
export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: PaginationProps) {
  const { page, pageSize, total, totalPages, hasNext, hasPrev } = meta;
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary', className)}>
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-medium text-text">{from}</span>–
          <span className="font-medium text-text">{to}</span> of{' '}
          <span className="font-medium text-text">{total}</span>
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span>Per page</span>
            <Select
              className="h-8 w-18"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" iconOnly aria-label="First page" disabled={!hasPrev} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" iconOnly aria-label="Previous page" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1.5 text-text-secondary">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'primary' : 'ghost'}
              size="sm"
              iconOnly
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}

        <Button variant="ghost" size="sm" iconOnly aria-label="Next page" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" iconOnly aria-label="Last page" disabled={!hasNext} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
