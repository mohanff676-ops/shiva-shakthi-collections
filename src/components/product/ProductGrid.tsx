import type { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkles } from 'lucide-react';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading = false,
  emptyTitle = 'No jewellery found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  onResetFilters,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="product-card" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-8 h-8 text-brand-gold" />}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilters ? 'Reset Filters' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
