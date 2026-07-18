# 05 · Modules

The complete map of the panel's modules. Each **business module** has a frontend
feature folder (`frontend/src/features/*`) and, where it needs data, a matching NestJS
module (`backend/src/modules/*`). **Platform modules** are mostly backend/infra with
thin or shared UI.

Entities reference [07-data-model.md](./07-data-model.md); endpoints reference
[08-api-conventions.md](./08-api-conventions.md); build order is in
[09-roadmap.md](./09-roadmap.md).

Legend: 🖥️ frontend · 🔌 backend · ⚡ realtime · ➕ newer enterprise module (full
endpoints in [08](./08-api-conventions.md), entities in [07](./07-data-model.md);
detailed per-file plan in [11](./11-backend-implementation-plan.md) still to be
extended for these)

---

## A. Shell & Navigation (cross-cutting UI chrome)

The persistent frame that wraps every authenticated page. Lives in
`frontend/src/components/layout/`.

| Component | Responsibility |
|-----------|----------------|
| **Sidebar** 🖥️ | Graphite nav from `sidebar.config.ts`: Dashboard, Products, Orders, Customers, Reports, Users, Settings. Active = white pill. Collapsible. |
| **Top Navigation** 🖥️ | 64px, bottom border only. Breadcrumb · Search · Command trigger · Notifications · Profile · Theme switch. |
| **Workspace Dock** 🖥️ | Browser-style tabs of open modules; persisted state (see [06](./06-signature-features.md)). |
| **Right Context Panel** 🖥️ | Slide-in detail panel for row clicks (see [06](./06-signature-features.md)). |
| **Command Palette** 🖥️ | ⌘K / Ctrl+K navigation + actions + entity search. |
| **Theme** 🖥️ | Light/dark toggle via `.dark` on `<html>` (token-driven). |
| **AuthLayout** 🖥️ | Minimal shell (no sidebar) for the login screen. |

---

## B. Business modules

### 1. Dashboard

Overview surface built from **widgets** inside bordered containers.
Layout order: KPI row → Sales chart → Orders table → Recent activity → AI insights.

- **Frontend** `features/dashboard/` — widgets in `components/`.
- **Backend** `analytics` (aggregations) + `realtime` (live orders).
- **Endpoints** `GET /analytics/{kpis,sales,categories,order-status}`.
- **Realtime** ⚡ `order.created` feeds the Live Orders widget.

**Widgets**

| Widget | Description |
|--------|-------------|
| KPI cards | Revenue · Orders · Customers · Conversion (value + delta + sparkline) |
| Sales chart | Dual-line, 2px, no gradient |
| Sales heatmap | GitHub contribution-style grid, sales by day |
| Live orders ⚡ | Realtime feed: 🟢 John purchased iPhone · 2 sec ago |
| Warehouse status | Horizontal capacity bars (Warehouse A — 82%) |
| Inventory health | Gauge (Healthy — 78%) |
| AI recommendation | "Increase stock — Laptop — Demand +42%" + Restock button |
| Revenue goal | Circular progress (74% of monthly goal) |
| Category distribution | Donut (first pass) / treemap |
| Best seller | Large product card |
| Customer growth | Line chart |
| Recent reviews | Scrollable list |

### 2. Products

- **Frontend** `features/products/` — list page + right-panel detail.
  - Toolbar: Search · Category · Status · Bulk action · Add Product.
  - Rich table: `Image · Product · Stock · Price · Category · Status · Sales · Actions`.
  - Detail tabs: `General · Inventory · SEO · Images · Shipping · Variants · Reviews`.
- **Backend** `products` (+ `uploads` for images).
- **Entities** `Product` (embeds `variants[]`, `images[]`), refs `Category`.
- **Endpoints** `GET/POST /products` · `GET/PATCH/DELETE /products/:id` · `POST /products/bulk`.
- **Access** create/update/delete → ADMIN, OPERATOR; read → all roles.

#### 2a. Categories (sub-domain of `products`) — ✅ built (ahead of schedule)

- Product taxonomy, **unlimited nesting** via `parent`; delete reparents children.
  Powers the category filter and the dashboard distribution widget.
- **Entities** `Category`. **Endpoints** `GET /categories` (+ `?tree=true`) ·
  `GET/:id` · `POST` · `PATCH/:id` · `DELETE/:id`.
- **Status:** backend `categories` module + admin CRUD page done. Pending: SEO/media
  fields in the form, drag-reorder UI, and `@Roles('ADMIN')` guard (needs Sprint 2 auth).

