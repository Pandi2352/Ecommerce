import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Grid3x3, LayoutList, LayoutGrid, Star, X } from 'lucide-react';
import { api, getList } from '@/lib/api';
import { money } from '@/lib/utils';
import type { Facets, Meta, Product } from '@/lib/types';
import { useCategories, type Category } from '@/app/CategoryContext';
import { ProductCard } from './CatalogPage';

/** Collect a category id + all descendant ids (products live on leaves). */
function collectIds(node: Category): string[] {
  const ids = [node.id];
  for (const c of node.children ?? []) ids.push(...collectIds(c));
  return ids;
}
function findNode(list: Category[], id: string): Category | null {
  for (const c of list) {
    if (c.id === id) return c;
    const f = findNode(c.children ?? [], id);
    if (f) return f;
  }
  return null;
}

const SORTS = [
  { value: '', label: 'Featured' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'name:asc', label: 'Name: A–Z' },
];

export function AllProductsPage() {
  const { categories, selectedCategory, setSelectedCategory } = useCategories();
  const [params] = useSearchParams();
  const search = params.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ── Filter state ──
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set());
  const [attrSel, setAttrSel] = useState<Record<string, Set<string>>>({});
  const [onSale, setOnSale] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('');

  const categoryParam = useMemo(() => {
    if (!selectedCategory) return undefined;
    const node = findNode(categories, selectedCategory);
    return node ? collectIds(node).join(',') : selectedCategory;
  }, [selectedCategory, categories]);

  // Facets follow the current category scope.
  useEffect(() => {
    api
      .get<Facets>('/storefront/facets', { params: { category: categoryParam } })
      .then((res) => setFacets(res.data))
      .catch(() => setFacets(null));
  }, [categoryParam]);

  // A stable key of every active filter (drives page reset + refetch).
  const attrKey = JSON.stringify(
    Object.fromEntries(Object.entries(attrSel).map(([k, v]) => [k, [...v].sort()])),
  );
  const brandKey = [...brandSel].sort().join(',');
  const filterKey = `${categoryParam}|${search}|${sort}|${minPrice}|${maxPrice}|${brandKey}|${attrKey}|${onSale}|${inStock}`;

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [filterKey]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize: 12 };
      if (categoryParam) params.category = categoryParam;
      if (search) params.search = search;
      if (sort) params.sort = sort;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (brandSel.size) params.brand = [...brandSel].join(',');
      if (onSale) params.onSale = 'true';
      if (inStock) params.inStock = 'true';
      for (const [k, set] of Object.entries(attrSel))
        if (set.size) params[`attr_${k}`] = [...set].join(',');

      getList<Product>('/storefront/products', { params })
        .then((res) => {
          if (!active) return;
          setProducts(res.data);
          setMeta(res.meta);
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [page, filterKey]);

  const toggle = (id: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleBrand = (id: string) =>
    setBrandSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleAttr = (key: string, val: string) =>
    setAttrSel((p) => {
      const cur = new Set(p[key] ?? []);
      if (cur.has(val)) cur.delete(val);
      else cur.add(val);
      return { ...p, [key]: cur };
    });

  const clearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setBrandSel(new Set());
    setAttrSel({});
    setOnSale(false);
    setInStock(false);
    setSelectedCategory(null);
  };

  const activeCount =
    brandSel.size +
    Object.values(attrSel).reduce((n, s) => n + s.size, 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (onSale ? 1 : 0) +
    (inStock ? 1 : 0) +
    (selectedCategory ? 1 : 0);

  const activeName = selectedCategory ? findNode(categories, selectedCategory)?.name : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
      {/* ── Filter rail ─────────────────────────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-4">
        {/* Categories */}
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <div className="bg-maxshop-dark px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white">
            Categories
          </div>
          <nav className="max-h-[40vh] overflow-y-auto py-1">
            <CategoryRow
              label="All Products"
              active={!selectedCategory}
              depth={0}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryTree
                key={cat.id}
                node={cat}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            ))}
          </nav>
        </div>

        {/* Active filters / clear */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10"
          >
            <X className="h-3.5 w-3.5" /> Clear all filters ({activeCount})
          </button>
        )}

        {/* Price */}
        <FilterCard title="Price">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={facets ? String(facets.priceRange.min) : 'Min'}
              className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-danger"
            />
            <span className="text-text-muted">–</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={facets ? String(facets.priceRange.max) : 'Max'}
              className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-danger"
            />
          </div>
        </FilterCard>

        {/* Availability / offers */}
        <FilterCard title="Availability">
          <CheckRow
            label="In stock only"
            checked={inStock}
            onChange={() => setInStock((v) => !v)}
          />
          <CheckRow label="On sale" checked={onSale} onChange={() => setOnSale((v) => !v)} />
        </FilterCard>

        {/* Brands */}
        {facets && facets.brands.length > 0 && (
          <FacetCard title="Brand">
            {facets.brands.map((b) => (
              <CheckRow
                key={b.id}
                label={`${b.name} (${b.count})`}
                checked={brandSel.has(b.id)}
                onChange={() => toggleBrand(b.id)}
              />
            ))}
          </FacetCard>
        )}

        {/* Admin-configured attribute facets */}
        {facets?.attributes.map((a) => (
          <FacetCard key={a.key} title={a.label}>
            {a.values.map((v) => (
              <CheckRow
                key={v}
                label={a.unit ? `${v} ${a.unit}` : v}
                checked={attrSel[a.key]?.has(v) ?? false}
                onChange={() => toggleAttr(a.key, v)}
              />
            ))}
          </FacetCard>
        ))}
      </aside>

      {/* ── Products ────────────────────────────────────────────── */}
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1
              className="text-lg font-black text-text"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {search ? `Search: "${search}"` : activeName || 'All Products'}
            </h1>
            {meta && <p className="text-xs text-text-secondary">{meta.total} products</p>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-danger"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] skeleton rounded-sm" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-secondary border border-border rounded-sm flex flex-col items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-text-muted" />
            No products match these filters.
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-danger font-semibold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <ProductListRow key={p.id} product={p} />
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

/** A plain titled filter panel. */
function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-text">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/** A facet panel whose long value lists collapse to a "show more" toggle. */
function FacetCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(children) ? children : [children];
  const LIMIT = 6;
  const shown = open ? items : items.slice(0, LIMIT);
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-text">{title}</h3>
      <div className="space-y-1.5">{shown}</div>
      {items.length > LIMIT && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-[11px] font-semibold text-danger hover:underline"
        >
          {open ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-text hover:text-danger">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[var(--danger)]"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

function CategoryTree({
  node,
  depth,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  node: Category;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = expanded.has(node.id);
  return (
    <div>
      <CategoryRow
        label={node.name}
        active={selected === node.id}
        depth={depth}
        hasChildren={hasChildren}
        isOpen={isOpen}
        onToggle={hasChildren ? () => onToggle(node.id) : undefined}
        onClick={() => onSelect(node.id)}
      />
      {hasChildren &&
        isOpen &&
        node.children!.map((c) => (
          <CategoryTree
            key={c.id}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function CategoryRow({
  label,
  active,
  depth,
  hasChildren,
  isOpen,
  onToggle,
  onClick,
}: {
  label: string;
  active: boolean;
  depth: number;
  hasChildren?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 pr-2 text-xs transition-colors ${
        active ? 'bg-danger/10 text-danger font-bold' : 'text-text hover:bg-surface-2'
      }`}
      style={{ paddingLeft: depth * 14 + 8 }}
    >
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="flex h-6 w-5 items-center justify-center text-text-muted hover:text-danger"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <span className="inline-block h-6 w-5" />
      )}
      <button onClick={onClick} className="flex-1 py-1.5 text-left truncate">
        {label}
      </button>
    </div>
  );
}

function ProductListRow({ product }: { product: Product }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const img = product.images?.[0];
  return (
    <Link
      to={`/products/${product.slug}`}
      className="product-card flex gap-4 p-3 rounded-sm items-center hover:border-danger transition-colors"
    >
      <div className="h-20 w-20 shrink-0 bg-surface-2 overflow-hidden border border-border">
        {img && <img src={img} alt={product.name} className="h-full w-full object-cover" />}
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
