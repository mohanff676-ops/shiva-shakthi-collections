import type { Category, FilterState } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export interface ProductFiltersProps {
  categories: Category[];
  filters: Partial<FilterState>;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
}

const PRICE_TIERS: Array<{ label: string; range: [number, number] }> = [
  { label: 'All Prices', range: [0, 0] },
  { label: 'Under ₹2,000', range: [0, 200000] },
  { label: '₹2,000 — ₹3,500', range: [200000, 350000] },
  { label: '₹3,500 — ₹5,000', range: [350000, 500000] },
  { label: 'Above ₹5,000', range: [500000, 0] },
];

export function ProductFilters({ categories, filters, onFilterChange, onReset }: ProductFiltersProps) {
  const currentCategory = filters.categoryId || null;
  const inStockOnly = Boolean(filters.inStock);
  const currentRange = filters.priceRange || [0, 0];

  const isTierActive = (tierRange: [number, number]) => {
    return currentRange[0] === tierRange[0] && currentRange[1] === tierRange[1];
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h4 className="font-heading text-xs font-bold text-[#F7F5F0] uppercase tracking-wider mb-3">
          Categories
        </h4>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            onClick={() => onFilterChange({ categoryId: null })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors min-h-[40px] ${
              !currentCategory
                ? 'bg-brand-champagne text-[#0A0A0C] font-bold shadow-gold-sm'
                : 'text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-white/5'
            }`}
          >
            All Jewellery
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange({ categoryId: cat.id })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors min-h-[40px] ${
                currentCategory === cat.id
                  ? 'bg-brand-champagne text-[#0A0A0C] font-bold shadow-gold-sm'
                  : 'text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-white/5">
        <h4 className="font-heading text-xs font-bold text-[#F7F5F0] uppercase tracking-wider mb-3">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {PRICE_TIERS.map((tier) => (
            <button
              key={tier.label}
              type="button"
              onClick={() => onFilterChange({ priceRange: tier.range })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between min-h-[38px] ${
                isTierActive(tier.range)
                  ? 'bg-[#C5A059]/15 border border-[#C5A059] text-brand-champagne font-bold'
                  : 'text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tier.label}</span>
              {isTierActive(tier.range) && <span className="w-1.5 h-1.5 rounded-full bg-brand-champagne" />}
            </button>
          ))}
        </div>
      </div>

      {/* Stock availability */}
      <div className="pt-4 border-t border-white/5">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-[#A8A29E] hover:text-[#F7F5F0]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onFilterChange({ inStock: e.target.checked })}
            className="w-4 h-4 rounded text-brand-champagne focus:ring-[#C5A059]/40 border-white/20 bg-[#141418] accent-[#C5A059]"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-2">
        <Button variant="outline" size="sm" onClick={onReset} className="w-full text-xs min-h-[40px]">
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}
