import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

interface WishlistState {
  items: string[]; // product IDs
  isLoading: boolean;

  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      toggleItem: (productId: string) => {
        const { items } = get();
        if (items.includes(productId)) {
          set({ items: items.filter((id) => id !== productId) });
          toast.success('Piece removed from saved collection');
        } else {
          set({ items: [...items, productId] });
          toast.success('Piece added to saved collection');
        }
      },

      hasItem: (productId: string) => {
        return get().items.includes(productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'ssc-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
