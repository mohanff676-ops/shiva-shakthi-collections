import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  MessageCircle,
  Gem,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, WHATSAPP_NUMBER, PLACEHOLDER_IMAGE } from '@/lib/constants';
import { useCategories } from '@/hooks/useCategories';
import { useProducts, useFeaturedProducts, useNewArrivals, useBestsellers } from '@/hooks/useProducts';
import { PREVIEW_PRODUCTS } from '@/data/previewProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { whatsappUrl, safeImageUrl } from '@/lib/utils';
import { CATEGORY_CAROUSEL_ITEMS } from '@/components/home/CategoryCarousel';
import { SignatureCollectionShowcase } from '@/components/home/SignatureCollectionShowcase';

export default function Home() {
  const { data: categories = [] } = useCategories();
  const { data: productsData, isLoading: prodsLoading } = useProducts({ pageSize: 50 });
  const allProducts = productsData?.products || [];
  const { data: featured = [], isLoading: featLoading } = useFeaturedProducts(8);
  const { data: newArrivals = [], isLoading: newLoading } = useNewArrivals(8);
  const { data: bestsellers = [], isLoading: bestLoading } = useBestsellers(8);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = allProducts.filter((p) => {
    if (selectedCategory === 'all') return true;

    // Direct category slug or ID match
    if (p.category?.slug === selectedCategory || p.category_id === selectedCategory) {
      return true;
    }

    const nameLower = (p.name || '').toLowerCase();
    const tags = Array.isArray(p.tags) ? p.tags.map((t) => t.toLowerCase()) : [];

    switch (selectedCategory) {
      case 'short-black-beads':
        return (
          tags.some((t) => t.includes('black-beads') || t.includes('mangalsutra') || t.includes('short')) ||
          nameLower.includes('black beads') ||
          nameLower.includes('mangalsutra') ||
          p.category_id === 'cat-sbb'
        );
      case 'bangles':
        return (
          tags.some((t) => t.includes('bangle') || t.includes('kada')) ||
          nameLower.includes('bangle') ||
          nameLower.includes('kada') ||
          p.category_id === 'cat-3'
        );
      case 'thali-chains':
        return (
          tags.some((t) => t.includes('thali') || t.includes('mangalsutra') || t.includes('chain')) ||
          nameLower.includes('thali') ||
          nameLower.includes('mangalsutra') ||
          nameLower.includes('chain') ||
          p.category_id === 'cat-tc'
        );
      case 'beads-chains':
        return (
          tags.some((t) => t.includes('bead') || t.includes('chain')) ||
          nameLower.includes('bead') ||
          p.category_id === 'cat-bc'
        );
      case 'necklace-sets':
        return (
          tags.some((t) => t.includes('necklace') || t.includes('choker') || t.includes('set')) ||
          nameLower.includes('necklace') ||
          nameLower.includes('choker') ||
          p.category?.slug === 'necklaces' ||
          p.category_id === 'cat-2'
        );
      case 'long-harams':
        return (
          tags.some((t) => t.includes('haram') || t.includes('long')) ||
          nameLower.includes('haram') ||
          nameLower.includes('long') ||
          p.category_id === 'cat-lh'
        );
      case 'hair-accessories':
        return (
          tags.some((t) => t.includes('hair') || t.includes('jada') || t.includes('billa')) ||
          nameLower.includes('hair') ||
          nameLower.includes('jada') ||
          p.category_id === 'cat-ha'
        );
      case 'maatilu':
        return (
          tags.some((t) => t.includes('maati') || t.includes('ear') || t.includes('jhumka')) ||
          nameLower.includes('maati') ||
          nameLower.includes('earring') ||
          nameLower.includes('jhumka') ||
          p.category_id === 'cat-mt'
        );
      case 'champaswaralu':
        return (
          tags.some((t) => t.includes('champa') || t.includes('ear') || t.includes('saralu')) ||
          nameLower.includes('champa') ||
          nameLower.includes('ear') ||
          p.category_id === 'cat-cs'
        );
      case 'bracelets':
        return (
          tags.some((t) => t.includes('bracelet') || t.includes('kada')) ||
          nameLower.includes('bracelet') ||
          nameLower.includes('kada') ||
          p.category_id === 'cat-6'
        );
      case 'earrings':
        return (
          tags.some((t) => t.includes('earring') || t.includes('jhumka') || t.includes('stud')) ||
          nameLower.includes('earring') ||
          nameLower.includes('jhumka') ||
          p.category_id === 'cat-1'
        );
      case 'chandraharam':
        return (
          tags.some((t) => t.includes('chandra') || t.includes('haram') || t.includes('necklace')) ||
          nameLower.includes('chandra') ||
          nameLower.includes('haram') ||
          p.category_id === 'cat-ch'
        );
      case 'finger-rings':
        return (
          tags.some((t) => t.includes('ring')) ||
          nameLower.includes('ring') ||
          p.category?.slug === 'rings' ||
          p.category_id === 'cat-4'
        );
      case 'beads-haram':
        return (
          tags.some((t) => t.includes('bead') || t.includes('haram')) ||
          nameLower.includes('bead') ||
          nameLower.includes('haram') ||
          p.category_id === 'cat-bh'
        );
      case 'long-black-beads':
        return (
          tags.some((t) => t.includes('black-beads') || t.includes('long') || t.includes('mangalsutra')) ||
          nameLower.includes('black beads') ||
          nameLower.includes('mangalsutra') ||
          p.category_id === 'cat-lbb'
        );
      default:
        return true;
    }
  });

  const generalWhatsappUrl = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste Shiva Shakthi Collections! I am visiting your website and would like to inquire about your jewellery collections.'
  );

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    const elem = document.getElementById('catalogue');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToCatalogue = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById('catalogue');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <title>{APP_NAME} — {APP_TAGLINE}</title>
        <meta
          name="description"
          content="Discover timeless beauty with Shiva Shakthi Collections. Handcrafted 1-gram micro gold jewellery, bridal heritage necklaces, royal jhumkas, and temple sets with direct WhatsApp concierge ordering."
        />
      </Helmet>

      {/* SECTION 4: Small Brand Banner (Compact Horizontal strip) */}
      <section className="py-2.5 sm:py-4 bg-[#0E0E12] border-y border-white/5">
        <div className="container-custom">
          <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-4 text-left">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-brand-champagne block truncate">
                SHIVA SHAKTHI COLLECTIONS
              </span>
              <h3 className="font-heading text-xs min-[360px]:text-sm sm:text-2xl font-bold text-[#F7F5F0] leading-tight truncate">
                Elegance in Every Detail
              </h3>
              <p className="text-[11px] sm:text-xs text-[#A8A29E] hidden md:block">
                Discover timeless beauty handcrafted with authentic 1-gram micro gold.
              </p>
            </div>

            <a
              href="#catalogue"
              onClick={handleScrollToCatalogue}
              className="btn-primary text-[11px] min-[360px]:text-xs font-bold px-3 min-[360px]:px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-gold-sm min-h-[36px] sm:min-h-[44px] flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 5: Existing Shiva Shakthi Brand Image */}
      <section className="py-2 sm:py-4 bg-[#0A0A0C]">
        <div className="container-custom">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#C5A059]/30 shadow-2xl bg-[#121215] max-w-5xl mx-auto">
            <Link
              to="/product/twin-ruby-sapphire-royal-necklace-set"
              className="block relative group aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[220px] min-[390px]:max-h-[240px] sm:max-h-[360px] overflow-hidden"
            >
              <img
                src="/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg"
                alt="Shiva Shakthi Collections Signature One Gram Gold Jewellery Showcase"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 filter brightness-[0.98]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-[#0A0A0C]/30 to-transparent" />

              {/* Elegant overlay caption */}
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-5 sm:left-6 sm:right-6 p-2 min-[360px]:p-2.5 sm:p-4 rounded-xl bg-[#0E0E12]/85 backdrop-blur-md border border-[#C5A059]/30 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-champagne truncate">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-champagne shrink-0" />
                    <span className="truncate">Signature Royal Showcase</span>
                  </div>
                  <h4 className="font-heading text-[#F7F5F0] font-bold text-[11px] min-[360px]:text-xs sm:text-base mt-0.5 truncate leading-tight">
                    Twin Ruby & Sapphire Heritage Sets
                  </h4>
                </div>
                <span className="px-2 min-[360px]:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#C5A059]/20 text-brand-champagne text-[9.5px] min-[360px]:text-[10px] sm:text-xs font-semibold border border-[#C5A059]/40 flex items-center gap-1 shrink-0">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5.5: 3D Circular Rotating Jewellery Showcase */}
      <SignatureCollectionShowcase
        products={allProducts}
        onSelectCategory={handleSelectCategory}
      />

      {/* SECTION 6: Product Catalogue */}
      <section id="catalogue" className="py-6 sm:py-12 bg-[#0E0E12] border-t border-white/5 scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-5 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141418] text-brand-champagne border border-[#C5A059]/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Gem className="w-3.5 h-3.5 text-brand-champagne" />
                <span>Jewellery Catalogue</span>
              </div>
              <h2 className="font-heading text-xl sm:text-3xl lg:text-4xl font-bold text-[#F7F5F0]">
                Explore Our Collection
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A29E] mt-1 max-w-2xl leading-relaxed">
                Authentic 1-gram micro gold creations photographed in our studio. Browse pieces, inspect fine craftsmanship, and order directly on WhatsApp.
              </p>
            </div>

            <Link
              to="/shop"
              className="text-xs sm:text-sm font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1 group shrink-0 min-h-[38px]"
            >
              <span>View Full Shop</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Active Category Filter Indicator */}
          {selectedCategory !== 'all' && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2 sm:p-3 rounded-xl bg-[#141418] border border-[#C5A059]/40 shadow-sm text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#A8A29E]">Active Category:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-champagne text-[#0A0A0C] font-bold shadow-sm flex items-center gap-1.5">
                  <span>
                    {CATEGORY_CAROUSEL_ITEMS.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  </span>
                </span>
                <span className="text-[#78716C] font-mono">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="font-semibold text-brand-champagne hover:text-brand-champagne-light hover:underline flex items-center gap-1 py-1 px-2 rounded"
              >
                <span>Reset to All Pieces</span>
                <span>×</span>
              </button>
            </div>
          )}

          {/* Smooth Category Filter Pills (All 15 Categories + All Pieces) */}
          <div className="w-full min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-5 sm:mb-8 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] sm:min-h-[40px] cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-brand-champagne text-[#0A0A0C] font-bold shadow-gold-sm border border-brand-champagne'
                  : 'bg-[#141418] text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-[#1A1A22] border border-white/5'
              }`}
            >
              All Pieces ({allProducts.length})
            </button>
            {CATEGORY_CAROUSEL_ITEMS.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] sm:min-h-[40px] cursor-pointer ${
                    isActive
                      ? 'bg-brand-champagne text-[#0A0A0C] font-bold shadow-gold-sm border border-brand-champagne'
                      : 'bg-[#141418] text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-[#1A1A22] border border-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Grid of Products: 2 columns on mobile, 3-4 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {filteredProducts.length === 0 && !prodsLoading ? (
              <div className="col-span-full py-14 text-center px-4 rounded-2xl bg-[#121215] border border-white/5">
                <p className="text-sm font-semibold text-[#F7F5F0] mb-1">
                  No pieces currently listed under &ldquo;
                  {CATEGORY_CAROUSEL_ITEMS.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  &rdquo;
                </p>
                <p className="text-xs text-[#A8A29E] max-w-md mx-auto mb-4">
                  New jewellery designs are regularly crafted and synchronized into this collection.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="btn-primary text-xs font-bold px-4 py-2 rounded-xl"
                >
                  View All Available Pieces
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trust & Heritage Section */}
      <section className="py-8 sm:py-14 bg-[#0A0A0C] border-y border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
            <span className="text-xs uppercase tracking-widest text-brand-champagne font-bold">
              The Shiva Shakthi Assurance
            </span>
            <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-[#F7F5F0] mt-1.5">
              Heritage Craftsmanship & Trust
            </h2>
            <div className="divider-gold mt-2.5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            <div className="p-4 sm:p-6 rounded-2xl bg-[#121215] border border-white/5 hover:border-[#C5A059]/30 transition-all">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#F7F5F0] mb-1">
                1-Gram Micro Gold
              </h3>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                Authentic micro-gold plating with real temple motifs and premium stone settings built for enduring beauty.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-[#121215] border border-white/5 hover:border-[#C5A059]/30 transition-all">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#F7F5F0] mb-1">
                Free Insured Shipping
              </h3>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                Complimentary insured express delivery across India on all jewellery orders above ₹999.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-[#121215] border border-white/5 hover:border-[#C5A059]/30 transition-all">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne mb-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#F7F5F0] mb-1">
                WhatsApp Concierge
              </h3>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                Direct personal ordering and styling guidance with our Bengaluru boutique on +91 8971263989.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-[#121215] border border-white/5 hover:border-[#C5A059]/30 transition-all">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne mb-3">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#F7F5F0] mb-1">
                3-Day Transit Cover
              </h3>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                Hassle-free replacement guarantee on any transit issues with simple unboxing video verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Fine Jewellery (Database / Supabase if available) */}
      {featured.length > 0 && (
        <section className="py-8 sm:py-14 bg-[#0E0E12] border-b border-white/5">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-5 sm:mb-8 gap-3 sm:gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-brand-champagne font-bold">
                  Handpicked Fine Pieces
                </span>
                <h2 className="font-heading text-xl sm:text-3xl font-bold text-[#F7F5F0] mt-1">
                  Featured Collections
                </h2>
              </div>
              <Link
                to="/shop?filter=featured"
                className="text-xs sm:text-sm font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1 group min-h-[38px]"
              >
                <span>View All Featured</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <ProductGrid products={featured} isLoading={featLoading} />
          </div>
        </section>
      )}

      {/* Promotional Bridal & Heritage Banner */}
      <section className="py-10 sm:py-16 bg-gradient-to-r from-[#0E0E12] via-[#141418] to-[#0E0E12] text-[#F7F5F0] relative overflow-hidden border-b border-white/5">
        <div className="container-custom relative z-10 text-center max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#C5A059]/30 text-brand-champagne text-[11px] font-semibold tracking-widest uppercase">
            <span>The Shiva Shakthi Heritage</span>
          </div>

          <h2 className="font-heading text-xl sm:text-4xl font-bold leading-tight text-[#F7F5F0]">
            Grace, Tradition & Unmatched Grandeur
          </h2>

          <p className="text-[#A8A29E] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Every piece is designed to reflect centuries of Indian artistry. We hand-select high grade stones, intricate filigree, and durable micro-gold plating that retains its brilliance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <Button to="/shop" variant="primary" size="md" className="px-5 sm:px-6 font-bold min-h-[44px]">
              Discover Bridal & Heritage
            </Button>
            <a
              href={generalWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Bridal Styling</span>
            </a>
          </div>
        </div>
      </section>

      {/* Customer Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="py-8 sm:py-14 bg-[#0A0A0C]">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-5 sm:mb-8 gap-3 sm:gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-brand-champagne font-bold">
                  Most Loved
                </span>
                <h2 className="font-heading text-xl sm:text-3xl font-bold text-[#F7F5F0] mt-1">
                  Customer Bestsellers
                </h2>
              </div>
              <Link
                to="/shop?filter=bestseller"
                className="text-xs sm:text-sm font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1 group min-h-[38px]"
              >
                <span>Shop All Bestsellers</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <ProductGrid products={bestsellers} isLoading={bestLoading} />
          </div>
        </section>
      )}
    </>
  );
}
