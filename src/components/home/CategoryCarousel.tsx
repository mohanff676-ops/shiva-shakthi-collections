import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { safeImageUrl } from '@/lib/utils';

export interface CategoryCarouselItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

/**
 * All 15 official categories in exact required order:
 * 1. Short Black Beads
 * 2. Bangles
 * 3. Thali Chains
 * 4. Beads Chains
 * 5. Necklace Sets
 * 6. Long Harams
 * 7. Hair Accessories
 * 8. Maatilu
 * 9. Champaswaralu
 * 10. Bracelets
 * 11. Earrings
 * 12. Chandraharam
 * 13. Finger Rings
 * 14. Beads Haram
 * 15. Long Black Beads
 */
export const CATEGORY_CAROUSEL_ITEMS: CategoryCarouselItem[] = [
  {
    id: 'cat-sbb',
    name: 'Short Black Beads',
    slug: 'short-black-beads',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM (1).jpeg',
  },
  {
    id: 'cat-3',
    name: 'Bangles',
    slug: 'bangles',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (1).jpeg',
  },
  {
    id: 'cat-tc',
    name: 'Thali Chains',
    slug: 'thali-chains',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM (1).jpeg',
  },
  {
    id: 'cat-bc',
    name: 'Beads Chains',
    slug: 'beads-chains',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
  },
  {
    id: 'cat-2',
    name: 'Necklace Sets',
    slug: 'necklace-sets',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
  },
  {
    id: 'cat-lh',
    name: 'Long Harams',
    slug: 'long-harams',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
  },
  {
    id: 'cat-ha',
    name: 'Hair Accessories',
    slug: 'hair-accessories',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
  },
  {
    id: 'cat-mt',
    name: 'Maatilu',
    slug: 'maatilu',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
  },
  {
    id: 'cat-cs',
    name: 'Champaswaralu',
    slug: 'champaswaralu',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
  },
  {
    id: 'cat-6',
    name: 'Bracelets',
    slug: 'bracelets',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM.jpeg',
  },
  {
    id: 'cat-1',
    name: 'Earrings',
    slug: 'earrings',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
  },
  {
    id: 'cat-ch',
    name: 'Chandraharam',
    slug: 'chandraharam',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
  },
  {
    id: 'cat-4',
    name: 'Finger Rings',
    slug: 'finger-rings',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (2).jpeg',
  },
  {
    id: 'cat-bh',
    name: 'Beads Haram',
    slug: 'beads-haram',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM.jpeg',
  },
  {
    id: 'cat-lbb',
    name: 'Long Black Beads',
    slug: 'long-black-beads',
    image: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM.jpeg',
  },
];

export interface CategoryCarouselProps {
  activeCategory?: string;
  onSelectCategory: (slug: string) => void;
}

