import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from './CatalogPage';

interface CollectionResponse {
  collection: { id: string; name: string; slug: string; description?: string; image?: string };
  products: Product[];
}

export function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api
      .get<CollectionResponse>(`/storefront/collections/${slug}`)
      .then((res) => active && setData(res.data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] skeleton rounded-sm" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface p-10 text-center text-sm text-text-secondary">
          Collection not found.
        </div>
        <Link to="/collections" className="inline-flex items-center gap-1 text-sm text-danger">
          <ChevronLeft className="h-4 w-4" /> All collections
        </Link>
      </div>
    );
  }

  const { collection, products } = data;

  return (
    <div className="space-y-6">
      <Link
        to="/collections"
        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-danger"
      >
        <ChevronLeft className="h-4 w-4" /> All collections
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-md border border-border">
        <div
          className="relative bg-maxshop-dark px-6 py-10 text-white"
          style={{ background: 'var(--gradient-hero)' }}
        >
          {collection.image && (
            <img
              src={collection.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="relative">
            <h1
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-2 max-w-2xl text-sm text-white/80">{collection.description}</p>
            )}
            <p className="mt-2 text-xs font-semibold text-white/60">{products.length} product(s)</p>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-10 text-center text-sm text-text-secondary">
          No products in this collection yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
