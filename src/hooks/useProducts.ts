import { useQuery } from '@tanstack/react-query';
import type { Product, FilterState } from '@/types';
import { PRODUCTS_PER_PAGE } from '@/lib/constants';
import { getVisiblePreviewProducts } from '@/data/previewProducts';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isValidUUID } from '@/lib/utils';

interface ProductsQueryResult {
  products: Product[];
  totalCount: number;
}

/** In-memory query and filter engine for local preview fallback */
function filterPreviewProducts(
  filters?: Partial<FilterState> & { page?: number; pageSize?: number; filter?: string }
): ProductsQueryResult {
  let list = [...getVisiblePreviewProducts()];

  // Category filter
  if (filters?.categoryId) {
    list = list.filter(
      (p) => p.category_id === filters.categoryId || p.category?.slug === filters.categoryId
    );
  }

  // Text search
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.short_description && p.short_description.toLowerCase().includes(s)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(s)))
    );
  }

  // Price range
  if (filters?.priceRange) {
    const [min, max] = filters.priceRange;
    if (min > 0) list = list.filter((p) => p.price_paise >= min);
    if (max > 0) list = list.filter((p) => p.price_paise <= max);
  }

  // Stock filter
  if (filters?.inStock) {
    list = list.filter((p) => p.stock_quantity > 0);
  }

  // Filter param from URL (e.g. ?filter=new-arrivals or ?filter=bestseller)
  if (filters?.filter === 'new-arrivals') {
    list = list.filter((p) => p.is_new_arrival);
  } else if (filters?.filter === 'bestseller') {
    list = list.filter((p) => p.is_bestseller);
  } else if (filters?.filter === 'featured') {
    list = list.filter((p) => p.is_featured);
  }

  // Sort
  switch (filters?.sortBy) {
    case 'price-low':
      list.sort((a, b) => a.price_paise - b.price_paise);
      break;
    case 'price-high':
      list.sort((a, b) => b.price_paise - a.price_paise);
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'popular':
      list.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
      break;
    case 'newest':
    default:
      break;
  }

  const totalCount = list.length;
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || PRODUCTS_PER_PAGE;
  const from = (page - 1) * pageSize;
  const paginated = list.slice(from, from + pageSize);

  return {
    products: paginated,
    totalCount,
  };
}

// Attach category object helper
function attachCategory(p: any): Product {
  const cat = DEFAULT_CATEGORIES.find(
    (c) => c.id === p.category_id || c.slug === p.category_id
  );
  return {
    ...p,
    category: cat,
  };
}

