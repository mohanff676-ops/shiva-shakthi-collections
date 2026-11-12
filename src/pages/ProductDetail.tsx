import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBag, Truck, ShieldCheck, Share2, Sparkles, MessageCircle } from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductGrid } from '@/components/product/ProductGrid';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import {
  buildSingleProductWhatsAppMessage,
  buildOutOfStockInquiryWhatsAppMessage,
  createWhatsAppUrl,
} from '@/lib/whatsapp';
import type { ProductVariant } from '@/types';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: related = [] } = useRelatedProducts(product?.category_id, product?.id, 4);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const { hasItem, toggleItem } = useWishlistStore();

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-[#F7F5F0] mb-2">Product Not Found</h2>
        <p className="text-[#A8A29E] mb-6">The jewellery piece you are looking for is no longer available.</p>
        <Button to="/shop" variant="primary">Explore Collections</Button>
      </div>
    );
  }

  const isWishlisted = hasItem(product.id);
  const isOutOfStock = product.stock_quantity <= 0;
  const currentPricePaise = product.price_paise + (selectedVariant?.price_adjustment_paise || 0);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    toast.success('Added to cart!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const orderMessage = isOutOfStock
    ? buildOutOfStockInquiryWhatsAppMessage(
        product,
        selectedVariant,
        typeof window !== 'undefined' ? window.location.href : ''
      )
    : buildSingleProductWhatsAppMessage(
        product,
        selectedVariant,
        quantity,
        typeof window !== 'undefined' ? window.location.href : ''
      );
  const orderWhatsappUrl = createWhatsAppUrl(WHATSAPP_NUMBER, orderMessage);

  return (
    <>
      <Helmet>
        <title>{product.meta_title || `${product.name} — ${APP_NAME}`}</title>
        <meta name="description" content={product.meta_description || product.short_description || ''} />
      </Helmet>

      <div className="container-custom py-6">
        <Breadcrumb
          items={[
            { label: 'Shop', href: '/shop' },
            ...(product.category ? [{ label: product.category.name, href: `/shop?category=${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pt-4 pb-16">
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <Link
                  to={`/shop?category=${product.category.slug}`}
                  className="text-xs uppercase font-bold tracking-widest text-brand-champagne hover:underline"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F5F0] mt-1.5">
                {product.name}
              </h1>

              {product.sku && (
                <p className="text-xs text-[#78716C] mt-1 font-mono">SKU: {product.sku}</p>
              )}
            </div>

            {/* Price */}
            <div className="pt-2">
              <PriceDisplay
                pricePaise={currentPricePaise}
                compareAtPricePaise={product.compare_at_price_paise}
                size="lg"
              />
              <p className="text-xs text-[#A8A29E] mt-1">Inclusive of all taxes. Free insured delivery over ₹999.</p>
            </div>

            {product.short_description && (
              <p className="text-sm text-[#A8A29E] leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Catalogue Preview Disclaimer */}
            {product.id.startsWith('ssc-preview-') && (
              <div className="p-4 rounded-xl bg-[#141418] border border-[#C5A059]/30 text-[#DFBE76] text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-champagne">Authentic Studio Preview Piece</p>
                  <p className="text-[#A8A29E] mt-0.5 leading-relaxed">
                    This is an authentic Shiva Shakthi Collections jewellery design. Price and stock shown are temporary catalogue placeholders. Connect directly on WhatsApp for live stock confirmation or custom orders.
                  </p>
                </div>
              </div>
            )}

            {/* Variants if any */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="block text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                  Select Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-brand-champagne bg-[#C5A059]/15 text-brand-champagne font-bold shadow-gold-sm'
                            : 'border-white/10 text-[#A8A29E] hover:border-white/25 hover:text-[#F7F5F0] bg-[#141418]'
                        }`}
                      >
                        {v.name}: {v.value}
                        {v.price_adjustment_paise > 0 && ` (+${formatPrice(v.price_adjustment_paise)})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                  Quantity:
                </span>
                <QuantitySelector
                  quantity={quantity}
                  maxQuantity={selectedVariant?.stock_quantity ?? product.stock_quantity}
                  onChange={setQuantity}
                />
                <span className="text-xs">
                  {product.stock_quantity > 0 ? (
                    <span className="text-emerald-400 font-medium">In Stock</span>
                  ) : (
                    <span className="text-rose-400 font-medium">Out of Stock</span>
                  )}
                </span>
              </div>

              {/* Action Buttons: Add to Bag & Order on WhatsApp */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    size="lg"
                    variant="primary"
                    className="flex-1 flex items-center justify-center gap-2 font-bold min-h-[48px]"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleItem(product.id)}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] ${
                      isWishlisted
                        ? 'border-brand-champagne bg-[#C5A059]/15 text-brand-champagne'
                        : 'border-white/10 bg-[#141418] text-[#A8A29E] hover:border-brand-champagne hover:text-brand-champagne'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-12 h-12 rounded-xl border border-white/10 bg-[#141418] text-[#A8A29E] hover:border-brand-champagne hover:text-brand-champagne flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Direct Order / Inquiry on WhatsApp Button */}
                <a
                  href={orderWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] min-h-[48px] ${
                    isOutOfStock
                      ? 'bg-amber-600 hover:bg-amber-500 border border-amber-400/40'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                  <span>
                    {isOutOfStock
                      ? 'Inquire Restock on WhatsApp (Piece Out of Stock)'
                      : 'Order on WhatsApp (Instant Concierge)'}
                  </span>
                </a>

                {/* Honest Order Transparency Notice */}
                <div className="p-4 rounded-xl bg-[#121215] border border-white/5 text-[11px] text-[#A8A29E] space-y-1.5">
                  <p className="font-bold text-[#F7F5F0] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-champagne shrink-0" />
                    <span>{isOutOfStock ? 'Out of Stock Inquiries:' : 'How WhatsApp Ordering Works:'}</span>
                  </p>
                  <p className="leading-relaxed">
                    {isOutOfStock ? (
                      <>
                        This piece is currently <strong className="text-amber-400">Out of Stock</strong>. Tapping above opens WhatsApp with the piece details pre-filled so Shiva Shakthi Collections can notify you when fresh inventory arrives or arrange custom crafting.
                      </>
                    ) : (
                      <>
                        Tapping <strong className="text-white">Order on WhatsApp</strong> opens WhatsApp with your jewellery piece details pre-filled. You will press Send. Shiva Shakthi Collections will confirm live stock, assist with customization or video verification, and coordinate payment directly with you.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Assurances */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 text-xs text-[#A8A29E]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-champagne" />
                <span>Express Insured Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-champagne" />
                <span>Authentic Hallmark Quality</span>
              </div>
            </div>

            {/* Product Details Specs */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <h3 className="font-heading font-bold text-base text-[#F7F5F0]">
                Product Details
              </h3>
              <div className="divide-y divide-white/5 text-xs">
                {product.material && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#78716C]">Material & Polish</span>
                    <span className="font-medium text-[#F7F5F0]">{product.material}</span>
                  </div>
                )}
                {product.weight_grams && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#78716C]">Approx. Weight</span>
                    <span className="font-medium text-[#F7F5F0]">{product.weight_grams} grams</span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="pt-2 text-sm text-[#A8A29E] leading-relaxed space-y-2 whitespace-pre-line">
                  {product.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="pt-12 pb-8 border-t border-white/5">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest text-brand-champagne font-bold">
                Complete Your Look
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#F7F5F0] mt-1">
                You May Also Admire
              </h2>
            </div>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}
