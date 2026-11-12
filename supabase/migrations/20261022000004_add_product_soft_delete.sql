-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — ADD PRODUCT SOFT DELETE & RECOVERABILITY
-- Migration: 20261022000004_add_product_soft_delete.sql
-- ============================================================================

-- 1. ADD SOFT DELETE COLUMN
-- Using deleted_at TIMESTAMPTZ; NULL indicates an active product.
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. CREATE PERFORMANCE INDEXES
-- Index for soft-deleted lookups (Admin trash page)
CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
  ON public.products(deleted_at);

-- Partial index for active published products (Public Storefront)
CREATE INDEX IF NOT EXISTS idx_products_active_published 
  ON public.products(is_published, deleted_at) 
  WHERE deleted_at IS NULL;

-- Index on stock quantity for Out-of-Stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity 
  ON public.products(stock_quantity);

-- 3. UPDATE ROW-LEVEL SECURITY (RLS) POLICIES ON PRODUCTS
-- Public visitors (anon, authenticated customers) can only read published and non-deleted products.
-- Verified admins (public.is_admin()) can read all products including deleted and draft items.
DROP POLICY IF EXISTS "products_select_public_or_admin" ON public.products;

CREATE POLICY "products_select_public_or_admin"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_published = true AND deleted_at IS NULL)
    OR public.is_admin(auth.uid())
  );

-- Note: Existing admin-only INSERT, UPDATE, and DELETE policies remain active:
-- - products_insert_admin_only allows admins to add new products.
-- - products_update_admin_only allows admins to soft-delete (set deleted_at), restore (nullify deleted_at), and restock.
-- - products_delete_admin_only allows admins to permanently delete items.

-- 4. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
