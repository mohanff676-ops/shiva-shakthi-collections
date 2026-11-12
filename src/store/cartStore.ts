import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant, CartItemLocal } from '@/types';

interface CartState {
  items: CartItemLocal[];
  isOpen: boolean;
  couponCode: string | null;
  discountPaise: number;

  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setCoupon: (code: string | null, discountPaise: number) => void;

  getSubtotalPaise: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string, variantId: string | null) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      discountPaise: 0,

      addItem: (product, variant = null, quantity = 1) => {
        const maxQty = variant ? variant.stock_quantity : product.stock_quantity;
        if (maxQty <= 0) {
          return;
        }

        const { items } = get();
        const variantId = variant?.id ?? null;

        const existingIndex = items.findIndex(
          (item) => item.productId === product.id && item.variantId === variantId
        );

        if (existingIndex >= 0) {
          const updated = [...items];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: Math.min(updated[existingIndex].quantity + quantity, maxQty),
            product,
            variant,
          };
          set({ items: updated, isOpen: true });
        } else {
          set({
            items: [
              ...items,
              { productId: product.id, variantId, quantity: Math.min(quantity, maxQty), product, variant },
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        });
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        const updated = get().items.map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            const maxQty = item.variant
              ? item.variant.stock_quantity
              : item.product.stock_quantity;
            return { ...item, quantity: Math.min(quantity, maxQty) };
          }
          return item;
        });

        set({ items: updated });
      },

      clearCart: () => set({ items: [], couponCode: null, discountPaise: 0 }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCoupon: (code, discountPaise) => set({ couponCode: code, discountPaise }),

      getSubtotalPaise: () => {
        return get().items.reduce((sum, item) => {
          const basePrice = item.product.price_paise;
          const adjustment = item.variant?.price_adjustment_paise ?? 0;
          return sum + (basePrice + adjustment) * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getItemQuantity: (productId, variantId) => {
        const item = get().items.find(
          (i) => i.productId === productId && i.variantId === variantId
        );
        return item?.quantity ?? 0;
      },
    }),
    {
      name: 'ssc-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountPaise: state.discountPaise,
      }),
    }
  )
);
