# 13 · Coding Conventions

The rules that keep the codebase consistent as it grows — and that make this a
credible portfolio piece. When in doubt, match the surrounding code.

## Language & TypeScript

- **TypeScript everywhere**, `strict: true`. No `any` — use `unknown` + narrowing,
  or a real type. `// @ts-ignore` requires a one-line reason comment.
- Prefer `type` for unions/shapes, `interface` for extendable object contracts.
- Share cross-cutting types via `packages/shared` — never redeclare an API shape in
  both `frontend/` and `backend/`.
- No unused exports/vars (ESLint enforces). No `console.log` in committed code — use
  the logger (server) or remove (client).

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| React component file | `PascalCase.tsx` | `SidebarItem.tsx` |
| Component | `PascalCase` | `function SidebarItem() {}` |
| Hook file + fn | `useX.ts` / `useX` | `useSidebar.ts` |
| Util / non-component file | `camelCase.ts` | `formatCurrency.ts` |
| Config file | `kebab.config.ts` | `sidebar.config.ts` |
| NestJS files | `name.role.ts` | `orders.service.ts`, `order.schema.ts` |
| Type / interface | `PascalCase` | `OrderStatus`, `SidebarItemProps` |
| Constant | `UPPER_SNAKE` | `MAX_PAGE_SIZE` |
| Variable / function | `camelCase` | `activeTabId` |
| Enum values | `UPPER_SNAKE` | `OrderStatus.SHIPPED` |
| Route path | `kebab-case` | `/order-status` |
| Mongo collection | plural, lowercase | `orders`, `products` |

- Booleans read as predicates: `isOpen`, `hasError`, `canEdit`.
- Event handlers: `handleX` (definition) / `onX` (prop): `onClick={handleSubmit}`.

## Folder & module rules

- **Feature-first.** Business code lives under `features/<name>/`; shared building
  blocks under `components/ui/`, `components/layout/`, `hooks/`, `utils/`.
- A feature never imports from another feature's internals. Cross-feature sharing
  goes through `components/`, `hooks/`, `utils/`, or `packages/shared`.
- **Barrel exports** (`index.ts`) for `components/ui/` and each layout package so
  imports stay clean: `import { Button, Input } from '@/components/ui'`.
- **Import alias:** always `@/…` (maps to `src/`). No deep relative chains
  (`../../../`).
- Import order: external packages → `@/` aliases → relative → styles. (ESLint
  `import/order` enforces; Prettier handles formatting.)

## Styling (Tailwind) — the design DNA

Non-negotiables from [02-design-system.md](./02-design-system.md):

- ❌ **No shadows.** Never add `shadow-*`. Separate with `border`.
- ✅ `rounded-md` (6px) everywhere. One radius token, project-wide.
- ✅ 8px spacing grid (`p-2`, `p-3`, `p-4`, `gap-4`…).
- ✅ Colors only where they mean something (badges, focus, status). Everything else
  neutral.
- Use design tokens (`bg-surface`, `border-border`, `text-secondary`), **not**
  raw hex or arbitrary values.
- Merge conditional classes with the **`cn()`** helper (`clsx` + `tailwind-merge`) —
  never string-concatenate class names.
- Dark mode is token-driven (`.dark` on `<html>`); don't hardcode a second color —
  add/adjust a token.

## React patterns

- Function components + hooks only. No class components (except `ErrorBoundary`).
- Props typed with an explicit `XxxProps` type. Destructure props in the signature.
- Keep components small and presentational; push data-fetching into
  `services/` (Axios) wrapped by `features/*/api.ts` **`useX` data hooks**; put logic
  in hooks.
- Server data → Axios services + `useX` hooks (cached in a React Context store, not
  TanStack Query). Shared client state → **React Context** (theme, sidebar, dock,
  panel, cart) with `useReducer` for the richer stores — **no Zustand**. Form state →
  React Hook Form + Zod. URL state → `react-router-dom` search params. Don't
  duplicate server data into local state.
- Lists need stable `key`s (never the array index for dynamic lists).
- Side effects go in `useEffect` with correct deps; prefer derived values over
  effects that sync state.

## Backend (NestJS) patterns

- **Layering:** Controller (HTTP + validation) → Service (logic, injects the
  Mongoose model) → model. Controllers never touch the model; services never read
  `req`/`res`. (See [11-backend-implementation-plan.md](./11-backend-implementation-plan.md).)
- One responsibility per module; register schemas with `MongooseModule.forFeature`
  inside the owning module only.
- Validate every write with a DTO / Zod schema. Never trust request input.
- Return domain data; let the `ResponseInterceptor` add the `{ data, meta }`
  envelope and the exception filter shape errors. Don't hand-roll envelopes per
  controller.
- Secrets and config come from the typed config service — never `process.env`
  directly in feature code.

## Comments & docs

- Comment the **why**, not the **what**. Code says what it does; comments explain
  non-obvious decisions.
- Public utilities/hooks get a one-line JSDoc. Keep comment density like the
  surrounding file.

## Git workflow

- **Branch names:** `type/short-description` → `feat/orders-timeline`,
  `fix/sidebar-collapse`, `docs/api-conventions`, `chore/deps`.
- **Conventional Commits:** `type(scope): summary`
  - `feat(products): add bulk archive action`
  - `fix(auth): rotate refresh token on reuse`
  - Types: `feat` `fix` `docs` `refactor` `style` `test` `chore` `perf`.
- Small, focused commits. Don't mix a refactor with a feature.
- Never commit `.env`, secrets, `node_modules`, or build output (see `.gitignore`).

## Pull request checklist

- [ ] `npm run build` passes (frontend **and** backend) — zero TS errors.
- [ ] `npm run lint` clean; Prettier applied.
- [ ] No `shadow-*` classes; radius is `rounded-md`; colors are tokens.
- [ ] New/changed API validated with a DTO/Zod schema.
- [ ] Types shared via `packages/shared` where the shape crosses frontend/backend.
- [ ] Tests added/updated for non-trivial logic; existing tests pass.
- [ ] Works in **both light and dark** themes (UI changes).
- [ ] No secrets, no stray `console.log`, no commented-out code.

## Tooling

- **ESLint + Prettier** are the source of truth for style — don't hand-format
  against them.
- **Husky + lint-staged** run lint/format on staged files pre-commit.
- Editor: format-on-save with the repo Prettier config.
