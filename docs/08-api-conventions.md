# 08 · API Conventions

Consistency here is what lets the frontend stay simple. All conventions are enforced
by NestJS interceptors, guards, and pipes.

## Base

- Base URL: `/api`
- Versioning: `/api/v1/...`
- Content type: `application/json`
- Swagger/OpenAPI: `/api/docs`

## Resource routing (REST)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/products` | List (paginated, filterable) |
| `POST` | `/products` | Create |
| `GET` | `/products/:id` | Read one |
| `PATCH` | `/products/:id` | Partial update |
| `DELETE` | `/products/:id` | Delete/archive |
| `POST` | `/orders/:id/transition` | Advance order status (Created→Paid→…) |
| `POST` | `/products/bulk` | Bulk actions |

The same REST shape (`GET` list · `POST` create · `GET/:id` · `PATCH/:id` ·
`DELETE/:id`) applies to every resource below.

## Full endpoint map (by module)

Grouped by domain (see [05-modules.md](./05-modules.md)). `🌐` = public/storefront
(no auth); everything else requires a bearer token, with role gates noted.

### Auth & account
| Endpoint | Notes |
|----------|-------|
| `POST /auth/signup` 🌐 · `POST /auth/login` 🌐 | Register / login |
| `POST /auth/refresh` 🌐 · `POST /auth/logout` | Rotate / revoke |
| `POST /auth/forgot-password` 🌐 · `POST /auth/reset-password` 🌐 | Reset flow |
| `POST /auth/verify-email` 🌐 · `GET /auth/google` 🌐 | Verify / OAuth |
| `GET /auth/me` · `PATCH /me/profile` · `POST /me/change-password` | Current user |
| `GET/DELETE /me/sessions` · `GET/DELETE /me/sessions/:id` | Active sessions |

### Users & RBAC (ADMIN)
`GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `POST /users/:id/invite` ·
`PATCH /users/:id/role` · `POST /users/:id/ban` · `POST /users/:id/restore` ·
`GET /users/:id/activity` · `GET/POST /roles` · `GET /permissions`.

### Catalog
- **Products** `GET 🌐 /products` · `GET 🌐 /products/:slug` · `POST/PATCH/DELETE /products/:id` · `POST /products/bulk`.
- **Categories** `GET 🌐 /categories` (tree) · `POST/PATCH/DELETE /categories/:id` · `PATCH /categories/reorder`.
- **Brands** `GET 🌐 /brands` · `POST/PATCH/DELETE /brands/:id`.
- **Variants** `GET /products/:id/variants` · `POST/PATCH/DELETE /variants/:id`.
- **Inventory** `GET /inventory` · `POST /inventory/adjust` · `GET /inventory/:variantSku/history` · `GET/POST /warehouses`.

### Commerce
- **Coupons** `GET/POST /coupons` · `PATCH/DELETE /coupons/:id` · `POST 🌐 /coupons/validate`.
- **Cart** `GET 🌐 /cart` · `POST 🌐 /cart/items` · `PATCH 🌐 /cart/items/:id` · `DELETE 🌐 /cart/items/:id` · `POST 🌐 /cart/coupon`.
- **Checkout** `POST 🌐 /checkout/quote` (totals) · `POST 🌐 /checkout` (place order).
- **Orders** `GET /orders` · `GET /orders/:id` · `POST /orders/:id/transition` · `POST /orders/:id/refund` · `GET 🌐 /me/orders`.
- **Payments** `POST 🌐 /payments/intent` · `POST /payments/webhook/:provider` 🌐 (signature-verified) · `POST /payments/:id/refund`.
- **Shipping** `GET /shipping/methods` · `POST /shipping/rate` · `GET 🌐 /shipping/track/:number`.

### Storefront & engagement
- **Reviews** `GET 🌐 /products/:id/reviews` · `POST 🌐 /reviews` · `PATCH /reviews/:id` (moderate) · `POST /reviews/:id/reply` · `POST 🌐 /reviews/:id/helpful`.
- **Wishlist** `GET 🌐 /me/wishlist` · `POST/DELETE 🌐 /me/wishlist/:productId`.
- **Search** `GET 🌐 /search?q=` · `GET 🌐 /search/autocomplete` · `GET 🌐 /search/popular`.

### Content & marketing
- **CMS** `GET 🌐 /pages/:slug` · `GET 🌐 /blogs` · `POST/PATCH/DELETE /pages/:id`, `/blogs/:id`, `/banners/:id`.
- **Marketing** `GET/POST /campaigns` · `GET/POST /gift-cards` · `POST 🌐 /newsletter/subscribe` · `GET /referrals`.

### Admin & platform
- **Analytics** `GET /analytics/{kpis,sales,categories,order-status}`.
- **Reports** `GET /reports/{sales,revenue,inventory,customer,product,coupon,tax,profit}` (+ `?format=csv|pdf`).
- **Settings** `GET/PATCH /settings` (+ namespaced: `/settings/store`, `/tax`, `/shipping`, `/email`, `/theme`).
- **Notifications** `GET /notifications` · `PATCH /notifications/:id/read` · `POST /notifications/read-all`.
- **Uploads** `POST /uploads` (multipart).
- **Bulk** `POST /import/:resource` (CSV) · `GET /export/:resource?format=csv|xlsx|pdf`.
- **AI** `POST /ai/{product/description,product/seo,image/alt-text,reviews/summarize}` · `POST /ai/assistant/chat` 🌐 · `POST /ai/support/chat` · `GET /ai/recommendations` 🌐 · `GET /ai/insights/{sales,forecast}`. See [15](./15-ai-features.md).
- **Health** `GET 🌐 /health`.

## Response envelope

Every success response is wrapped by the global `ResponseInterceptor` into a
consistent shape — handlers just return the data, never the envelope.

**Single resource**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": { "id": "…", "name": "…" }
}
```