export function useProducts(
  filters?: Partial<FilterState> & { page?: number; pageSize?: number; filter?: string }
) {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || PRODUCTS_PER_PAGE;

  return useQuery<ProductsQueryResult>({
    queryKey: ['products', filters, page, pageSize],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return filterPreviewProducts(filters);
      }

      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('is_published', true)
          .is('deleted_at', null);

        if (filters?.categoryId) {
          query = query.eq('category_id', filters.categoryId);
        }

        if (filters?.search && filters.search.trim()) {
          query = query.ilike('name', `%${filters.search.trim()}%`);
        }

        if (filters?.priceRange) {
          const [min, max] = filters.priceRange;
          if (min > 0) query = query.gte('price_paise', min);
          if (max > 0) query = query.lte('price_paise', max);
        }

        if (filters?.inStock) {
          query = query.gt('stock_quantity', 0);
        }

        if (filters?.filter === 'new-arrivals') {
          query = query.eq('is_new_arrival', true);
        } else if (filters?.filter === 'bestseller') {
          query = query.eq('is_bestseller', true);
        } else if (filters?.filter === 'featured') {
          query = query.eq('is_featured', true);
        }

        // Sorting
        switch (filters?.sortBy) {
          case 'price-low':
            query = query.order('price_paise', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price_paise', { ascending: false });
            break;
          case 'name-asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name-desc':
            query = query.order('name', { ascending: false });
            break;
          case 'popular':
            query = query.order('is_bestseller', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        let { data, count, error } = await query;

        // If remote table lacks deleted_at column (Postgres 42703), retry gracefully without it
        if (error && (error as any).code === '42703') {
          let retryQuery = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('is_published', true);

          if (filters?.categoryId) {
            retryQuery = retryQuery.eq('category_id', filters.categoryId);
          }

          if (filters?.search && filters.search.trim()) {
            retryQuery = retryQuery.ilike('name', `%${filters.search.trim()}%`);
          }

          if (filters?.priceRange) {
            const [min, max] = filters.priceRange;
            if (min > 0) retryQuery = retryQuery.gte('price_paise', min);
            if (max > 0) retryQuery = retryQuery.lte('price_paise', max);
          }

          if (filters?.inStock) {
            retryQuery = retryQuery.gt('stock_quantity', 0);
          }

          if (filters?.filter === 'new-arrivals') {
            retryQuery = retryQuery.eq('is_new_arrival', true);
          } else if (filters?.filter === 'bestseller') {
            retryQuery = retryQuery.eq('is_bestseller', true);
          } else if (filters?.filter === 'featured') {
            retryQuery = retryQuery.eq('is_featured', true);
          }

          switch (filters?.sortBy) {
            case 'price-low':
              retryQuery = retryQuery.order('price_paise', { ascending: true });
              break;
            case 'price-high':
              retryQuery = retryQuery.order('price_paise', { ascending: false });
              break;
            case 'name-asc':
              retryQuery = retryQuery.order('name', { ascending: true });
              break;
            case 'name-desc':
              retryQuery = retryQuery.order('name', { ascending: false });
              break;
            case 'popular':
              retryQuery = retryQuery.order('is_bestseller', { ascending: false });
              break;
            case 'newest':
            default:
              retryQuery = retryQuery.order('created_at', { ascending: false });
              break;
          }

          const res = await retryQuery.range(from, to);
          data = res.data;
          count = res.count;
          error = res.error;
        }

        // Only fall back to preview if there was an actual database query error
        if (error) {
          console.warn('[useProducts] DB query error, falling back to preview:', error.message);
          return filterPreviewProducts(filters);
        }

        // Return exact database result (even if 0 items, without resurrecting deleted items)
        return {
          products: (data || []).map(attachCategory),
          totalCount: count ?? (data?.length || 0),
        };
      } catch (err) {
        console.warn('[useProducts] DB query failed, falling back to preview:', err);
        return filterPreviewProducts(filters);
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useProduct(slug: string) {
  return useQuery<Product | null>({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) return null;

      if (isSupabaseConfigured) {
        try {
          const baseQuery = supabase
            .from('products')
            .select('*')
            .is('deleted_at', null);

          let { data, error } = isValidUUID(slug)
            ? await baseQuery.or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle()
            : await baseQuery.eq('slug', slug).maybeSingle();

          if (error && (error as any).code === '42703') {
            const retryQuery = supabase.from('products').select('*');
            const res = isValidUUID(slug)
              ? await retryQuery.or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle()
              : await retryQuery.eq('slug', slug).maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (!error) {
            // Database query succeeded. If null, the product was deleted and does not exist!
            return data ? attachCategory(data) : null;
          }
        } catch (err) {
          console.warn('[useProduct] Supabase fetch fallback to preview:', err);
        }
      }

      const match = getVisiblePreviewProducts().find(
        (p) => p.slug === slug || p.id === slug
      );
      return match || null;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 30,
  });
}

export function useFeaturedProducts(limitCount = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'featured', limitCount],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .is('deleted_at', null)
            .eq('is_featured', true)
            .limit(limitCount);

          if (error && (error as any).code === '42703') {
            const res = await supabase
              .from('products')
              .select('*')
              .eq('is_published', true)
              .eq('is_featured', true)
              .limit(limitCount);
            data = res.data;
            error = res.error;
          }

          if (!error) {
            return (data || []).map(attachCategory);
          }
        } catch (err) {
          console.warn('[useFeaturedProducts] Supabase fetch fallback to preview:', err);
        }
      }

      return getVisiblePreviewProducts().filter((p) => p.is_featured).slice(0, limitCount);
    },
    staleTime: 1000 * 30,
  });
}

