import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BannerSlide } from '@/app/StorefrontConfigContext';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';

interface Props {
  banners?: BannerSlide[];
}

export function BannerCarousel({ banners = [] }: Props) {
  const { config } = useStorefrontConfig();
  const activeBanners = banners.filter((b) => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);

  const storeName = config?.storeName || 'OUR STORE';

  // Universal Default Slides (Abstract CSS gradient design, 100% neutral for any store type)
  const defaultSlides = [
    {
      id: 'default-banner-1',
      title: `WELCOME TO ${storeName.toUpperCase()}`,
      subtitle: 'Explore thousands of premium products across all categories with fast delivery.',
      ctaText: 'SHOP CATALOG',
      ctaLink: '/products',
      badgeText: 'FEATURED MARKETPLACE',
      bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #334155 100%)',
    },
    {
      id: 'default-banner-2',
      title: 'EXCLUSIVE PROMOTIONS & DEALS',
      subtitle: 'Save big on selected items. New arrivals updated daily by store management.',
      ctaText: 'EXPLORE OFFERS',
      ctaLink: '/products',
      badgeText: 'SPECIAL OFFERS',
      bgGradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #4338ca 100%)',
    },
  ];

  const totalSlides = activeBanners.length > 0 ? activeBanners.length : defaultSlides.length;

  // Auto-advance slide every 5 seconds
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // ── 1. CUSTOM ADMIN BANNERS (When Admin Uploads Banners in Settings) ──────
  if (activeBanners.length > 0) {
    const current = activeBanners[currentIndex];
    return (
      <section className="relative overflow-hidden rounded-sm border border-border bg-surface mb-6 shadow-sm">
        <div className="relative min-h-[350px] sm:min-h-[400px] flex items-center overflow-hidden">
          {activeBanners.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.title || 'Storefront Banner'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                />
              )}
              {/* Dark overlay for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                }}
              />
            </div>
          ))}

          {/* Slide Text Content */}
          <div className="relative z-20 flex flex-col items-start px-8 sm:px-12 py-10 max-w-xl text-left text-white">
            {current.badgeText && (
              <span className="bg-danger text-white text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-xs mb-3 shadow-sm">
                {current.badgeText}
              </span>
            )}

            {current.title && (
              <h1
                className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight mb-3 drop-shadow-md"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {current.title}
              </h1>
            )}

            {current.subtitle && (
              <p className="text-xs sm:text-sm text-white/80 max-w-md mb-6 leading-relaxed drop-shadow">
                {current.subtitle}
              </p>
            )}

            <Link
              to={current.ctaLink || '/products'}
              className="inline-flex items-center gap-2 bg-danger hover:bg-danger/90 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-xs tracking-wider shadow-lg transition-transform hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              {current.ctaText || 'SHOP NOW'}
            </Link>
          </div>

          {/* Navigation Controls */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                }
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-6 bg-danger' : 'w-2.5 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // ── 2. NEUTRAL MULTI-STORE DEFAULT BANNER (When No Custom Banner Uploaded) ─
  const currentDefault = defaultSlides[currentIndex];

  return (
    <section className="relative overflow-hidden rounded-sm border border-border mb-6 shadow-sm select-none">
      <div className="relative min-h-[350px] sm:min-h-[380px] flex items-center px-8 sm:px-12 py-10 overflow-hidden">
        {/* Animated Abstract Atmospheric Gradient Background */}
        {defaultSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ background: slide.bgGradient }}
          >
            {/* Ambient geometric light orbs */}
            <div
              className="absolute top-[-50px] right-[-50px] w-96 h-96 rounded-full opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(230,46,4,0.8) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-[-60px] left-[-40px] w-80 h-80 rounded-full opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)',
              }}
            />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-start max-w-xl text-left text-white">
          <span className="bg-danger text-white text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-xs mb-3 shadow-sm">
            {currentDefault.badgeText}
          </span>

          <h1
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight mb-3 drop-shadow-md"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentDefault.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-md mb-6 leading-relaxed drop-shadow">
            {currentDefault.subtitle}
          </p>

          <Link
            to={currentDefault.ctaLink}
            className="inline-flex items-center gap-2 bg-danger hover:bg-danger/90 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-xs tracking-wider shadow-lg transition-transform hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            {currentDefault.ctaText}
          </Link>
        </div>

        {/* Navigation Controls */}
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev === 0 ? defaultSlides.length - 1 : prev - 1))
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % defaultSlides.length)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {defaultSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'w-6 bg-danger' : 'w-2.5 bg-white/70 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
