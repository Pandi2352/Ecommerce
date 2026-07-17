import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
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
}: TableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-table-header">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'border-b px-4 py-2.5 text-left text-xs font-medium text-text-secondary',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
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
                  'border-b last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-row-hover',
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
