-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — SUPABASE PRODUCTION DATABASE SCHEMA & RLS
-- Migration: 20261021000001_initial_schema_and_rls.sql
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER: UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. TABLE: PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. TABLE: USER_ROLES (Role-Based Access Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ----------------------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER: IS_ADMIN()
-- Prevents recursive RLS policies and executes with locked search_path
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(lookup_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = lookup_user_id
      AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 6. AUTOMATIC NEW USER HANDLER (Supabase Auth Hook)
-- Automatically inserts a profile row and 'customer' role on user registration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role assignment is strictly 'customer'
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'customer', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users (runs after successful user creation in Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. TABLE: PRODUCTS (Jewellery Catalogue)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id TEXT,
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  compare_at_price_paise BIGINT CHECK (compare_at_price_paise >= 0),
  sku TEXT UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  weight_grams NUMERIC(8,2),
  material TEXT,
  tags TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. TABLE: ORDERS & ORDER_ITEMS (Saved WhatsApp Order Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inquiry_pending' CHECK (status IN ('inquiry_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  shipping_paise BIGINT NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_paise BIGINT NOT NULL CHECK (line_total_paise >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES — STRICTLY MANDATORY
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLICIES: PROFILES
-- ----------------------------------------------------------------------------
-- 1. Users can read their own profile; admins can read all profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 2. Users can update only their own profile; admins can update any profile
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- 3. Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- POLICIES: USER_ROLES
-- ----------------------------------------------------------------------------
-- 1. Users can view only their own role to check permissions; admins can view all roles
CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. ONLY verified admins can insert, update, or delete roles. Customers CANNOT.
CREATE POLICY "user_roles_insert_admin_only"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_update_admin_only"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_delete_admin_only"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- POLICIES: PRODUCTS
-- ----------------------------------------------------------------------------
-- 1. Public visitors can view published products; admins can view all products
CREATE POLICY "products_select_public_or_admin"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_admin(auth.uid()));

-- 2. ONLY verified admins can insert products
CREATE POLICY "products_insert_admin_only"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. ONLY verified admins can update products
CREATE POLICY "products_update_admin_only"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. ONLY verified admins can delete products
CREATE POLICY "products_delete_admin_only"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- POLICIES: ORDERS
-- ----------------------------------------------------------------------------
-- 1. Customers can select only their own orders; admins can view all orders
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. Authenticated users can insert their own orders
CREATE POLICY "orders_insert_authenticated"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Admins only can update order statuses (e.g. mark processing, shipped)
CREATE POLICY "orders_update_admin_only"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- POLICIES: ORDER_ITEMS
-- ----------------------------------------------------------------------------
-- 1. Users can select order items only for their own orders; admins can view all
CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- 2. Authenticated users can insert items for their own orders
CREATE POLICY "order_items_insert_own_order"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );
