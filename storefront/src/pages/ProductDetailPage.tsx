import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn, money } from '@/lib/utils';
import { useCart } from '@/cart/CartContext';
import type { Product } from '@/lib/types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);

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

  // Resolve the variant matching the current selection.
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
    toast.success('Added to cart');
  }

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-md bg-surface" />
        <div className="space-y-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-surface" />
          <div className="h-5 w-1/4 animate-pulse rounded bg-surface" />
          <div className="h-24 w-full animate-pulse rounded bg-surface" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface p-12 text-center text-sm text-text-secondary">
          {error ?? 'Product not found.'}
        </div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-info">
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    );
  }

  const onSale = compareAt && compareAt > price;

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text"
      >
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-md border border-border bg-surface">
            {image ? (
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-text-secondary">No image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-md border bg-surface',
                    i === activeImage ? 'border-info' : 'border-border',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold text-text">{product.name}</h1>
            {product.sku && <p className="mt-1 text-xs text-text-secondary">SKU: {product.sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-text">{money(price)}</span>
            {onSale && (
              <span className="text-sm text-text-secondary line-through">{money(compareAt!)}</span>
            )}
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {product.description}
            </p>
          )}

          {/* Variant option selectors */}
          {options.map((opt) => (
            <div key={opt.name} className="space-y-2">
              <span className="text-sm font-medium text-text">{opt.name}</span>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => (
                  <button
                    key={val}
                    onClick={() => setSelected((s) => ({ ...s, [opt.name]: val }))}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm',
                      selected[opt.name] === val
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-border bg-surface text-text hover:border-info',
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Stock / status hint */}
          <div className="text-sm">
            {hasVariants && !allChosen ? (
              <span className="text-text-secondary">Select options to see availability.</span>
            ) : stock > 0 ? (
              <span className="text-success">
                In stock{stock <= 5 ? ` — only ${stock} left` : ''}
              </span>
            ) : (
              <span className="text-danger">Out of stock</span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-40"
            >
              Add to cart
            </button>
            <button
              onClick={() => {
                if (!canAdd) return;
                handleAdd();
                navigate('/cart');
              }}
              disabled={!canAdd}
              className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text hover:bg-bg disabled:opacity-40"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
