# CLAUDE.md

Guidance for AI assistants (and humans) working in this repo. Keep changes aligned
with the docs in [`docs/`](./docs/README.md) — those are the source of truth.

## What this is

An enterprise-grade **ecommerce admin panel** built as a portfolio piece. The point
is UI quality and workflow, styled like Linear / Vercel / GitHub / Stripe.

- **Frontend:** `frontend/` — Vite + React + TypeScript + Tailwind (v4).
- **Backend:** `backend/` — NestJS + MongoDB (Mongoose).
- **Shared:** `packages/shared` — types + Zod schemas used by both sides.
- Monorepo managed with **npm** workspaces.

## Design rules (non-negotiable — see docs/02, docs/13)

- ❌ **No shadows.** Ever. Separate regions with a **1px border**.
- ✅ **`rounded-md` (6px)** everywhere — one radius token, project-wide.
- ✅ **8px spacing grid.**
- ✅ Neutral surfaces; **color only where it means something** (badges, focus,
  status). Focus = 1px info-blue border, no glow.
- ✅ Dark mode is token-driven via `.dark` on `<html>` — add/adjust a token, never
  hardcode a second color.
- ✅ Use the **`cn()`** helper for conditional classes; use design tokens
  (`bg-surface`, `border-border`, `text-secondary`), not raw hex.
- Charts: 2px strokes, **no gradient fills**. Loading = skeletons, **never spinners**.

## Architecture rules (see docs/04, docs/11, docs/13)

- **Feature-first** folders. A feature never imports another feature's internals —
  share via `components/`, `hooks/`, `utils/`, or `packages/shared`.
- Import alias `@/` → `src/`. No deep relative paths.
- **Backend layering:** Controller (HTTP + validation) → Service (logic, injects the
  Mongoose model) → model. Controllers never touch the model; services never read
  `req`/`res`.
- Validate every write with a DTO / Zod schema. Responses are wrapped by the
  `{ data, meta }` interceptor — don't hand-roll envelopes.
- Shared shapes live in `packages/shared` — don't redeclare an API type on both
  sides.

## Data model (see docs/07)

MongoDB with Mongoose. **Embed** owned sub-documents (order `items`/`timeline`,
product `variants`/`images`, customer `addresses`); **reference** independent
entities (`Order.customer`, `Product.category`) and `populate` them. Transactions
need a replica set (Atlas or a local single-node replica set).

## Conventions (see docs/13)

- TypeScript `strict`, no `any`.
- Conventional Commits (`feat(scope): …`), branches `type/short-desc`.
- Never commit `.env` or secrets. No `console.log` in committed code.
- Before finishing: `build` + `lint` clean on both apps; UI works in light **and**
  dark.

## Where to look

- Build order / what to do next → [docs/09-roadmap.md](./docs/09-roadmap.md)
- Frontend file-by-file plan → [docs/10-implementation-plan.md](./docs/10-implementation-plan.md)
- Backend file-by-file plan → [docs/11-backend-implementation-plan.md](./docs/11-backend-implementation-plan.md)

## Status

Planning phase — the apps are not scaffolded yet. Start at Roadmap Phase 0.
