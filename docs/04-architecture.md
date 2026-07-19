# 04 · Architecture

The system-level view of how the project is organized and how data flows. This doc
is the **conceptual map**; the file-by-file build specs live in
[10-implementation-plan.md](./10-implementation-plan.md) (frontend) and
[11-backend-implementation-plan.md](./11-backend-implementation-plan.md) (backend).

> **Workspace naming:** the two apps are **`frontend/`** (Vite + React — admin +
> storefront) and **`backend/`** (NestJS API). `packages/shared` is imported by both
> so types never drift.

## Repository layout (npm workspaces)

```
ecommerce/
├─ frontend/                    # Vite + React (admin panel + customer storefront)
├─ backend/                     # NestJS API
├─ packages/
│  └─ shared/                   # Types, Zod schemas, enums, constants
├─ docs/                        # documentation (this folder)
├─ docker/                      # Dockerfiles, compose overrides
├─ nginx/                       # reverse-proxy + SSL configs
├─ scripts/                     # seed, migration, ops scripts
├─ postman/                     # API collections
├─ design/                      # design references / exports
└─ package.json                 # workspace root: "workspaces": ["frontend","backend","packages/*"]
```

---

## Frontend architecture (`frontend/`)

One React app serves **two surfaces**: the **admin panel** (dense, dock/panel
workflow) and the **customer storefront** (public, SEO/performance-focused). They
share `ui/`, `lib/`, and types but have separate layouts and route trees.

```
src/
├─ app/                         # App.tsx, providers.tsx (Theme, Query, Auth)
├─ routes/                      # route trees: admin + storefront + auth
├─ layouts/                     # AdminLayout, StorefrontLayout, AuthLayout
├─ pages/                       # route-level pages (thin; compose features)
├─ features/                    # business logic per domain (see 05-modules.md)
│  ├─ auth/  users/  dashboard/
│  ├─ products/  categories/  brands/  variants/  inventory/  coupons/
│  ├─ cart/  checkout/  orders/  payments/  shipping/
│  ├─ storefront/  reviews/  wishlist/  cms/  marketing/
│  ├─ reports/  analytics/  settings/  notifications/  search/  ai/
├─ components/
│  ├─ ui/                       # primitives (Button, Input, Table, Badge, Toast…)
│  ├─ layout/                   # Sidebar, Navbar, WorkspaceDock, RightContextPanel, CommandPalette
│  └─ common/                   # Loader, ErrorBoundary
├─ forms/                       # reusable RHF+Zod form building blocks
├─ services/                    # Axios API clients per domain
├─ store/                       # React Context stores (dock, panel, cart, ui) + useReducer
├─ hooks/                       # useTheme, useSidebar, useDebounce…
├─ lib/                         # axios instance, query client, socket
├─ utils/                       # cn, formatCurrency, formatDate, storage
├─ constants/  types/           # shared enums, TS types
├─ styles/                      # globals.css (Tailwind v4 + tokens)
├─ assets/
└─ main.tsx
```

> This layout follows your enterprise structure (`app/ layouts/ routes/ pages/
> features/ services/ hooks/ store/ components/ forms/ ui/ lib/ utils/ constants/
> types/ assets/`). The earlier doc-10 tree (`components/ui`, `hooks`, `utils`) is a
> subset — the reusable UI framework still lives under `components/` + `ui/`.

#### Shared building blocks (frontend — reach for these before writing your own)

A new feature should almost never hand-roll fetching, forms, or CRUD chrome.
The reusable layer already implemented:

