import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Forbidden } from '@/pages/ErrorPage';

/**
 * Route-level authorization guard. Renders the page only if the current user has
 * `permission`; otherwise shows the 403 page. This is defense-in-depth: the
 * sidebar already hides links via `can()`, but typing a forbidden URL must also
 * be blocked, not just hidden.
 */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(permission)) return <Forbidden />;
  return <>{children}</>;
}
