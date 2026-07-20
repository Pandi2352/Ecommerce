import { Cart } from '../schemas/cart.schema';

export function calculateCartTotals(cart: Partial<Cart>): {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  giftWrapFee: number;
  total: number;
} {
  const activeItems = (cart.items || []).filter((item) => !item.isSavedForLater);

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const giftWrapFee = cart.isGiftWrap && activeItems.length > 0 ? 5.0 : 0.0;

  const isFreeShippingCoupon = cart.appliedCoupon?.type === 'FREE_SHIPPING';
  const shipping =
    activeItems.length === 0 || isFreeShippingCoupon || subtotal >= 100.0 ? 0.0 : 10.0;

  const discount = Math.min(cart.appliedCoupon?.discountAmount || 0.0, subtotal);

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Number((taxableAmount * 0.08).toFixed(2));

  const total = Number((subtotal - discount + giftWrapFee + shipping + tax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    giftWrapFee: Number(giftWrapFee.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