| Where | Piece | Use it for |
|-------|-------|-----------|
| `hooks/useApi` | `useApi(fetcher, { errorMessage })` | data fetching — replaces the `useState(data/loading/error)+reload+useEffect` boilerplate |
| `hooks/useMutation` | `useMutation()` → `{ saving, run }` | the write flow: set saving → run → toast success → onSuccess (close/reload) → toast error |
| `hooks/useDebounce` | `useDebounce(value, ms)` | search inputs (avoid a request per keystroke) |
| `utils/getErrorMessage` | `getErrorMessage(e, fallback)` | pull a message out of any thrown value / error envelope |
| `utils/formatters` | `formatCurrency / formatDate / formatDateTime / formatNumber / getInitials` | all presentation formatting (currency/locale come from `config/store.config`) |
| `utils/validators` | `isEmail / minLength / isValidPassword / isRequired` | inline form checks that match the backend DTO rules |
| `utils/constants` | `USER_STATUS_TONE / ORDER_STATUS_TONE / toneFor` | status → Badge tone maps |
| `lib/types` + `lib/api` | `Paginated<T>`, `Meta`, `getList<T>(url, cfg)` | typed list endpoints (reads the interceptor's `meta`) |
| `components/ui` | `FormField, Alert, Card, ConfirmDialog` (+ primitives) | labelled fields, inline banners, bordered panels, delete confirms |
| `components/common` | `PageHeader, Avatar` (+ `BrandLoader, ErrorBoundary`) | page title+actions row, initials avatar |

Every feature exposes a public **barrel** (`features/<name>/index.ts`); import
another feature only through its barrel, never its internal files.

### Technical design details

#### 1. State strategy

| State kind | Tool | Examples |
|------------|------|----------|
| **Server data** | Axios `services/` + `useX` data hooks | products, orders, dashboard metrics — fetched via a thin service layer, cached in a React Context store |
| **App/UI state** | React Context | theme (`useTheme`), sidebar collapse (`useSidebar`) |
| **Feature state** | React Context (+ `useReducer`) | dock tabs, right panel, storefront cart — Context stores under `store/`, persisted to `localStorage` |
| **Form state** | React Hook Form + Zod | product editor, order edits, settings |
| **URL state** | `react-router-dom` search params | filters, pagination, active tab |

> **No TanStack / Zustand.** Server data uses **Axios** in `services/` wrapped by
> `useX` hooks; a small **React Context data cache** (keyed by request) gives the
> reuse/dedupe that keeps the Dock/Panel instant. All shared client state is plain
> **React Context**, with `useReducer` for the richer stores (dock, panel, cart).

#### 2. Why the Dock and Panel need real state design

- **Workspace Dock** (`store/dock.tsx` Context): each open tab holds its route +
  scroll + filter state, persisted to `localStorage` so tabs survive reload.
  Switching tabs re-renders from the Context data cache — instant, because the data
  hook already fetched it.
- **Right Context Panel** (`store/panel.tsx` Context): holds `{ open, type, id }`. A
  row click sets it; the panel lazy-loads the matching detail component and its data
  hook. Because the list response is already cached, the panel feels instant. See
  [06-signature-features.md](./06-signature-features.md).

#### 3. Data flow

```
Component → useQuery/useMutation (features/*/api.ts)
          → api-client (utils) — adds auth header + base URL (VITE_API_URL)
          → NestJS controller → service → Mongoose model → MongoDB
Realtime: socket.io (VITE_WS_URL) → invalidate relevant query keys → UI updates
```

---

## Backend architecture (`backend/`)

Feature-based NestJS modules, all under `src/modules/`, matching your enterprise
structure. Each module owns its `schemas/`, `dto/`, controller, and service.

```
src/
├─ main.ts                      # Bootstrap: prefix, versioning, pipes, filters, CORS, Swagger, Helmet
├─ app.module.ts                # Wires all modules; registers global guards + response interceptor
├─ config/                      # env validation + typed config service
├─ database/                    # Mongoose connection  (redis/ + queues/ added later ⏳)
├─ seed/                        # seed.ts — default roles + super admin (idempotent)
├─ common/                      # cross-cutting, framework-agnostic
│  ├─ guards/                   #   JwtAuthGuard, RolesGuard, PermissionsGuard
│  ├─ decorators/               #   @Public, @Roles, @RequirePermission, @ResponseMessage
│  ├─ interceptors/             #   ResponseInterceptor (success envelope)
│  ├─ filters/                  #   AllExceptionsFilter (error envelope)
│  ├─ schemas/                  #   baseSchemaOptions() — UUID _id, timestamps, toJSON
│  └─ utils/                    #   id (UUID), date, slug helpers
└─ modules/                     # one folder per feature domain
   ├─ auth/                     # JWT, refresh, sessions, Google OAuth, RBAC
   ├─ users/                    # users, addresses, activity, invites
   ├─ roles/                    # dynamic roles + permission catalog
   ├─ categories/               # nested tree, drag-drop order
   ├─ mail/                     # Nodemailer (dev logs link; SMTP when configured)
   ├─ health/                   # GET /health (Mongo ping)
   ├─ products/                 # products, SKU, SEO, media links, related/upsell   ⏳
   ├─ brands/ · variants/ · inventory/ ⚡ · coupons/ · cart/ · checkout/            ⏳
   ├─ orders/ · payments/ · shipping/ · reviews/ · wishlist/ · cms/                 ⏳
   ├─ marketing/ · notifications/ ⚡ · reports/ · analytics/ · settings/            ⏳
   └─ uploads/ · search/ · ai/ (doc 15) · realtime/                                 ⏳
```

> ⏳ modules are planned — build them in [roadmap](./09-roadmap.md) phase order.
> Currently shipped: `auth`, `users`, `roles`, `categories`, `mail`, `health`.
> Small related concerns (e.g. brands, variants) may start folded into `products`
> and split out as they grow.

#### Shared building blocks (backend — reach for these before writing your own)

| Where | Piece | Use it for |
|-------|-------|-----------|
| `common/services/base.service` | `extends BaseService<TDoc>` → `super(model, 'Entity')` | gives `findByIdOrThrow(id)` (consistent 404) + `paginate(opts)` (`{ data, meta }`) for free |
| `common/utils/query.util` | `paginate / parseSort / buildSearchFilter / findByIdOrThrow` | list endpoints — filter + `?sort=-field` + skip/limit/count without hand-rolling |
| `common/utils` | `generateId / isUuid`, `now / addMinutes / addDays / isExpired`, `slugify` | UUID ids (no ObjectId), date math, slugs |
| `common/schemas/base-schema` | `baseSchemaOptions(strip)` + `@Prop({ type: String, default: generateId }) _id` | every root schema: UUID `_id`, timestamps, `toJSON` id-mapping + secret stripping |
| `common/decorators` | `@Public, @Roles, @RequirePermission, @ResponseMessage, @IsUuidId` | route auth/metadata + UUID field validation (use `@IsUuidId()`, **not** `@IsMongoId()`) |
| `common/dto/pagination.dto` | `PaginationQueryDto`, `buildMeta`, `PaginatedMeta` | extend for list query params |
| `common/interceptors` + `common/filters` | `ResponseInterceptor`, `AllExceptionsFilter` | the global success/error envelopes (doc 08) — never hand-roll |

A service **extends `BaseService`, injects its model, and calls the helpers** —
see `users`/`roles`/`categories` services as the reference pattern.

> Not every module ships at once — build them in [roadmap](./09-roadmap.md) phase
> order. Small related concerns (e.g. brands, variants) may start folded into
> `products` and split out as they grow.

### Technical design details

#### 1. Layering rule

`Controller` (HTTP + validation) → `Service` (business logic, injects the Mongoose
model) → `Mongoose model` (data). Controllers never touch the model directly;
services never read `req`/`res`.

#### 2. Cross-cutting concerns

- **Auth:** JWT access (short-lived) + refresh (httpOnly cookie, hashed in a
  `sessions` collection so it's revocable). `JwtAuthGuard` global, opt-out with
  `@Public()`.
- **RBAC:** `@Roles('ADMIN' | 'MODERATOR' | 'OPERATOR' | 'ANALYST' | 'CUSTOMER')` +
  `RolesGuard`, backed by a permissions collection (see
  [07-data-model.md](./07-data-model.md)).
- **Security:** Helmet, rate limiting (`@nestjs/throttler`), CORS, input validation;
  audit/activity logs (Winston). See [roadmap Phase 23/27](./09-roadmap.md).
- **Jobs (⏳ later):** emails, bulk AI, exports, abandoned-cart, forecasting run
  **synchronously in-request for now**; move to **BullMQ (Redis)** in a later phase.
- **Validation:** Zod schemas from `packages/shared` via a `ZodValidationPipe`, so
  the client and server validate identically.
- **Response envelope:** `ResponseInterceptor` wraps `{ data }` / `{ data, meta }`
  (pagination in `meta`). See [08-api-conventions.md](./08-api-conventions.md).
- **Errors:** global exception filter → consistent `{ statusCode, code, message }`
  (maps Mongoose `ValidationError` / `CastError` / `E11000`).
- **Docs:** Swagger at `/api/docs`.
- **Realtime:** a single WebSocket gateway namespace; emits `order.created`,
  `order.updated`, `notification`.

#### 3. Documents: embed vs. reference

Embed owned sub-documents (order `items`/`timeline`, product `variants`/`images`,
customer `addresses`); reference independent entities (`Order.customer`,
`Product.category`) and resolve with `.populate()`. See
[07-data-model.md](./07-data-model.md).

---

## Where the details live

| Concern | Detailed in |
|---------|-------------|
| Frontend file-by-file build | [10-implementation-plan.md](./10-implementation-plan.md) |
| Backend file-by-file build | [11-backend-implementation-plan.md](./11-backend-implementation-plan.md) |
| UI primitives + styling rules | [02](./02-design-system.md) / [03](./03-component-library.md) |
| Modules & responsibilities | [05-modules.md](./05-modules.md) |
| Signature features (Dock/Panel/Palette) | [06-signature-features.md](./06-signature-features.md) |
| Data model | [07-data-model.md](./07-data-model.md) |
| API conventions | [08-api-conventions.md](./08-api-conventions.md) |
| Build order | [09-roadmap.md](./09-roadmap.md) |
