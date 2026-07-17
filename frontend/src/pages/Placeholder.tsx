import { EmptyState } from '@/components/ui';

/** Generic "coming soon" page for routes not yet built. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      <div className="rounded-md border bg-surface">
        <EmptyState title={`${title} coming soon`} description="This module is scheduled in a later sprint." />
      </div>
    </div>
  );
}