#### 2b. Inventory & Warehouses ➕ (sub-domain of `products`)

- Stock levels per variant, low-stock thresholds → derived `StockStatus`; warehouse
  capacity. Powers the Inventory tab, Warehouse-status and Inventory-health widgets,
  and the AI restock recommendation.
- **Entities** `Warehouse`, `InventoryRecord` (+ `ProductVariant.stock`).
- **Endpoints ➕** `GET /inventory` · `PATCH /inventory/:variantSku` · `GET /warehouses`.

### 3. Orders

- **Frontend** `features/orders/` — list with status filters + bulk fulfilment;
  right-panel detail with a **timeline**.
  ```
  Order Created → Paid → Packed → Shipped → Delivered   (or Cancelled)
  ```
  Panel sections: Customer · Timeline · Payment · Shipment · Notes.
- **Backend** `orders` (status state machine) + `realtime`.
- **Entities** `Order` (embeds `items[]`, `timeline[]`, `payment`, `shipment`), refs `Customer`, `Product`.
- **Endpoints** `GET/POST /orders` · `GET/PATCH /orders/:id` · `POST /orders/:id/transition`.
- **Realtime** ⚡ emits `order.created` / `order.updated`.

### 4. Customers

- **Frontend** `features/customers/` — list (customer, orders count, lifetime value,
  last order, status); right-panel detail (profile, order history, addresses, notes,
  growth).
- **Backend** `customers`.
- **Entities** `Customer` (embeds `addresses[]`); order history via `Order.customer`.
- **Endpoints** `GET/POST /customers` · `GET/PATCH/DELETE /customers/:id`.

### 5. Reviews ➕

- **Frontend** in the product detail **Reviews** tab + the dashboard **Recent
  reviews** widget; optional moderation list.
- **Backend ➕** `reviews` (or folded into `products`).
- **Entities** `Review` (refs `Product`, `Customer`).
- **Endpoints ➕** `GET /reviews` (filter by product) · `PATCH /reviews/:id` (approve/hide) · `DELETE /reviews/:id`.

### 6. Reports / Analytics

- **Frontend** `features/reports/` — deeper analytics: revenue over time, product
  performance, category breakdowns, customer cohorts; date-range + segment filters;
  CSV export. Reuses chart + table primitives.
- **Backend** `analytics`.
- **Endpoints** `GET /analytics/reports` (+ query params) with CSV export.

### 7. Users & Roles

- **Frontend** `features/users/` — table `Avatar · Name · Role badge · Last login ·
  Status · Permissions`; invite / suspend / role assignment.
