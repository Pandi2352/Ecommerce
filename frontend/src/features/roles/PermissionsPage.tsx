import { Link } from 'react-router-dom';
import { Eye, KeyRound, Pencil } from 'lucide-react';
import { PERMISSION_RESOURCES, permission } from '@ecommerce/shared';
import { Alert, Badge, Card } from '@/components/ui';
import { PageHeader } from '@/components/common';

/**
 * Read-only reference explaining every permission in the catalog. Assignment
 * happens on the Roles page — this page just documents what each one grants.
 */
export function PermissionsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        subtitle="Every permission an admin can be granted, by area. Assign them to roles on the Roles page."
      />

      <Alert tone="info">
        <span className="font-medium">Super Admin</span> always has every permission.{' '}
        <span className="font-medium">Write</span> includes <span className="font-medium">Read</span>.
        Grant these per role on the{' '}
        <Link to="/roles" className="font-medium text-info underline">
          Roles
        </Link>{' '}
        page. There are {PERMISSION_RESOURCES.length} areas · {PERMISSION_RESOURCES.length * 2} permissions.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSION_RESOURCES.map((res) => {
          const label = res.label.toLowerCase();
          return (
            <Card key={res.key} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-indigo-500/10 text-indigo-500">
                  <KeyRound className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{res.label}</p>
                  <p className="text-[11px] text-text-secondary">2 permissions</p>
                </div>
              </div>

              <p className="text-xs text-text-secondary">{res.description}</p>

              <div className="mt-auto space-y-2 border-t border-border pt-3">
                <div className="flex items-start gap-2">
                  <Eye className="mt-0.5 size-3.5 shrink-0 text-info" />
                  <div className="min-w-0">
                    <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-text">
                      {permission(res.key, 'read')}
                    </code>
                    <p className="mt-0.5 text-[11px] text-text-secondary">View and browse {label}.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Pencil className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <div className="min-w-0">
                    <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-text">
                      {permission(res.key, 'write')}
                    </code>
                    <Badge tone="neutral" className="ml-1.5 align-middle">
                      includes read
                    </Badge>
                    <p className="mt-0.5 text-[11px] text-text-secondary">Create, edit and delete {label}.</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
