import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, Search } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductSort } from '@/components/product/ProductSort';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { SortOption } from '@/types';

export default function Shop() {
  const { category: routeCategory } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const categorySlug = routeCategory || searchParams.get('category');
  const searchParam = searchParams.get('search') || '';
  const filterParam = searchParams.get('filter') || undefined;

  const { data: categories = [] } = useCategories();
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [page, setPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync category or sort changes to reset page to 1
  useEffect(() => {
    setPage(1);
  }, [categorySlug, searchParam, sortBy, inStockOnly, priceRange, filterParam]);

  // Sync external searchParam updates
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounced search input handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchParam) {
        if (searchInput.trim()) {
          searchParams.set('search', searchInput.trim());
        } else {
          searchParams.delete('search');
        }
        setSearchParams(searchParams);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, searchParam, searchParams, setSearchParams]);

  const { data, isLoading } = useProducts({
    categoryId: activeCategory?.id || categorySlug || undefined,
    search: searchParam,
    priceRange: priceRange[0] > 0 || priceRange[1] > 0 ? priceRange : undefined,
    sortBy,
    inStock: inStockOnly,
    filter: filterParam,
    page,
    pageSize: 12,
  });

  const products = data?.products || [];
  const totalCount = data?.totalCount || 0;

  const handleResetFilters = () => {
    setSearchParams({});
    setInStockOnly(false);
    setPriceRange([0, 0]);
    setSearchInput('');
    setSortBy('newest');
    setPage(1);
    setIsMobileFiltersOpen(false);
  };

  const pageTitle = activeCategory
    ? `${activeCategory.name} — ${APP_NAME}`
    : searchParam
    ? `Search Results for "${searchParam}" — ${APP_NAME}`
    : `All Jewellery — ${APP_NAME}`;

  const headingText = activeCategory
    ? activeCategory.name
    : searchParam
    ? `Search: "${searchParam}"`
    : filterParam === 'new-arrivals'
    ? 'New Arrivals'
    : filterParam === 'bestseller'
    ? 'Bestsellers'
    : 'All Jewellery';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div className="container-custom py-6">
        <Breadcrumb
          items={[
            { label: 'Shop', href: '/shop' },
            ...(activeCategory ? [{ label: activeCategory.name }] : []),
          ]}
        />

        {/* Page Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F5F0]">
              {headingText}
            </h1>
            <p className="text-xs text-[#A8A29E] mt-1">
              Showing {products.length} of {totalCount} authentic pieces
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick in-page search bar */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter by name..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] shadow-sm min-h-[44px]"
              />
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-3.5" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-2.5 text-[#78716C] hover:text-[#F7F5F0] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-brand-champagne bg-[#141418] hover:bg-[#1A1A22] shadow-sm min-h-[44px]"
            >
              <Filter className="w-4 h-4 text-brand-champagne" />
              <span>Filters</span>
            </button>

            <ProductSort value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 bg-[#121215] p-5 rounded-2xl border border-white/5 shadow-luxury">
              <ProductFilters
                categories={categories}
                filters={{
                  categoryId: activeCategory?.id,
                  inStock: inStockOnly,
                  priceRange,
                }}
                onFilterChange={(newFilters) => {
                  if (newFilters.categoryId !== undefined) {
                    if (newFilters.categoryId === null) {
                      searchParams.delete('category');
                    } else {
                      const matched = categories.find((c) => c.id === newFilters.categoryId);
                      if (matched) searchParams.set('category', matched.slug);
                    }
                    setSearchParams(searchParams);
                  }
                  if (newFilters.inStock !== undefined) {
                    setInStockOnly(newFilters.inStock);
                  }
                  if (newFilters.priceRange !== undefined) {
                    setPriceRange(newFilters.priceRange);
                  }
                }}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-8">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onResetFilters={handleResetFilters}
              emptyTitle="No jewellery matches your selection"
              emptyDescription="Try clearing your filters or searching for another piece."
            />

            <Pagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={12}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative ml-auto w-4/5 max-w-sm bg-[#0E0E12] h-full p-6 shadow-2xl flex flex-col z-10 overflow-y-auto border-l border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="font-heading font-bold text-lg text-brand-champagne">Filters</h3>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 text-[#A8A29E] hover:text-[#F7F5F0] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProductFilters
              categories={categories}
              filters={{
                categoryId: activeCategory?.id,
                inStock: inStockOnly,
                priceRange,
              }}
              onFilterChange={(newFilters) => {
                if (newFilters.categoryId !== undefined) {
                  if (newFilters.categoryId === null) {
                    searchParams.delete('category');
                  } else {
                    const matched = categories.find((c) => c.id === newFilters.categoryId);
                    if (matched) searchParams.set('category', matched.slug);
                  }
                  setSearchParams(searchParams);
                }
                if (newFilters.inStock !== undefined) {
                  setInStockOnly(newFilters.inStock);
                }
                if (newFilters.priceRange !== undefined) {
                  setPriceRange(newFilters.priceRange);
                }
                setIsMobileFiltersOpen(false);
              }}
              onReset={handleResetFilters}
            />
          </div>
        </div>
      )}
    </>
  );
}
