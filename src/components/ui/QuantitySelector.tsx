import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onChange: (qty: number) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  maxQuantity = 99,
  onChange,
  className,
  size = 'md',
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onChange(quantity + 1);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        'inline-flex items-center border border-white/10 rounded-xl bg-[#141418] overflow-hidden shadow-sm min-h-[44px]',
        isSmall ? 'h-9 text-xs' : 'h-11 text-sm',
        className
      )}
    >
      <button
        type="button"
        disabled={quantity <= 1}
        onClick={handleDecrement}
        className={cn(
          'flex items-center justify-center text-[#A8A29E] hover:text-brand-champagne hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors min-w-[40px]',
          isSmall ? 'w-8 h-full' : 'w-10 h-full'
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>

      <span
        className={cn(
          'flex items-center justify-center font-bold text-[#F7F5F0] border-x border-white/10 select-none px-2',
          isSmall ? 'min-w-8 h-full text-xs' : 'min-w-10 h-full text-sm'
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        disabled={quantity >= maxQuantity}
        onClick={handleIncrement}
        className={cn(
          'flex items-center justify-center text-[#A8A29E] hover:text-brand-champagne hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors min-w-[40px]',
          isSmall ? 'w-8 h-full' : 'w-10 h-full'
        )}
        aria-label="Increase quantity"
      >
        <Plus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>
    </div>
  );
}
