import type { SortOption } from '@/types';

export interface ProductSortProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

export function ProductSort({ value, onChange }: ProductSortProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="text-xs sm:text-sm text-[#A8A29E] whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="product-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="text-xs sm:text-sm bg-[#141418] border border-white/10 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] font-medium cursor-pointer shadow-sm min-h-[44px]"
      >
        <option value="newest" className="bg-[#121215] text-[#F7F5F0]">Newest Arrivals</option>
        <option value="popular" className="bg-[#121215] text-[#F7F5F0]">Bestsellers & Popular</option>
        <option value="price-low" className="bg-[#121215] text-[#F7F5F0]">Price: Low to High</option>
        <option value="price-high" className="bg-[#121215] text-[#F7F5F0]">Price: High to Low</option>
        <option value="name-asc" className="bg-[#121215] text-[#F7F5F0]">Alphabetical (A - Z)</option>
        <option value="name-desc" className="bg-[#121215] text-[#F7F5F0]">Alphabetical (Z - A)</option>
      </select>
    </div>
  );
}
