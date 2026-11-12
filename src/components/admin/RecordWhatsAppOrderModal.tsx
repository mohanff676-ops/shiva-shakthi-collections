import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

interface OrderItemDraft {
  productId: string;
  productName: string;
  productSku: string;
  unitPricePaise: number;
  quantity: number;
}

/** Helper to validate and clamp quantity to a strictly positive whole integer (>= 1) */
function getValidQuantity(qty: unknown): number {
  const parsed = Math.floor(Number(qty));
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

/** Helper to validate and clamp unit price in paise (>= 0) */
function getValidUnitPricePaise(price: unknown): number {
  const parsed = Math.round(Number(price));
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/** Helper to calculate line total consistently across UI, state, and DB insert */
function calculateLineTotalPaise(qty: unknown, unitPricePaise: unknown): number {
  return getValidQuantity(qty) * getValidUnitPricePaise(unitPricePaise);
}

interface RecordWhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
  products: Product[];
}

export function RecordWhatsAppOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  products = [],
}: RecordWhatsAppOrderModalProps) {
  const { user, isAdmin } = useAuth();

  const generateOrderNumber = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SSC-WA-${Date.now().toString().slice(-4)}${randomSuffix}`;
  };

  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState<'confirmed' | 'delivered' | 'inquiry_pending'>('confirmed');
  const [paymentMethod, setPaymentMethod] = useState('GPay / UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [discountRupees, setDiscountRupees] = useState<number>(0);
  const [shippingRupees, setShippingRupees] = useState<number>(49);
  const [shippingOverridden, setShippingOverridden] = useState(false);

  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customProductPrice, setCustomProductPrice] = useState<number>(0);
  const [customProductQty, setCustomProductQty] = useState<number>(1);

  const [saving, setSaving] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderNumber(generateOrderNumber());
      setCustomerName('');
      setCustomerPhone('');
      setStatus('confirmed');
      setPaymentMethod('GPay / UPI');
      setPaymentReference('');
      setNotes('');
      setDiscountRupees(0);
      setShippingRupees(49);
      setShippingOverridden(false);
      setDuplicateError(null);
      setSaving(false);

      // Default with first product if available
      if (products.length > 0) {
        const first = products[0];
        setItems([
          {
            productId: first.id,
            productName: first.name,
            productSku: first.sku || '',
            unitPricePaise: first.price_paise,
            quantity: 1,
          },
        ]);
        setSelectedProductId(products[1]?.id || products[0].id);
      } else {
        setItems([]);
      }
    }
  }, [isOpen, products]);

  // Subtotal calculation in paise (declared only once; uses identical line total rules as order items)
  const subtotalPaise = items.reduce(
    (acc, it) => acc + calculateLineTotalPaise(it.quantity, it.unitPricePaise),
    0
  );

  // Automatic free shipping rule (free if subtotal >= ₹999 / 99900 paise, unless manually overridden)
  useEffect(() => {
    if (!shippingOverridden) {
      if (subtotalPaise >= 99900 || subtotalPaise === 0) {
        setShippingRupees(0);
      } else {
        setShippingRupees(49);
      }
    }
  }, [subtotalPaise, shippingOverridden]);

  const discountPaise = Math.round(discountRupees * 100);
  const shippingPaise = Math.round(shippingRupees * 100);
  const totalPaise = Math.max(0, subtotalPaise - discountPaise + shippingPaise);

  const handleAddItemFromCatalog = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in items list, increment quantity instead of duplicate
    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: getValidQuantity(it.quantity) + 1 } : it
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          productSku: prod.sku || '',
          unitPricePaise: getValidUnitPricePaise(prod.price_paise),
          quantity: 1,
        },
      ]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customProductName.trim() || customProductPrice <= 0) {
      toast.error('Please enter a valid item name and price.');
      return;
    }

    const validatedQty = getValidQuantity(customProductQty);
    const validatedPricePaise = getValidUnitPricePaise(customProductPrice * 100);

    setItems((prev) => [
      ...prev,
      {
        productId: `custom-${Date.now()}`,
        productName: customProductName.trim(),
        productSku: 'CUSTOM-WA',
        unitPricePaise: validatedPricePaise,
        quantity: validatedQty,
      },
    ]);

    setCustomProductName('');
    setCustomProductPrice(0);
    setCustomProductQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const parsedQty = Math.floor(Number(newQty));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, quantity: parsedQty } : it))
    );
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (isSupabaseConfigured) {
      if (!user?.id || !isAdmin) {
        toast.error('Active authorized admin session required to record orders.');
        return;
      }
    }

    const trimmedOrderNum = orderNumber.trim();
    const trimmedCustName = customerName.trim();
    const trimmedCustPhone = customerPhone.trim();

    if (!trimmedOrderNum) {
      setDuplicateError('Order number is required.');
      return;
    }

    if (!trimmedCustName) {
      toast.error('Customer name is required.');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one jewellery product to the order.');
      return;
    }

    // Validate that every line item has a strictly positive integer quantity
    for (const it of items) {
      const q = Math.floor(Number(it.quantity));
      if (isNaN(q) || q <= 0) {
        toast.error(`Invalid quantity for "${it.productName}". Quantity must be a positive integer.`);
        return;
      }
    }

    setSaving(true);
    setDuplicateError(null);

    try {
      if (!isSupabaseConfigured) {
        toast.success(`WhatsApp Order ${trimmedOrderNum} recorded in catalog preview.`);
        onOrderCreated?.();
        onClose();
        return;
      }

      // 1. Duplicate check: verify order_number doesn't exist already
      const { data: existing, error: checkErr } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', trimmedOrderNum)
        .maybeSingle();

      if (checkErr && checkErr.code !== 'PGRST116') {
        throw checkErr;
      }

      if (existing) {
        setDuplicateError(
          `Order number "${trimmedOrderNum}" already exists. Please click regenerate or use a unique suffix.`
        );
        setSaving(false);
        return;
      }

      // 2. Format notes with payment reference
      const notesParts = [];
      if (paymentMethod) notesParts.push(`Payment Method: ${paymentMethod}`);
      if (paymentReference.trim()) notesParts.push(`Reference/UTR: ${paymentReference.trim()}`);
      if (notes.trim()) notesParts.push(`Notes: ${notes.trim()}`);
      const compiledNotes = notesParts.join(' | ') || 'WhatsApp concierge recorded order';

      // 3. Insert order record
      // user_id is assigned exactly once using the authenticated admin's ID
      // and each property is defined with no duplicate keys
      const orderInsertPayload = {
        order_number: trimmedOrderNum,
        user_id: user!.id,
        customer_name: trimmedCustName,
        customer_phone: trimmedCustPhone || null,
        subtotal_paise: subtotalPaise,
        shipping_paise: shippingPaise,
        discount_paise: discountPaise,
        total_paise: totalPaise,
        status: status,
        notes: compiledNotes,
      };

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert(orderInsertPayload)
        .select('id')
        .single();

      if (orderErr) throw orderErr;
      if (!orderData || !orderData.id) throw new Error('Failed to create order record header.');

      // 4. Construct order item rows
      // Each row has exactly one quantity and one line_total_paise property, with validated positive integers
      const itemRows = items.map((it) => {
        const validatedQuantity = getValidQuantity(it.quantity);
        const unitPrice = getValidUnitPricePaise(it.unitPricePaise);
        const lineTotal = calculateLineTotalPaise(it.quantity, it.unitPricePaise);

        return {
          order_id: orderData.id,
          product_id: it.productId,
          product_name: it.productName.trim() || 'Jewellery Item',
          product_sku: it.productSku ? it.productSku.trim() : null,
          unit_price_paise: unitPrice,
          quantity: validatedQuantity,
          line_total_paise: lineTotal,
        };
      });

      // 5. Insert order items with compensating rollback if item insertion fails
      const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
      if (itemsErr) {
        console.error('[RecordWhatsAppOrderModal] Items insert failed, attempting rollback on order header:', itemsErr);

        // Compensating rollback: delete the empty order header so no orphaned or incomplete record remains
        const { error: rollbackErr } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderData.id);

        if (rollbackErr) {
          console.error('[RecordWhatsAppOrderModal] Critical: Rollback deletion of order header failed:', rollbackErr);
          // Accurately report that rollback failed and an incomplete order header exists
          throw new Error(
            `Failed to save order line items (${itemsErr.message}) and automatic rollback failed (${rollbackErr.message}). Incomplete order #${trimmedOrderNum} (ID: ${orderData.id}) may exist in the database.`
          );
        }

        // Accurately report that line items failed and rollback successfully removed the header
        throw new Error(
          `Failed to save order line items: ${itemsErr.message}. The empty order #${trimmedOrderNum} was cleanly rolled back to protect database integrity.`
        );
      }

      toast.success(`WhatsApp Order ${trimmedOrderNum} successfully saved!`);
      onOrderCreated?.();
      onClose();
    } catch (err: any) {
      console.error('[RecordWhatsAppOrderModal] Error saving order:', err);
      toast.error(err.message || 'Failed to record WhatsApp order');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-stone-900 px-6 py-4 flex items-center justify-between border-b border-[#C5A059]/30 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-brand-gold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg font-bold text-brand-gold">
                Record WhatsApp / Offline Order
              </h2>
              <p className="text-[11px] text-stone-400">
                Direct concierge orders with database sync and duplicate protection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSaveOrder} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Duplicate Error Warning */}
          {duplicateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{duplicateError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderNumber(generateOrderNumber());
                    setDuplicateError(null);
                  }}
                  className="mt-1 text-red-700 font-bold underline hover:text-red-900"
                >
                  Generate New Order Number
                </button>
              </div>
            </div>
          )}

          {/* Row 1: Order Number & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Order Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setDuplicateError(null);
                  }}
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                  placeholder="e.g. SSC-WA-1234"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOrderNumber(generateOrderNumber());
                    setDuplicateError(null);
                  }}
                  title="Generate new order number"
                  className="px-2.5 py-2 border border-stone-300 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              >
                <option value="confirmed">Confirmed (Recognized Sale)</option>
                <option value="delivered">Delivered (Completed)</option>
                <option value="inquiry_pending">Inquiry Pending (Awaiting Payment)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              />
            </div>
          </div>

          {/* Section: Order Items Selection */}
          <div className="border border-stone-200 rounded-xl p-3 sm:p-4 bg-stone-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Items in Order ({items.length})
              </span>
              <span className="text-xs font-mono font-bold text-brand-maroon">
                Subtotal: {formatPrice(subtotalPaise)}
              </span>
            </div>

            {/* Existing Items List */}
            {items.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2 text-center">
                No items added yet. Select a jewellery piece from the catalog below.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={`${it.productId}-${idx}`}
                    className="flex items-center justify-between p-2.5 bg-white border border-stone-200 rounded-lg text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-stone-900">{it.productName}</p>
                      <p className="text-[11px] text-stone-500 font-mono">
                        {it.productSku ? `SKU: ${it.productSku} • ` : ''}
                        {formatPrice(it.unitPricePaise)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity input */}
                      <div className="flex items-center border border-stone-300 rounded-md bg-stone-50">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, it.quantity - 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-stone-800">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, it.quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="font-mono font-bold text-stone-900 w-16 text-right">
                        {formatPrice(calculateLineTotalPaise(it.quantity, it.unitPricePaise))}
                      </span>

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-stone-400 hover:text-red-500 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Item From Catalog Selector */}
            {products.length > 0 && (
              <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price_paise)}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItemFromCatalog}
                  className="flex items-center justify-center gap-1.5 text-xs border-stone-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add from Catalog</span>
                </Button>
              </div>
            )}

            {/* Custom Item Accordion / Input */}
            <div className="pt-2 text-[11px] text-stone-600 border-t border-dashed border-stone-200">
              <span className="font-semibold block mb-1.5">Or add custom custom-made jewellery piece:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Custom Item Name"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={customProductPrice || ''}
                  onChange={(e) => setCustomProductPrice(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-md text-xs font-semibold"
                >
                  + Add Custom
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Discounts, Shipping & Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Shipping Fee (₹)</span>
                {subtotalPaise >= 99900 && !shippingOverridden && (
                  <span className="text-[10px] text-emerald-600 font-bold">Auto Free</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                value={shippingRupees}
                onChange={(e) => {
                  setShippingRupees(Math.max(0, Number(e.target.value)));
                  setShippingOverridden(true);
                }}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Grand Total (Calculated)
              </label>
              <div className="px-3 py-2 text-sm font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                {formatPrice(totalPaise)}
              </div>
            </div>
          </div>

          {/* Row 4: Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              >
                <option value="GPay / UPI">GPay / Google Pay (UPI)</option>
                <option value="PhonePe / UPI">PhonePe (UPI)</option>
                <option value="Paytm / UPI">Paytm (UPI)</option>
                <option value="Bank NEFT / IMPS">Bank NEFT / IMPS Transfer</option>
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                <option value="Cash (In-Boutique)">Cash (In-Boutique Pickup)</option>
                <option value="Pending Payment">Pending Customer Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payment UTR / Reference ID
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. UPI 428910293812"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 font-mono"
              />
            </div>
          </div>

          {/* Row 5: Optional Order Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Internal Concierge Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer requested red velvet gift box packaging"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-stone-300 text-stone-700"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-stone-800">
                Final: {formatPrice(totalPaise)}
              </span>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || items.length === 0}
                className="flex items-center gap-2 px-5"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Order to Records</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
