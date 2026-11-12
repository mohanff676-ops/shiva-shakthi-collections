import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Gem,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, safeImageUrl, whatsappUrl } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/constants';

export interface SignatureItemConfig {
  number: string; // '01' to '15'
  name: string;
  categorySlug: string;
  defaultImage: string;
  subtitle: string;
  productSlug?: string;
  highlightText?: string;
}

/**
 * All 15 categories in exact order:
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
export const SIGNATURE_ITEMS: SignatureItemConfig[] = [
  {
    number: '01',
    name: 'Short Black Beads',
    categorySlug: 'short-black-beads',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg',
    subtitle: 'Auspicious Daily Mangalsutra Chain',
    productSlug: 'gold-green-pendant-black-beads-necklace',
    highlightText: 'Green Pendant & Pearl Drops',
  },
  {
    number: '02',
    name: 'Bangles',
    categorySlug: 'bangles',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (1).jpeg',
    subtitle: 'Micro-Gold Temple Kada & Bangles Pair',
    productSlug: 'matte-gold-temple-bangles-pair',
    highlightText: 'Embossed Floral Carving',
  },
  {
    number: '03',
    name: 'Thali Chains',
    categorySlug: 'thali-chains',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM (1).jpeg',
    subtitle: 'Traditional Mugappu Sacred Chain',
    highlightText: 'Intricate Side Mugappu',
  },
  {
    number: '04',
    name: 'Beads Chains',
    categorySlug: 'beads-chains',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg',
    subtitle: 'Festive Multicolour & Pearl Chain',
    productSlug: 'multicolour-beads-pearl-necklace',
    highlightText: 'Artisanal Gemstone Beads',
  },
  {
    number: '05',
    name: 'Necklace Sets',
    categorySlug: 'necklace-sets',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
    subtitle: 'Royal Heritage Choker & Earrings Set',
    productSlug: 'twin-ruby-sapphire-royal-necklace-set',
    highlightText: 'Twin Ruby & Sapphire Teardrops',
  },
  {
    number: '06',
    name: 'Long Harams',
    categorySlug: 'long-harams',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg',
    subtitle: 'Grand Layered Bridal Haram',
    productSlug: 'long-layered-gold-chain-haram',
    highlightText: 'Multi-Strand Textured Draping',
  },
  {
    number: '07',
    name: 'Hair Accessories',
    categorySlug: 'hair-accessories',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
    subtitle: 'Goddess Lakshmi Bridal Jada Billa',
    productSlug: 'bridal-goddess-lakshmi-temple-jada-billa',
    highlightText: 'Seated Lakshmi with Pearl Jhumkis',
  },
  {
    number: '08',
    name: 'Maatilu',
    categorySlug: 'maatilu',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
    subtitle: 'Traditional Pearl Ear-to-Hair Chains',
    highlightText: 'Graceful Hair Accentuation',
  },
  {
    number: '09',
    name: 'Champaswaralu',
    categorySlug: 'champaswaralu',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
    subtitle: 'Heritage Multi-Layer Ear Extensions',
    highlightText: 'Auspicious Bridal Splendor',
  },
  {
    number: '10',
    name: 'Bracelets',
    categorySlug: 'bracelets',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM.jpeg',
    subtitle: 'Royal Peacock & Elephant Motif Kada',
    productSlug: 'royal-elephant-peacock-kada-bracelet',
    highlightText: 'Adjustable Luxury Cuff',
  },
  {
    number: '11',
    name: 'Earrings',
    categorySlug: 'earrings',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM (1).jpeg',
    subtitle: 'Antique Ruby Temple Jhumka Earrings',
    productSlug: 'antique-ruby-jhumka-earrings-with-pearls',
    highlightText: 'Dancing Seed Pearl Drops',
  },
  {
    number: '12',
    name: 'Chandraharam',
    categorySlug: 'chandraharam',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
    subtitle: 'Classic Multi-Line Crescent Haram',
    productSlug: 'classic-3-line-gold-chandraharam',
    highlightText: 'Traditional Tiered Festivity',
  },
  {
    number: '13',
    name: 'Finger Rings',
    categorySlug: 'finger-rings',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (2).jpeg',
    subtitle: 'Devotional Lakshmi Coin Statement Ring',
    productSlug: 'seated-lakshmi-coin-statement-ring',
    highlightText: 'Floral Filigree Halo Border',
  },
  {
    number: '14',
    name: 'Beads Haram',
    categorySlug: 'beads-haram',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM.jpeg',
    subtitle: 'Emerald & Ruby Gemstone Crystal Long Haram',
    productSlug: 'emerald-ruby-crystal-beads-long-haram',
    highlightText: 'Royal Multi-Layer Crystal Beads',
  },
  {
    number: '15',
    name: 'Long Black Beads',
    categorySlug: 'long-black-beads',
    defaultImage: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM.jpeg',
    subtitle: 'Royal 30-Inch Heritage Mangalsutra',
    productSlug: 'royal-30-inch-temple-mangalsutra',
    highlightText: 'Heavy Gold Pendant Motif',
  },
];

const TOTAL_ITEMS = 15;
const STEP_ANGLE = 360 / TOTAL_ITEMS; // 24 degrees per item

interface SignatureCollectionShowcaseProps {
  products?: Product[];
  onSelectCategory?: (slug: string) => void;
}

export function SignatureCollectionShowcase({
  products = [],
  onSelectCategory,
}: SignatureCollectionShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitStageRef = useRef<HTMLDivElement>(null);
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Layout sizing state based on actual measured width
  const [stageWidth, setStageWidth] = useState<number>(360);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [userReducedMotion, setUserReducedMotion] = useState<boolean>(false);

  // References for smooth continuous 60fps rotation without React re-render overhead
  const currentAngleRef = useRef<number>(180); // start with item 0 at the front (180 deg)
  const targetAngleRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number>(0);
  const animFrameIdRef = useRef<number>(0);

  // Drag / touch gesture tracking
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartAngleRef = useRef<number>(0);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setUserReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsPaused(true);
        isPausedRef.current = true;
      }
      const listener = (e: MediaQueryListEvent) => {
        setUserReducedMotion(e.matches);
        if (e.matches) {
          setIsPaused(true);
          isPausedRef.current = true;
        }
      };
      mediaQuery.addEventListener?.('change', listener);
      return () => mediaQuery.removeEventListener?.('change', listener);
    }
  }, []);

  // Update container width on resize with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Compute significantly enlarged, responsive orbit dimensions:
  // Maximizes screen coverage, fills available mobile width, and blooms front card
  const isMobile = stageWidth < 640;
  const isTablet = stageWidth >= 640 && stageWidth < 1024;

  const { Rx, Ry, cardWidth, cardHeight, stageHeight, frontScaleMultiplier } = useMemo(() => {
    let cardW = 56;
    let rx = 142;
    let ry = 112;
    let sHeight = 370;
    let fScale = 1.48;

    if (stageWidth < 345) {
      // 320px screen width (iPhone SE 1st gen)
      cardW = 50;
      rx = 126;
      ry = 100;
      sHeight = 340;
      fScale = 1.44;
    } else if (stageWidth < 370) {
      // 360px (Standard Android)
      cardW = 56;
      rx = 142;
      ry = 112;
      sHeight = 370;
      fScale = 1.48;
    } else if (stageWidth < 385) {
      // 375px (iPhone mini / SE 2/3)
      cardW = 58;
      rx = 148;
      ry = 116;
      sHeight = 380;
      fScale = 1.50;
    } else if (stageWidth < 415) {
      // 390px (iPhone 12/13/14/15/16 Pro)
      cardW = 62;
      rx = 154;
      ry = 122;
      sHeight = 400;
      fScale = 1.52;
    } else if (stageWidth < 640) {
      // 430px (iPhone Plus / Pro Max)
      cardW = 68;
      rx = 170;
      ry = 132;
      sHeight = 430;
      fScale = 1.55;
    } else if (stageWidth < 768) {
      // 480px - 768px (Large phones & small tablets)
      cardW = 76;
      rx = 215;
      ry = 150;
      sHeight = 470;
      fScale = 1.58;
    } else if (stageWidth < 1024) {
      // Tablets (iPad / Galaxy Tab)
      cardW = 88;
      rx = 290;
      ry = 175;
      sHeight = 550;
      fScale = 1.62;
    } else {
      // Desktop (Dominant, immersive 3D presentation)
      cardW = 104;
      rx = Math.min(stageWidth * 0.38, 430);
      ry = 215;
      sHeight = 670;
      fScale = 1.68;
    }

    const cardH = Math.round(cardW * 1.25);
    return {
      Rx: rx,
      Ry: ry,
      cardWidth: cardW,
      cardHeight: cardH,
      stageHeight: sHeight,
      frontScaleMultiplier: fScale,
    };
  }, [stageWidth]);

  // Sync isPausedRef with React state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Match real product from database
  const getMatchingProduct = useCallback(
    (item: SignatureItemConfig): Product | undefined => {
      if (!products || products.length === 0) return undefined;

      // 1. Match by configured slug
      if (item.productSlug) {
        const found = products.find((p) => p.slug === item.productSlug);
        if (found) return found;
      }

      // 2. Match by category slug or category ID
      const byCat = products.find(
        (p) =>
          p.category?.slug === item.categorySlug ||
          p.category_id === item.categorySlug ||
          p.category_id === `cat-${item.categorySlug}`
      );
      if (byCat) return byCat;

      // 3. Match by name keywords
      const itemLower = item.name.toLowerCase();
      const byName = products.find((p) => {
        const pName = (p.name || '').toLowerCase();
        const pTags = Array.isArray(p.tags) ? p.tags.map((t) => t.toLowerCase()) : [];
        return (
          pName.includes(itemLower) ||
          pTags.some((t) => t.includes(item.categorySlug) || t.includes(itemLower))
        );
      });
      return byName;
    },
    [products]
  );

  // Directly update card DOM node styles with 3D math and active-centre magnification (60fps performance)
  const applyCardPositions = useCallback(
    (globalAngle: number) => {
      let closestFrontIndex = 0;
      let minAngularDiff = 999;

      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const el = cardElementsRef.current[i];
        if (!el) continue;

        // Angle for item i:
        // When globalAngle = 180 - i*24, item i is at 180 deg (front/bottom)
        const itemAngleDeg = (globalAngle + i * STEP_ANGLE) % 360;
        const normalizedAngle = (itemAngleDeg + 360) % 360;
        const rad = (normalizedAngle * Math.PI) / 180;

        // Angular distance from front (180 deg)
        const diffFromFront = Math.abs(normalizedAngle - 180);
        const circularDiff = Math.min(diffFromFront, 360 - diffFromFront); // 0 to 180 deg

        // 3D coordinates relative to center (0,0):
        const x = Rx * Math.sin(rad);
        const y = -Ry * Math.cos(rad);

        // Depth z: ranges from -1 (at top/back) to +1 (at bottom/front)
        const z = -Math.cos(rad);
        const depthFactor = (z + 1) / 2; // 0 (back) to 1 (front)

        // Smooth cosine bell curve for active front card magnification:
        // Cards within 48 deg (2 adjacent items) smoothly bloom into enlarged hero cards
        const maxProximityAngle = 48;
        let frontProximity = 0;
        if (circularDiff < maxProximityAngle) {
          frontProximity = (1 + Math.cos((circularDiff * Math.PI) / maxProximityAngle)) / 2;
        }

        // Base depth scale: 0.75 (back) to 1.0 (sides/front baseline)
        const baseScale = 0.75 + 0.25 * depthFactor;

        // Active card scale: smoothly increases to frontScaleMultiplier (1.4–1.7x) at front centre
        const scale = baseScale + (frontScaleMultiplier - 1.0) * frontProximity;

        // Opacity: 0.60 at back to 1.0 at front
        const opacity = 0.60 + 0.40 * depthFactor;

        // Correct depth zIndex:
        // Back cards: zIndex 10..95 (behind central medallion at 100)
        // Medallion: zIndex 100
        // Foreground cards: zIndex 105..280 (above central medallion and neighbouring cards)
        const zIndex = Math.round(depthFactor * 120 + frontProximity * 150) + 10;

        // Subtle 3D tilt towards viewer
        const tiltX = (1 - depthFactor) * 10;

        el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z * 50}px) rotateX(${tiltX}deg) scale(${scale})`;
        el.style.zIndex = String(zIndex);
        el.style.opacity = String(opacity);

        // Dynamic gold border and soft gold glow based on front proximity
        if (frontProximity > 0.65) {
          el.style.borderColor = 'rgba(197, 160, 89, 0.95)';
          el.style.boxShadow = '0 0 32px rgba(197, 160, 89, 0.45), 0 16px 36px rgba(0, 0, 0, 0.85)';
        } else if (frontProximity > 0.2) {
          el.style.borderColor = 'rgba(197, 160, 89, 0.55)';
          el.style.boxShadow = '0 0 18px rgba(197, 160, 89, 0.25), 0 8px 24px rgba(0, 0, 0, 0.7)';
        } else {
          el.style.borderColor = 'rgba(197, 160, 89, 0.2)';
          el.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6)';
        }

        // Track which item is closest to 180 deg (front spotlight position)
        if (circularDiff < minAngularDiff) {
          minAngularDiff = circularDiff;
          closestFrontIndex = i;
        }
      }

      // Update active spotlight item state when it changes
      setActiveItemIndex((prev) => (prev !== closestFrontIndex ? closestFrontIndex : prev));
    },
    [Rx, Ry, frontScaleMultiplier]
  );

  // Main 60fps animation loop using requestAnimationFrame
  useEffect(() => {
    let isCancelled = false;

    const animate = (timestamp: number) => {
      if (isCancelled) return;

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.1);
      lastTimestampRef.current = timestamp;

      // Smooth glide to target angle if set (e.g. on click / next / prev)
      if (targetAngleRef.current !== null) {
        let diff = targetAngleRef.current - currentAngleRef.current;
        // Normalize diff to -180 .. +180
        diff = ((diff + 180) % 360 + 360) % 360 - 180;

        if (Math.abs(diff) < 0.2) {
          currentAngleRef.current = targetAngleRef.current;
          targetAngleRef.current = null;
        } else {
          currentAngleRef.current += diff * Math.min(dt * 8, 0.25);
        }
        applyCardPositions(currentAngleRef.current);
      } else if (!isPausedRef.current && !userReducedMotion && !isDraggingRef.current) {
        // Continuous smooth rotation at luxurious speed (~7.5 degrees per sec => 48s full loop)
        const rotationSpeed = 7.5;
        currentAngleRef.current = (currentAngleRef.current - rotationSpeed * dt) % 360;
        applyCardPositions(currentAngleRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [applyCardPositions, userReducedMotion]);

  // Initial render positioning
  useEffect(() => {
    applyCardPositions(currentAngleRef.current);
  }, [applyCardPositions, Rx, Ry, frontScaleMultiplier]);

  // Rotate smoothly so item index 'targetIndex' lands directly at the front (180 deg)
  const rotateToItem = useCallback((targetIndex: number) => {
    setActiveItemIndex(targetIndex);
    const desiredAngle = (180 - targetIndex * STEP_ANGLE) % 360;
    targetAngleRef.current = desiredAngle;
  }, []);

  // Previous & Next navigation controls
  const handlePrev = () => {
    const nextIdx = (activeItemIndex - 1 + TOTAL_ITEMS) % TOTAL_ITEMS;
    rotateToItem(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeItemIndex + 1) % TOTAL_ITEMS;
    rotateToItem(nextIdx);
  };

  const handleTogglePlay = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  };

  // Item click handler: rotates that item to the front, and handles category filtering
  const handleItemClick = (index: number, item: SignatureItemConfig) => {
    rotateToItem(index);
    if (onSelectCategory) {
      onSelectCategory(item.categorySlug);
    }
  };

  // Drag / touch rotation handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (userReducedMotion) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartAngleRef.current = currentAngleRef.current;
    targetAngleRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    // Drag sensitivity: 1px = 0.45 degrees
    currentAngleRef.current = (dragStartAngleRef.current + deltaX * 0.45) % 360;
    applyCardPositions(currentAngleRef.current);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Active spotlight item details
  const activeItem = SIGNATURE_ITEMS[activeItemIndex] || SIGNATURE_ITEMS[0];
  const matchedProduct = getMatchingProduct(activeItem);

  const activeWhatsappUrl = whatsappUrl(
    WHATSAPP_NUMBER,
    `Namaste Shiva Shakthi Collections! I am exploring your 3D Collection Showcase on your website and would like to inquire about "${activeItem.name}" (${activeItem.subtitle}).`
  );

  return (
    <section
      ref={containerRef}
      id="categories"
      className="relative py-4 sm:py-8 lg:py-12 bg-gradient-to-b from-[#0A0A0C] via-[#0E0E12] to-[#0A0A0C] border-y border-[#C5A059]/20 overflow-hidden select-none scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28"
      aria-label="3D Circular Rotating Jewellery Showcase"
      onMouseEnter={() => {
        isPausedRef.current = true;
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        if (!userReducedMotion) {
          isPausedRef.current = false;
          setIsPaused(false);
        }
      }}
      onTouchStart={() => {
        isPausedRef.current = true;
        setIsPaused(true);
      }}
      onTouchEnd={() => {
        if (!userReducedMotion) {
          setTimeout(() => {
            isPausedRef.current = false;
            setIsPaused(false);
          }, 1200);
        }
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[650px] lg:w-[850px] h-[340px] sm:h-[650px] lg:h-[850px] rounded-full bg-radial from-[#C5A059]/12 via-[#C5A059]/3 to-transparent blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />
      </div>

      <div className="container-custom relative z-10 px-1 min-[360px]:px-2 sm:px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-2 sm:mb-6 px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-[#141418] border border-[#C5A059]/35 text-brand-champagne text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 shadow-sm">
            <Sparkles className="w-3 h-3 text-brand-champagne animate-pulse" />
            <span>Signature 15-Item 3D Orbit</span>
          </div>

          <h2 className="font-heading text-lg min-[360px]:text-xl sm:text-3xl lg:text-4xl font-bold text-[#F7F5F0] leading-tight">
            Royal Orbit of Micro-Gold Treasures
          </h2>

          <p className="text-[11px] sm:text-sm text-[#A8A29E] mt-1 leading-relaxed max-w-xl mx-auto">
            Glide through our 15 sacred temple collections. Swipe to rotate, tap any piece to spotlight.
          </p>
        </div>

        {/* 3D ORBIT STAGE (Enlarged, visually dominant on mobile & desktop, zero clipping) */}
        <div
          ref={orbitStageRef}
          className="relative w-full mx-auto flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y overflow-visible"
          style={{
            height: `${stageHeight}px`,
            perspective: isMobile ? '1200px' : '1400px',
            transformStyle: 'preserve-3d',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Subtle Decorative Orbital Ring Line behind elements */}
          <div
            className="absolute rounded-full border border-[#C5A059]/25 pointer-events-none"
            style={{
              width: `${Rx * 2}px`,
              height: `${Ry * 2}px`,
              transform: 'translate(-50%, -50%)',
              top: '50%',
              left: '50%',
              boxShadow: '0 0 45px rgba(197, 160, 89, 0.10) inset',
            }}
          />

          {/* Secondary Dashed Orbit Ring */}
          <div
            className="absolute rounded-full border border-dashed border-[#C5A059]/15 pointer-events-none"
            style={{
              width: `${Rx * 2 + 20}px`,
              height: `${Ry * 2 + 16}px`,
              transform: 'translate(-50%, -50%)',
              top: '50%',
              left: '50%',
            }}
          />

          {/* CENTER BRAND MEDALLION (Z-Index = 100, positioned between back and front cards) */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-center select-none shadow-2xl transition-transform duration-300 pointer-events-auto"
            style={{
              zIndex: 100,
              width: isMobile
                ? stageWidth < 345
                  ? '82px'
                  : stageWidth < 370
                  ? '94px'
                  : stageWidth < 385
                  ? '98px'
                  : stageWidth < 415
                  ? '104px'
                  : '114px'
                : isTablet
                ? '160px'
                : '196px',
              height: isMobile
                ? stageWidth < 345
                  ? '82px'
                  : stageWidth < 370
                  ? '94px'
                  : stageWidth < 385
                  ? '98px'
                  : stageWidth < 415
                  ? '104px'
                  : '114px'
                : isTablet
                ? '160px'
                : '196px',
              background: 'radial-gradient(circle, #1A1A22 0%, #121217 65%, #0A0A0C 100%)',
              border: '2px solid rgba(197, 160, 89, 0.55)',
              boxShadow: '0 0 35px rgba(197, 160, 89, 0.25), 0 10px 25px rgba(0, 0, 0, 0.85)',
            }}
          >
            {/* Concentric inner gold accent circle */}
            <div className="absolute inset-1 sm:inset-2.5 rounded-full border border-[#C5A059]/30 pointer-events-none" />

            <Gem className="w-3.5 h-3.5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-brand-champagne mb-0.5 sm:mb-1 animate-pulse" />
            <span className="font-heading font-bold text-[8px] sm:text-xs md:text-sm text-brand-champagne tracking-widest uppercase leading-none">
              SHIVA SHAKTHI
            </span>
            <span className="font-heading font-semibold text-[6.5px] sm:text-[10px] md:text-xs text-[#F7F5F0] tracking-wider uppercase leading-none mt-0.5 sm:mt-1">
              COLLECTIONS
            </span>
            <span className="mt-0.5 sm:mt-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/35 text-[6px] sm:text-[8px] md:text-[9.5px] text-brand-champagne font-mono font-bold tracking-tight">
              1-Gram Micro Gold
            </span>
          </div>

          {/* 15 ROTATING CIRCULAR CARDS (Front active card blooms to 1.44x-1.68x size) */}
          {SIGNATURE_ITEMS.map((item, idx) => {
            const isCurrentActive = activeItemIndex === idx;

            return (
              <div
                key={item.categorySlug}
                ref={(el) => {
                  cardElementsRef.current[idx] = el;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(idx, item);
                }}
                className={`absolute top-1/2 left-1/2 rounded-xl sm:rounded-2xl cursor-pointer will-change-transform group transition-colors duration-200 ${
                  isCurrentActive ? 'ring-2 ring-brand-champagne' : 'hover:ring-1 hover:ring-[#C5A059]/60'
                }`}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  backgroundColor: '#121216',
                  transformStyle: 'preserve-3d',
                }}
                title={`${item.number}. ${item.name} — Click to spotlight`}
              >
                {/* Card Interior */}
                <div className="w-full h-full p-1 sm:p-1.5 flex flex-col items-center justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#18181E] via-[#121216] to-[#0E0E12]">
                  {/* Top: Item Number Badge & Status Dot */}
                  <div className="w-full flex items-center justify-between leading-none px-0.5 pt-0.5">
                    <span className="text-[7px] sm:text-[9px] font-mono font-bold text-brand-champagne bg-[#0A0A0C]/90 px-1 py-0.5 rounded border border-[#C5A059]/30">
                      {item.number}
                    </span>
                    {isCurrentActive && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-champagne animate-ping" />
                    )}
                  </div>

                  {/* Middle: Authentic Product Photo */}
                  <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden border border-white/10 bg-[#0A0A0C] my-0.5">
                    <img
                      src={safeImageUrl(item.defaultImage)}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[1.02]"
                      loading="eager"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/50 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Bottom: Category Name Label */}
                  <div className="w-full text-center px-0.5 pb-0.5">
                    <span className="block font-heading font-bold text-[7.5px] sm:text-[10px] text-[#F7F5F0] truncate leading-tight group-hover:text-brand-champagne transition-colors">
                      {item.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONTROLS & ACTIVE SPOTLIGHT PANEL */}
        <div className="mt-2 sm:mt-5 max-w-4xl lg:max-w-5xl mx-auto">
          {/* Controls Strip: Prev, Play/Pause, Next */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-[#121215] border border-[#C5A059]/30 shadow-md mb-2.5 sm:mb-4">
            <button
              type="button"
              onClick={handlePrev}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#1A1A22] hover:bg-[#24242F] text-brand-champagne border border-[#C5A059]/30 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-all active:scale-95"
              title="Previous category"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Prev</span>
            </button>

            {/* Orbit Status & Play/Pause */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                  isPaused
                    ? 'bg-[#1A1A22] text-[#F7F5F0] border-white/10 hover:border-[#C5A059]/40'
                    : 'bg-brand-champagne text-[#0A0A0C] border-brand-champagne shadow-gold-sm'
                }`}
                title={isPaused ? 'Resume 3D rotation' : 'Pause rotation'}
              >
                {isPaused ? (
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                ) : (
                  <Pause className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                )}
                <span>{isPaused ? 'Resume Orbit' : 'Auto-Rotating'}</span>
              </button>

              <span className="text-[10px] min-[360px]:text-xs text-[#A8A29E] font-mono">
                {activeItem.number} / {String(TOTAL_ITEMS).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#1A1A22] hover:bg-[#24242F] text-brand-champagne border border-[#C5A059]/30 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-all active:scale-95"
              title="Next category"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* ACTIVE SPOTLIGHT CARD (Compact on mobile, luxurious on desktop) */}
          <div className="p-3.5 sm:p-6 lg:p-7 rounded-2xl bg-gradient-to-r from-[#141418] via-[#181822] to-[#141418] border border-[#C5A059]/40 shadow-xl relative overflow-hidden">
            {/* Decorative gold badge in corner */}
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-[#C5A059]/15 to-transparent rounded-bl-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-6 lg:gap-8">
              {/* Product Thumbnail preview */}
              <div className="relative w-20 h-20 min-[360px]:w-24 min-[360px]:h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#C5A059]/40 shadow-xl shrink-0 bg-[#0A0A0C]">
                <img
                  src={safeImageUrl(activeItem.defaultImage)}
                  alt={activeItem.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#0A0A0C]/90 text-[8.5px] sm:text-xs font-mono font-bold text-brand-champagne border border-[#C5A059]/30 shadow-sm">
                  {activeItem.number}
                </span>
              </div>

              {/* Title & Details */}
              <div className="flex-1 text-center sm:text-left space-y-1 sm:space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                  <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs uppercase tracking-widest font-bold text-brand-champagne">
                    SPOTLIGHT #{activeItem.number}
                  </span>
                  {activeItem.highlightText && (
                    <span className="px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-brand-champagne text-[9px] min-[360px]:text-[10px] sm:text-xs font-semibold border border-[#C5A059]/35 truncate max-w-[200px]">
                      {activeItem.highlightText}
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-base min-[360px]:text-lg sm:text-2xl md:text-3xl font-bold text-[#F7F5F0] truncate">
                  {activeItem.name}
                </h3>

                <p className="text-[11px] min-[360px]:text-xs sm:text-sm md:text-base text-[#A8A29E] leading-relaxed max-w-xl">
                  {activeItem.subtitle}
                </p>

                {/* Price Display */}
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  {matchedProduct && typeof matchedProduct.price_paise === 'number' && matchedProduct.price_paise > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-2xl md:text-3xl font-bold text-brand-champagne font-heading">
                        {formatPrice(matchedProduct.price_paise)}
                      </span>
                      {matchedProduct.compare_at_price_paise && matchedProduct.compare_at_price_paise > matchedProduct.price_paise && (
                        <span className="text-xs sm:text-sm text-[#78716C] line-through font-mono">
                          {formatPrice(matchedProduct.compare_at_price_paise)}
                        </span>
                      )}
                      <span className="text-[8px] min-[360px]:text-[9px] sm:text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        In Stock & Catalogue
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] min-[360px]:text-xs sm:text-sm font-semibold text-brand-champagne/90 bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full border border-[#C5A059]/25">
                      Exclusive 1-Gram Gold Collection
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                {matchedProduct?.slug ? (
                  <Link
                    to={`/product/${matchedProduct.slug}`}
                    className="btn-primary text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex-1 sm:flex-initial flex items-center justify-center gap-1.5 shadow-gold-sm min-h-[38px] sm:min-h-[46px]"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectCategory && onSelectCategory(activeItem.categorySlug)}
                    className="btn-primary text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex-1 sm:flex-initial flex items-center justify-center gap-1.5 shadow-gold-sm min-h-[38px] sm:min-h-[46px]"
                  >
                    <span>Explore Pieces</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}

                <a
                  href={activeWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 min-[360px]:px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border border-emerald-600/40 transition-all min-h-[38px] sm:min-h-[42px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
