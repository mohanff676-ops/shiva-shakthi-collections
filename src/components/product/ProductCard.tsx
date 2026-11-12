import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { getPrimaryImage } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { hasItem, toggleItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = hasItem(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const initialImage = getPrimaryImage(product);
  const [imgSrc, setImgSrc] = useState(initialImage);

  return (
    <div className="product-card group flex flex-col justify-between h-full bg-[#121215] rounded-2xl border border-[#26221A] hover:border-[#C5A059]/60 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Top Image area with locked aspect-[4/5] */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0A0A0C] rounded-t-2xl">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Subtle Dark Vignette on Bottom of Image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121215]/80 to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.id.startsWith('ssc-preview-') && (
            <span className="badge bg-[#C5A059]/20 text-[#DFBE76] border border-[#C5A059]/40 text-[9px] sm:text-[10px] tracking-wider uppercase font-bold shadow-sm backdrop-blur-md">
              Catalogue Preview
            </span>
          )}
          {product.is_new_arrival && (
            <span className="badge badge-maroon text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold shadow-sm backdrop-blur-md">
              New
            </span>
          )}
          {product.compare_at_price_paise && product.compare_at_price_paise > product.price_paise && (
            <span className="badge badge-gold text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold shadow-sm backdrop-blur-md">
              Sale
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3 py-1.5 bg-[#1E1E24] text-[#DFBE76] border border-[#C5A059]/40 text-xs font-semibold rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => toggleItem(product.id)}
          className={`absolute top-2 right-2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 backdrop-blur-md border border-[#2A2722] shadow flex items-center justify-center transition-all z-20 ${
            isWishlisted ? 'text-[#DFBE76] fill-[#DFBE76]' : 'text-[#A8A29E] hover:text-[#DFBE76] hover:bg-black/90'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-[#DFBE76]' : ''}`} />
        </button>

        {/* Quick Add to Cart button (Hover on desktop, prominent button on mobile) */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={() => addItem(product)}
            className="absolute bottom-2 left-2 right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 min-h-[36px] sm:min-h-[40px] py-1.5 sm:py-2 px-2 sm:px-3 bg-[#0A0A0C]/90 hover:bg-[#C5A059] text-[#F7F5F0] hover:text-[#0A0A0C] border border-[#C5A059]/40 hover:border-[#C5A059] text-[10px] sm:text-xs font-semibold tracking-wider uppercase rounded-xl backdrop-blur-md shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 z-20"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        )}
      </div>

      {/* Content Info */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-2.5">
        <div>
          {product.category?.name && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#C5A059] mb-1 block truncate">
              {product.category.name}
            </span>
          )}
          <Link
            to={`/product/${product.slug}`}
            className="font-medium text-xs sm:text-sm text-[#F7F5F0] hover:text-[#DFBE76] transition-colors line-clamp-1 leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        <div className="pt-1.5 sm:pt-2 border-t border-[#1F1D19] flex items-baseline justify-between">
          <PriceDisplay
            pricePaise={product.price_paise}
            compareAtPricePaise={product.compare_at_price_paise}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
