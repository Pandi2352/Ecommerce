export interface CartItem {
  _id: string;
  productId: string;
  variantSku: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  isSavedForLater: boolean;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  giftWrapFee: number;
  total: number;
}

export interface CartPayload {
  _id: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    type: string;
  };
  isGiftWrap: boolean;
  deliveryNotes?: string;
  totals: CartTotals;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartInput {
  productId: string;
  variantSku: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity?: number;
  isSavedForLater?: boolean;
}

export interface ApplyCartCouponInput {
  code: string;
}

export interface UpdateCartOptionsInput {
  isGiftWrap?: boolean;
  deliveryNotes?: string;
}
