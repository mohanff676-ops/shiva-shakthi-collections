import type { Product } from '@/types';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';

/**
 * ============================================================================
 * SHIVA SHAKTHI COLLECTIONS — LOCAL PRODUCT CATALOG
 * ============================================================================
 *
 * HOW TO EDIT OR ADD PRODUCTS:
 * 1. Price Format:
 *    - Prices are stored in paise (100 paise = ₹1 INR).
 *    - You can use the `inRupees(amount)` helper below:
 *      e.g., `price_paise: inRupees(3499)` is equivalent to `349900` (₹3,499).
 * 2. Editing Titles, Stock & Descriptions:
 *    - Update `name`, `short_description`, and `description` directly below.
 *    - To adjust inventory, edit `stock_quantity`.
 * 3. Categorization:
 *    - Use `getCategory('slug')` where slug is one of:
 *      'necklaces', 'earrings', 'bangles', 'rings', 'chains', 'bracelets',
 *      'bridal-jewellery', 'traditional-jewellery', 'daily-wear-jewellery'.
 * 4. All 13 authentic jewelry photos are stored in `/public/imported-images/`.
 * ============================================================================
 */

export function inRupees(rupees: number): number {
  return Math.round(rupees * 100);
}

function getCategory(slug: string) {
  return DEFAULT_CATEGORIES.find((c) => c.slug === slug);
}

export const PREVIEW_SOFT_DELETED_KEY = 'ssc_soft_deleted_preview';
export const PREVIEW_PERM_DELETED_KEY = 'ssc_perm_deleted_preview_ids';
export const PREVIEW_RESTOCKED_KEY = 'ssc_preview_custom_stock';
export const PREVIEW_EDITED_KEY = 'ssc_preview_edited_products';

