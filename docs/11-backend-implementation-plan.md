# 11 · Implementation Plan — Backend Server (NestJS API)

Create a senior-level **NestJS + TypeScript + MongoDB (Mongoose)** API for the
ecommerce admin panel. The module structure is clean, layered, and maps 1:1 to the
product modules in [05-modules.md](./05-modules.md); it implements the document model
in [07-data-model.md](./07-data-model.md) and the conventions in
[08-api-conventions.md](./08-api-conventions.md).

> **Workspace:** the backend lives in `d:/02-vite-nestjs/ecommerce/backend/`, pairing
> with the `frontend/` app from [10-implementation-plan.md](./10-implementation-plan.md).
> All paths below are relative to `backend/`.

## Architecture and Folder Structure

Clean layered architecture — **Controller → Service → Mongoose Model** — inside
`backend/`. Each feature module owns its `schemas/` and registers them with
`MongooseModule.forFeature`.

```
src/
├── main.ts                  # Bootstrap: pipes, filters, CORS, Swagger, versioning
├── app.module.ts            # Root module wiring all feature modules
│
├── config/
│   ├── env.validation.ts    # Zod/class-validator schema for process.env
│   └── config.module.ts     # Global ConfigModule (typed config service)
│
├── database/
│   └── database.module.ts   # MongooseModule.forRootAsync (Mongo connection URI)
│
├── common/                  # Cross-cutting, reusable building blocks
│   ├── decorators/
│   │   ├── public.decorator.ts        # @Public() opts out of JwtAuthGuard
│   │   ├── roles.decorator.ts         # @Roles('ADMIN' | 'OPERATOR' | 'ANALYST')
│   │   └── current-user.decorator.ts  # @CurrentUser() from request
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # Global auth guard
│   │   └── roles.guard.ts             # RBAC guard
│   ├── interceptors/
│   │   ├── response.interceptor.ts    # { data, meta } envelope
│   │   └── logging.interceptor.ts     # Request timing/log
│   ├── filters/
│   │   └── all-exceptions.filter.ts   # Consistent { statusCode, code, message }
│   ├── pipes/
│   │   └── zod-validation.pipe.ts     # Validate body against shared Zod schemas
│   ├── dto/
│   │   └── pagination.dto.ts          # page, pageSize, sort, search, filter
│   ├── schemas/
│   │   └── base.schema.ts             # Shared schema options (timestamps, toJSON transform)
│   └── utils/
│       ├── pagination.ts              # buildMeta(total, page, pageSize) helper
│       └── mongo-query.ts             # sort/filter/search → Mongoose query + options
│
├── modules/                 # Feature modules (mirror doc 05)
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts         # /auth/login, /auth/refresh, /auth/logout, /auth/me
│   │   ├── auth.service.ts            # credential check, token issue/rotate (bcrypt)
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── schemas/session.schema.ts  # refresh-token sessions (revocable)
│   │   └── dto/                       # login.dto.ts, refresh.dto.ts
│   │
│   ├── users/                         # users + roles + permissions (RBAC)
│   │   ├── users.module.ts
│   │   ├── users.controller.ts        # CRUD, invite, suspend, role assign
│   │   ├── users.service.ts
│   │   ├── schemas/user.schema.ts
│   │   └── dto/
│   │
│   ├── products/                      # products, variants, categories, inventory
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   ├── schemas/product.schema.ts  # embeds variants[], images[]
│   │   ├── schemas/category.schema.ts
│   │   └── dto/
│   │
│   ├── orders/                        # order lifecycle + timeline + fulfilment
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts       # CRUD + /:id/transition
│   │   ├── orders.service.ts          # status state machine
│   │   ├── schemas/order.schema.ts    # embeds items[], timeline[], payment, shipment
│   │   └── dto/
│   │
│   ├── customers/
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   ├── schemas/customer.schema.ts # embeds addresses[]
│   │   └── dto/
│   │
│   ├── analytics/                     # dashboard KPIs + reports (aggregation)
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts    # /analytics/kpis, /sales, /categories, /reports
│   │   └── analytics.service.ts       # Mongo aggregation pipelines
│   │
│   ├── uploads/                       # product image uploads
│   │   ├── uploads.module.ts
│   │   ├── uploads.controller.ts      # multipart POST → { url }
│   │   └── uploads.service.ts         # local disk (dev) / S3 (prod)
│   │
│   └── realtime/                      # WebSocket gateway
│       ├── realtime.module.ts
│       └── realtime.gateway.ts        # emits order.created / order.updated / notification
│
├── seed/
│   └── seed.ts                        # Mongoose-based demo data seeder
│
└── health/
    └── health.controller.ts           # GET /health (Mongo ping)
```

