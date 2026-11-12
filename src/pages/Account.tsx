import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  User,
  Mail,
  Phone,
  Calendar,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Shield,
  Edit2,
  Check,
  X,
  MessageCircle,
  Clock,
  Package,
  Trash2,
} from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatPrice, whatsappUrl } from '@/lib/utils';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

export default function Account() {
  const { user, profile, isAdmin, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
    }
  }, [profile]);

  // Fetch customer orders from Supabase
  useEffect(() => {
    async function loadCustomerOrders() {
      if (!user || !isSupabaseConfigured) return;

      try {
        setLoadingOrders(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as any) || []);
      } catch (err: any) {
        console.warn('[Account] Could not load customer orders:', err.message);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadCustomerOrders();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const res = await updateProfile({
      full_name: editName.trim(),
      phone: editPhone.trim(),
    });
    setSavingProfile(false);

    if (res.success) {
      toast.success('Profile details updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(res.error || 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId || !user) return;

    setDeletingOrder(true);
    try {
      if (!isSupabaseConfigured) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
        toast.success('Inquiry record removed from your view.');
        setDeleteOrderId(null);
        return;
      }

      // Enforce strict ownership check: eq('id', deleteOrderId).eq('user_id', user.id)
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteOrderId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Deletion rejected: You can only delete orders belonging to your account.');
      }

      setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
      toast.success('Inquiry record deleted from your account.');
      setDeleteOrderId(null);
    } catch (err: any) {
      console.error('[Account] Failed to delete order record:', err);
      toast.error(err.message || 'Failed to delete inquiry record');
    } finally {
      setDeletingOrder(false);
    }
  };

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
        <title>My Account — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-white/5">
          <div>
            <span className="text-xs font-bold tracking-widest text-brand-champagne uppercase">
              Member Dashboard
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#F7F5F0] mt-1">
              Namaste, {profile?.full_name || user?.email?.split('@')[0] || 'Valued Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A8A29E] mt-0.5">
              Manage your personal information and track your jewellery order inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="secondary" className="flex items-center gap-2 border-brand-champagne/30 text-brand-champagne bg-[#141418] hover:bg-[#1A1A22] min-h-[44px]">
                  <Shield className="w-4 h-4 text-brand-champagne" />
                  <span>Admin Dashboard</span>
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-[#A8A29E] hover:text-rose-400 hover:border-rose-400/30 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Admin Callout Banner */}
        {isAdmin && (
          <div className="mt-6 p-4 rounded-2xl bg-[#141418] border border-[#C5A059]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/15 text-brand-champagne flex items-center justify-center shrink-0 border border-[#C5A059]/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-champagne">Store Administrator Privileges Active</p>
                <p className="text-xs text-[#A8A29E]">
                  You have full catalog and order management permissions.
                </p>
              </div>
            </div>
            <Link to="/admin">
              <Button size="sm" variant="primary" className="font-bold min-h-[44px]">
                Open Admin Portal
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#121215] rounded-2xl border border-white/5 shadow-luxury p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="font-heading text-lg font-bold text-[#F7F5F0] flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-champagne" />
                  Profile Details
                </h2>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1 transition-colors min-h-[36px] min-w-[36px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-semibold text-[#A8A29E] hover:text-[#F7F5F0] flex items-center gap-1 min-h-[36px] min-w-[36px]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] min-h-[44px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={savingProfile}
                      className="w-full flex items-center justify-center gap-1 font-bold min-h-[44px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-[#78716C] block">Full Name</span>
                    <span className="font-semibold text-[#F7F5F0]">
                      {profile?.full_name || 'Not provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#78716C] block">Email Address</span>
                    <span className="font-medium text-[#F7F5F0] flex items-center gap-1.5 break-all">
                      <Mail className="w-4 h-4 text-[#78716C] shrink-0" />
                      {user?.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#78716C] block">Phone Number</span>
                    <span className="font-medium text-[#F7F5F0] flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#78716C] shrink-0" />
                      {profile?.phone || 'Not provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#78716C] block">Member Since</span>
                    <span className="font-medium text-[#A8A29E] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#78716C] shrink-0" />
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'Recent'}
                    </span>
                  </div>
                </div>
              )}

              {/* Direct Concierge Help */}
              <div className="p-4 rounded-xl bg-[#141418] border border-white/5 text-xs space-y-2">
                <span className="font-bold text-[#F7F5F0] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Need assistance?
                </span>
                <p className="text-[#A8A29E] leading-relaxed text-[11px]">
                  Our jewellery specialists are available on WhatsApp to assist with custom orders, sizing, and styling advice.
                </p>
                <a
                  href={whatsappUrl(WHATSAPP_NUMBER, `Namaste! I am ${profile?.full_name || 'a customer'} with email ${user?.email} and would like help with Shiva Shakthi Collections.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-champagne hover:text-brand-champagne-light font-semibold inline-flex items-center gap-1 transition-colors text-xs min-h-[36px]"
                >
                  <span>Chat with Concierge</span> <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiries & Orders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121215] rounded-2xl border border-white/5 shadow-luxury p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#F7F5F0] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-brand-champagne" />
                    My WhatsApp Inquiries & Orders
                  </h2>
                  <p className="text-xs text-[#A8A29E] mt-0.5">
                    Records of items you have inquired or ordered through our concierge.
                  </p>
                </div>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Spinner size="md" className="text-brand-champagne mb-2" />
                  <p className="text-xs text-[#78716C]">Loading order records...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 text-brand-champagne flex items-center justify-center mx-auto border border-[#C5A059]/20">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#F7F5F0]">
                      No Orders Placed Yet
                    </h3>
                    <p className="text-xs text-[#A8A29E] max-w-sm mx-auto mt-1">
                      Browse our handcrafted 1-gram micro gold collections and add pieces to your bag or inquire directly on WhatsApp.
                    </p>
                  </div>
                  <Link to="/shop">
                    <Button variant="primary" size="sm" className="font-bold min-h-[44px]">
                      Explore Jewellery
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-white/5 rounded-2xl p-5 hover:border-[#C5A059]/40 transition-all bg-[#141418]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#F7F5F0]">
                            {order.order_number}
                          </span>
                          <span className="text-xs text-[#78716C] block flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(order.status)}
                          <span className="text-base font-bold text-brand-champagne">
                            {formatPrice(order.total_paise)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteOrderId(order.id)}
                            className="p-1.5 text-[#78716C] hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors"
                            title="Remove inquiry record"
                            aria-label="Remove inquiry record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 divide-y divide-white/5">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item) => (
                            <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-[#F7F5F0]">{item.product_name}</p>
                                <p className="text-[#78716C]">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-medium text-brand-champagne">
                                {formatPrice(item.line_total_paise || (item.unit_price_paise * item.quantity))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#78716C] italic py-1">Inquiry order items saved on WhatsApp</p>
                        )}
                      </div>

                      {/* WhatsApp Follow-up */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-[#A8A29E]">
                          Status: <strong className="capitalize text-[#F7F5F0]">{order.status.replace('_', ' ')}</strong>
                        </span>
                        <a
                          href={whatsappUrl(
                            WHATSAPP_NUMBER,
                            `Namaste! Inquiring regarding order ${order.order_number} (${formatPrice(order.total_paise)}) under my account ${user?.email}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 min-h-[36px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-[#141418]" />
                          <span>Chat on WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteOrderId)}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={handleDeleteOrder}
        title="Delete Inquiry Record"
        message="Are you sure you want to remove this inquiry from your account history? This action cannot be undone."
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deletingOrder}
      />
    </>
  );
}
