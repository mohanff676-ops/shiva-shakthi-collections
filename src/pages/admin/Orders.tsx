import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Trash2,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatPrice, whatsappUrl } from '@/lib/utils';
import { getVisiblePreviewProducts } from '@/data/previewProducts';
import { RecordWhatsAppOrderModal } from '@/components/admin/RecordWhatsAppOrderModal';
import type { Order, OrderStatus, Product } from '@/types';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    if (!isAdmin) {
      toast.error('Only administrators can delete orders.');
      setDeleteOrderId(null);
      return;
    }

    setDeleting(true);
    try {
      if (!isSupabaseConfigured) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
        toast.success('Order removed from list');
        setDeleteOrderId(null);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteOrderId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Order deletion rejected by database RLS policy. Verify admin privileges.');
      }

      setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
      toast.success('Order permanently deleted from database');
      setDeleteOrderId(null);
    } catch (err: any) {
      console.error('[AdminOrders] Failed to delete order:', err);
      toast.error(err.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setOrders([]);
      setProducts(getVisiblePreviewProducts() as any);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);

      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData) {
        setProducts(prodData as any);
      } else {
        setProducts(getVisiblePreviewProducts() as any);
      }
    } catch (err: any) {
      console.warn('[AdminOrders] Failed to load orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    if (!isSupabaseConfigured) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
      );
      toast.success(`Order status updated to ${newStatus}`);
      setUpdatingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
      );
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer_phone && o.customer_phone.includes(search));

    return matchStatus && matchSearch;
  });

  return (
    <>
      <Helmet>
        <title>Manage Orders & Inquiries — {APP_NAME}</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
              WhatsApp Orders & Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review customer order inquiries, track shipment progress, and dispatch WhatsApp updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/admin/revenue">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 border-stone-300 text-stone-700 hover:border-brand-gold bg-white"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>Revenue Analytics</span>
              </Button>
            </Link>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Order</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer name, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 bg-white"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="inquiry_pending">Inquiry Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" className="text-brand-gold mb-3" />
            <p className="text-xs text-gray-500">Loading order records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-xs text-gray-500 space-y-3">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-800 text-sm">No order inquiries found</p>
            <p className="max-w-md mx-auto text-gray-500">
              When authenticated customers initiate a WhatsApp order checkout from their shopping bag, the order will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const customerTargetPhone = order.customer_phone?.replace(/\D/g, '') || WHATSAPP_NUMBER;
              const directChatUrl = whatsappUrl(
                customerTargetPhone,
                `Namaste ${order.customer_name || 'from Shiva Shakthi Collections'}! Regarding your order ${order.order_number}:`
              );

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-brand-gold/40 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {order.order_number}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-gray-400 font-medium">Status:</label>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 bg-white font-medium"
                        >
                          <option value="inquiry_pending">Inquiry Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <span className="font-heading font-bold text-base text-brand-maroon">
                        {formatPrice(order.total_paise)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setDeleteOrderId(order.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                        title="Delete order record"
                        aria-label="Delete order record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer and Items Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                        Customer Contact
                      </span>
                      <p className="font-semibold text-gray-900">{order.customer_name || 'Customer'}</p>
                      {order.customer_phone && (
                        <p className="text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {order.customer_phone}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-[11px] text-gray-500 italic mt-1 pt-1 border-t border-gray-200/60">
                          &ldquo;{order.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="md:col-span-2 divide-y divide-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block pb-1">
                        Ordered Items
                      </span>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it) => (
                          <div key={it.id} className="py-1.5 flex items-center justify-between">
                            <span className="font-medium text-gray-800">
                              {it.product_name} <span className="text-gray-400">× {it.quantity}</span>
                            </span>
                            <span className="font-semibold text-gray-700">
                              {formatPrice(it.line_total_paise || (it.unit_price_paise * it.quantity))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic py-1">Inquiry order items itemized on WhatsApp</p>
                      )}

                      {/* Financial breakdown */}
                      <div className="pt-2 mt-1 flex justify-between text-[11px] text-gray-500 font-medium">
                        <span>Subtotal: {formatPrice(order.subtotal_paise)}</span>
                        <span>Shipping: {order.shipping_paise === 0 ? 'FREE' : formatPrice(order.shipping_paise)}</span>
                        <span className="font-bold text-gray-900">Total: {formatPrice(order.total_paise)}</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Direct Action Bar */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                    <a
                      href={directChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
                      <span>Contact Customer on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Record WhatsApp Order Modal */}
        <RecordWhatsAppOrderModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onOrderCreated={loadOrders}
          products={products}
        />

        {/* Delete Order Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteOrderId)}
          onClose={() => setDeleteOrderId(null)}
          onConfirm={handleDeleteOrder}
          title="Delete Order Record"
          message="Are you sure you want to permanently remove this order record from the database? This action cannot be undone."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={deleting}
        />
      </div>
    </>
  );
}