---

## Technical Design Details

### 1. Layering & module rules
- **Controller** handles HTTP, validation (DTO/Zod), and shaping the response — it
  never touches a model directly.
- **Service** holds business logic and is the only layer that injects and uses the
  **Mongoose model** (`@InjectModel(Product.name)`).
- **Connection** is configured once in `DatabaseModule`
  (`MongooseModule.forRootAsync`, reading `MONGODB_URI` from config); each feature
  module registers only the schemas it owns via `MongooseModule.forFeature`.
- Each feature module is self-contained and imported into `app.module.ts`.

### 2. Documents: embed vs. reference
- Follow [07-data-model.md](./07-data-model.md): embed owned sub-documents
  (order `items`/`timeline`, product `variants`/`images`, customer `addresses`);
  **reference** independent entities (`Order.customer`, `Product.category`) and
  resolve with `.populate()`.
- Global `toJSON` transform maps `_id → id` and strips `__v`, so API responses match
  the frontend's expected `{ id, ... }` shape.

### 3. Shared types & validation (monorepo)
- Request bodies validate against **Zod schemas from `packages/shared`** via a
  `ZodValidationPipe`, so `frontend/` and `backend/` validate identically — no contract
  drift. Where class-validator is preferred for Swagger, DTO classes mirror the same
  shapes.

### 4. Authentication & RBAC
- **JWT access token** (~15m) in the `Authorization: Bearer` header +
  **refresh token** (~7d) in an httpOnly cookie; `/auth/refresh` rotates it. Refresh
  tokens are stored **hashed** in a `sessions` collection so they're revocable.
- `JwtAuthGuard` is registered **globally** (`APP_GUARD`); routes opt out with
  `@Public()` (login/refresh/health).
- `RolesGuard` + `@Roles(...)` enforce role access; fine-grained permissions
  (e.g. `product.delete`, `user.manage`) are checked against the permissions data
  from [07-data-model.md](./07-data-model.md).

### 5. Response envelope, errors, pagination
- **`ResponseInterceptor`** wraps successful responses: single → `{ data }`,
  lists → `{ data, meta }` (page, pageSize, total, totalPages).
- **`AllExceptionsFilter`** normalizes every error (incl. Mongoose
  `ValidationError` and duplicate-key `E11000`) to
  `{ statusCode, code, message, details? }`.
- **`PaginationDto`** + a `mongo-query` helper turn `page/pageSize/sort/search/
  filter[...]` query params into a Mongoose `find(filter).sort().skip().limit()`
  with a parallel `countDocuments()` for `meta` — exactly the params the frontend
  tables emit as URL state.

### 6. Order status state machine
- `orders.service.ts` enforces valid transitions
  (`CREATED → PAID → PACKED → SHIPPED → DELIVERED`, plus `CANCELLED` from
  pre-shipment states). Each transition **pushes an `OrderEvent`** onto the embedded
  `timeline` array (`$push`) and emits a realtime event. Multi-document writes that
  need atomicity use a Mongo **transaction/session**.

### 7. Realtime
- A single `socket.io` gateway (namespace `/realtime`, JWT-authenticated) emits
  `order.created`, `order.updated`, and `notification`. Services inject the gateway
  and fire events after successful writes; the client invalidates the matching
  entries in its React Context data cache.

### 8. API docs & versioning
- URI versioning (`/api/v1`), global prefix `/api`, and **Swagger** at `/api/docs`
  generated from DTOs + decorators.

