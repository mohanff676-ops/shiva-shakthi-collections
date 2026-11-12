import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Package,
  PlusCircle,
  Search,
  Edit,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';
import {
  getVisiblePreviewProducts,
  setPreviewStockOverride,
} from '@/data/previewProducts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function AdminOutOfStock() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>('10');
  const [restocking, setRestocking] = useState(false);

  const loadOutOfStockProducts = async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const preview = getVisiblePreviewProducts();
      setProducts(preview.filter((p) => (p.stock_quantity ?? 0) <= 0));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .lte('stock_quantity', 0)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (err: any) {
      console.warn('[AdminOutOfStock] DB fetch error, fallback to preview:', err.message);
      const preview = getVisiblePreviewProducts();
      setProducts(preview.filter((p) => (p.stock_quantity ?? 0) <= 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutOfStockProducts();
  }, []);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    if (!isAdmin) {
      toast.error('Only administrators can restock inventory.');
      setRestockProduct(null);
      return;
    }

    const qtyNumber = parseInt(restockQty, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      toast.error('Please enter a valid positive stock quantity.');
      return;
    }

    setRestocking(true);

    // If local preview catalog mode or not a UUID
    if (!isSupabaseConfigured || !isValidUUID(restockProduct.id)) {
      setPreviewStockOverride(restockProduct.id, qtyNumber);
      setProducts((prev) => prev.filter((p) => p.id !== restockProduct.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Restocked "${restockProduct.name}" with ${qtyNumber} units (preview mode).`);
      setRestockProduct(null);
      setRestocking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: qtyNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restockProduct.id)
        .select();

      if (error) {
        if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
          throw new Error('Database Permission Denied: Your account lacks RLS admin permissions.');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Restock failed: Product not found or database update rejected.');
      }

      setProducts((prev) => prev.filter((p) => p.id !== restockProduct.id));
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Restocked "${restockProduct.name}" with ${qtyNumber} units.`);
      setRestockProduct(null);
      await loadOutOfStockProducts();
    } catch (err: any) {
      console.error('[AdminOutOfStock] Restock failed:', err);
      toast.error(err.message || 'Failed to update stock quantity');
    } finally {
      setRestocking(false);
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
        <title>Out of Stock Products — {APP_NAME} Admin</title>
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
                <span>Back to All Products</span>
              </Link>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
              <span>Out of Stock Inventory</span>
              <span className="text-sm font-sans font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {products.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pieces with zero stock. These items remain visible on your storefront marked &ldquo;Out of Stock&rdquo; until restocked.
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
              placeholder="Search out of stock pieces..."
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

        {/* Table of Out of Stock Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Spinner size="lg" className="text-brand-gold mb-3" />
              <p className="text-xs text-gray-500">Checking stock levels...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {search || selectedCategory !== 'all'
                  ? 'No out-of-stock pieces match your filter'
                  : 'All Jewellery Pieces are In Stock!'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
                {search || selectedCategory !== 'all'
                  ? 'Try clearing your search query or choosing another category.'
                  : 'Every published piece in your catalog currently has positive inventory ready for orders.'}
              </p>
              <Link to="/admin/products">
                <Button variant="outline" size="sm" className="bg-white">
                  View All Products
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
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3">Storefront Visibility</th>
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
                                  className="w-full h-full object-cover"
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

                        {/* Current Stock */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>0 in stock</span>
                          </span>
                        </td>

                        {/* Storefront status (Published vs. Draft, distinct from out of stock!) */}
                        <td className="px-4 py-3">
                          {p.is_published ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Eye className="w-3 h-3" /> Published (Shown Out-of-Stock)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                              <EyeOff className="w-3 h-3" /> Draft (Hidden from Store)
                            </span>
                          )}
                        </td>

                        {/* Restock & Edit Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRestockProduct(p);
                                setRestockQty('10');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-950 bg-brand-gold hover:bg-brand-gold/90 transition-all shadow-sm"
                              title="Update available stock"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Restock</span>
                            </button>

                            <Link
                              to={`/admin/products/edit/${p.id}`}
                              className="p-1.5 text-gray-600 hover:text-brand-maroon transition-colors"
                              title="Edit piece details"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
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

        {/* Restock Modal */}
        {restockProduct && (
          <Modal
            isOpen={Boolean(restockProduct)}
            onClose={() => setRestockProduct(null)}
            title="Restock Jewellery Piece"
            size="sm"
          >
            <form onSubmit={handleRestockSubmit} className="space-y-4 p-1">
              <div>
                <p className="text-xs text-gray-500 mb-1">Product:</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {restockProduct.name}
                </p>
                {restockProduct.sku && (
                  <p className="text-[10px] font-mono text-gray-400">
                    SKU: {restockProduct.sku}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Available Stock Quantity:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 font-bold"
                    placeholder="e.g. 5, 10, 20"
                    autoFocus
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRestockQty('5')}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockQty('10')}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockQty('25')}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                    >
                      +25
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Once saved, this piece will instantly become available for shopping bag orders on the storefront.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRestockProduct(null)}
                  disabled={restocking}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={restocking}
                  className="font-bold"
                >
                  Confirm Restock
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </>
  );
}
