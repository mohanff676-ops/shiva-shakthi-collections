-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — ORDER DELETION RLS POLICIES
-- Migration: 20261022000003_allow_delete_orders.sql
-- ============================================================================

-- 1. POLICIES: ORDERS DELETION
-- Allows customers to delete ONLY their own orders (enforced by auth.uid() = user_id)
-- Allows admins to delete any order (enforced by public.is_admin(auth.uid()))
DROP POLICY IF EXISTS "orders_delete_own_or_admin" ON public.orders;
CREATE POLICY "orders_delete_own_or_admin"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. POLICIES: ORDER_ITEMS DELETION
-- Automatically protected through cascade, plus explicit policy for child records
DROP POLICY IF EXISTS "order_items_delete_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_delete_own_or_admin"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