export function CategoryCarousel({ activeCategory, onSelectCategory }: CategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Desktop drag states
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Update scroll boundaries & progress bar
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScroll - 5);

    if (maxScroll > 0) {
      const pct = Math.min(Math.max((scrollLeft / maxScroll) * 100, 0), 100);
      setScrollProgress(pct);
    } else {
      setScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  // Arrow button navigation
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Mouse Drag Handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    isDownRef.current = true;
    setIsMouseDown(true);
    setHasDragged(false);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
    setIsMouseDown(false);
    setTimeout(() => {
      setHasDragged(false);
    }, 60);
  };

  const handleCardClick = (slug: string) => {
    if (hasDragged) return;
    onSelectCategory(slug);
  };

  return (
    <section className="pt-3 sm:pt-5 pb-4 sm:pb-6 bg-[#0A0A0C] w-full max-w-full overflow-hidden">
      <div className="container-custom">
        {/* Header row - compact with View All & desktop navigation arrows */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-brand-champagne block">
              CURATED COLLECTIONS
            </span>
            <h2 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-[#F7F5F0]">
              Shop by Category
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Left / Right Arrow Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll categories left"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'border-white/20 bg-[#141418] text-[#F7F5F0] hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#1A1813]'
                    : 'border-white/5 bg-[#101014] text-white/20 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll categories right"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'border-white/20 bg-[#141418] text-[#F7F5F0] hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#1A1813]'
                    : 'border-white/5 bg-[#101014] text-white/20 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/shop"
              className="text-[11px] sm:text-xs font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1 group py-1 px-1.5 rounded transition-colors"
              aria-label="View all categories in jewellery shop"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Carousel Container with Mouse Drag & Touch Swipe */}
        <div className="relative group/carousel w-full max-w-full overflow-hidden">
          <div
            ref={containerRef}
            onScroll={updateScrollState}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-stretch gap-2 min-[360px]:gap-2.5 sm:gap-3.5 overflow-x-auto overflow-y-hidden pb-2 pt-1 px-0.5 scroll-smooth no-scrollbar select-none snap-x snap-mandatory ${
              isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
            }}
          >
            {CATEGORY_CAROUSEL_ITEMS.map((cat, idx) => {
              const isSelected = activeCategory === cat.slug;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCardClick(cat.slug)}
                  className={`group flex flex-col text-left rounded-xl transition-all duration-300 p-1.5 sm:p-2 shrink-0 snap-start focus:outline-none ${
                    /* Responsive Card Widths: around two compact cards on mobile, several on desktop */
                    'w-[122px] min-[360px]:w-[134px] min-[390px]:w-[144px] min-[430px]:w-[154px] sm:w-[160px] md:w-[170px] lg:w-[175px]'
                  } ${
                    isSelected
                      ? 'bg-[#1C1A14] border-2 border-[#C5A059] shadow-gold-sm ring-1 ring-[#C5A059]/50'
                      : 'bg-[#121215] border border-white/5 hover:border-[#C5A059]/50 hover:bg-[#16161C] shadow-sm hover:shadow-luxury'
                  }`}
                  aria-label={`Filter by ${cat.name}`}
                >
                  {/* Image container */}
                  <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#18181D]">
                    <img
                      src={safeImageUrl(cat.image)}
                      alt={cat.name}
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                      draggable={false}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[0.96]"
                      loading={idx < 6 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Order index pill for subtle luxury cue */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-black/60 text-[#DFBE76] border border-white/10 backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Category Title - centered, preventing overflow */}
                  <div className="pt-2 pb-1 px-1 flex flex-col items-center justify-center flex-1">
                    <span
                      className={`font-heading font-semibold text-[11px] sm:text-xs text-center leading-tight transition-colors line-clamp-2 ${
                        isSelected
                          ? 'text-[#DFBE76] font-bold'
                          : 'text-[#F7F5F0] group-hover:text-brand-champagne'
                      }`}
                      title={cat.name}
                    >
                      {cat.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right edge fade gradient (signals horizontal scrollability on touch screens) */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 sm:w-12 bg-gradient-to-l from-[#0A0A0C] via-[#0A0A0C]/70 to-transparent z-10 transition-opacity" />
          )}

          {/* Left edge fade gradient */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 sm:w-12 bg-gradient-to-r from-[#0A0A0C] via-[#0A0A0C]/70 to-transparent z-10 transition-opacity" />
          )}
        </div>

        {/* Refined Luxury Progress Bar Indicator */}
        <div className="flex items-center justify-between mt-2 sm:mt-3 px-1">
          <span className="text-[10px] text-[#78716C] font-mono">
            15 Curated Categories • Swipe to Explore
          </span>

          {/* Dynamic Scroll Progress Bar */}
          <div
            className="w-24 sm:w-36 h-1 bg-white/10 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(scrollProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Category carousel scroll progress"
          >
            <div
              className="h-full bg-gradient-to-r from-brand-champagne-light via-[#DFBE76] to-[#C5A059] rounded-full transition-all duration-150"
              style={{
                width: `${Math.max(scrollProgress, 18)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
