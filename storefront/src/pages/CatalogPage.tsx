import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { getList } from '@/lib/api';
import { money, DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';
import type { Meta, Product } from '@/lib/types';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';
import { BannerCarousel } from '@/components/BannerCarousel';
import { HotDealsSection } from '@/components/HotDealsSection';

export function CatalogPage() {
  const { config } = useStorefrontConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getList<Product>('/storefront/products', { params: { page, pageSize: 12 } })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setMeta(res.meta);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  const sections = config?.homepageSections ?? {};
  const showBanners = sections.showBanners !== false;
  const showDeals = sections.showDeals !== false;

  return (
    <div className="space-y-8 min-w-0">
      {/* 1. Hero banner slider */}
      {showBanners && <BannerCarousel banners={config?.banners} />}

      {/* 2. Hot deals with live timers */}
      {showDeals && <HotDealsSection products={products} />}

      {/* 3. Featured catalog grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="maxshop-ribbon text-xs font-black tracking-wider uppercase">
            Featured Catalog
            {meta && <span className="ml-2 font-normal">({meta.total} items)</span>}
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1 text-xs font-bold text-danger hover:underline"
          >
            View all products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] skeleton rounded-sm" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary border border-border rounded-sm">
            No products available yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((n) => n - 1)}
              className="px-3 py-1 text-xs border border-border rounded-xs bg-surface disabled:opacity-30 hover:border-danger"
            >
              Previous
            </button>
            <span className="text-xs font-semibold">
              Page {page} of {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((n) => n + 1)}
              className="px-3 py-1 text-xs border border-border rounded-xs bg-surface disabled:opacity-30 hover:border-danger"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { config } = useStorefrontConfig();
  const fallbackImg = config?.defaultProductImageUrl || DEFAULT_PRODUCT_IMAGE;
  const img = product.images?.[0] || fallbackImg;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="product-card group relative flex flex-col justify-between rounded-sm p-3">
      {onSale && (
        <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-xs">
          SALE
        </span>
      )}
      <Link
        to={`/products/${product.slug}`}
        className="aspect-square overflow-hidden bg-surface-2 mb-2 block"
      >
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="text-center space-y-1">
        <div className="flex justify-center text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400" />
          ))}
        </div>
        <Link
          to={`/products/${product.slug}`}
          className="text-xs font-semibold text-text line-clamp-1 hover:text-danger"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-center gap-1.5 text-xs">
          {onSale && (
            <span className="text-text-muted line-through text-[11px]">
              {money(product.compareAtPrice!)}
            </span>
          )}
          <span className="font-bold text-danger">{money(product.price)}</span>
        </div>
      </div>
    </div>
  );
}
