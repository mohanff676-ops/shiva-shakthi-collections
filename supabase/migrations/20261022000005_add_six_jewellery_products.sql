-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — ADD 6 AUTHENTIC JEWELLERY PRODUCTS
-- Migration: 20261022000005_add_six_jewellery_products.sql
-- Adds 6 new handcrafted pieces with authentic images, price ₹299, stock 2
-- ============================================================================

-- Ensure soft-delete support is active
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

INSERT INTO public.products (
  id,
  name,
  slug,
  short_description,
  description,
  category_id,
  price_paise,
  compare_at_price_paise,
  sku,
  stock_quantity,
  low_stock_threshold,
  is_published,
  is_featured,
  is_new_arrival,
  is_bestseller,
  weight_grams,
  material,
  tags,
  images
)
VALUES
  -- 1. Gold Green Pendant Black Beads Necklace
  (
    'b0000000-0000-0000-0000-000000000001',
    'Gold Green Pendant Black Beads Necklace',
    'gold-green-pendant-black-beads-necklace',
    'Delicate black-bead necklace with an ornate gold-tone green gemstone pendant and pearl drops.',
    'Elegant short black-bead chain featuring a handcrafted gold-tone centerpiece adorned with a luminous green gemstone and hanging pearl drops. Designed for auspicious daily wear and festive layering.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg.',
    'cat-sbb',
    29900,
    49900,
    'SSC-BB-01',
    2,
    1,
    true,
    true,
    true,
    false,
    22.00,
    'One Gram Micro Gold Plated Alloy with Green Gemstone & Pearl Accents',
    ARRAY['black-beads', 'green-pendant', 'necklace', 'short-black-beads', 'mangalsutra'],
    '[{"id":"img-new-01","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg","alt_text":"Gold Green Pendant Black Beads Necklace","sort_order":1,"is_primary":true}]'::jsonb
  ),

  -- 2. Lakshmi Pendant Black Beads Necklace
  (
    'b0000000-0000-0000-0000-000000000002',
    'Lakshmi Pendant Black Beads Necklace',
    'lakshmi-pendant-black-beads-necklace',
    'Auspicious black-bead necklace with an engraved Goddess Lakshmi temple pendant and green bead drops.',
    'Traditional black-bead chain centered with an auspicious Goddess Lakshmi temple motif in fine gold finish, enhanced with subtle green bead cluster accents. An eternal devotional classic for every pooja and celebration.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.37.54 AM.jpeg.',
    'cat-sbb',
    29900,
    49900,
    'SSC-BB-02',
    2,
    1,
    true,
    true,
    true,
    false,
    24.00,
    'One Gram Micro Gold Plated Alloy with Temple Lakshmi Motif & Green Beads',
    ARRAY['black-beads', 'lakshmi', 'temple', 'necklace', 'short-black-beads'],
    '[{"id":"img-new-02","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.37.54 AM.jpeg","alt_text":"Lakshmi Pendant Black Beads Necklace","sort_order":1,"is_primary":true}]'::jsonb
  ),

  -- 3. Pink Beads Black Beads Necklace
  (
    'b0000000-0000-0000-0000-000000000003',
    'Pink Beads Black Beads Necklace',
    'pink-beads-black-beads-necklace',
    'Charming black-bead necklace with a floral gold-tone pendant and vibrant pink bead drops.',
    'Delicately beaded black chain featuring a sculpted floral gold-tone pendant flanked by vibrant pink bead cluster drops. A graceful and lightweight design perfect for modern daily wear.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.25.46 AM.jpeg.',
    'cat-sbb',
    29900,
    49900,
    'SSC-BB-03',
    2,
    1,
    true,
    true,
    true,
    false,
    20.00,
    'One Gram Micro Gold Plated Alloy with Pink Bead Cluster Drops',
    ARRAY['black-beads', 'pink-beads', 'necklace', 'short-black-beads'],
    '[{"id":"img-new-03","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.25.46 AM.jpeg","alt_text":"Pink Beads Black Beads Necklace","sort_order":1,"is_primary":true}]'::jsonb
  ),

  -- 4. Long Layered Gold Chain Haram
  (
    'b0000000-0000-0000-0000-000000000004',
    'Long Layered Gold Chain Haram',
    'long-layered-gold-chain-haram',
    'Grand multi-layer gold-tone chain haram with textured links for bridal and festive layering.',
    'Opulent long layered gold-tone haram featuring multi-strand textured chain links designed to drape majestically over sarees and festive lehengas. Offers an imposing royal aesthetic without excessive weight.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg.',
    'cat-lh',
    29900,
    59900,
    'SSC-LH-01',
    2,
    1,
    true,
    true,
    true,
    true,
    45.00,
    'One Gram Micro Gold Plated Brass Multi-Strand Chain Links',
    ARRAY['haram', 'long-haram', 'gold-chain', 'layered', 'bridal'],
    '[{"id":"img-new-04","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg","alt_text":"Long Layered Gold Chain Haram","sort_order":1,"is_primary":true}]'::jsonb
  ),

  -- 5. Multicolour Beads Pearl Necklace
  (
    'b0000000-0000-0000-0000-000000000005',
    'Multicolour Beads Pearl Necklace',
    'multicolour-beads-pearl-necklace',
    'Vibrant gold-tone chain necklace interspersed with multicoloured beads and lustrous pearls.',
    'Artfully crafted gold-tone link necklace adorned with a balanced pattern of multicoloured gemstone beads and radiant white pearls. A versatile festive accent that coordinates with any attire.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg.',
    'cat-bc',
    29900,
    49900,
    'SSC-BC-01',
    2,
    1,
    true,
    true,
    true,
    false,
    28.00,
    'One Gram Micro Gold Plated Alloy with Multicolour Beads & White Pearls',
    ARRAY['beads-chain', 'multicolour', 'pearls', 'necklace', 'chains'],
    '[{"id":"img-new-05","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg","alt_text":"Multicolour Beads Pearl Necklace","sort_order":1,"is_primary":true}]'::jsonb
  ),

  -- 6. Green Beads Pearl Necklace
  (
    'b0000000-0000-0000-0000-000000000006',
    'Green Beads Pearl Necklace',
    'green-beads-pearl-necklace',
    'Serene gold-tone chain necklace adorned with pale green beads and luminous white pearls.',
    'Fine gold-finish necklace strung with soothing pale green crystal beads and delicate white faux pearls. Designed for subtle royal grace, casual elegance, or layering with heavier choker sets.\n\nMatching photo: WhatsApp Image 2026-10-22 at 11.15.43 AM.jpeg.',
    'cat-bc',
    29900,
    49900,
    'SSC-BC-02',
    2,
    1,
    true,
    true,
    true,
    false,
    26.00,
    'One Gram Micro Gold Plated Alloy with Pale Green Beads & Luminous Pearls',
    ARRAY['beads-chain', 'green-beads', 'pearls', 'necklace', 'chains'],
    '[{"id":"img-new-06","url":"/imported-images/WhatsApp Image 2026-10-22 at 11.15.43 AM.jpeg","alt_text":"Green Beads Pearl Necklace","sort_order":1,"is_primary":true}]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  price_paise = EXCLUDED.price_paise,
  compare_at_price_paise = EXCLUDED.compare_at_price_paise,
  sku = EXCLUDED.sku,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured,
  is_new_arrival = EXCLUDED.is_new_arrival,
  is_bestseller = EXCLUDED.is_bestseller,
  weight_grams = EXCLUDED.weight_grams,
  material = EXCLUDED.material,
  tags = EXCLUDED.tags,
  images = EXCLUDED.images,
  updated_at = timezone('utc'::text, now());
