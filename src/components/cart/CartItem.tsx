import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { CartItemLocal } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import toast from 'react-hot-toast';

export interface CartItemProps {
  item: CartItemLocal;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();
  const imageUrl = getPrimaryImage(item.product);

  const unitPrice = item.product.price_paise + (item.variant?.price_adjustment_paise || 0);
  const lineTotal = unitPrice * item.quantity;
  const maxStock = item.variant?.stock_quantity ?? item.product.stock_quantity;

  return (
    <div className="flex gap-4 py-4 border-b border-white/5 last:border-b-0">
      {/* Thumbnail */}
      <Link
        to={`/product/${item.product.slug}`}
        className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#141418] rounded-xl overflow-hidden border border-white/10"
      >
        <img
          src={imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover filter brightness-[0.96]"
          loading="lazy"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/product/${item.product.slug}`}
              className="text-sm font-semibold text-[#F7F5F0] hover:text-brand-champagne line-clamp-1 transition-colors"
            >
              {item.product.name}
            </Link>
            <button
              type="button"
              onClick={() => {
                removeItem(item.productId, item.variantId);
                toast.success('Item removed from shopping bag');
              }}
              className="text-[#78716C] hover:text-rose-400 p-1.5 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Remove item"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {item.variant && (
            <p className="text-xs text-[#A8A29E] mt-0.5">
              {item.variant.name}: <span className="font-medium text-[#F7F5F0]">{item.variant.value}</span>
            </p>
          )}

          <p className="text-xs text-[#78716C] mt-1">{formatPrice(unitPrice)} each</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <QuantitySelector
            size="sm"
            quantity={item.quantity}
            maxQuantity={maxStock}
            onChange={(newQty) => updateQuantity(item.productId, item.variantId, newQty)}
          />

          <span className="text-sm font-bold text-brand-champagne">{formatPrice(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}
