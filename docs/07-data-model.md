# 07 · Data Model

A first-pass **MongoDB** document model using **Mongoose** (`@nestjs/mongoose`).
Refine as modules land — this is the shape, not the final schema.

## Modeling approach

MongoDB is a document store, so we lean on two patterns:

- **Embed** data that is read together and owned by one parent and doesn't grow
  unbounded → e.g. an order's `items` and `timeline` events live inside the `Order`
  document; a product's `images` and `variants` embed inside `Product`.
- **Reference** (store an `ObjectId`) across independent, separately-queried
  entities → `Order.customer`, `Product.category`, `Review.product`. Resolve with
  Mongoose `populate()`.

> Rule of thumb: **embed for "has-a-and-owns", reference for "relates-to".**

## Collections & relationships

```
users            (role, status, lastLogin)
roles            ─┐
permissions      ─┴─ rolePermissions (or roles embed permission keys)

categories       ──ref── products
products          embeds: variants[], images[]; ref: category
warehouses       ──ref── inventory (product/variant stock levels)
reviews          ──ref── product, customer

customers         embeds: addresses[]
orders            embeds: items[], timeline[] (events), payment, shipment
                  ──ref── customer, and items[].variant → product/variant
```

## Core enums (string enums / Mongoose `enum`)

```
UserRole      = ADMIN | MODERATOR | OPERATOR | ANALYST | CUSTOMER
UserStatus    = ACTIVE | INVITED | SUSPENDED | BANNED | DELETED
ProductStatus = DRAFT | ACTIVE | ARCHIVED
ProductType   = PHYSICAL | DIGITAL
StockStatus   = IN_STOCK | LOW_STOCK | OUT_OF_STOCK
OrderStatus   = CREATED | PAID | PACKED | SHIPPED | DELIVERED | CANCELLED | RETURNED | REFUNDED
PaymentStatus = PENDING | PAID | PARTIALLY_REFUNDED | REFUNDED | FAILED
PaymentMethod = STRIPE | RAZORPAY | COD | WALLET | UPI
CouponType    = PERCENTAGE | FLAT | FREE_SHIPPING
CampaignType  = FLASH_SALE | DEAL | NEWSLETTER | REFERRAL
NotifChannel  = EMAIL | SMS | PUSH | IN_APP
StockTxnType  = PURCHASE | SALE | ADJUSTMENT | TRANSFER | DAMAGE | RETURN
```

