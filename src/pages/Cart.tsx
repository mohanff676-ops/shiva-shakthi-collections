import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, ArrowRight, Tag, ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { CartItem } from '@/components/cart/CartItem';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, calculateShipping } from '@/lib/utils';
import { buildCartWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, getSubtotalPaise, couponCode, discountPaise, setCoupon } = useCartStore();
  const { user, profile } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const validateCouponMutation = useValidateCoupon();

  const subtotal = getSubtotalPaise();
  const shipping = calculateShipping(subtotal);
  const total = Math.max(0, subtotal - discountPaise + shipping);

  const cartMessage = buildCartWhatsAppMessage(items, subtotal, shipping, total, {
    discountPaise,
  });
  const cartWhatsappUrl = createWhatsAppUrl(WHATSAPP_NUMBER, cartMessage);

  const handleWhatsAppCheckout = async () => {
    if (user && isSupabaseConfigured) {
      try {
        const orderNumber = `SSC-${Date.now().toString().slice(-6)}`;
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            user_id: user.id,
            customer_name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
            customer_phone: profile?.phone || null,
            subtotal_paise: subtotal,
            shipping_paise: shipping,
            discount_paise: discountPaise,
            total_paise: total,
            status: 'inquiry_pending',
            notes: couponCode ? `Coupon applied: ${couponCode}` : null,
          })
          .select('id')
          .single();

        if (!orderErr && orderData) {
          const itemRows = items.map((it) => ({
            order_id: orderData.id,
            product_id: it.productId,
            product_name: it.product.name,
            product_sku: it.product.sku,
            unit_price_paise: it.product.price_paise,
            quantity: it.quantity,
            line_total_paise: it.product.price_paise * it.quantity,
          }));

          await supabase.from('order_items').insert(itemRows);
        }
      } catch (err) {
        console.warn('[Cart] Order inquiry recording notice:', err);
      }
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      const res = await validateCouponMutation.mutateAsync({
        code: couponInput,
        subtotalPaise: subtotal,
      });
      setCoupon(res.coupon.code, res.discountPaise);
      toast.success(`Coupon "${res.coupon.code}" applied! Saved ${formatPrice(res.discountPaise)}`);
      setCouponInput('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null, 0);
    toast.success('Coupon removed');
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: 'Cart' }]} />

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#F7F5F0] mt-2 mb-8">
          Shopping Cart ({items.length} items)
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-brand-champagne" />}
            title="Your Shopping Bag is Empty"
            description="Explore our hand-finished jewellery sets, earrings, and bangles."
            actionLabel="Start Shopping"
            actionTo="/shop"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#121215] rounded-2xl border border-white/5 shadow-luxury p-6 divide-y divide-white/5">
                {items.map((item) => (
                  <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link
                  to="/shop"
                  className="text-xs sm:text-sm font-semibold text-brand-champagne hover:text-brand-champagne-light flex items-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Browsing Jewellery</span>
                </Link>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="lg:col-span-1">
              <div className="bg-[#121215] rounded-2xl border border-white/5 shadow-luxury p-6 space-y-5 sticky top-28">
                <h3 className="font-heading text-lg font-bold text-[#F7F5F0] border-b border-white/5 pb-3">
                  Order Summary
                </h3>

                {/* Coupon input */}
                <div>
                  {couponCode ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-300">{couponCode}</span>
                        <span className="text-emerald-400">(-{formatPrice(discountPaise)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-rose-400 hover:text-rose-300 font-semibold text-xs p-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="flex-1 px-3 py-2 text-xs bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] uppercase min-h-[44px]"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={validateCouponMutation.isPending}
                        className="text-xs font-bold min-h-[44px] px-4"
                      >
                        Apply
                      </Button>
                    </form>
                  )}
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-2.5 text-sm divide-y divide-white/5 pt-2">
                  <div className="flex justify-between text-[#A8A29E]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#F7F5F0]">{formatPrice(subtotal)}</span>
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-400 pt-2">
                      <span>Discount</span>
                      <span>-{formatPrice(discountPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#A8A29E] pt-2">
                    <span>Shipping</span>
                    <span className="font-medium text-[#F7F5F0]">
                      {shipping === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatPrice(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-[#F7F5F0] pt-3 border-t border-white/10">
                    <span>Total Amount</span>
                    <span className="text-brand-champagne text-xl font-bold">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Direct WhatsApp Ordering Button */}
                <a
                  href={cartWhatsappUrl}
                  onClick={handleWhatsAppCheckout}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] min-h-[48px]"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                  <span>Order on WhatsApp (Direct Concierge)</span>
                </a>

                {/* Transparent order explanation */}
                <div className="p-4 rounded-xl bg-[#141418] border border-white/5 text-[11px] text-[#A8A29E] space-y-1.5">
                  <p className="font-bold text-[#F7F5F0] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-champagne shrink-0" />
                    <span>How WhatsApp Ordering Works:</span>
                  </p>
                  <p className="leading-relaxed">
                    Tapping <strong className="text-white">Order on WhatsApp</strong> opens WhatsApp with your complete cart itemized. You will press Send. Shiva Shakthi Collections will confirm stock availability, verify delivery pincode, and share direct payment details (UPI/Bank Transfer).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
