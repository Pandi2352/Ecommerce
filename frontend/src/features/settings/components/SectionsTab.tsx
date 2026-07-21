import { Card, Checkbox } from '@/components/ui';
import type { HomepageSections } from '../storefront-settings.api';

interface Props {
  sections: HomepageSections;
  onChange: (sections: HomepageSections) => void;
  disabled?: boolean;
}

export function SectionsTab({ sections, onChange, disabled }: Props) {
  const toggle = (key: keyof HomepageSections) => {
    onChange({
      ...sections,
      [key]: !sections[key],
    });
  };

  const SECTIONS_LIST: { key: keyof HomepageSections; label: string; desc: string }[] = [
    {
      key: 'showBanners',
      label: 'Hero Banners Carousel',
      desc: 'Display the full-width image slider at the top of the homepage.',
    },
    {
      key: 'showFeatured',
      label: 'Featured Products Grid',
      desc: 'Display highlighted product catalog grid.',
    },
    {
      key: 'showBestSellers',
      label: 'Hot Deals & Best Sellers Strip',
      desc: 'Display sale badges and best seller product callouts.',
    },
    {
      key: 'showDeals',
      label: 'Top Announcement Banner',
      desc: 'Display the sticky notification strip at the very top of the page.',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text">Homepage Layout & Section Visibility</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Toggle which sections appear on your storefront homepage.
        </p>

        <div className="mt-4 space-y-3">
          {SECTIONS_LIST.map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-start gap-3 rounded-lg border border-border p-3.5 hover:bg-bg cursor-pointer transition-colors"
            >
              <Checkbox
                checked={sections[key] ?? true}
                onChange={() => toggle(key)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-text">{label}</span>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
