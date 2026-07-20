import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getList } from '@/lib/api';
import { money } from '@/lib/utils';
import type { Meta, Product } from '@/lib/types';

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getList<Product>('/storefront/products', {
      params: { page, pageSize: 12, search: term || undefined },
    })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setMeta(res.meta);
      })
      .catch((e) => active && setError(e?.message ?? 'Failed to load products'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, term]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Shop</h1>
          <p className="text-sm text-text-secondary">Browse the latest from NovaShop.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-info"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="aspect-square animate-pulse bg-bg" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-bg" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12 text-center text-sm text-text-secondary">
          No products found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((n) => n - 1)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((n) => n + 1)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-info"
    >
      <div className="aspect-square overflow-hidden bg-bg">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-text-secondary">No image</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-text">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-text">{money(product.price)}</span>
          {onSale && (
            <span className="text-xs text-text-secondary line-through">
              {money(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
