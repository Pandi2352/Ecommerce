import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Grid3x3, LayoutList } from 'lucide-react';
import { getList } from '@/lib/api';
import { money, DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';
import type { Meta, Product } from '@/lib/types';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';
import { useCategories } from '@/app/CategoryContext';
import { BannerCarousel } from '@/components/BannerCarousel';
import { LeftSidebar } from '@/components/LeftSidebar';
import { HotDealsSection } from '@/components/HotDealsSection';
import { CategorySectionBlock } from '@/components/CategorySectionBlock';

export function CatalogPage() {
  const { config } = useStorefrontConfig();
  const { categories, selectedCategory } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch catalog products (filtered by category if selected)
  useEffect(() => {
    let active = true;
    setLoading(true);
    getList<Product>('/storefront/products', {
      params: {
        page,
        pageSize: 12,
        search: term || undefined,
        category: selectedCategory || undefined,
      },
    })
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
  }, [page, term, selectedCategory]);

  // Top 2 dynamic categories for showcase blocks
  const firstCategory = categories[0]?.name || 'FEATURED COLLECTION';
  const secondCategory = categories[1]?.name || 'SPECIAL SELECTION';

  // Homepage section visibility is controlled by the admin "Storefront
  // Customization → Sections" tab. Undefined = show (opt-out, not opt-in).
  const sections = config?.homepageSections ?? {};
  const showBanners = sections.showBanners !== false;
  const showDeals = sections.showDeals !== false;
  const showCategories = sections.showCategories !== false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 sm:gap-5 items-start">
      {/* ── LEFT COLUMN: SIDEBAR ───────────────────────────────────────────── */}
      <LeftSidebar />

      {/* ── RIGHT COLUMN: MAIN CONTENT & PRODUCTS ─────────────────────────── */}
      <div className="space-y-8 min-w-0">
        {/* 1. Main Hero Banner Slider */}
        {showBanners && <BannerCarousel banners={config?.banners} />}

        {/* 2. Hot Deals Section with Live Timers */}
        {showDeals && <HotDealsSection products={products} />}

        {/* 3. Dynamic Category Block 1 */}
        {showCategories && (
          <CategorySectionBlock
            title={firstCategory.toUpperCase()}
            subTabs={['All', 'New Arrivals', 'Best Value', 'Top Rated']}
            bannerText="NEW ARRIVALS - SPECIAL OFFER"
            bannerSubtext="Curabitur luctus ipsum eget convallis"
            bannerDiscount="50% OFF"
            bannerImage="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300"
            bannerBg="linear-gradient(135deg, #f97316 0%, #e62e04 100%)"
            products={products}
          />
        )}

        {/* 4. Dynamic Category Block 2 */}
        {showCategories && (
          <CategorySectionBlock
            title={secondCategory.toUpperCase()}
            subTabs={['All', 'Featured', 'Popular', 'Discounted']}
            bannerText="END OF SEASON DISCOUNTS"
            bannerSubtext="Limited time offers on selected store items"
            bannerDiscount="50% OFF"
            bannerImage="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
            bannerBg="linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
            products={products}
          />
        )}

        {/* 5. Main Catalog Product Grid */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="maxshop-ribbon text-xs font-black tracking-wider uppercase">
              {selectedCategory
                ? `CATEGORY: ${selectedCategory.toUpperCase()}`
                : 'FEATURED CATALOG'}
              {meta && <span className="ml-2 font-normal">({meta.total} items)</span>}
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter catalog…"
                  className="nova-input w-40 pl-8 text-xs py-1.5"
                />
              </div>
              {/* View mode toggle */}
              <div className="flex border border-border rounded-xs overflow-hidden">
                {(
                  [
                    ['grid', Grid3x3],
                    ['list', LayoutList],
                  ] as const
                ).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="h-7 w-7 flex items-center justify-center transition-colors"
                    style={
                      viewMode === mode
                        ? { background: '#e62e04', color: 'white' }
                        : { color: '#666666' }
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid View */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] skeleton rounded-sm" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-secondary border border-border rounded-sm">
              No products found matching your selected category or search.
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-4 gap-4' : 'space-y-3'
              }
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
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
    </div>
  );
}

function ProductCard({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  const { config } = useStorefrontConfig();
  const fallbackImg = config?.defaultProductImageUrl || DEFAULT_PRODUCT_IMAGE;
  const img = product.images?.[0] || fallbackImg;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  if (viewMode === 'list') {
    return (
      <Link
        to={`/products/${product.slug}`}
        className="product-card flex gap-4 p-3 rounded-sm items-center hover:border-danger transition-colors"
      >
        <div className="h-20 w-20 shrink-0 bg-surface-2 overflow-hidden border border-border">
          <img src={img} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-text truncate hover:text-danger">
            {product.name}
          </h4>
          <div className="flex items-center text-amber-400 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-amber-400" />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-danger">{money(product.price)}</span>
          {onSale && (
            <span className="block text-[11px] text-text-muted line-through">
              {money(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </Link>
    );
  }

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
