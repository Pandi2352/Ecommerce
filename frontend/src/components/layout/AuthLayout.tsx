import { Outlet } from 'react-router-dom';

/** Minimal centered shell (no sidebar) for login/signup screens. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-md border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-md bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
            E
          </div>
          <span className="text-sm font-semibold text-text">Ecommerce Admin</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
