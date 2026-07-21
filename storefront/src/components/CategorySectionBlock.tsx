import { useState } from 'react';
import { Star } from 'lucide-react';
import { money, DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { Product } from '@/lib/types';

interface Props {
  title: string;
  subTabs: string[];
  bannerText: string;
  bannerSubtext: string;
  bannerDiscount: string;
  bannerImage: string;
  bannerBg: string;
  products?: Product[];
}

const SAMPLE_PRODUCTS = [
  {
    id: 'c1',
    name: 'Josen maset gasten',
    price: 900,
    compareAtPrice: 990,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
  },
  {
    id: 'c2',
    name: 'Erat vel pharetra luctu',
    price: 850,
    compareAtPrice: 960,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  },
  {
    id: 'c3',
    name: 'Tortor efficitur nibh',
    price: 500,
    compareAtPrice: 580,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300',
  },
  {
    id: 'c4',
    name: 'Nurem masem mire',
    price: 560,
    compareAtPrice: 0,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300',
  },
];

export function CategorySectionBlock({
  title,
  subTabs,
  bannerText,
  bannerSubtext,
  bannerDiscount,
  bannerImage,
  bannerBg,
}: Props) {
  const [activeTab, setActiveTab] = useState(subTabs[0] || '');

  return (
    <div className="space-y-4">
      {/* Category Header Bar */}
      <div className="border-b-2 border-danger flex flex-wrap items-center justify-between gap-2">
        <div className="maxshop-ribbon text-xs font-black tracking-wider uppercase">{title}</div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-text-secondary pb-1">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`hover:text-danger transition-colors ${activeTab === tab ? 'text-danger font-bold underline' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Promo Banner Strip */}
      <div
        className="relative overflow-hidden rounded-sm p-4 text-white flex items-center justify-between"
        style={{ background: bannerBg }}
      >
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-xs">
            PROMO OFFER
          </span>
          <h3 className="text-xl font-black tracking-tight uppercase">{bannerText}</h3>
          <p className="text-xs opacity-80">{bannerSubtext}</p>
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="text-right">
            <span className="text-3xl font-black text-amber-300">{bannerDiscount}</span>
            <span className="text-[10px] block font-bold tracking-widest uppercase">
              ON ALL PRODUCTS
            </span>
          </div>
          <div className="h-16 w-24 overflow-hidden rounded-sm bg-white/10 hidden sm:block">
            <img src={bannerImage} alt={bannerText} className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SAMPLE_PRODUCTS.map((item) => (
          <div
            key={item.id}
            className="product-card group relative flex flex-col justify-between rounded-sm p-3"
          >
            {/* SALE Badge */}
            {item.compareAtPrice > 0 && (
              <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-xs">
                SALE
              </span>
            )}

            {/* Product Image */}
            <Link
              to={`/products`}
              className="aspect-square overflow-hidden bg-surface-2 mb-2 block"
            >
              <img
                src={item.image || DEFAULT_PRODUCT_IMAGE}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Info */}
            <div className="text-center space-y-1">
              <div className="flex justify-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400" />
                ))}
              </div>

              <Link
                to={`/products`}
                className="text-xs font-semibold text-text line-clamp-1 hover:text-danger"
              >
                {item.name}
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-xs">
                {item.compareAtPrice > 0 && (
                  <span className="text-text-muted line-through text-[11px]">
                    {money(item.compareAtPrice)}
                  </span>
                )}
                <span className="font-bold text-danger">{money(item.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