> These enums also drive the **badge colors** in the UI (see
> [03-component-library.md](./03-component-library.md#badges)): green=success,
> orange=pending/low, red=cancelled/out, gray=draft.

## Mongoose schema sketch

Using the NestJS decorator style (`@Schema` / `@Prop`). Every collection gets
`timestamps: true` (adds `createdAt` / `updatedAt`).

```ts
// user.schema.ts
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, select: false }) password: string; // hashed, never returned by default
  @Prop({ type: String, enum: UserRole, default: UserRole.OPERATOR }) role: UserRole;
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE }) status: UserStatus;
  @Prop() lastLogin?: Date;
}

// category.schema.ts
@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: Types.ObjectId, ref: 'Category' }) parent?: Types.ObjectId;
}

// product.schema.ts — variants & images are EMBEDDED subdocuments
@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true }) name: string;         // "128GB / Black"
  @Prop({ required: true, unique: true }) sku: string;
  @Prop({ required: true }) price: number;
  @Prop({ default: 0 }) stock: number;
}

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true }) url: string;
  @Prop() alt?: string;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) sku: string;
  @Prop() description?: string;
  @Prop({ required: true }) price: number;
  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.DRAFT }) status: ProductStatus;
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true }) category: Types.ObjectId;
  @Prop({ type: [ProductVariant], default: [] }) variants: ProductVariant[];
  @Prop({ type: [ProductImage], default: [] }) images: ProductImage[];
  // SEO
  @Prop() metaTitle?: string;
  @Prop() metaDescription?: string;
}

// customer.schema.ts — addresses EMBEDDED
@Schema({ _id: false })
export class Address {
  @Prop() line1: string; @Prop() city: string;
  @Prop() state: string; @Prop() postalCode: string; @Prop() country: string;
}

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop() phone?: string;
  @Prop({ type: [Address], default: [] }) addresses: Address[];
}

// order.schema.ts — items, timeline, payment, shipment EMBEDDED
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) product: Types.ObjectId;
  @Prop({ required: true }) variantSku: string;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true }) unitPrice: number;
}

@Schema({ _id: false })
export class OrderEvent {                        // the timeline
  @Prop({ type: String, enum: OrderStatus, required: true }) status: OrderStatus;
  @Prop() note?: string;
  @Prop({ default: () => new Date() }) at: Date;
}

@Schema({ _id: false })
export class Payment {
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop() method?: string; @Prop() amount?: number;
}

@Schema({ _id: false })
export class Shipment {
  @Prop() carrier?: string; @Prop() trackingNumber?: string; @Prop() shippedAt?: Date;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true }) number: string;    // "1256"
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true }) customer: Types.ObjectId;
  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.CREATED, index: true }) status: OrderStatus;
  @Prop({ required: true }) total: number;
  @Prop({ type: [OrderItem], default: [] }) items: OrderItem[];
  @Prop({ type: [OrderEvent], default: [] }) timeline: OrderEvent[];
  @Prop({ type: Payment }) payment?: Payment;
  @Prop({ type: Shipment }) shipment?: Shipment;
  @Prop() notes?: string;
}
```

(Trimmed: `Role`, `Permission`, `Warehouse`, `InventoryRecord`, `Review` follow the
same conventions — `@Schema({ timestamps: true })`, string enums, `ref` for
cross-collection links.)

## Indexes

Add indexes for the queries the UI actually runs:

- `products`: `category`, `brand`, `status`, `slug` unique, `sku` unique, text index
  on `name`/`sku`/`tags`; Atlas Search index for storefront search.
- `orders`: `status`, `customer`, `createdAt` (dashboard time series & sorting).
- `customers`: `email` unique, text on `name`/`email`.
- `users`: `email` unique, `role`.
- `carts`: `user`, `sessionId`, TTL on `lastActive`.
- `coupons`: `code` unique, `expiresAt`. `payments`: `order`, `providerRef` unique.
- `notifications`: `user` + `readAt`. `auditlogs`/`activitylogs`: `entity`+`entityId`, `createdAt`.

---

## Enterprise collections

The full platform (see [05-modules.md](./05-modules.md) / [09-roadmap.md](./09-roadmap.md))
adds the collections below. Field lists show the shape; **embed/ref** follows the
same rule as above. Representative Mongoose sketches are given for the tricky ones;
the rest list key fields.

### Catalog additions

**Product (extended)** — add: `brand` (ref `Brand`), `type` (`ProductType`),
`tags: string[]`, `collections: ObjectId[]`, `vendor`, `barcode`, `video`,
`weight`, `dimensions: {l,w,h}`, `taxClass`, `discount`, `related: ObjectId[]`,
`crossSell: ObjectId[]`, `upsell: ObjectId[]`, flags `featured`/`popular`/
`trending`/`newArrival`, `digital: { fileUrl, licenseKeys? }`.

**Brand** — `name`, `slug` (unique), `logo`, `banner`, `description`, `seo`.

**InventoryRecord / StockTransaction** — `variant` (ref), `warehouse` (ref),
`quantity`, `type` (`StockTxnType`), `reason`, `reference`, `createdBy`. Low-stock
alerts fire when on-hand < threshold.

### Coupons

```ts
@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true }) code: string;
  @Prop({ type: String, enum: CouponType, required: true }) type: CouponType;
  @Prop({ required: true }) value: number;              // percent or flat amount
  @Prop() minPurchase?: number;
  @Prop() maxDiscount?: number;
  @Prop() expiresAt?: Date;
  @Prop({ default: false }) singleUse: boolean;
  @Prop() perUserLimit?: number;
  @Prop({ default: 0 }) usedCount: number;
  @Prop({ default: true }) active: boolean;
}
// CouponUsage: { coupon, user, order, usedAt } — enforce per-user limits
```

### Cart (guest + user)

```ts
@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) product: Types.ObjectId;
  @Prop({ required: true }) variantSku: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ default: false }) savedForLater: boolean;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) user?: Types.ObjectId; // null = guest
  @Prop({ index: true }) sessionId?: string;            // guest cart key
  @Prop({ type: [CartItem], default: [] }) items: CartItem[];
  @Prop() couponCode?: string;
  @Prop() giftWrap?: boolean;
  @Prop() notes?: string;
  @Prop({ default: () => new Date(), expires: '30d' }) lastActive: Date; // TTL cleanup
}
```

### Payments

```ts
@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true }) order: Types.ObjectId;
  @Prop({ type: String, enum: PaymentMethod, required: true }) method: PaymentMethod;
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop({ required: true }) amount: number;
  @Prop() currency: string;
  @Prop() providerRef?: string;         // Stripe/Razorpay payment id
  @Prop({ type: Object }) rawWebhook?: Record<string, unknown>; // idempotency + audit
  @Prop() refundedAmount?: number;
}
```

### Shipping

- **ShippingMethod** — `name`, `carrier`, `baseRate`, `perKgRate`, `freeAbove?`,
  `estimatedDays`, `active`. Order's embedded `shipment` gains `method`,
  `trackingNumber`, `status`, `estimatedDelivery`.

### Reviews (extended)

- **Review** — `product` (ref), `customer` (ref), `rating` (1–5), `title`, `body`,
  `images: string[]`, `verifiedPurchase` (bool), `helpfulCount`, `status`
  (`PENDING|APPROVED|HIDDEN`), `reply?: { body, at }`.

### Customer engagement

- **Wishlist** — `user` (ref), `products: ObjectId[]`.
- **RecentlyViewed** — `user` (ref), `entries: [{ product, at }]` (capped).

### CMS

- **Page** — `slug` (unique), `title`, `content` (rich HTML/JSON from TipTap),
  `status`, `seo`.
- **Banner** — `placement` (hero/home/category), `image`, `link`, `active`, `order`.
- **Blog** — `slug`, `title`, `cover`, `content`, `author`, `tags`, `publishedAt`.

### Marketing

- **Campaign** — `type` (`CampaignType`), `name`, `startsAt`, `endsAt`, `rules`
  (target products/categories, discount), `active`.
- **GiftCard** — `code` (unique), `balance`, `initialValue`, `expiresAt`, `owner?`.
- **Referral** — `referrer` (ref user), `code`, `referredUsers: ObjectId[]`, `reward`.

### Platform

- **Notification** — `user` (ref), `channel` (`NotifChannel`), `type`, `title`,
  `body`, `data`, `readAt?`. In-app feed + queued email/SMS/push.
- **AuditLog** — `actor` (ref user), `action`, `entity`, `entityId`, `before`,
  `after`, `ip`, `at`. (Immutable; Phase 23/27.)
- **ActivityLog** — `user`, `event` (login, view, add-to-cart…), `meta`, `at`.
- **Setting** — singleton-ish `key`/`value` documents (store, currency, tax,
  shipping, email, theme, payment) grouped by namespace.

### AI (see [15-ai-features.md](./15-ai-features.md))

- **Embedding** — `entity` (product/page), `entityId`, `vector: number[]`,
  `model`, indexed with **Atlas Vector Search** for RAG + recommendations.
- Generated content is stored on the owning entity with an `aiGenerated: true` flag
  for auditable review before publish.

---

## Derived / computed (not stored)

- **KPIs** (revenue, conversion, growth) — computed via **aggregation pipelines**
  in the `analytics` module (`$match` / `$group` / `$sort`).
- **StockStatus** — derived from variant stock vs. a low-stock threshold.
- **Cart totals** (subtotal, discount, shipping, tax, grand total) — computed at
  read time / checkout, never trusted from the client.
- **Sales heatmap / sparklines** — `$group` by day over `orders.createdAt`.

## Session / auth storage

- Refresh tokens: store a hashed refresh token (or a `sessions` collection with
  `userId`, `tokenHash`, `expiresAt`, `userAgent`) so sessions can be revoked.

## Seeding

Ship a `seed.ts` (run with `ts-node`) that connects via Mongoose and inserts
realistic demo data: users of each role, ~10 brands, ~15 nested categories, ~50
products with embedded variants + images (mix of physical/digital), inventory
records, ~10 coupons, ~200 orders across all statuses (with timelines + payments),
~80 customers, reviews, a few CMS pages/banners, and a flash-sale campaign — so the
admin dashboard **and** the storefront look alive in screenshots.