export function getPreviewEditedProductsMap(): Record<string, Partial<Product>> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREVIEW_EDITED_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePreviewEditedProduct(product: Product) {
  try {
    const map = getPreviewEditedProductsMap();
    map[product.id] = product;
    if (product.slug) {
      map[product.slug] = product;
    }
    localStorage.setItem(PREVIEW_EDITED_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[previewProducts] Failed to save preview edit:', err);
  }
}

export function getSoftDeletedPreviewMap(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREVIEW_SOFT_DELETED_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getPermDeletedPreviewIds(): string[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREVIEW_PERM_DELETED_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPreviewStockOverrides(): Record<string, number> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREVIEW_RESTOCKED_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setPreviewStockOverride(id: string, stock: number) {
  try {
    const current = getPreviewStockOverrides();
    current[id] = stock;
    localStorage.setItem(PREVIEW_RESTOCKED_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[previewProducts] Failed to save stock override:', err);
  }
}

export function softDeletePreviewId(id: string) {
  try {
    const map = getSoftDeletedPreviewMap();
    map[id] = new Date().toISOString();
    localStorage.setItem(PREVIEW_SOFT_DELETED_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[previewProducts] Failed to soft-delete preview item:', err);
  }
}

export function restorePreviewId(id: string) {
  try {
    const map = getSoftDeletedPreviewMap();
    delete map[id];
    localStorage.setItem(PREVIEW_SOFT_DELETED_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[previewProducts] Failed to restore preview item:', err);
  }
}

export function permanentDeletePreviewId(id: string) {
  try {
    // 1. Remove from soft-deleted map
    restorePreviewId(id);
    // 2. Add to permanently deleted list
    const perm = getPermDeletedPreviewIds();
    if (!perm.includes(id)) {
      perm.push(id);
      localStorage.setItem(PREVIEW_PERM_DELETED_KEY, JSON.stringify(perm));
    }
  } catch (err) {
    console.warn('[previewProducts] Failed to permanently delete preview item:', err);
  }
}

export function getDeletedPreviewIds(): string[] {
  const softMap = getSoftDeletedPreviewMap();
  const perm = getPermDeletedPreviewIds();
  return [...Object.keys(softMap), ...perm];
}

export function addDeletedPreviewId(id: string) {
  softDeletePreviewId(id);
}

export function getSoftDeletedPreviewProducts(): Product[] {
  const softMap = getSoftDeletedPreviewMap();
  const perm = getPermDeletedPreviewIds();
  const stockOverrides = getPreviewStockOverrides();

  return PREVIEW_PRODUCTS.filter((p) => Boolean(softMap[p.id]) && !perm.includes(p.id)).map((p) => ({
    ...p,
    deleted_at: softMap[p.id],
    stock_quantity: stockOverrides[p.id] ?? p.stock_quantity,
  }));
}

export function getVisiblePreviewProducts(): Product[] {
  const softMap = getSoftDeletedPreviewMap();
  const perm = getPermDeletedPreviewIds();
  const stockOverrides = getPreviewStockOverrides();
  const editedMap = getPreviewEditedProductsMap();

  return PREVIEW_PRODUCTS.filter(
    (p) => !softMap[p.id] && !perm.includes(p.id) && !softMap[p.slug] && !perm.includes(p.slug)
  ).map((p) => {
    const edited = editedMap[p.id] || (p.slug ? editedMap[p.slug] : undefined) || {};
    return {
      ...p,
      ...edited,
      stock_quantity: stockOverrides[p.id] ?? (edited.stock_quantity ?? p.stock_quantity),
    };
  });
}

/**
 * 13 authentic jewellery preview products using the images in public/imported-images/
 * All items are clearly identified as temporary preview placeholders.
 */
export const PREVIEW_PRODUCTS: Product[] = [
  {
    id: 'ssc-preview-01',
    name: 'Twin Ruby & Sapphire Royal Necklace Set (Catalogue Preview)',
    slug: 'twin-ruby-sapphire-royal-necklace-set',
    description:
      'Authentic one-gram micro-gold plated twin necklace collection featuring hand-set ruby and sapphire teardrop stones with matching designer earrings. Displayed in the Shiva Shakthi Collections signature royal showcase.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Royal one-gram gold twin necklace set with ruby and sapphire drop stones and matching earrings. [Catalogue Preview]',
    category_id: 'cat-2',
    category: getCategory('necklaces'),
    price_paise: 349900, // ₹3,499 (placeholder)
    compare_at_price_paise: 499900,
    cost_price_paise: 200000,
    sku: 'SSC-PREV-01',
    stock_quantity: 10,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: true,
    weight_grams: 48,
    material: 'One Gram Micro Gold Plated Brass Alloy with Ruby & Sapphire CZ',
    tags: ['necklace', 'ruby', 'sapphire', 'bridal', 'preview'],
    meta_title: 'Twin Ruby & Sapphire Royal Necklace Set — Shiva Shakthi Collections',
    meta_description:
      'Royal handcrafted one-gram gold twin necklace set with sparkling teardrop stones. Catalogue preview piece.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-01',
        product_id: 'ssc-preview-01',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
        alt_text: 'Twin Ruby & Sapphire Royal Necklace Set',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
    variants: [
      {
        id: 'var-01-ruby',
        product_id: 'ssc-preview-01',
        name: 'Gem Color',
        value: 'Ruby Red',
        price_adjustment_paise: 0,
        stock_quantity: 5,
        sku: 'SSC-PREV-01-RUBY',
        created_at: '2026-10-21T10:00:00Z',
      },
      {
        id: 'var-01-sapphire',
        product_id: 'ssc-preview-01',
        name: 'Gem Color',
        value: 'Sapphire Blue',
        price_adjustment_paise: 0,
        stock_quantity: 5,
        sku: 'SSC-PREV-01-BLUE',
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-02',
    name: 'Bridal Goddess Lakshmi Temple Jada Billa (Catalogue Preview)',
    slug: 'bridal-goddess-lakshmi-temple-jada-billa',
    description:
      'Intricate South Indian bridal hair ornament (Veni / Jada Billa) adorned with seated Goddess Lakshmi carving, ruby and emerald accents, and three hanging pearl-drop jhumkis.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'South Indian bridal temple hair ornament with Goddess Lakshmi and pearl jhumkis. [Catalogue Preview]',
    category_id: 'cat-7',
    category: getCategory('bridal-jewellery'),
    price_paise: 229900, // ₹2,299 (placeholder)
    compare_at_price_paise: 319900,
    cost_price_paise: 130000,
    sku: 'SSC-PREV-02',
    stock_quantity: 8,
    low_stock_threshold: 2,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 35,
    material: '22K Matte Gold Finish Alloy with Pearls & Temple Stones',
    tags: ['hair-accessory', 'jada-billa', 'temple', 'bridal', 'preview'],
    meta_title: 'Bridal Goddess Lakshmi Temple Jada Billa — Shiva Shakthi Collections',
    meta_description:
      'Authentic South Indian temple bridal hair accessory with Goddess Lakshmi motif.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-02',
        product_id: 'ssc-preview-02',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
        alt_text: 'Bridal Goddess Lakshmi Temple Jada Billa Hair Ornament',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-03',
    name: 'Dual Lotus Bypass CZ & Ruby Finger Ring (Catalogue Preview)',
    slug: 'dual-lotus-bypass-cz-ruby-finger-ring',
    description:
      'Adjustable free-size bypass finger ring designed with dual blooming lotus motifs, pave-set cubic zirconia crystals, and rich pinkish-ruby stone inlays.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Free size adjustable ring with dual ruby lotus flowers and sparkling pave CZ. [Catalogue Preview]',
    category_id: 'cat-4',
    category: getCategory('rings'),
    price_paise: 79900, // ₹799 (placeholder)
    compare_at_price_paise: 119900,
    cost_price_paise: 40000,
    sku: 'SSC-PREV-03',
    stock_quantity: 15,
    low_stock_threshold: 4,
    is_published: true,
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: true,
    weight_grams: 8,
    material: 'High-Polish Rose Gold & Yellow Gold Plated Brass, Free Size',
    tags: ['ring', 'lotus', 'ruby', 'free-size', 'preview'],
    meta_title: 'Dual Lotus Free Size Finger Ring — Shiva Shakthi Collections',
    meta_description: 'Adjustable dual lotus finger ring with ruby crystals and sparkling stones.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-03',
        product_id: 'ssc-preview-03',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (2).jpeg',
        alt_text: 'Dual Lotus Finger Ring Free Size',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-04',
    name: 'Mandala & Crescent Mehendi Statement Rings (Catalogue Preview)',
    slug: 'mandala-crescent-mehendi-statement-rings',
    description:
      'Magnificent festive statement hand ornaments featuring a round floral mandala cocktail ring and a crescent moon ring with kundan stone detailing.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Statement bridal and festive cocktail rings paired for mehendi and sangeet occasions. [Catalogue Preview]',
    category_id: 'cat-4',
    category: getCategory('rings'),
    price_paise: 119900, // ₹1,199 (placeholder)
    compare_at_price_paise: 169900,
    cost_price_paise: 65000,
    sku: 'SSC-PREV-04',
    stock_quantity: 12,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: true,
    is_new_arrival: false,
    is_bestseller: false,
    weight_grams: 16,
    material: 'Gold Plated Alloy with Cubic Zirconia and Synthetic Emerald Center',
    tags: ['ring', 'mandala', 'crescent', 'bridal', 'preview'],
    meta_title: 'Mandala & Crescent Statement Rings — Shiva Shakthi Collections',
    meta_description: 'Festive statement rings for wedding and celebration outfits.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-04',
        product_id: 'ssc-preview-04',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM.jpeg',
        alt_text: 'Mandala & Crescent Mehendi Statement Rings',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-05',
    name: 'Temple Lakshmi Mangalsutra & Jhumki Set (Catalogue Preview)',
    slug: 'temple-lakshmi-mangalsutra-jhumki-set',
    description:
      'Sacred Goddess Lakshmi temple pendant strung on a two-strand authentic black bead chain, paired with matching Lakshmi bell jhumki earrings with hanging gold bead droplets.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Traditional temple Lakshmi mangalsutra with dual black bead chain and matching jhumkis. [Catalogue Preview]',
    category_id: 'cat-8',
    category: getCategory('traditional-jewellery'),
    price_paise: 289900, // ₹2,899 (placeholder)
    compare_at_price_paise: 389900,
    cost_price_paise: 160000,
    sku: 'SSC-PREV-05',
    stock_quantity: 10,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: true,
    is_new_arrival: false,
    is_bestseller: true,
    weight_grams: 42,
    material: 'Temple Antique Gold Polish Brass Alloy with High Quality Black Spinel Beads',
    tags: ['mangalsutra', 'temple', 'lakshmi', 'jhumki', 'traditional', 'preview'],
    meta_title: 'Temple Lakshmi Mangalsutra & Jhumki Set — Shiva Shakthi Collections',
    meta_description: 'Sacred temple jewellery mangalsutra with Goddess Lakshmi centerpiece.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-05',
        product_id: 'ssc-preview-05',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM (1).jpeg',
        alt_text: 'Temple Lakshmi Mangalsutra & Jhumki Set',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-06',
    name: 'Lord Venkateswara Balaji Pearl Pendant & Chain (Catalogue Preview)',
    slug: 'lord-venkateswara-balaji-pearl-pendant-chain',
    description:
      'Devotional Tirupati Lord Balaji face pendant featuring an engraved Tilak namam in white enamel, ruby forehead gem, and natural south sea pearl drop accents on an interlocking gold link chain.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Devotional Tirupati Balaji pendant with white namam, ruby center, and pearl drops on gold chain. [Catalogue Preview]',
    category_id: 'cat-5',
    category: getCategory('chains'),
    price_paise: 159900, // ₹1,599 (placeholder)
    compare_at_price_paise: 219900,
    cost_price_paise: 90000,
    sku: 'SSC-PREV-06',
    stock_quantity: 20,
    low_stock_threshold: 5,
    is_published: true,
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 22,
    material: '24K Micro Gold Plated Brass, Enamel Namam, Cultured Pearls',
    tags: ['pendant', 'balaji', 'chain', 'devotional', 'pearl', 'preview'],
    meta_title: 'Lord Venkateswara Balaji Pearl Pendant — Shiva Shakthi Collections',
    meta_description: 'Devotional Lord Balaji pendant with gold chain and south sea pearl droplets.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-06',
        product_id: 'ssc-preview-06',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM.jpeg',
        alt_text: 'Lord Venkateswara Balaji Pearl Pendant with Chain',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-07',
    name: 'Emerald Floral CZ Adjustable Kada Bangle (Catalogue Preview)',
    slug: 'emerald-floral-cz-adjustable-kada-bangle',
    description:
      'Contemporary luxury kada bangle adorned with oval-cut emerald green gemstone accents, flower mandala centerpiece, and paved marquise American diamonds with side flexible mesh styling.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Adjustable luxury kada bangle featuring emerald gemstones and brilliant CZ floral center. [Catalogue Preview]',
    category_id: 'cat-3',
    category: getCategory('bangles'),
    price_paise: 189900, // ₹1,899 (placeholder)
    compare_at_price_paise: 259900,
    cost_price_paise: 105000,
    sku: 'SSC-PREV-07',
    stock_quantity: 14,
    low_stock_threshold: 4,
    is_published: true,
    is_featured: true,
    is_new_arrival: false,
    is_bestseller: false,
    weight_grams: 26,
    material: 'Micro Gold Plating with Simulated Emeralds and Swiss CZ Stones',
    tags: ['bangle', 'kada', 'emerald', 'cz', 'bracelet', 'preview'],
    meta_title: 'Emerald Floral CZ Adjustable Kada Bangle — Shiva Shakthi Collections',
    meta_description: 'Luxury adjustable kada bangle with rich emerald stones and diamond-like CZ.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-07',
        product_id: 'ssc-preview-07',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (1).jpeg',
        alt_text: 'Emerald Floral CZ Adjustable Kada Bangle',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-08',
    name: 'Antique Peacock Temple Jhumka Earrings (Catalogue Preview)',
    slug: 'antique-peacock-temple-jhumka-earrings',
    description:
      'Traditional heritage jhumkas featuring majestic peacocks perched on a filigree bell, studded with royal ruby and emerald stones, and finished with a hanging row of pearl droplets.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Antique gold temple peacock jhumkas studded with ruby, emerald, and dangling pearls. [Catalogue Preview]',
    category_id: 'cat-1',
    category: getCategory('earrings'),
    price_paise: 149900, // ₹1,499 (placeholder)
    compare_at_price_paise: 209900,
    cost_price_paise: 80000,
    sku: 'SSC-PREV-08',
    stock_quantity: 16,
    low_stock_threshold: 4,
    is_published: true,
    is_featured: false,
    is_new_arrival: false,
    is_bestseller: true,
    weight_grams: 28,
    material: 'Antique Matte Gold Polish Brass Alloy with Pearls and Kempu Stones',
    tags: ['earrings', 'jhumka', 'peacock', 'temple', 'traditional', 'preview'],
    meta_title: 'Antique Peacock Temple Jhumka Earrings — Shiva Shakthi Collections',
    meta_description: 'Heritage antique gold peacock jhumkas with ruby, emerald, and pearls.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-08',
        product_id: 'ssc-preview-08',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
        alt_text: 'Antique Peacock Temple Jhumka Earrings',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-09',
    name: 'Ruby Pink Floral CZ Adjustable Kada Bangle (Catalogue Preview)',
    slug: 'ruby-pink-floral-cz-adjustable-kada-bangle',
    description:
      'Exquisite adjustable kada bangle highlighting vivid ruby pink oval gemstones, diamond-cut floral centerpiece, and comfortable flexible wrist cuff styling.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Adjustable kada bangle with radiant ruby pink stones and brilliant floral CZ arrangement. [Catalogue Preview]',
    category_id: 'cat-3',
    category: getCategory('bangles'),
    price_paise: 189900, // ₹1,899 (placeholder)
    compare_at_price_paise: 259900,
    cost_price_paise: 105000,
    sku: 'SSC-PREV-09',
    stock_quantity: 14,
    low_stock_threshold: 4,
    is_published: true,
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 26,
    material: 'Micro Gold Plating with Simulated Rubies and Swiss CZ Stones',
    tags: ['bangle', 'kada', 'ruby', 'cz', 'bracelet', 'preview'],
    meta_title: 'Ruby Pink Floral CZ Adjustable Kada Bangle — Shiva Shakthi Collections',
    meta_description: 'Radiant kada bracelet featuring glowing ruby stones and pave CZ petals.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-09',
        product_id: 'ssc-preview-09',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM.jpeg',
        alt_text: 'Ruby Pink Floral CZ Adjustable Kada Bangle',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-10',
    name: 'Antique Floral Ruby Centerpiece Mangalsutra (Catalogue Preview)',
    slug: 'antique-floral-ruby-centerpiece-mangalsutra',
    description:
      'Graceful traditional mangalsutra with hand-engraved side floral clips, double-strand black beads, and an opulent arched pendant featuring a central ruby blossom with dangling black bead tassels.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Traditional antique gold mangalsutra with side floral clips and ruby arched pendant. [Catalogue Preview]',
    category_id: 'cat-9',
    category: getCategory('daily-wear-jewellery'),
    price_paise: 199900, // ₹1,999 (placeholder)
    compare_at_price_paise: 279900,
    cost_price_paise: 110000,
    sku: 'SSC-PREV-10',
    stock_quantity: 10,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: false,
    is_new_arrival: false,
    is_bestseller: true,
    weight_grams: 34,
    material: 'Antique Matte Micro Gold Finish with Black Spinel Beads and Ruby Gem',
    tags: ['mangalsutra', 'ruby', 'black-beads', 'traditional', 'preview'],
    meta_title: 'Antique Floral Ruby Mangalsutra — Shiva Shakthi Collections',
    meta_description: 'Antique finish traditional mangalsutra with ruby floral center pendant.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-10',
        product_id: 'ssc-preview-10',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM (1).jpeg',
        alt_text: 'Antique Floral Ruby Centerpiece Mangalsutra',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-11',
    name: 'Divine Lakshmi Green Bead Cluster Jhumkas (Catalogue Preview)',
    slug: 'divine-lakshmi-green-bead-cluster-jhumkas',
    description:
      'Devotional temple jhumkas featuring the blessed form of Goddess Lakshmi seated inside an ornate archway, flanked by emerald and ruby stones, with alternating white pearls and forest green hanging beads.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Auspicious Lakshmi temple jhumkas with emerald kempu stones, pearls, and green beads. [Catalogue Preview]',
    category_id: 'cat-1',
    category: getCategory('earrings'),
    price_paise: 139900, // ₹1,399 (placeholder)
    compare_at_price_paise: 199900,
    cost_price_paise: 75000,
    sku: 'SSC-PREV-11',
    stock_quantity: 18,
    low_stock_threshold: 4,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 24,
    material: 'Temple Matte Gold Polish with Natural Beads and Kempu Inlays',
    tags: ['earrings', 'jhumka', 'lakshmi', 'temple', 'green-beads', 'preview'],
    meta_title: 'Divine Lakshmi Green Bead Jhumkas — Shiva Shakthi Collections',
    meta_description: 'Temple earrings with Goddess Lakshmi icon, pearls, and green cluster droplets.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-11',
        product_id: 'ssc-preview-11',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
        alt_text: 'Divine Lakshmi Green Bead Cluster Jhumkas',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-12',
    name: 'American Diamond CZ Floral Drop Long Haram Necklace (Catalogue Preview)',
    slug: 'american-diamond-cz-floral-drop-long-haram-necklace',
    description:
      'Breathtaking bridal-grade American Diamond / Cubic Zirconia necklace crafted with continuous floral clusters leading to a triple medallion drop pendant. Perfect for weddings, receptions, and cocktail parties.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Royal American Diamond CZ long haram necklace with 3-tier floral pendant. [Catalogue Preview]',
    category_id: 'cat-2',
    category: getCategory('necklaces'),
    price_paise: 299900, // ₹2,999 (placeholder)
    compare_at_price_paise: 429900,
    cost_price_paise: 170000,
    sku: 'SSC-PREV-12',
    stock_quantity: 12,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: true,
    is_new_arrival: false,
    is_bestseller: true,
    weight_grams: 52,
    material: '18K Yellow Gold Finish Brass with AAA Grade Swiss Cubic Zirconia',
    tags: ['necklace', 'cz', 'american-diamond', 'haram', 'bridal', 'preview'],
    meta_title: 'American Diamond CZ Floral Drop Haram — Shiva Shakthi Collections',
    meta_description: 'Radiant long American Diamond necklace with cascading floral medallion pendant.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-12',
        product_id: 'ssc-preview-12',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
        alt_text: 'American Diamond CZ Floral Drop Long Haram Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'ssc-preview-13',
    name: 'Antique Floral Emerald Centerpiece Mangalsutra (Catalogue Preview)',
    slug: 'antique-floral-emerald-centerpiece-mangalsutra',
    description:
      'Classic temple style mangalsutra with dual black bead strings, sculpted floral gold spacers, and an elaborate centerpiece with emerald green cabochon and seed bead tassels.\n\n*Note: This is a clearly marked temporary preview placeholder. Exact pricing and live inventory will be confirmed upon catalog synchronization.*',
    short_description:
      'Traditional antique finish mangalsutra with emerald green centerpiece and black beads. [Catalogue Preview]',
    category_id: 'cat-8',
    category: getCategory('traditional-jewellery'),
    price_paise: 199900, // ₹1,999 (placeholder)
    compare_at_price_paise: 279900,
    cost_price_paise: 110000,
    sku: 'SSC-PREV-13',
    stock_quantity: 10,
    low_stock_threshold: 3,
    is_published: true,
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 34,
    material: 'Antique Matte Micro Gold Finish with Black Spinel Beads and Emerald Gem',
    tags: ['mangalsutra', 'emerald', 'black-beads', 'traditional', 'preview'],
    meta_title: 'Antique Floral Emerald Mangalsutra — Shiva Shakthi Collections',
    meta_description: 'Traditional South Indian antique mangalsutra with emerald cabochon stone.',
    created_at: '2026-10-21T10:00:00Z',
    updated_at: '2026-10-21T10:00:00Z',
    images: [
      {
        id: 'img-prev-13',
        product_id: 'ssc-preview-13',
        url: '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM.jpeg',
        alt_text: 'Antique Floral Emerald Centerpiece Mangalsutra',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-21T10:00:00Z',
      },
    ],
  },
];

/**
 * The 6 authentic jewellery pieces added from WhatsApp images
 */
export const SIX_NEW_JEWELLERY_PRODUCTS: Product[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Gold Green Pendant Black Beads Necklace',
    slug: 'gold-green-pendant-black-beads-necklace',
    description:
      'Elegant short black-bead chain featuring a handcrafted gold-tone centerpiece adorned with a luminous green gemstone and hanging pearl drops. Designed for auspicious daily wear and festive layering.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg.',
    short_description:
      'Delicate black-bead necklace with an ornate gold-tone green gemstone pendant and pearl drops.',
    category_id: 'cat-sbb',
    category: getCategory('short-black-beads'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 49900,
    cost_price_paise: 15000,
    sku: 'SSC-BB-01',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 22,
    material: 'One Gram Micro Gold Plated Alloy with Green Gemstone & Pearl Accents',
    tags: ['black-beads', 'green-pendant', 'necklace', 'short-black-beads', 'mangalsutra'],
    meta_title: 'Gold Green Pendant Black Beads Necklace — Shiva Shakthi Collections',
    meta_description:
      'Delicate black-bead necklace with an ornate gold-tone green gemstone pendant and pearl drops.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-01',
        product_id: 'b0000000-0000-0000-0000-000000000001',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg',
        alt_text: 'Gold Green Pendant Black Beads Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Lakshmi Pendant Black Beads Necklace',
    slug: 'lakshmi-pendant-black-beads-necklace',
    description:
      'Traditional black-bead chain centered with an auspicious Goddess Lakshmi temple motif in fine gold finish, enhanced with subtle green bead cluster accents. An eternal devotional classic for every pooja and celebration.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.37.54 AM.jpeg.',
    short_description:
      'Auspicious black-bead necklace with an engraved Goddess Lakshmi temple pendant and green bead drops.',
    category_id: 'cat-sbb',
    category: getCategory('short-black-beads'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 49900,
    cost_price_paise: 15000,
    sku: 'SSC-BB-02',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 24,
    material: 'One Gram Micro Gold Plated Alloy with Temple Lakshmi Motif & Green Beads',
    tags: ['black-beads', 'lakshmi', 'temple', 'necklace', 'short-black-beads'],
    meta_title: 'Lakshmi Pendant Black Beads Necklace — Shiva Shakthi Collections',
    meta_description:
      'Auspicious black-bead necklace with an engraved Goddess Lakshmi temple pendant and green bead drops.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-02',
        product_id: 'b0000000-0000-0000-0000-000000000002',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.37.54 AM.jpeg',
        alt_text: 'Lakshmi Pendant Black Beads Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Pink Beads Black Beads Necklace',
    slug: 'pink-beads-black-beads-necklace',
    description:
      'Delicately beaded black chain featuring a sculpted floral gold-tone pendant flanked by vibrant pink bead cluster drops. A graceful and lightweight design perfect for modern daily wear.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.25.46 AM.jpeg.',
    short_description:
      'Charming black-bead necklace with a floral gold-tone pendant and vibrant pink bead drops.',
    category_id: 'cat-sbb',
    category: getCategory('short-black-beads'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 49900,
    cost_price_paise: 15000,
    sku: 'SSC-BB-03',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 20,
    material: 'One Gram Micro Gold Plated Alloy with Pink Bead Cluster Drops',
    tags: ['black-beads', 'pink-beads', 'necklace', 'short-black-beads'],
    meta_title: 'Pink Beads Black Beads Necklace — Shiva Shakthi Collections',
    meta_description:
      'Charming black-bead necklace with a floral gold-tone pendant and vibrant pink bead drops.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-03',
        product_id: 'b0000000-0000-0000-0000-000000000003',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.25.46 AM.jpeg',
        alt_text: 'Pink Beads Black Beads Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    name: 'Long Layered Gold Chain Haram',
    slug: 'long-layered-gold-chain-haram',
    description:
      'Opulent long layered gold-tone haram featuring multi-strand textured chain links designed to drape majestically over sarees and festive lehengas. Offers an imposing royal aesthetic without excessive weight.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg.',
    short_description:
      'Grand multi-layer gold-tone chain haram with textured links for bridal and festive layering.',
    category_id: 'cat-lh',
    category: getCategory('long-harams'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 59900,
    cost_price_paise: 16000,
    sku: 'SSC-LH-01',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: true,
    weight_grams: 45,
    material: 'One Gram Micro Gold Plated Brass Multi-Strand Chain Links',
    tags: ['haram', 'long-haram', 'gold-chain', 'layered', 'bridal'],
    meta_title: 'Long Layered Gold Chain Haram — Shiva Shakthi Collections',
    meta_description:
      'Grand multi-layer gold-tone chain haram with textured links for bridal and festive layering.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-04',
        product_id: 'b0000000-0000-0000-0000-000000000004',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg',
        alt_text: 'Long Layered Gold Chain Haram',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    name: 'Multicolour Beads Pearl Necklace',
    slug: 'multicolour-beads-pearl-necklace',
    description:
      'Artfully crafted gold-tone link necklace adorned with a balanced pattern of multicoloured gemstone beads and radiant white pearls. A versatile festive accent that coordinates with any attire.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg.',
    short_description:
      'Vibrant gold-tone chain necklace interspersed with multicoloured beads and lustrous pearls.',
    category_id: 'cat-bc',
    category: getCategory('beads-chains'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 49900,
    cost_price_paise: 15000,
    sku: 'SSC-BC-01',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 28,
    material: 'One Gram Micro Gold Plated Alloy with Multicolour Beads & White Pearls',
    tags: ['beads-chain', 'multicolour', 'pearls', 'necklace', 'chains'],
    meta_title: 'Multicolour Beads Pearl Necklace — Shiva Shakthi Collections',
    meta_description:
      'Vibrant gold-tone chain necklace interspersed with multicoloured beads and lustrous pearls.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-05',
        product_id: 'b0000000-0000-0000-0000-000000000005',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg',
        alt_text: 'Multicolour Beads Pearl Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    name: 'Green Beads Pearl Necklace',
    slug: 'green-beads-pearl-necklace',
    description:
      'Fine gold-finish necklace strung with soothing pale green crystal beads and delicate white faux pearls. Designed for subtle royal grace, casual elegance, or layering with heavier choker sets.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.15.43 AM.jpeg.',
    short_description:
      'Serene gold-tone chain necklace adorned with pale green beads and luminous white pearls.',
    category_id: 'cat-bc',
    category: getCategory('beads-chains'),
    price_paise: 29900, // ₹299
    compare_at_price_paise: 49900,
    cost_price_paise: 15000,
    sku: 'SSC-BC-02',
    stock_quantity: 2,
    low_stock_threshold: 1,
    is_published: true,
    is_featured: true,
    is_new_arrival: true,
    is_bestseller: false,
    weight_grams: 26,
    material: 'One Gram Micro Gold Plated Alloy with Pale Green Beads & Luminous Pearls',
    tags: ['beads-chain', 'green-beads', 'pearls', 'necklace', 'chains'],
    meta_title: 'Green Beads Pearl Necklace — Shiva Shakthi Collections',
    meta_description:
      'Serene gold-tone chain necklace adorned with pale green beads and luminous white pearls.',
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
    images: [
      {
        id: 'img-new-06',
        product_id: 'b0000000-0000-0000-0000-000000000006',
        url: '/imported-images/WhatsApp Image 2026-10-22 at 11.15.43 AM.jpeg',
        alt_text: 'Green Beads Pearl Necklace',
        sort_order: 1,
        is_primary: true,
        created_at: '2026-10-22T10:00:00Z',
      },
    ],
  },
];

// Append six authentic pieces so PREVIEW_PRODUCTS always has all items
PREVIEW_PRODUCTS.push(...SIX_NEW_JEWELLERY_PRODUCTS);
