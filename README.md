# Enterprise eCommerce Platform

![status](https://img.shields.io/badge/status-in%20development-f59e0b)
![node](https://img.shields.io/badge/node-%E2%89%A520-3c873a)
![react](https://img.shields.io/badge/React-19-149eca)
![nestjs](https://img.shields.io/badge/NestJS-11-e0234e)
![mongodb](https://img.shields.io/badge/MongoDB-8-16a34a)
![typescript](https://img.shields.io/badge/TypeScript-6-3178c6)

A production-grade eCommerce platform (a mix of **Shopify, Amazon Seller Central,
and WooCommerce**) — a polished **admin panel** + a full **customer storefront** +
**AI features**. Learning-first, built across a **30-phase roadmap**.

The admin UI is deliberately styled like **Linear, Vercel, GitHub, and Stripe**:
clean, border-based, information-dense. **No shadows, no gradients, `rounded-md`
everywhere**, full light/dark theming.

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · react-router-dom 7 · Axios · React Hook Form + Zod · react-hot-toast |
| **Backend** | NestJS 11 · MongoDB 8 + Mongoose 9 · JWT/Passport · Zod · Swagger |
| **Shared** | `@ecommerce/shared` — types + Zod schemas consumed by both sides |
| **DevOps** | Docker · Docker Compose · Nginx · GitHub Actions · PM2 |
| **AI** (later) | Anthropic Claude · MongoDB Atlas Vector Search |
| **Deferred** | Redis + BullMQ (introduced in the performance/queues phase) |

State: **React Context** (theme, sidebar, dock, panel, cart) · data via **Axios +
custom hooks** — no TanStack/Zustand by design.

## Monorepo layout (npm workspaces)

```
ecommerce/
├─ frontend/   # Vite + React (admin panel + customer storefront)
├─ backend/    # NestJS API
├─ packages/
│  └─ shared/  # Shared types + Zod schemas
├─ docs/       # Full project documentation
├─ docker/     # Dockerfiles, compose overrides
├─ nginx/      # Reverse-proxy + SSL configs
├─ scripts/    # Seed, migration, ops scripts
├─ postman/    # API collections
└─ design/     # Design references / exports
```

## Prerequisites

- **Node.js ≥ 20** and **npm ≥ 10**
- **MongoDB 8** — run locally, via `docker compose up -d mongo`, or a MongoDB Atlas URI

## Quick start

```bash
# 1. install all workspaces
npm install

# 2. configure env (defaults work for local dev)
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
#    optional: edit backend/.env → JWT secrets, SMTP (for real invite emails),
#    and ADMIN_EMAIL / ADMIN_PASSWORD (the seeded super admin)

# 3. start MongoDB (skip if mongod already runs locally)
docker compose up -d mongo

# 4. seed the super admin + default roles
npm run seed --workspace backend

# 5. run the apps (two terminals)
npm run dev:api     # NestJS API → http://localhost:4000/api
npm run dev         # Vite app   → http://localhost:5173
```

Then open **http://localhost:5173** and sign in.

### 🔑 Default login (from the seed)

| Email | Password |
|-------|----------|
| `admin@nova.shop` | `Admin@12345` |

This is the **Super Admin** (full permissions). Change the credentials via
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` before seeding.

- Health check: `GET http://localhost:4000/api/health`
- Component gallery (design system): `http://localhost:5173/kitchen-sink`

## Authentication & access control

- **No public signup.** The admin panel is **invite-only** — one super admin is seeded,
  and admins invite others by email (SMTP; in dev the invite link is printed to the API
  console if SMTP is unset).
- **Dynamic RBAC.** Roles are data, not a fixed enum. **Super Admin** creates roles and
  ticks a **read/write permission matrix** per resource (products, orders, users, …).
  Invites pick a role; the UI hides what you can't access; the API enforces it.
- **JWT** access token (in-memory) + **refresh** token (httpOnly cookie, rotated), bcrypt
  passwords, password reset + email verification.

## Reusable building blocks (for new contributors)

The codebase is built **common-first** — a new feature should almost never
hand-roll fetching, forms, CRUD chrome, pagination, or error handling. Reach for
these; full reference tables are in [docs/04-architecture.md](./docs/04-architecture.md).

**Frontend** (`frontend/src`)

| Kind | What | For |
|------|------|-----|
| Hooks | `useApi`, `useMutation`, `useDebounce` | fetch state, save→toast→reload flow, debounced search |
| Utils | `getErrorMessage`, `formatters` (currency/date/number/initials), `validators`, `constants` (status→tone) | kill copy-paste; currency/locale come from `config/store.config` (white-label) |
| API | `lib/api` `getList<T>()`, `lib/types` `Paginated<T>` / `Meta` | typed **server-side** list calls (reads the envelope's `meta`) |
| UI | `FormField`, `Alert`, `Card`, `ConfirmDialog`, `Pagination`, `toast` (success/error/**warning**/info/loading) | labelled fields, banners, panels, delete confirms, advanced pager |
| Common | `PageHeader`, `Avatar` | page title+actions, initials chip |

Every feature exposes a public **barrel** (`features/<name>/index.ts`); import
another feature only through its barrel, never its internals.

**Backend** (`backend/src/common`)

| Kind | What | For |
|------|------|-----|
| Services | `BaseService<TDoc>` → `super(model, 'Entity')` | free `findByIdOrThrow` (consistent 404) + `paginate` (`{ data, meta }`) |
| Query | `query.util` — `paginate` / `parseSort` / `buildSearchFilter` | server-side list endpoints (`?page=&pageSize=&search=&sort=-field`) |
| Utils | `generateId`/`isUuid`, date helpers, `slugify` | UUID ids (no ObjectId), date math, slugs |
| Schema | `baseSchemaOptions()` + UUID `_id` | timestamps, `toJSON` id-mapping, secret stripping |
| Decorators | `@Public/@Roles/@RequirePermission/@ResponseMessage/@IsUuidId` | route metadata + UUID validation (**not** `@IsMongoId`) |
| Cross-cutting | `ResponseInterceptor`, `AllExceptionsFilter` | global success/error envelopes — never hand-roll |

**Pagination is always server-side.** Lists send `page`/`pageSize`/`sort`/`search`
to the API; the backend returns `{ data, meta:{ page, pageSize, total, totalPages,
hasNext, hasPrev } }`; the `<Pagination>` component drives page/size changes back
to the server (it never slices data on the client).

## Scripts (run from the repo root)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the frontend (Vite) |
| `npm run dev:api` | Start the backend (NestJS, watch mode) |
| `npm run seed --workspace backend` | Seed the super admin + default roles (idempotent) |
| `npm run build` | Build shared → backend → frontend |
| `npm run lint` | ESLint across the monorepo |
| `npm run format` | Prettier write |
| `npm run typecheck` | Type-check every workspace |
| `npm run deps:check` | Report newer dependency versions (all workspaces) |
| `npm run deps:upgrade` | Bump every `package.json` to latest + reinstall |

> **Dependency policy:** we track latest. Two intentional pins — `typescript@^6`
> (TS 7.0 lacks the compiler API the Nest CLI needs until 7.1) and `lint-staged@^15`
> (v17 needs Node 22). See [docs/01-tech-stack.md](./docs/01-tech-stack.md#versioning--upgrade-policy).

## Project status

Progress is tracked feature-by-feature in [`docs/sprint-plan.csv`](./docs/sprint-plan.csv).

- ✅ **Sprint 1 — Foundation & Design System** — monorepo, tooling, CI, shared package,
  design tokens, UI primitives (Button with icons/loading, custom Table, PasswordInput,
  Modal…), theme-aware sidebar with submenu flyouts, error pages.
- ✅ **Sprint 2 — Authentication** — **invite-only** admin (seed + email invites), JWT
  access + refresh (rotating, httpOnly cookie), bcrypt, password reset, email
  verification, change password, sessions; split login screen with a branded loader.
- ✅ **Sprint 3 — User Management + RBAC** — dynamic **Roles** with a read/write
  **permission matrix**, user CRUD (paginate/filter/ban/restore), permission-gated nav.
  **Category CRUD** (nested tree) also landed early.
- 🟢 Dashboard UI is built (animated custom SVG charts) — wired to live data as
  orders/products land in Sprints 4–6.
- 🧱 **Reusable common layer** — shared FE hooks/utils/components + BE
  `BaseService`/query utils, server-side `<Pagination>`, and a consistent
  toast + confirm-dialog story (see *Reusable building blocks* above).
- 📋 **Next: Sprint 4 — Products** · full roadmap in [docs/09-roadmap.md](./docs/09-roadmap.md).

**Everything above is build + lint clean and verified against a running API + MongoDB.**

## Documentation

Full design and planning docs live in [`docs/`](./docs/README.md).

| # | Doc | |
|---|-----|--|
| — | [docs/README](./docs/README.md) | Index + the non-negotiables |
| 00 | [Project Overview](./docs/00-project-overview.md) | Vision, goals, personas |
| 01 | [Tech Stack](./docs/01-tech-stack.md) | Every library + why + versioning policy |
| 02 | [Design System](./docs/02-design-system.md) | Tokens, color, spacing, dark mode |
| 03 | [Component Library](./docs/03-component-library.md) | UI primitives |
| 04 | [Architecture](./docs/04-architecture.md) | Folder trees, data flow |
| 05 | [Modules](./docs/05-modules.md) | Feature module list |
| 06 | [Signature Features](./docs/06-signature-features.md) | Dock, Panel, Palette |
| 07 | [Data Model](./docs/07-data-model.md) | MongoDB / Mongoose schemas |
| 08 | [API Conventions](./docs/08-api-conventions.md) | REST, auth, errors, realtime |
| 09 | [Roadmap](./docs/09-roadmap.md) | 30-phase plan |
| 10 | [Frontend Plan](./docs/10-implementation-plan.md) | `frontend/` build spec |
| 11 | [Backend Plan](./docs/11-backend-implementation-plan.md) | `backend/` build spec |
| 13 | [Coding Conventions](./docs/13-coding-conventions.md) | Naming, style, git, PRs |
| 14 | [Docker & Deployment](./docs/14-docker-deployment.md) | Containerizing + deploying FE/BE |
| 15 | [AI Features](./docs/15-ai-features.md) | Phase 30 AI: generators, RAG, recommendations |
| 16 | [Advanced Features](./docs/16-advanced-features.md) | 50 enterprise/stretch feature plans |

## Contributing

Conventional Commits (`feat(scope): …`), feature branches (`type/short-desc`), and a
green `npm run build && npm run lint` before every PR. Full rules in
[docs/13-coding-conventions.md](./docs/13-coding-conventions.md).

## License

Personal learning project. Add a `LICENSE` file before any public reuse.