- **Backend** `users` + RBAC (works with `auth`).
- **Entities** `User`, `Role`, `Permission`.
- **Endpoints** `GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `POST /users/:id/invite` · `PATCH /users/:id/role`.
- **Access** ADMIN only.

### 8. Settings

- **Frontend** `features/settings/` — tabs: Store profile · Currency/Tax/Shipping ·
  Theme + notification prefs · API keys / integrations (later) · Account & security
  (password, active sessions).
- **Backend** `settings` (may start inside `users`/`config`); sessions come from `auth`.
- **Endpoints ➕** `GET/PATCH /settings` · `GET/PATCH /me/profile` · `GET/DELETE /me/sessions`.

---

## C. Platform / infrastructure modules

Mostly backend; thin or shared UI.

### Authentication & Sessions

- **Frontend** Login page (`AuthLayout`), token handling, protected routes, refresh.
- **Backend** `auth` — JWT access + refresh (httpOnly cookie, hashed in a `sessions`
  collection so it's revocable); `JwtAuthGuard` (global), `RolesGuard`, `@Public()`.
- **Entities** `Session`, `User`.
- **Endpoints** `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`.

### Notifications ➕⚡

- **Frontend** top-right toasts + a notifications feed/drawer.
- **Backend ➕** `notifications` (emits via `realtime`; optional persisted feed).
- **Endpoints ➕** `GET /notifications` · `PATCH /notifications/:id/read`.
- **Realtime** ⚡ `notification` event.

### Uploads / Media

- **Backend** `uploads` — multipart image upload → `{ url }`; local disk (dev) /
  S3-compatible (prod). Used by Products.
- **Endpoints** `POST /uploads`.

### Realtime

- **Backend** `realtime` — a single JWT-authenticated socket.io namespace
  (`/realtime`) emitting `order.created`, `order.updated`, `notification`. Consumed
  by the Dashboard and Notifications; clients invalidate matching query keys.

### Health, Config & Database

- **Backend** `health` (`GET /health` — Mongo ping), `config` (typed env), `database`
  (`MongooseModule.forRootAsync`). Infra only, no UI.

---

## D. Commerce-flow & storefront modules

The enterprise scope (see [09-roadmap.md](./09-roadmap.md)) adds these. Each has a
`frontend/src/features/*` folder and a `backend/src/*` module. Full endpoint/entity
depth is added per phase as they're built.

| Module | Phase | What it covers | Key entities |
|--------|-------|----------------|--------------|
| **Brands** | 6 | Brand CRUD, logo/banner, SEO | `Brand` |
| **Variants** | 7 | Option combinations (size/color/…), per-variant SKU/price/stock | `ProductVariant` |
| **Coupons** | 9 | %/flat/free-ship rules, min/max, expiry, per-user usage | `Coupon`, `CouponUsage` |
| **Cart** | 10 | Guest + user carts, save-for-later, coupon, gift wrap, notes | `Cart`, `CartItem` |
| **Checkout** | 11 | Multi-step: shipping/billing/address/delivery/payment/review | (orchestrates cart→order) |
| **Payments** | 13 | Stripe/Razorpay/COD/wallet/UPI, webhooks, refunds | `Payment`, `Transaction` |
| **Shipping** | 14 | Carriers, charge/weight calc, tracking, estimates | `ShippingMethod`, `Shipment` |
| **Storefront** | 15 | Customer UI: home, catalog, search, filters, PDP, cart, checkout, account | (consumes above) |
| **Wishlist** | 2/15 | Wishlist + recently viewed | `Wishlist`, `RecentlyViewed` |
| **CMS** | 17 | Pages, banners, hero, footer, FAQs, blogs (TipTap) | `Page`, `Banner`, `Blog` |
| **Marketing** | 18 | Flash sales, deals, referrals, gift cards, newsletters, campaigns | `Campaign`, `GiftCard`, `Referral` |
| **Search** | 22 | Autocomplete, recent/popular, Atlas full-text + vector | (indexes products/CMS) |
| **AI** | 30 | Generators, RAG assistant, recommendations, forecasting | (see [15](./15-ai-features.md)) |

> These extend the endpoint tables in [08](./08-api-conventions.md) /
> [11](./11-backend-implementation-plan.md) — add their routes/schemas there as each
> module is built (same ➕ note as below).

## Module → NestJS module map

| Frontend feature | Backend module(s) | Realtime |
|------------------|-------------------|----------|
| dashboard | `analytics`, `realtime` | ⚡ |
| products (+ categories, inventory) | `products`, `uploads` | — |
| orders | `orders`, `realtime` | ⚡ |
| customers | `customers` | — |
| reviews | `reviews` (or `products`) | — |
| reports | `analytics` | — |
| users | `users`, `auth` | — |
| settings | `settings`/`config`, `auth` | — |
| shell · notifications | `auth`, `notifications`, `realtime` | ⚡ |
| — (infra) | `uploads`, `health`, `config`, `database` | — |

## Entity → owning module

| Entity (doc 07) | Owner |
|-----------------|-------|
| `User`, `Role`, `Permission` | users / auth |
| `Session` | auth |
| `Category` | products |
| `Product`, `ProductVariant`, `ProductImage` | products |
| `Warehouse`, `InventoryRecord` | products (inventory) |
| `Customer`, `Address` | customers |
| `Order`, `OrderItem`, `OrderEvent`, `Payment`, `Shipment` | orders / payments |
| `Brand` | brands |
| `Coupon`, `CouponUsage` | coupons |
| `Cart`, `CartItem` | cart |
| `ShippingMethod` | shipping |
| `Review` | reviews / products |
| `Wishlist`, `RecentlyViewed` | wishlist |
| `Page`, `Banner`, `Blog` | cms |
| `Campaign`, `GiftCard`, `Referral` | marketing |
| `Notification`, `AuditLog`, `ActivityLog`, `Setting` | platform |
| `Embedding` | ai |

---

> **➕ note:** modules marked ➕ now have their **endpoints in
> [08-api-conventions.md](./08-api-conventions.md)** and **entities in
> [07-data-model.md](./07-data-model.md)**. The one doc still to catch up is the
> file-by-file backend plan [11](./11-backend-implementation-plan.md), which details
> the core modules; the newer ones follow the identical Controller→Service→Schema
> pattern — extend its `[NEW]` list as you build each.
