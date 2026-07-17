# 01 · Tech Stack

Every choice here is optimized for two things: **matching the design system**
(border/density aesthetic) and **being a strong learning + portfolio stack**.

## Frontend

| Concern | Choice | Why |
|---------|--------|-----|
| Build tool | **Vite** | Fast dev server, first-class React + TS support |
| Framework | **React 19 + TypeScript** | Industry standard, great for a portfolio |
| Styling | **Tailwind CSS** | Design tokens map 1:1 to the spec (`rounded-md`, `border`, `bg-black`); enforces the 8px grid and no-shadow rule via config |
| Component base | **Custom primitives** (Radix UI under the hood) | Radix gives accessible, unstyled behavior (dialog, popover, dropdown, tabs); we style them to our tokens. shadcn/ui is a fine starting point but **customized heavily** — no default shadows |
| Routing | **react-router-dom** | Nested routes for admin + storefront; also powers the Workspace Dock tab state |
| Data fetching | **Axios + custom hooks** | A thin `services/` (Axios) layer + `useX` data hooks; a small React Context holds a request cache so the Right Context Panel/Dock feel instant. (No TanStack Query.) |
| App/UI state | **React Context (+ `useReducer`)** | Theme, sidebar, dock tabs, right panel, cart — plain Context stores, persisted to `localStorage` where needed. (No Zustand.) |
| Tables | **Custom table component** | Hand-built, headless, rendered to our bordered/dense tokens. (No TanStack/React Table.) |
| Charts | **Recharts** (or **visx** for widgets) | 2px lines, no gradients; visx for the heatmap/treemap/gauge widgets |
| Forms | **React Hook Form + Zod** | Typed validation shared with the API contract |
| Animation | **Framer Motion** | Dock/panel transitions, page transitions (kept subtle) |
| File upload UI | **React Dropzone** | Drag-drop product images / CSV import |
| Rich text | **TipTap** | CMS pages, blogs, product descriptions |
| Drag & drop | **React DnD** | Category tree reorder, storefront builder |
| Toasts | **React Hot Toast** | Top-right notifications |
| Command palette | **cmdk** | The ⌘K / Ctrl+K palette |
| Icons | **Lucide** | Clean, consistent 1.5px stroke icons that fit the aesthetic |
| Dates | **Day.js** | Lightweight date formatting/relative times |
| Realtime | **socket.io-client** | Live Orders widget, notifications |

> **Charts note:** Recharts covers line/area/bar. The bespoke widgets (GitHub-style
> sales heatmap, treemap, circular/gauge progress) are cleaner to build with **visx**
> or hand-rolled SVG (see [10-implementation-plan.md](./10-implementation-plan.md)).
> Keep all chart strokes at **2px, no gradient fills**.

## Backend

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **NestJS** | Structured, modular, DI-based; maps naturally to the module list |
| Language | **TypeScript** | Shared types with the frontend |
| ODM | **Mongoose** (`@nestjs/mongoose`) | Idiomatic NestJS MongoDB integration: decorator-based schemas, typed models, hooks, populate |
| Database | **MongoDB** | Document store; flexible schemas for products/variants, embedded order items + timeline |
| Auth | **JWT (access + refresh)** via **Passport** | Role-based access control (RBAC), Google OAuth |
| Validation | **class-validator + class-transformer** (+ Zod) | DTO validation at the edge |
| Realtime | **@nestjs/websockets (socket.io)** | Push live orders + notifications |
| API docs | **@nestjs/swagger** | Auto-generated OpenAPI at `/api/docs` |
| Email | **Nodemailer** | Verification, receipts, campaigns (templated) |
| File uploads | **Multer** → **Cloudinary / S3** | Product images/media; local disk in dev |
| Logging | **Winston** | API/login/audit/system logs (Phase 27) |
| Security | **Helmet + rate limiter (@nestjs/throttler)** | Headers, XSS/CSRF/CORS, throttling (in-memory store for now) |
| Search | **MongoDB Atlas Search** | Autocomplete, full-text, vector search (for AI RAG) |
| ⏳ Queues / jobs | **BullMQ + Redis** _(later)_ | Emails, bulk AI, exports, abandoned-cart, forecasting — **deferred**; do work synchronously for now |
| ⏳ Caching | **Redis** _(later)_ | Sessions, rate-limit store, hot data — **deferred**; use in-memory until then |

