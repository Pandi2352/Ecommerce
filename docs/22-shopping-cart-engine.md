# 22 · Shopping Cart Engine & Server Totals

This document outlines the architecture, data models, calculation logic, API endpoints, and UI design for the **Shopping Cart Engine & Server Totals** (Sprint 6 Cart of the enterprise roadmap).

---

## 1. Executive Summary

The shopping cart engine manages item selection, quantity adjustments, guest & user session persistence, promo coupon application, save-for-later lists, and server-computed order totals:
- **Dual Persistence**: Anonymous session carts (`guestId`) and logged-in user carts (`userId`).
- **Cart Merge**: Seamlessly merges guest cart items into customer cart upon authentication.
- **Server-Computed Totals**: Subtotal, Coupon Discount, Gift Wrap Fee ($5), Estimated Tax (8%), Estimated Shipping ($10 or Free over $100), and Final Total are calculated on the server to prevent client total tampering.
- **Stock Validation**: Validates inventory stock before adding items to cart.

---

## 2. Data Models & Schemas

### Cart Schema (`Cart`)

```typescript
export interface CartItem {
  _id: string;              // UUID v4
  productId: string;        // Ref: Product._id
  variantSku: string;       // Variant SKU
  name: string;             // Name snapshot
  image?: string;           // Thumbnail image
  price: number;            // Unit price
  quantity: number;         // Quantity (min 1)
  isSavedForLater: boolean; // Saved for later flag
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  giftWrapFee: number;
  total: number;
}

export interface Cart {
  _id: string;              // UUID v4
  userId?: string;          // Customer User UUID
  guestId?: string;         // Guest Session UUID
  items: CartItem[];
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    type: string;
  };
  isGiftWrap: boolean;      // +$5.00 fee
  deliveryNotes?: string;
  totals: CartTotals;
  expiresAt: Date;          // TTL index for guest carts (30 days)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. REST API Endpoints

### Cart Endpoints (`/cart`)

| Method | Endpoint | Description | Auth / Scope |
|--------|----------|-------------|--------------|
| `GET` | `/cart` | Get active cart (creates empty cart if none exists) | Guest / User |
| `POST` | `/cart/items` | Add product variant to cart (validates inventory stock) | Guest / User |
| `PATCH` | `/cart/items/:itemId` | Update quantity or toggle `isSavedForLater` | Guest / User |
| `DELETE` | `/cart/items/:itemId` | Remove item from cart | Guest / User |
| `POST` | `/cart/coupon` | Apply promo coupon code | Guest / User |
| `DELETE` | `/cart/coupon` | Remove applied promo coupon | Guest / User |
| `POST` | `/cart/options` | Update gift wrap ($5 fee) & delivery notes | Guest / User |
| `POST` | `/cart/merge` | Merge guest cart into customer cart on login | Auth User |
| `DELETE` | `/cart` | Clear entire cart | Guest / User |

---

## 4. Server Totals Calculation Logic

$$\text{Subtotal} = \sum_{i \in \text{Active Items}} (\text{price}_i \times \text{quantity}_i)$$

$$\text{GiftWrapFee} = \begin{cases} 5.00 & \text{if } \text{isGiftWrap} = \text{true} \\ 0.00 & \text{otherwise} \end{cases}$$

$$\text{Shipping} = \begin{cases} 0.00 & \text{if coupon is FREE\_SHIPPING or } \text{Subtotal} \ge 100.00 \\ 10.00 & \text{otherwise} \end{cases}$$

$$\text{Tax} = \text{round}((\text{Subtotal} - \text{Discount}) \times 0.08, 2)$$

$$\text{Final Total} = \text{Subtotal} - \text{Discount} + \text{GiftWrapFee} + \text{Shipping} + \text{Tax}$$

---

## 5. Frontend UI Components

1. **Navbar Cart Badge**:
   - Cart icon button with active item count badge in top navigation bar opening `CartDrawer`.

2. **Slide-over Cart Drawer (`CartDrawer`)**:
   - Slide-over panel listing cart items, quick quantity increment/decrement, and subtotal.

3. **Full Cart Page (`CartPage.tsx` at `/cart`)**:
   - Item list table with thumbnail, title, SKU, unit price, quantity picker, save-for-later button, and delete button.
   - Save for Later section.
   - Promo code input with instant validation feedback.
   - Gift wrap checkbox ($5.00) & delivery instructions textarea.
   - Order Summary Card displaying server-computed Subtotal, Discount, Gift Wrap, Tax, Shipping, and Final Total.
