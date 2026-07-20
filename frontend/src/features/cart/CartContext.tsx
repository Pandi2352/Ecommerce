import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  addToCart,
  applyCartCoupon,
  clearCart,
  fetchCart,
  mergeGuestCart,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
  updateCartOptions,
} from './api';
import type { CartPayload } from './types';

interface CartContextValue {
  cart: CartPayload | null;
  loading: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  itemCount: number;
  addItem: (productId: string, variantSku: string, quantity?: number) => Promise<void>;
  updateItemQty: (itemId: string, quantity: number) => Promise<void>;
  toggleSaveForLater: (itemId: string, saved: boolean) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  updateOptions: (isGiftWrap?: boolean, deliveryNotes?: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
    } catch {
      // Ignore initial unauth error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-merge guest cart upon user login
  useEffect(() => {
    if (user) {
      mergeGuestCart().then(setCart).catch(() => {});
    }
  }, [user]);

  const addItem = async (productId: string, variantSku: string, quantity = 1) => {
    try {
      const updated = await addToCart({ productId, variantSku, quantity });
      setCart(updated);
      toast.success('Added item to shopping cart 🛒');
      setDrawerOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add item to cart'));
    }
  };

  const updateItemQty = async (itemId: string, quantity: number) => {
    try {
      const updated = await updateCartItem(itemId, { quantity });
      setCart(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update item quantity'));
    }
  };

  const toggleSaveForLater = async (itemId: string, saved: boolean) => {
    try {
      const updated = await updateCartItem(itemId, { isSavedForLater: saved });
      setCart(updated);
      toast.success(saved ? 'Moved item to Saved For Later' : 'Moved item back to active cart');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update item state'));
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
      toast.success('Removed item from cart');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove item'));
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const updated = await applyCartCoupon({ code });
      setCart(updated);
      toast.success('Applied promo code to cart 🎉');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid promo code'));
    }
  };

  const removeCoupon = async () => {
    try {
      const updated = await removeCartCoupon();
      setCart(updated);
      toast.success('Removed promo code');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove promo code'));
    }
  };

  const updateOptions = async (isGiftWrap?: boolean, deliveryNotes?: string) => {
    try {
      const updated = await updateCartOptions({ isGiftWrap, deliveryNotes });
      setCart(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update cart options'));
    }
  };

  const clear = async () => {
    try {
      const updated = await clearCart();
      setCart(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to clear cart'));
    }
  };

  const activeItems = (cart?.items || []).filter((i) => !i.isSavedForLater);
  const itemCount = activeItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        drawerOpen,
        setDrawerOpen,
        itemCount,
        addItem,
        updateItemQty,
        toggleSaveForLater,
        removeItem,
        applyCoupon,
        removeCoupon,
        updateOptions,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
