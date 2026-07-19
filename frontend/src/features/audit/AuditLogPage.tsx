import { Alert, Badge, Pagination, SearchInput, Table, type Column, type BadgeTone } from '@/components/ui';
import { PageHeader } from '@/components/common';
import { formatDateTime } from '@/utils/formatters';
import { useAuditLogs, type AuditLog } from './api';

const methodTone = (method?: string): BadgeTone =>
  method === 'POST' ? 'success' : method === 'DELETE' ? 'danger' : method === 'GET' ? 'neutral' : 'info';

const statusTone = (code?: number): BadgeTone =>
  !code ? 'neutral' : code < 300 ? 'success' : code < 500 ? 'warning' : 'danger';

export function AuditLogPage() {
  const { data, meta, loading, error, filters, setFilters } = useAuditLogs();

  const columns: Column<AuditLog>[] = [
    {
      key: 'when',
      header: 'When',
      className: 'w-44',
      cell: (l) => <span className="whitespace-nowrap text-xs text-text-secondary">{formatDateTime(l.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (l) => (
        <div className="leading-tight">
          <p className="text-sm font-medium text-text">{l.actor?.name ?? l.actor?.email ?? 'system'}</p>
          <p className="text-[11px] text-text-secondary">
            {l.actor?.email}
            {l.actor?.role ? ` · ${l.actor.role}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (l) => (
        <div className="flex items-center gap-2">
          <Badge tone={methodTone(l.method)}>{l.method}</Badge>
          {l.resource && <Badge tone="neutral">{l.resource}</Badge>}
          <span className="truncate font-mono text-xs text-text-secondary">{l.path}</span>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      className: 'w-40',
      cell: (l) => (
        <div className="flex items-center gap-1.5">
          <Badge tone={l.success === false ? 'danger' : statusTone(l.statusCode)}>{l.statusCode ?? '—'}</Badge>
          {l.durationMs != null && <span className="text-[11px] text-text-secondary">{l.durationMs}ms</span>}
          {l.errorMessage && (
            <span className="max-w-32 truncate text-[11px] text-danger" title={l.errorMessage}>
              {l.errorMessage}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      className: 'w-32',
      cell: (l) => <span className="font-mono text-xs text-text-secondary">{l.ip ?? '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" subtitle="Every change an admin makes — who, what, and when." />

      <SearchInput
        containerClassName="max-w-sm"
        placeholder="Search action, path or actor…"
        value={filters.search}
        loading={loading && !!filters.search}
        onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
      />

      {error && <Alert>{error}</Alert>}

      <Table
        columns={columns}
        rows={data}
        rowKey={(l) => l.id}
        loading={loading}
        emptyState="No audit entries yet."
      />

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))}
        />
      )}
    </div>
  );
}
