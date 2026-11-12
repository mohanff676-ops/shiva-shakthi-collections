import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-sbb',
    name: 'Short Black Beads',
    slug: 'short-black-beads',
    description: 'Traditional and designer short black beads & mangalsutras',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM (1).jpeg',
    is_active: true,
    sort_order: 1,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-3',
    name: 'Bangles',
    slug: 'bangles',
    description: 'Traditional & modern handcrafted bangles and kadas',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (1).jpeg',
    is_active: true,
    sort_order: 2,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-tc',
    name: 'Thali Chains',
    slug: 'thali-chains',
    description: 'Sacred wedding thali chains & devotional necklace chains',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM (1).jpeg',
    is_active: true,
    sort_order: 3,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-bc',
    name: 'Beads Chains',
    slug: 'beads-chains',
    description: 'Designer gemstone, crystal & pearl beaded chains',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
    is_active: true,
    sort_order: 4,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Necklace Sets',
    slug: 'necklace-sets',
    description: 'Royal bridal necklace sets with matching designer earrings',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
    is_active: true,
    sort_order: 5,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-lh',
    name: 'Long Harams',
    slug: 'long-harams',
    description: 'Opulent traditional and American Diamond long harams',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
    is_active: true,
    sort_order: 6,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-ha',
    name: 'Hair Accessories',
    slug: 'hair-accessories',
    description: 'Bridal jada billas, hair pins & traditional temple hair ornaments',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
    is_active: true,
    sort_order: 7,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-mt',
    name: 'Maatilu',
    slug: 'maatilu',
    description: 'Classic ear chain extensions and jhumka side attachments',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
    is_active: true,
    sort_order: 8,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-cs',
    name: 'Champaswaralu',
    slug: 'champaswaralu',
    description: 'Heritage bridal ear hangings and temple champasaralu ornaments',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
    is_active: true,
    sort_order: 9,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-6',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Fine charm bracelets and adjustable openable kadas',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM.jpeg',
    is_active: true,
    sort_order: 10,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-1',
    name: 'Earrings',
    slug: 'earrings',
    description: 'Exquisite handcrafted jhumkas, drops, and studs',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
    is_active: true,
    sort_order: 11,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-ch',
    name: 'Chandraharam',
    slug: 'chandraharam',
    description: 'Multi-strand royal crescent chandraharams',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
    is_active: true,
    sort_order: 12,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-4',
    name: 'Finger Rings',
    slug: 'finger-rings',
    description: 'Adjustable statement rings, dual lotus & peacock rings',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (2).jpeg',
    is_active: true,
    sort_order: 13,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-bh',
    name: 'Beads Haram',
    slug: 'beads-haram',
    description: 'Luxurious multi-layer beaded long harams with pendant centerpieces',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM.jpeg',
    is_active: true,
    sort_order: 14,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
  {
    id: 'cat-lbb',
    name: 'Long Black Beads',
    slug: 'long-black-beads',
    description: 'Grand auspicious long black beads harams and double-line mangalsutras',
    image_url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM.jpeg',
    is_active: true,
    sort_order: 15,
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
  },
];

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => DEFAULT_CATEGORIES,
    staleTime: Infinity,
  });
}

export function useCategory(slug: string) {
  return useQuery<Category | null>({
    queryKey: ['category', slug],
    queryFn: async () => {
      if (!slug) return null;
      return (
        DEFAULT_CATEGORIES.find(
          (c) =>
            c.slug === slug ||
            c.id === slug ||
            (slug === 'necklaces' && c.slug === 'necklace-sets') ||
            (slug === 'rings' && c.slug === 'finger-rings')
        ) || null
      );
    },
    enabled: Boolean(slug),
    staleTime: Infinity,
  });
}