export function useNewArrivals(limitCount = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'new-arrivals', limitCount],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .is('deleted_at', null)
            .eq('is_new_arrival', true)
            .limit(limitCount);

          if (error && (error as any).code === '42703') {
            const res = await supabase
              .from('products')
              .select('*')
              .eq('is_published', true)
              .eq('is_new_arrival', true)
              .limit(limitCount);
            data = res.data;
            error = res.error;
          }

          if (!error) {
            return (data || []).map(attachCategory);
          }
        } catch (err) {
          console.warn('[useNewArrivals] Supabase fetch fallback to preview:', err);
        }
      }

      return getVisiblePreviewProducts().filter((p) => p.is_new_arrival).slice(0, limitCount);
    },
    staleTime: 1000 * 30,
  });
}

export function useBestsellers(limitCount = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'bestsellers', limitCount],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .is('deleted_at', null)
            .eq('is_bestseller', true)
            .limit(limitCount);

          if (error && (error as any).code === '42703') {
            const res = await supabase
              .from('products')
              .select('*')
              .eq('is_published', true)
              .eq('is_bestseller', true)
              .limit(limitCount);
            data = res.data;
            error = res.error;
          }

          if (!error) {
            return (data || []).map(attachCategory);
          }
        } catch (err) {
          console.warn('[useBestsellers] Supabase fetch fallback to preview:', err);
        }
      }

      return getVisiblePreviewProducts().filter((p) => p.is_bestseller).slice(0, limitCount);
    },
    staleTime: 1000 * 30,
  });
}

export function useRelatedProducts(categoryId?: string | null, currentProductId?: string, limitCount = 4) {
  return useQuery<Product[]>({
    queryKey: ['products', 'related', categoryId, currentProductId, limitCount],
    queryFn: async () => {
      if (isSupabaseConfigured && categoryId) {
        try {
          let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .is('deleted_at', null)
            .eq('category_id', categoryId)
            .neq('id', currentProductId || '')
            .limit(limitCount);

          if (error && (error as any).code === '42703') {
            const res = await supabase
              .from('products')
              .select('*')
              .eq('is_published', true)
              .eq('category_id', categoryId)
              .neq('id', currentProductId || '')
              .limit(limitCount);
            data = res.data;
            error = res.error;
          }

          if (!error) {
            return (data || []).map(attachCategory);
          }
        } catch (err) {
          console.warn('[useRelatedProducts] Supabase fetch fallback:', err);
        }
      }

      return getVisiblePreviewProducts().filter(
        (p) => p.id !== currentProductId && (p.category_id === categoryId || !categoryId)
      ).slice(0, limitCount);
    },
    staleTime: 1000 * 30,
  });
}

export function useSearchProducts(searchQuery: string) {
  return useQuery<Product[]>({
    queryKey: ['products', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const s = searchQuery.toLowerCase().trim();

      if (isSupabaseConfigured) {
        try {
          let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .is('deleted_at', null)
            .ilike('name', `%${s}%`)
            .limit(8);

          if (error && (error as any).code === '42703') {
            const res = await supabase
              .from('products')
              .select('*')
              .eq('is_published', true)
              .ilike('name', `%${s}%`)
              .limit(8);
            data = res.data;
            error = res.error;
          }

          if (!error) {
            return (data || []).map(attachCategory);
          }
        } catch (err) {
          console.warn('[useSearchProducts] Supabase fetch fallback:', err);
        }
      }

      return getVisiblePreviewProducts().filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(s))) ||
          p.category?.name.toLowerCase().includes(s)
      );
    },
    enabled: Boolean(searchQuery.trim()),
    staleTime: 1000 * 30,
  });
}
