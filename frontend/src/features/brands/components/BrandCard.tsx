import { ExternalLink, Globe, MoreVertical, Edit2, Trash2, Star } from 'lucide-react';
import { Badge, Button, Dropdown } from '@/components/ui';
import type { BrandItem } from '../types';

interface BrandCardProps {
  brand: BrandItem;
  onEdit: (brand: BrandItem) => void;
  onDelete: (brand: BrandItem) => void;
  onToggleFeatured: (brand: BrandItem) => void;
}

export function BrandCard({ brand, onEdit, onDelete, onToggleFeatured }: BrandCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-all hover:border-slate-350 dark:hover:border-slate-700">
      <div>
        {/* Header with Logo & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-12 w-12 rounded-lg border border-border object-contain p-1 bg-white dark:bg-slate-900"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-lg font-bold text-indigo-500 border border-indigo-500/20">
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-text">{brand.name}</h4>
                {brand.isFeatured && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/10 text-amber-500" title="Featured Brand">
                    <Star className="h-3 w-3 fill-amber-500" />
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-text-secondary">/{brand.slug}</p>
            </div>
          </div>

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5" />
                    <span>{brand.isFeatured ? 'Unmark Featured' : 'Mark Featured'}</span>
                  </span>
                ),
                onSelect: () => onToggleFeatured(brand),
              },
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Brand</span>
                  </span>
                ),
                onSelect: () => onEdit(brand),
              },
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                    <span>Delete Brand</span>
                  </span>
                ),
                danger: true,
                onSelect: () => onDelete(brand),
              },
            ]}
          />
        </div>

        {/* Description */}
        {brand.description && (
          <p className="mt-3 text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {brand.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge tone={brand.isActive ? 'success' : 'neutral'}>
            {brand.isActive ? 'Active' : 'Inactive'}
          </Badge>

          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 hover:underline"
            >
              <Globe className="h-3 w-3" />
              <span>Site</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        <span className="font-mono text-[11px] font-semibold text-text-secondary">
          {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
        </span>
      </div>
    </div>
  );
}
