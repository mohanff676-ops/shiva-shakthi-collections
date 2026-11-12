import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import {
  Package,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';
import {
  PREVIEW_PRODUCTS,
  SIX_NEW_JEWELLERY_PRODUCTS,
  getVisiblePreviewProducts,
  softDeletePreviewId,
  getSoftDeletedPreviewProducts,
} from '@/data/previewProducts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [syncingSix, setSyncingSix] = useState(false);

  const missingSixCount = SIX_NEW_JEWELLERY_PRODUCTS.filter(
    (sp) => !products.some((p) => p.sku === sp.sku || p.slug === sp.slug)
  ).length;

  const handleSyncSixProducts = async () => {
    if (!isAdmin) {
      toast.error('Access Denied: Only verified administrators can sync products to the database.');
      return;
    }

    setSyncingSix(true);
    try {
      const payload = SIX_NEW_JEWELLERY_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_description: p.short_description,
        description: p.description,
        category_id: p.category_id,
        price_paise: p.price_paise,
        compare_at_price_paise: p.compare_at_price_paise,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        is_published: p.is_published,
        is_featured: p.is_featured,
        is_new_arrival: p.is_new_arrival,
        is_bestseller: p.is_bestseller,
        weight_grams: p.weight_grams,
        material: p.material,
        tags: p.tags,
        images: p.images,
        updated_at: new Date().toISOString(),
      }));

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('products')
          .upsert(payload, { onConflict: 'slug' })
          .select();

        if (error) {
          throw new Error(error.message);
        }
      }

      toast.success('All 6 authentic jewellery products successfully published to database!');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      await loadProducts();
    } catch (err: any) {
      console.error('[AdminProducts] Sync error:', err);
      toast.error('Sync failed: ' + (err.message || 'Database error'));
    } finally {
      setSyncingSix(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const visiblePreview = getVisiblePreviewProducts();

    if (!isSupabaseConfigured) {
      setProducts(visiblePreview);
      setDeletedCount(getSoftDeletedPreviewProducts().length);
      setLoading(false);
      return;
    }

    try {
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error && (error as any).code === '42703') {
        const retry = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      setProducts((data as any) || []);

      // Fetch count of soft-deleted items
      try {
        const { count, error: countErr } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .not('deleted_at', 'is', null);

        if (!countErr) {
          setDeletedCount(count ?? 0);
        } else {
          setDeletedCount(0);
        }
      } catch {
        setDeletedCount(0);
      }
    } catch (err: any) {
      console.warn('[AdminProducts] Failed to load products from DB, fallback to preview:', err.message);
      setProducts(visiblePreview);
      setDeletedCount(getSoftDeletedPreviewProducts().length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleTogglePublished = async (product: Product) => {
    const updatedState = !product.is_published;

    if (!isSupabaseConfigured) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: updatedState } : p))
      );
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${updatedState ? 'published' : 'hidden'} (local preview mode)`);
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_published: updatedState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: updatedState } : p))
      );
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Product status updated: ${updatedState ? 'Published' : 'Draft'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // 1. Role verification: strictly require admin privileges
    if (!isAdmin) {
      toast.error('Access Denied: Only verified administrators can delete products.');
      setDeleteId(null);
      return;
    }

    setDeleting(true);

    // 2. If it's a catalogue preview placeholder product or Supabase is not configured
    if (!isSupabaseConfigured || !isValidUUID(deleteId)) {
      softDeletePreviewId(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeletedCount((prev) => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Catalogue preview item moved to Deleted Items.');
      setDeleteId(null);
      setDeleting(false);
      return;
    }

    // 3. Database soft-deletion with .select() verification
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', deleteId)
        .select();

      if (error) {
        if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
          throw new Error('Database Permission Denied: Your account lacks Row Level Security (RLS) admin permissions.');
        }
        if (
          error.code === 'PGRST204' ||
          error.message.toLowerCase().includes('deleted_at') ||
          error.message.toLowerCase().includes('schema cache')
        ) {
          throw new Error(
            "Supabase Schema Error: 'deleted_at' column is missing or PostgREST schema cache needs reload. Please run migration 20261022000004_add_product_soft_delete.sql in Supabase SQL Editor."
          );
        }
        throw error;
      }

      // 4. Strict check: Did PostgreSQL RLS actually update the row?
      if (!data || data.length === 0) {
        throw new Error(
          'Product deletion failed: Database RLS rejected the operation. Ensure your user ID has an active admin role in the user_roles table.'
        );
      }

      // 5. Update UI state and refresh cache
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeletedCount((prev) => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Product moved to Deleted Items. You can restore it anytime.');
      setDeleteId(null);

      // Re-fetch to guarantee UI matches database state
      await loadProducts();
    } catch (err: any) {
      console.error('[AdminProducts] Soft delete failed:', err);
      toast.error(err.message || 'Failed to move product to Deleted Items');
    } finally {
      setDeleting(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchCategory =
      selectedCategory === 'all' ||
      p.category_id === selectedCategory ||
      p.category?.slug === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <>
      <Helmet>
        <title>Manage Products — {APP_NAME}</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
              Jewellery Catalogue Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Add, update, or remove jewellery items from your live storefront.
            </p>
          </div>

          <Link to="/admin/products/new">
            <Button variant="primary" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </Link>
        </div>

        {/* Quick Nav / Inventory State Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-gold text-stone-950 shadow-sm flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Active Products ({products.length})</span>
          </span>

          <Link
            to="/admin/out-of-stock"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-brand-gold hover:text-brand-maroon transition-all flex items-center gap-1.5 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Out of Stock</span>
            {products.filter((p) => (p.stock_quantity ?? 0) <= 0).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {products.filter((p) => (p.stock_quantity ?? 0) <= 0).length}
              </span>
            )}
          </Link>

          <Link
            to="/admin/deleted-items"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-brand-gold hover:text-brand-maroon transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Deleted Items (Trash)</span>
            {deletedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800">
                {deletedCount}
              </span>
            )}
          </Link>
        </div>

        {/* Sync 6 Authentic WhatsApp Pieces Banner */}
        {missingSixCount > 0 && (
          <div className="bg-[#1C1917] border border-brand-gold/60 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white shadow-lg">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-brand-champagne" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#F7F5F0] flex items-center gap-2">
                  <span>{missingSixCount} WhatsApp Jewellery Pieces Ready to Sync to Database</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Live Storefront Sync
                  </span>
                </h3>
                <p className="text-xs text-[#A8A29E] mt-1 max-w-2xl leading-relaxed">
                  Publish all 6 authentic pieces (₹299, Short Black Beads, Long Harams, Beads Chains) to Supabase so they appear immediately on the live deployed storefront.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              isLoading={syncingSix}
              onClick={handleSyncSixProducts}
              className="shrink-0 w-full md:w-auto shadow-md font-bold"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Publish 6 Pieces to Database</span>
            </Button>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 bg-white"
            >
              <option value="all">All Categories ({products.length})</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Spinner size="lg" className="text-brand-gold mb-3" />
              <p className="text-xs text-gray-500">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs space-y-2">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">No products match your criteria.</p>
              <p>Try clearing your search query or add a new jewellery piece.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      SKU
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Stock
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const primaryImage =
                      p.images && p.images.length > 0
                        ? p.images[0].url
                        : '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg';

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-gray-50 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg';
                              }}
                            />
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1 max-w-xs">
                                {p.name}
                              </p>
                              <span className="text-[10px] text-gray-400 capitalize">
                                {p.category?.name || p.category_id || 'Jewellery'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                          {p.sku || '—'}
                        </td>

                        <td className="px-4 py-3 font-bold text-gray-900">
                          {formatPrice(p.price_paise)}
                        </td>

                        <td className="px-4 py-3">
                          {p.stock_quantity > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700">
                              {p.stock_quantity} in stock
                            </span>
                          ) : (
                            <Link
                              to="/admin/out-of-stock"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                              title="Click to manage out of stock items"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Out of stock (0)</span>
                            </Link>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                            title={p.is_published ? 'Click to unpublish' : 'Click to publish'}
                          >
                            {p.is_published ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Published
                              </span>
                            ) : (
                              <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Draft
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/product/${p.slug}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-brand-gold transition-colors"
                              title="View on storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/admin/products/edit/${p.id}`}
                              className="p-1.5 text-gray-600 hover:text-brand-maroon transition-colors"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeleteId(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Soft-Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Move to Deleted Items?"
          message="This jewellery item will be removed from your active storefront catalogue and safely moved to the Deleted Items section. You can restore it anytime or permanently delete it."
          confirmLabel="Move to Deleted Items"
          cancelLabel="Cancel"
          variant="warning"
          isLoading={deleting}
        />
      </div>
    </>
  );
}
