# 21 · Coupon & Discount Rule Engine

This document outlines the architecture, data models, validation rules, API endpoints, and UI design for the **Coupon & Discount Rule Engine** (Sprint 6 of the enterprise roadmap).

---

## 1. Executive Summary

Discounts and promotional vouchers drive customer acquisition and order volume. This enterprise module provides a flexible rule engine supporting:
- **Discount Types**: Percentage off (`20%`), Fixed amount off (`$15`), Free Shipping, Buy X Get Y (BXGY) deals, and Tiered spend rules.
- **Rule Constraints**: Minimum purchase subtotal, maximum discount cap, start & end date windows, category & brand scoping.
- **Advanced Controls**:
  - `isAutoApplied`: Automatically applies in cart when criteria are met (no code required).
  - `isStackable`: Controls whether the promo can be combined with other discounts.
  - `firstTimeUserOnly`: Restricts redemptions to new first-time customers.
- **Batch Code Generator**: Tool for generating bulk randomized single-use promo codes (e.g. `VIP-9821-X410`).
- **Usage & Redemptions**: Global redemption caps, per-user redemption limits, and transaction audit tracking.

---

## 2. Data Models & Schemas

### Coupon Schema (`Coupon`)

```typescript
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  TIERED = 'TIERED',
}

export enum DiscountStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export interface Coupon {
  _id: string;                     // UUID v4
  code: string;                    // Uppercase code e.g. "WELCOME20"
  type: DiscountType;
  value: number;                   // 20 for percentage, 15.00 for fixed
  minPurchaseAmount: number;       // Minimum subtotal required (default 0)
  maxDiscountAmount?: number;      // Maximum cap for percentage discount
  
  // Advanced Deal Rules
  tierRules?: Array<{ minSpend: number; discountValue: number }>;
  buyXGetYRule?: { buyQty: number; getQty: number; getDiscountPercent: number };
  
  // Settings & Scoping
  isAutoApplied: boolean;          // Auto-applies to cart without code entry
  isStackable: boolean;            // Allows combining with other coupons
  firstTimeUserOnly: boolean;      // Restricts to user's 1st completed order
  
  startDate: Date;
  endDate: Date;
  usageLimitTotal?: number;        // Global redemption limit
  usageLimitPerUser: number;       // Per-user redemption limit (default 1)
  usageCount: number;              // Current redemption count
  applicableCategoryIds?: string[];// Scope to specific categories
  applicableBrandIds?: string[];   // Scope to specific brands
  status: DiscountStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### Coupon Redemption Ledger Schema (`CouponRedemption`)

```typescript
export interface CouponRedemption {
  _id: string;          // UUID v4
  couponId: string;     // Ref: Coupon._id
  couponCode: string;   // Code snapshot
  userId: string;       // Ref: User._id
  orderId: string;      // Ref: Order._id
  discountAmount: number;// Amount saved
  redeemedAt: Date;
}
```

---

## 3. REST API Endpoints

### Discounts Endpoints (`/discounts`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/discounts` | List all coupons (paginated, search code, type/status filters) | `discounts.read` |
| `GET` | `/discounts/stats` | Metrics (Total Coupons, Active, Total Redemptions, Total Saved) | `discounts.read` |
| `GET` | `/discounts/:id` | Get coupon details | `discounts.read` |
| `POST` | `/discounts` | Create new promo coupon | `discounts.write` |
| `POST` | `/discounts/batch-generate` | Batch promo code generator tool | `discounts.write` |
| `PATCH` | `/discounts/:id` | Update coupon details or status | `discounts.write` |
| `DELETE` | `/discounts/:id` | Delete promo coupon | `discounts.write` |
| `POST` | `/discounts/validate` | Validate promo code against cart items, subtotal & user | Public / Auth |

---

## 4. Frontend UI Pages & Components

1. **Discounts Page (`/discounts`)**:
   - Stat Cards: Total Coupons, Active Promos, Total Redemptions, Total Saved.
   - Filter Bar: Search promo code, Type dropdown (`ALL`, `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`, `BUY_X_GET_Y`, `TIERED`), Status dropdown (`ALL`, `ACTIVE`, `EXPIRED`, `DISABLED`).
   - Table: Code Badge, Type Badge, Discount Value, Min Purchase & Cap, Date Range, Redemptions Progress (`X / Total`), Status Badge, Kebab Actions.

2. **Discount Editor Drawer (`DiscountEditorDrawer`)**:
   - Slide-over drawer with tabs: General Info, Rules & Advanced (Auto-apply, Stackable, First-time buyer), Scope (Categories/Brands).

3. **Batch Generator Modal (`BatchGeneratorModal`)**:
   - Modal tool to quickly batch-generate $N$ single-use promo codes.
