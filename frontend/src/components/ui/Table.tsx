import type { ReactNode } from 'react';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  className?: string;
  /** Enable click-to-sort on this column's header. */
  sortable?: boolean;
  /** Field name sent to the API when sorting (defaults to `key`). */
  sortKey?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  /** Current sort (field + direction). */
  sort?: SortState;
  /** Called with the column's sortKey when a sortable header is clicked. */
  onSort?: (key: string) => void;
}

/** Custom headless table styled to the design tokens (bordered, dense, no shadow). */
export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  emptyState,
  className,
  sort,
  onSort,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-surface', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-table-header">
            {columns.map((col) => {
              const canSort = col.sortable && onSort;
              const field = col.sortKey ?? col.key;
              const activeSort = sort?.key === field;
              return (
                <th
                  key={col.key}
                  className={cn(
                    'border-b border-border px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-text-secondary',
                    col.className,
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(field)}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1 hover:text-text',
                        activeSort && 'text-text',
                      )}
                    >
                      {col.header}
                      {activeSort ? (
                        sort?.dir === 'asc' ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-secondary">
                {emptyState ?? 'No results'}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  'even:bg-row-stripe hover:bg-row-hover',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-text', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
