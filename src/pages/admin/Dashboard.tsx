import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  ShoppingBag,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Trash2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PREVIEW_PRODUCTS,
  getVisiblePreviewProducts,
  getSoftDeletedPreviewProducts,
} from '@/data/previewProducts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import type { Order, Product } from '@/types';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [publishedProducts, setPublishedProducts] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchStats() {
      if (!isSupabaseConfigured) {
        // Fallback to local catalog preview counts
        const preview = getVisiblePreviewProducts();
        const deleted = getSoftDeletedPreviewProducts();
        setTotalProducts(preview.length);
        setPublishedProducts(preview.filter((p) => p.is_published).length);
        setOutOfStockCount(preview.filter((p) => (p.stock_quantity ?? 0) <= 0).length);
        setDeletedCount(deleted.length);
        setTotalOrders(0);
        setPendingOrders(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch products count, inventory, and deletion state
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, is_published, stock_quantity, deleted_at');

        if (!prodErr && prodData) {
          const active = prodData.filter((p: any) => !p.deleted_at);
          const deleted = prodData.filter((p: any) => Boolean(p.deleted_at));
          setTotalProducts(active.length);
          setPublishedProducts(active.filter((p: any) => p.is_published).length);
          setOutOfStockCount(active.filter((p: any) => (p.stock_quantity ?? 0) <= 0).length);
          setDeletedCount(deleted.length);
        } else {
          const preview = getVisiblePreviewProducts();
          const deleted = getSoftDeletedPreviewProducts();
          setTotalProducts(preview.length);
          setPublishedProducts(preview.filter((p: any) => p.is_published).length);
          setOutOfStockCount(preview.filter((p: any) => (p.stock_quantity ?? 0) <= 0).length);
          setDeletedCount(deleted.length);
        }

        // 2. Fetch orders
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (!orderErr && orderData) {
          setRecentOrders(orderData.slice(0, 5) as any);
          setTotalOrders(orderData.length);
          setPendingOrders(orderData.filter((o: any) => o.status === 'inquiry_pending').length);
          const recognized = orderData.filter((o: any) =>
            ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
          );
          const gross = recognized.reduce((acc: number, o: any) => acc + (o.total_paise || 0), 0);
          setGrossRevenue(gross);
        }
      } catch (err: any) {
        console.warn('[AdminDashboard] Stats loading notice:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="gold">Confirmed</Badge>;
      case 'processing':
        return <Badge variant="gold">Processing</Badge>;
      case 'shipped':
        return <Badge variant="blue">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="green">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="red">Cancelled</Badge>;
      case 'inquiry_pending':
      default:
        return <Badge variant="gray">Inquiry Pending</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard — {APP_NAME}</title>
      </Helmet>

      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
              Administrative Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your authentic jewellery catalog, customer inquiries, and order records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/products/new">
              <Button variant="primary" className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* System Status Banner */}
        {!isSupabaseConfigured ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">
                Operating in Local Catalog Mode
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Supabase credentials are not configured in your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code>. The store is utilizing the 13 authentic jewelry pieces from local preview data. To enable live database synchronization, provide <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Supabase Live Sync Active:</strong> Connected to secure database with Row-Level Security enforcement.
              </span>
            </div>
            <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              RLS ENABLED
            </span>
          </div>
        )}

        {/* Stats Grid - 6 Key Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Active Products */}
          <Link
            to="/admin/products"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-gold/60 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-brand-maroon transition-colors">
                Active Products
              </span>
              <div className="w-9 h-9 rounded-lg bg-brand-gold-50 text-brand-maroon flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-gray-900">
              {loading ? <Spinner size="sm" /> : totalProducts}
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span>{publishedProducts} published on storefront</span>
            </p>
          </Link>

          {/* Out of Stock */}
          <Link
            to="/admin/out-of-stock"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-rose-300 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                Out of Stock
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                outOfStockCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-500'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className={`mt-3 text-2xl font-heading font-bold ${
              outOfStockCount > 0 ? 'text-rose-700' : 'text-gray-900'
            }`}>
              {loading ? <Spinner size="sm" /> : outOfStockCount}
            </p>
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {outOfStockCount > 0 ? 'Requires restocking' : 'All items in stock'}
            </p>
          </Link>

          {/* Deleted Items / Archive */}
          <Link
            to="/admin/deleted-items"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-stone-400 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-stone-900 transition-colors">
                Deleted Items
              </span>
              <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-gray-900">
              {loading ? <Spinner size="sm" /> : deletedCount}
            </p>
            <p className="mt-1 text-xs text-stone-500 font-medium">
              Recoverable in trash archive
            </p>
          </Link>

          {/* WhatsApp Orders */}
          <Link
            to="/admin/orders"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-gold/60 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-brand-maroon transition-colors">
                WhatsApp Orders
              </span>
              <div className="w-9 h-9 rounded-lg bg-brand-maroon/10 text-brand-maroon flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-gray-900">
              {loading ? <Spinner size="sm" /> : totalOrders}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Saved customer records
            </p>
          </Link>

          {/* Pending Inquiries */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pending Inquiries
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-amber-800">
              {loading ? <Spinner size="sm" /> : pendingOrders}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Requires concierge confirmation
            </p>
          </div>

          {/* Recognized Revenue */}
          <Link
            to="/admin/revenue"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-gold/60 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-brand-maroon transition-colors">
                Recognized Revenue
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-gray-900">
              {loading ? <Spinner size="sm" /> : formatPrice(grossRevenue)}
            </p>
            <p className="mt-1 text-xs text-brand-maroon font-semibold flex items-center gap-1">
              <span>View Revenue & Analytics →</span>
            </p>
          </Link>
        </div>

        {/* Recent Inquiries and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Inquiries (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-gray-900">
                  Recent Inquiries & Orders
                </h2>
                <p className="text-xs text-gray-500">
                  Orders submitted by registered customers via WhatsApp.
                </p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-brand-maroon hover:text-brand-gold inline-flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" className="text-brand-gold" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No customer orders recorded in database yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono font-bold text-gray-900">{order.order_number}</p>
                      <p className="text-gray-500 mt-0.5">
                        {order.customer_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <span className="font-bold text-gray-900 text-sm">
                        {formatPrice(order.total_paise)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Short-cuts (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Quick Actions
              </h3>

              <div className="space-y-2.5">
                <Link
                  to="/admin/products/new"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-brand-maroon" />
                    Add New Product
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/products"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand-maroon" />
                    Manage Catalog ({totalProducts})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/out-of-stock"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Restock Out of Stock ({outOfStockCount})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/deleted-items"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-stone-400 hover:bg-stone-50 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-stone-600" />
                    Deleted Items Archive ({deletedCount})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/orders"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-brand-maroon" />
                    Manage WhatsApp Orders
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/revenue"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Revenue & Sales Analytics
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/admin/users"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    Admins & User Roles
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/"
                  target="_blank"
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 hover:border-brand-gold/60 hover:bg-brand-gold-50/30 text-xs font-semibold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-brand-maroon" />
                    Visit Live Storefront
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Business Details Card */}
            <div className="bg-brand-gold-50/60 rounded-xl border border-brand-gold-200/70 p-5 text-xs text-gray-700 space-y-2">
              <span className="font-bold text-brand-maroon block">
                Official Business Information
              </span>
              <p>
                <strong>WhatsApp Concierge:</strong> +91 8971263989
              </p>
              <p>
                <strong>Shipping Rule:</strong> Free $\ge$ ₹999, else ₹49 standard.
              </p>
              <p>
                <strong>Replacement Window:</strong> 3 days for transit damage with unbroken 360° unboxing video.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
