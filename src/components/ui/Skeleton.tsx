import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'product-card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rect', width, height }: SkeletonProps) {
  if (variant === 'product-card') {
    return (
      <div className={cn('bg-[#121215] border border-white/5 rounded-2xl shadow-luxury overflow-hidden p-3 space-y-3', className)}>
        <div className="aspect-[4/5] bg-white/[0.04] rounded-xl animate-pulse" />
        <div className="h-4 bg-white/[0.06] rounded animate-pulse w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded animate-pulse w-1/2" />
        <div className="h-5 bg-white/[0.06] rounded animate-pulse w-1/3 pt-1" />
      </div>
    );
  }

  const variantClass = {
    text: 'h-4 bg-white/[0.06] rounded animate-pulse',
    circle: 'rounded-full bg-white/[0.06] animate-pulse',
    rect: 'bg-white/[0.06] rounded-lg animate-pulse',
    card: 'bg-[#121215] border border-white/5 rounded-2xl p-4 animate-pulse',
  }[variant];

  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      className={cn(variantClass, className)}
    />
  );
}
