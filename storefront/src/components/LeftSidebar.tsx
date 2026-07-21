import { useState } from 'react';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { money } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useCategories } from '@/app/CategoryContext';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'MOBILE & TABLET', slug: 'mobile-tablet' },
  { id: '2', name: 'COMPUTER & ACCESSORIES', slug: 'computer-accessories' },
  { id: '3', name: 'ELECTRONIC & CAMERA', slug: 'electronic-camera' },
  { id: '4', name: 'FASHION & ACCESSORIES', slug: 'fashion-accessories' },
  { id: '5', name: 'HOME & KITCHEN', slug: 'home-kitchen' },
  { id: '6', name: 'BEAUTY & HEALTH', slug: 'beauty-health' },
  { id: '7', name: 'SPORTS & FITNESS', slug: 'sports-fitness' },
];

const BEST_SELLERS = [
  {
    id: '1',
    name: 'Josen maset gasten',
    originalPrice: 990,
    price: 900,
    rating: 4,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150',
  },
  {
    id: '2',
    name: 'Huma saren mazem',
    originalPrice: 0,
    price: 125,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150',
  },
  {
    id: '3',
    name: 'Esami tera sima',
    originalPrice: 89,
    price: 80,
    rating: 4,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150',
  },
  {
    id: '4',
    name: 'Molaz tren open zase',
    originalPrice: 0,
    price: 125,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150',
  },
];

const FAQS = [
  {
    q: 'Pellentesque vitae impendiet in?',
    a: 'Donec tempor, odio sed hendrerit placerat, urna sodales eros, vitae porttitor tortor erat non tellus. Aenean non finibus turpis.',
  },
  {
    q: 'Hendrerit eu nunc massa?',
    a: 'Aenean sollicitudin lorem quis bibendum auctor nisi elit consequat ipsum.',
  },
  {
    q: 'Suspendisse feugiat cursus?',
    a: 'Fusce imperdiet ligula sit amet arcu tincidunt viverra.',
  },
  {
    q: 'Finibus ullamcorper eleifend?',
    a: 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.',
  },
];

export function LeftSidebar() {
  const { categories, selectedCategory, setSelectedCategory } = useCategories();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [bestSellerPage, setBestSellerPage] = useState(0);

  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <aside className="space-y-6 w-full">
      {/* ── 1. Vertical Categories Box ────────────────────────────── */}
      <div className="border border-border bg-surface rounded-sm overflow-hidden">
        <div className="maxshop-ribbon w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">☰</span>
            <span>CATEGORIES</span>
          </div>
        </div>
        <ul className="divide-y divide-border text-xs font-semibold text-text-secondary">
          {selectedCategory && (
            <li
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-2 text-danger font-bold cursor-pointer hover:bg-surface-2 flex items-center justify-between"
            >
              <span>← All Categories</span>
              <span className="text-[10px] bg-danger text-white px-1.5 py-0.5 rounded-xs">
                Reset
              </span>
            </li>
          )}
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
            return (
              <li
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id || cat.slug)}
                className={`group flex items-center justify-between px-3 py-2.5 hover:bg-surface-2 hover:text-danger cursor-pointer transition-colors ${
                  isSelected ? 'bg-danger/10 text-danger font-bold' : ''
                }`}
              >
                <span className="uppercase">{cat.name}</span>
                <ChevronRight
                  className={`h-3 w-3 ${isSelected ? 'text-danger' : 'text-text-muted group-hover:text-danger'}`}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── 2. Best Sellers Box ──────────────────────────────────── */}
      <div className="border border-border bg-surface rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-danger bg-surface">
          <div className="maxshop-ribbon -ml-3 py-1 px-3 text-xs">BEST SELLERS</div>
          <div className="flex items-center gap-1 text-text-muted">
            <button
              onClick={() => setBestSellerPage((p) => Math.max(0, p - 1))}
              className="p-1 hover:text-danger disabled:opacity-30"
              disabled={bestSellerPage === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setBestSellerPage((p) => p + 1)}
              className="p-1 hover:text-danger disabled:opacity-30"
              disabled={bestSellerPage >= 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-border p-2">
          {BEST_SELLERS.map((item) => (
            <Link
              key={item.id}
              to={`/products`}
              className="flex items-center gap-3 p-2 hover:bg-surface-2 group transition-colors"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden border border-border rounded-sm bg-bg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${i < item.rating ? 'fill-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <h4 className="text-xs font-semibold text-text truncate group-hover:text-danger">
                  {item.name}
                </h4>
                <div className="flex items-baseline gap-1.5 text-xs">
                  {item.originalPrice > 0 && (
                    <span className="text-text-muted line-through text-[11px]">
                      {money(item.originalPrice)}
                    </span>
                  )}
                  <span className="font-bold text-danger">{money(item.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 3. Latest Post Blog Box ──────────────────────────────── */}
      <div className="border border-border bg-surface rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-danger bg-surface">
          <div className="maxshop-ribbon -ml-3 py-1 px-3 text-xs">LATEST POST</div>
          <div className="flex items-center gap-1 text-text-muted">
            <ChevronLeft className="h-3.5 w-3.5 cursor-pointer hover:text-danger" />
            <ChevronRight className="h-3.5 w-3.5 cursor-pointer hover:text-danger" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="aspect-[16/10] overflow-hidden rounded-sm bg-bg">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
              alt="Latest Post"
              className="h-full w-full object-cover"
            />
          </div>
          <h4 className="text-xs font-bold text-text hover:text-danger cursor-pointer">
            Special Store Updates
          </h4>
          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
            Explore our new arrivals and special promotional offers across all store collections.
          </p>
        </div>
      </div>

      {/* ── 4. FAQs Accordion Box ────────────────────────────────── */}
      <div className="border border-border bg-surface rounded-sm overflow-hidden">
        <div className="maxshop-ribbon w-full py-2 px-3 text-xs">FAQS</div>
        <div className="divide-y divide-border text-xs">
          {FAQS.map((faq, i) => (
            <div key={i} className="p-2.5">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-2 text-left font-semibold text-text hover:text-danger"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-danger font-bold">{openFaqIndex === i ? '−' : '+'}</span>
                  {faq.q}
                </span>
              </button>
              {openFaqIndex === i && (
                <p className="mt-2 text-[11px] text-text-secondary leading-relaxed pl-3 border-l-2 border-danger">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
