import { formatPrice, getDiscountPercent, cn } from '@/lib/utils';

export interface PriceDisplayProps {
  pricePaise: number;
  compareAtPricePaise?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ pricePaise, compareAtPricePaise, className, size = 'md' }: PriceDisplayProps) {
  const hasDiscount = Boolean(compareAtPricePaise && compareAtPricePaise > pricePaise);
  const discountPercent = hasDiscount ? getDiscountPercent(pricePaise, compareAtPricePaise!) : 0;

  const currentSizeClass = {
    sm: 'text-sm sm:text-base font-semibold',
    md: 'text-lg sm:text-xl font-bold',
    lg: 'text-2xl sm:text-3xl font-bold font-heading',
  }[size];

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn('text-[#F7F5F0]', currentSizeClass)}>
        {formatPrice(pricePaise)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs sm:text-sm text-[#78716C] line-through font-normal">
            {formatPrice(compareAtPricePaise!)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded bg-[#C5A059]/15 text-[#DFBE76] border border-[#C5A059]/30">
            {discountPercent}% OFF
          </span>
        </>
      )}
    </div>
  );
}
