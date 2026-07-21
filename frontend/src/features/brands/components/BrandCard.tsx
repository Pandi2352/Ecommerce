import { ExternalLink, Globe, MoreVertical, Edit2, Trash2, Star, Tag } from 'lucide-react';
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
    <div className="group flex flex-col justify-between overflow-hidden rounded-md border border-border bg-surface transition-all hover:border-slate-350 dark:hover:border-slate-700">
      <div>
        {/* Banner Hero Image */}
        <div className="relative h-28 w-full overflow-hidden bg-slate-900">
          {brand.banner ? (
            <img
              src={brand.banner}
              alt={`${brand.name} Banner`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 opacity-90" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top Header Actions & Featured Star */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            {brand.isFeatured ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
                <Star className="h-3 w-3 fill-white" />
                <span>Featured</span>
              </span>
            ) : (
              <span />
            )}

            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 rounded-full bg-black/40 p-0 text-white hover:bg-black/70 backdrop-blur-md"
                >
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
        </div>

        {/* Brand Logo & Basic Metadata Overlay */}
        <div className="-mt-7 px-4 flex items-end justify-between">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-surface bg-surface">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-1" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-500/10 text-xl font-bold text-indigo-500">
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <span className="rounded-full border border-border/80 bg-surface px-2.5 py-0.5 font-mono text-[11px] font-semibold text-text-secondary">
            {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Content Body */}
        <div className="px-4 pt-3 pb-2 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-text group-hover:text-indigo-500 transition-colors">
                {brand.name}
              </h4>
              <Badge tone={brand.isActive ? 'success' : 'neutral'} className="text-[10px] py-0">
                {brand.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-text-secondary">/{brand.slug}</p>
          </div>

          {/* SEO Meta Title Tag or Description */}
          {brand.metaTitle && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{brand.metaTitle}</span>
            </div>
          )}

          {brand.description && (
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {brand.description}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-border/50 px-4 py-2.5 text-xs bg-bg/30">
        <span className="text-[11px] text-text-secondary truncate max-w-[170px]">
          {brand.metaDescription || 'No SEO metadata'}
        </span>

        {brand.website && (
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-indigo-500 hover:underline shrink-0"
          >
            <Globe className="h-3 w-3" />
            <span>Website</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
