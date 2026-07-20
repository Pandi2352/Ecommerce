import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Tag,
  Gift,
  Bookmark,
  CheckCircle2,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { Button, Checkbox, EmptyState, Input, Textarea } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';
import { useCart } from './CartContext';

export function CartPage() {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    updateItemQty,
    toggleSaveForLater,
    removeItem,
    applyCoupon,
    removeCoupon,
    updateOptions,
    clear,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [applying, setApplying] = useState(false);

  const activeItems = (cart?.items || []).filter((i) => !i.isSavedForLater);
  const savedItems = (cart?.items || []).filter((i) => i.isSavedForLater);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setApplying(true);
    try {
      await applyCoupon(promoCode.trim());
      setPromoCode('');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-text-secondary">
        Loading shopping cart…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-500" />
            <span>Shopping Cart</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Review cart items, apply promotional codes, and view server-computed order totals.
          </p>
        </div>

        {activeItems.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-danger hover:text-danger" onClick={clear}>
            Clear Cart
          </Button>
        )}
      </div>

      {activeItems.length === 0 && savedItems.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-8 text-indigo-500" />}
          title="Your shopping cart is empty"
          description="You haven't added any products to your cart yet. Explore our product catalog!"
          action={
            <Button onClick={() => navigate('/products')} className="gap-2">
              <span>Browse Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Cart Items Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Items */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
              <h3 className="text-sm font-bold text-text flex items-center justify-between border-b border-border pb-3">
                <span>Active Items ({activeItems.length})</span>
                <span className="text-xs font-mono font-semibold text-text-secondary">
                  Subtotal: {formatCurrency(cart?.totals.subtotal || 0)}
                </span>
              </h3>

              {activeItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-text-secondary">
                  All items are saved for later.
                </p>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeItems.map((item) => (
                    <div key={item._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-14 w-14 rounded-lg border border-border object-cover shrink-0"
                          />
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-border bg-bg text-text-secondary">
                            <Package className="h-6 w-6" />
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-text">{item.name}</p>
                          <p className="font-mono text-xs text-indigo-500 font-semibold">{item.variantSku}</p>
                          <p className="text-xs font-bold text-text sm:hidden">{formatCurrency(item.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <span className="hidden sm:block font-mono text-sm font-bold text-text">
                          {formatCurrency(item.price)}
                        </span>

                        {/* Quantity picker */}
                        <div className="flex items-center gap-1 rounded-md border border-border bg-bg p-1">
                          <button
                            type="button"
                            className="p-1 hover:text-indigo-500 disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            onClick={() => updateItemQty(item._id, item.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            className="p-1 hover:text-indigo-500"
                            onClick={() => updateItemQty(item._id, item.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Total price for item */}
                        <span className="font-mono text-sm font-bold text-text w-20 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Save for Later"
                            onClick={() => toggleSaveForLater(item._id, true)}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-danger hover:text-danger"
                            title="Remove"
                            onClick={() => removeItem(item._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save for Later Section */}
            {savedItems.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-indigo-500" />
                  <span>Saved for Later ({savedItems.length})</span>
                </h3>

                <div className="divide-y divide-border/50">
                  {savedItems.map((item) => (
                    <div key={item._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-bg">
                            <Package className="h-4 w-4 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-text">{item.name}</p>
                          <p className="font-mono text-[11px] text-indigo-500">{item.variantSku}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-text">{formatCurrency(item.price)}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleSaveForLater(item._id, false)}
                        >
                          Move to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Wrap & Delivery Notes */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-500" />
                <span>Gift Options & Delivery Instructions</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-text">
                  <Checkbox
                    checked={cart?.isGiftWrap || false}
                    onChange={(e) => updateOptions(e.target.checked, cart?.deliveryNotes)}
                  />
                  <span>Add Premium Gift Wrapping & Ribbon (+$5.00)</span>
                </label>

                <Textarea
                  value={cart?.deliveryNotes || ''}
                  onChange={(e) => updateOptions(cart?.isGiftWrap, e.target.value)}
                  placeholder="Special instructions for delivery (e.g. Leave at front porch, Ring doorbell)..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Summary Card */}
          <div className="space-y-4">
            {/* Promo Code Input Card */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-500" />
                <span>Promotional Code</span>
              </h4>

              {cart?.appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {cart.appliedCoupon.code}
                      </span>
                      <p className="text-[11px] text-text-secondary">
                        Saved {formatCurrency(cart.appliedCoupon.discountAmount)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-danger hover:text-danger"
                    onClick={removeCoupon}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER20"
                    className="font-mono uppercase text-xs"
                  />
                  <Button type="submit" variant="secondary" disabled={applying || !promoCode.trim()} className="text-xs shrink-0">
                    {applying ? 'Applying…' : 'Apply'}
                  </Button>
                </form>
              )}
            </div>

            {/* Server-Computed Order Totals Summary */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
              <h3 className="text-sm font-bold text-text border-b border-border pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-text">{formatCurrency(cart?.totals.subtotal || 0)}</span>
                </div>

                {cart?.totals.discount ? (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Coupon Discount:</span>
                    <span className="font-mono font-bold">-{formatCurrency(cart.totals.discount)}</span>
                  </div>
                ) : null}

                {cart?.totals.giftWrapFee ? (
                  <div className="flex justify-between">
                    <span>Gift Wrapping Fee:</span>
                    <span className="font-mono font-bold text-text">{formatCurrency(cart.totals.giftWrapFee)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span>Estimated Shipping:</span>
                  <span className="font-mono font-bold text-text">
                    {cart?.totals.shipping === 0 ? (
                      <span className="text-emerald-500 font-bold">FREE</span>
                    ) : (
                      formatCurrency(cart?.totals.shipping || 0)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax (8%):</span>
                  <span className="font-mono font-bold text-text">{formatCurrency(cart?.totals.tax || 0)}</span>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-base">
                  <span className="font-bold text-text">Total Amount:</span>
                  <span className="font-mono font-bold text-indigo-500 text-lg">
                    {formatCurrency(cart?.totals.total || 0)}
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate('/orders')} className="w-full gap-2 justify-center py-2.5 text-sm">
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-text-secondary pt-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Secure Server</span>
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Fast Delivery</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
