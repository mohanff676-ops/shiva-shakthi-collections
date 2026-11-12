import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Heart } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useWishlistStore } from '@/store/wishlistStore';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PREVIEW_PRODUCTS, getVisiblePreviewProducts } from '@/data/previewProducts';

export default function Wishlist() {
  const { items: wishlistIds } = useWishlistStore();

  const products = useMemo(() => {
    if (wishlistIds.length === 0) return [];
    return getVisiblePreviewProducts().filter((p) => wishlistIds.includes(p.id));
  }, [wishlistIds]);

  return (
    <>
      <Helmet>
        <title>My Wishlist — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: 'Wishlist' }]} />

        <div className="mb-8 mt-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#F7F5F0]">
            My Saved Pieces
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'} saved in your private collection
          </p>
        </div>

        {wishlistIds.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-8 h-8 text-brand-champagne" />}
            title="Your wishlist is empty"
            description="Explore our jewellery collections and click the heart icon on any piece to save it here."
            actionLabel="Discover Jewellery"
            actionTo="/shop"
          />
        ) : (
          <ProductGrid products={products} isLoading={false} />
        )}
      </div>
    </>
  );
}
