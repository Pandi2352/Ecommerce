import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BannerSlide } from '@/app/StorefrontConfigContext';

interface Props {
  banners?: BannerSlide[];
}

const DEFAULT_SLIDES = [
  {
    id: 'maxshop-tablet-banner',
    subtitleTop: 'OUR NEW RANGE OF',
    title: 'TABLET',
    subtitleBottom: 'FOR LESS THAN $99.00',
    link: '/products',
  },
  {
    id: 'maxshop-watch-banner',
    subtitleTop: 'SMART & STYLISH',
    title: 'WATCHES',
    subtitleBottom: 'UP TO 40% OFF THIS WEEK',
    link: '/products',
  },
];

export function BannerCarousel({ banners = [] }: Props) {
  const activeBanners = banners.filter((b) => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalSlides = activeBanners.length > 0 ? activeBanners.length : DEFAULT_SLIDES.length;

  // Auto-advance slide every 5 seconds
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // If custom admin image slide is active
  if (activeBanners.length > 0) {
    return (
      <section className="relative overflow-hidden rounded-sm border border-border bg-surface mb-6 shadow-sm">
        <div className="relative min-h-[360px] sm:min-h-[420px] flex items-center overflow-hidden">
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
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-slate-800" />
              )}
            </div>
          ))}

          {/* Controls */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                }
                className="absolute left-0 z-30 flex h-12 w-9 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
                className="absolute right-0 z-30 flex h-12 w-9 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-5 bg-danger' : 'w-2.5 bg-white border border-gray-400'
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

  // ── MaxShop Exact Tablet Hero Banner (Matching Image Reference) ───────────
  const currentDefault = DEFAULT_SLIDES[currentIndex];

  return (
    <section className="relative overflow-hidden rounded-sm border border-border mb-6 select-none bg-gradient-to-b from-[#b4d5e8] via-[#e2ded9] to-[#c7b9a5]">
      <div className="relative min-h-[350px] sm:min-h-[400px] flex items-center px-6 sm:px-12 py-8 overflow-hidden">
        {/* Background Scenic Atmospheric Glow */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.8) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 w-full">
          {/* Left Column: Tablet Graphic with Floating App Badges (7 cols) */}
          <div className="md:col-span-7 flex justify-center items-center relative py-4">
            {/* White Tablet Mockup Frame */}
            <div className="relative w-full max-w-md bg-white p-3 rounded-2xl shadow-2xl border-4 border-slate-200 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Tablet Screen */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-sky-500 border border-slate-300">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"
                  alt="Tablet display"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-600/40 via-transparent to-white/20 pointer-events-none" />
              </div>
              <div className="text-center mt-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400">AOC</span>
              </div>

              {/* Floating App Badges (Youtube, Chrome, Google+, Maps, Gmail, Android) */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow border border-slate-200 text-[10px] font-bold text-red-600 flex items-center gap-1 animate-bounce">
                <span className="bg-red-600 text-white rounded-xs px-1 text-[8px]">▶</span> YouTube
              </div>
              <div className="absolute -top-2 right-4 bg-white p-1 rounded-full shadow-md border border-slate-200 text-base">
                🌐
              </div>
              <div className="absolute top-1/2 -right-4 bg-red-600 text-white font-bold text-[10px] p-1.5 rounded shadow-lg">
                g+
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow border border-slate-200 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                📍 Maps
              </div>
              <div className="absolute -bottom-4 left-6 bg-white px-2 py-1 rounded shadow-md border border-slate-200 text-xs font-bold text-red-500 flex items-center gap-1">
                ✉️ Gmail
              </div>
              <div className="absolute bottom-2 right-6 text-2xl animate-pulse">🤖</div>
            </div>
          </div>

          {/* Right Column: Hero Typography (5 cols) */}
          <div className="md:col-span-5 text-center md:text-left space-y-2">
            <p className="text-sm sm:text-base font-bold text-slate-700 tracking-wider uppercase">
              {currentDefault.subtitleTop}
            </p>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-danger tracking-tight uppercase leading-none drop-shadow-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {currentDefault.title}
            </h1>
            <p className="text-sm sm:text-base font-bold text-slate-700 tracking-wider uppercase pt-1">
              {currentDefault.subtitleBottom}
            </p>
            <div className="pt-3">
              <Link
                to={currentDefault.link}
                className="inline-block bg-danger hover:bg-danger/90 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xs tracking-wider shadow-md transition-transform hover:scale-105"
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>

        {/* Left & Right Edge Navigation Arrows */}
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev === 0 ? DEFAULT_SLIDES.length - 1 : prev - 1))
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % DEFAULT_SLIDES.length)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-12 w-8 items-center justify-center bg-black/40 text-white hover:bg-danger transition-colors"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {DEFAULT_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'w-5 bg-danger' : 'w-2.5 bg-white border border-gray-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
