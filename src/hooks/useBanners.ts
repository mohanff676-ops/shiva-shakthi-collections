import { useQuery } from '@tanstack/react-query';
import type { Banner } from '@/types';

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Exquisite Heritage Craftsmanship',
    subtitle: '1-Gram Micro Gold Plated Jewellery with Timeless Royalty',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
    link_url: '/shop',
    is_active: true,
    sort_order: 1,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'banner-2',
    title: 'New Bridal & Festive Arrivals',
    subtitle: 'Hand-set Kemp, Ruby & Emerald stones with matching earrings',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
    link_url: '/shop?filter=new-arrivals',
    is_active: true,
    sort_order: 2,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
];

export function useBanners() {
  return useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => DEFAULT_BANNERS,
    staleTime: Infinity,
  });
}