**Collection (paginated)**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": [ /* items */ ],
  "meta": { "page": 1, "pageSize": 25, "total": 342, "totalPages": 14 }
}
```

`message` defaults to `"Success"`; override it per-handler with the
`@ResponseMessage('…')` decorator. `statusCode` mirrors the HTTP status.
Resource `id`s are **UUID v4 strings** (see [07](./07-data-model.md)), not
Mongo ObjectIds.

## Query params (lists)

| Param | Example | Meaning |
|-------|---------|---------|
| `page` | `?page=2` | 1-based page |
| `pageSize` | `?pageSize=25` | items per page (default 25, max 100) |
| `sort` | `?sort=-createdAt` | field, `-` prefix = descending |
| `search` | `?search=iphone` | free-text search |
| `filter[status]` | `?filter[status]=ACTIVE` | field filters |

These map directly to the table's URL state (React Router search params), so the
list UI is shareable and reloadable.

## Errors

Consistent shape from the global `AllExceptionsFilter` — mirrors the success
envelope with `success: false`:

```json
{
  "statusCode": 422,
  "success": false,
  "message": "price must be a positive number",
  "error": "UNPROCESSABLE_ENTITY",
  "details": [ "price must be a positive number", "name should not be empty" ]
}
```

`error` is the `HttpStatus` name for the code. `details` is present only when
there's more than one field error (the full `class-validator` message list);
`message` is the first of them. The filter also normalizes Mongoose errors:
duplicate key (E11000) → 409, `ValidationError` → 422, `CastError` → 400.

| Status | When |
|--------|------|
| 400 | Malformed request |
| 401 | Missing/invalid token |
| 403 | Authenticated but lacks role/permission |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate SKU) |
| 422 | Validation failed |

## Authentication

- **Login** `POST /auth/login` → `{ accessToken }` + refresh token in an httpOnly cookie.
- **Refresh** `POST /auth/refresh` (reads cookie) → new access token.
- **Access token** sent as `Authorization: Bearer <token>`.
- Short-lived access (~15m), longer refresh (~7d).

**Invitations (admin-only, `users.write`):**

- `POST /auth/invite` `{ name, email, role }` → creates an `INVITED` account and
  emails a set-password link. **The link/token expires in 15 minutes.** Tracks
  `invitedAt` / `inviteExpiresAt` / `invitedBy` on the user; returns `{ link }`.
- `POST /auth/reinvite/:id` → refreshes the 15-minute window + token and re-emails
  (only while `status = INVITED`, else `400`).
- `DELETE /auth/invite/:id` → revokes a pending invite (hard-deletes the
  not-yet-activated account; only while `INVITED`).
- `POST /auth/accept-invite` `{ token, password }` → sets password, `INVITED → ACTIVE`, logs in.
- The **Invited tab** on the Users page lists `GET /users?status=INVITED` and drives reinvite/revoke.
- `POST /auth/resend-verification/:id` (`users.write`) — admin re-sends a user's verification email.

**User management (`users.*`):**

- `GET /users` — paginated list. Query: `page`, `pageSize`, `sort` (`-createdAt`, `name`…), `search`, `role`, `status`, `verified` (`true`/`false`).
- `GET /users/stats` (`users.read`) — count cards: `{ total, active, invited, banned, suspended, deleted, verified, unverified, byRole[] }`.
- `POST /users/bulk` (`users.write`) — `{ ids[], action: 'ban'|'restore'|'delete'|'setRole', role? }` → `{ affected }`. The acting admin **and any Super Admin** are always excluded from the target set.
- **Super Admin protection:** ban / delete / role-change on a Super Admin (single or bulk) is refused — single actions `403`, bulk silently skips them — so the seeded account can never be locked out. You also can't act on yourself (`400`).

## Authorization (RBAC)

- Routes guarded by `@Roles('ADMIN' | 'MODERATOR' | 'OPERATOR' | 'ANALYST' |
  'CUSTOMER')` + `RolesGuard`.
- Fine-grained permissions checked against the `Permission` collection for sensitive
  actions (e.g. `product.delete`, `user.manage`, `order.refund`).
- `@Public()` opts a route out of the global `JwtAuthGuard` — used for storefront
  (`🌐`) endpoints, auth, webhooks, and health.
- **Ownership checks:** `/me/*` and storefront write routes verify the resource
  belongs to the requesting user (a CUSTOMER can only see their own orders/cart).

## Validation

- Every write endpoint validates its body against a **Zod schema from
  `packages/shared`** via a `ZodValidationPipe`. The same schema powers the React
  form (React Hook Form + Zod), so client and server never disagree.

## Pagination + performance

- Cursor pagination is an option for very large lists later; offset pagination is
  the v1 default (simpler, matches page-numbered UI).
- List endpoints select only fields the table needs; detail endpoints return the
  full record (feeds the Right Context Panel).

## Realtime (WebSocket)

- Namespace: `/realtime` (socket.io), authenticated with the access token.
- Server → client events:
  - `order.created` — new order (Live Orders widget)
  - `order.updated` — status change (invalidate order queries)
  - `notification` — toast payload
- Client reacts by **invalidating the matching entries in its React Context data
  cache** (via the data hooks), so the UI refetches only what changed.

## Uploads

- `POST /uploads` (multipart) → returns `{ url }`. Product images reference these
  URLs. Local disk in dev; Cloudinary / S3 in prod. Image pipeline (compress/resize)
  runs on upload.

## Security & rate limiting

- **Helmet** sets secure headers; **CORS** allows only the storefront/admin origins.
- **Rate limiting** (`@nestjs/throttler`, in-memory store for now — Redis later ⏳):
  stricter limits on `/auth/*` (brute-force) and AI endpoints (cost); generous on
  read-only storefront.
- All input validated (Zod/DTO); Mongo operators stripped to prevent injection;
  output encoded to prevent XSS. Mutations are CSRF-safe (bearer token, not cookie
  auth for the API).
- **Audit log** written for sensitive mutations (see [07](./07-data-model.md) ·
  Phase 23/27).

## Webhooks & idempotency

- Payment providers call `POST /payments/webhook/:provider` (🌐, but
  **signature-verified**, not `JwtAuthGuard`).
- Handlers are **idempotent**: the provider event id is stored (`Payment.providerRef`
  / raw payload) and replays are ignored — critical for correct order/payment state.

## Background jobs (⏳ later)

- **For now**, long/bulk work (emails, exports, bulk AI) runs **synchronously
  in-request** — simplest to build and debug first.
- **Later**, move it to **BullMQ (Redis)** processed off the request path, surfacing
  completion via the `notification` realtime event. The API contract doesn't change —
  only the endpoint may return `202 Accepted` for queued work.
