import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ShoppingBag,
  Zap,
  Star,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn, money, DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';
import { useCart } from '@/cart/CartContext';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';
import type { Product } from '@/lib/types';

const TABS = ['Description', 'Features', 'Shipping', 'Reviews'];

export function ProductDetailPage() {
  const { config } = useStorefrontConfig();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<Product>(`/storefront/products/${slug}`)
      .then((res) => active && setProduct(res.data))
      .catch((e) => active && setError(e?.message ?? 'Product not found'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  const options = product?.options ?? [];
  const hasVariants = options.length > 0;
  const allChosen = hasVariants && options.every((o) => selected[o.name]);

  const variant = useMemo(() => {
    if (!product || !allChosen) return undefined;
    return product.variants?.find((v) =>
      Object.entries(selected).every(([k, val]) => v.optionValues[k] === val),
    );
  }, [product, selected, allChosen]);

  const price = variant?.price ?? product?.price ?? 0;
  const compareAt = product?.compareAtPrice;
  const stock = hasVariants ? (variant?.stock ?? 0) : (product?.stock ?? 0);
  const image = variant?.image ?? product?.images?.[activeImage] ?? product?.images?.[0];
  const canAdd = product && (!hasVariants || !!variant) && stock > 0;
  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  function handleAdd() {
    if (!product || !canAdd) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image,
      variant: hasVariants ? selected : undefined,
      price,
    });
    setAddedToCart(true);
    toast.success(`Added to cart! 🎉`);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  if (loading) {
    return (
      <div className="grid gap-10 md:grid-cols-2 animate-fadeIn">
        <div className="space-y-4">
          <div className="aspect-square skeleton rounded-3xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 skeleton rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5 pt-4">
          <div className="h-8 w-3/4 skeleton rounded-xl" />
          <div className="h-6 w-1/3 skeleton rounded-xl" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
        <div className="text-7xl mb-6 animate-float">😕</div>
        <h2 className="text-2xl font-bold text-text mb-2">Product Not Found</h2>
        <p className="text-text-secondary mb-6">{error ?? 'This product does not exist.'}</p>
        <Link
          to="/"
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-bold flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const onSale = compareAt && compareAt > price;

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link to="/" className="hover:text-accent transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="text-text font-medium line-clamp-1">{product.name}</span>
      </div>

      {/* Main Content */}
      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-4 animate-fadeInLeft">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface-2 border border-border group">
            <img
              src={image || config?.defaultProductImageUrl || DEFAULT_PRODUCT_IMAGE}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Sale badge */}
            {onSale && (
              <div className="absolute top-4 left-4">
                <span className="badge-sale text-sm px-3 py-1">{discount}% OFF</span>
              </div>
            )}

            {/* Actions on image */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsWishlisted((v) => !v);
                  toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-md transition-all hover:scale-110"
              >
                <Heart
                  className="h-4.5 w-4.5"
                  style={{
                    color: isWishlisted ? '#ec4899' : '#6b6b8a',
                    fill: isWishlisted ? '#ec4899' : 'transparent',
                  }}
                />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-md text-text-secondary hover:scale-110 transition-all">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-xl border-2 transition-all duration-200 hover:scale-105',
                    i === activeImage ? 'border-accent shadow-lg' : 'border-border',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6 animate-fadeInRight">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.sku && (
                <span className="text-xs text-text-muted bg-surface-2 rounded-full px-3 py-1 border border-border">
                  SKU: {product.sku}
                </span>
              )}
            </div>
            <h1
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.2 }}
              className="text-3xl text-text mb-3"
            >
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-200 text-amber-200',
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-text-secondary">4.8 · 128 reviews</span>
              <span className="text-sm">
                <Eye className="inline h-3.5 w-3.5 text-text-muted mr-1" />
                <span className="text-text-muted">1.2k views</span>
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 py-4 border-y border-border">
            <span className="text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
              {onSale ? (
                <span className="gradient-text">{money(price)}</span>
              ) : (
                <span className="text-text">{money(price)}</span>
              )}
            </span>
            {onSale && (
              <>
                <span className="text-lg text-text-muted line-through">{money(compareAt!)}</span>
                <span className="badge-sale text-sm px-3 py-1">Save {discount}%</span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && <p className="prose-sm">{product.description}</p>}

          {/* Variant selectors */}
          {options.map((opt) => (
            <div key={opt.name} className="space-y-3">
              <span className="text-sm font-semibold text-text">{opt.name}</span>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => (
                  <button
                    key={val}
                    onClick={() => setSelected((s) => ({ ...s, [opt.name]: val }))}
                    className={cn(
                      'rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-200',
                      selected[opt.name] === val
                        ? 'text-white shadow-lg scale-105'
                        : 'border-border text-text hover:border-accent/50',
                    )}
                    style={
                      selected[opt.name] === val
                        ? {
                            background: 'var(--gradient-brand)',
                            border: 'none',
                            boxShadow: 'var(--shadow-glow)',
                          }
                        : {}
                    }
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm">
            {hasVariants && !allChosen ? (
              <span className="text-text-muted italic">← Select options to check availability</span>
            ) : stock > 0 ? (
              <>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-emerald font-semibold">
                  In stock{stock <= 5 ? ` — only ${stock} left!` : ''}
                </span>
              </>
            ) : (
              <>
                <div className="h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="text-danger font-semibold">Out of stock</span>
              </>
            )}
          </div>

          {/* Quantity + CTA */}
          <div className="space-y-3 pt-2">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text">Qty:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="qty-btn">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-base font-bold text-text">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
                  className="qty-btn"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className="btn-primary flex-1 rounded-xl px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4" /> Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" /> Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (!canAdd) return;
                  handleAdd();
                  navigate('/cart');
                }}
                disabled={!canAdd}
                className="flex-1 rounded-xl px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all border-2 border-accent text-accent hover:bg-accent/5"
              >
                <Zap className="h-4 w-4" /> Buy Now
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Over $50' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '30 days' },
              { icon: Shield, label: 'Secure Pay', sub: 'Encrypted' },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-center"
                style={{ background: 'var(--surface-2)' }}
              >
                <Icon className="h-4.5 w-4.5 text-accent" />
                <p className="text-xs font-semibold text-text">{label}</p>
                <p className="text-xs text-text-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex gap-1 rounded-2xl bg-surface-2 p-1 border border-border w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className="rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200"
              style={
                activeTab === i
                  ? {
                      background: 'var(--gradient-brand)',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          className="rounded-2xl border border-border bg-surface p-6 min-h-32 animate-fadeIn"
          key={activeTab}
        >
          {activeTab === 0 && (
            <p className="prose-sm">
              {product.description || 'No description available for this product.'}
            </p>
          )}
          {activeTab === 1 && (
            <ul className="space-y-2">
              {[
                'Premium quality materials',
                'Durable and long-lasting',
                'Eco-friendly packaging',
                '1-year warranty included',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                  <Check className="h-4 w-4 text-emerald shrink-0" /> {f}
                </li>
              ))}
            </ul>
          )}
          {activeTab === 2 && (
            <div className="space-y-3 text-sm text-text-secondary">
              <p>
                <strong className="text-text">Standard Shipping:</strong> 5–7 business days · Free
                over $50
              </p>
              <p>
                <strong className="text-text">Express Shipping:</strong> 2–3 business days · $9.99
              </p>
              <p>
                <strong className="text-text">Overnight:</strong> Next business day · $19.99
              </p>
            </div>
          )}
          {activeTab === 3 && (
            <div className="space-y-4">
              {[5, 4, 5].map((stars, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet to-pink flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: stars }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-text-secondary">
                      Great product! Exactly as described. Fast shipping!
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
