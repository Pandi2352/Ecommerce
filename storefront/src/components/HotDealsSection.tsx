import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { money } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { Product } from '@/lib/types';

interface Countdown {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

const SAMPLE_DEALS = [
  {
    id: 'deal-1',
    name: 'Pozam suma kire',
    slug: 'pozam-suma-kire',
    price: 1000,
    compareAtPrice: 1500,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300',
    days: 269,
    hours: 13,
    mins: 46,
    secs: 15,
  },
  {
    id: 'deal-2',
    name: 'Josen maset gasten',
    slug: 'josen-maset-gasten',
    price: 900,
    compareAtPrice: 990,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
    days: 425,
    hours: 13,
    mins: 46,
    secs: 15,
  },
  {
    id: 'deal-3',
    name: 'Erat vel pharetra luctu',
    slug: 'erat-vel-pharetra',
    price: 850,
    compareAtPrice: 960,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    days: 303,
    hours: 13,
    mins: 46,
    secs: 15,
  },
  {
    id: 'deal-4',
    name: 'Tortor efficitur nibh',
    slug: 'tortor-efficitur',
    price: 500,
    compareAtPrice: 583,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300',
    days: 176,
    hours: 13,
    mins: 46,
    secs: 15,
  },
];

export function HotDealsSection({ products }: { products?: Product[] }) {
  const [timers, setTimers] = useState<Record<string, Countdown>>(() =>
    SAMPLE_DEALS.reduce(
      (acc, deal) => {
        acc[deal.id] = { days: deal.days, hours: deal.hours, mins: deal.mins, secs: deal.secs };
        return acc;
      },
      {} as Record<string, Countdown>,
    ),
  );

  // Live countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          let { days, hours, mins, secs } = next[id];
          if (secs > 0) secs--;
          else {
            secs = 59;
            if (mins > 0) mins--;
            else {
              mins = 59;
              if (hours > 0) hours--;
              else {
                hours = 23;
                if (days > 0) days--;
              }
            }
          }
          next[id] = { days, hours, mins, secs };
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayDeals =
    products && products.length >= 4
      ? products.slice(0, 4).map((p, idx) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          compareAtPrice: p.compareAtPrice || Math.round(p.price * 1.25),
          image: p.images?.[0] || SAMPLE_DEALS[idx].image,
        }))
      : SAMPLE_DEALS;

  return (
    <div className="space-y-4">
      {/* Red Ribbon Header */}
      <div className="border-b-2 border-danger flex items-center justify-between">
        <div className="maxshop-ribbon text-sm font-black tracking-wider">HOT DEALS</div>
      </div>

      {/* Grid of 4 deal items */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {displayDeals.map((item) => {
          const timer = timers[item.id] || { days: 0, hours: 0, mins: 0, secs: 0 };
          return (
            <div
              key={item.id}
              className="product-card group relative flex flex-col justify-between rounded-sm p-3"
            >
              {/* SALE Badge */}
              <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-xs">
                SALE
              </span>

              {/* Product Image */}
              <Link
                to={`/products`}
                className="aspect-square overflow-hidden bg-surface-2 mb-2 block"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Countdown Timer Box */}
              <div className="countdown-box my-2 bg-surface-2 p-1 rounded-sm border border-border">
                <div className="countdown-unit">
                  <span className="number">{timer.days}</span>
                  <span className="text-[8px] text-text-muted block">DAYS</span>
                </div>
                <div className="countdown-unit">
                  <span className="number">{String(timer.hours).padStart(2, '0')}</span>
                  <span className="text-[8px] text-text-muted block">HOURS</span>
                </div>
                <div className="countdown-unit">
                  <span className="number">{String(timer.mins).padStart(2, '0')}</span>
                  <span className="text-[8px] text-text-muted block">MINS</span>
                </div>
                <div className="countdown-unit">
                  <span className="number">{String(timer.secs).padStart(2, '0')}</span>
                  <span className="text-[8px] text-text-muted block">SECS</span>
                </div>
              </div>

              {/* Info */}
              <div className="text-center space-y-1">
                {/* Rating */}
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
          );
        })}
      </div>
    </div>
  );
}