---

## Proposed Changes

### Bootstrap & Configuration

#### [NEW] `backend/src/main.ts`
Bootstrap: global prefix `/api`, URI versioning, global `ValidationPipe`/`ZodValidationPipe`, `AllExceptionsFilter`, `ResponseInterceptor`, CORS for the `frontend/` origin, cookie parser, and Swagger at `/api/docs`.

#### [NEW] `backend/src/app.module.ts`
Root module importing ConfigModule, DatabaseModule, and every feature module; registers `JwtAuthGuard` and `RolesGuard` as global `APP_GUARD`s.

#### [NEW] `backend/src/config/env.validation.ts` · `config.module.ts`
Validate and expose typed env (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CLIENT_ORIGIN`, upload/storage vars).

#### [MODIFY] `backend/.env` / `.env.example`
Add the variables above (e.g. `MONGODB_URI=mongodb://localhost:27017/ecommerce`).

### Database (Mongoose)

#### [NEW] `backend/src/database/database.module.ts`
`MongooseModule.forRootAsync` reading `MONGODB_URI` from config; global so every module can `forFeature` its schemas.

#### [NEW] `backend/src/common/schemas/base.schema.ts`
Shared schema options: `{ timestamps: true }` + a `toJSON` transform (`_id → id`, drop `__v`).

#### [NEW] per-module `schemas/*.schema.ts`
Implement the documents + embedded sub-documents + enums from [07-data-model.md](./07-data-model.md): user, session, category, product (variants/images embedded), customer (addresses embedded), order (items/timeline/payment/shipment embedded); plus role, permission, warehouse, inventory, review. Declare indexes (`sku`, `email` unique; `category`, `status`, `createdAt`; text indexes for search).

#### [NEW] `backend/src/seed/seed.ts`
Standalone script (run via `ts-node`) that connects with Mongoose and inserts realistic demo data (users of each role, ~15 categories, ~50 products with embedded variants/images, ~200 orders across all statuses with timelines, ~80 customers).

### Common (cross-cutting)

#### [NEW] `common/decorators/{public,roles,current-user}.decorator.ts`
Route metadata decorators.

#### [NEW] `common/guards/{jwt-auth,roles}.guard.ts`
Global auth guard + RBAC guard.

#### [NEW] `common/interceptors/{response,logging}.interceptor.ts`
`{ data, meta }` envelope + request timing.

#### [NEW] `common/filters/all-exceptions.filter.ts`
Consistent error shape (maps Mongoose `ValidationError`, `CastError`, and `E11000` duplicate-key to 422/400/409).

#### [NEW] `common/pipes/zod-validation.pipe.ts`
Validate request bodies against shared Zod schemas.

#### [NEW] `common/dto/pagination.dto.ts` + `common/utils/{pagination,mongo-query}.ts`
Pagination DTO and query-param → Mongoose `find/sort/skip/limit` + `countDocuments` mappers.

### Feature Modules

#### [NEW] `modules/auth/*`
`auth.controller.ts` (login, refresh, logout, me), `auth.service.ts` (verify credentials, bcrypt hashing, issue/rotate tokens, persist hashed refresh sessions), `jwt.strategy.ts`, `session.schema.ts`, DTOs.

#### [NEW] `modules/users/*`
CRUD + invite/suspend/role-assignment; RBAC-guarded. Serves the User Management table (avatar, role badge, last login, status, permissions).

#### [NEW] `modules/products/*`
Products + variants + categories CRUD, bulk actions, filtering/pagination, stock-status derivation; category referenced via `ObjectId` + `populate`.

#### [NEW] `modules/orders/*`
Orders CRUD, `/:id/transition` endpoint backed by the state machine, embedded `timeline` writes (`$push`), realtime emits, transactional multi-doc updates.

#### [NEW] `modules/customers/*`
Customers CRUD + embedded addresses + order history (query orders by `customer`).

#### [NEW] `modules/analytics/*`
Aggregation-pipeline endpoints powering the dashboard: `/analytics/kpis` (revenue, orders, customers, conversion + deltas), `/analytics/sales` (time series via `$group` on `createdAt`), `/analytics/categories` (distribution), `/analytics/order-status`, and `/analytics/reports` (+ CSV export).

#### [NEW] `modules/uploads/*`
Multipart image upload → `{ url }`; local disk in dev, S3-compatible in prod.

#### [NEW] `modules/realtime/*`
`realtime.gateway.ts` — authenticated socket.io namespace emitting `order.created` / `order.updated` / `notification`.

#### [NEW] `health/health.controller.ts`
`GET /health` with a Mongo connection ping (public).

---

## Endpoint summary (v1)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` |
| Users | `GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `POST /users/:id/invite` · `PATCH /users/:id/role` |
| Products | `GET/POST /products` · `GET/PATCH/DELETE /products/:id` · `POST /products/bulk` · `GET/POST /categories` |
| Orders | `GET/POST /orders` · `GET/PATCH /orders/:id` · `POST /orders/:id/transition` |
| Customers | `GET/POST /customers` · `GET/PATCH/DELETE /customers/:id` |
| Analytics | `GET /analytics/{kpis,sales,categories,order-status,reports}` |
| Uploads | `POST /uploads` |
| Health | `GET /health` |

All list endpoints accept `page`, `pageSize`, `sort`, `search`, `filter[...]` and
return the `{ data, meta }` envelope (see [08-api-conventions.md](./08-api-conventions.md)).

---

## Verification Plan

### Automated Verification
1. Install dependencies:
   - `npm install @nestjs/config @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/swagger @nestjs/websockets @nestjs/platform-socket.io socket.io bcrypt cookie-parser class-validator class-transformer zod`
   - dev: `npm install -D @types/passport-jwt @types/bcrypt @types/cookie-parser ts-node`
2. Provision MongoDB:
   - Local `mongod` on `mongodb://localhost:27017/ecommerce`, or a MongoDB Atlas URI in `MONGODB_URI`. (Transactions need a **replica set** — Atlas provides this; for local, run a single-node replica set or use `mongodb-memory-server` in tests.)
3. Seed:
   - `npx ts-node src/seed/seed.ts`
4. Build & test:
   - `npm run build` (zero TypeScript errors)
   - `npm run test` (Jest unit) · `npm run test:e2e` (Supertest, using `mongodb-memory-server`)

### Manual API Verification
1. Run: `npm run start:dev`.
2. Open **Swagger** at `http://localhost:<PORT>/api/docs` and confirm all modules appear.
3. `GET /health` returns OK with a Mongo ping.
4. `POST /auth/login` with a seeded user → receive access token + refresh cookie; `GET /auth/me` with the token works; a protected route without a token returns 401; a role-restricted route with the wrong role returns 403.
5. Products/Orders lists honor `page/pageSize/sort/search/filter` and return the `{ data, meta }` envelope; referenced fields (`category`, `customer`) are populated.
6. `POST /orders/:id/transition` advances status, pushes an `OrderEvent` onto the embedded `timeline`, and emits a realtime event (observe via a socket client).

---

## Reconciliation with the rest of these docs

| This plan | The rest of the docs | Status |
|-----------|----------------------|--------|
| Backend workspace `backend/` | `backend/` (docs 01/04) | ✅ Aligned; pairs with `frontend/` |
| MongoDB + Mongoose, `@InjectModel`, embed/reference model | [04](./04-architecture.md) / [07](./07-data-model.md) | ✅ Aligned |
| Layered Controller→Service→Model, global guards, `{data,meta}` envelope | [04](./04-architecture.md) / [08](./08-api-conventions.md) | ✅ Aligned |
| Modules | [05-modules.md](./05-modules.md) module→NestJS map | ✅ Aligned |

**MongoDB note:** transactions (used for atomic multi-document order updates) require
a replica-set deployment — use MongoDB Atlas or a local single-node replica set.
Simple single-document writes work on any standalone instance.

This plan covers the backend across **Phases 0, 2, 3, 4, 5, 6, 7** of
[09-roadmap.md](./09-roadmap.md) — build the modules in that phase order rather than
all at once.
