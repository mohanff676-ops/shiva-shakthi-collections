import { useState } from 'react';
import type { ProductImage } from '@/types';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
}

export function ProductGallery({ images = [], productName }: ProductGalleryProps) {
  const sortedImages = images.length > 0
    ? [...images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)
    : [{ id: 'placeholder', url: PLACEHOLDER_IMAGE, alt_text: productName, is_primary: true, sort_order: 0, product_id: '', created_at: '' }];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = sortedImages[activeIndex] || sortedImages[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] shrink-0 py-1 no-scrollbar">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 min-h-[44px] min-w-[44px] ${
                activeIndex === idx
                  ? 'border-brand-champagne shadow-gold-sm ring-1 ring-[#C5A059]/40'
                  : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover filter brightness-[0.96]"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="flex-1 aspect-[4/5] sm:aspect-square bg-[#121215] rounded-2xl overflow-hidden border border-white/5 relative shadow-luxury group">
        <img
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-[0.98]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