> **⏳ Deferred for now:** **Redis** and **BullMQ** are **not** in the initial build.
> Anything that would be queued (emails, bulk AI, exports) runs **synchronously**
> in-request to start; rate-limiting and caching use in-memory stores. Introduce
> Redis + BullMQ in the performance/notifications phases (see
> [09-roadmap.md](./09-roadmap.md)) without changing the public API.

## AI

| Concern | Choice | Why |
|---------|--------|-----|
| LLM provider | **Anthropic Claude** (Opus 4.8 / Sonnet 5; Haiku for bulk) | Generators, RAG assistant, agents |
| Vector store | **MongoDB Atlas Vector Search** | Embeddings for RAG + recommendations |
| ⏳ Async inference | **BullMQ** _(later)_ | Bulk generation/forecasting off the request path — **deferred**; run sync for now |

See [15-ai-features.md](./15-ai-features.md).

## DevOps

| Concern | Choice |
|---------|--------|
| Containers | **Docker + Docker Compose** |
| Reverse proxy | **Nginx** (serves storefront/admin static, proxies API) |
| Process manager | **PM2** (Node on VPS) |
| CI/CD | **GitHub Actions** — lint, typecheck, test, build, image push |
| Hosting | **VPS** + **SSL** + **Cloudflare** (CDN, DNS, WAF) |

See [14-docker-deployment.md](./14-docker-deployment.md).

## Tooling & quality

| Concern | Choice |
|---------|--------|
| Package manager | **npm** (workspaces) |
| Linting | **ESLint** + **Prettier** |
| Git hooks | **Husky + lint-staged** |
| Testing (frontend) | **Vitest + Testing Library**, **Playwright** for e2e |
| Testing (backend) | **Jest** (Nest default) + **Supertest** |
| API testing | **Postman** collection (in `postman/`) |

## Versioning & upgrade policy

**Policy: track latest.** All dependencies are kept at their latest versions. Two
root scripts drive this:

```bash
npm run deps:check     # report newer versions across ALL workspaces (npm-check-updates --deep)
npm run deps:upgrade   # bump every package.json to latest + reinstall
```

After every upgrade, run `npm run build && npm run lint` to confirm nothing broke.

**Two intentional pins** (latest-that-works, not bleeding edge):

| Package | Pinned | Why |
|---------|--------|-----|
| **typescript** | `^6` | TS **7.0** ships only the `tsc` binary — its programmatic compiler API (needed by the Nest CLI and typescript-eslint) doesn't return until 7.1. Nest's own error recommends TS 6. Unpin to `^7` once 7.1 lands. |
| **lint-staged** | `^15` | v17 requires Node ≥22; local/CI run Node 20. Unpin when the project moves to Node 22. |

Everything else runs latest and verified: React 19, Vite 8, Tailwind 4, NestJS 11,
Mongoose 9, Zod 4, ESLint 10, react-router-dom 7.

## Repository layout

Top-level (matches your enterprise structure):

```
ecommerce/
├─ frontend/      # Vite + React (admin + storefront)
├─ backend/       # NestJS API
├─ packages/
│  └─ shared/     # Types, Zod schemas, constants, enums
├─ docs/          # ← you are here
├─ docker/        # Dockerfiles, compose overrides
├─ nginx/         # Nginx configs (proxy, SSL)
├─ scripts/       # Seed, migration, ops scripts
├─ postman/       # API collections
└─ design/        # Design references / exports
```

> **Shared types** are the payoff: define an `Order` shape + Zod schema once in
> `packages/shared`; NestJS DTOs and React forms both consume it — no drift.

> **Naming:** the workspaces are **`frontend/`** and **`backend/`**. (Some earlier
> drafts called them `client/`/`server/` — those names are retired.)

See [04-architecture.md](./04-architecture.md) for the full folder tree.
