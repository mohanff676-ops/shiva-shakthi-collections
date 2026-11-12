import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { Button } from '@/components/ui/Button';
import { formatPrice, calculateShipping } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD_PAISE, WHATSAPP_NUMBER } from '@/lib/constants';
import { buildCartWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function CartDrawer() {
  const { isOpen, closeCart, items, getSubtotalPaise } = useCartStore();
  const { user, profile } = useAuth();

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
            discount_paise: 0,
            total_paise: total,
            status: 'inquiry_pending',
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
        console.warn('[CartDrawer] Order inquiry recording notice:', err);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const subtotal = getSubtotalPaise();
  const shipping = calculateShipping(subtotal);
  const total = Math.max(0, subtotal + shipping);
  const freeShippingDifference = FREE_SHIPPING_THRESHOLD_PAISE - subtotal;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_PAISE) * 100));

  const cartMessage = buildCartWhatsAppMessage(items, subtotal, shipping, total);
  const cartWhatsappUrl = createWhatsAppUrl(WHATSAPP_NUMBER, cartMessage);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-screen max-w-md bg-[#0E0E12] text-[#F7F5F0] shadow-2xl flex flex-col border-l border-white/10"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#121215]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-champagne" />
                  <h3 className="font-heading font-bold text-lg text-[#F7F5F0]">
                    Shopping Bag ({items.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="p-2 rounded-xl text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free shipping bar */}
              <div className="bg-[#141418] px-5 py-3 border-b border-white/5">
                {freeShippingDifference > 0 ? (
                  <p className="text-xs text-[#A8A29E] font-medium text-center">
                    Add <span className="font-bold text-brand-champagne">{formatPrice(freeShippingDifference)}</span> more to qualify for <span className="font-bold text-emerald-400">FREE Insured Shipping!</span>
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 font-semibold text-center">
                    ✨ Congratulations! You have unlocked Free Insured Shipping!
                  </p>
                )}
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-brand-champagne h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 text-brand-champagne flex items-center justify-center mb-4 border border-[#C5A059]/20">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="font-heading font-bold text-lg text-[#F7F5F0] mb-1">
                      Your bag is empty
                    </p>
                    <p className="text-xs text-[#A8A29E] max-w-xs mb-6">
                      Explore our handcrafted Indian jewellery collections and find your perfect piece.
                    </p>
                    <Button onClick={closeCart} to="/shop" size="sm" variant="primary">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {items.map((item) => (
                      <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-5 border-t border-white/5 bg-[#121215] space-y-4">
                  <div className="flex items-center justify-between text-base font-semibold text-[#F7F5F0]">
                    <span>Subtotal</span>
                    <span className="font-bold text-lg text-brand-champagne">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-[#78716C]">
                    Taxes and free shipping verified via WhatsApp concierge.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <a
                      href={cartWhatsappUrl}
                      onClick={handleWhatsAppCheckout}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                      <span>Order on WhatsApp</span>
                    </a>

                    <Button
                      to="/cart"
                      onClick={closeCart}
                      variant="outline"
                      className="w-full text-xs min-h-[44px]"
                    >
                      Review Bag ({items.length})
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
