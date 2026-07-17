import { Button, Input } from '@/components/ui';

/** Placeholder login screen (real auth lands in Sprint 2). */
export function Login() {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div>
        <h1 className="text-base font-semibold text-text">Sign in</h1>
        <p className="text-sm text-text-secondary">Auth is implemented in Sprint 2.</p>
      </div>
      <Input type="email" placeholder="you@example.com" />
      <Input type="password" placeholder="Password" />
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
