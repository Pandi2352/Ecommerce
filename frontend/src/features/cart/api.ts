import { api } from '@/lib/api';
import type {
  AddToCartInput,
  ApplyCartCouponInput,
  CartPayload,
  UpdateCartItemInput,
  UpdateCartOptionsInput,
} from './types';

const GUEST_ID_KEY = 'nova_guest_cart_id';

export function getGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function getCartHeaders() {
  return { 'x-guest-id': getGuestId() };
}

export const fetchCart = async (): Promise<CartPayload> => {
  const res = await api.get<CartPayload>('/cart', { headers: getCartHeaders() });
  return res.data;
};

export const addToCart = async (input: AddToCartInput): Promise<CartPayload> => {
  const res = await api.post<CartPayload>('/cart/items', input, { headers: getCartHeaders() });
  return res.data;
};

export const updateCartItem = async (
  itemId: string,
  input: UpdateCartItemInput,
): Promise<CartPayload> => {
  const res = await api.patch<CartPayload>(`/cart/items/${itemId}`, input, {
    headers: getCartHeaders(),
  });
  return res.data;
};

export const removeCartItem = async (itemId: string): Promise<CartPayload> => {
  const res = await api.delete<CartPayload>(`/cart/items/${itemId}`, {
    headers: getCartHeaders(),
  });
  return res.data;
};

export const applyCartCoupon = async (input: ApplyCartCouponInput): Promise<CartPayload> => {
  const res = await api.post<CartPayload>('/cart/coupon', input, { headers: getCartHeaders() });
  return res.data;
};

export const removeCartCoupon = async (): Promise<CartPayload> => {
  const res = await api.delete<CartPayload>('/cart/coupon', { headers: getCartHeaders() });
  return res.data;
};

export const updateCartOptions = async (
  input: UpdateCartOptionsInput,
): Promise<CartPayload> => {
  const res = await api.post<CartPayload>('/cart/options', input, { headers: getCartHeaders() });
  return res.data;
};

export const mergeGuestCart = async (): Promise<CartPayload> => {
  const guestId = getGuestId();
  const res = await api.post<CartPayload>('/cart/merge', { guestId });
  return res.data;
};

export const clearCart = async (): Promise<CartPayload> => {
  const res = await api.delete<CartPayload>('/cart', { headers: getCartHeaders() });
  return res.data;
};
