import { useNavigate } from 'react-router-dom';

import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { Button, Drawer } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';
import { useCart } from '../CartContext';

export function CartDrawer() {
  const navigate = useNavigate();
  const { cart, drawerOpen, setDrawerOpen, updateItemQty, removeItem } = useCart();

  const activeItems = (cart?.items || []).filter((i) => !i.isSavedForLater);

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate('/cart');
  };

  return (
    <Drawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-indigo-500" />
          <span>Shopping Cart ({activeItems.length})</span>
        </div>
      }
      widthClassName="w-full max-w-md"
      footer={
        activeItems.length > 0 ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium">Subtotal:</span>
              <span className="font-bold text-text text-base">
                {formatCurrency(cart?.totals.subtotal || 0)}
              </span>
            </div>
            <Button onClick={handleCheckout} className="w-full justify-between gap-2">
              <span>View Cart & Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null
      }
    >
      {activeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500/10 text-indigo-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-text">Your cart is empty</h4>
          <p className="text-xs text-text-secondary max-w-xs">
            Explore products in the catalog and add items to your cart.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-slate-350 dark:hover:border-slate-700"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-12 w-12 rounded-md border border-border object-cover shrink-0"
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-bg text-text-secondary">
                  <Package className="h-5 w-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text truncate">{item.name}</p>
                <p className="font-mono text-[11px] text-indigo-500">{item.variantSku}</p>
                <p className="text-xs font-semibold text-text mt-1">{formatCurrency(item.price)}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-text-secondary hover:text-danger"
                  onClick={() => removeItem(item._id)}
                  title="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="flex items-center gap-1 rounded-md border border-border bg-bg p-0.5">
                  <button
                    type="button"
                    className="p-1 hover:text-indigo-500 disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    onClick={() => updateItemQty(item._id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-mono font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    className="p-1 hover:text-indigo-500"
                    onClick={() => updateItemQty(item._id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
