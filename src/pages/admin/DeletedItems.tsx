import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  RotateCcw,
  Search,
  Package,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';
import {
  getSoftDeletedPreviewProducts,
  restorePreviewId,
  permanentDeletePreviewId,
} from '@/data/previewProducts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function AdminDeletedItems() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [restoreItem, setRestoreItem] = useState<Product | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Product | null>(null);
  const [permDeleting, setPermDeleting] = useState(false);

  const loadDeletedProducts = async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setDeletedProducts(getSoftDeletedPreviewProducts());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedProducts((data as any) || []);
    } catch (err: any) {
      console.warn('[AdminDeletedItems] DB fetch failed, checking preview:', err.message);
      setDeletedProducts(getSoftDeletedPreviewProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedProducts();
  }, []);

  // 1. RESTORE ACTION
  const handleRestore = async () => {
    if (!restoreItem) return;

    if (!isAdmin) {
      toast.error('Only administrators can restore products.');
      setRestoreItem(null);
      return;
    }

    setRestoring(true);

    // If catalogue preview item or Supabase not configured
    if (!isSupabaseConfigured || !isValidUUID(restoreItem.id)) {
      restorePreviewId(restoreItem.id);
      setDeletedProducts((prev) => prev.filter((p) => p.id !== restoreItem.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Restored "${restoreItem.name}" to active catalogue.`);
      setRestoreItem(null);
      setRestoring(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restoreItem.id)
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
            "Supabase Schema Error: 'deleted_at' column is missing or schema cache needs reload. Please run migration 20261022000004_add_product_soft_delete.sql in Supabase SQL Editor."
          );
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Restore failed: Product was not found or RLS rejected the update.');
      }

      setDeletedProducts((prev) => prev.filter((p) => p.id !== restoreItem.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Restored "${restoreItem.name}" to active catalogue.`);
      setRestoreItem(null);
      await loadDeletedProducts();
    } catch (err: any) {
      console.error('[AdminDeletedItems] Restore failed:', err);
      toast.error(err.message || 'Failed to restore product');
    } finally {
      setRestoring(false);
    }
  };

  // 2. PERMANENT DELETE ACTION
  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;

    if (!isAdmin) {
      toast.error('Only administrators can permanently delete products.');
      setPermanentDeleteItem(null);
      return;
    }

    setPermDeleting(true);

    if (!isSupabaseConfigured || !isValidUUID(permanentDeleteItem.id)) {
      permanentDeletePreviewId(permanentDeleteItem.id);
      setDeletedProducts((prev) => prev.filter((p) => p.id !== permanentDeleteItem.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Catalogue preview item permanently removed.');
      setPermanentDeleteItem(null);
      setPermDeleting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', permanentDeleteItem.id)
        .select();

      if (error) {
        if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
          throw new Error('Database Permission Denied: RLS rejected permanent deletion.');
        }
        if (error.code === '23503' || error.message.toLowerCase().includes('foreign key')) {
          throw new Error('Cannot permanently delete this product because historical orders reference its details. Keep it soft-deleted instead.');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Permanent deletion failed: PostgreSQL RLS rejected the deletion.');
      }

      setDeletedProducts((prev) => prev.filter((p) => p.id !== permanentDeleteItem.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`"${permanentDeleteItem.name}" permanently deleted.`);
      setPermanentDeleteItem(null);
      await loadDeletedProducts();
    } catch (err: any) {
      console.error('[AdminDeletedItems] Permanent delete failed:', err);
      toast.error(err.message || 'Failed to permanently delete product');
    } finally {
      setPermDeleting(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = deletedProducts.filter((p) => {
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

  const formatDeletionDate = (isoString?: string | null) => {
    if (!isoString) return 'Previously removed';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Helmet>
        <title>Deleted Jewellery Items (Trash) — {APP_NAME} Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-1 text-xs text-brand-maroon hover:text-brand-gold font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Active Products</span>
              </Link>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
              <span>Deleted Items (Trash)</span>
              <span className="text-sm font-sans font-bold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800">
                {deletedProducts.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Recoverable archive of removed jewellery pieces. Restoring returns them to your storefront without duplicate IDs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/products">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 bg-white">
                <Package className="w-4 h-4 text-brand-gold" />
                <span>Active Products</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deleted item name or SKU..."
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
              <option value="all">All Categories ({deletedProducts.length})</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Deleted Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Spinner size="lg" className="text-brand-gold mb-3" />
              <p className="text-xs text-gray-500">Loading deleted archive...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {search || selectedCategory !== 'all'
                  ? 'No matching deleted pieces found'
                  : 'Deleted Items Archive is Empty'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
                {search || selectedCategory !== 'all'
                  ? 'Try adjusting your search query or category filter.'
                  : 'When jewellery pieces are removed from the active catalogue, they will appear here safely for recovery or permanent removal.'}
              </p>
              <Link to="/admin/products">
                <Button variant="outline" size="sm" className="bg-white">
                  View Active Catalogue
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-stone-50 border-b border-gray-200 uppercase text-[10px] tracking-wider text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3">Piece Details</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock at Deletion</th>
                    <th className="px-4 py-3">Date Removed</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const primaryImg = getPrimaryImage(p);
                    const isPreview = p.id.startsWith('ssc-preview-');

                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Piece thumbnail and name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {primaryImg ? (
                                <img
                                  src={primaryImg}
                                  alt={p.name}
                                  className="w-full h-full object-cover grayscale opacity-75"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="max-w-xs">
                              <span className="font-semibold text-gray-900 block truncate">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-gray-400">
                                  {p.sku || p.id.slice(0, 10)}
                                </span>
                                {isPreview && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="text-gray-700 font-medium">
                            {p.category?.name || p.category_id || 'General'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {formatPrice(p.price_paise)}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3">
                          <span className="text-gray-600 font-medium">
                            {p.stock_quantity ?? 0} units
                          </span>
                        </td>

                        {/* Date deleted */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{formatDeletionDate(p.deleted_at)}</span>
                          </div>
                        </td>

                        {/* Action buttons: Restore & Permanent Delete */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setRestoreItem(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Restore to active catalogue"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPermanentDeleteItem(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                              title="Permanently purge product from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Purge</span>
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

        {/* Restore Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(restoreItem)}
          onClose={() => setRestoreItem(null)}
          onConfirm={handleRestore}
          title="Restore Product?"
          message={`Are you sure you want to restore "${restoreItem?.name}" back to your active storefront catalogue? The original product ID, price, and media will be preserved.`}
          confirmLabel="Restore Product"
          cancelLabel="Cancel"
          variant="info"
          isLoading={restoring}
        />

        {/* Permanent Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(permanentDeleteItem)}
          onClose={() => setPermanentDeleteItem(null)}
          onConfirm={handlePermanentDelete}
          title="Permanently Delete Product?"
          message={`Are you sure you want to PERMANENTLY purge "${permanentDeleteItem?.name}"? This action cannot be undone and will erase the product row from the database.`}
          confirmLabel="Permanently Delete"
          cancelLabel="Keep in Archive"
          variant="danger"
          isLoading={permDeleting}
        />
      </div>
    </>
  );
}
