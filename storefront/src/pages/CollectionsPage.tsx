import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { api } from '@/lib/api';

interface StoreCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<StoreCollection[]>('/storefront/collections')
      .then((res) => setCollections(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="maxshop-ribbon text-xs font-black uppercase tracking-wider">Collections</div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[16/9] skeleton rounded-md" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-10 text-center text-sm text-text-secondary">
          No collections available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              to={`/collections/${c.slug}`}
              className="group relative overflow-hidden rounded-md border border-border bg-surface"
            >
              <div className="aspect-[16/9] overflow-hidden bg-surface-2">
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-text-muted">
                    <Layers className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-text group-hover:text-danger">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{c.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
